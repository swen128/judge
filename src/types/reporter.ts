/**
 * Reporter interface definitions for output formatting
 */

import type { ResolvedConfig } from './config.js';
import type { RuleResult, CheckSummary } from './checker.js';

/**
 * Reporter interface for formatting check results
 */
export interface Reporter {
  /** Format check results into output string */
  report(results: CheckResults): string;
}

/**
 * Complete check results for reporting
 */
export interface CheckResults {
  /** Configuration used */
  config: ResolvedConfig;
  
  /** Results for each rule */
  rules: RuleResult[];
  
  /** Overall summary */
  summary: CheckSummary;
  
  /** Start timestamp */
  startTime: Date;
  
  /** End timestamp */
  endTime: Date;
}


/**
 * Stdout reporter options
 */
export interface StdoutReporterOptions {
  /** Use colors in output */
  useColors?: boolean;
  
  /** Show file paths */
  showFilePaths?: boolean;
  
  /** Show timing information */
  showTimings?: boolean;
  
  /** Verbose output */
  verbose?: boolean;
}

/**
 * JSON reporter output structure
 */
export interface JsonReportOutput {
  /** Report version */
  version: string;
  
  /** Timestamp */
  timestamp: string;
  
  /** Configuration summary */
  config: {
    provider: string;
    rulesCount: number;
  };
  
  /** Results */
  results: {
    rules: JsonRuleResult[];
    summary: JsonSummary;
  };
}

/**
 * JSON format for rule results
 */
export interface JsonRuleResult {
  /** Rule name */
  name: string;
  
  /** Rule description */
  description: string;
  
  /** Issues found */
  issues: JsonIssue[];
  
  /** Statistics */
  stats: {
    filesChecked: number;
    duration: number;
  };
  
  /** Error if any */
  error?: string;
}

/**
 * JSON format for issues
 */
export interface JsonIssue {
  /** Severity */
  severity: string;
  
  /** Message */
  message: string;
  
  /** Location */
  location?: {
    file: string;
    line?: number;
    column?: number;
  };
  
  /** Confidence score */
  confidence: number;
}

/**
 * JSON format for summary
 */
export interface JsonSummary {
  /** Total rules */
  totalRules: number;
  
  /** Total issues */
  totalIssues: number;
  
  /** Issues by severity */
  issuesBySeverity: Record<string, number>;
  
  /** Duration */
  duration: number;
  
  /** Pass/fail status */
  passed: boolean;
  
  /** Rules with errors */
  rulesWithErrors: number;
}