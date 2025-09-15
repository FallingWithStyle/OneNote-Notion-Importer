#!/usr/bin/env node

// Load environment variables early
import dotenv from 'dotenv';
import path from 'path';

// Try to load .env file from multiple locations
const envPaths = [
  path.join(process.cwd(), '.env'),
  path.join(__dirname, '../.env'),
  path.join(__dirname, '../../.env')
];

for (const envPath of envPaths) {
  try {
    if (require('fs').existsSync(envPath)) {
      dotenv.config({ path: envPath });
      break;
    }
  } catch (error) {
    // Continue to next path if this one fails
  }
}

import { Command } from 'commander';
import { logger } from './utils/logger';
import { version } from '../package.json';

// Import command modules
import { importCommand } from './commands/import';
import { exportCommand } from './commands/export';
import { configCommand } from './commands/config';

/**
 * Sets up global error handling for the CLI application
 */
function setupGlobalErrorHandling(): void {
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
  });
}

/**
 * Determines if an error should be treated as a successful exit (help/version)
 */
function isSuccessfulExitError(error: unknown): boolean {
  return error instanceof Error && 
         typeof error.message === 'string' && 
         (error.message.includes('outputHelp') || error.message.includes(version));
}

/**
 * Main CLI application entry point
 */
function main(): void {
  const program = new Command();

  // Configure the main program
  program
    .name('oni')
    .description('OneNote to Notion Importer (ONI) - A powerful CLI tool for migrating OneNote content to Notion')
    .version(version);

  // Register all commands
  program.addCommand(importCommand);
  program.addCommand(exportCommand);
  program.addCommand(configCommand);

  // Set up error handling
  program.exitOverride();
  setupGlobalErrorHandling();

  // Parse command line arguments
  try {
    program.parse();
  } catch (error) {
    if (isSuccessfulExitError(error)) {
      process.exit(0);
    }
    logger.error('Command failed:', error);
    process.exit(1);
  }
}

// Start the application
main();
