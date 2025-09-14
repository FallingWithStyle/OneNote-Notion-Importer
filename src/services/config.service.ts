import fs from 'fs';
import path from 'path';
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
    this.configPath = this.getConfigPath();
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
    
    try {
      if (fs.existsSync(configFile)) {
        const configData = fs.readFileSync(configFile, 'utf8');
        const userConfig = JSON.parse(configData);
        
        // Merge with default config
        return this.mergeConfig(this.defaultConfig, userConfig);
      }
      
      logger.warn(`Configuration file not found at ${configFile}. Using defaults.`);
      return this.defaultConfig;
    } catch (error) {
      logger.error(`Error loading configuration: ${error}`);
      return this.defaultConfig;
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
}
