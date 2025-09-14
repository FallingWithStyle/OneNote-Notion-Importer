import { Command } from 'commander';
import { logger } from '../utils/logger';
import { ConfigService } from '../services/config.service';

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
      logger.info('Starting OneNote import process...');
      
      // Set log level based on verbose flag
      if (options.verbose) {
        logger.level = 'debug';
      }

      // Load configuration
      const configService = new ConfigService();
      const config = await configService.loadConfig(options.config);

      // Validate required options
      if (!options.file) {
        logger.error('OneNote file path is required. Use -f or --file option.');
        throw new Error('OneNote file path is required');
      }

      if (!options.workspace && !config.notion.workspaceId) {
        logger.error('Notion workspace ID is required. Use -w or --workspace option or set in config.');
        throw new Error('Notion workspace ID is required');
      }

      logger.info(`Importing from: ${options.file}`);
      logger.info(`Target workspace: ${options.workspace || config.notion.workspaceId}`);
      
      if (options.dryRun) {
        logger.info('DRY RUN MODE: No actual import will be performed');
      }

      // TODO: Implement actual import logic
      logger.info('Import process completed successfully!');
      
    } catch (error) {
      logger.error('Import failed:', error);
      throw error;
    }
  });

export { importCommand };
