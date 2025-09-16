"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandHelpers = void 0;
const logger_1 = require("./logger");
const config_service_1 = require("../services/config.service");
/**
 * Common command utilities to reduce duplication across commands
 */
class CommandHelpers {
    /**
     * Sets up verbose logging if the verbose flag is enabled
     */
    static setupVerboseLogging(options) {
        if (options.verbose) {
            logger_1.logger.level = 'debug';
        }
    }
    /**
     * Creates and loads configuration with error handling
     */
    static async loadConfiguration(configPath) {
        const configService = new config_service_1.ConfigService();
        await configService.loadConfig(configPath);
        return configService;
    }
    /**
     * Validates that a required file path is provided
     */
    static validateFilePath(filePath, commandName) {
        if (!filePath) {
            const errorMessage = `OneNote file path is required. Use -f or --file option.`;
            logger_1.logger.error(errorMessage);
            throw new Error(errorMessage);
        }
    }
    /**
     * Validates that a workspace ID is provided (either via option or config)
     */
    static validateWorkspaceId(workspaceId, configWorkspaceId) {
        if (!workspaceId && !configWorkspaceId) {
            const errorMessage = 'Notion workspace ID is required. Use -w or --workspace option or set in config.';
            logger_1.logger.error(errorMessage);
            throw new Error(errorMessage);
        }
    }
    /**
     * Handles command errors with consistent logging and re-throwing
     */
    static handleCommandError(error, commandName) {
        logger_1.logger.error(`${commandName} failed:`, error);
        throw error;
    }
    /**
     * Logs command start information
     */
    static logCommandStart(commandName, processName) {
        logger_1.logger.info(`Starting OneNote ${processName} process...`);
    }
    /**
     * Logs command completion
     */
    static logCommandSuccess(commandName, processName) {
        logger_1.logger.info(`${processName} process completed successfully!`);
    }
    /**
     * Logs dry run mode
     */
    static logDryRunMode() {
        logger_1.logger.info('DRY RUN MODE: No actual import will be performed');
    }
}
exports.CommandHelpers = CommandHelpers;
//# sourceMappingURL=command-helpers.js.map