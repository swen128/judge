import type { Reporter, CheckResults, JsonReportOutput, JsonRuleResult, JsonIssue } from '../types/index.js';

export class JsonReporter implements Reporter {
  report(results: CheckResults): string {
    const output: JsonReportOutput = {
      version: '1.0',
      timestamp: results.endTime.toISOString(),
      config: {
        provider: results.config.provider,
        rulesCount: results.config.rule_bindings.length,
      },
      results: {
        rules: results.rules.map(rule => this.formatRuleResult(rule)),
        summary: {
          totalRules: results.summary.totalRules,
          totalIssues: results.summary.totalIssues,
          issuesBySeverity: results.summary.issuesBySeverity,
          duration: results.summary.duration,
          passed: results.summary.passed,
          rulesWithErrors: results.summary.rulesWithErrors,
        },
      },
    };

    return JSON.stringify(output, null, 2);
  }

  private formatRuleResult(rule: CheckResults['rules'][0]): JsonRuleResult {
    return {
      name: rule.ruleBinding.name,
      description: rule.ruleBinding.name, // We removed description field, so use name
      issues: rule.issues.map(issue => this.formatIssue(issue)),
      stats: {
        filesChecked: rule.filesChecked,
        duration: rule.duration,
      },
      error: rule.error,
    };
  }

  private formatIssue(issue: CheckResults['rules'][0]['issues'][0]): JsonIssue {
    const result: JsonIssue = {
      severity: issue.severity,
      message: issue.message,
      confidence: issue.confidence,
    };

    if (issue.file !== undefined) {
      result.location = {
        file: issue.file,
        line: issue.line,
        column: issue.column,
      };
    }

    return result;
  }
}