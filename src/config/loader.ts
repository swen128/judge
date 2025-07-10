import { readFile } from 'fs/promises';
import { load } from 'js-yaml';
import { ok, err, ResultAsync, Result } from 'neverthrow';
import { dirname, resolve } from 'path';
import type { JudgeConfig, JudgeError, ResolvedConfig, ResolvedRuleBinding } from '../types/index.js';
import { JudgeConfigSchema } from './schema.js';

export function loadConfig(configPath: string): ResultAsync<JudgeConfig, JudgeError> {
  return ResultAsync.fromPromise(
    readFile(configPath, 'utf-8'),
    (error): JudgeError => {
      // Handle file not found errors
      // We check the error string since we can't use 'in' operator or type assertions
      const errorString = String(error);
      if (errorString.includes('ENOENT')) {
        return {
          type: 'CONFIG_NOT_FOUND' as const,
          path: configPath,
        };
      }
      
      // Get error message
      const message = error instanceof Error ? error.message : 'Failed to read config file';
      return {
        type: 'CONFIG_INVALID' as const,
        path: configPath,
        reason: message,
      };
    }
  ).andThen(content => {
    // Parse YAML using Result.fromThrowable
    const parseYaml = Result.fromThrowable(
      load,
      (error): JudgeError => ({
        type: 'CONFIG_INVALID' as const,
        path: configPath,
        reason: error instanceof Error ? error.message : 'Invalid YAML syntax',
      })
    );
    
    return parseYaml(content).andThen(parsed => {
      // Validate with Zod schema
      const result = JudgeConfigSchema.safeParse(parsed);
      if (!result.success) {
        return err({
          type: 'CONFIG_INVALID' as const,
          path: configPath,
          reason: result.error.errors[0]?.message ?? 'Invalid configuration',
        });
      }
      
      return ok(result.data);
    });
  });
}

export function resolveConfig(config: JudgeConfig, configPath: string): ResolvedConfig {
  const configDir = dirname(configPath);
  
  return {
    version: config.version,
    provider: config.provider,
    timeout: config.timeout ?? 120000,
    cache_dir: config.cache_dir ?? '.judge-cache',
    fail_on_issues: config.fail_on_issues ?? true,
    max_concurrent_checks: config.max_concurrent_checks ?? 5,
    rule_bindings: config.rule_bindings.map(rb => resolveRuleBinding(rb, configDir)),
  };
}

function resolveRuleBinding(binding: JudgeConfig['rule_bindings'][0], configDir: string): ResolvedRuleBinding {
  return {
    name: binding.name,
    files: {
      include: binding.files.include,
      exclude: binding.files.exclude ?? [],
    },
    rules: binding.rules.map(rule => ({
      ...rule,
      path: isAbsolutePath(rule.path) || isUrl(rule.path) 
        ? rule.path 
        : resolve(configDir, rule.path),
      cache: rule.cache ?? true,
    })),
    fail_on: binding.fail_on ?? 'error',
    confidence_threshold: binding.confidence_threshold ?? 0.8,
  };
}

function isAbsolutePath(path: string): boolean {
  return path.startsWith('/') || /^[A-Za-z]:/.test(path);
}

function isUrl(path: string): boolean {
  return path.startsWith('http://') || path.startsWith('https://');
}