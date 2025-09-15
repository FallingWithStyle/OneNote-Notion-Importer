import { ConfigValidator } from '../../../src/commands/config-validation';

describe('ConfigValidator', () => {
  let configValidator: ConfigValidator;

  beforeEach(() => {
    configValidator = new ConfigValidator();
  });

  describe('validateConfig', () => {
    it('should validate a complete valid configuration', () => {
      const validConfig = {
        notion: {
          apiKey: 'secret_1234567890abcdef',
          workspaceId: 'workspace-123',
          databaseId: 'database-456'
        },
        export: {
          outputDirectory: './exported',
          format: 'markdown'
        },
        onenote: {
          maxFileSize: 10485760,
          timeout: 30000
        }
      };

      const result = configValidator.validateConfig(validConfig);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const invalidConfig = {
        notion: {
          apiKey: 'secret_1234567890abcdef'
          // Missing workspaceId and databaseId
        }
      };

      const result = configValidator.validateConfig(invalidConfig);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('workspaceId is required');
      expect(result.errors).toContain('databaseId is required');
    });

    it('should validate API key format', () => {
      const invalidConfig = {
        notion: {
          apiKey: 'invalid-key',
          workspaceId: 'workspace-123',
          databaseId: 'database-456'
        }
      };

      const result = configValidator.validateConfig(invalidConfig);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('apiKey must start with "secret_"');
    });

    it('should validate workspace and database ID formats', () => {
      const invalidConfig = {
        notion: {
          apiKey: 'secret_1234567890abcdef',
          workspaceId: 'invalid workspace!',
          databaseId: 'invalid@database#'
        }
      };

      const result = configValidator.validateConfig(invalidConfig);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('workspaceId must be a valid UUID or Notion ID');
      expect(result.errors).toContain('databaseId must be a valid UUID or Notion ID');
    });

    it('should validate export configuration', () => {
      const invalidConfig = {
        notion: {
          apiKey: 'secret_1234567890abcdef',
          workspaceId: 'workspace-123',
          databaseId: 'database-456'
        },
        export: {
          outputDirectory: '', // Empty directory
          format: 'invalid-format'
        }
      };

      const result = configValidator.validateConfig(invalidConfig);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('outputDirectory cannot be empty');
      expect(result.errors).toContain('format must be one of: markdown, docx, json');
    });

    it('should validate OneNote configuration', () => {
      const invalidConfig = {
        notion: {
          apiKey: 'secret_1234567890abcdef',
          workspaceId: 'workspace-123',
          databaseId: 'database-456'
        },
        onenote: {
          maxFileSize: -1, // Invalid size
          timeout: 0 // Invalid timeout
        }
      };

      const result = configValidator.validateConfig(invalidConfig);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('maxFileSize must be greater than 0');
      expect(result.errors).toContain('timeout must be greater than 0');
    });

    it('should provide helpful error messages', () => {
      const invalidConfig = {
        notion: {
          apiKey: 'invalid-key',
          workspaceId: 'invalid workspace!',
          databaseId: 'invalid@database#'
        }
      };

      const result = configValidator.validateConfig(invalidConfig);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(3);
      expect(result.errors[0]).toContain('apiKey must start with "secret_"');
      expect(result.errors[1]).toContain('workspaceId must be a valid UUID or Notion ID');
      expect(result.errors[2]).toContain('databaseId must be a valid UUID or Notion ID');
    });
  });

  describe('validateNotionConfig', () => {
    it('should validate complete Notion configuration', () => {
      const notionConfig = {
        apiKey: 'secret_1234567890abcdef',
        workspaceId: 'workspace-123',
        databaseId: 'database-456'
      };

      const result = configValidator.validateNotionConfig(notionConfig);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing Notion fields', () => {
      const notionConfig = {
        apiKey: 'secret_1234567890abcdef'
      };

      const result = configValidator.validateNotionConfig(notionConfig);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('workspaceId is required');
      expect(result.errors).toContain('databaseId is required');
    });
  });

  describe('validateExportConfig', () => {
    it('should validate complete export configuration', () => {
      const exportConfig = {
        outputDirectory: './exported',
        format: 'markdown'
      };

      const result = configValidator.validateExportConfig(exportConfig);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid export configuration', () => {
      const exportConfig = {
        outputDirectory: '',
        format: 'invalid'
      };

      const result = configValidator.validateExportConfig(exportConfig);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('outputDirectory cannot be empty');
      expect(result.errors).toContain('format must be one of: markdown, docx, json');
    });
  });

  describe('validateOneNoteConfig', () => {
    it('should validate complete OneNote configuration', () => {
      const onenoteConfig = {
        maxFileSize: 10485760,
        timeout: 30000
      };

      const result = configValidator.validateOneNoteConfig(onenoteConfig);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid OneNote configuration', () => {
      const onenoteConfig = {
        maxFileSize: -1,
        timeout: 0
      };

      const result = configValidator.validateOneNoteConfig(onenoteConfig);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('maxFileSize must be greater than 0');
      expect(result.errors).toContain('timeout must be greater than 0');
    });
  });

  describe('generateValidationReport', () => {
    it('should generate detailed validation report', () => {
      const config = {
        notion: {
          apiKey: 'secret_1234567890abcdef',
          workspaceId: 'workspace-123',
          databaseId: 'database-456'
        }
      };

      const result = configValidator.validateConfig(config);
      const report = configValidator.generateValidationReport(result);

      expect(report).toContain('CONFIGURATION VALIDATION REPORT');
      expect(report).toContain('Status: VALID');
      expect(report).toContain('Total Errors: 0');
      expect(report).toContain('Total Warnings: 0');
    });

    it('should include error details in report', () => {
      const config = {
        notion: {
          apiKey: 'invalid-key'
        }
      };

      const result = configValidator.validateConfig(config);
      const report = configValidator.generateValidationReport(result);

      expect(report).toContain('Status: INVALID');
      expect(report).toContain('Total Errors: 3');
      expect(report).toContain('apiKey must start with "secret_"');
    });
  });

  describe('suggestFixes', () => {
    it('should suggest fixes for common configuration errors', () => {
      const config = {
        notion: {
          apiKey: 'invalid-key',
          workspaceId: 'invalid workspace!',
          databaseId: 'invalid@database#'
        }
      };

      const result = configValidator.validateConfig(config);
      const suggestions = configValidator.suggestFixes(result);

      expect(suggestions).toContain('Fix API Key');
      expect(suggestions).toContain('Fix Workspace ID');
      expect(suggestions).toContain('Fix Database ID');
      expect(suggestions).toContain('Get your API key from');
      expect(suggestions).toContain('Get your workspace ID from');
    });
  });

  describe('validateFilePaths', () => {
    it('should validate file paths exist and are accessible', async () => {
      const filePaths = [
        './package.json', // Should exist
        './nonexistent-file.txt' // Should not exist
      ];

      const result = await configValidator.validateFilePaths(filePaths);

      expect(result.validPaths).toContain('./package.json');
      expect(result.invalidPaths).toContain('./nonexistent-file.txt');
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('validateEnvironment', () => {
    it('should validate required environment variables', () => {
      const result = configValidator.validateEnvironment();

      // This test depends on actual environment variables
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('missing');
      expect(result).toHaveProperty('invalid');
    });
  });
});
