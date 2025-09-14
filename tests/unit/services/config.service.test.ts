import fs from 'fs';
import path from 'path';
import { ConfigService, AppConfig } from '../../../src/services/config.service';
import { logger } from '../../../src/utils/logger';

// Mock fs module
jest.mock('fs');
const mockedFs = fs as jest.Mocked<typeof fs>;

// Mock logger
jest.mock('../../../src/utils/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('ConfigService', () => {
  let configService: ConfigService;
  const mockConfigPath = '/mock/config/path/.onenote2notionrc';
  const mockConfigDir = '/mock/config/path';

  beforeEach(() => {
    jest.clearAllMocks();
    configService = new ConfigService();
    
    // Mock path methods
    jest.spyOn(path, 'resolve').mockReturnValue(mockConfigPath);
    jest.spyOn(path, 'join').mockImplementation((...args) => args.join('/'));
    jest.spyOn(path, 'dirname').mockReturnValue(mockConfigDir);
  });

  describe('loadConfig', () => {
    it('should load existing config file', async () => {
      const mockConfig = {
        notion: { workspaceId: 'test-workspace' },
        export: { outputDirectory: './custom-export' },
      };
      
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));

      const result = await configService.loadConfig();

      expect(mockedFs.existsSync).toHaveBeenCalledWith(mockConfigPath);
      expect(mockedFs.readFileSync).toHaveBeenCalledWith(mockConfigPath, 'utf8');
      expect(result.notion.workspaceId).toBe('test-workspace');
      expect(result.export.outputDirectory).toBe('./custom-export');
    });

    it('should return default config when file does not exist', async () => {
      mockedFs.existsSync.mockReturnValue(false);

      const result = await configService.loadConfig();

      expect(logger.warn).toHaveBeenCalledWith(`Configuration file not found at ${mockConfigPath}. Using defaults.`);
      expect(result).toEqual({
        notion: { workspaceId: undefined, databaseId: undefined, apiKey: undefined },
        export: { outputDirectory: './exported', defaultFormat: 'markdown', preserveStructure: true, includeMetadata: true },
        logging: { level: 'info', file: './logs/app.log' },
      });
    });

    it('should handle JSON parse errors', async () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue('invalid json');

      const result = await configService.loadConfig();

      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Error loading configuration: SyntaxError'));
      expect(result).toEqual({
        notion: { workspaceId: undefined, databaseId: undefined, apiKey: undefined },
        export: { outputDirectory: './exported', defaultFormat: 'markdown', preserveStructure: true, includeMetadata: true },
        logging: { level: 'info', file: './logs/app.log' },
      });
    });
  });

  describe('saveConfig', () => {
    it('should save config to file', async () => {
      const config: AppConfig = {
        notion: { workspaceId: 'test-workspace' },
        export: { outputDirectory: './exported', defaultFormat: 'markdown', preserveStructure: true, includeMetadata: true },
        logging: { level: 'info', file: './logs/app.log' },
      };

      mockedFs.existsSync.mockReturnValue(false);
      mockedFs.mkdirSync.mockImplementation(() => undefined);
      mockedFs.writeFileSync.mockImplementation(() => undefined);

      await configService.saveConfig(config);

      expect(mockedFs.mkdirSync).toHaveBeenCalledWith(mockConfigDir, { recursive: true });
      expect(mockedFs.writeFileSync).toHaveBeenCalledWith(mockConfigPath, JSON.stringify(config, null, 2));
      expect(logger.info).toHaveBeenCalledWith(`Configuration saved to ${mockConfigPath}`);
    });

    it('should handle save errors', async () => {
      const config: AppConfig = {
        notion: { workspaceId: 'test-workspace' },
        export: { outputDirectory: './exported', defaultFormat: 'markdown', preserveStructure: true, includeMetadata: true },
        logging: { level: 'info', file: './logs/app.log' },
      };

      mockedFs.existsSync.mockReturnValue(false);
      mockedFs.mkdirSync.mockImplementation(() => undefined);
      mockedFs.writeFileSync.mockImplementation(() => {
        throw new Error('Write error');
      });

      await expect(configService.saveConfig(config)).rejects.toThrow('Write error');
      expect(logger.error).toHaveBeenCalledWith('Error saving configuration: Error: Write error');
    });
  });

  describe('setConfigValue', () => {
    it('should set nested config value', async () => {
      const mockConfig = {
        notion: { workspaceId: 'old-workspace' },
        export: { outputDirectory: './exported' },
        logging: { level: 'info' },
      };

      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));
      mockedFs.writeFileSync.mockImplementation(() => undefined);

      await configService.setConfigValue('notion.workspaceId', 'new-workspace');

      expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
        mockConfigPath,
        expect.stringContaining('"workspaceId": "new-workspace"')
      );
    });
  });

  describe('getConfigValue', () => {
    it('should get nested config value', async () => {
      const mockConfig = {
        notion: { workspaceId: 'test-workspace' },
        export: { outputDirectory: './exported' },
      };

      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));

      const result = await configService.getConfigValue('notion.workspaceId');

      expect(result).toBe('test-workspace');
    });

    it('should return undefined for non-existent key', async () => {
      const mockConfig = {
        notion: { workspaceId: 'test-workspace' },
      };

      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));

      const result = await configService.getConfigValue('notion.nonExistentKey');

      expect(result).toBeUndefined();
    });
  });
});
