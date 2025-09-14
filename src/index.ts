#!/usr/bin/env node

import { Command } from 'commander';
import { logger } from './utils/logger';
import { version } from '../package.json';

const program = new Command();

program
  .name('oni')
  .description('OneNote to Notion Importer (ONI) - A powerful CLI tool for migrating OneNote content to Notion')
  .version(version);

// Import command modules
import { importCommand } from './commands/import';
import { exportCommand } from './commands/export';
import { configCommand } from './commands/config';

// Register commands
program.addCommand(importCommand);
program.addCommand(exportCommand);
program.addCommand(configCommand);

// Global error handling
program.exitOverride();

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Parse command line arguments
try {
  program.parse();
} catch (error) {
  logger.error('Command failed:', error);
  process.exit(1);
}
