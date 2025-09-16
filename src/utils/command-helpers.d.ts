import { ConfigService } from '../services/config.service';
/**
 * Common command utilities to reduce duplication across commands
 */
export declare class CommandHelpers {
    /**
     * Sets up verbose logging if the verbose flag is enabled
     */
    static setupVerboseLogging(options: {
        verbose?: boolean;
    }): void;
    /**
     * Creates and loads configuration with error handling
     */
    static loadConfiguration(configPath?: string): Promise<ConfigService>;
    /**
     * Validates that a required file path is provided
     */
    static validateFilePath(filePath: string | undefined, commandName: string): void;
    /**
     * Validates that a workspace ID is provided (either via option or config)
     */
    static validateWorkspaceId(workspaceId: string | undefined, configWorkspaceId: string | undefined): void;
    /**
     * Handles command errors with consistent logging and re-throwing
     */
    static handleCommandError(error: unknown, commandName: string): never;
    /**
     * Logs command start information
     */
    static logCommandStart(commandName: string, processName: string): void;
    /**
     * Logs command completion
     */
    static logCommandSuccess(commandName: string, processName: string): void;
    /**
     * Logs dry run mode
     */
    static logDryRunMode(): void;
}
//# sourceMappingURL=command-helpers.d.ts.map