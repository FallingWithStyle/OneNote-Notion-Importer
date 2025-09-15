import fs from 'fs';
import path from 'path';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface NotionConfig {
  apiKey?: string;
  workspaceId?: string;
  databaseId?: string;
}

export interface ExportConfig {
  outputDirectory?: string;
  format?: string;
}

export interface OneNoteConfig {
  maxFileSize?: number;
  timeout?: number;
}

export interface AppConfig {
  notion?: NotionConfig;
  export?: ExportConfig;
  onenote?: OneNoteConfig;
}

export interface FilePathValidationResult {
  validPaths: string[];
  invalidPaths: string[];
  errors: string[];
}

export interface EnvironmentValidationResult {
  isValid: boolean;
  missing: string[];
  invalid: string[];
}

export class ConfigValidator {
  private readonly requiredNotionFields = ['apiKey', 'workspaceId', 'databaseId'];
  private readonly validExportFormats = ['markdown', 'docx', 'json'];
  private readonly apiKeyPrefix = 'secret_';
  private readonly uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  private readonly notionIdRegex = /^[a-f0-9]{32}$/i;
  private readonly simpleIdRegex = /^[a-zA-Z0-9-_]+$/;

  /**
   * Validates the complete configuration
   */
  validateConfig(config: AppConfig): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate Notion configuration
    if (config.notion) {
      const notionResult = this.validateNotionConfig(config.notion);
      errors.push(...notionResult.errors);
      warnings.push(...notionResult.warnings);
    } else {
      errors.push('notion configuration is required');
    }

    // Validate export configuration
    if (config.export) {
      const exportResult = this.validateExportConfig(config.export);
      errors.push(...exportResult.errors);
      warnings.push(...exportResult.warnings);
    }

