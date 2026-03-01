import { Command } from 'commander';
import chalk from 'chalk';
import { getQuotaStatus } from '@job-hunt/core';

export const quotaCommand = new Command('quota')
  .description('Show API usage quota')
  .action(async () => {
    const q = await getQuotaStatus();

    console.log(chalk.bold('\n  API Quota Status:\n'));
    console.log(
      `  Weekly:  ${q.weeklyUsed}/${q.weeklyLimit} used (${q.weeklyRemaining} remaining)`
    );
    console.log(
      `  Monthly: ${q.monthlyUsed}/${q.monthlyLimit} used (${q.monthlyRemaining} remaining)`
    );

    if (q.weeklyResetsAt) {
      const diffMs = new Date(q.weeklyResetsAt).getTime() - Date.now();
      const diffHours = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60)));
      console.log(chalk.dim(`\n  Weekly quota frees a slot in ~${diffHours}h`));
    }
    if (q.monthlyResetsAt) {
      const diffMs = new Date(q.monthlyResetsAt).getTime() - Date.now();
      const diffDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      console.log(chalk.dim(`  Monthly quota frees a slot in ~${diffDays}d`));
    }
    console.log();
  });
