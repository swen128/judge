import micromatch from 'micromatch';
import { readFile } from 'fs/promises';
import { join } from 'path';
import type { FileMatcher, MatchResult, ResolvedRuleBinding } from '../types/index.js';

export class FileMatcherImpl implements FileMatcher {
  private gitignorePatterns: string[] = [];

  constructor(private workingDirectory: string) {}

  async initialize(): Promise<void> {
    try {
      const gitignorePath = join(this.workingDirectory, '.gitignore');
      const content = await readFile(gitignorePath, 'utf-8');
      this.gitignorePatterns = content
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0 && !line.startsWith('#'))
        .map(pattern => {
          // Convert gitignore patterns to micromatch patterns
          if (pattern.endsWith('/')) {
            return `**/${pattern}**`;
          }
          return pattern.includes('/') ? pattern : `**/${pattern}`;
        });
    } catch {
      // No .gitignore or error reading it
      this.gitignorePatterns = [];
    }
  }

  match(files: string[], ruleBindings: ResolvedRuleBinding[]): MatchResult {
    const ruleBindingFiles = new Map<string, string[]>();
    const fileRuleBindings = new Map<string, ResolvedRuleBinding[]>();
    const ignoredFiles: string[] = [];
    const unmatchedFiles: string[] = [];

    for (const file of files) {
      // Check if file is ignored
      if (this.isIgnored(file)) {
        ignoredFiles.push(file);
        continue;
      }

      const matchingBindings = this.findRuleBindingsForFile(file, ruleBindings);
      
      if (matchingBindings.length === 0) {
        unmatchedFiles.push(file);
      } else {
        fileRuleBindings.set(file, matchingBindings);
        
        for (const binding of matchingBindings) {
          const existing = ruleBindingFiles.get(binding.name) || [];
          existing.push(file);
          ruleBindingFiles.set(binding.name, existing);
        }
      }
    }

    return {
      ruleBindingFiles,
      fileRuleBindings,
      unmatchedFiles,
      ignoredFiles,
    };
  }

  getFilesForRuleBinding(_ruleBinding: ResolvedRuleBinding): string[] {
    // This would be implemented if we need to scan the filesystem
    // For now, we only match against provided files
    return [];
  }

  getRuleBindingsForFile(_file: string): ResolvedRuleBinding[] {
    // This is used by match() internally
    return [];
  }

  private findRuleBindingsForFile(file: string, ruleBindings: ResolvedRuleBinding[]): ResolvedRuleBinding[] {
    const matching: ResolvedRuleBinding[] = [];

    for (const binding of ruleBindings) {
      // Check if file matches include patterns
      const matchesInclude = micromatch.isMatch(file, binding.files.include);
      
      if (!matchesInclude) {
        continue;
      }

      // Check if file is excluded
      const matchesExclude = binding.files.exclude.length > 0 && 
        micromatch.isMatch(file, binding.files.exclude);
      
      if (!matchesExclude) {
        matching.push(binding);
      }
    }

    return matching;
  }

  private isIgnored(file: string): boolean {
    if (this.gitignorePatterns.length === 0) {
      return false;
    }
    
    return micromatch.isMatch(file, this.gitignorePatterns);
  }
}