import { configCommand } from '../../../src/commands/config';
import { logger } from '../../../src/utils/logger';
import { ConfigService } from '../../../src/services/config.service';

// Mock the logger
jest.mock('../../../src/utils/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    level: 'info',
  },
}));

// Mock the ConfigService
const mockConfigService = {
  initConfig: jest.fn(),
  setConfigValue: jest.fn(),
  getConfigValue: jest.fn(),
  loadConfig: jest.fn(),
};

jest.mock('../../../src/services/config.service', () => ({
  ConfigService: jest.fn().mockImplementation(() => mockConfigService),
}));

describe('Config Command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize config when --init flag is provided', async () => {
    mockConfigService.initConfig.mockResolvedValue(undefined);

    await configCommand.parseAsync(['config', '--init']);
    
    expect(mockConfigService.initConfig).toHaveBeenCalledWith(undefined);
    expect(logger.info).toHaveBeenCalledWith('Configuration file created successfully!');
  });

  it('should set config value when --set flag is provided', async () => {
    mockConfigService.setConfigValue.mockResolvedValue(undefined);

    await configCommand.parseAsync(['config', '--set', 'notion.workspaceId=test-workspace']);
    
    expect(mockConfigService.setConfigValue).toHaveBeenCalledWith('notion.workspaceId', 'test-workspace', undefined);
    expect(logger.info).toHaveBeenCalledWith('Set notion.workspaceId = test-workspace');
  });

  it('should get config value when --get flag is provided', async () => {
    mockConfigService.getConfigValue.mockResolvedValue('test-value');

    await configCommand.parseAsync(['config', '--get', 'notion.workspaceId']);
    
    expect(mockConfigService.getConfigValue).toHaveBeenCalledWith('notion.workspaceId', undefined);
    expect(logger.info).toHaveBeenCalledWith('notion.workspaceId = test-value');
  });

  it('should list all config values when --list flag is provided', async () => {
    const mockConfig = {
      notion: { workspaceId: 'test-workspace' },
      export: { outputDirectory: './exported' },
    };
    mockConfigService.loadConfig.mockResolvedValue(mockConfig);

    await configCommand.parseAsync(['config', '--list']);
    
    expect(mockConfigService.loadConfig).toHaveBeenCalledWith(undefined);
    expect(logger.info).toHaveBeenCalledWith('Current configuration:');
    expect(logger.info).toHaveBeenCalledWith(JSON.stringify(mockConfig, null, 2));
  });

  it('should show help when no options are provided', async () => {
    const mockHelp = jest.fn().mockImplementation(() => {
      throw new Error('help called');
    });
    configCommand.help = mockHelp as any;

    await expect(configCommand.parseAsync(['config'])).rejects.toThrow('help called');
  });

  it('should handle invalid --set format', async () => {
    await expect(configCommand.parseAsync(['config', '--set', 'invalid-format'])).rejects.toThrow('Invalid format. Use: --set key=value');
    expect(logger.error).toHaveBeenCalledWith('Invalid format. Use: --set key=value');
  });
});
