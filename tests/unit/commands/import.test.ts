import { importCommand } from '../../../src/commands/import';
import { logger } from '../../../src/utils/logger';

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
jest.mock('../../../src/services/config.service', () => ({
  ConfigService: jest.fn().mockImplementation(() => ({
    loadConfig: jest.fn().mockResolvedValue({
      notion: { workspaceId: 'test-workspace' },
      export: { outputDirectory: './exported' },
      logging: { level: 'info' },
    }),
  })),
}));

describe('Import Command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should require file path option', async () => {
    await expect(importCommand.parseAsync(['import'])).rejects.toThrow('OneNote file path is required');
    expect(logger.error).toHaveBeenCalledWith(
      'OneNote file path is required. Use -f or --file option.'
    );
  });

  it('should require workspace ID when not in config', async () => {
    // Mock ConfigService to return config without workspaceId
    const { ConfigService } = require('../../../src/services/config.service');
    const mockLoadConfig = jest.fn().mockResolvedValue({
      notion: {},
      export: { outputDirectory: './exported' },
      logging: { level: 'info' },
    });
    ConfigService.mockImplementation(() => ({
      loadConfig: mockLoadConfig,
    }));

    await expect(importCommand.parseAsync(['import', '-f', 'test.onepkg'])).rejects.toThrow('Notion workspace ID is required');
    expect(logger.error).toHaveBeenCalledWith(
      'Notion workspace ID is required. Use -w or --workspace option or set in config.'
    );
  });

  it('should set debug level when verbose flag is provided', async () => {
    // Reset the mock to use default config
    const { ConfigService } = require('../../../src/services/config.service');
    ConfigService.mockImplementation(() => ({
      loadConfig: jest.fn().mockResolvedValue({
        notion: { workspaceId: 'test-workspace' },
        export: { outputDirectory: './exported' },
        logging: { level: 'info' },
      }),
    }));

    await importCommand.parseAsync(['import', '-f', 'test.onepkg', '-w', 'workspace-id', '--verbose']);
    
    expect(logger.level).toBe('debug');
  });

  it('should log dry run mode when dry-run flag is provided', async () => {
    // Reset the mock to use default config
    const { ConfigService } = require('../../../src/services/config.service');
    ConfigService.mockImplementation(() => ({
      loadConfig: jest.fn().mockResolvedValue({
        notion: { workspaceId: 'test-workspace' },
        export: { outputDirectory: './exported' },
        logging: { level: 'info' },
      }),
    }));

    await importCommand.parseAsync(['import', '-f', 'test.onepkg', '-w', 'workspace-id', '--dry-run']);
    
    expect(logger.info).toHaveBeenCalledWith('DRY RUN MODE: No actual import will be performed');
  });

  it('should log successful completion', async () => {
    // Reset the mock to use default config
    const { ConfigService } = require('../../../src/services/config.service');
    ConfigService.mockImplementation(() => ({
      loadConfig: jest.fn().mockResolvedValue({
        notion: { workspaceId: 'test-workspace' },
        export: { outputDirectory: './exported' },
        logging: { level: 'info' },
      }),
    }));

    await importCommand.parseAsync(['import', '-f', 'test.onepkg', '-w', 'workspace-id']);
    
    expect(logger.info).toHaveBeenCalledWith('Starting OneNote import process...');
    expect(logger.info).toHaveBeenCalledWith('Import process completed successfully!');
  });
});
