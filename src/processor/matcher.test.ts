import { describe, test, expect } from 'bun:test';
import { FileMatcherImpl } from './matcher.js';
import type { ResolvedRuleBinding } from '../types/index.js';

describe('FileMatcher', () => {
  test('should match files to rule bindings', () => {
    const matcher = new FileMatcherImpl(process.cwd());
    
    const bindings: ResolvedRuleBinding[] = [
      {
        name: 'api',
        files: { 
          include: ['src/api/**/*.ts'],
          exclude: ['**/*.test.ts']
        },
        rules: [{ path: 'api.md', cache: true }],
        fail_on: 'error',
        confidence_threshold: 0.8,
      },
      {
        name: 'components',
        files: { 
          include: ['src/components/**/*.tsx'],
          exclude: []
        },
        rules: [{ path: 'components.md', cache: true }],
        fail_on: 'error',
        confidence_threshold: 0.8,
      },
    ];
    
    const files = [
      'src/api/users.ts',
      'src/api/users.test.ts',
      'src/components/Button.tsx',
      'src/utils/helpers.ts',
    ];
    
    const result = matcher.match(files, bindings);
    
    // Check rule binding files map
    expect(result.ruleBindingFiles.get('api')).toEqual(['src/api/users.ts']);
    expect(result.ruleBindingFiles.get('components')).toEqual(['src/components/Button.tsx']);
    
    // Check file rule bindings map
    expect(result.fileRuleBindings.get('src/api/users.ts')).toHaveLength(1);
    expect(result.fileRuleBindings.get('src/api/users.ts')?.[0].name).toBe('api');
    
    // Check excluded and unmatched
    expect(result.ignoredFiles).toEqual([]);
    expect(result.unmatchedFiles).toEqual(['src/api/users.test.ts', 'src/utils/helpers.ts']);
  });
  
  test('should handle exclude patterns', () => {
    const matcher = new FileMatcherImpl(process.cwd());
    
    const bindings: ResolvedRuleBinding[] = [
      {
        name: 'all-ts',
        files: { 
          include: ['**/*.ts'],
          exclude: ['**/*.test.ts', '**/node_modules/**']
        },
        rules: [{ path: 'ts.md', cache: true }],
        fail_on: 'error',
        confidence_threshold: 0.8,
      },
    ];
    
    const files = [
      'src/index.ts',
      'src/index.test.ts',
      'node_modules/lib/index.ts',
    ];
    
    const result = matcher.match(files, bindings);
    
    expect(result.ruleBindingFiles.get('all-ts')).toEqual(['src/index.ts']);
    expect(result.unmatchedFiles).toEqual(['src/index.test.ts', 'node_modules/lib/index.ts']);
  });
});