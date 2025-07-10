/**
 * Checker type definitions for semantic analysis
 */

import type { ResolvedRuleBinding } from './config.js';
import type { Issue } from './common.js';
import type { Provider } from './provider.js';

/**
 * Semantic checker interface
 */
export interface SemanticChecker {
  /** Check files against rules */
  check(request: SemanticCheckRequest): Promise<SemanticCheckResult>;
}

/**
 * Request for semantic checking
 */
export interface SemanticCheckRequest {
  /** Files to check */
  files: string[];
  
  /** Rule bindings to apply */
  ruleBindings: ResolvedRuleBinding[];
  
  /** AI provider to use */
  provider: Provider;
  
  /** Maximum concurrent checks */
  maxConcurrent: number;
  
  /** Cache directory for remote files */
  cacheDir: string;
}

/**
 * Result of semantic checking
 */
export interface SemanticCheckResult {
  /** Results for each rule */
  ruleResults: RuleResult[];
  
  /** Overall summary */
  summary: CheckSummary;
}

/**
 * Result for a single rule binding
 */
export interface RuleResult {
  /** Rule binding that was checked */
  ruleBinding: ResolvedRuleBinding;
  
  /** Issues found */
  issues: Issue[];
  
  /** Duration in milliseconds */
  duration: number;
  
  /** Number of files checked */
  filesChecked: number;
  
  /** Files that were checked */
  checkedFiles: string[];
  
  /** Error if rule binding check failed */
  error?: string;
}

/**
 * Summary of all checks
 */
export interface CheckSummary {
  /** Total number of rules checked */
  totalRules: number;
  
  /** Total number of issues found */
  totalIssues: number;
  
  /** Issues grouped by severity */
  issuesBySeverity: Record<string, number>;
  
  /** Total duration in milliseconds */
  duration: number;
  
  /** Whether all checks passed */
  passed: boolean;
  
  /** Number of rules that had errors */
  rulesWithErrors: number;
}

/**
 * File matcher interface
 */
export interface FileMatcher {
  /** Match files against rule bindings */
  match(files: string[], ruleBindings: ResolvedRuleBinding[]): MatchResult;
  
  /** Get all files matching a rule binding */
  getFilesForRuleBinding(ruleBinding: ResolvedRuleBinding): string[];
  
  /** Get all rule bindings matching a file */
  getRuleBindingsForFile(file: string): ResolvedRuleBinding[];
}

/**
 * Result of file matching
 */
export interface MatchResult {
  /** Map of rule binding name to matched files */
  ruleBindingFiles: Map<string, string[]>;
  
  /** Map of file to matching rule bindings */
  fileRuleBindings: Map<string, ResolvedRuleBinding[]>;
  
  /** Files that didn't match any rule */
  unmatchedFiles: string[];
  
  /** Files that were ignored */
  ignoredFiles: string[];
}

/**
 * Cache interface for remote files
 */
export interface RemoteCache {
  /** Get cached content */
  get(url: string): Promise<CachedContent | null>;
  
  /** Store content in cache */
  set(url: string, content: string, headers: Record<string, string>): Promise<void>;
  
  /** Check if cache is valid based on headers */
  isValid(url: string, headers: Record<string, string>): Promise<boolean>;
  
  /** Clear cache */
  clear(): Promise<void>;
}

/**
 * Cached content with metadata
 */
export interface CachedContent {
  /** Cached content */
  content: string;
  
  /** When cached */
  timestamp: Date;
  
  /** HTTP headers from original response */
  headers: Record<string, string>;
  
  /** Content hash */
  hash: string;
}