"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigService = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
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
        this.configPath = this.getConfigPath();
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
        try {
            if (fs_1.default.existsSync(configFile)) {
                const configData = fs_1.default.readFileSync(configFile, 'utf8');
                const userConfig = JSON.parse(configData);
                // Merge with default config
                return this.mergeConfig(this.defaultConfig, userConfig);
            }
            logger_1.logger.warn(`Configuration file not found at ${configFile}. Using defaults.`);
            return this.defaultConfig;
        }
        catch (error) {
            logger_1.logger.error(`Error loading configuration: ${error}`);
            return this.defaultConfig;
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
}
exports.ConfigService = ConfigService;
//# sourceMappingURL=config.service.js.map