import { Command } from 'commander';
import chalk from 'chalk';
import Table from 'cli-table3';
import open from 'open';
import {
  JSearchClient,
  applyPostFilters,
  deduplicateJobs,
  saveJob,
  saveProfile,
  markJobsSeen,
  type SearchParams,
  type PostFilterOptions,
  type JobResult,
} from '@job-hunt/core';
import { createInterface } from 'node:readline';

function getApiKey(): string {
  const key = process.env.RAPIDAPI_KEY;
  if (!key) {
    console.error(
      chalk.red('Error: RAPIDAPI_KEY not set. Create a .env file or set the environment variable.')
    );
    process.exit(1);
  }
  return key;
}

function formatSalary(job: JobResult): string {
  if (job.job_min_salary == null && job.job_max_salary == null) {
    return chalk.dim('N/A');
  }
  const currency = job.job_salary_currency ?? 'USD';
  const period = job.job_salary_period ?? 'YEAR';
  const min = job.job_min_salary ? `${currency} ${job.job_min_salary.toLocaleString()}` : '?';
  const max = job.job_max_salary ? `${currency} ${job.job_max_salary.toLocaleString()}` : '?';
  const periodLabel = period === 'YEAR' ? '/yr' : `/${period.toLowerCase()}`;
  return `${min} - ${max}${periodLabel}`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return chalk.green('Today');
  if (diffDays === 1) return chalk.green('Yesterday');
  if (diffDays <= 7) return chalk.yellow(`${diffDays}d ago`);
  return chalk.dim(`${diffDays}d ago`);
}

function displayResults(jobs: JobResult[]): void {
  if (jobs.length === 0) {
    console.log(chalk.yellow('\nNo jobs found matching your criteria.\n'));
    return;
  }

  const table = new Table({
    head: [
      chalk.bold('#'),
      chalk.bold('Title'),
      chalk.bold('Company'),
      chalk.bold('Location'),
      chalk.bold('Remote'),
      chalk.bold('Salary'),
      chalk.bold('Posted'),
      chalk.bold('Source'),
    ],
    colWidths: [4, 30, 20, 18, 8, 22, 12, 12],
    wordWrap: true,
  });

  jobs.forEach((job, i) => {
    table.push([
      String(i + 1),
      job.job_title,
      job.employer_name,
      job.job_city ? `${job.job_city}, ${job.job_state}` : job.job_country || 'N/A',
      job.job_is_remote ? chalk.green('Yes') : chalk.dim('No'),
      formatSalary(job),
      formatDate(job.job_posted_at_datetime_utc),
      job.job_publisher,
    ]);
  });

  console.log(table.toString());
  console.log(chalk.dim(`\n  Showing ${jobs.length} result${jobs.length !== 1 ? 's' : ''}`));
}

async function interactiveMenu(jobs: JobResult[]): Promise<void> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const ask = (question: string): Promise<string> =>
    new Promise((resolve) => rl.question(question, resolve));

  console.log(
    chalk.cyan("\n  Enter a number to open apply link, 's<n>' to save a job, or 'q' to quit")
  );

  let running = true;
  while (running) {
    const input = (await ask(chalk.bold('\n> '))).trim().toLowerCase();

    if (input === 'q' || input === 'quit') {
      running = false;
    } else if (input.startsWith('s')) {
      const num = parseInt(input.slice(1), 10);
      if (num >= 1 && num <= jobs.length) {
        const job = jobs[num - 1];
        await saveJob(job);
        console.log(chalk.green(`  Saved: ${job.job_title} at ${job.employer_name}`));
      } else {
        console.log(chalk.red('  Invalid job number.'));
      }
    } else {
      const num = parseInt(input, 10);
      if (num >= 1 && num <= jobs.length) {
        const job = jobs[num - 1];
        console.log(chalk.blue(`  Opening apply link for: ${job.job_title}...`));
        await open(job.job_apply_link);
      } else {
        console.log(chalk.red("  Invalid input. Enter a number, 's<n>', or 'q'."));
      }
    }
  }

  rl.close();
}

