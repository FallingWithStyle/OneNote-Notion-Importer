import { CommandHelpers } from '../../../src/utils/command-helpers';
import { logger } from '../../../src/utils/logger';
import { ConfigService } from '../../../src/services/config.service';

// Mock the logger
jest.mock('../../../src/utils/logger', () => ({
  logger: {
    level: 'info',
    error: jest.fn(),
    info: jest.fn(),
  },
}));

// Mock the ConfigService
jest.mock('../../../src/services/config.service', () => ({
  ConfigService: jest.fn().mockImplementation(() => ({
    loadConfig: jest.fn(),
  })),
}));

describe('CommandHelpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('setupVerboseLogging', () => {
    it('should set logger level to debug when verbose is true', () => {
      CommandHelpers.setupVerboseLogging({ verbose: true });
      expect(logger.level).toBe('debug');
    });

    it('should not change logger level when verbose is false', () => {
      const originalLevel = logger.level;
      CommandHelpers.setupVerboseLogging({ verbose: false });
      expect(logger.level).toBe(originalLevel);
    });

    it('should not change logger level when verbose is undefined', () => {
      const originalLevel = logger.level;
      CommandHelpers.setupVerboseLogging({});
      expect(logger.level).toBe(originalLevel);
    });
  });

  describe('loadConfiguration', () => {
    it('should create and return ConfigService instance', async () => {
      const mockConfigService = { loadConfig: jest.fn() };
      (ConfigService as jest.Mock).mockReturnValue(mockConfigService);

      const result = await CommandHelpers.loadConfiguration();
      
      expect(ConfigService).toHaveBeenCalled();
      expect(mockConfigService.loadConfig).toHaveBeenCalledWith(undefined);
      expect(result).toBe(mockConfigService);
    });

    it('should pass config path to loadConfig', async () => {
      const mockConfigService = { loadConfig: jest.fn() };
      (ConfigService as jest.Mock).mockReturnValue(mockConfigService);
      const configPath = '/path/to/config';

      await CommandHelpers.loadConfiguration(configPath);
      
      expect(mockConfigService.loadConfig).toHaveBeenCalledWith(configPath);
    });
  });

  describe('validateFilePath', () => {
    it('should not throw when file path is provided', () => {
      expect(() => {
        CommandHelpers.validateFilePath('/path/to/file', 'test');
      }).not.toThrow();
    });

    it('should throw error when file path is undefined', () => {
      expect(() => {
        CommandHelpers.validateFilePath(undefined, 'test');
      }).toThrow('OneNote file path is required. Use -f or --file option.');
    });

    it('should throw error when file path is empty string', () => {
      expect(() => {
        CommandHelpers.validateFilePath('', 'test');
      }).toThrow('OneNote file path is required. Use -f or --file option.');
    });

    it('should log error when file path is missing', () => {
      try {
        CommandHelpers.validateFilePath(undefined, 'test');
      } catch (error) {
        // Expected to throw
      }
      expect(logger.error).toHaveBeenCalledWith('OneNote file path is required. Use -f or --file option.');
    });
  });

  describe('validateWorkspaceId', () => {
    it('should not throw when workspace ID is provided via option', () => {
      expect(() => {
        CommandHelpers.validateWorkspaceId('workspace-123', undefined);
      }).not.toThrow();
    });

    it('should not throw when workspace ID is provided via config', () => {
      expect(() => {
        CommandHelpers.validateWorkspaceId(undefined, 'workspace-123');
      }).not.toThrow();
    });

    it('should not throw when both workspace ID and config ID are provided', () => {
      expect(() => {
        CommandHelpers.validateWorkspaceId('workspace-123', 'config-workspace-123');
      }).not.toThrow();
    });

    it('should throw error when neither workspace ID nor config ID is provided', () => {
      expect(() => {
        CommandHelpers.validateWorkspaceId(undefined, undefined);
      }).toThrow('Notion workspace ID is required. Use -w or --workspace option or set in config.');
    });

    it('should log error when workspace ID is missing', () => {
      try {
        CommandHelpers.validateWorkspaceId(undefined, undefined);
      } catch (error) {
        // Expected to throw
      }
      expect(logger.error).toHaveBeenCalledWith('Notion workspace ID is required. Use -w or --workspace option or set in config.');
    });
  });

  describe('handleCommandError', () => {
    it('should log error and re-throw it', () => {
      const error = new Error('Test error');
      
      expect(() => {
        CommandHelpers.handleCommandError(error, 'TestCommand');
      }).toThrow('Test error');
      
      expect(logger.error).toHaveBeenCalledWith('TestCommand failed:', error);
    });

    it('should handle non-Error objects', () => {
      const error = 'String error';
      
      expect(() => {
        CommandHelpers.handleCommandError(error, 'TestCommand');
      }).toThrow();
      
      expect(logger.error).toHaveBeenCalledWith('TestCommand failed:', error);
    });
  });

  describe('logCommandStart', () => {
    it('should log command start message', () => {
      CommandHelpers.logCommandStart('import', 'import');
      expect(logger.info).toHaveBeenCalledWith('Starting OneNote import process...');
    });

    it('should log different process names', () => {
      CommandHelpers.logCommandStart('export', 'export');
      expect(logger.info).toHaveBeenCalledWith('Starting OneNote export process...');
    });
  });

  describe('logCommandSuccess', () => {
    it('should log command success message', () => {
      CommandHelpers.logCommandSuccess('import', 'Import');
      expect(logger.info).toHaveBeenCalledWith('Import process completed successfully!');
    });

    it('should log different process names', () => {
      CommandHelpers.logCommandSuccess('export', 'Export');
      expect(logger.info).toHaveBeenCalledWith('Export process completed successfully!');
    });
  });

  describe('logDryRunMode', () => {
    it('should log dry run mode message', () => {
      CommandHelpers.logDryRunMode();
      expect(logger.info).toHaveBeenCalledWith('DRY RUN MODE: No actual import will be performed');
    });
  });
});
