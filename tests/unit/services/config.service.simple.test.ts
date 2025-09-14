import { ConfigService } from '../../../src/services/config.service';
import fs from 'fs';
import path from 'path';
import os from 'os';

describe('ConfigService - Simple Tests', () => {
  let configService: ConfigService;
  let tempDir: string;
  let tempConfigPath: string;

  beforeEach(() => {
    configService = new ConfigService();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oni-test-'));
    tempConfigPath = path.join(tempDir, '.onenote2notionrc');
  });

  afterEach(() => {
    // Clean up temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('loadConfig', () => {
    it('should return default config when file does not exist', async () => {
      const config = await configService.loadConfig(tempConfigPath);
      
      expect(config).toEqual({
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
      });
    });

    it('should load existing config file', async () => {
      const testConfig = {
        notion: { workspaceId: 'test-workspace' },
        export: { outputDirectory: './custom-export' },
      };
      
      fs.writeFileSync(tempConfigPath, JSON.stringify(testConfig, null, 2));

      const config = await configService.loadConfig(tempConfigPath);
      
      expect(config.notion.workspaceId).toBe('test-workspace');
      expect(config.export.outputDirectory).toBe('./custom-export');
      // Should merge with defaults
      expect(config.export.defaultFormat).toBe('markdown');
    });

    it('should handle JSON parse errors gracefully', async () => {
      fs.writeFileSync(tempConfigPath, 'invalid json');

      const config = await configService.loadConfig(tempConfigPath);
      
      // Should return default config on parse error
      expect(config.export.outputDirectory).toBe('./exported');
    });
  });

  describe('saveConfig', () => {
    it('should save config to file', async () => {
      const config = {
        notion: { workspaceId: 'test-workspace' },
        export: { outputDirectory: './exported', defaultFormat: 'markdown' as const, preserveStructure: true, includeMetadata: true },
        logging: { level: 'info' as const, file: './logs/app.log' },
      };

      await configService.saveConfig(config, tempConfigPath);

      expect(fs.existsSync(tempConfigPath)).toBe(true);
      
      const savedConfig = JSON.parse(fs.readFileSync(tempConfigPath, 'utf8'));
      expect(savedConfig.notion.workspaceId).toBe('test-workspace');
    });
  });

  describe('setConfigValue', () => {
    it('should set nested config value', async () => {
      const config = {
        notion: { workspaceId: 'old-workspace' },
        export: { outputDirectory: './exported', defaultFormat: 'markdown' as const, preserveStructure: true, includeMetadata: true },
        logging: { level: 'info' as const, file: './logs/app.log' },
      };

      fs.writeFileSync(tempConfigPath, JSON.stringify(config, null, 2));

      await configService.setConfigValue('notion.workspaceId', 'new-workspace', tempConfigPath);

      const updatedConfig = JSON.parse(fs.readFileSync(tempConfigPath, 'utf8'));
      expect(updatedConfig.notion.workspaceId).toBe('new-workspace');
    });
  });

  describe('getConfigValue', () => {
    it('should get nested config value', async () => {
      const config = {
        notion: { workspaceId: 'test-workspace' },
        export: { outputDirectory: './exported', defaultFormat: 'markdown' as const, preserveStructure: true, includeMetadata: true },
        logging: { level: 'info' as const, file: './logs/app.log' },
      };

      fs.writeFileSync(tempConfigPath, JSON.stringify(config, null, 2));

      const value = await configService.getConfigValue('notion.workspaceId', tempConfigPath);
      expect(value).toBe('test-workspace');
    });

    it('should return undefined for non-existent key', async () => {
      const config = {
        notion: { workspaceId: 'test-workspace' },
        export: { outputDirectory: './exported', defaultFormat: 'markdown' as const, preserveStructure: true, includeMetadata: true },
        logging: { level: 'info' as const, file: './logs/app.log' },
      };

      fs.writeFileSync(tempConfigPath, JSON.stringify(config, null, 2));

      const value = await configService.getConfigValue('notion.nonExistentKey', tempConfigPath);
      expect(value).toBeUndefined();
    });
  });
});
