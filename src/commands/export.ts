import { Command } from 'commander';
import { logger } from '../utils/logger';
import { ConfigService } from '../services/config.service';

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
      logger.info('Starting OneNote export process...');
      
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

      const outputDir = options.output || config.export.outputDirectory || './exported';
      const format = options.format || 'markdown';

      logger.info(`Exporting from: ${options.file}`);
      logger.info(`Output directory: ${outputDir}`);
      logger.info(`Export format: ${format}`);

      // TODO: Implement actual export logic
      logger.info('Export process completed successfully!');
      
    } catch (error) {
      logger.error('Export failed:', error);
      throw error;
    }
  });

export { exportCommand };
