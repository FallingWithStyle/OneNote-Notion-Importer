import { Command } from 'commander';
import { importCommand } from '../../../src/commands/import';
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
    validateWorkspaceId: jest.fn(),
    logDryRunMode: jest.fn(),
    logCommandSuccess: jest.fn(),
    handleCommandError: jest.fn(),
  },
}));

describe('Import Command', () => {
  let mockConfigService: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockConfigService = {
      loadConfig: jest.fn().mockResolvedValue({
        notion: { workspaceId: 'config-workspace-123' },
      }),
    };
    (CommandHelpers.loadConfiguration as jest.Mock).mockResolvedValue(mockConfigService);
  });

  describe('Command Definition', () => {
    it('should be a valid Commander command', () => {
      expect(importCommand).toBeInstanceOf(Command);
      expect(importCommand.name()).toBe('import');
    });

    it('should have correct description', () => {
      expect(importCommand.description()).toBe('Import OneNote content to Notion');
    });

    it('should have all required options', () => {
      const options = importCommand.options;
      const optionNames = options.map((opt: any) => opt.long);
      
      expect(optionNames).toContain('--file');
      expect(optionNames).toContain('--workspace');
      expect(optionNames).toContain('--database');
      expect(optionNames).toContain('--config');
      expect(optionNames).toContain('--dry-run');
      expect(optionNames).toContain('--verbose');
    });
  });

  describe('Command Execution', () => {
    it('should execute import command with all options', async () => {
      const options = {
        file: '/path/to/file.one',
        workspace: 'workspace-123',
        database: 'database-456',
        config: '/path/to/config.json',
        dryRun: true,
        verbose: true,
      };

      await importCommand._actionHandler(options);

      expect(CommandHelpers.logCommandStart).toHaveBeenCalledWith('import', 'import');
      expect(CommandHelpers.setupVerboseLogging).toHaveBeenCalledWith(options);
      expect(CommandHelpers.loadConfiguration).toHaveBeenCalledWith('/path/to/config.json');
      expect(CommandHelpers.validateFilePath).toHaveBeenCalledWith('/path/to/file.one', 'import');
      expect(CommandHelpers.validateWorkspaceId).toHaveBeenCalledWith('workspace-123', 'config-workspace-123');
      expect(logger.info).toHaveBeenCalledWith('Importing from: /path/to/file.one');
      expect(logger.info).toHaveBeenCalledWith('Target workspace: workspace-123');
      expect(CommandHelpers.logDryRunMode).toHaveBeenCalled();
      expect(CommandHelpers.logCommandSuccess).toHaveBeenCalledWith('import', 'Import');
    });

    it('should use config workspace ID when workspace option not provided', async () => {
      const options = {
        file: '/path/to/file.one',
        config: '/path/to/config.json',
      };

      await importCommand._actionHandler(options);

      expect(CommandHelpers.validateWorkspaceId).toHaveBeenCalledWith(undefined, 'config-workspace-123');
      expect(logger.info).toHaveBeenCalledWith('Target workspace: config-workspace-123');
    });

    it('should not log dry run mode when dryRun is false', async () => {
      const options = {
        file: '/path/to/file.one',
        workspace: 'workspace-123',
        dryRun: false,
      };

      await importCommand._actionHandler(options);

      expect(CommandHelpers.logDryRunMode).not.toHaveBeenCalled();
    });

    it('should not log dry run mode when dryRun is undefined', async () => {
      const options = {
        file: '/path/to/file.one',
        workspace: 'workspace-123',
      };

      await importCommand._actionHandler(options);

      expect(CommandHelpers.logDryRunMode).not.toHaveBeenCalled();
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
        workspace: 'workspace-123',
      };

      await importCommand._actionHandler(options);

      expect(CommandHelpers.handleCommandError).toHaveBeenCalledWith(error, 'Import');
    });

    it('should handle errors from config loading', async () => {
      const error = new Error('Config loading error');
      (CommandHelpers.loadConfiguration as jest.Mock).mockRejectedValue(error);

      const options = {
        file: '/path/to/file.one',
        workspace: 'workspace-123',
      };

      await importCommand._actionHandler(options);

      expect(CommandHelpers.handleCommandError).toHaveBeenCalledWith(error, 'Import');
    });
  });

  describe('Option Validation', () => {
    it('should validate file path is required', async () => {
      const options = {
        workspace: 'workspace-123',
      };

      await importCommand._actionHandler(options);

      expect(CommandHelpers.validateFilePath).toHaveBeenCalledWith(undefined, 'import');
    });

    it('should validate workspace ID is required', async () => {
      const options = {
        file: '/path/to/file.one',
      };

      await importCommand._actionHandler(options);

      expect(CommandHelpers.validateWorkspaceId).toHaveBeenCalledWith(undefined, 'config-workspace-123');
    });
  });

  describe('Logging', () => {
    it('should log import details', async () => {
      const options = {
        file: '/path/to/file.one',
        workspace: 'workspace-123',
      };

      await importCommand._actionHandler(options);

      expect(logger.info).toHaveBeenCalledWith('Importing from: /path/to/file.one');
      expect(logger.info).toHaveBeenCalledWith('Target workspace: workspace-123');
    });

    it('should log command start and success', async () => {
      const options = {
        file: '/path/to/file.one',
        workspace: 'workspace-123',
      };

      await importCommand._actionHandler(options);

      expect(CommandHelpers.logCommandStart).toHaveBeenCalledWith('import', 'import');
      expect(CommandHelpers.logCommandSuccess).toHaveBeenCalledWith('import', 'Import');
    });
  });
});
