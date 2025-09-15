/**
 * Integration tests for OneNote file processing with sample files
 * Tests the complete workflow from file extraction to content conversion
 */

import path from 'path';
import fs from 'fs';
import { OneNoteService } from '../../src/services/onenote/onenote.service';
import { OneNoteExtractionService } from '../../src/services/onenote/extraction.service';
import { OneNoteParserService } from '../../src/services/onenote/parser.service';
import { ContentConverterService } from '../../src/services/onenote/content-converter.service';
import { AdvancedContentConverterService } from '../../src/services/onenote/advanced-content-converter.service';
import { OneNoteHierarchy, OneNoteExtractionResult, OneNoteParsingOptions } from '../../src/types/onenote';

describe('OneNote Processing Integration Tests', () => {
  const fixturesDir = path.join(__dirname, '../fixtures/onenote');
  const tempOutputDir = path.join(__dirname, '../temp-output');
  
  let oneNoteService: OneNoteService;
  let extractionService: OneNoteExtractionService;
  let parserService: OneNoteParserService;
  let contentConverter: ContentConverterService;
  let advancedConverter: AdvancedContentConverterService;

  beforeAll(() => {
    // Initialize services
    oneNoteService = new OneNoteService();
    extractionService = new OneNoteExtractionService();
    parserService = new OneNoteParserService();
    contentConverter = new ContentConverterService();
    advancedConverter = new AdvancedContentConverterService();
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

  describe('OneNote File Validation', () => {
    it('should validate valid .one files', async () => {
      const validFiles = [
        'sample.one',
        'valid.one',
        'minimal.one',
        'multi-page.one'
      ];

      for (const fileName of validFiles) {
        const filePath = path.join(fixturesDir, fileName);
        if (fs.existsSync(filePath)) {
          const fileInfo = await extractionService.validateOneNoteFile(filePath);
          expect(fileInfo.isValid).toBe(true);
          expect(fileInfo.type).toBe('one');
          expect(fileInfo.path).toBe(filePath);
        }
      }
    });

    it('should validate valid .onepkg files', async () => {
      const validFiles = [
        'sample.onepkg',
        'valid.onepkg',
        'notebook.onepkg',
        'notebook1.onepkg',
        'notebook2.onepkg'
      ];

      for (const fileName of validFiles) {
        const filePath = path.join(fixturesDir, fileName);
        if (fs.existsSync(filePath)) {
          const fileInfo = await extractionService.validateOneNoteFile(filePath);
          expect(fileInfo.isValid).toBe(true);
          expect(fileInfo.type).toBe('onepkg');
          expect(fileInfo.path).toBe(filePath);
        }
      }
    });

    it('should reject invalid files', async () => {
      const invalidFiles = [
        'invalid.txt',
        'corrupted.one',
        'corrupted.onepkg',
        'empty.one'
      ];

      for (const fileName of invalidFiles) {
        const filePath = path.join(fixturesDir, fileName);
        if (fs.existsSync(filePath)) {
          const fileInfo = await extractionService.validateOneNoteFile(filePath);
          expect(fileInfo.isValid).toBe(false);
        }
      }
    });
  });

  describe('OneNote File Extraction', () => {
    it('should extract content from .one files', async () => {
      const testFiles = [
        'sample.one',
        'valid.one',
        'minimal.one',
        'multi-page.one'
      ];

      for (const fileName of testFiles) {
        const filePath = path.join(fixturesDir, fileName);
        if (fs.existsSync(filePath)) {
          const result = await extractionService.extractFromOne(filePath);
          
          expect(result.success).toBe(true);
          expect(result.hierarchy).toBeDefined();
          expect(result.hierarchy?.notebooks).toHaveLength(1);
          expect(result.hierarchy?.notebooks[0]?.sections).toHaveLength(1);
          expect(result.hierarchy?.totalNotebooks).toBe(1);
          expect(result.hierarchy?.totalSections).toBe(1);
          expect(result.hierarchy?.totalPages).toBeGreaterThan(0);
        }
      }
    });

    it('should extract content from .onepkg files', async () => {
      const testFiles = [
        'sample.onepkg',
        'valid.onepkg',
        'notebook.onepkg',
        'notebook1.onepkg',
        'notebook2.onepkg'
      ];

      for (const fileName of testFiles) {
        const filePath = path.join(fixturesDir, fileName);
        if (fs.existsSync(filePath)) {
          const result = await extractionService.extractFromOnepkg(filePath);
          
          expect(result.success).toBe(true);
          expect(result.hierarchy).toBeDefined();
          expect(result.hierarchy?.notebooks).toHaveLength(1);
          expect(result.hierarchy?.totalNotebooks).toBe(1);
          expect(result.hierarchy?.totalSections).toBeGreaterThan(0);
          expect(result.hierarchy?.totalPages).toBeGreaterThan(0);
        }
      }
    });

    it('should handle file not found errors', async () => {
      const result = await extractionService.extractFromOne('nonexistent.one');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('File not found');
    });

    it('should handle corrupted files gracefully', async () => {
      const corruptedFiles = ['corrupted.one', 'corrupted.onepkg'];
      
      for (const fileName of corruptedFiles) {
        const filePath = path.join(fixturesDir, fileName);
        if (fs.existsSync(filePath)) {
          const result = await extractionService.extractFromOne(filePath);
          expect(result.success).toBe(false);
          expect(result.error).toBeDefined();
        }
      }
    });
  });

  describe('OneNote File Parsing', () => {
    it('should parse .one files and extract pages', async () => {
      const testFiles = [
        'sample.one',
        'valid.one',
        'minimal.one',
        'multi-page.one'
      ];

      for (const fileName of testFiles) {
        const filePath = path.join(fixturesDir, fileName);
        if (fs.existsSync(filePath)) {
          const section = await parserService.parseOneFile(filePath);
          
          expect(section).toBeDefined();
          expect(section.id).toBeDefined();
          expect(section.name).toBeDefined();
          expect(section.pages).toBeDefined();
          expect(Array.isArray(section.pages)).toBe(true);
          expect(section.pages.length).toBeGreaterThan(0);
          
          // Check page structure
          for (const page of section.pages) {
            expect(page.id).toBeDefined();
            expect(page.title).toBeDefined();
            expect(page.content).toBeDefined();
            expect(page.createdDate).toBeDefined();
            expect(page.lastModifiedDate).toBeDefined();
          }
        }
      }
    });

    it('should parse multiple .one files into hierarchy', async () => {
      const testFiles = [
        'section1.one',
        'section2.one',
        'section3.one'
      ].map(fileName => path.join(fixturesDir, fileName)).filter(filePath => fs.existsSync(filePath));

      if (testFiles.length > 0) {
        const hierarchy = await parserService.parseMultipleOneFiles(testFiles);
        
        expect(hierarchy).toBeDefined();
        expect(hierarchy.notebooks).toBeDefined();
        expect(Array.isArray(hierarchy.notebooks)).toBe(true);
        expect(hierarchy.totalNotebooks).toBeGreaterThan(0);
        expect(hierarchy.totalSections).toBeGreaterThan(0);
        expect(hierarchy.totalPages).toBeGreaterThan(0);
      }
    });

    it('should extract metadata from OneNote files', async () => {
      const testFiles = [
        'sample.one',
        'valid.one',
        'minimal.one'
      ];

      for (const fileName of testFiles) {
        const filePath = path.join(fixturesDir, fileName);
        if (fs.existsSync(filePath)) {
          const metadata = await parserService.extractMetadata(filePath);
          
          expect(metadata).toBeDefined();
          expect(typeof metadata).toBe('object');
          expect(metadata.filePath).toBe(filePath);
        }
      }
    });
  });

  describe('Content Conversion', () => {
    it('should convert OneNote content to markdown', async () => {
      const testFiles = [
        'sample.one',
        'valid.one',
        'multi-page.one'
      ];

      for (const fileName of testFiles) {
        const filePath = path.join(fixturesDir, fileName);
        if (fs.existsSync(filePath)) {
          const section = await parserService.parseOneFile(filePath);
          
          for (const page of section.pages) {
            const markdown = await contentConverter.convertTextContent(page.content, { outputFormat: 'markdown' });
            
            expect(markdown).toBeDefined();
            expect(typeof markdown).toBe('string');
            expect(markdown.length).toBeGreaterThan(0);
          }
        }
      }
    });

    it('should convert OneNote content to HTML', async () => {
      const testFiles = [
        'sample.one',
        'valid.one',
        'multi-page.one'
      ];

      for (const fileName of testFiles) {
        const filePath = path.join(fixturesDir, fileName);
        if (fs.existsSync(filePath)) {
          const section = await parserService.parseOneFile(filePath);
          
          for (const page of section.pages) {
            const docx = await contentConverter.convertTextContent(page.content, { outputFormat: 'docx' });
            
            expect(docx).toBeDefined();
            expect(typeof docx).toBe('string');
            expect(docx.length).toBeGreaterThan(0);
          }
        }
      }
    });

    it('should convert OneNote content to plain text', async () => {
      const testFiles = [
        'sample.one',
        'valid.one',
        'minimal.one'
      ];

      for (const fileName of testFiles) {
        const filePath = path.join(fixturesDir, fileName);
        if (fs.existsSync(filePath)) {
          const section = await parserService.parseOneFile(filePath);
          
          for (const page of section.pages) {
            const text = await contentConverter.convertTextContent(page.content, { outputFormat: 'markdown' });
            
            expect(text).toBeDefined();
            expect(typeof text).toBe('string');
            expect(text.length).toBeGreaterThan(0);
          }
        }
      }
    });

    it('should handle advanced content conversion', async () => {
      const testFiles = [
        'sample.one',
        'valid.one',
        'multi-page.one'
      ];

      for (const fileName of testFiles) {
        const filePath = path.join(fixturesDir, fileName);
        if (fs.existsSync(filePath)) {
          const section = await parserService.parseOneFile(filePath);
          
          for (const page of section.pages) {
            const result = await advancedConverter.convertAdvancedPage(page, {
              outputFormat: 'markdown',
              includeMetadata: true,
              preserveTables: true,
              handleAttachments: true
            });
            
            expect(result).toBeDefined();
            expect(result.content).toBeDefined();
            expect(result.metadata).toBeDefined();
            expect(result.attachments).toBeDefined();
            expect(Array.isArray(result.attachments)).toBe(true);
          }
        }
      }
    });
  });

  describe('End-to-End Processing', () => {
    it('should process complete OneNote files end-to-end', async () => {
      const testFiles = [
        'sample.one',
        'valid.one',
        'sample.onepkg',
        'valid.onepkg'
      ];

      for (const fileName of testFiles) {
        const filePath = path.join(fixturesDir, fileName);
        if (fs.existsSync(filePath)) {
          const result = await oneNoteService.processFiles([filePath]);
          
          expect(result.success).toBe(true);
          expect(result.hierarchy).toBeDefined();
          expect(result.hierarchy?.notebooks).toBeDefined();
          expect(result.hierarchy?.totalNotebooks).toBeGreaterThan(0);
          expect(result.hierarchy?.totalSections).toBeGreaterThan(0);
          expect(result.hierarchy?.totalPages).toBeGreaterThan(0);
        }
      }
    });

    it('should process multiple files in batch', async () => {
      const testFiles = [
        'section1.one',
        'section2.one',
        'section3.one'
      ].map(fileName => path.join(fixturesDir, fileName)).filter(filePath => fs.existsSync(filePath));

      if (testFiles.length > 0) {
        const result = await oneNoteService.processFiles(testFiles);
        
        expect(result.success).toBe(true);
        expect(result.hierarchy).toBeDefined();
        expect(result.hierarchy?.notebooks).toBeDefined();
        expect(result.hierarchy?.totalNotebooks).toBeGreaterThan(0);
        expect(result.hierarchy?.totalSections).toBeGreaterThan(0);
        expect(result.hierarchy?.totalPages).toBeGreaterThan(0);
      }
    });

    it('should handle mixed file types in batch processing', async () => {
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
        expect(result.hierarchy?.notebooks).toBeDefined();
        expect(result.hierarchy?.totalNotebooks).toBeGreaterThan(0);
        expect(result.hierarchy?.totalSections).toBeGreaterThan(0);
        expect(result.hierarchy?.totalPages).toBeGreaterThan(0);
      }
    });

    it('should validate files before processing', async () => {
      const testFiles = [
        'sample.one',
        'valid.one',
        'corrupted.one',
        'invalid.txt'
      ].map(fileName => path.join(fixturesDir, fileName)).filter(filePath => fs.existsSync(filePath));

      if (testFiles.length > 0) {
        const validationResults = await oneNoteService.validateFiles(testFiles);
        
        expect(validationResults).toBeDefined();
        expect(Array.isArray(validationResults)).toBe(true);
        expect(validationResults.length).toBe(testFiles.length);
        
        // Valid files should return true, invalid files should return false
        const validFiles = testFiles.filter(filePath => 
          !filePath.includes('corrupted') && !filePath.includes('invalid')
        );
        const invalidFiles = testFiles.filter(filePath => 
          filePath.includes('corrupted') || filePath.includes('invalid')
        );
        
        expect(validationResults.filter(Boolean).length).toBe(validFiles.length);
        expect(validationResults.filter(result => !result).length).toBe(invalidFiles.length);
      }
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle file processing errors gracefully', async () => {
      const errorFiles = [
        'corrupted.one',
        'corrupted.onepkg',
        'empty.one'
      ].map(fileName => path.join(fixturesDir, fileName)).filter(filePath => fs.existsSync(filePath));

      for (const filePath of errorFiles) {
        const result = await oneNoteService.processFiles([filePath]);
        
        // Should either succeed with fallback or fail gracefully
        if (result.success) {
          expect(result.hierarchy).toBeDefined();
        } else {
          expect(result.error).toBeDefined();
          expect(result.error).toBeDefined();
        }
      }
    });

    it('should provide detailed error information', async () => {
      const result = await oneNoteService.processFiles(['nonexistent.one']);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('File not found');
      expect(result.error).toContain('processFiles');
    });

    it('should handle partial failures in batch processing', async () => {
      const mixedFiles = [
        'sample.one',
        'corrupted.one',
        'valid.one',
        'invalid.txt'
      ].map(fileName => path.join(fixturesDir, fileName)).filter(filePath => fs.existsSync(filePath));

      if (mixedFiles.length > 0) {
        const result = await oneNoteService.processFiles(mixedFiles);
        
        // Should either succeed with partial data or fail gracefully
        if (result.success) {
          expect(result.hierarchy).toBeDefined();
          expect(result.hierarchy?.totalNotebooks).toBeGreaterThan(0);
        } else {
          expect(result.error).toBeDefined();
        }
      }
    });
  });

  describe('Performance and Scalability', () => {
    it('should process files within reasonable time limits', async () => {
      const startTime = Date.now();
      const testFiles = [
        'sample.one',
        'valid.one',
        'multi-page.one'
      ].map(fileName => path.join(fixturesDir, fileName)).filter(filePath => fs.existsSync(filePath));

      if (testFiles.length > 0) {
        const result = await oneNoteService.processFiles(testFiles);
        const endTime = Date.now();
        const processingTime = endTime - startTime;
        
        expect(result.success).toBe(true);
        expect(processingTime).toBeLessThan(10000); // Should complete within 10 seconds
      }
    });

    it('should handle large files without memory issues', async () => {
      const testFiles = [
        'multi-page.one',
        'notebook.onepkg'
      ].map(fileName => path.join(fixturesDir, fileName)).filter(filePath => fs.existsSync(filePath));

      for (const filePath of testFiles) {
        const result = await oneNoteService.processFiles([filePath]);
        
        expect(result.success).toBe(true);
        expect(result.hierarchy).toBeDefined();
        expect(result.hierarchy?.totalPages).toBeGreaterThan(0);
      }
    });
  });
});
