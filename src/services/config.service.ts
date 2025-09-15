import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { logger } from '../utils/logger';

export interface NotionConfig {
  workspaceId?: string | undefined;
  databaseId?: string | undefined;
  apiKey?: string | undefined;
}

export interface ExportConfig {
  outputDirectory: string;
  defaultFormat: 'markdown' | 'docx' | 'json';
  preserveStructure: boolean;
  includeMetadata: boolean;
}

export interface AppConfig {
  notion: NotionConfig;
  export: ExportConfig;
  logging: {
    level: 'error' | 'warn' | 'info' | 'debug';
    file: string;
  };
}

export class ConfigService {
  private defaultConfig: AppConfig = {
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

  private configPath: string;

  constructor() {
    // Load environment variables from .env file
    this.loadEnvironmentVariables();
    this.configPath = this.getConfigPath();
  }

  private loadEnvironmentVariables(): void {
    // Try to load .env file from current directory first, then project root
    const envPaths = [
      path.join(process.cwd(), '.env'),
      path.join(__dirname, '../../.env'),
      path.join(__dirname, '../../../.env')
    ];

    for (const envPath of envPaths) {
      if (fs.existsSync(envPath)) {
        dotenv.config({ path: envPath });
        logger.debug(`Loaded environment variables from ${envPath}`);
        break;
      }
    }
  }

  private getConfigPath(customPath?: string): string {
    if (customPath) {
      return path.resolve(customPath);
    }
    
    // Look for config in current directory, then home directory
    const localConfig = path.join(process.cwd(), '.onirc');
    const homeConfig = path.join(process.env.HOME || process.env.USERPROFILE || '', '.onirc');
    
    if (fs.existsSync(localConfig)) {
      return localConfig;
    }
    
    return homeConfig;
  }

  async loadConfig(customPath?: string): Promise<AppConfig> {
    const configFile = customPath ? path.resolve(customPath) : this.configPath;
    let userConfig: Partial<AppConfig> = {};
    
    try {
      if (fs.existsSync(configFile)) {
        const configData = fs.readFileSync(configFile, 'utf8');
        userConfig = JSON.parse(configData);
      } else {
        logger.warn(`Configuration file not found at ${configFile}. Using defaults and environment variables.`);
      }
      
      // Merge with default config
      const mergedConfig = this.mergeConfig(this.defaultConfig, userConfig);
      
      // Override with environment variables if they exist
      return this.applyEnvironmentOverrides(mergedConfig);
    } catch (error) {
      logger.error(`Error loading configuration: ${error}`);
      return this.applyEnvironmentOverrides(this.defaultConfig);
    }
  }

  async saveConfig(config: AppConfig, customPath?: string): Promise<void> {
    const configFile = customPath ? path.resolve(customPath) : this.configPath;
    
    try {
      const configDir = path.dirname(configFile);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
      
      fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
      logger.info(`Configuration saved to ${configFile}`);
    } catch (error) {
      logger.error(`Error saving configuration: ${error}`);
      throw error;
    }
  }

  async initConfig(customPath?: string): Promise<void> {
    const configFile = customPath ? path.resolve(customPath) : this.configPath;
    await this.saveConfig(this.defaultConfig, configFile);
  }

  async setConfigValue(key: string, value: string, customPath?: string): Promise<void> {
    const config = await this.loadConfig(customPath);
    const keys = key.split('.');
    
    let current: any = config;
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

  async getConfigValue(key: string, customPath?: string): Promise<any> {
    const config = await this.loadConfig(customPath);
    const keys = key.split('.');
    
    let current: any = config;
    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        return undefined;
      }
    }
    
    return current;
  }

  private mergeConfig(defaultConfig: AppConfig, userConfig: Partial<AppConfig>): AppConfig {
    return {
      notion: { ...defaultConfig.notion, ...userConfig.notion },
      export: { ...defaultConfig.export, ...userConfig.export },
      logging: { ...defaultConfig.logging, ...userConfig.logging },
    };
  }

  public applyEnvironmentOverrides(config: AppConfig): AppConfig {
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
      overriddenConfig.logging.level = process.env.LOG_LEVEL as 'error' | 'warn' | 'info' | 'debug';
    }

    return overriddenConfig;
  }
}
