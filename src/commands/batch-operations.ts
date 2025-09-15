import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

export interface FileSelectionOptions {
  patterns: string[];
  recursive?: boolean;
  exclude?: string[];
}

export interface BatchProcessingOptions {
  maxConcurrency?: number;
  continueOnError?: boolean;
  progressCallback?: (current: number, total: number) => void;
}

export interface BatchPlan {
  totalFiles: number;
  batches: string[][];
  estimatedTime: number;
  maxConcurrency: number;
}

export interface BatchStats {
  totalFiles: number;
  processed: number;
  successful: number;
  failed: number;
  skipped: number;
  totalTime: number;
  averageTime: number;
}

export interface FileValidationResult {
  validFiles: string[];
  invalidFiles: string[];
  errors: string[];
}

export interface BatchResult {
  success: boolean;
  processed: number;
  successful: number;
  failed: number;
  skipped: number;
  errors: string[];
  totalTime: number;
}

export interface BatchScriptOptions {
  command: string;
  options: Record<string, any>;
  outputFile?: string;
}

export class BatchOperations {
  /**
   * Selects files from a directory based on patterns
   */
  async selectFiles(directory: string, options: FileSelectionOptions): Promise<{
    success: boolean;
    files: string[];
    error?: string;
  }> {
    try {
      if (!fs.existsSync(directory)) {
        return {
          success: false,
          files: [],
          error: 'Directory not found'
        };
      }

      const { patterns, recursive = false, exclude = [] } = options;
      const files: string[] = [];

      for (const pattern of patterns) {
        const searchPattern = recursive 
          ? path.join(directory, '**', pattern)
          : path.join(directory, pattern);

        const matches = await glob(searchPattern, {
          ignore: exclude.map(e => path.join(directory, e))
        });

        files.push(...matches);
      }

      // Remove duplicates
      const uniqueFiles = [...new Set(files)];

      return {
        success: true,
        files: uniqueFiles
      };
    } catch (error) {
      return {
        success: false,
        files: [],
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Processes multiple files in batch
   */
  async processBatch<T>(
    files: string[],
    processor: (file: string) => Promise<T>,
    options: BatchProcessingOptions = {}
  ): Promise<BatchResult> {
    const { maxConcurrency = 1, continueOnError = true, progressCallback } = options;
    const startTime = Date.now();
    
    let processed = 0;
    let successful = 0;
    let failed = 0;
    const errors: string[] = [];

    // Process files in batches
    for (let i = 0; i < files.length; i += maxConcurrency) {
      const batch = files.slice(i, i + maxConcurrency);
      
      const batchPromises = batch.map(async (file) => {
        try {
          await processor(file);
          successful++;
        } catch (error) {
          failed++;
          const errorMessage = error instanceof Error ? error.message : String(error);
          errors.push(`Failed to process ${file}: ${errorMessage}`);
          
          if (!continueOnError) {
            throw error;
          }
        } finally {
          processed++;
          if (progressCallback) {
            progressCallback(processed, files.length);
          }
        }
      });

      try {
        await Promise.all(batchPromises);
      } catch (error) {
        if (!continueOnError) {
          break;
        }
      }
    }

    const totalTime = Date.now() - startTime;

    return {
      success: failed === 0 || continueOnError,
      processed,
      successful,
      failed,
      skipped: files.length - processed,
      errors,
      totalTime
    };
  }

  /**
   * Creates a batch processing plan
   */
  createBatchPlan(files: string[], options: {
    maxConcurrency: number;
    estimatedTimePerFile: number;
  }): BatchPlan {
    const { maxConcurrency, estimatedTimePerFile } = options;
    const batches: string[][] = [];

    // Split files into batches
    for (let i = 0; i < files.length; i += maxConcurrency) {
      batches.push(files.slice(i, i + maxConcurrency));
    }

    const estimatedTime = Math.ceil((files.length / maxConcurrency) * estimatedTimePerFile);

    return {
      totalFiles: files.length,
      batches,
      estimatedTime,
      maxConcurrency
    };
  }

  /**
   * Validates batch files exist and are accessible
   */
  async validateBatchFiles(files: string[]): Promise<FileValidationResult> {
    const validFiles: string[] = [];
    const invalidFiles: string[] = [];
    const errors: string[] = [];

    for (const file of files) {
      try {
        await fs.promises.access(file, fs.constants.F_OK | fs.constants.R_OK);
        validFiles.push(file);
      } catch (error) {
        invalidFiles.push(file);
        errors.push(`File not found or not accessible: ${file}`);
      }
    }

    return {
      validFiles,
      invalidFiles,
      errors
    };
  }

  /**
   * Generates batch processing report
   */
  generateBatchReport(stats: BatchStats): string {
    let report = '='.repeat(60) + '\n';
    report += 'BATCH PROCESSING REPORT\n';
    report += '='.repeat(60) + '\n\n';

    report += `Total Files: ${stats.totalFiles}\n`;
    report += `Processed: ${stats.processed}\n`;
    report += `Successful: ${stats.successful}\n`;
    report += `Failed: ${stats.failed}\n`;
    report += `Skipped: ${stats.skipped}\n`;
    report += `Total Time: ${(stats.totalTime / 1000).toFixed(2)}s\n`;
    report += `Average Time: ${stats.averageTime}ms per file\n\n`;

    const successRate = stats.processed > 0 ? ((stats.successful / stats.processed) * 100).toFixed(1) : '0';
    report += `Success Rate: ${successRate}%\n`;

    if (stats.failed > 0) {
      report += `\n⚠️  ${stats.failed} files failed to process\n`;
    }

    if (stats.skipped > 0) {
      report += `\n⏭️  ${stats.skipped} files were skipped\n`;
    }

    return report;
  }

  /**
   * Filters files by type/extension
   */
  filterFilesByType(files: string[], type: string): string[] {
    const extension = type.startsWith('.') ? type : `.${type}`;
    return files.filter(file => file.toLowerCase().endsWith(extension.toLowerCase()));
  }

  /**
   * Groups files by notebook (based on directory structure)
   */
  groupFilesByNotebook(files: string[]): Record<string, string[]> {
    const grouped: Record<string, string[]> = {};

    for (const file of files) {
      const pathParts = file.split(path.sep);
      const notebookName = pathParts[0] || 'unknown';

      if (!grouped[notebookName]) {
        grouped[notebookName] = [];
      }
      grouped[notebookName].push(file);
    }

    return grouped;
  }

  /**
   * Creates a batch processing script
   */
  createBatchScript(files: string[], options: BatchScriptOptions): string {
    const { command, options: cmdOptions, outputFile } = options;
    
    let script = '#!/bin/bash\n';
    script += `# Batch processing script generated on ${new Date().toISOString()}\n`;
    script += `# Total files: ${files.length}\n\n`;

    // Add command options
    const optionString = Object.entries(cmdOptions)
      .map(([key, value]) => `--${key} ${value}`)
      .join(' ');

    // Create commands for each file
    for (const file of files) {
      script += `${command} ${optionString} "${file}"\n`;
    }

    // Add output redirection if specified
    if (outputFile) {
      script += `\n# Output saved to: ${outputFile}\n`;
    }

    return script;
  }

  /**
   * Saves batch script to file
   */
  async saveBatchScript(script: string, filePath: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      await fs.promises.writeFile(filePath, script, 'utf8');
      
      // Make script executable on Unix systems
      if (process.platform !== 'win32') {
        await fs.promises.chmod(filePath, '755');
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Creates batch processing configuration
   */
  createBatchConfig(options: {
    inputDirectory: string;
    outputDirectory: string;
    patterns: string[];
    recursive: boolean;
    maxConcurrency: number;
    continueOnError: boolean;
  }): string {
    return JSON.stringify({
      batch: {
        inputDirectory: options.inputDirectory,
        outputDirectory: options.outputDirectory,
        patterns: options.patterns,
        recursive: options.recursive,
        maxConcurrency: options.maxConcurrency,
        continueOnError: options.continueOnError
      },
      created: new Date().toISOString()
    }, null, 2);
  }

  /**
   * Loads batch processing configuration
   */
  async loadBatchConfig(filePath: string): Promise<{
    success: boolean;
    config?: any;
    error?: string;
  }> {
    try {
      const content = await fs.promises.readFile(filePath, 'utf8');
      const config = JSON.parse(content);
      return { success: true, config };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Estimates processing time for batch operation
   */
  estimateProcessingTime(files: string[], options: {
    averageTimePerFile: number;
    maxConcurrency: number;
  }): {
    totalTime: number;
    timePerBatch: number;
    numberOfBatches: number;
  } {
    const { averageTimePerFile, maxConcurrency } = options;
    const numberOfBatches = Math.ceil(files.length / maxConcurrency);
    const timePerBatch = averageTimePerFile * Math.min(maxConcurrency, files.length);
    const totalTime = numberOfBatches * timePerBatch;

    return {
      totalTime,
      timePerBatch,
      numberOfBatches
    };
  }
}
