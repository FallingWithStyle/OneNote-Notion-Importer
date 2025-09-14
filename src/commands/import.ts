import { Command } from 'commander';
import { logger } from '../utils/logger';
import { CommandHelpers } from '../utils/command-helpers';

const importCommand = new Command('import');

importCommand
  .description('Import OneNote content to Notion')
  .option('-f, --file <path>', 'Path to OneNote file (.onepkg or .one)')
  .option('-w, --workspace <id>', 'Notion workspace ID')
  .option('-d, --database <id>', 'Notion database ID')
  .option('-c, --config <path>', 'Path to configuration file')
  .option('--dry-run', 'Preview what would be imported without actually importing')
  .option('--verbose', 'Enable verbose logging')
  .action(async (options) => {
    try {
      CommandHelpers.logCommandStart('import', 'import');
      CommandHelpers.setupVerboseLogging(options);

      // Load configuration
      const configService = await CommandHelpers.loadConfiguration(options.config);
      const config = await configService.loadConfig(options.config);

      // Validate required options
      CommandHelpers.validateFilePath(options.file, 'import');
      CommandHelpers.validateWorkspaceId(options.workspace, config.notion.workspaceId);

      logger.info(`Importing from: ${options.file}`);
      logger.info(`Target workspace: ${options.workspace || config.notion.workspaceId}`);
      
      if (options.dryRun) {
        CommandHelpers.logDryRunMode();
      }

      // TODO: Implement actual import logic
      CommandHelpers.logCommandSuccess('import', 'Import');
      
    } catch (error) {
      CommandHelpers.handleCommandError(error, 'Import');
    }
  });

export { importCommand };
