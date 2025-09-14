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
  const mockConfigPath = '/Users/patrick/.onirc';
  const mockConfigDir = '/Users/patrick';

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock process.cwd to return a predictable path
    jest.spyOn(process, 'cwd').mockReturnValue('/Users/patrick/Documents/Projects/OneNote To Notion Importer');
    
    // Mock path methods before creating ConfigService
    jest.spyOn(path, 'resolve').mockImplementation((...args: string[]): string => {
      if (args.length === 1) return args[0] || '';
      return args.join('/');
    });
    jest.spyOn(path, 'join').mockImplementation((...args) => args.join('/'));
    jest.spyOn(path, 'dirname').mockReturnValue(mockConfigDir);
    
    configService = new ConfigService();
  });

  describe('loadConfig', () => {
    it('should load existing config file', async () => {
      const mockConfig = {
        notion: { workspaceId: 'test-workspace' },
        export: { outputDirectory: './custom-export' },
      };
      
      // Mock existsSync to return false for local config, true for home config
      mockedFs.existsSync.mockImplementation((path) => {
        const pathStr = path.toString();
        if (pathStr.includes('/Users/patrick/Documents/Projects/OneNote To Notion Importer/.onirc')) {
          return false; // Local config doesn't exist
        }
        if (pathStr.includes('/Users/patrick/.onirc')) {
          return true; // Home config exists
        }
        return false;
      });
      mockedFs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));

      const result = await configService.loadConfig();

      expect(mockedFs.existsSync).toHaveBeenCalledWith('/Users/patrick/Documents/Projects/OneNote To Notion Importer/.onirc');
      expect(mockedFs.existsSync).toHaveBeenCalledWith('/Users/patrick/.onirc');
      expect(mockedFs.readFileSync).toHaveBeenCalledWith('/Users/patrick/.onirc', 'utf8');
      expect(result.notion.workspaceId).toBe('test-workspace');
      expect(result.export.outputDirectory).toBe('./custom-export');
    });

    it('should return default config when file does not exist', async () => {
      mockedFs.existsSync.mockReturnValue(false);

      const result = await configService.loadConfig();

      expect(logger.warn).toHaveBeenCalledWith(`Configuration file not found at /Users/patrick/.onirc. Using defaults.`);
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

      expect(mockedFs.mkdirSync).toHaveBeenCalledWith('/Users/patrick', { recursive: true });
      expect(mockedFs.writeFileSync).toHaveBeenCalledWith('/Users/patrick/Documents/Projects/OneNote To Notion Importer/.onirc', JSON.stringify(config, null, 2));
      expect(logger.info).toHaveBeenCalledWith(`Configuration saved to /Users/patrick/Documents/Projects/OneNote To Notion Importer/.onirc`);
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
