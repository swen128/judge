# Type Safety Specification

All TypeScript code in this repository must follow strict type safety rules:

1. **No `any` types**: Never use the `any` type. All variables, parameters, and return types must be explicitly typed.

2. **No type assertions**: Avoid using type assertions (`as` keyword) except when absolutely necessary for parsing external data (JSON, etc). Even then, validate the structure properly.

3. **Strict null checks**: All nullable values must be explicitly handled. Use strict boolean expressions that check for undefined/null.

4. **Exhaustive type checking**: All discriminated unions must be exhaustively checked in switch statements and conditionals.

5. **Pure functions**: Prefer pure functions with explicit return types. Avoid side effects where possible.

6. **Immutable data**: Use `const` declarations and avoid `let`. Prefer immutable data structures and functional updates.

These rules ensure type safety and predictable behavior throughout the codebase.