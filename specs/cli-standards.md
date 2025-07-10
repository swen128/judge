# CLI Standards Specification

The CLI implementation must follow these standards:

1. **User-friendly output**:
   - Use appropriate emojis/icons for different states (✅ success, ❌ error, ⚠️ warning)
   - Provide clear, actionable error messages
   - Show progress for long-running operations

2. **Exit codes**:
   - Exit with code 0 on success
   - Exit with code 1 on any failure
   - Handle process termination gracefully

3. **Command structure**:
   - Support standard flags: --help, --version
   - Provide --init for configuration setup
   - Support --pre-commit for git integration
   - Allow --reporter flag for output format selection

4. **Configuration**:
   - Default to judge.yaml in current directory
   - Allow override with --config flag
   - Validate configuration on load

5. **Error messages**:
   - All errors must be prefixed with ❌
   - Provide helpful suggestions (e.g., "Run 'judge --init' to create config")
   - Show specific error details (paths, reasons)

6. **Console output**:
   - Console statements are acceptable and expected in CLI tools
   - Use console.log for normal output
   - Use console.error for error messages

This ensures a consistent and user-friendly CLI experience.