import { Command } from 'commander';
import { configCommand } from '../../../src/commands/config';
import { logger } from '../../../src/utils/logger';
import { ConfigService } from '../../../src/services/config.service';
import { CommandHelpers } from '../../../src/utils/command-helpers';

// Mock dependencies
jest.mock('../../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('../../../src/services/config.service', () => ({
  ConfigService: jest.fn().mockImplementation(() => ({
    initConfig: jest.fn(),
    setConfigValue: jest.fn(),
    getConfigValue: jest.fn(),
    loadConfig: jest.fn(),
  })),
}));

jest.mock('../../../src/utils/command-helpers', () => ({
  CommandHelpers: {
    handleCommandError: jest.fn(),
  },
}));

describe('Config Command', () => {
  let mockConfigService: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockConfigService = {
      initConfig: jest.fn(),
      setConfigValue: jest.fn(),
      getConfigValue: jest.fn(),
      loadConfig: jest.fn(),
    };
    (ConfigService as jest.Mock).mockReturnValue(mockConfigService);
  });

  describe('Command Definition', () => {
    it('should be a valid Commander command', () => {
      expect(configCommand).toBeInstanceOf(Command);
      expect(configCommand.name()).toBe('config');
    });

    it('should have correct description', () => {
      expect(configCommand.description()).toBe('Manage configuration settings');
    });

    it('should have all required options', () => {
      const options = configCommand.options;
      const optionNames = options.map((opt: any) => opt.long);
      
      expect(optionNames).toContain('--init');
      expect(optionNames).toContain('--set');
      expect(optionNames).toContain('--get');
      expect(optionNames).toContain('--list');
      expect(optionNames).toContain('--config');
    });
  });

  describe('Init Option', () => {
    it('should initialize config file when --init is provided', async () => {
      const options = { init: true, config: '/path/to/config' };
      
      await configCommand._actionHandler(options);
      
      expect(logger.info).toHaveBeenCalledWith('Initializing configuration file...');
      expect(mockConfigService.initConfig).toHaveBeenCalledWith('/path/to/config');
      expect(logger.info).toHaveBeenCalledWith('Configuration file created successfully!');
    });

    it('should initialize config file with default path when no config path provided', async () => {
      const options = { init: true };
      
      await configCommand._actionHandler(options);
      
      expect(mockConfigService.initConfig).toHaveBeenCalledWith(undefined);
    });
  });

  describe('Set Option', () => {
    it('should set config value when --set is provided with valid format', async () => {
      const options = { set: 'key=value', config: '/path/to/config' };
      
      await configCommand._actionHandler(options);
      
      expect(mockConfigService.setConfigValue).toHaveBeenCalledWith('key', 'value', '/path/to/config');
      expect(logger.info).toHaveBeenCalledWith('Set key = value');
    });

    it('should throw error for invalid set format', async () => {
      const options = { set: 'invalidformat' };
      
      await configCommand._actionHandler(options);
      
      expect(logger.error).toHaveBeenCalledWith('Invalid format. Use: --set key=value');
      expect(CommandHelpers.handleCommandError).toHaveBeenCalled();
    });

    it('should throw error for missing key in set format', async () => {
      const options = { set: '=value' };
      
      await configCommand._actionHandler(options);
      
      expect(logger.error).toHaveBeenCalledWith('Invalid format. Use: --set key=value');
      expect(CommandHelpers.handleCommandError).toHaveBeenCalled();
    });

    it('should throw error for missing value in set format', async () => {
      const options = { set: 'key=' };
      
      await configCommand._actionHandler(options);
      
      expect(logger.error).toHaveBeenCalledWith('Invalid format. Use: --set key=value');
      expect(CommandHelpers.handleCommandError).toHaveBeenCalled();
    });
  });

  describe('Get Option', () => {
    it('should get config value when --get is provided', async () => {
      mockConfigService.getConfigValue.mockResolvedValue('test-value');
      const options = { get: 'test-key', config: '/path/to/config' };
      
      await configCommand._actionHandler(options);
      
      expect(mockConfigService.getConfigValue).toHaveBeenCalledWith('test-key', '/path/to/config');
      expect(logger.info).toHaveBeenCalledWith('test-key = test-value');
    });

    it('should show "not set" when config value is undefined', async () => {
      mockConfigService.getConfigValue.mockResolvedValue(undefined);
      const options = { get: 'nonexistent-key' };
      
      await configCommand._actionHandler(options);
      
      expect(logger.info).toHaveBeenCalledWith('nonexistent-key = not set');
    });
  });

  describe('List Option', () => {
    it('should list all config values when --list is provided', async () => {
      const mockConfig = { key1: 'value1', key2: 'value2' };
      mockConfigService.loadConfig.mockResolvedValue(mockConfig);
      const options = { list: true, config: '/path/to/config' };
      
      await configCommand._actionHandler(options);
      
      expect(mockConfigService.loadConfig).toHaveBeenCalledWith('/path/to/config');
      expect(logger.info).toHaveBeenCalledWith('Current configuration:');
      expect(logger.info).toHaveBeenCalledWith(JSON.stringify(mockConfig, null, 2));
    });
  });

  describe('No Options', () => {
    it('should show help when no options are provided', async () => {
      const options = {};
      const helpSpy = jest.spyOn(configCommand, 'help').mockImplementation();
      
      await configCommand._actionHandler(options);
      
      expect(helpSpy).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle errors from ConfigService', async () => {
      const error = new Error('Config service error');
      mockConfigService.initConfig.mockRejectedValue(error);
      const options = { init: true };
      
      await configCommand._actionHandler(options);
      
      expect(CommandHelpers.handleCommandError).toHaveBeenCalledWith(error, 'Config');
    });
  });
});
