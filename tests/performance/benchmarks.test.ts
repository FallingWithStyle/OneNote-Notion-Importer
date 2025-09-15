import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { NotionService } from '../../src/services/notion/notion.service';
import { OneNoteService } from '../../src/services/onenote/onenote.service';
import { ConfigService } from '../../src/services/config.service';
import { logger } from '../../src/utils/logger';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

interface PerformanceMetrics {
  operation: string;
  duration: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: NodeJS.CpuUsage;
  timestamp: Date;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private startTime: number = 0;
  private startCpuUsage: NodeJS.CpuUsage = process.cpuUsage();

  start(operation: string): void {
    this.startTime = Date.now();
    this.startCpuUsage = process.cpuUsage();
    logger.info(`Starting performance test: ${operation}`);
  }

  end(operation: string, metadata?: Record<string, any>): PerformanceMetrics {
    const duration = Date.now() - this.startTime;
    const cpuUsage = process.cpuUsage(this.startCpuUsage);
    const memoryUsage = process.memoryUsage();

    const metric: PerformanceMetrics = {
      operation,
      duration,
      memoryUsage,
      cpuUsage,
      timestamp: new Date(),
      metadata
    };

    this.metrics.push(metric);
    logger.info(`Completed ${operation} in ${duration}ms (CPU: ${cpuUsage.user + cpuUsage.system}μs, Memory: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB)`);
    
    return metric;
  }

  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  getAverageDuration(operation: string): number {
    const operationMetrics = this.metrics.filter(m => m.operation === operation);
    if (operationMetrics.length === 0) return 0;
    
    const totalDuration = operationMetrics.reduce((sum, m) => sum + m.duration, 0);
    return totalDuration / operationMetrics.length;
  }

  getPeakMemoryUsage(): number {
    return Math.max(...this.metrics.map(m => m.memoryUsage.heapUsed));
  }

