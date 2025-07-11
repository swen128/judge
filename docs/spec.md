Similar to ./reference implementation, but:

- Instead of using AI API directly, it leverages Claude Code SDK or Gemini CLI
  - For Claude: Use the @anthropic-ai/sdk package
  - For Gemini: Use CLI (`gemini -p "..."`)
  - The reviewer interface should be defined with Claude SDK and Gemini CLI implementations
- Implement in TypeScript, Bun.
- It should check not just specs, but also general coding principle, or any other rules written in natural language.

