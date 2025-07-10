# Error Handling Specification

All error handling in this repository must follow these patterns:

1. **Use neverthrow**: Error handling should use the `neverthrow` library's Result type instead of throwing exceptions.

2. **Discriminated unions for errors**: Define errors as discriminated unions with a `type` field for exhaustive matching.

3. **No throw statements**: Avoid `throw` statements. Use `Promise.reject()` or Result types instead.

4. **Comprehensive error types**: Each error type should include all necessary context (paths, reasons, durations, etc).

5. **Graceful degradation**: Operations should fail gracefully, returning empty arrays or default values rather than crashing.

Example error type:
```typescript
type JudgeError =
  | { type: 'CONFIG_NOT_FOUND'; path: string }
  | { type: 'CONFIG_INVALID'; path: string; reason: string }
  | { type: 'PROVIDER_ERROR'; message: string }
```

This ensures robust error handling and better debugging capabilities.