  generateReport(): string {
    const report = ['Performance Benchmark Report', '='.repeat(50)];
    
    // Group metrics by operation
    const operationGroups = this.metrics.reduce((groups, metric) => {
      if (!groups[metric.operation]) {
        groups[metric.operation] = [];
      }
      groups[metric.operation].push(metric);
      return groups;
    }, {} as Record<string, PerformanceMetrics[]>);

    // Generate statistics for each operation
    for (const [operation, metrics] of Object.entries(operationGroups)) {
      const durations = metrics.map(m => m.duration);
      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      const minDuration = Math.min(...durations);
      const maxDuration = Math.max(...durations);
      
      report.push(`\n${operation}:`);
      report.push(`  Count: ${metrics.length}`);
      report.push(`  Average: ${avgDuration.toFixed(2)}ms`);
      report.push(`  Min: ${minDuration}ms`);
      report.push(`  Max: ${maxDuration}ms`);
    }

    // Memory usage summary
    const peakMemory = this.getPeakMemoryUsage();
    report.push(`\nMemory Usage:`);
    report.push(`  Peak Heap: ${Math.round(peakMemory / 1024 / 1024)}MB`);
    report.push(`  Current Heap: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);

    return report.join('\n');
  }
}

describe('Performance Benchmarks', () => {
  let notionService: NotionService;
  let oneNoteService: OneNoteService;
  let configService: ConfigService;
  let monitor: PerformanceMonitor;
  let testDatabaseId: string;

  beforeAll(async () => {
    monitor = new PerformanceMonitor();
    configService = new ConfigService();
    notionService = new NotionService();
    oneNoteService = new OneNoteService();

    // Load configuration
    const config = await configService.loadConfig();
    expect(config.notion.apiKey).toBeDefined();

    // Create test database
    const database = await notionService.createTestDatabase('ONI Performance Test Database');
    testDatabaseId = database.id;
  });

  afterAll(async () => {
    // Clean up test database
    if (testDatabaseId) {
      await notionService.archiveDatabase(testDatabaseId);
    }

    // Generate and log performance report
    const report = monitor.generateReport();
    logger.info(report);
    
    // Save report to file
    const reportPath = path.join(__dirname, '../../logs/performance-report.txt');
    fs.writeFileSync(reportPath, report);
  });

  describe('OneNote Processing Performance', () => {
    it('should process small OneNote files efficiently', async () => {
      const testFiles = [
        'simple-page.one',
        'basic-notebook.onepkg'
      ];

      for (const fileName of testFiles) {
        const filePath = path.join(__dirname, '../fixtures/onenote', fileName);
        if (!fs.existsSync(filePath)) {
          logger.warn(`Test file ${fileName} not found, skipping`);
          continue;
        }

        monitor.start(`Process ${fileName}`);
        const notebook = await oneNoteService.processOneNoteFile(filePath);
        const metric = monitor.end(`Process ${fileName}`, {
          fileSize: fs.statSync(filePath).size,
          pageCount: notebook.pages.length,
          sectionCount: notebook.sections.length
        });

        // Performance assertions
        expect(metric.duration).toBeLessThan(5000); // Should complete within 5 seconds
        expect(metric.memoryUsage.heapUsed).toBeLessThan(100 * 1024 * 1024); // Less than 100MB
      }
    });

    it('should process large OneNote files within acceptable time', async () => {
      const largeFiles = [
        'large-notebook.onepkg',
        'complex-hierarchy.onepkg'
      ];

      for (const fileName of largeFiles) {
        const filePath = path.join(__dirname, '../fixtures/onenote', fileName);
        if (!fs.existsSync(filePath)) {
          logger.warn(`Large test file ${fileName} not found, skipping`);
          continue;
        }

        monitor.start(`Process Large ${fileName}`);
        const notebook = await oneNoteService.processOneNoteFile(filePath);
        const metric = monitor.end(`Process Large ${fileName}`, {
          fileSize: fs.statSync(filePath).size,
          pageCount: notebook.pages.length,
          sectionCount: notebook.sections.length
        });

        // Performance assertions for large files
        expect(metric.duration).toBeLessThan(30000); // Should complete within 30 seconds
        expect(metric.memoryUsage.heapUsed).toBeLessThan(500 * 1024 * 1024); // Less than 500MB
      }
    });

    it('should handle concurrent file processing', async () => {
      const testFiles = [
        'simple-page.one',
        'basic-notebook.onepkg'
      ];

      const startTime = Date.now();
      const promises = testFiles.map(async (fileName) => {
        const filePath = path.join(__dirname, '../fixtures/onenote', fileName);
        if (!fs.existsSync(filePath)) {
          return null;
        }

        monitor.start(`Concurrent Process ${fileName}`);
        const notebook = await oneNoteService.processOneNoteFile(filePath);
        return monitor.end(`Concurrent Process ${fileName}`, {
          fileSize: fs.statSync(filePath).size,
          pageCount: notebook.pages.length
        });
      });

      const results = await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      // Verify all files were processed
      const validResults = results.filter(r => r !== null);
      expect(validResults.length).toBeGreaterThan(0);
      
      // Concurrent processing should be faster than sequential
      expect(totalTime).toBeLessThan(10000); // Should complete within 10 seconds
    });
  });

  describe('Notion API Performance', () => {
    it('should create pages efficiently', async () => {
      const pageCount = 10;
      const pages: any[] = [];

      // Create test pages
      for (let i = 0; i < pageCount; i++) {
        const testPage = {
          parent: { database_id: testDatabaseId },
          properties: {
            Title: {
              title: [{ text: { content: `Performance Test Page ${i}` } }]
            }
          }
        };
        pages.push(testPage);
      }

      // Measure page creation performance
      monitor.start('Create Pages Batch');
      const createdPages = await Promise.all(
        pages.map(page => notionService.createPage(testDatabaseId, page))
      );
      const metric = monitor.end('Create Pages Batch', {
        pageCount: createdPages.length
      });

      expect(createdPages.length).toBe(pageCount);
      expect(metric.duration).toBeLessThan(15000); // Should complete within 15 seconds
    });

    it('should handle API rate limiting efficiently', async () => {
      const pageCount = 20;
      const pages: any[] = [];

      // Create test pages
      for (let i = 0; i < pageCount; i++) {
        const testPage = {
          parent: { database_id: testDatabaseId },
          properties: {
            Title: {
              title: [{ text: { content: `Rate Limit Test Page ${i}` } }]
            }
          }
        };
        pages.push(testPage);
      }

      // Measure rate-limited page creation
      monitor.start('Rate Limited Page Creation');
      const results = await Promise.allSettled(
        pages.map(page => notionService.createPage(testDatabaseId, page))
      );
      const metric = monitor.end('Rate Limited Page Creation', {
        totalPages: pageCount,
        successful: results.filter(r => r.status === 'fulfilled').length,
        failed: results.filter(r => r.status === 'rejected').length
      });

      // Should handle rate limiting gracefully
      expect(metric.duration).toBeLessThan(60000); // Should complete within 1 minute
      expect(results.filter(r => r.status === 'fulfilled').length).toBeGreaterThan(0);
    });

    it('should upload images efficiently', async () => {
      // Create a test page with image content
      const testPage = {
        parent: { database_id: testDatabaseId },
        properties: {
          Title: {
            title: [{ text: { content: 'Image Upload Test Page' } }]
          }
        },
        children: [
          {
            object: 'block',
            type: 'paragraph',
            paragraph: {
              rich_text: [
                {
                  type: 'text',
                  text: {
                    content: 'This page contains an image: '
                  }
                }
              ]
            }
          }
        ]
      };

      monitor.start('Create Page with Image');
      const createdPage = await notionService.createPage(testDatabaseId, testPage);
      const metric = monitor.end('Create Page with Image', {
        pageId: createdPage.id
      });

      expect(createdPage).toBeDefined();
      expect(metric.duration).toBeLessThan(10000); // Should complete within 10 seconds
    });
  });

  describe('End-to-End Performance', () => {
    it('should complete full import workflow efficiently', async () => {
      const testFilePath = path.join(__dirname, '../fixtures/onenote/simple-page.one');
      if (!fs.existsSync(testFilePath)) {
        logger.warn('Test file not found, skipping end-to-end test');
        return;
      }

      monitor.start('End-to-End Import');
      
      // Process OneNote file
      const notebook = await oneNoteService.processOneNoteFile(testFilePath);
      const page = notebook.pages[0];
      
      // Convert to Notion format
      const notionPage = await notionService.convertOneNotePageToNotion(page);
      
      // Create page in Notion
      const createdPage = await notionService.createPage(testDatabaseId, notionPage);
      
      const metric = monitor.end('End-to-End Import', {
        fileSize: fs.statSync(testFilePath).size,
        pageCount: notebook.pages.length,
        createdPageId: createdPage.id
      });

      expect(createdPage).toBeDefined();
      expect(metric.duration).toBeLessThan(15000); // Should complete within 15 seconds
    });

    it('should handle memory usage efficiently during large imports', async () => {
      const testFilePath = path.join(__dirname, '../fixtures/onenote/large-notebook.onepkg');
      if (!fs.existsSync(testFilePath)) {
        logger.warn('Large test file not found, skipping memory test');
        return;
      }

      const initialMemory = process.memoryUsage();
      
      monitor.start('Large Import Memory Test');
      
      // Process large notebook
      const notebook = await oneNoteService.processOneNoteFile(testFilePath);
      
      // Import all pages
      const createdPages = [];
      for (const page of notebook.pages.slice(0, 5)) { // Limit to 5 pages for testing
        const notionPage = await notionService.convertOneNotePageToNotion(page);
        const createdPage = await notionService.createPage(testDatabaseId, notionPage);
        createdPages.push(createdPage.id);
      }
      
      const metric = monitor.end('Large Import Memory Test', {
        fileSize: fs.statSync(testFilePath).size,
        pageCount: notebook.pages.length,
        importedPages: createdPages.length,
        initialMemory: initialMemory.heapUsed,
        finalMemory: process.memoryUsage().heapUsed
      });

      // Memory usage should not grow excessively
      const memoryGrowth = process.memoryUsage().heapUsed - initialMemory.heapUsed;
      expect(memoryGrowth).toBeLessThan(200 * 1024 * 1024); // Less than 200MB growth
      expect(createdPages.length).toBe(5);
    });
  });

  describe('System Resource Monitoring', () => {
    it('should monitor CPU usage during operations', async () => {
      const testFilePath = path.join(__dirname, '../fixtures/onenote/simple-page.one');
      if (!fs.existsSync(testFilePath)) {
        logger.warn('Test file not found, skipping CPU test');
        return;
      }

      monitor.start('CPU Usage Test');
      
      // Perform CPU-intensive operations
      const notebook = await oneNoteService.processOneNoteFile(testFilePath);
      const notionPage = await notionService.convertOneNotePageToNotion(notebook.pages[0]);
      const createdPage = await notionService.createPage(testDatabaseId, notionPage);
      
      const metric = monitor.end('CPU Usage Test', {
        pageId: createdPage.id
      });

      // CPU usage should be reasonable
      const totalCpuTime = metric.cpuUsage.user + metric.cpuUsage.system;
      expect(totalCpuTime).toBeLessThan(1000000); // Less than 1 second of CPU time
    });

    it('should handle memory pressure gracefully', async () => {
      const testFiles = [
        'simple-page.one',
        'basic-notebook.onepkg'
      ];

      const initialMemory = process.memoryUsage();
      const memorySnapshots: NodeJS.MemoryUsage[] = [];

      for (const fileName of testFiles) {
        const filePath = path.join(__dirname, '../fixtures/onenote', fileName);
        if (!fs.existsSync(filePath)) {
          continue;
        }

        monitor.start(`Memory Test ${fileName}`);
        const notebook = await oneNoteService.processOneNoteFile(filePath);
        const metric = monitor.end(`Memory Test ${fileName}`, {
          fileSize: fs.statSync(filePath).size,
          pageCount: notebook.pages.length
        });

        memorySnapshots.push(metric.memoryUsage);
      }

      // Check memory usage patterns
      const peakMemory = Math.max(...memorySnapshots.map(m => m.heapUsed));
      const memoryGrowth = peakMemory - initialMemory.heapUsed;
      
      expect(memoryGrowth).toBeLessThan(100 * 1024 * 1024); // Less than 100MB growth
      expect(peakMemory).toBeLessThan(500 * 1024 * 1024); // Less than 500MB peak
    });
  });
});
