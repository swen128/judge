# Context Findings

## Reference Implementation Analysis

### Architecture Overview
The reference semcheck tool follows a clean layered architecture:
- **CLI Layer**: Command parsing and orchestration
- **Config Layer**: YAML configuration management
- **Providers Layer**: AI client abstraction (OpenAI, Anthropic, etc.)
- **Processor Layer**: File matching and git integration
- **Checker Layer**: Semantic analysis and reporting

### Key Implementation Patterns

1. **Provider Abstraction**
   - Interface-based design for AI clients
   - Factory pattern for creating provider instances
   - Each provider handles its own API specifics

2. **File Matching System**
   - Glob pattern support with `**` wildcards
   - Gitignore integration
   - Rule-based file association
   - Classification of files as spec/implementation/ignored

3. **Configuration Structure**
   - Rules define spec-to-implementation mappings
   - Include/exclude patterns for file filtering
   - Support for remote spec URLs
   - Per-rule configuration (confidence thresholds, failure modes)

4. **Semantic Analysis Flow**
   - Group files by rule
   - Build prompts using templates
   - Send to AI provider with structured output format
   - Parse responses and filter by confidence
   - Generate reports (stdout or GitHub format)

## TypeScript/Bun Specific Findings

### TOML Configuration
- Bun has native TOML import support: `import config from "./config.toml"`
- Alternative: js-toml library for dynamic parsing
- Should define TypeScript interfaces for config structure

### Project Structure
- Existing tsconfig.json uses modern TypeScript features
- Strict type checking enabled
- Module resolution set to "bundler" mode
- No existing configuration or implementation files

### Key Differences from Reference
1. Use TOML instead of YAML for configuration
2. Use CLI tools (claude/gemini) instead of direct API calls
3. Focus on TypeScript/Bun ecosystem
4. No CI/CD integration for initial version

## Implementation Approach

### CLI Tool Integration
Instead of direct API calls, we'll need to:
- Spawn child processes for `claude -p "..."` and `gemini -p "..."`
- Parse their output
- Handle process errors and timeouts
- Support extensibility for future CLI tools

### Suggested Architecture
```
src/
├── cli/
│   ├── index.ts         # Main entry point
│   ├── commands.ts      # Command handling
│   └── init.ts          # Config initialization
├── config/
│   ├── types.ts         # Config interfaces
│   ├── loader.ts        # TOML loading
│   └── validator.ts     # Config validation
├── providers/
│   ├── types.ts         # Provider interface
│   ├── factory.ts       # Provider factory
│   ├── claude.ts        # Claude Code CLI wrapper
│   └── gemini.ts        # Gemini CLI wrapper
├── processor/
│   ├── matcher.ts       # File matching logic
│   └── git.ts           # Git integration
├── checker/
│   ├── semantic.ts      # Core checking logic
│   ├── prompts.ts       # Prompt templates
│   └── reporter.ts      # Result reporting
└── utils/
    ├── exec.ts          # Process execution helpers
    └── fs.ts            # File system utilities
```

### Technical Constraints
1. Must handle CLI tool availability checking
2. Need robust process management for CLI calls
3. Should cache remote spec files
4. Must support streaming output from CLI tools
5. Need to handle different output formats from various CLI tools

### Integration Points
- File system access via Bun's native APIs
- Process spawning using Bun.spawn()
- TOML parsing with native imports
- Git operations through command execution

## Related Features Analyzed
- Reference implementation's rule system
- Prompt template approach
- Structured output parsing
- Multi-provider support pattern
- File matching algorithms
- Report generation strategies