import { describe, test, expect } from 'bun:test';
import { loadConfig, resolveConfig } from './loader.js';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

describe('loadConfig', () => {
  test('should load valid YAML config', async () => {
    const tempPath = join(tmpdir(), `judge-test-${Date.now()}.yaml`);
    const config = `
version: "1.0"
provider: claude
rule_bindings:
  - name: test
    files:
      include:
        - "*.ts"
    rules:
      - path: test.md
`;
    
    await writeFile(tempPath, config);
    
    try {
      const result = await loadConfig(tempPath);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.version).toBe('1.0');
        expect(result.value.provider).toBe('claude');
        expect(result.value.rule_bindings).toHaveLength(1);
      }
    } finally {
      await unlink(tempPath);
    }
  });

  test('should return error for missing file', async () => {
    const result = await loadConfig('/nonexistent/file.yaml');
    expect(result.isOk()).toBe(false);
    if (result.isErr()) {
      expect(result.error.type).toBe('CONFIG_NOT_FOUND');
    }
  });

  test('should return error for invalid YAML', async () => {
    const tempPath = join(tmpdir(), `judge-test-${Date.now()}.yaml`);
    await writeFile(tempPath, 'invalid: [yaml');
    
    try {
      const result = await loadConfig(tempPath);
      expect(result.isOk()).toBe(false);
      if (result.isErr()) {
        expect(result.error.type).toBe('CONFIG_INVALID');
      }
    } finally {
      await unlink(tempPath);
    }
  });
});

describe('resolveConfig', () => {
  test('should apply defaults', () => {
    const config = {
      version: '1.0' as const,
      provider: 'claude' as const,
      rule_bindings: [{
        name: 'test',
        files: { include: ['*.ts'] },
        rules: [{ path: 'test.md' }],
      }],
    };
    
    const resolved = resolveConfig(config, '/path/to/config.yaml');
    
    expect(resolved.timeout).toBe(120000);
    expect(resolved.cache_dir).toBe('.judge-cache');
    expect(resolved.fail_on_issues).toBe(true);
    expect(resolved.max_concurrent_checks).toBe(5);
    expect(resolved.rule_bindings[0].fail_on).toBe('error');
    expect(resolved.rule_bindings[0].confidence_threshold).toBe(0.8);
  });

  test('should resolve relative paths', () => {
    const config = {
      version: '1.0' as const,
      provider: 'claude' as const,
      rule_bindings: [{
        name: 'test',
        files: { include: ['*.ts'] },
        rules: [{ path: './docs/test.md' }],
      }],
    };
    
    const resolved = resolveConfig(config, '/project/config.yaml');
    
    expect(resolved.rule_bindings[0].rules[0].path).toBe('/project/docs/test.md');
  });
});