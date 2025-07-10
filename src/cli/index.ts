#!/usr/bin/env node

import { Command } from 'commander';
import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { loadConfig, resolveConfig } from '../config/loader.js';
import { createProvider } from '../providers/factory.js';
import { FileMatcherImpl } from '../processor/matcher.js';
import { getStagedFiles } from '../processor/git.js';
import { SemanticCheckerImpl } from '../checker/semantic.js';
import { createReporter } from '../reporters/factory.js';
import { initConfig } from './init.js';
import type { JudgeError } from '../types/index.js';

interface PackageJson {
  version: string;
}

interface CliOptions {
  config: string;
  reporter: string;
  preCommit?: boolean;
  showConfig?: boolean;
  init?: boolean;
}

const program = new Command();
const pkgContent = await readFile(new URL('../../package.json', import.meta.url), 'utf-8');
const pkg = JSON.parse(pkgContent) as PackageJson;

program
  .name('judge')
  .description('Semantic code checker that verifies implementations match specifications')
  .version(pkg.version)
  .option('-c, --config <path>', 'path to configuration file', 'judge.yaml')
  .option('-r, --reporter <type>', 'output reporter type', 'stdout')
  .option('--pre-commit', 'check only staged files')
  .option('--show-config', 'display resolved configuration')
  .option('--init', 'create a configuration file')
  .argument('[files...]', 'files to check')
  .action(async (files: string[], options: CliOptions) => {
    try {
      // Handle init
      if (options.init === true) {
        await initConfig(options.config !== 'judge.yaml' ? options.config : undefined);
        return;
      }

      // Load configuration
      const configPath = resolve(process.cwd(), options.config);
      const configResult = await loadConfig(configPath);
      
      if (configResult.isErr()) {
        handleError(configResult.error);
        process.exit(1);
      }

      const config = resolveConfig(configResult.value, configPath);

      // Handle show-config
      if (options.showConfig === true) {
        console.log(JSON.stringify(config, null, 2));
        return;
      }

      // Validate provider
      const provider = createProvider({
        type: config.provider,
        timeout: config.timeout,
      });

      try {
        await provider.validate();
      } catch (error) {
        console.error(`❌ ${(error as Error).message}`);
        process.exit(1);
      }

      // Get files to check
      const filesToCheck = await (async (): Promise<string[]> => {
        if (options.preCommit === true) {
          const stagedFiles = await getStagedFiles();
          if (stagedFiles.length === 0) {
            console.log('✅ No staged files to check');
            return [];
          }
          return stagedFiles;
        } else if (files.length > 0) {
          return files;
        } else {
          // Would need to implement full directory scanning
          console.error('❌ Please specify files to check or use --pre-commit');
          process.exit(1);
        }
      })();
      
      if (filesToCheck.length === 0) {
        return;
      }

      // Match files to rule bindings
      const matcher = new FileMatcherImpl(process.cwd());
      await matcher.initialize();
      
      const matchResult = matcher.match(filesToCheck, config.rule_bindings);
      
      // Filter bindings that have matched files
      const activeBindings = config.rule_bindings.filter(binding => {
        const matchedFiles = matchResult.ruleBindingFiles.get(binding.name);
        return matchedFiles !== undefined && matchedFiles.length > 0;
      });

      if (activeBindings.length === 0) {
        console.log('✅ No applicable rule bindings for the given files');
        return;
      }

      // Run semantic checks
      const checker = new SemanticCheckerImpl();
      const startTime = new Date();
      
      const result = await checker.check({
        files: filesToCheck,
        ruleBindings: activeBindings,
        provider,
        maxConcurrent: config.max_concurrent_checks,
        cacheDir: resolve(process.cwd(), config.cache_dir),
      });

      const endTime = new Date();

      // Report results
      const reporterType = options.reporter === 'json' ? 'json' : 'stdout';
      const reporter = createReporter(reporterType);
      const output = reporter.report({
        config,
        rules: result.ruleResults,
        summary: result.summary,
        startTime,
        endTime,
      });

      console.log(output);

      // Exit with appropriate code
      if (config.fail_on_issues && !result.summary.passed) {
        process.exit(1);
      }
    } catch (error) {
      console.error(`❌ Unexpected error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

program.parse();

function handleError(error: JudgeError): void {
  switch (error.type) {
    case 'CONFIG_NOT_FOUND':
      console.error(`❌ Configuration file not found: ${error.path}`);
      console.error('Run "judge --init" to create a configuration file');
      break;
    case 'CONFIG_INVALID':
      console.error(`❌ Invalid configuration at ${error.path}: ${error.reason}`);
      break;
    case 'PROVIDER_NOT_AVAILABLE':
      console.error(`❌ Provider not available: ${error.provider}`);
      break;
    case 'PROVIDER_ERROR':
      console.error(`❌ Provider error: ${error.message}`);
      break;
    case 'FILE_NOT_FOUND':
      console.error(`❌ File not found: ${error.path}`);
      break;
    case 'NETWORK_ERROR':
      console.error(`❌ Network error: ${error.message}`);
      break;
    case 'CACHE_ERROR':
      console.error(`❌ Cache error: ${error.message}`);
      break;
    case 'GIT_ERROR':
      console.error(`❌ Git error: ${error.message}`);
      break;
    case 'TIMEOUT':
      console.error(`❌ Operation timed out after ${error.duration}ms`);
      break;
    default: {
      // This should never happen
      console.error(`❌ Unknown error type`);
    }
  }
}