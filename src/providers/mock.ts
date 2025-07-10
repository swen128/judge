import type { Provider, CheckRequest, CheckResponse } from '../types/index.js';

export class MockProvider implements Provider {
  readonly name = 'mock';

  async validate(): Promise<void> {
    // Mock provider is always available
    return Promise.resolve();
  }

  check(request: CheckRequest): Promise<CheckResponse> {
    const startTime = Date.now();
    
    // Simulate some basic checks based on the rule content
    const issues = [];
    
    // Check for type safety violations
    if (request.rule.content.includes('Type Safety')) {
      for (const impl of request.implementations) {
        // Check for any types - more comprehensive patterns
        const anyPatterns = [
          /:\s*any\b/,
          /<any>/,
          /as\s+any\b/,
          /\bany\[\]/,
          /Array<any>/,
          /:\s*Record<[^,]+,\s*any>/
        ];
        
        for (const pattern of anyPatterns) {
          const lines = impl.content.split('\n');
          lines.forEach((line, index) => {
            if (pattern.test(line)) {
              issues.push({
                severity: 'error' as const,
                message: `Found usage of "any" type which violates type safety rules: ${line.trim()}`,
                file: impl.path,
                line: index + 1,
                confidence: 0.95,
              });
            }
          });
        }
        
        // Check for type assertions
        const assertionPattern = /\s+as\s+[A-Z]\w*/;
        const lines = impl.content.split('\n');
        lines.forEach((line, index) => {
          if (assertionPattern.test(line) && !line.includes('as const')) {
            issues.push({
              severity: 'error' as const,
              message: `Found type assertion which should be avoided: ${line.trim()}`,
              file: impl.path,
              line: index + 1,
              confidence: 0.85,
            });
          }
        });
      }
    }
    
    // Check for error handling patterns
    if (request.rule.content.includes('Error Handling')) {
      for (const impl of request.implementations) {
        if (impl.content.includes('throw new Error')) {
          issues.push({
            severity: 'error' as const,
            message: 'Found "throw" statement - use neverthrow Result type instead',
            file: impl.path,
            line: impl.content.split('\n').findIndex(line => line.includes('throw')) + 1,
            confidence: 0.85,
          });
        }
      }
    }
    
    // Check provider interface
    if (request.rule.content.includes('Provider Interface')) {
      for (const impl of request.implementations) {
        if (!impl.content.includes('async validate(): Promise<void>')) {
          issues.push({
            severity: 'error' as const,
            message: 'Provider missing required validate() method',
            file: impl.path,
            line: 1,
            confidence: 0.9,
          });
        }
      }
    }
    
    return Promise.resolve({
      issues,
      metadata: {
        model: 'mock',
        duration: Date.now() - startTime,
      },
    });
  }
}