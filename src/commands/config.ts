import { Command } from 'commander';
import { logger } from '../utils/logger';
import { ConfigService } from '../services/config.service';
import { CommandHelpers } from '../utils/command-helpers';

const configCommand = new Command('config');

configCommand
  .description('Manage configuration settings')
  .option('-i, --init', 'Initialize configuration file')
  .option('-s, --set <key=value>', 'Set a configuration value')
  .option('-g, --get <key>', 'Get a configuration value')
  .option('-l, --list', 'List all configuration values')
  .option('-v, --validate', 'Validate configuration settings')
  .option('-c, --config <path>', 'Path to configuration file')
  .action(async (options) => {
    try {
      const configService = new ConfigService();
      
      if (options.init) {
        logger.info('Initializing configuration file...');
        await configService.initConfig(options.config);
        logger.info('Configuration file created successfully!');
        return;
      }

      if (options.set) {
        const [key, value] = options.set.split('=');
        if (!key || !value) {
          logger.error('Invalid format. Use: --set key=value');
          throw new Error('Invalid format. Use: --set key=value');
        }
        await configService.setConfigValue(key, value, options.config);
        logger.info(`Set ${key} = ${value}`);
        return;
      }

      if (options.get) {
        const value = await configService.getConfigValue(options.get, options.config);
        logger.info(`${options.get} = ${value || 'not set'}`);
        return;
      }

      if (options.list) {
        const config = await configService.loadConfig(options.config);
        logger.info('Current configuration:');
        logger.info(JSON.stringify(config, null, 2));
        return;
      }

      if (options.validate) {
        logger.info('Validating configuration...');
        const config = await configService.loadConfig(options.config);
        
        const validationErrors: string[] = [];
        
        // Validate Notion configuration
        if (!config.notion?.apiKey) {
          validationErrors.push('Notion API key is required (notion.apiKey)');
        }
        if (!config.notion?.workspaceId) {
          validationErrors.push('Notion workspace ID is required (notion.workspaceId)');
        }
        
        // Validate export configuration
        if (!config.export?.outputDirectory) {
          validationErrors.push('Export output directory is required (export.outputDirectory)');
        }
        
        if (validationErrors.length > 0) {
          const errorMessage = `Configuration validation failed\n${validationErrors.map(error => `  - ${error}`).join('\n')}`;
          logger.error(errorMessage);
          throw new Error(errorMessage);
        } else {
          logger.info('Configuration is valid!');
        }
        return;
      }

      // Show help if no options provided
      configCommand.help();
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Config failed: ${errorMessage}`);
      process.exit(1);
    }
  });

export { configCommand };
