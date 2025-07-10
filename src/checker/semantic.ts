import { readFile } from 'fs/promises';
import { extname } from 'path';
import type {
  SemanticChecker,
  SemanticCheckRequest,
  SemanticCheckResult,
  RuleResult,
  CheckSummary,
  FileContent,
  RuleContent,
  Issue,
  Severity,
} from '../types/index.js';
import { RemoteCacheImpl } from '../processor/cache.js';
import { FileMatcherImpl } from '../processor/matcher.js';

export class SemanticCheckerImpl implements SemanticChecker {
  async check(request: SemanticCheckRequest): Promise<SemanticCheckResult> {
    const startTime = Date.now();
    const cache = new RemoteCacheImpl(request.cacheDir);
    
    // Match files to bindings
    const matcher = new FileMatcherImpl(process.cwd());
    await matcher.initialize();
    const matchResult = matcher.match(request.files, request.ruleBindings);
    
    const ruleResults: RuleResult[] = [];
    const allIssues: Issue[] = [];
    const issuesBySeverity: Record<Severity, number> = {
      error: 0,
      warning: 0,
      notice: 0,
    };

    // Process rule bindings in parallel with concurrency limit
    const bindingChunks = this.chunk(request.ruleBindings, request.maxConcurrent);
    
    for (const chunk of bindingChunks) {
      const chunkResults = await Promise.all(
        chunk.map(binding => 
          this.checkRuleBinding(binding, request, cache, matchResult.ruleBindingFiles.get(binding.name) || [])
        )
      );
      
      for (const result of chunkResults) {
        ruleResults.push(result);
        allIssues.push(...result.issues);
        
        for (const issue of result.issues) {
          issuesBySeverity[issue.severity]++;
        }
      }
    }

    const duration = Date.now() - startTime;
    const totalRules = ruleResults.length;
    const rulesWithErrors = ruleResults.filter(r => r.error !== undefined).length;
    const passed = this.determinePassed(ruleResults, request.ruleBindings);

    const summary: CheckSummary = {
      totalRules,
      totalIssues: allIssues.length,
      issuesBySeverity,
      duration,
      passed,
      rulesWithErrors,
    };

    return {
      ruleResults,
      summary,
    };
  }

  private async checkRuleBinding(
    binding: SemanticCheckRequest['ruleBindings'][0],
    request: SemanticCheckRequest,
    cache: RemoteCacheImpl,
    files: string[]
  ): Promise<RuleResult> {
    const startTime = Date.now();

    try {
      if (files.length === 0) {
        return {
          ruleBinding: binding,
          issues: [],
          duration: Date.now() - startTime,
          filesChecked: 0,
          checkedFiles: [],
        };
      }

      // Load implementation files
      const implementations = await Promise.all(
        files.map(file => this.loadFile(file))
      );

      // Check each rule in the binding
      const allIssues: Issue[] = [];
      
      for (const rule of binding.rules) {
        const ruleContent = await this.loadRule(rule, cache);
        
        const response = await request.provider.check({
          rule: ruleContent,
          implementations,
          timeout: 120000,
        });

        // Filter by confidence threshold
        const filteredIssues = response.issues.filter(
          issue => issue.confidence >= binding.confidence_threshold
        );

        // Add rule name to issues
        const issuesWithRule = filteredIssues.map(issue => ({
          ...issue,
          ruleName: binding.name,
        }));

        allIssues.push(...issuesWithRule);
      }

      return {
        ruleBinding: binding,
        issues: allIssues,
        duration: Date.now() - startTime,
        filesChecked: files.length,
        checkedFiles: files,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        ruleBinding: binding,
        issues: [],
        duration: Date.now() - startTime,
        filesChecked: 0,
        checkedFiles: [],
        error: errorMessage,
      };
    }
  }

  private async loadFile(path: string): Promise<FileContent> {
    const content = await readFile(path, 'utf-8');
    const ext = extname(path).slice(1);
    
    return {
      path,
      content,
      language: this.getLanguage(ext),
    };
  }

  private async loadRule(rule: { path: string; cache?: boolean }, cache: RemoteCacheImpl): Promise<RuleContent> {
    const isUrl = rule.path.startsWith('http://') || rule.path.startsWith('https://');
    
    if (isUrl) {
      // Check cache first
      const cached = await cache.get(rule.path);
      if (cached) {
        return {
          path: rule.path,
          content: cached.content,
          sourceUrl: rule.path,
        };
      }

      // Fetch from URL
      const response = await fetch(rule.path);
      if (!response.ok) {
        return Promise.reject(new Error(`Failed to fetch ${rule.path}: ${response.statusText}`));
      }

      const content = await response.text();
      const headers = Object.fromEntries(response.headers.entries());

      // Cache if requested
      if (rule.cache === true) {
        await cache.set(rule.path, content, headers);
      }

      return {
        path: rule.path,
        content,
        sourceUrl: rule.path,
      };
    } else {
      // Load from local file
      const content = await readFile(rule.path, 'utf-8');
      return {
        path: rule.path,
        content,
      };
    }
  }

  private getLanguage(ext: string): string {
    const langMap: Record<string, string> = {
      ts: 'typescript',
      tsx: 'typescript',
      js: 'javascript',
      jsx: 'javascript',
      py: 'python',
      rb: 'ruby',
      go: 'go',
      rs: 'rust',
      java: 'java',
      c: 'c',
      cpp: 'cpp',
      cs: 'csharp',
      php: 'php',
      swift: 'swift',
      kt: 'kotlin',
      sh: 'bash',
      yml: 'yaml',
      yaml: 'yaml',
      json: 'json',
      md: 'markdown',
    };

    return langMap[ext] ?? ext;
  }

  private determinePassed(
    results: RuleResult[],
    _bindings: SemanticCheckRequest['ruleBindings']
  ): boolean {
    for (const result of results) {
      if (result.error !== undefined) {
        return false;
      }

      const failOn = result.ruleBinding.fail_on;
      
      for (const issue of result.issues) {
        if (this.shouldFail(issue.severity, failOn)) {
          return false;
        }
      }
    }

    return true;
  }

  private shouldFail(severity: Severity, failOn: Severity): boolean {
    const severityLevels: Record<Severity, number> = {
      error: 3,
      warning: 2,
      notice: 1,
    };

    return severityLevels[severity] >= severityLevels[failOn];
  }

  private chunk<T>(array: T[], size: number): T[][] {
    const length = array.length;
    const chunkCount = Math.ceil(length / size);
    
    return Array.from({ length: chunkCount }, (_, index) => {
      const start = index * size;
      const end = Math.min(start + size, length);
      return array.slice(start, end);
    });
  }
}