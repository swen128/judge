# Implementation Decisions

Based on additional Q&A session, the following technical decisions have been made:

## 1. Parallel Execution
**Decision:** Run checks in parallel, present results serially
- Execute multiple rules concurrently for better performance
- Collect all results before displaying
- Present output in a consistent, ordered manner
- Prevents interleaved output that would be hard to read

## 2. Partial Failure Handling
**Decision:** Continue checking all files even if some fail
- Don't stop at first failure
- Complete all checks to give full picture
- Report all issues found across all files
- Exit code reflects overall status at the end

## 3. Dry-Run Mode
**Decision:** Not supported
- No dry-run mode needed
- Users can check config with --show-config
- File matching is fast enough to not need preview

## 4. AI Tool Output Format
**Decision:** Depends on the AI tool, leverage SDK capabilities
- Claude Code SDK may handle parsing automatically
- Build flexible parsing layer that adapts to tool
- Don't assume specific format
- Let provider implementations handle their tool's output

## 5. Output Formats
**Decision:** Support multiple reporters through interface
- Define Reporter interface for extensibility
- Implement at least:
  - StdoutReporter (default terminal output)
  - JSONReporter (machine-readable format)
- Allow future reporters (GitHub, JUnit, SARIF, etc.)

## Reporter Interface Design

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

This simplified design:
- Receives all results at once after parallel execution completes
- No real-time updates needed
- Simpler to implement and test
- Clean separation of execution and reporting

## 6. Error Handling
**Decision:** Fail fast when AI CLI tool is not installed
- Check tool availability at startup
- Provide clear error message with installation instructions
- Don't attempt to continue with missing tools

## 7. Prompt Size Handling
**Decision:** Use programmatic interfaces where available
- Use Claude Code SDK to pass prompts programmatically
- For Gemini, use stdin to pass prompts (avoids CLI argument limits)
- No need for size limits or truncation

## 8. Cache Invalidation
**Decision:** Respect HTTP cache headers
- Honor Cache-Control, ETag, Last-Modified headers
- Implement proper HTTP caching semantics
- No arbitrary TTL needed

## 9. Concurrency Control
**Decision:** Support configurable concurrency limit
- Add `max_concurrent_checks` option to config
- Default to reasonable limit (e.g., 5)
- Prevents system overload and rate limiting

## 10. Binary File Handling
**Decision:** Let AI tools handle all files
- No pre-filtering of binary files
- AI tools can read files autonomously
- They'll handle or skip as appropriate

## 11. Environment-Specific Configs
**Decision:** Use CLI argument for config file path
- No automatic environment-based config loading
- User specifies config via `--config` flag
- Keeps configuration explicit and predictable

## 12. Conflicting Rules
**Decision:** Check files multiple times with different specs
- If multiple rules match a file, check it for each rule
- Each rule gets its own analysis context
- No merging of specifications

## 13. JSON Reporter Content
**Decision:** Exclude file contents from JSON output
- Only include metadata and issues
- Keeps output size manageable
- File contents can be retrieved separately if needed

## 14. Fix Mode
**Decision:** No automatic fix mode
- Judge is a checking tool only
- Users apply fixes manually
- Maintains clear separation of concerns

## 15. File Path Formatting
**Decision:** Use paths relative to current directory
- Better terminal compatibility (clickable paths)
- Improved readability (shorter paths)
- Consistent with git and other dev tools
- Portable across different environments

## 16. Glob Patterns in Specs
**Decision:** Support glob patterns for local spec files
- Expand globs for local paths (e.g., `docs/**/*.md`)
- URLs remain as-is (no glob expansion)
- More flexible spec file organization

## 17. Issue Suppression
**Decision:** No special suppression mechanism
- Regular code comments are sufficient
- Keeps tool simpler
- AI can consider comments as context

## 18. Issue Deduplication
**Decision:** No deduplication needed
- Report all issues as found
- Each rule's output stands alone
- Preserves full context

## 19. Prompt Construction
**Decision:** Use TypeScript template literals
- Simple string interpolation
- No complex templating system
- Clear and maintainable

## 20. Single File Checking
**Decision:** Find all applicable rules automatically
- When checking specific files, match against all rules
- Run all applicable checks
- Better user experience

## 21. Spec References
**Decision:** Treat each spec as standalone
- No automatic inclusion of referenced files
- Each spec must be complete
- Explicit is better than implicit

## 22. Config Validation
**Decision:** Validate configuration upfront
- Use schema validation at startup
- Catch errors early
- Provide clear error messages

## 23. Config Relative Paths
**Decision:** Paths relative to config file location
- Intuitive behavior
- Portable configs
- Consistent with other tools

## 24. Config-less Operation
**Decision:** Always require configuration file
- Maintains consistency
- Avoids implicit defaults
- Clear project setup

## 25. Cache Organization
**Decision:** Use content hashing with indices
- Content-based cache keys prevent collisions
- Indices for reverse lookup if needed
- Efficient and reliable

## 26. Node.js Compatibility
**Decision:** Use Node.js-compatible APIs instead of Bun-specific ones
- Use js-yaml for YAML parsing
- Use Node.js fs/promises instead of Bun file APIs
- Use child_process or cross-spawn instead of Bun.spawn()
- Ensures tool works in both Node.js and Bun environments

## 27. Configuration Format
**Decision:** Use YAML instead of TOML
- More familiar to developers
- Better support for complex nested structures
- Excellent Node.js library support (js-yaml)
- Widely used in CI/CD and developer tools

## 28. Error Handling Library
**Decision:** Use neverthrow for Result types
- Type-safe error handling
- Functional programming patterns
- Better than custom Result implementation
- Well-maintained and widely used