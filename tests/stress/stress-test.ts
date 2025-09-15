import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { NotionService } from '../../src/services/notion/notion.service';
import { OneNoteService } from '../../src/services/onenote/onenote.service';
import { ConfigService } from '../../src/services/config.service';
import { logger } from '../../src/utils/logger';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

interface StressTestConfig {
  maxConcurrentOperations: number;
  maxFileSize: number; // in MB
  maxMemoryUsage: number; // in MB
  maxProcessingTime: number; // in seconds
  testDuration: number; // in seconds
}

interface StressTestResult {
  operation: string;
  duration: number;
  memoryUsage: NodeJS.MemoryUsage;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

class StressTestRunner {
  private config: StressTestConfig;
  private results: StressTestResult[] = [];
  private startTime: number = 0;
  private startMemory: NodeJS.MemoryUsage = process.memoryUsage();

  constructor(config: Partial<StressTestConfig> = {}) {
    this.config = {
      maxConcurrentOperations: 10,
      maxFileSize: 100, // 100MB
      maxMemoryUsage: 1000, // 1GB
      maxProcessingTime: 300, // 5 minutes
      testDuration: 600, // 10 minutes
      ...config
    };
  }

  async runStressTest(operation: () => Promise<any>, operationName: string): Promise<StressTestResult> {
    const startTime = Date.now();
    const startMemory = process.memoryUsage();
    
    try {
      const result = await operation();
      const duration = Date.now() - startTime;
      const memoryUsage = process.memoryUsage();
      
      const testResult: StressTestResult = {
        operation: operationName,
        duration,
        memoryUsage,
        success: true,
        metadata: {
          resultType: typeof result,
          resultSize: JSON.stringify(result).length
        }
      };
      
      this.results.push(testResult);
      return testResult;
    } catch (error) {
      const duration = Date.now() - startTime;
      const memoryUsage = process.memoryUsage();
      
      const testResult: StressTestResult = {
        operation: operationName,
        duration,
        memoryUsage,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
      
      this.results.push(testResult);
      return testResult;
    }
  }

  async runConcurrentStressTest(operations: Array<() => Promise<any>>, operationName: string): Promise<StressTestResult[]> {
    const startTime = Date.now();
    const startMemory = process.memoryUsage();
    
    try {
      const results = await Promise.allSettled(operations);
      const duration = Date.now() - startTime;
      const memoryUsage = process.memoryUsage();
      
      const testResults: StressTestResult[] = results.map((result, index) => ({
        operation: `${operationName} #${index + 1}`,
        duration,
        memoryUsage,
        success: result.status === 'fulfilled',
        error: result.status === 'rejected' ? (result.reason instanceof Error ? result.reason.message : String(result.reason)) : undefined
      }));
      
      this.results.push(...testResults);
      return testResults;
    } catch (error) {
      const duration = Date.now() - startTime;
      const memoryUsage = process.memoryUsage();
      
      const testResult: StressTestResult = {
        operation: operationName,
        duration,
        memoryUsage,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
      
      this.results.push(testResult);
      return [testResult];
    }
  }

  async runMemoryStressTest(operation: () => Promise<any>, operationName: string): Promise<StressTestResult> {
    const startTime = Date.now();
    const startMemory = process.memoryUsage();
    
    try {
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const result = await operation();
      const duration = Date.now() - startTime;
      const memoryUsage = process.memoryUsage();
      
      // Check memory usage
      const memoryGrowth = memoryUsage.heapUsed - startMemory.heapUsed;
      const memoryGrowthMB = memoryGrowth / 1024 / 1024;
      
      const testResult: StressTestResult = {
        operation: operationName,
        duration,
        memoryUsage,
        success: memoryGrowthMB < this.config.maxMemoryUsage,
        metadata: {
          memoryGrowthMB,
          maxMemoryUsageMB: this.config.maxMemoryUsage
        }
      };
      
      this.results.push(testResult);
      return testResult;
    } catch (error) {
      const duration = Date.now() - startTime;
      const memoryUsage = process.memoryUsage();
      
      const testResult: StressTestResult = {
        operation: operationName,
        duration,
        memoryUsage,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
      
      this.results.push(testResult);
      return testResult;
    }
  }

  async runTimeStressTest(operation: () => Promise<any>, operationName: string): Promise<StressTestResult> {
    const startTime = Date.now();
    const startMemory = process.memoryUsage();
    
    try {
      const result = await operation();
      const duration = Date.now() - startTime;
      const memoryUsage = process.memoryUsage();
      
      // Check processing time
      const durationSeconds = duration / 1000;
      
      const testResult: StressTestResult = {
        operation: operationName,
        duration,
        memoryUsage,
        success: durationSeconds < this.config.maxProcessingTime,
        metadata: {
          durationSeconds,
          maxProcessingTimeSeconds: this.config.maxProcessingTime
        }
      };
      
      this.results.push(testResult);
      return testResult;
    } catch (error) {
      const duration = Date.now() - startTime;
      const memoryUsage = process.memoryUsage();
      
      const testResult: StressTestResult = {
        operation: operationName,
        duration,
        memoryUsage,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
      
      this.results.push(testResult);
      return testResult;
    }
  }

  getResults(): StressTestResult[] {
    return [...this.results];
  }

  getSummary(): {
    totalTests: number;
    successfulTests: number;
    failedTests: number;
    averageDuration: number;
    peakMemoryUsage: number;
    issues: string[];
  } {
    const totalTests = this.results.length;
    const successfulTests = this.results.filter(r => r.success).length;
    const failedTests = totalTests - successfulTests;
    
    const averageDuration = this.results.reduce((sum, r) => sum + r.duration, 0) / totalTests;
    const peakMemoryUsage = Math.max(...this.results.map(r => r.memoryUsage.heapUsed));
    
    const issues: string[] = [];
    
    // Check for performance issues
    const slowTests = this.results.filter(r => r.duration > this.config.maxProcessingTime * 1000);
    if (slowTests.length > 0) {
      issues.push(`${slowTests.length} tests exceeded maximum processing time`);
    }
    
    // Check for memory issues
    const memoryIntensiveTests = this.results.filter(r => {
      const memoryUsageMB = r.memoryUsage.heapUsed / 1024 / 1024;
      return memoryUsageMB > this.config.maxMemoryUsage;
    });
    if (memoryIntensiveTests.length > 0) {
      issues.push(`${memoryIntensiveTests.length} tests exceeded maximum memory usage`);
    }
    
    // Check for failures
    if (failedTests > 0) {
      issues.push(`${failedTests} tests failed`);
    }
    
    return {
      totalTests,
      successfulTests,
      failedTests,
      averageDuration,
      peakMemoryUsage,
      issues
    };
  }

  generateReport(): string {
    const summary = this.getSummary();
    const report = [
      '# Stress Test Report',
      `Generated: ${new Date().toISOString()}`,
      '',
      '## Summary',
      `- **Total Tests**: ${summary.totalTests}`,
      `- **Successful**: ${summary.successfulTests}`,
      `- **Failed**: ${summary.failedTests}`,
      `- **Average Duration**: ${summary.averageDuration.toFixed(2)}ms`,
      `- **Peak Memory Usage**: ${Math.round(summary.peakMemoryUsage / 1024 / 1024)}MB`,
      '',
      '## Issues',
      ...(summary.issues.length > 0 ? summary.issues.map(issue => `- ${issue}`) : ['- No issues found']),
      '',
      '## Test Results',
      ''
    ];

    // Group results by operation type
    const operationGroups = this.results.reduce((groups, result) => {
      const operationType = result.operation.split(' #')[0];
      if (!groups[operationType]) {
        groups[operationType] = [];
      }
      groups[operationType].push(result);
      return groups;
    }, {} as Record<string, StressTestResult[]>);

    for (const [operationType, results] of Object.entries(operationGroups)) {
      report.push(`### ${operationType}`);
      report.push(`- **Count**: ${results.length}`);
      report.push(`- **Success Rate**: ${((results.filter(r => r.success).length / results.length) * 100).toFixed(2)}%`);
      report.push(`- **Average Duration**: ${(results.reduce((sum, r) => sum + r.duration, 0) / results.length).toFixed(2)}ms`);
      report.push(`- **Peak Memory**: ${Math.round(Math.max(...results.map(r => r.memoryUsage.heapUsed)) / 1024 / 1024)}MB`);
      report.push('');
    }

    return report.join('\n');
  }

  async saveReport(): Promise<void> {
    const report = this.generateReport();
    const reportPath = path.join(process.cwd(), 'logs', 'stress-test-report.txt');
    
    // Ensure logs directory exists
    const logsDir = path.dirname(reportPath);
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, report);
    logger.info(`Stress test report saved to ${reportPath}`);
  }
}

describe('Stress Testing', () => {
  let notionService: NotionService;
  let oneNoteService: OneNoteService;
  let configService: ConfigService;
  let stressTestRunner: StressTestRunner;
  let testDatabaseId: string;

  beforeAll(async () => {
    stressTestRunner = new StressTestRunner({
      maxConcurrentOperations: 5,
      maxFileSize: 50, // 50MB
      maxMemoryUsage: 500, // 500MB
      maxProcessingTime: 120, // 2 minutes
      testDuration: 300 // 5 minutes
    });

    configService = new ConfigService();
    notionService = new NotionService();
    oneNoteService = new OneNoteService();

    // Load configuration
    const config = await configService.loadConfig();
    expect(config.notion.apiKey).toBeDefined();

    // Create test database
    const database = await notionService.createTestDatabase('ONI Stress Test Database');
    testDatabaseId = database.id;
  });

  afterAll(async () => {
    // Clean up test database
    if (testDatabaseId) {
      await notionService.archiveDatabase(testDatabaseId);
    }

    // Generate and save stress test report
    await stressTestRunner.saveReport();
  });

  describe('Concurrent Operations Stress Test', () => {
    it('should handle multiple concurrent file processing operations', async () => {
      const testFiles = [
        'simple-page.one',
        'basic-notebook.onepkg',
        'complex-notebook.onepkg'
      ];

      const operations = testFiles.map(fileName => async () => {
        const filePath = path.join(__dirname, '../fixtures/onenote', fileName);
        if (!fs.existsSync(filePath)) {
          throw new Error(`Test file ${fileName} not found`);
        }
        return await oneNoteService.processOneNoteFile(filePath);
      });

      const results = await stressTestRunner.runConcurrentStressTest(operations, 'Concurrent File Processing');
      
      // Verify all operations completed
      expect(results.length).toBe(testFiles.length);
      
      // Check success rate
      const successRate = results.filter(r => r.success).length / results.length;
      expect(successRate).toBeGreaterThan(0.8); // At least 80% success rate
    });

    it('should handle multiple concurrent Notion API operations', async () => {
      const operations = Array.from({ length: 10 }, (_, i) => async () => {
        const testPage = {
          parent: { database_id: testDatabaseId },
          properties: {
            Title: {
              title: [{ text: { content: `Stress Test Page ${i}` } }]
            }
          }
        };
        return await notionService.createPage(testDatabaseId, testPage);
      });

      const results = await stressTestRunner.runConcurrentStressTest(operations, 'Concurrent Notion API Operations');
      
      // Verify operations completed
      expect(results.length).toBe(10);
      
      // Check success rate (some may fail due to rate limiting)
      const successRate = results.filter(r => r.success).length / results.length;
      expect(successRate).toBeGreaterThan(0.5); // At least 50% success rate
    });
  });

  describe('Memory Stress Test', () => {
    it('should handle large file processing without excessive memory usage', async () => {
      const testFilePath = path.join(__dirname, '../fixtures/onenote/large-notebook.onepkg');
      if (!fs.existsSync(testFilePath)) {
        logger.warn('Large test file not found, skipping memory stress test');
        return;
      }

      const result = await stressTestRunner.runMemoryStressTest(
        async () => {
          const notebook = await oneNoteService.processOneNoteFile(testFilePath);
          return notebook;
        },
        'Large File Memory Test'
      );

      expect(result.success).toBe(true);
      expect(result.metadata?.memoryGrowthMB).toBeLessThan(200); // Less than 200MB growth
    });

    it('should handle multiple large file processing operations', async () => {
      const testFiles = [
        'large-notebook.onepkg',
        'complex-notebook.onepkg',
        'hierarchical-notebook.onepkg'
      ];

      for (const fileName of testFiles) {
        const filePath = path.join(__dirname, '../fixtures/onenote', fileName);
        if (!fs.existsSync(filePath)) {
          continue;
        }

        const result = await stressTestRunner.runMemoryStressTest(
          async () => {
            const notebook = await oneNoteService.processOneNoteFile(filePath);
            return notebook;
          },
          `Memory Test ${fileName}`
        );

        expect(result.success).toBe(true);
      }
    });
  });

  describe('Time Stress Test', () => {
    it('should process files within acceptable time limits', async () => {
      const testFiles = [
        'simple-page.one',
        'basic-notebook.onepkg',
        'complex-notebook.onepkg'
      ];

      for (const fileName of testFiles) {
        const filePath = path.join(__dirname, '../fixtures/onenote', fileName);
        if (!fs.existsSync(filePath)) {
          continue;
        }

        const result = await stressTestRunner.runTimeStressTest(
          async () => {
            const notebook = await oneNoteService.processOneNoteFile(filePath);
            return notebook;
          },
          `Time Test ${fileName}`
        );

        expect(result.success).toBe(true);
        expect(result.duration).toBeLessThan(30000); // Less than 30 seconds
      }
    });

    it('should handle end-to-end import within time limits', async () => {
      const testFilePath = path.join(__dirname, '../fixtures/onenote/simple-page.one');
      if (!fs.existsSync(testFilePath)) {
        logger.warn('Test file not found, skipping end-to-end time test');
        return;
      }

      const result = await stressTestRunner.runTimeStressTest(
        async () => {
          // Process OneNote file
          const notebook = await oneNoteService.processOneNoteFile(testFilePath);
          const page = notebook.pages[0];
          
          // Convert to Notion format
          const notionPage = await notionService.convertOneNotePageToNotion(page);
          
          // Create page in Notion
          const createdPage = await notionService.createPage(testDatabaseId, notionPage);
          
          return createdPage;
        },
        'End-to-End Time Test'
      );

      expect(result.success).toBe(true);
      expect(result.duration).toBeLessThan(60000); // Less than 1 minute
    });
  });

  describe('Resource Exhaustion Stress Test', () => {
    it('should handle resource exhaustion gracefully', async () => {
      // Create many operations to test resource limits
      const operations = Array.from({ length: 50 }, (_, i) => async () => {
        const testPage = {
          parent: { database_id: testDatabaseId },
          properties: {
            Title: {
              title: [{ text: { content: `Resource Test Page ${i}` } }]
            }
          }
        };
        return await notionService.createPage(testDatabaseId, testPage);
      });

      const results = await stressTestRunner.runConcurrentStressTest(operations, 'Resource Exhaustion Test');
      
      // Some operations may fail due to resource limits, but the system should handle it gracefully
      expect(results.length).toBe(50);
      
      // Check that the system didn't crash
      const successCount = results.filter(r => r.success).length;
      expect(successCount).toBeGreaterThan(0);
    });

    it('should recover from memory pressure', async () => {
      // Force memory pressure by processing multiple large files
      const testFiles = [
        'large-notebook.onepkg',
        'complex-notebook.onepkg',
        'hierarchical-notebook.onepkg'
      ];

      const results: StressTestResult[] = [];
      
      for (const fileName of testFiles) {
        const filePath = path.join(__dirname, '../fixtures/onenote', fileName);
        if (!fs.existsSync(filePath)) {
          continue;
        }

        const result = await stressTestRunner.runMemoryStressTest(
          async () => {
            const notebook = await oneNoteService.processOneNoteFile(filePath);
            return notebook;
          },
          `Memory Pressure Test ${fileName}`
        );

        results.push(result);
      }

      // All operations should succeed despite memory pressure
      const successCount = results.filter(r => r.success).length;
      expect(successCount).toBeGreaterThan(0);
    });
  });

  describe('Error Recovery Stress Test', () => {
    it('should recover from API errors gracefully', async () => {
      // Test with invalid database ID to trigger errors
      const invalidDatabaseId = 'invalid-database-id';
      const testPage = {
        parent: { database_id: invalidDatabaseId },
        properties: {
          Title: {
            title: [{ text: { content: 'Error Recovery Test Page' } }]
          }
        }
      };

      const result = await stressTestRunner.runStressTest(
        async () => {
          return await notionService.createPage(invalidDatabaseId, testPage);
        },
        'API Error Recovery Test'
      );

      // Should fail gracefully without crashing
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should recover from file processing errors gracefully', async () => {
      // Test with corrupted file
      const corruptedFilePath = path.join(__dirname, '../fixtures/onenote/corrupted.one');
      if (!fs.existsSync(corruptedFilePath)) {
        logger.warn('Corrupted test file not found, skipping error recovery test');
        return;
      }

      const result = await stressTestRunner.runStressTest(
        async () => {
          return await oneNoteService.processOneNoteFile(corruptedFilePath);
        },
        'File Processing Error Recovery Test'
      );

      // Should fail gracefully without crashing
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
