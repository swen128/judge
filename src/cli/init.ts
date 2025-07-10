import { writeFile } from 'fs/promises';
import { resolve } from 'path';

const DEFAULT_CONFIG = `# Judge configuration

version: "1.0"
provider: claude
timeout: 120
cache_dir: .judge-cache
fail_on_issues: true
max_concurrent_checks: 5

rule_bindings:
  # Example rule binding
  - name: example-spec-compliance
    fail_on: error
    confidence_threshold: 0.8
    files:
      include:
        - "src/**/*.ts"
        - "src/**/*.js"
      exclude:
        - "**/*.test.ts"
        - "**/*.spec.ts"
    rules:
      - path: docs/example-spec.md
      # - path: https://example.com/spec.md
      #   cache: true
`;

export async function initConfig(path?: string): Promise<void> {
  const configPath = resolve(process.cwd(), path ?? 'judge.yaml');
  
  try {
    await writeFile(configPath, DEFAULT_CONFIG);
    console.log(`✅ Created configuration file at: ${configPath}`);
    console.log('\n📝 Next steps:');
    console.log('1. Edit the configuration file to define your rule bindings');
    console.log('2. Add your specification files');
    console.log('3. Run "judge" to check your code');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`❌ Failed to create config file: ${message}`);
    process.exit(1);
  }
}