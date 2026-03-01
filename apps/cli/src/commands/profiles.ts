import { Command } from 'commander';
import chalk from 'chalk';
import Table from 'cli-table3';
import {
  getProfiles,
  getProfile,
  removeProfile,
  JSearchClient,
  RateLimitError,
  applyPostFilters,
  deduplicateJobs,
  markJobsSeen,
} from '@job-hunt/core';
import open from 'open';
import { createInterface } from 'node:readline';

function getApiKey(): string {
  const key = process.env.RAPIDAPI_KEY;
  if (!key) {
    console.error(chalk.red('Error: RAPIDAPI_KEY not set.'));
    process.exit(1);
  }
  return key;
}

const listProfiles = new Command('list')
  .description('List all saved search profiles')
  .action(async () => {
    const profiles = await getProfiles();

    if (profiles.length === 0) {
      console.log(
        chalk.yellow(
          "\n  No profiles saved yet. Use 'job-hunt search --save <name>' to create one.\n"
        )
      );
      return;
    }

    const table = new Table({
      head: [
        chalk.bold('#'),
        chalk.bold('Name'),
        chalk.bold('Query'),
        chalk.bold('Remote'),
        chalk.bold('Type'),
        chalk.bold('Created'),
      ],
      colWidths: [4, 18, 30, 8, 16, 14],
      wordWrap: true,
    });

    profiles.forEach((profile, i) => {
      table.push([
        String(i + 1),
        profile.name,
        profile.params.query,
        profile.params.remote_jobs_only ? chalk.green('Yes') : chalk.dim('No'),
        profile.params.employment_types ?? chalk.dim('Any'),
        new Date(profile.createdAt).toLocaleDateString(),
      ]);
    });

    console.log(chalk.bold('\n  Saved Profiles:\n'));
    console.log(table.toString());
  });

const runProfile = new Command('run')
  .description('Run a saved search profile')
  .argument('<name>', 'Profile name to run')
  .action(async (name: string) => {
    const profile = await getProfile(name);

    if (!profile) {
      console.log(chalk.red(`\n  Profile "${name}" not found.\n`));
      const profiles = await getProfiles();
      if (profiles.length > 0) {
        console.log(chalk.dim(`  Available profiles: ${profiles.map((p) => p.name).join(', ')}`));
      }
      return;
    }

    const apiKey = getApiKey();
    const client = new JSearchClient(apiKey);

    console.log(chalk.blue(`\n  Running profile "${name}": "${profile.params.query}"...\n`));

    try {
      const response = await client.search(profile.params);
      let jobs = response.data ?? [];
      jobs = deduplicateJobs(jobs);
      if (profile.filters) {
        jobs = applyPostFilters(jobs, profile.filters);
      }
      await markJobsSeen(jobs.map((j) => j.job_id));

      const quota = await client.getQuotaStatus();
      console.log(
        chalk.dim(
          `  Quota: ${quota.weeklyRemaining}/${quota.weeklyLimit} weekly, ` +
            `${quota.monthlyRemaining}/${quota.monthlyLimit} monthly remaining\n`
        )
      );

      if (jobs.length === 0) {
        console.log(chalk.yellow('  No results found.\n'));
        return;
      }

      // Display results table
      const table = new Table({
        head: [
          chalk.bold('#'),
          chalk.bold('Title'),
          chalk.bold('Company'),
          chalk.bold('Location'),
          chalk.bold('Source'),
        ],
        colWidths: [4, 30, 20, 20, 12],
        wordWrap: true,
      });

      jobs.forEach((job, i) => {
        table.push([
          String(i + 1),
          job.job_title,
          job.employer_name,
          job.job_city ? `${job.job_city}, ${job.job_state}` : job.job_country || 'N/A',
          job.job_publisher,
        ]);
      });

      console.log(table.toString());
      console.log(chalk.dim(`\n  ${jobs.length} results\n`));

      // Quick interactive
      const rl = createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      const ask = (q: string): Promise<string> => new Promise((resolve) => rl.question(q, resolve));

      console.log(chalk.cyan("  Enter a number to open apply link, or 'q' to quit"));

      let running = true;
      while (running) {
        const input = (await ask(chalk.bold('\n> '))).trim().toLowerCase();
        if (input === 'q') {
          running = false;
        } else {
          const num = parseInt(input, 10);
          if (num >= 1 && num <= jobs.length) {
            await open(jobs[num - 1].job_apply_link);
          } else {
            console.log(chalk.red('  Invalid input.'));
          }
        }
      }
      rl.close();
    } catch (error) {
      if (error instanceof RateLimitError) {
        console.error(chalk.red(`\n  ${error.message}`));
        const q = error.quota;
        console.error(chalk.yellow(`  Weekly:  ${q.weeklyUsed}/${q.weeklyLimit} used`));
        console.error(chalk.yellow(`  Monthly: ${q.monthlyUsed}/${q.monthlyLimit} used`));
        process.exit(1);
      }
      console.error(
        chalk.red(`  Error: ${error instanceof Error ? error.message : String(error)}`)
      );
      process.exit(1);
    }
  });

const deleteProfile = new Command('delete')
  .description('Delete a saved profile')
  .argument('<name>', 'Profile name to delete')
  .action(async (name: string) => {
    const removed = await removeProfile(name);
    if (removed) {
      console.log(chalk.green(`  Profile "${name}" deleted.`));
    } else {
      console.log(chalk.yellow(`  Profile "${name}" not found.`));
    }
  });

export const profilesCommand = new Command('profiles')
  .description('Manage saved search profiles')
  .addCommand(listProfiles)
  .addCommand(runProfile)
  .addCommand(deleteProfile);
