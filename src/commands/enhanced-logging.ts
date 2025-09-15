import { OneNoteHierarchy } from '../types/onenote';
import fs from 'fs';
import path from 'path';

export interface LogContext {
  operation?: string;
  itemId?: string;
  itemName?: string;
  [key: string]: any;
}

export interface ProgressInfo {
  current: number;
  total: number;
  currentItem: string;
  operation: string;
  showProgressBar?: boolean;
}

export interface SuccessStats {
  totalProcessed: number;
  successful: number;
  failed: number;
  skipped: number;
  processingTime: number;
}

export interface ValidationResults {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  totalFiles: number;
  validFiles: number;
  invalidFiles: number;
}

export interface PerformanceMetrics {
  totalTime: number;
  averageTimePerItem: number;
  memoryUsage: number;
  cpuUsage: number;
  itemsPerSecond: number;
}

export interface ExportOptions {
  outputFile: string;
  format: 'json' | 'text' | 'html';
  includeDebug?: boolean;
}

export interface ExportResult {
  success: boolean;
  filePath?: string;
  error?: string;
}

export class EnhancedLogger {
  private logs: any[] = [];

  /**
   * Logs detailed import start information
   */
  logImportStart(hierarchy: OneNoteHierarchy, options: {
    targetWorkspace: string;
    targetDatabase: string;
    dryRun?: boolean;
  }): string {
    const { targetWorkspace, targetDatabase, dryRun = false } = options;
    
    let logOutput = '='.repeat(60) + '\n';
    logOutput += 'Starting OneNote to Notion import\n';
    if (dryRun) {
      logOutput += 'DRY RUN MODE - No actual import will be performed\n';
    }
    logOutput += '='.repeat(60) + '\n\n';
    
    logOutput += `Target Workspace: ${targetWorkspace}\n`;
    logOutput += `Target Database: ${targetDatabase}\n`;
    logOutput += `Total Notebooks: ${hierarchy.totalNotebooks}\n`;
    logOutput += `Total Sections: ${hierarchy.totalSections}\n`;
    logOutput += `Total Pages: ${hierarchy.totalPages}\n`;
    logOutput += `Start Time: ${new Date().toISOString()}\n\n`;
    
    this.addLog('info', 'Import started', { hierarchy, options });
    
    return logOutput;
  }

  /**
   * Logs progress information
   */
  logProgress(info: ProgressInfo): string {
    const { current, total, currentItem, operation, showProgressBar = false } = info;
    const percentage = Math.round((current / total) * 100);
    
    let logOutput = `Progress: ${percentage}% (${current}/${total}) - ${operation.charAt(0).toUpperCase() + operation.slice(1)}: ${currentItem}`;
    
    if (showProgressBar) {
      const barLength = 20;
      const filledLength = Math.round((current / total) * barLength);
      const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
      logOutput += ` [${bar}]`;
    }
    
    logOutput += '\n';
    
    this.addLog('info', 'Progress update', info);
    
    return logOutput;
  }

  /**
   * Logs detailed error information
   */
  logError(error: Error, context: LogContext, options: { includeStackTrace?: boolean } = {}): string {
    const { includeStackTrace = false } = options;
    
    let logOutput = '='.repeat(60) + '\n';
    logOutput += 'ERROR\n';
    logOutput += '='.repeat(60) + '\n';
    logOutput += `Message: ${error.message}\n`;
    logOutput += `Time: ${new Date().toISOString()}\n`;
    
    if (context.operation) {
      logOutput += `Operation: ${context.operation}\n`;
    }
    if (context.itemId) {
      logOutput += `Item ID: ${context.itemId}\n`;
    }
    if (context.itemName) {
      logOutput += `Item Name: ${context.itemName}\n`;
    }
    
    if (includeStackTrace && error.stack) {
      logOutput += `\nStack Trace:\n${error.stack}\n`;
    }
    
    logOutput += '\n';
    
    this.addLog('error', 'Error occurred', { error: error.message, context, stack: error.stack });
    
    return logOutput;
  }

  /**
   * Logs warning information
   */
  logWarning(message: string, context: LogContext): string {
    let logOutput = 'WARNING: ' + message;
    
    if (context.operation) {
      logOutput += ` (Operation: ${context.operation})`;
    }
    if (context.itemId) {
      logOutput += ` (Item ID: ${context.itemId})`;
    }
    if (context.itemName) {
      logOutput += ` (Item: ${context.itemName})`;
    }
    
    logOutput += '\n';
    
    this.addLog('warn', 'Warning', { message, context });
    
    return logOutput;
  }

  /**
   * Logs success information with statistics
   */
  logSuccess(stats: SuccessStats): string {
    const { totalProcessed, successful, failed, skipped, processingTime } = stats;
    
    let logOutput = '='.repeat(60) + '\n';
    logOutput += 'SUCCESS\n';
    logOutput += '='.repeat(60) + '\n';
    logOutput += `Total Processed: ${totalProcessed}\n`;
    logOutput += `Successful: ${successful}\n`;
    logOutput += `Failed: ${failed}\n`;
    logOutput += `Skipped: ${skipped}\n`;
    logOutput += `Processing Time: ${(processingTime / 1000).toFixed(2)}s\n`;
    logOutput += `Success Rate: ${((successful / totalProcessed) * 100).toFixed(1)}%\n`;
    logOutput += `End Time: ${new Date().toISOString()}\n\n`;
    
    this.addLog('info', 'Operation completed successfully', stats);
    
    return logOutput;
  }

