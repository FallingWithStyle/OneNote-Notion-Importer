import { exportCommand } from '../../../src/commands/export';
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

describe('Export Command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should require file path option', async () => {
    await expect(exportCommand.parseAsync(['export'])).rejects.toThrow('OneNote file path is required');
    expect(logger.error).toHaveBeenCalledWith(
      'OneNote file path is required. Use -f or --file option.'
    );
  });

  it('should use default output directory when not specified', async () => {
    await exportCommand.parseAsync(['export', '-f', 'test.onepkg']);
    
    expect(logger.info).toHaveBeenCalledWith('Exporting from: test.onepkg');
    expect(logger.info).toHaveBeenCalledWith('Output directory: ./exported');
  });

  it('should use custom output directory when specified', async () => {
    await exportCommand.parseAsync(['export', '-f', 'test.onepkg', '-o', '/custom/output']);
    
    expect(logger.info).toHaveBeenCalledWith('Output directory: /custom/output');
  });

  it('should use default format when not specified', async () => {
    await exportCommand.parseAsync(['export', '-f', 'test.onepkg']);
    
    expect(logger.info).toHaveBeenCalledWith('Export format: markdown');
  });

  it('should use custom format when specified', async () => {
    await exportCommand.parseAsync(['export', '-f', 'test.onepkg', '--format', 'docx']);
    
    expect(logger.info).toHaveBeenCalledWith('Export format: docx');
  });

  it('should set debug level when verbose flag is provided', async () => {
    await exportCommand.parseAsync(['export', '-f', 'test.onepkg', '--verbose']);
    
    expect(logger.level).toBe('debug');
  });

  it('should log successful completion', async () => {
    await exportCommand.parseAsync(['export', '-f', 'test.onepkg']);
    
    expect(logger.info).toHaveBeenCalledWith('Starting OneNote export process...');
    expect(logger.info).toHaveBeenCalledWith('Export process completed successfully!');
  });
});
