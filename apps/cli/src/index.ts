#!/usr/bin/env node

import { config } from 'dotenv';
import { resolve } from 'node:path';
import { Command } from 'commander';
import { searchCommand } from './commands/search.js';
import { savedCommand } from './commands/saved.js';
import { profilesCommand } from './commands/profiles.js';
import { quotaCommand } from './commands/quota.js';

// Load .env from project root
config({ path: resolve(import.meta.dirname, '../../../.env') });

const program = new Command()
  .name('job-hunt')
  .description('Personal job search tool powered by JSearch API')
  .version('1.0.0');

program.addCommand(searchCommand);
program.addCommand(savedCommand);
program.addCommand(profilesCommand);
program.addCommand(quotaCommand);

program.parse();