    // Validate OneNote configuration
    if (config.onenote) {
      const onenoteResult = this.validateOneNoteConfig(config.onenote);
      errors.push(...onenoteResult.errors);
      warnings.push(...onenoteResult.warnings);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validates Notion configuration
   */
  validateNotionConfig(config: NotionConfig): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required fields
    for (const field of this.requiredNotionFields) {
      if (!config[field as keyof NotionConfig]) {
        errors.push(`${field} is required`);
      }
    }

    // Validate API key format
    if (config.apiKey) {
      if (!config.apiKey.startsWith(this.apiKeyPrefix)) {
        errors.push('apiKey must start with "secret_"');
      } else if (config.apiKey.length < 20) {
        errors.push('apiKey appears to be too short');
      }
    }

    // Validate workspace ID format
    if (config.workspaceId) {
      if (!this.isValidNotionId(config.workspaceId) && !this.simpleIdRegex.test(config.workspaceId)) {
        errors.push('workspaceId must be a valid UUID or Notion ID');
      }
    }

    // Validate database ID format
    if (config.databaseId) {
      if (!this.isValidNotionId(config.databaseId) && !this.simpleIdRegex.test(config.databaseId)) {
        errors.push('databaseId must be a valid UUID or Notion ID');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validates export configuration
   */
  validateExportConfig(config: ExportConfig): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate output directory
    if (config.outputDirectory !== undefined) {
      if (config.outputDirectory === '') {
        errors.push('outputDirectory cannot be empty');
      } else if (config.outputDirectory.includes('..')) {
        warnings.push('outputDirectory contains ".." which may be unsafe');
      }
    }

    // Validate format
    if (config.format) {
      if (!this.validExportFormats.includes(config.format)) {
        errors.push(`format must be one of: ${this.validExportFormats.join(', ')}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validates OneNote configuration
   */
  validateOneNoteConfig(config: OneNoteConfig): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate max file size
    if (config.maxFileSize !== undefined) {
      if (config.maxFileSize <= 0) {
        errors.push('maxFileSize must be greater than 0');
      } else if (config.maxFileSize > 100 * 1024 * 1024) { // 100MB
        warnings.push('maxFileSize is very large, this may cause performance issues');
      }
    }

    // Validate timeout
    if (config.timeout !== undefined) {
      if (config.timeout <= 0) {
        errors.push('timeout must be greater than 0');
      } else if (config.timeout > 300000) { // 5 minutes
        warnings.push('timeout is very long, this may cause timeouts');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Generates a detailed validation report
   */
  generateValidationReport(result: ValidationResult): string {
    let report = '='.repeat(60) + '\n';
    report += 'CONFIGURATION VALIDATION REPORT\n';
    report += '='.repeat(60) + '\n\n';

    report += `Status: ${result.isValid ? 'VALID' : 'INVALID'}\n`;
    report += `Total Errors: ${result.errors.length}\n`;
    report += `Total Warnings: ${result.warnings.length}\n\n`;

    if (result.errors.length > 0) {
      report += 'ERRORS:\n';
      report += '-'.repeat(20) + '\n';
      result.errors.forEach((error, index) => {
        report += `${index + 1}. ${error}\n`;
      });
      report += '\n';
    }

    if (result.warnings.length > 0) {
      report += 'WARNINGS:\n';
      report += '-'.repeat(20) + '\n';
      result.warnings.forEach((warning, index) => {
        report += `${index + 1}. ${warning}\n`;
      });
      report += '\n';
    }

    if (result.isValid) {
      report += '✅ Configuration is valid and ready to use!\n';
    } else {
      report += '❌ Please fix the errors above before proceeding.\n';
    }

    return report;
  }

  /**
   * Suggests fixes for common configuration errors
   */
  suggestFixes(result: ValidationResult): string {
    if (result.isValid) {
      return 'Configuration is valid, no fixes needed.';
    }

    let suggestions = 'SUGGESTED FIXES:\n';
    suggestions += '='.repeat(20) + '\n\n';

    result.errors.forEach(error => {
      if (error.includes('apiKey')) {
        suggestions += 'Fix API Key:\n';
        suggestions += '  - Get your API key from https://www.notion.so/my-integrations\n';
        suggestions += '  - Make sure it starts with "secret_"\n';
        suggestions += '  - Example: secret_1234567890abcdef\n\n';
      } else if (error.includes('workspaceId')) {
        suggestions += 'Fix Workspace ID:\n';
        suggestions += '  - Get your workspace ID from your Notion URL\n';
        suggestions += '  - Example: https://www.notion.so/workspace-123\n';
        suggestions += '  - Use "workspace-123" as the workspace ID\n\n';
      } else if (error.includes('databaseId')) {
        suggestions += 'Fix Database ID:\n';
        suggestions += '  - Get your database ID from the database URL\n';
        suggestions += '  - Example: https://www.notion.so/workspace-123/database-456\n';
        suggestions += '  - Use "database-456" as the database ID\n\n';
      } else if (error.includes('outputDirectory')) {
        suggestions += 'Fix Output Directory:\n';
        suggestions += '  - Provide a valid directory path\n';
        suggestions += '  - Example: "./exported" or "/path/to/export"\n';
        suggestions += '  - Make sure the directory exists or can be created\n\n';
      } else if (error.includes('format')) {
        suggestions += 'Fix Export Format:\n';
        suggestions += '  - Use one of the supported formats: markdown, docx, json\n';
        suggestions += '  - Example: "markdown" for Markdown files\n\n';
      }
    });

    return suggestions;
  }

  /**
   * Validates file paths exist and are accessible
   */
  async validateFilePaths(filePaths: string[]): Promise<FilePathValidationResult> {
    const validPaths: string[] = [];
    const invalidPaths: string[] = [];
    const errors: string[] = [];

    for (const filePath of filePaths) {
      try {
        const resolvedPath = path.resolve(filePath);
        await fs.promises.access(resolvedPath, fs.constants.F_OK);
        validPaths.push(filePath);
      } catch (error) {
        invalidPaths.push(filePath);
        errors.push(`File not found or not accessible: ${filePath}`);
      }
    }

    return {
      validPaths,
      invalidPaths,
      errors
    };
  }

  /**
   * Validates required environment variables
   */
  validateEnvironment(): EnvironmentValidationResult {
    const requiredVars = ['NODE_ENV'];
    const missing: string[] = [];
    const invalid: string[] = [];

    for (const varName of requiredVars) {
      const value = process.env[varName];
      if (!value) {
        missing.push(varName);
      }
    }

    // Check for invalid environment values
    if (process.env.NODE_ENV && !['development', 'production', 'test'].includes(process.env.NODE_ENV)) {
      invalid.push('NODE_ENV must be one of: development, production, test');
    }

    return {
      isValid: missing.length === 0 && invalid.length === 0,
      missing,
      invalid
    };
  }

  /**
   * Validates if a string is a valid Notion ID (UUID or 32-char hex)
   */
  private isValidNotionId(id: string): boolean {
    return this.uuidRegex.test(id) || this.notionIdRegex.test(id);
  }

  /**
   * Validates configuration file exists and is readable
   */
  async validateConfigFile(filePath: string): Promise<{ isValid: boolean; error?: string }> {
    try {
      const resolvedPath = path.resolve(filePath);
      await fs.promises.access(resolvedPath, fs.constants.F_OK | fs.constants.R_OK);
      
      // Try to read and parse the file
      const content = await fs.promises.readFile(resolvedPath, 'utf8');
      JSON.parse(content);
      
      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Creates a sample configuration file
   */
  generateSampleConfig(): string {
    return JSON.stringify({
      notion: {
        apiKey: 'secret_your_api_key_here',
        workspaceId: 'your-workspace-id',
        databaseId: 'your-database-id'
      },
      export: {
        outputDirectory: './exported',
        format: 'markdown'
      },
      onenote: {
        maxFileSize: 10485760,
        timeout: 30000
      }
    }, null, 2);
  }

  /**
   * Validates configuration against a schema
   */
  validateAgainstSchema(config: any, schema: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic schema validation
    if (typeof config !== 'object' || config === null) {
      errors.push('Configuration must be an object');
      return { isValid: false, errors, warnings };
    }

    // Check required top-level properties
    const requiredProps = ['notion'];
    for (const prop of requiredProps) {
      if (!(prop in config)) {
        errors.push(`Missing required property: ${prop}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}
