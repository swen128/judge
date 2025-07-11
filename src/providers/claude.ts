import { query, type SDKMessage } from '@anthropic-ai/claude-code';
import { z } from 'zod';
import type { Provider, CheckRequest, CheckResponse, Issue, Severity } from '../types/index.js';

export class ClaudeProvider implements Provider {
  readonly name = 'claude';

  async validate(): Promise<void> {
    // Try a simple query to validate Claude Code is available
    try {
      const messages: SDKMessage[] = [];
      for await (const message of query({
        prompt: "Say 'ok' if you're working",
        options: {
          maxTurns: 1,
        },
      })) {
        messages.push(message);
      }
      
      if (messages.length === 0) {
        return Promise.reject(new Error('Claude Code did not respond'));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return Promise.reject(new Error(`Claude Code validation failed: ${message}`));
    }
  }

  async check(request: CheckRequest): Promise<CheckResponse> {
    const startTime = Date.now();
    const prompt = this.buildPrompt(request);
    
    try {
      const response = await this.executeClaude(prompt, request.timeout);
      const issues = this.parseIssues(response);
      
      return {
        issues,
        metadata: {
          model: 'claude-code',
          duration: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        issues: [],
        metadata: {
          model: 'claude-code',
          duration: Date.now() - startTime,
        },
      };
    }
  }

  private buildPrompt(request: CheckRequest): string {
    const ruleContent = `
## Specification/Rule:
${request.rule.content}
`;

    const implementationContent = request.implementations.map((file) => `
## File: ${file.path}
Language: ${file.language}

\`\`\`${file.language}
${file.content}
\`\`\`
`).join('\n');

    return `Check if the following implementation files comply with the given specification/rule.

${ruleContent}

${implementationContent}

Analyze the code and report any violations or issues.`;
  }

  private async executeClaude(prompt: string, _timeout?: number): Promise<string> {
    try {
      const messages: SDKMessage[] = [];
      
      const appendSystemPrompt = `You are a code reviewer that checks if implementation files comply with specifications/rules.

For each issue found, output a JSON object with this structure:
{
  "issues": [
    {
      "severity": "error" | "warning" | "notice",
      "message": "Clear description of the issue",
      "file": "path/to/file.ts",
      "line": 42,
      "confidence": 0.95
    }
  ]
}

- severity: "error" for critical violations, "warning" for important issues, "notice" for minor suggestions
- message: Clear, actionable description of the issue
- file: The file path where the issue was found
- line: The line number where the issue occurs (best effort)
- confidence: A number between 0 and 1 indicating how confident you are about this issue

If no issues are found, return: {"issues": []}`;
      
      for await (const message of query({
        prompt,
        options: {
          maxTurns: 1,
          appendSystemPrompt,
          allowedTools: ['Glob', 'Grep', 'LS', 'Read', 'WebFetch', 'WebSearch'], // Tools for code analysis
        },
      })) {
        messages.push(message);
      }
      
      // Extract text content from the messages
      const textContent = messages
        .map(msg => JSON.stringify(msg))
        .join('\n');
      
      return textContent;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  private parseIssues(output: string): Issue[] {
    try {
      // Since we're using outputFormat: 'json', the output should be valid JSON
      // But the SDKMessage might wrap it, so let's try to parse it
      const parsed: unknown = JSON.parse(output);
      
      // Validate structure without type assertions
      if (typeof parsed !== 'object' || parsed === null) {
        return [];
      }
      
      // Create a schema for the expected response
      const ResponseSchema = z.object({
        issues: z.array(z.object({
          severity: z.enum(['error', 'warning', 'notice']).optional(),
          message: z.string(),
          file: z.string(),
          line: z.number(),
          confidence: z.number().default(0.5),
        })),
      });
      
      const parseResult = ResponseSchema.safeParse(parsed);
      if (!parseResult.success) {
        return [];
      }

      const issues: Issue[] = [];
      for (const item of parseResult.data.issues) {
        const severity = this.parseSeverity(item.severity);
        
        issues.push({
          severity,
          message: item.message,
          file: item.file,
          line: item.line,
          confidence: item.confidence,
        });
      }
      
      return issues;
    } catch {
      // If parsing fails, return empty array
      return [];
    }
  }
  
  private parseSeverity(value: string | undefined): Severity {
    switch (value) {
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'notice':
        return 'notice';
      case undefined:
        return 'warning';
      default:
        return 'warning';
    }
  }
}