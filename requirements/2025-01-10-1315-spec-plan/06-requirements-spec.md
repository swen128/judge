# Requirements Specification: Judge - Semantic Code Checker

## Problem Statement

Create a TypeScript/Bun implementation of a semantic code checker that verifies if code implementations match their specifications, coding principles, and other natural language rules. Unlike the reference implementation that uses direct AI API calls, this tool will leverage CLI tools like Claude Code (`claude -p "..."`) and Gemini CLI (`gemini -p "..."`) to perform the analysis.

## Solution Overview

Judge will be a CLI tool that:
1. Reads configuration from TOML files defining rules and mappings
2. Matches files based on patterns to identify specs and implementations
3. Uses AI CLI tools to analyze semantic compliance
4. Reports issues with specific locations and confidence scores
5. Supports checking staged files for pre-commit workflows

## Functional Requirements

### 1. Configuration Management
- **YAML Configuration**: Use YAML format for configuration files (default: `judge.yaml`)
- **Rule Definition**: Support rules that map specification files to implementation files
- **Provider Selection**: Allow explicit selection of AI provider (claude or gemini)
- **Remote Specs**: Support loading specification files from HTTP/HTTPS URLs
- **Caching**: Cache remote specification files locally to improve performance
- **Environment Variables**: Support environment variable expansion in config (e.g., `${CLAUDE_API_KEY}`)

### 2. File Processing
- **Multi-language Support**: Work with any programming language files
- **Pattern Matching**: Support glob patterns with `**` wildcards
- **Gitignore Integration**: Respect `.gitignore` rules
- **Include/Exclude**: Per-rule include and exclude patterns
- **Staged Files Mode**: Support checking only staged files for git pre-commit hooks

### 3. Semantic Analysis
- **AI CLI Integration**: Execute claude/gemini CLI commands with appropriate prompts
- **Structured Output**: Parse AI responses to extract issues with locations
- **Line Number Tracking**: Provide specific line numbers for identified issues
- **Confidence Scoring**: Filter results based on confidence thresholds
- **Custom Prompts**: Allow rule-specific additional prompts

### 4. Reporting
- **Terminal Output**: Human-readable output with colors and formatting
- **JSON Output**: Machine-readable format for programmatic consumption
- **Reporter Interface**: Extensible design for custom output formats
- **Exit Codes**: Appropriate exit codes for CI/CD integration
- **Issue Grouping**: Group issues by rule and severity

### 5. CLI Interface
- **Commands**:
  - `judge` - Run checks based on configuration
  - `judge --init` - Interactive configuration setup
  - `judge --pre-commit` - Check only staged files
  - `judge [files...]` - Check specific files
  - `judge --help` - Show usage information
  - `judge --version` - Show version
  - `judge --show-config` - Display resolved configuration
  - `judge --reporter <type>` - Select output reporter (stdout, json)

## Technical Requirements

### 1. Architecture
```
src/
├── cli/
│   ├── index.ts         # Main entry point
│   ├── commands.ts      # Command handling
│   └── init.ts          # Interactive config setup
├── config/
│   ├── types.ts         # Configuration interfaces
│   ├── loader.ts        # YAML loading
│   └── validator.ts     # Config validation with Zod
├── providers/
│   ├── types.ts         # Provider interface
│   ├── factory.ts       # Provider factory
│   ├── claude.ts        # Claude CLI wrapper
│   └── gemini.ts        # Gemini CLI wrapper
├── processor/
│   ├── matcher.ts       # File matching logic
│   ├── git.ts           # Git integration
│   └── cache.ts         # Remote file caching
├── checker/
│   ├── semantic.ts      # Core checking logic
│   └── prompts.ts       # Prompt template engine
├── reporters/
│   ├── types.ts         # Reporter interface
│   ├── stdout.ts        # Terminal reporter
│   └── json.ts          # JSON reporter
└── utils/
    ├── exec.ts          # Process execution
    └── fs.ts            # File system helpers
```

