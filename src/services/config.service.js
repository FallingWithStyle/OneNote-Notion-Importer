"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigService = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
const logger_1 = require("../utils/logger");
class ConfigService {
    constructor() {
        this.defaultConfig = {
            notion: {},
            export: {
                outputDirectory: './exported',
                defaultFormat: 'markdown',
                preserveStructure: true,
                includeMetadata: true,
            },
            logging: {
                level: 'info',
                file: './logs/app.log',
            },
        };
        // Load environment variables from .env file
        this.loadEnvironmentVariables();
        this.configPath = this.getConfigPath();
    }
    loadEnvironmentVariables() {
        // Try to load .env file from current directory first, then project root
        const envPaths = [
            path_1.default.join(process.cwd(), '.env'),
            path_1.default.join(__dirname, '../../.env'),
            path_1.default.join(__dirname, '../../../.env')
        ];
        for (const envPath of envPaths) {
            if (fs_1.default.existsSync(envPath)) {
                dotenv_1.default.config({ path: envPath });
                logger_1.logger.debug(`Loaded environment variables from ${envPath}`);
                break;
            }
        }
    }
    getConfigPath(customPath) {
        if (customPath) {
            return path_1.default.resolve(customPath);
        }
        // Look for config in current directory, then home directory
        const localConfig = path_1.default.join(process.cwd(), '.onirc');
        const homeConfig = path_1.default.join(process.env.HOME || process.env.USERPROFILE || '', '.onirc');
        if (fs_1.default.existsSync(localConfig)) {
            return localConfig;
        }
        return homeConfig;
    }
    async loadConfig(customPath) {
        const configFile = customPath ? path_1.default.resolve(customPath) : this.configPath;
        let userConfig = {};
        try {
            if (fs_1.default.existsSync(configFile)) {
                const configData = fs_1.default.readFileSync(configFile, 'utf8');
                userConfig = JSON.parse(configData);
            }
            else {
                logger_1.logger.warn(`Configuration file not found at ${configFile}. Using defaults and environment variables.`);
            }
            // Merge with default config
            const mergedConfig = this.mergeConfig(this.defaultConfig, userConfig);
            // Override with environment variables if they exist
            return this.applyEnvironmentOverrides(mergedConfig);
        }
        catch (error) {
            logger_1.logger.error(`Error loading configuration: ${error}`);
            return this.applyEnvironmentOverrides(this.defaultConfig);
        }
    }
    async saveConfig(config, customPath) {
        const configFile = customPath ? path_1.default.resolve(customPath) : this.configPath;
        try {
            const configDir = path_1.default.dirname(configFile);
            if (!fs_1.default.existsSync(configDir)) {
                fs_1.default.mkdirSync(configDir, { recursive: true });
            }
            fs_1.default.writeFileSync(configFile, JSON.stringify(config, null, 2));
            logger_1.logger.info(`Configuration saved to ${configFile}`);
        }
        catch (error) {
            logger_1.logger.error(`Error saving configuration: ${error}`);
            throw error;
        }
    }
    async initConfig(customPath) {
        const configFile = customPath ? path_1.default.resolve(customPath) : this.configPath;
        await this.saveConfig(this.defaultConfig, configFile);
    }
    async setConfigValue(key, value, customPath) {
        const config = await this.loadConfig(customPath);
        const keys = key.split('.');
        let current = config;
        for (let i = 0; i < keys.length - 1; i++) {
            const currentKey = keys[i];
            if (currentKey && !current[currentKey]) {
                current[currentKey] = {};
            }
            if (currentKey) {
                current = current[currentKey];
            }
        }
        const lastKey = keys[keys.length - 1];
        if (lastKey) {
            current[lastKey] = value;
        }
        await this.saveConfig(config, customPath);
    }
    async getConfigValue(key, customPath) {
        const config = await this.loadConfig(customPath);
        const keys = key.split('.');
        let current = config;
        for (const k of keys) {
            if (current && typeof current === 'object' && k in current) {
                current = current[k];
            }
            else {
                return undefined;
            }
        }
        return current;
    }
    mergeConfig(defaultConfig, userConfig) {
        return {
            notion: { ...defaultConfig.notion, ...userConfig.notion },
            export: { ...defaultConfig.export, ...userConfig.export },
            logging: { ...defaultConfig.logging, ...userConfig.logging },
        };
    }
    applyEnvironmentOverrides(config) {
        const overriddenConfig = { ...config };
        // Override Notion configuration from environment variables
        if (process.env.NOTION_API_KEY) {
            overriddenConfig.notion.apiKey = process.env.NOTION_API_KEY;
        }
        if (process.env.NOTION_WORKSPACE_ID) {
            overriddenConfig.notion.workspaceId = process.env.NOTION_WORKSPACE_ID;
        }
        if (process.env.NOTION_DATABASE_ID) {
            overriddenConfig.notion.databaseId = process.env.NOTION_DATABASE_ID;
        }
        // Override export configuration from environment variables
        if (process.env.OUTPUT_DIR) {
            overriddenConfig.export.outputDirectory = process.env.OUTPUT_DIR;
        }
        // Override logging configuration from environment variables
        if (process.env.LOG_LEVEL && ['error', 'warn', 'info', 'debug'].includes(process.env.LOG_LEVEL)) {
            overriddenConfig.logging.level = process.env.LOG_LEVEL;
        }
        return overriddenConfig;
    }
}
exports.ConfigService = ConfigService;
//# sourceMappingURL=config.service.js.map