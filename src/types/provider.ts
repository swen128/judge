/**
 * Provider interface definitions for AI tool integration
 */

import type { Issue } from './common.js';

/**
 * AI provider interface
 */
export interface Provider {
  /** Provider name */
  readonly name: string;
  
  /** Check if the provider is available */
  validate(): Promise<void>;
  
  /** Perform semantic check */
  check(request: CheckRequest): Promise<CheckResponse>;
}

/**
 * Request to check semantic compliance
 */
export interface CheckRequest {
  /** Rule file content */
  rule: RuleContent;
  
  /** Implementation file contents */
  implementations: FileContent[];
  
  /** Timeout in milliseconds */
  timeout?: number;
}

/**
 * Response from semantic check
 */
export interface CheckResponse {
  /** Issues found */
  issues: Issue[];
  
  /** Metadata about the check */
  metadata: CheckMetadata;
}

/**
 * Metadata about a check operation
 */
export interface CheckMetadata {
  /** Model used */
  model: string;
  
  /** Duration in milliseconds */
  duration: number;
  
  /** Provider-specific metadata */
  extra?: Record<string, unknown>;
}

/**
 * File content with metadata
 */
export interface FileContent {
  /** File path relative to working directory */
  path: string;
  
  /** File content */
  content: string;
  
  /** Language/file type */
  language?: string;
}

/**
 * Rule content (can be from file or URL)
 */
export interface RuleContent extends FileContent {
  /** Source URL if fetched remotely */
  sourceUrl?: string;
}

/**
 * Provider configuration
 */
export interface ProviderConfig {
  /** Provider type */
  type: 'claude' | 'gemini';
  
  /** Timeout in milliseconds */
  timeout: number;
}