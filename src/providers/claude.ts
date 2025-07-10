import { spawn } from 'cross-spawn';
import type { Provider, CheckRequest, CheckResponse, Issue, Severity } from '../types/index.js';


export class ClaudeProvider implements Provider {
  readonly name = 'claude';

  async validate(): Promise<void> {
    const result = spawn('claude', ['--version'], { stdio: 'pipe' });
    
    return new Promise((resolve, reject) => {
      result.on('error', () => {
        reject(new Error('Claude CLI not found. Please install it first.'));
      });
      
      result.on('exit', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error('Claude CLI not available'));
        }
      });
    });
  }

  async check(request: CheckRequest): Promise<CheckResponse> {
    const startTime = Date.now();
    const prompt = this.buildPrompt(request);
    
    const result = await this.executeClaude(prompt, request.timeout);
    const issues = this.parseIssues(result);
    
    return {
      issues,
      metadata: {
        model: 'claude',
        duration: Date.now() - startTime,
      },
    };
  }

  private buildPrompt(request: CheckRequest): string {
    const implementations = request.implementations
      .map(impl => `File: ${impl.path}\n\`\`\`${impl.language ?? ''}\n${impl.content}\n\`\`\``)
      .join('\n\n');
    
    const ruleContent = request.rule.sourceUrl !== undefined
      ? `Rule from ${request.rule.sourceUrl}:\n${request.rule.content}`
      : `Rule from ${request.rule.path}:\n${request.rule.content}`;
    
    return `Please analyze if the following implementation files comply with the given rule/specification.

${ruleContent}

Implementation files to check:
${implementations}

For each issue found, provide output in the following JSON format:
{
  "issues": [
    {
      "severity": "error" | "warning" | "notice",
      "message": "Description of the issue",
      "file": "path/to/file.ts",
      "line": <line number>,
      "confidence": <0.0-1.0>
    }
  ]
}

Only output the JSON, no other text.`;
  }

  private async executeClaude(prompt: string, timeout?: number): Promise<string> {
    const args = ['-p', prompt];
    const child = spawn('claude', args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: timeout ?? 120000,
    });

    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];

    child.stdout?.on('data', (data: Buffer) => {
      stdoutChunks.push(data);
    });

    child.stderr?.on('data', (data: Buffer) => {
      stderrChunks.push(data);
    });

    return new Promise((resolve, reject) => {
      child.on('error', (error) => {
        reject(error);
      });

      child.on('exit', (code) => {
        if (code === 0) {
          resolve(Buffer.concat(stdoutChunks).toString());
        } else {
          const stderr = Buffer.concat(stderrChunks).toString();
          reject(new Error(`Claude CLI failed: ${stderr}`));
        }
      });
    });
  }

  private parseIssues(output: string): Issue[] {
    try {
      // Extract JSON from the output
      const jsonMatch = output.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return [];
      }

      const parsed: unknown = JSON.parse(jsonMatch[0]);
      
      // Validate structure without type assertions
      if (typeof parsed !== 'object' || parsed === null) {
        return [];
      }
      
      const obj = parsed as { issues?: unknown };
      const issuesProperty = obj.issues;
      if (!Array.isArray(issuesProperty)) {
        return [];
      }

      const issues: Issue[] = [];
      for (const item of issuesProperty) {
        if (typeof item !== 'object' || item === null) {
          continue;
        }
        
        const issue = item as Record<string, unknown>;
        const severityValue = issue.severity;
        const messageValue = issue.message;
        const fileValue = issue.file;
        const lineValue = issue.line;
        const confidenceValue = issue.confidence;
        
        const severity = this.parseSeverity(
          typeof severityValue === 'string' ? severityValue : undefined
        );
        const message = typeof messageValue === 'string' ? messageValue : 'Unknown issue';
        const file = typeof fileValue === 'string' ? fileValue : undefined;
        const line = typeof lineValue === 'number' ? lineValue : undefined;
        const confidence = typeof confidenceValue === 'number' ? confidenceValue : 0.5;
        
        if (file !== undefined && line !== undefined) {
          issues.push({
            severity,
            message,
            file,
            line,
            confidence,
          });
        }
      }
      
      return issues;
    } catch {
      // If parsing fails, return empty array
      return [];
    }
  }
  
  private parseSeverity(severity: string | undefined): Severity {
    if (severity === 'error' || severity === 'warning' || severity === 'notice') {
      return severity;
    }
    return 'warning';
  }
}