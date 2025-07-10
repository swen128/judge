/**
 * Common type definitions used across the application
 */

import type { Severity } from './config.js';

/**
 * Issue found during semantic checking
 */
export interface Issue {
  /** Issue severity */
  severity: Severity;
  
  /** Issue message */
  message: string;
  
  /** File path (relative to working directory) */
  file?: string;
  
  /** Line number (1-based) */
  line?: number;
  
  /** Column number (1-based) */
  column?: number;
  
  /** Confidence score (0-1) */
  confidence: number;
  
  /** Rule that generated this issue */
  ruleName?: string;
}

// Result types are provided by neverthrow
// import { Result, Ok, Err } from 'neverthrow'

/**
 * Git status for files
 */
export interface GitStatus {
  /** Staged files */
  staged: string[];
  
  /** Modified files */
  modified: string[];
  
  /** Untracked files */
  untracked: string[];
  
  /** Deleted files */
  deleted: string[];
}

/**
 * Logger interface
 */
export interface Logger {
  /** Log debug message */
  debug(message: string, ...args: unknown[]): void;
  
  /** Log info message */
  info(message: string, ...args: unknown[]): void;
  
  /** Log warning message */
  warn(message: string, ...args: unknown[]): void;
  
  /** Log error message */
  error(message: string, ...args: unknown[]): void;
}

/**
 * Error types as discriminated union
 */
export type JudgeError =
  | { type: 'CONFIG_NOT_FOUND'; path: string }
  | { type: 'CONFIG_INVALID'; path: string; reason: string }
  | { type: 'PROVIDER_NOT_AVAILABLE'; provider: string }
  | { type: 'PROVIDER_ERROR'; provider: string; message: string }
  | { type: 'FILE_NOT_FOUND'; path: string }
  | { type: 'NETWORK_ERROR'; url: string; message: string }
  | { type: 'CACHE_ERROR'; operation: string; message: string }
  | { type: 'GIT_ERROR'; command: string; message: string }
  | { type: 'TIMEOUT'; operation: string; duration: number };