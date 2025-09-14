import { logger } from './logger';
import { ConfigService } from '../services/config.service';

/**
 * Common command utilities to reduce duplication across commands
 */
export class CommandHelpers {
  /**
   * Sets up verbose logging if the verbose flag is enabled
   */
  static setupVerboseLogging(options: { verbose?: boolean }): void {
    if (options.verbose) {
      logger.level = 'debug';
    }
  }

  /**
   * Creates and loads configuration with error handling
   */
  static async loadConfiguration(configPath?: string): Promise<ConfigService> {
    const configService = new ConfigService();
    await configService.loadConfig(configPath);
    return configService;
  }

  /**
   * Validates that a required file path is provided
   */
  static validateFilePath(filePath: string | undefined, commandName: string): void {
    if (!filePath) {
      const errorMessage = `OneNote file path is required. Use -f or --file option.`;
      logger.error(errorMessage);
      throw new Error(errorMessage);
    }
  }

  /**
   * Validates that a workspace ID is provided (either via option or config)
   */
  static validateWorkspaceId(
    workspaceId: string | undefined, 
    configWorkspaceId: string | undefined
  ): void {
    if (!workspaceId && !configWorkspaceId) {
      const errorMessage = 'Notion workspace ID is required. Use -w or --workspace option or set in config.';
      logger.error(errorMessage);
      throw new Error(errorMessage);
    }
  }

  /**
   * Handles command errors with consistent logging and re-throwing
   */
  static handleCommandError(error: unknown, commandName: string): never {
    logger.error(`${commandName} failed:`, error);
    throw error;
  }

  /**
   * Logs command start information
   */
  static logCommandStart(commandName: string, processName: string): void {
    logger.info(`Starting OneNote ${processName} process...`);
  }

  /**
   * Logs command completion
   */
  static logCommandSuccess(commandName: string, processName: string): void {
    logger.info(`${processName} process completed successfully!`);
  }

  /**
   * Logs dry run mode
   */
  static logDryRunMode(): void {
    logger.info('DRY RUN MODE: No actual import will be performed');
  }
}