### 2. Configuration Schema
```typescript
interface JudgeConfig {
  version: "1.0";
  provider: "claude" | "gemini";
  timeout?: number;              // Default: 120 seconds
  cache_dir?: string;            // Default: .judge-cache
  fail_on_issues?: boolean;      // Default: true
  max_concurrent_checks?: number; // Default: 5
  rules: Rule[];
}

interface Rule {
  name: string;
  description: string;
  enabled?: boolean;       // Default: true
  files: {
    include: string[];
    exclude?: string[];
  };
  specs: {
    path: string;         // Local file or URL
    cache?: boolean;      // Cache if remote
  }[];
  prompt?: string;        // Additional instructions
  fail_on?: "error" | "warning" | "notice";
  confidence_threshold?: number; // 0-1, default 0.8
}
```

### 3. Provider Interface
```typescript
interface Provider {
  name: string;
  check(request: CheckRequest): Promise<CheckResponse>;
  validate(): Promise<void>;
}

interface CheckRequest {
  specs: string[];
  implementations: string[];
  additionalPrompt?: string;
}

interface CheckResponse {
  issues: Issue[];
  metadata: {
    model: string;
    duration: number;
  };
}

interface Issue {
  severity: "error" | "warning" | "notice";
  message: string;
  file?: string;
  line?: number;
  column?: number;
  confidence: number;
}
```

### 4. Reporter Interface
```typescript
interface Reporter {
  report(results: CheckResults): string;
}

interface CheckResults {
  config: JudgeConfig;
  rules: RuleResult[];
  summary: CheckSummary;
}

interface RuleResult {
  rule: Rule;
  issues: Issue[];
  duration: number;
  filesChecked: number;
}

interface CheckSummary {
  totalRules: number;
  totalIssues: number;
  issuesBySeverity: Record<Severity, number>;
  duration: number;
  passed: boolean;
}
```

### 5. Implementation Details
- **Process Management**: Use Node.js `child_process` or cross-platform spawn library
- **Parallel Execution**: Run rules concurrently with configurable limit
- **Error Handling**: Fail fast on missing tools, continue on check failures
- **Tool Integration**: 
  - Claude: Use @anthropic-ai/sdk package for API access
  - Gemini: Pass prompts via stdin to avoid CLI limits
- **YAML Parsing**: Use js-yaml or similar Node-compatible library
- **Validation**: Use Zod for runtime config validation
- **File Operations**: Use Node.js fs/promises API
- **Pattern Matching**: Use micromatch for glob patterns
- **Caching**: HTTP-compliant caching with ETag/Last-Modified support
- **Binary Files**: No filtering - let AI tools handle all file types
- **Prompt Templates**: Use template literals with replacements
- **Output Format**: Flexible based on AI tool capabilities

## Acceptance Criteria

1. **Configuration**
   - Tool can load and validate YAML configuration
   - Interactive init creates valid config file
   - Environment variables are properly expanded

2. **File Matching**
   - Correctly identifies files based on rules
   - Respects gitignore patterns
   - Handles include/exclude patterns properly

3. **AI Integration**
   - Successfully executes claude/gemini CLI commands
   - Handles CLI tool errors gracefully
   - Parses structured output correctly

4. **Reporting**
   - Shows clear, actionable error messages
   - Provides accurate file locations
   - Groups issues logically

5. **Performance**
   - Caches remote files effectively
   - Runs checks in reasonable time
   - Handles large codebases

## Assumptions

1. Users have claude and/or gemini CLI tools installed
2. CLI tools accept prompts via `-p` flag
3. CLI tools return structured, parseable output
4. Users will define their own coding principles in specs
5. Network access available for remote spec files

## Future Extensibility

The architecture should support:
1. Additional AI providers beyond claude/gemini
2. Custom reporters (JSON, GitHub Actions, etc.)
3. Plugin system for custom file processors
4. Integration with other development tools
5. Web UI for configuration management
