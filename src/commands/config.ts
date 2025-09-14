import { Command } from 'commander';
import { logger } from '../utils/logger';
import { ConfigService } from '../services/config.service';

const configCommand = new Command('config');

configCommand
  .description('Manage configuration settings')
  .option('-i, --init', 'Initialize configuration file')
  .option('-s, --set <key=value>', 'Set a configuration value')
  .option('-g, --get <key>', 'Get a configuration value')
  .option('-l, --list', 'List all configuration values')
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

      // Show help if no options provided
      configCommand.help();
      
    } catch (error) {
      logger.error('Config command failed:', error);
      throw error;
    }
  });

export { configCommand };
