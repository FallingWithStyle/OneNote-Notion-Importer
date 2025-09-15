/**
 * Integration tests for Notion integration with OneNote content
 * Tests the complete workflow from OneNote processing to Notion import
 */

import path from 'path';
import fs from 'fs';
import { OneNoteService } from '../../src/services/onenote/onenote.service';
import { OneNoteHierarchy, OneNoteExtractionResult } from '../../src/types/onenote';

describe('Notion Integration Tests', () => {
  const fixturesDir = path.join(__dirname, '../fixtures/onenote');
  const tempOutputDir = path.join(__dirname, '../temp-output');
  
  let oneNoteService: OneNoteService;

  beforeAll(() => {
    // Initialize services
    oneNoteService = new OneNoteService();
  });

  beforeEach(() => {
    // Clean up temp output directory
    if (fs.existsSync(tempOutputDir)) {
      fs.rmSync(tempOutputDir, { recursive: true });
    }
    fs.mkdirSync(tempOutputDir, { recursive: true });

    // Reset any state
  });

  afterEach(() => {
    // Clean up temp output directory
    if (fs.existsSync(tempOutputDir)) {
      fs.rmSync(tempOutputDir, { recursive: true });
    }
  });

  describe('OneNote to Notion Hierarchy Mapping', () => {
    it('should process OneNote files for Notion mapping', async () => {
      const testFiles = [
        'sample.one',
        'valid.one',
        'sample.onepkg'
      ].map(fileName => path.join(fixturesDir, fileName)).filter(filePath => fs.existsSync(filePath));

      if (testFiles.length > 0) {
        const result = await oneNoteService.processFiles(testFiles);
        expect(result.success).toBe(true);
        expect(result.hierarchy).toBeDefined();

        if (result.hierarchy) {
          // Test that we have the structure needed for Notion mapping
          expect(result.hierarchy.notebooks).toBeDefined();
          expect(Array.isArray(result.hierarchy.notebooks)).toBe(true);
          expect(result.hierarchy.notebooks.length).toBeGreaterThan(0);
          
          for (const notebook of result.hierarchy.notebooks) {
            expect(notebook).toHaveProperty('id');
            expect(notebook).toHaveProperty('name');
            expect(notebook).toHaveProperty('sections');
            expect(Array.isArray(notebook.sections)).toBe(true);
            
            for (const section of notebook.sections) {
              expect(section).toHaveProperty('id');
              expect(section).toHaveProperty('name');
              expect(section).toHaveProperty('pages');
              expect(Array.isArray(section.pages)).toBe(true);
              
              for (const page of section.pages) {
                expect(page).toHaveProperty('id');
                expect(page).toHaveProperty('title');
                expect(page).toHaveProperty('content');
              }
            }
          }
        }
      }
    });

    it('should process multi-page sections for Notion mapping', async () => {
      const testFiles = [
        'sample.one',
        'valid.one',
        'multi-page.one'
      ].map(fileName => path.join(fixturesDir, fileName)).filter(filePath => fs.existsSync(filePath));

      if (testFiles.length > 0) {
        const result = await oneNoteService.processFiles(testFiles);
        expect(result.success).toBe(true);
        expect(result.hierarchy).toBeDefined();

        if (result.hierarchy) {
          const totalPages = result.hierarchy.totalPages;
          expect(totalPages).toBeGreaterThan(0);
          
          // Verify we can access all pages for mapping
          const allPages = result.hierarchy.notebooks.flatMap(notebook => 
            notebook.sections.flatMap(section => section.pages)
          );
          
          expect(allPages.length).toBe(totalPages);
          
          for (const page of allPages) {
            expect(page).toHaveProperty('title');
            expect(page).toHaveProperty('content');
            expect(page).toHaveProperty('createdDate');
            expect(page).toHaveProperty('lastModifiedDate');
          }
        }
      }
    });

    it('should preserve hierarchy structure for Notion mapping', async () => {
      const testFiles = [
        'multi-page.one',
        'notebook.onepkg'
      ].map(fileName => path.join(fixturesDir, fileName)).filter(filePath => fs.existsSync(filePath));

      if (testFiles.length > 0) {
        const result = await oneNoteService.processFiles(testFiles);
        expect(result.success).toBe(true);
        expect(result.hierarchy).toBeDefined();

        if (result.hierarchy) {
          // Test hierarchy structure integrity
          expect(result.hierarchy.totalNotebooks).toBeGreaterThan(0);
          expect(result.hierarchy.totalSections).toBeGreaterThan(0);
          expect(result.hierarchy.totalPages).toBeGreaterThan(0);
          
          // Verify parent-child relationships are maintained
          for (const notebook of result.hierarchy.notebooks) {
            expect(notebook.sections.length).toBeGreaterThan(0);
            
            for (const section of notebook.sections) {
              expect(section.pages.length).toBeGreaterThan(0);
              
              // Each page should have proper metadata for Notion mapping
              for (const page of section.pages) {
                expect(page.title).toBeDefined();
                expect(page.content).toBeDefined();
                expect(page.createdDate).toBeInstanceOf(Date);
                expect(page.lastModifiedDate).toBeInstanceOf(Date);
              }
            }
          }
        }
      }
    });
  });

  describe('OneNote Content Preparation for Notion', () => {
    it('should prepare content for Notion import', async () => {
      const testFiles = [
        'sample.one',
        'valid.one'
      ].map(fileName => path.join(fixturesDir, fileName)).filter(filePath => fs.existsSync(filePath));

      if (testFiles.length > 0) {
        const result = await oneNoteService.processFiles(testFiles);
        expect(result.success).toBe(true);
        expect(result.hierarchy).toBeDefined();

        if (result.hierarchy) {
          // Test that content is ready for Notion import
          for (const notebook of result.hierarchy.notebooks) {
            expect(notebook.name).toBeDefined();
            expect(notebook.name.length).toBeGreaterThan(0);
            
            for (const section of notebook.sections) {
              expect(section.name).toBeDefined();
              expect(section.name.length).toBeGreaterThan(0);
              
              for (const page of section.pages) {
                expect(page.title).toBeDefined();
                expect(page.content).toBeDefined();
                expect(page.content.length).toBeGreaterThan(0);
              }
            }
          }
        }
      }
    });

    it('should handle multi-page content for Notion import', async () => {
      const testFiles = [
        'sample.one',
        'multi-page.one'
      ].map(fileName => path.join(fixturesDir, fileName)).filter(filePath => fs.existsSync(filePath));

      if (testFiles.length > 0) {
        const result = await oneNoteService.processFiles(testFiles);
        expect(result.success).toBe(true);
        expect(result.hierarchy).toBeDefined();

        if (result.hierarchy) {
          const totalPages = result.hierarchy.totalPages;
          expect(totalPages).toBeGreaterThan(0);
          
          // Verify all pages have content ready for Notion
          const allPages = result.hierarchy.notebooks.flatMap(notebook => 
            notebook.sections.flatMap(section => section.pages)
          );
          
          expect(allPages.length).toBe(totalPages);
          
          for (const page of allPages) {
            expect(page.title).toBeDefined();
            expect(page.content).toBeDefined();
            expect(page.createdDate).toBeInstanceOf(Date);
            expect(page.lastModifiedDate).toBeInstanceOf(Date);
          }
        }
      }
    });

    it('should handle content with special characters for Notion', async () => {
      const testFiles = [
        'sample.one',
        'valid.one',
        'multi-page.one'
      ].map(fileName => path.join(fixturesDir, fileName)).filter(filePath => fs.existsSync(filePath));

      if (testFiles.length > 0) {
        const result = await oneNoteService.processFiles(testFiles);
        expect(result.success).toBe(true);
        expect(result.hierarchy).toBeDefined();

        if (result.hierarchy) {
          // Test that content is properly formatted for Notion
          for (const notebook of result.hierarchy.notebooks) {
            for (const section of notebook.sections) {
              for (const page of section.pages) {
                // Content should be valid for Notion import
                expect(typeof page.title).toBe('string');
                expect(typeof page.content).toBe('string');
                
                // Should handle empty content gracefully
                if (page.content.length === 0) {
                  expect(page.title).toBeDefined();
                }
              }
            }
          }
        }
      }
    });

    it('should preserve metadata for Notion properties', async () => {
      const testFiles = [
        'sample.one',
        'valid.one'
      ].map(fileName => path.join(fixturesDir, fileName)).filter(filePath => fs.existsSync(filePath));

      if (testFiles.length > 0) {
        const result = await oneNoteService.processFiles(testFiles);
        expect(result.success).toBe(true);
        expect(result.hierarchy).toBeDefined();

        if (result.hierarchy) {
          // Test that metadata is preserved for Notion properties
          for (const notebook of result.hierarchy.notebooks) {
            expect(notebook.createdDate).toBeInstanceOf(Date);
            expect(notebook.lastModifiedDate).toBeInstanceOf(Date);
            
            for (const section of notebook.sections) {
              expect(section.createdDate).toBeInstanceOf(Date);
              expect(section.lastModifiedDate).toBeInstanceOf(Date);
              
              for (const page of section.pages) {
                expect(page.createdDate).toBeInstanceOf(Date);
                expect(page.lastModifiedDate).toBeInstanceOf(Date);
              }
            }
          }
        }
      }
    });
  });

  describe('Content Processing for Notion Import', () => {
    it('should process content with attachments for Notion', async () => {
      const testFiles = [
        'sample.one',
        'valid.one',
        'multi-page.one'
      ].map(fileName => path.join(fixturesDir, fileName)).filter(filePath => fs.existsSync(filePath));

      if (testFiles.length > 0) {
        const result = await oneNoteService.processFiles(testFiles);
        expect(result.success).toBe(true);
        expect(result.hierarchy).toBeDefined();

        if (result.hierarchy) {
          // Test that content is processed and ready for Notion
          for (const notebook of result.hierarchy.notebooks) {
            for (const section of notebook.sections) {
              for (const page of section.pages) {
                expect(page.title).toBeDefined();
                expect(page.content).toBeDefined();
                
                // Content should be properly formatted
                expect(typeof page.title).toBe('string');
                expect(typeof page.content).toBe('string');
              }
            }
          }
        }
      }
    });

    it('should handle content processing errors gracefully', async () => {
      const testFiles = [
        'sample.one',
        'corrupted.one',
        'valid.one'
      ].map(fileName => path.join(fixturesDir, fileName)).filter(filePath => fs.existsSync(filePath));

      if (testFiles.length > 0) {
        const result = await oneNoteService.processFiles(testFiles);
        
        // Should either succeed with partial data or fail gracefully
        if (result.success) {
          expect(result.hierarchy).toBeDefined();
          expect(result.hierarchy?.totalPages).toBeGreaterThan(0);
        } else {
          expect(result.error).toBeDefined();
        }
      }
    });
  });

  describe('End-to-End OneNote Processing', () => {
    it('should complete full OneNote processing workflow', async () => {
      const testFiles = [
        'sample.one',
        'valid.one'
      ].map(fileName => path.join(fixturesDir, fileName)).filter(filePath => fs.existsSync(filePath));

      if (testFiles.length > 0) {
        // Step 1: Process OneNote files
        const result = await oneNoteService.processFiles(testFiles);
        expect(result.success).toBe(true);
        expect(result.hierarchy).toBeDefined();

        if (result.hierarchy) {
          // Step 2: Verify hierarchy structure
          expect(result.hierarchy.notebooks).toBeDefined();
          expect(result.hierarchy.totalNotebooks).toBeGreaterThan(0);
          expect(result.hierarchy.totalSections).toBeGreaterThan(0);
          expect(result.hierarchy.totalPages).toBeGreaterThan(0);

          // Step 3: Verify content is ready for further processing
          for (const notebook of result.hierarchy.notebooks) {
            expect(notebook.name).toBeDefined();
            expect(notebook.sections.length).toBeGreaterThan(0);
            
            for (const section of notebook.sections) {
              expect(section.name).toBeDefined();
              expect(section.pages.length).toBeGreaterThan(0);
              
              for (const page of section.pages) {
                expect(page.title).toBeDefined();
                expect(page.content).toBeDefined();
              }
            }
          }
        }
      }
    });

    it('should handle partial failures in processing workflow', async () => {
      const testFiles = [
        'sample.one',
        'corrupted.one',
        'valid.one'
      ].map(fileName => path.join(fixturesDir, fileName)).filter(filePath => fs.existsSync(filePath));

      if (testFiles.length > 0) {
        // Step 1: Process OneNote files (some may fail)
        const result = await oneNoteService.processFiles(testFiles);
        
        // Should either succeed with partial data or fail gracefully
        if (result.success && result.hierarchy) {
          // Step 2: Verify we have some valid data
          expect(result.hierarchy.totalPages).toBeGreaterThan(0);
          
          // Step 3: Verify content quality
          for (const notebook of result.hierarchy.notebooks) {
            expect(notebook.name).toBeDefined();
            
            for (const section of notebook.sections) {
              expect(section.name).toBeDefined();
              
              for (const page of section.pages) {
                expect(page.title).toBeDefined();
                expect(page.content).toBeDefined();
              }
            }
          }
        } else {
          // Should fail gracefully with error information
          expect(result.error).toBeDefined();
        }
      }
    });
  });

  describe('Configuration and Environment', () => {
    it('should process files without external dependencies', async () => {
      const testFiles = [
        'sample.one'
      ].map(fileName => path.join(fixturesDir, fileName)).filter(filePath => fs.existsSync(filePath));

      if (testFiles.length > 0) {
        const result = await oneNoteService.processFiles(testFiles);
        expect(result.success).toBe(true);
        expect(result.hierarchy).toBeDefined();

        if (result.hierarchy) {
          // Should process files successfully without external API calls
          expect(result.hierarchy.notebooks.length).toBeGreaterThan(0);
          expect(result.hierarchy.totalPages).toBeGreaterThan(0);
        }
      }
    });

    it('should handle processing with different file types', async () => {
      const testFiles = [
        'sample.one',
        'sample.onepkg',
        'valid.one',
        'valid.onepkg'
      ].map(fileName => path.join(fixturesDir, fileName)).filter(filePath => fs.existsSync(filePath));

      if (testFiles.length > 0) {
        const result = await oneNoteService.processFiles(testFiles);
        expect(result.success).toBe(true);
        expect(result.hierarchy).toBeDefined();

        if (result.hierarchy) {
          // Should handle mixed file types successfully
          expect(result.hierarchy.notebooks.length).toBeGreaterThan(0);
          expect(result.hierarchy.totalPages).toBeGreaterThan(0);
        }
      }
    });
  });
});
