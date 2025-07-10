/**
 * Configuration type definitions
 */

import type { z } from 'zod';

/**
 * Main configuration schema
 */
export interface JudgeConfig {
  /** Configuration version */
  version: '1.0';
  
  /** AI provider to use */
  provider: 'claude' | 'gemini';
  
  /** Timeout for AI operations in seconds (default: 120) */
  timeout?: number;
  
  /** Directory for caching remote files (default: .judge-cache) */
  cache_dir?: string;
  
  /** Whether to exit with non-zero code on issues (default: true) */
  fail_on_issues?: boolean;
  
  /** Maximum concurrent checks (default: 5) */
  max_concurrent_checks?: number;
  
  /** Rule bindings defining spec-to-implementation mappings */
  rule_bindings: RuleBinding[];
}

/**
 * Rule binding configuration for matching rules to implementations
 */
export interface RuleBinding {
  /** Unique name for the binding */
  name: string;
  
  /** File patterns to include/exclude */
  files: FilePattern;
  
  /** Rules (specification files or URLs) */
  rules: Rule[];
  
  /** Severity level that causes failure */
  fail_on?: Severity;
  
  /** Minimum confidence threshold (0-1, default: 0.8) */
  confidence_threshold?: number;
}

/**
 * File pattern configuration
 */
export interface FilePattern {
  /** Glob patterns to include */
  include: string[];
  
  /** Glob patterns to exclude */
  exclude?: string[];
}

/**
 * Rule (specification file configuration)
 */
export interface Rule {
  /** Path to local file or URL */
  path: string;
  
  /** Whether to cache if remote (default: true) */
  cache?: boolean;
}

/**
 * Severity levels for issues
 */
export type Severity = 'error' | 'warning' | 'notice';

/**
 * Configuration with resolved defaults
 */
export interface ResolvedConfig extends Required<Omit<JudgeConfig, 'rule_bindings'>> {
  rule_bindings: ResolvedRuleBinding[];
}

/**
 * Rule binding with resolved defaults
 */
export interface ResolvedRuleBinding extends Required<Omit<RuleBinding, 'files'>> {
  files: Required<FilePattern>;
}

/**
 * CLI options
 */
export interface CliOptions {
  /** Path to config file */
  config?: string;
  
  /** Show help */
  help?: boolean;
  
  /** Show version */
  version?: boolean;
  
  /** Show resolved configuration */
  showConfig?: boolean;
  
  /** Initialize configuration */
  init?: boolean;
  
  /** Check only staged files */
  preCommit?: boolean;
  
  /** Reporter type */
  reporter?: 'stdout' | 'json';
  
  /** Files to check (if provided) */
  files?: string[];
}

/**
 * Zod schema type helper
 */
export type ConfigSchema = z.ZodType<JudgeConfig>;