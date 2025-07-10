Similar to ./reference implementation, but:

- Instead of using AI API directly, it leverages Claude Code or Gemini CLI (`claude -p "..."` or `gemini -p "..."`)
  - The reviewer interface should be defined with Claude Code and Gemini CLI implementations
- Implement in TypeScript, Bun.
- It should check not just specs, but also general coding principle, or any other rules written in natural language.

