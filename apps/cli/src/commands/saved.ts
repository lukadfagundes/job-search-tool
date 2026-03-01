import { Command } from 'commander';
import chalk from 'chalk';
import Table from 'cli-table3';
import open from 'open';
import { getSavedJobs, removeSavedJob } from '@job-hunt/core';
import { createInterface } from 'node:readline';

export const savedCommand = new Command('saved')
  .description('View and manage saved/bookmarked jobs')
  .option('--remove <jobId>', 'Remove a saved job by its ID')
  .action(async (opts) => {
    if (opts.remove) {
      const removed = await removeSavedJob(opts.remove);
      if (removed) {
        console.log(chalk.green(`  Removed job ${opts.remove}`));
      } else {
        console.log(chalk.yellow(`  Job ${opts.remove} not found in saved jobs.`));
      }
      return;
    }

    const savedJobs = await getSavedJobs();

    if (savedJobs.length === 0) {
      console.log(
        chalk.yellow('\n  No saved jobs yet. Use the search command to find and save jobs.\n')
      );
      return;
    }

    const table = new Table({
      head: [
        chalk.bold('#'),
        chalk.bold('Title'),
        chalk.bold('Company'),
        chalk.bold('Location'),
        chalk.bold('Saved On'),
        chalk.bold('Notes'),
      ],
      colWidths: [4, 30, 20, 18, 14, 20],
      wordWrap: true,
    });

    savedJobs.forEach((saved, i) => {
      const job = saved.job;
      table.push([
        String(i + 1),
        job.job_title,
        job.employer_name,
        job.job_city ? `${job.job_city}, ${job.job_state}` : job.job_country || 'N/A',
        new Date(saved.savedAt).toLocaleDateString(),
        saved.notes ?? chalk.dim('—'),
      ]);
    });

    console.log(chalk.bold('\n  Saved Jobs:\n'));
    console.log(table.toString());

    // Interactive menu
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const ask = (question: string): Promise<string> =>
      new Promise((resolve) => rl.question(question, resolve));

    console.log(
      chalk.cyan("\n  Enter a number to open apply link, 'r<n>' to remove, or 'q' to quit")
    );

    let running = true;
    while (running) {
      const input = (await ask(chalk.bold('\n> '))).trim().toLowerCase();

      if (input === 'q' || input === 'quit') {
        running = false;
      } else if (input.startsWith('r')) {
        const num = parseInt(input.slice(1), 10);
        if (num >= 1 && num <= savedJobs.length) {
          const job = savedJobs[num - 1].job;
          await removeSavedJob(job.job_id);
          console.log(chalk.green(`  Removed: ${job.job_title} at ${job.employer_name}`));
        } else {
          console.log(chalk.red('  Invalid job number.'));
        }
      } else {
        const num = parseInt(input, 10);
        if (num >= 1 && num <= savedJobs.length) {
          const job = savedJobs[num - 1].job;
          console.log(chalk.blue(`  Opening apply link for: ${job.job_title}...`));
          await open(job.job_apply_link);
        } else {
          console.log(chalk.red("  Invalid input. Enter a number, 'r<n>', or 'q'."));
        }
      }
    }

    rl.close();
  });