export const searchCommand = new Command('search')
  .description('Search for jobs')
  .argument('<query>', "Job search query (e.g. 'frontend engineer')")
  .option('-l, --location <loc>', "Location (e.g. 'San Francisco, CA')")
  .option('-r, --remote', 'Remote jobs only')
  .option('-t, --type <types>', 'Employment type: fulltime,parttime,contractor,intern')
  .option('-d, --date <period>', 'Date posted: today, 3days, week, month')
  .option('-e, --experience <level>', 'Experience: none, under3, over3, no_degree')
  .option('--min-salary <n>', 'Minimum salary (client-side filter)', parseInt)
  .option('--max-salary <n>', 'Maximum salary (client-side filter)', parseInt)
  .option('--include <keywords>', 'Required keywords in description (comma-separated)')
  .option('--exclude <keywords>', 'Excluded keywords in description (comma-separated)')
  .option('--exclude-companies <names>', 'Companies to hide (comma-separated)')
  .option('--direct-apply', 'Only show direct-apply jobs')
  .option('--pages <n>', 'Number of pages to fetch (default: 1)', parseInt)
  .option('--save <name>', 'Save this search as a named profile')
  .option('--open <n>', "Immediately open the Nth result's apply link", parseInt)
  .action(async (query: string, opts) => {
    const apiKey = getApiKey();
    const client = new JSearchClient(apiKey);

    // Build search params
    const searchParams: SearchParams = { query };
    if (opts.location) searchParams.query = `${query} in ${opts.location}`;
    if (opts.remote) searchParams.remote_jobs_only = true;
    if (opts.type) searchParams.employment_types = opts.type.toUpperCase();
    if (opts.date) searchParams.date_posted = opts.date;
    if (opts.experience) {
      const expMap: Record<string, string> = {
        none: 'no_experience',
        under3: 'under_3_years_experience',
        over3: 'more_than_3_years_experience',
        no_degree: 'no_degree',
      };
      searchParams.job_requirements = expMap[opts.experience] ?? opts.experience;
    }
    if (opts.pages) searchParams.num_pages = opts.pages;

    // Build post-filter options
    const postFilters: PostFilterOptions = {};
    if (opts.minSalary) postFilters.minSalary = opts.minSalary;
    if (opts.maxSalary) postFilters.maxSalary = opts.maxSalary;
    if (opts.include)
      postFilters.includeKeywords = opts.include.split(',').map((s: string) => s.trim());
    if (opts.exclude)
      postFilters.excludeKeywords = opts.exclude.split(',').map((s: string) => s.trim());
    if (opts.excludeCompanies)
      postFilters.excludeCompanies = opts.excludeCompanies.split(',').map((s: string) => s.trim());
    if (opts.directApply) postFilters.directApplyOnly = true;

    // Save profile if requested
    if (opts.save) {
      await saveProfile(opts.save, searchParams, postFilters);
      console.log(chalk.green(`  Profile "${opts.save}" saved.`));
    }

    // Execute search
    console.log(chalk.blue(`\n  Searching for "${query}"...\n`));

    try {
      const response = await client.search(searchParams);
      let jobs = response.data ?? [];

      // Deduplicate
      jobs = deduplicateJobs(jobs);

      // Apply post-filters
      jobs = applyPostFilters(jobs, postFilters);

      // Track seen jobs
      await markJobsSeen(jobs.map((j) => j.job_id));

      // Display quota info
      const remaining = client.getRemainingRequests();
      if (remaining !== null) {
        console.log(chalk.dim(`  API requests remaining: ${remaining}\n`));
      }

      // Display results
      displayResults(jobs);

      // Auto-open if requested
      if (opts.open && opts.open >= 1 && opts.open <= jobs.length) {
        const job = jobs[opts.open - 1];
        console.log(chalk.blue(`\n  Opening apply link for: ${job.job_title}...`));
        await open(job.job_apply_link);
        return;
      }

      // Interactive menu
      if (jobs.length > 0) {
        await interactiveMenu(jobs);
      }
    } catch (error) {
      console.error(
        chalk.red(`\n  Error: ${error instanceof Error ? error.message : String(error)}`)
      );
      process.exit(1);
    }
  });
