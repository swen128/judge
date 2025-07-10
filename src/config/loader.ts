import { readFile } from 'fs/promises';
import { load } from 'js-yaml';
import { Result, ok, err } from 'neverthrow';
import { dirname, resolve } from 'path';
import type { JudgeConfig, JudgeError, ResolvedConfig, ResolvedRuleBinding } from '../types/index.js';
import { JudgeConfigSchema } from './schema.js';

export async function loadConfig(configPath: string): Promise<Result<JudgeConfig, JudgeError>> {
  try {
    const content = await readFile(configPath, 'utf-8');
    const parsed = load(content);
    
    const result = JudgeConfigSchema.safeParse(parsed);
    if (!result.success) {
      return err({
        type: 'CONFIG_INVALID',
        path: configPath,
        reason: result.error.errors[0]?.message ?? 'Invalid configuration',
      });
    }
    
    return ok(result.data);
  } catch (error) {
    const nodeError = error as { code?: string };
    if (nodeError.code === 'ENOENT') {
      return err({
        type: 'CONFIG_NOT_FOUND',
        path: configPath,
      });
    }
    
    return err({
      type: 'CONFIG_INVALID',
      path: configPath,
      reason: (error as Error).message,
    });
  }
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