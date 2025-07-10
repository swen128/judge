import chalk from 'chalk';
import type { Reporter, CheckResults } from '../types/index.js';

export class StdoutReporter implements Reporter {
  report(results: CheckResults): string {
    const lines: string[] = [];
    
    lines.push(chalk.bold('🔍 Judge Semantic Check Results\n'));
    
    // Report each rule's results
    for (const rule of results.rules) {
      lines.push(chalk.blue(`📋 ${rule.ruleBinding.name}`));
      
      if (rule.error !== undefined) {
        lines.push(chalk.red(`   ❌ Error: ${rule.error}`));
        continue;
      }
      
      if (rule.issues.length === 0) {
        lines.push(chalk.green(`   ✅ No issues found (${rule.filesChecked} files checked)`));
      } else {
        lines.push(chalk.yellow(`   ⚠️  ${rule.issues.length} issues found:`));
        
        for (const issue of rule.issues) {
          const location = issue.file !== undefined
            ? chalk.cyan(`${issue.file}:${issue.line ?? '?'}`)
            : chalk.gray('unknown');
          
          const icon = issue.severity === 'error' ? '❌' : 
                       issue.severity === 'warning' ? '⚠️' : 'ℹ️';
          
          const severityColor = issue.severity === 'error' ? chalk.red :
                               issue.severity === 'warning' ? chalk.yellow :
                               chalk.blue;
          
          lines.push(`      ${icon} ${location}: ${severityColor(issue.message)}`);
          
          if (issue.confidence < 1) {
            lines.push(chalk.gray(`         Confidence: ${(issue.confidence * 100).toFixed(0)}%`));
          }
        }
      }
      
      lines.push('');
    }
    
    // Summary
    lines.push(chalk.bold('📊 Summary:'));
    lines.push(`   Total rule bindings: ${results.summary.totalRules}`);
    lines.push(`   Total issues: ${results.summary.totalIssues}`);
    
    if (results.summary.totalIssues > 0) {
      lines.push(`   By severity:`);
      lines.push(chalk.red(`     Errors: ${results.summary.issuesBySeverity.error}`));
      lines.push(chalk.yellow(`     Warnings: ${results.summary.issuesBySeverity.warning}`));
      lines.push(chalk.blue(`     Notices: ${results.summary.issuesBySeverity.notice}`));
    }
    
    const duration = (results.summary.duration / 1000).toFixed(2);
    lines.push(`   Duration: ${duration}s`);
    
    if (results.summary.rulesWithErrors > 0) {
      lines.push(chalk.red(`   Rules with errors: ${results.summary.rulesWithErrors}`));
    }
    
    const status = results.summary.passed 
      ? chalk.green.bold('✅ PASSED')
      : chalk.red.bold('❌ FAILED');
    lines.push(`   Status: ${status}`);
    
    return lines.join('\n');
  }
}