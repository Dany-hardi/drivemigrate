#!/usr/bin/env node
import 'dotenv/config';
import { program } from 'commander';
import chalk from 'chalk';
import { migrate } from './migrate.js';

console.log(chalk.green.bold('\n  drivemigrate') + chalk.gray(' — Google Drive migration tool\n'));

program
  .name('drivemigrate')
  .description('Migrate files between Google Drive accounts from the terminal.')
  .version('1.0.0');

program
  .command('run')
  .description('Start an interactive migration')
  .option('--all', 'Migrate all files without prompting')
  .option('--folder <name>', 'Migrate a specific folder by name')
  .action(migrate);

program.parse();