  /**
   * Logs validation results
   */
  logValidationResults(results: ValidationResults): string {
    const { isValid, errors, warnings, totalFiles, validFiles, invalidFiles } = results;
    
    let logOutput = '='.repeat(60) + '\n';
    logOutput += 'VALIDATION RESULTS\n';
    logOutput += '='.repeat(60) + '\n';
    logOutput += `Status: ${isValid ? 'PASSED' : 'FAILED'}\n`;
    logOutput += `Total Files: ${totalFiles}\n`;
    logOutput += `Valid Files: ${validFiles}\n`;
    logOutput += `Invalid Files: ${invalidFiles}\n`;
    logOutput += `Errors: ${errors.length}\n`;
    logOutput += `Warnings: ${warnings.length}\n\n`;
    
    if (errors.length > 0) {
      logOutput += 'ERRORS:\n';
      errors.forEach((error, index) => {
        logOutput += `${index + 1}. ${error}\n`;
      });
      logOutput += '\n';
    }
    
    if (warnings.length > 0) {
      logOutput += 'WARNINGS:\n';
      warnings.forEach((warning, index) => {
        logOutput += `${index + 1}. ${warning}\n`;
      });
      logOutput += '\n';
    }
    
    this.addLog('info', 'Validation completed', results);
    
    return logOutput;
  }

  /**
   * Logs performance metrics
   */
  logPerformanceMetrics(metrics: PerformanceMetrics): string {
    const { totalTime, averageTimePerItem, memoryUsage, cpuUsage, itemsPerSecond } = metrics;
    
    let logOutput = '='.repeat(60) + '\n';
    logOutput += 'PERFORMANCE METRICS\n';
    logOutput += '='.repeat(60) + '\n';
    logOutput += `Total Time: ${(totalTime / 1000).toFixed(2)}s\n`;
    logOutput += `Average Time per Item: ${(averageTimePerItem / 1000).toFixed(2)}s\n`;
    logOutput += `Memory Usage: ${memoryUsage}MB\n`;
    logOutput += `CPU Usage: ${cpuUsage}%\n`;
    logOutput += `Items per Second: ${itemsPerSecond}\n`;
    logOutput += `Timestamp: ${new Date().toISOString()}\n\n`;
    
    this.addLog('info', 'Performance metrics', metrics);
    
    return logOutput;
  }

  /**
   * Exports logs to a file
   */
  async exportLogs(options: ExportOptions): Promise<ExportResult> {
    const { outputFile, format, includeDebug = false } = options;
    
    try {
      let content: string;
      
      if (format === 'json') {
        const logData = {
          exportTime: new Date().toISOString(),
          totalLogs: this.logs.length,
          logs: includeDebug ? this.logs : this.logs.filter(log => log.level !== 'debug')
        };
        content = JSON.stringify(logData, null, 2);
      } else if (format === 'html') {
        content = this.generateHtmlLogs(includeDebug);
      } else {
        content = this.generateTextLogs(includeDebug);
      }
      
      // Ensure directory exists
      const dir = path.dirname(outputFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(outputFile, content, 'utf8');
      
      return {
        success: true,
        filePath: outputFile
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Adds a log entry to the internal log store
   */
  private addLog(level: string, message: string, data: any): void {
    this.logs.push({
      timestamp: new Date().toISOString(),
      level,
      message,
      data
    });
  }

  /**
   * Generates HTML formatted logs
   */
  private generateHtmlLogs(includeDebug: boolean): string {
    const filteredLogs = includeDebug ? this.logs : this.logs.filter(log => log.level !== 'debug');
    
    let html = '<!DOCTYPE html>\n<html>\n<head>\n';
    html += '<title>OneNote to Notion Import Logs</title>\n';
    html += '<style>body{font-family:monospace;margin:20px;} .error{color:red;} .warn{color:orange;} .info{color:blue;} .debug{color:gray;}</style>\n';
    html += '</head>\n<body>\n';
    html += '<h1>Import Logs</h1>\n';
    html += `<p>Total Logs: ${filteredLogs.length}</p>\n`;
    html += '<div class="logs">\n';
    
    filteredLogs.forEach(log => {
      html += `<div class="${log.level}">`;
      html += `[${log.timestamp}] ${log.level.toUpperCase()}: ${log.message}`;
      if (log.data) {
        html += `<pre>${JSON.stringify(log.data, null, 2)}</pre>`;
      }
      html += '</div>\n';
    });
    
    html += '</div>\n</body>\n</html>';
    return html;
  }

  /**
   * Generates text formatted logs
   */
  private generateTextLogs(includeDebug: boolean): string {
    const filteredLogs = includeDebug ? this.logs : this.logs.filter(log => log.level !== 'debug');
    
    let text = 'OneNote to Notion Import Logs\n';
    text += '='.repeat(50) + '\n';
    text += `Total Logs: ${filteredLogs.length}\n`;
    text += `Export Time: ${new Date().toISOString()}\n\n`;
    
    filteredLogs.forEach(log => {
      text += `[${log.timestamp}] ${log.level.toUpperCase()}: ${log.message}\n`;
      if (log.data) {
        text += `Data: ${JSON.stringify(log.data, null, 2)}\n`;
      }
      text += '\n';
    });
    
    return text;
  }
}
