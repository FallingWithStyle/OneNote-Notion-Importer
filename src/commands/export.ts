import { Command } from 'commander';
import { logger } from '../utils/logger';
import { CommandHelpers } from '../utils/command-helpers';

const exportCommand = new Command('export');

exportCommand
  .description('Export OneNote content to various formats')
  .option('-f, --file <path>', 'Path to OneNote file (.onepkg or .one)')
  .option('-o, --output <path>', 'Output directory for exported files')
  .option('--format <format>', 'Export format (markdown, docx, json)', 'markdown')
  .option('-c, --config <path>', 'Path to configuration file')
  .option('--verbose', 'Enable verbose logging')
  .action(async (options) => {
    try {
      CommandHelpers.logCommandStart('export', 'export');
      CommandHelpers.setupVerboseLogging(options);

      // Load configuration
      const configService = await CommandHelpers.loadConfiguration(options.config);
      const config = await configService.loadConfig(options.config);

      // Validate required options
      CommandHelpers.validateFilePath(options.file, 'export');

      const outputDir = options.output || config.export.outputDirectory || './exported';
      const format = options.format || 'markdown';

      logger.info(`Exporting from: ${options.file}`);
      logger.info(`Output directory: ${outputDir}`);
      logger.info(`Export format: ${format}`);

      // TODO: Implement actual export logic
      CommandHelpers.logCommandSuccess('export', 'Export');
      
    } catch (error) {
      CommandHelpers.handleCommandError(error, 'Export');
    }
  });

export { exportCommand };
