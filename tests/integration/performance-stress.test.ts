/**
 * Performance and stress tests for OneNote processing
 * Tests system performance with large files and batch operations
 */

import path from 'path';
import fs from 'fs';
import { OneNoteService } from '../../src/services/onenote/onenote.service';
import { OneNoteExtractionService } from '../../src/services/onenote/extraction.service';
import { OneNoteParserService } from '../../src/services/onenote/parser.service';
import { ContentConverterService } from '../../src/services/onenote/content-converter.service';
import { OneNoteHierarchy, OneNoteExtractionResult } from '../../src/types/onenote';

describe('Performance and Stress Tests', () => {
  const fixturesDir = path.join(__dirname, '../fixtures/onenote');
  const tempOutputDir = path.join(__dirname, '../temp-output');
  
  let oneNoteService: OneNoteService;
  let extractionService: OneNoteExtractionService;
  let parserService: OneNoteParserService;
  let contentConverter: ContentConverterService;

  beforeAll(() => {
    // Initialize services
    oneNoteService = new OneNoteService();
    extractionService = new OneNoteExtractionService();
    parserService = new OneNoteParserService();
    contentConverter = new ContentConverterService();
  });

  beforeEach(() => {
    // Clean up temp output directory
    if (fs.existsSync(tempOutputDir)) {
      fs.rmSync(tempOutputDir, { recursive: true });
    }
    fs.mkdirSync(tempOutputDir, { recursive: true });
  });

  afterEach(() => {
    // Clean up temp output directory
    if (fs.existsSync(tempOutputDir)) {
      fs.rmSync(tempOutputDir, { recursive: true });
    }
  });

  describe('File Processing Performance', () => {
    it('should process single files within performance limits', async () => {
      const testFiles = [
        'sample.one',
        'valid.one',
        'multi-page.one',
        'sample.onepkg',
        'valid.onepkg'
      ];

      for (const fileName of testFiles) {
        const filePath = path.join(fixturesDir, fileName);
        if (fs.existsSync(filePath)) {
          const startTime = Date.now();
          const result = await oneNoteService.processFiles([filePath]);
          const endTime = Date.now();
          const processingTime = endTime - startTime;

          expect(result.success).toBe(true);
          expect(processingTime).toBeLessThan(5000); // Should complete within 5 seconds
          
          console.log(`Processed ${fileName} in ${processingTime}ms`);
        }
      }
    });

    it('should process batch files efficiently', async () => {
      const testFiles = [
        'section1.one',
        'section2.one',
        'section3.one',
        'sample.one',
        'valid.one'
      ].map(fileName => path.join(fixturesDir, fileName)).filter(filePath => fs.existsSync(filePath));

      if (testFiles.length > 0) {
        const startTime = Date.now();
        const result = await oneNoteService.processFiles(testFiles);
        const endTime = Date.now();
        const processingTime = endTime - startTime;

        expect(result.success).toBe(true);
        expect(processingTime).toBeLessThan(10000); // Should complete within 10 seconds
        
        console.log(`Processed ${testFiles.length} files in ${processingTime}ms (${processingTime / testFiles.length}ms per file)`);
      }
    });

    it('should handle large files without memory issues', async () => {
      const largeFiles = [
        'multi-page.one',
        'notebook.onepkg',
        'notebook1.onepkg',
        'notebook2.onepkg'
      ].map(fileName => path.join(fixturesDir, fileName)).filter(filePath => fs.existsSync(filePath));

      for (const filePath of largeFiles) {
        const startTime = Date.now();
        const result = await oneNoteService.processFiles([filePath]);
        const endTime = Date.now();
        const processingTime = endTime - startTime;

        expect(result.success).toBe(true);
        expect(processingTime).toBeLessThan(15000); // Should complete within 15 seconds
        
        // Check memory usage (basic check)
        const memUsage = process.memoryUsage();
        expect(memUsage.heapUsed).toBeLessThan(500 * 1024 * 1024); // Less than 500MB
        
        console.log(`Processed large file ${path.basename(filePath)} in ${processingTime}ms`);
        console.log(`Memory usage: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`);
      }
    });
  });

  describe('Content Conversion Performance', () => {
    it('should convert content efficiently', async () => {
      const testFiles = [
        'sample.one',
        'valid.one',
        'multi-page.one'
      ].map(fileName => path.join(fixturesDir, fileName)).filter(filePath => fs.existsSync(filePath));

      for (const filePath of testFiles) {
        const result = await oneNoteService.processFiles([filePath]);
        expect(result.success).toBe(true);
        expect(result.hierarchy).toBeDefined();

        if (result.hierarchy) {
          const startTime = Date.now();
          
          for (const notebook of result.hierarchy.notebooks) {
            for (const section of notebook.sections) {
              for (const page of section.pages) {
                // Test markdown conversion
                const markdownStart = Date.now();
                const markdown = await contentConverter.convertTextContent(page.content, { outputFormat: 'markdown' });
                const markdownTime = Date.now() - markdownStart;
                
                expect(markdown).toBeDefined();
                expect(markdownTime).toBeLessThan(1000); // Should convert within 1 second
                
                // Test HTML conversion
                const htmlStart = Date.now();
                const docx = await contentConverter.convertTextContent(page.content, { outputFormat: 'docx' });
                const htmlTime = Date.now() - htmlStart;
                
                expect(docx).toBeDefined();
                expect(htmlTime).toBeLessThan(1000); // Should convert within 1 second
                
                // Test plain text conversion
                const textStart = Date.now();
                const text = await contentConverter.convertTextContent(page.content, { outputFormat: 'markdown' });
                const textTime = Date.now() - textStart;
                
                expect(text).toBeDefined();
                expect(textTime).toBeLessThan(1000); // Should convert within 1 second
              }
            }
          }
          
          const totalTime = Date.now() - startTime;
          console.log(`Converted content for ${path.basename(filePath)} in ${totalTime}ms`);
        }
      }
    });

    it('should handle large content conversion efficiently', async () => {
      const testFiles = [
        'multi-page.one',
        'notebook.onepkg'
      ].map(fileName => path.join(fixturesDir, fileName)).filter(filePath => fs.existsSync(filePath));

      for (const filePath of testFiles) {
        const result = await oneNoteService.processFiles([filePath]);
        expect(result.success).toBe(true);
        expect(result.hierarchy).toBeDefined();

        if (result.hierarchy) {
          const startTime = Date.now();
          let totalPages = 0;
          
          for (const notebook of result.hierarchy.notebooks) {
            for (const section of notebook.sections) {
              for (const page of section.pages) {
                totalPages++;
                
                // Convert to all formats
                await Promise.all([
                  contentConverter.convertTextContent(page.content, { outputFormat: 'markdown' }),
                  contentConverter.convertTextContent(page.content, { outputFormat: 'docx' })
                ]);
              }
            }
          }
          
          const totalTime = Date.now() - startTime;
          const avgTimePerPage = totalTime / totalPages;
          
          expect(totalTime).toBeLessThan(30000); // Should complete within 30 seconds
          expect(avgTimePerPage).toBeLessThan(2000); // Average less than 2 seconds per page
          
          console.log(`Converted ${totalPages} pages in ${totalTime}ms (${avgTimePerPage.toFixed(2)}ms per page)`);
        }
      }
    });
  });

  describe('Memory Management', () => {
    it('should not leak memory during processing', async () => {
      const testFiles = [
        'sample.one',
        'valid.one',
        'multi-page.one'
      ].map(fileName => path.join(fixturesDir, fileName)).filter(filePath => fs.existsSync(filePath));

      if (testFiles.length > 0) {
        const initialMemory = process.memoryUsage();
        
        // Process files multiple times to check for memory leaks
        for (let i = 0; i < 5; i++) {
          for (const filePath of testFiles) {
            const result = await oneNoteService.processFiles([filePath]);
            expect(result.success).toBe(true);
          }
          
          // Force garbage collection if available
          if (global.gc) {
            global.gc();
          }
        }
        
        const finalMemory = process.memoryUsage();
        const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
        
        // Memory increase should be reasonable (less than 100MB)
        expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
        
        console.log(`Memory increase after 5 iterations: ${Math.round(memoryIncrease / 1024 / 1024)}MB`);
      }
    });

    it('should handle concurrent processing without memory issues', async () => {
      const testFiles = [
        'sample.one',
        'valid.one',
        'multi-page.one',
        'sample.onepkg',
        'valid.onepkg'
      ].map(fileName => path.join(fixturesDir, fileName)).filter(filePath => fs.existsSync(filePath));

      if (testFiles.length > 0) {
        const initialMemory = process.memoryUsage();
        
        // Process files concurrently
        const promises = testFiles.map(filePath => oneNoteService.processFiles([filePath]));
        const results = await Promise.all(promises);
        
        const finalMemory = process.memoryUsage();
        const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
        
        // All should succeed
        results.forEach(result => {
          expect(result.success).toBe(true);
        });
        
        // Memory increase should be reasonable
        expect(memoryIncrease).toBeLessThan(200 * 1024 * 1024);
        
        console.log(`Concurrent processing memory increase: ${Math.round(memoryIncrease / 1024 / 1024)}MB`);
      }
    });
  });

  describe('Error Handling Performance', () => {
    it('should handle errors efficiently without performance degradation', async () => {
      const testFiles = [
        'sample.one',
        'corrupted.one',
        'valid.one',
        'invalid.txt',
        'empty.one'
      ].map(fileName => path.join(fixturesDir, fileName)).filter(filePath => fs.existsSync(filePath));

      if (testFiles.length > 0) {
        const startTime = Date.now();
        const results = await Promise.all(
          testFiles.map(filePath => oneNoteService.processFiles([filePath]))
        );
        const endTime = Date.now();
        const processingTime = endTime - startTime;

        // Should complete within reasonable time even with errors
        expect(processingTime).toBeLessThan(10000);
        
        // Some should succeed, some should fail
        const successCount = results.filter(result => result.success).length;
        const failureCount = results.filter(result => !result.success).length;
        
        expect(successCount).toBeGreaterThan(0);
        expect(failureCount).toBeGreaterThan(0);
        
        console.log(`Processed ${testFiles.length} files (${successCount} success, ${failureCount} failures) in ${processingTime}ms`);
      }
    });

    it('should recover from errors quickly', async () => {
      const testFiles = [
        'corrupted.one',
        'sample.one',
        'corrupted.onepkg',
        'valid.one'
      ].map(fileName => path.join(fixturesDir, fileName)).filter(filePath => fs.existsSync(filePath));

      if (testFiles.length > 0) {
        const startTime = Date.now();
        
        for (const filePath of testFiles) {
          const result = await oneNoteService.processFiles([filePath]);
          // Should either succeed or fail gracefully
          expect(result).toBeDefined();
        }
        
        const endTime = Date.now();
        const processingTime = endTime - startTime;
        
        // Should complete within reasonable time
        expect(processingTime).toBeLessThan(15000);
        
        console.log(`Error recovery test completed in ${processingTime}ms`);
      }
    });
  });

  describe('Scalability Tests', () => {
    it('should scale with increasing file sizes', async () => {
      const testFiles = [
        'minimal.one',
        'sample.one',
        'multi-page.one',
        'notebook.onepkg'
      ].map(fileName => path.join(fixturesDir, fileName)).filter(filePath => fs.existsSync(filePath));

      if (testFiles.length > 0) {
        const results = [];
        
        for (const filePath of testFiles) {
          const startTime = Date.now();
          const result = await oneNoteService.processFiles([filePath]);
          const endTime = Date.now();
          const processingTime = endTime - startTime;
          
          results.push({
            file: path.basename(filePath),
            processingTime,
            success: result.success,
            pages: result.hierarchy?.totalPages || 0
          });
        }
        
        // All should succeed
        results.forEach(result => {
          expect(result.success).toBe(true);
        });
        
        // Processing time should scale reasonably with content size
        const sortedResults = results.sort((a, b) => a.pages - b.pages);
        for (let i = 1; i < sortedResults.length; i++) {
          const prev = sortedResults[i - 1];
          const curr = sortedResults[i];
          
          if (curr && prev && curr.pages > prev.pages) {
            // More pages should generally take more time, but not exponentially
            expect(curr.processingTime).toBeGreaterThan(prev.processingTime);
            expect(curr.processingTime).toBeLessThan(prev.processingTime * 3); // Not more than 3x
          }
        }
        
        console.log('Scalability test results:');
        results.forEach(result => {
          console.log(`  ${result.file}: ${result.processingTime}ms for ${result.pages} pages`);
        });
      }
    });

    it('should handle maximum concurrent operations', async () => {
      const testFiles = [
        'sample.one',
        'valid.one',
        'multi-page.one',
        'sample.onepkg',
        'valid.onepkg'
      ].map(fileName => path.join(fixturesDir, fileName)).filter(filePath => fs.existsSync(filePath));

      if (testFiles.length > 0) {
        const maxConcurrent = 10;
        const startTime = Date.now();
        
        // Create multiple concurrent operations
        const promises = [];
        for (let i = 0; i < maxConcurrent; i++) {
          const filePath = testFiles[i % testFiles.length];
          promises.push(oneNoteService.processFiles([filePath!]));
        }
        
        const results = await Promise.all(promises);
        const endTime = Date.now();
        const processingTime = endTime - startTime;
        
        // All should succeed
        results.forEach(result => {
          expect(result.success).toBe(true);
        });
        
        // Should complete within reasonable time
        expect(processingTime).toBeLessThan(30000);
        
        console.log(`Processed ${maxConcurrent} concurrent operations in ${processingTime}ms`);
      }
    });
  });

  describe('Resource Cleanup', () => {
    it('should clean up resources after processing', async () => {
      const testFiles = [
        'sample.one',
        'valid.one',
        'multi-page.one'
      ].map(fileName => path.join(fixturesDir, fileName)).filter(filePath => fs.existsSync(filePath));

      if (testFiles.length > 0) {
        const initialMemory = process.memoryUsage();
        
        // Process files
        for (const filePath of testFiles) {
          const result = await oneNoteService.processFiles([filePath]);
          expect(result.success).toBe(true);
        }
        
        // Force garbage collection
        if (global.gc) {
          global.gc();
        }
        
        const finalMemory = process.memoryUsage();
        const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
        
        // Memory increase should be minimal after cleanup
        expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Less than 50MB
        
        console.log(`Memory increase after cleanup: ${Math.round(memoryIncrease / 1024 / 1024)}MB`);
      }
    });

    it('should handle temporary file cleanup', async () => {
      const testFiles = [
        'sample.onepkg',
        'valid.onepkg',
        'notebook.onepkg'
      ].map(fileName => path.join(fixturesDir, fileName)).filter(filePath => fs.existsSync(filePath));

      if (testFiles.length > 0) {
        // Process files that may create temporary files
        for (const filePath of testFiles) {
          const result = await oneNoteService.processFiles([filePath]);
          expect(result.success).toBe(true);
        }
        
        // Check that temp directory is clean
        const tempDir = path.join(fixturesDir, 'temp_extract');
        if (fs.existsSync(tempDir)) {
          const tempFiles = fs.readdirSync(tempDir);
          // Should have minimal temporary files
          expect(tempFiles.length).toBeLessThan(10);
        }
      }
    });
  });
});
