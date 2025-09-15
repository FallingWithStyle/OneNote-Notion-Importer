import { Command } from 'commander';
import { exportCommand } from '../../../src/commands/export';
import { logger } from '../../../src/utils/logger';
import { CommandHelpers } from '../../../src/utils/command-helpers';

// Mock dependencies
jest.mock('../../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('../../../src/utils/command-helpers', () => ({
  CommandHelpers: {
    logCommandStart: jest.fn(),
    setupVerboseLogging: jest.fn(),
    loadConfiguration: jest.fn(),
    validateFilePath: jest.fn(),
    logCommandSuccess: jest.fn(),
    handleCommandError: jest.fn(),
  },
}));

describe('Export Command', () => {
  let mockConfigService: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockConfigService = {
      loadConfig: jest.fn().mockResolvedValue({
        export: { outputDirectory: './default-export' },
      }),
    };
    (CommandHelpers.loadConfiguration as jest.Mock).mockResolvedValue(mockConfigService);
  });

  describe('Command Definition', () => {
    it('should be a valid Commander command', () => {
      expect(exportCommand).toBeInstanceOf(Command);
      expect(exportCommand.name()).toBe('export');
    });

    it('should have correct description', () => {
      expect(exportCommand.description()).toBe('Export OneNote content to various formats');
    });

    it('should have all required options', () => {
      const options = exportCommand.options;
      const optionNames = options.map((opt: any) => opt.long);
      
      expect(optionNames).toContain('--file');
      expect(optionNames).toContain('--output');
      expect(optionNames).toContain('--format');
      expect(optionNames).toContain('--config');
      expect(optionNames).toContain('--verbose');
    });
  });

  describe('Command Execution', () => {
    it('should execute export command with all options', async () => {
      const options = {
        file: '/path/to/file.one',
        output: '/path/to/output',
        format: 'docx',
        config: '/path/to/config.json',
        verbose: true,
      };

      await exportCommand._actionHandler(options);

      expect(CommandHelpers.logCommandStart).toHaveBeenCalledWith('export', 'export');
      expect(CommandHelpers.setupVerboseLogging).toHaveBeenCalledWith(options);
      expect(CommandHelpers.loadConfiguration).toHaveBeenCalledWith('/path/to/config.json');
      expect(CommandHelpers.validateFilePath).toHaveBeenCalledWith('/path/to/file.one', 'export');
      expect(logger.info).toHaveBeenCalledWith('Exporting from: /path/to/file.one');
      expect(logger.info).toHaveBeenCalledWith('Output directory: /path/to/output');
      expect(logger.info).toHaveBeenCalledWith('Export format: docx');
      expect(CommandHelpers.logCommandSuccess).toHaveBeenCalledWith('export', 'Export');
    });

    it('should use default output directory when not provided', async () => {
      const options = {
        file: '/path/to/file.one',
        format: 'markdown',
      };

      await exportCommand._actionHandler(options);

      expect(logger.info).toHaveBeenCalledWith('Output directory: ./default-export');
    });

    it('should use default format when not provided', async () => {
      const options = {
        file: '/path/to/file.one',
        output: '/path/to/output',
      };

      await exportCommand._actionHandler(options);

      expect(logger.info).toHaveBeenCalledWith('Export format: markdown');
    });

    it('should use config output directory when no output option provided', async () => {
      const options = {
        file: '/path/to/file.one',
      };

      await exportCommand._actionHandler(options);

      expect(logger.info).toHaveBeenCalledWith('Output directory: ./default-export');
    });

    it('should prioritize output option over config', async () => {
      const options = {
        file: '/path/to/file.one',
        output: '/path/to/custom-output',
      };

      await exportCommand._actionHandler(options);

      expect(logger.info).toHaveBeenCalledWith('Output directory: /path/to/custom-output');
    });
  });

  describe('Error Handling', () => {
    it('should handle errors from CommandHelpers', async () => {
      const error = new Error('Validation error');
      (CommandHelpers.validateFilePath as jest.Mock).mockImplementation(() => {
        throw error;
      });

      const options = {
        file: '/path/to/file.one',
        output: '/path/to/output',
      };

      await exportCommand._actionHandler(options);

      expect(CommandHelpers.handleCommandError).toHaveBeenCalledWith(error, 'Export');
    });

    it('should handle errors from config loading', async () => {
      const error = new Error('Config loading error');
      (CommandHelpers.loadConfiguration as jest.Mock).mockRejectedValue(error);

      const options = {
        file: '/path/to/file.one',
        output: '/path/to/output',
      };

      await exportCommand._actionHandler(options);

      expect(CommandHelpers.handleCommandError).toHaveBeenCalledWith(error, 'Export');
    });
  });

  describe('Option Validation', () => {
    it('should validate file path is required', async () => {
      const options = {
        output: '/path/to/output',
      };

      await exportCommand._actionHandler(options);

      expect(CommandHelpers.validateFilePath).toHaveBeenCalledWith(undefined, 'export');
    });
  });

  describe('Logging', () => {
    it('should log export details', async () => {
      const options = {
        file: '/path/to/file.one',
        output: '/path/to/output',
        format: 'json',
      };

      await exportCommand._actionHandler(options);

      expect(logger.info).toHaveBeenCalledWith('Exporting from: /path/to/file.one');
      expect(logger.info).toHaveBeenCalledWith('Output directory: /path/to/output');
      expect(logger.info).toHaveBeenCalledWith('Export format: json');
    });

    it('should log command start and success', async () => {
      const options = {
        file: '/path/to/file.one',
        output: '/path/to/output',
      };

      await exportCommand._actionHandler(options);

      expect(CommandHelpers.logCommandStart).toHaveBeenCalledWith('export', 'export');
      expect(CommandHelpers.logCommandSuccess).toHaveBeenCalledWith('export', 'Export');
    });
  });

  describe('Format Options', () => {
    it('should handle markdown format', async () => {
      const options = {
        file: '/path/to/file.one',
        output: '/path/to/output',
        format: 'markdown',
      };

      await exportCommand._actionHandler(options);

      expect(logger.info).toHaveBeenCalledWith('Export format: markdown');
    });

    it('should handle docx format', async () => {
      const options = {
        file: '/path/to/file.one',
        output: '/path/to/output',
        format: 'docx',
      };

      await exportCommand._actionHandler(options);

      expect(logger.info).toHaveBeenCalledWith('Export format: docx');
    });

    it('should handle json format', async () => {
      const options = {
        file: '/path/to/file.one',
        output: '/path/to/output',
        format: 'json',
      };

      await exportCommand._actionHandler(options);

      expect(logger.info).toHaveBeenCalledWith('Export format: json');
    });
  });
});
