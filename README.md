# Judge

Semantic code checker that verifies if implementations match specifications using AI.

## Installation

```bash
bun install
```

## Usage

### Initialize configuration

```bash
bun run src/cli/index.ts --init
```

This creates a `judge.yaml` configuration file in your project.

### Run checks

```bash
# Check specific files
bun run src/cli/index.ts src/file1.ts src/file2.ts

# Check staged files (pre-commit)
bun run src/cli/index.ts --pre-commit

# Show configuration
bun run src/cli/index.ts --show-config

# Use JSON reporter
bun run src/cli/index.ts src/file.ts --reporter json
```

## Configuration

Judge uses a YAML configuration file (`judge.yaml`) to define rule bindings:

```yaml
version: "1.0"
provider: claude  # or gemini
timeout: 120
cache_dir: .judge-cache
fail_on_issues: true
max_concurrent_checks: 5

rule_bindings:
  - name: api-spec
    fail_on: error
    confidence_threshold: 0.8
    files:
      include:
        - "src/**/*.ts"
      exclude:
        - "**/*.test.ts"
    rules:
      - path: docs/api-spec.md
      - path: https://example.com/spec.md
        cache: true
```

## Testing with Mock Provider

For testing and demonstration purposes, you can use the mock provider by setting an environment variable:

```bash
JUDGE_MOCK_PROVIDER=true bun run src/cli/index.ts <files>
```

The mock provider simulates AI-based checking using pattern matching to detect common issues like:
- Usage of `any` types
- Type assertions
- `throw` statements
- Missing required methods

This is useful for testing Judge without requiring Claude or Gemini CLI tools to be installed.

## Requirements

- Bun v1.2.17 or later
- Claude CLI or Gemini CLI (unless using mock provider)

## Judge vs Linting

Judge is designed to check semantic rules that can't be enforced by traditional linting tools:

- **Linting** handles syntax, type safety, and code style rules that can be statically analyzed
- **Judge** handles semantic rules about behavior, design patterns, and architectural decisions

For example:
- Lint can enforce "no any types" (syntax rule)
- Judge can enforce "all providers must handle malformed AI responses gracefully" (semantic rule)

This project uses both ESLint for static analysis and Judge for semantic validation.

## Development

```bash
# Run all checks
bun run check

# Run individual checks
bun run build
bun run typecheck
bun run test
bun run lint
bun knip
```

This project was created using `bun init` in bun v1.2.17. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.