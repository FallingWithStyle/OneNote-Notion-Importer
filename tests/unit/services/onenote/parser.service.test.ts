/**
 * Tests for OneNote parser service
 * Following TDD Red-Green-Refactor cycle
 */

import { OneNoteParserService, IOneNoteParserService } from '../../../../src/services/onenote/parser.service';
import { OneNoteHierarchy, OneNoteSection, OneNotePage, OneNoteParsingOptions } from '../../../../src/types/onenote';
import * as path from 'path';

describe('OneNoteParserService', () => {
  let service: IOneNoteParserService;
  const testFixturesPath = path.join(__dirname, '../../../fixtures/onenote');

  beforeEach(() => {
    service = new OneNoteParserService();
  });

  describe('parseOneFile', () => {
    it('should parse a valid .one file and return section with pages', async () => {
      // Arrange
      const onePath = path.join(testFixturesPath, 'sample.one');
      
      // Act
      const section = await service.parseOneFile(onePath);

      // Assert
      expect(section).toBeDefined();
      expect(section.id).toBeDefined();
      expect(section.name).toBeDefined();
      expect(section.pages).toBeDefined();
      expect(section.pages.length).toBeGreaterThan(0);
      expect(section.createdDate).toBeInstanceOf(Date);
      expect(section.lastModifiedDate).toBeInstanceOf(Date);
      expect(section.metadata).toBeDefined();
    });

    it('should parse section with multiple pages', async () => {
      // Arrange
      const onePath = path.join(testFixturesPath, 'multi-page.one');
      
      // Act
      const section = await service.parseOneFile(onePath);

      // Assert
      expect(section.pages.length).toBeGreaterThan(1);
      section.pages.forEach(page => {
        expect(page.id).toBeDefined();
        expect(page.title).toBeDefined();
        expect(page.content).toBeDefined();
        expect(page.createdDate).toBeInstanceOf(Date);
        expect(page.lastModifiedDate).toBeInstanceOf(Date);
      });
    });

    it('should respect parsing options', async () => {
      // Arrange
      const onePath = path.join(testFixturesPath, 'sample.one');
      const options: OneNoteParsingOptions = {
        includeMetadata: true,
        extractImages: true,
        preserveFormatting: true,
        fallbackOnError: true
      };
      
      // Act
      const section = await service.parseOneFile(onePath, options);

      // Assert
      expect(section).toBeDefined();
      expect(section.metadata).toBeDefined();
      // Additional assertions based on options would go here
    });

    it('should handle corrupted .one files with fallback', async () => {
      // Arrange
      const corruptedPath = path.join(testFixturesPath, 'corrupted.one');
      const options: OneNoteParsingOptions = {
        includeMetadata: false,
        extractImages: false,
        preserveFormatting: false,
        fallbackOnError: true
      };
      
      // Act
      const section = await service.parseOneFile(corruptedPath, options);

      // Assert
      expect(section).toBeDefined();
      expect(section.name).toBe('Corrupted Section (Fallback)');
      expect(section.pages.length).toBe(1);
      expect(section.pages?.[0]?.title).toBe('Content could not be parsed');
    });

    it('should throw error for non-existent file', async () => {
      // Arrange
      const nonExistentPath = path.join(testFixturesPath, 'nonexistent.one');
      
      // Act & Assert
      await expect(service.parseOneFile(nonExistentPath))
        .rejects
        .toThrow('File not found');
    });
  });

  describe('parseMultipleOneFiles', () => {
    it('should parse multiple .one files and build complete hierarchy', async () => {
      // Arrange
      const filePaths = [
        path.join(testFixturesPath, 'section1.one'),
        path.join(testFixturesPath, 'section2.one'),
        path.join(testFixturesPath, 'section3.one')
      ];
      
      // Act
      const hierarchy = await service.parseMultipleOneFiles(filePaths);

      // Assert
      expect(hierarchy).toBeDefined();
      expect(hierarchy.notebooks).toBeDefined();
      expect(hierarchy.notebooks.length).toBeGreaterThan(0);
      expect(hierarchy.totalNotebooks).toBeGreaterThan(0);
      expect(hierarchy.totalSections).toBe(3);
      expect(hierarchy.totalPages).toBeGreaterThan(0);
    });

    it('should group sections into appropriate notebooks', async () => {
      // Arrange
      const filePaths = [
        path.join(testFixturesPath, 'notebook1-section1.one'),
        path.join(testFixturesPath, 'notebook1-section2.one'),
        path.join(testFixturesPath, 'notebook2-section1.one')
      ];
      
      // Act
      const hierarchy = await service.parseMultipleOneFiles(filePaths);

      // Assert
      expect(hierarchy.notebooks.length).toBe(2);
      const notebook1 = hierarchy.notebooks.find(n => n.name.includes('Notebook 1'));
      const notebook2 = hierarchy.notebooks.find(n => n.name.includes('Notebook 2'));
      expect(notebook1?.sections.length).toBe(2);
      expect(notebook2?.sections.length).toBe(1);
    });

    it('should handle mixed valid and corrupted files', async () => {
      // Arrange
      const filePaths = [
        path.join(testFixturesPath, 'valid.one'),
        path.join(testFixturesPath, 'corrupted.one'),
        path.join(testFixturesPath, 'another-valid.one')
      ];
      
      // Act
      const hierarchy = await service.parseMultipleOneFiles(filePaths);

      // Assert
      expect(hierarchy).toBeDefined();
      expect(hierarchy.totalSections).toBeGreaterThanOrEqual(2); // At least 2 valid sections
    });

    it('should handle empty file array', async () => {
      // Arrange
      const filePaths: string[] = [];
      
      // Act
      const hierarchy = await service.parseMultipleOneFiles(filePaths);

      // Assert
      expect(hierarchy).toBeDefined();
      expect(hierarchy.notebooks.length).toBe(0);
      expect(hierarchy.totalNotebooks).toBe(0);
      expect(hierarchy.totalSections).toBe(0);
      expect(hierarchy.totalPages).toBe(0);
    });
  });

  describe('parsePageContent', () => {
    it('should parse raw OneNote content data', async () => {
      // Arrange
      const content = Buffer.from('Sample OneNote content');
      
      // Act
      const page = await service.parsePageContent(content);

      // Assert
      expect(page).toBeDefined();
      expect(page.id).toBeDefined();
      expect(page.title).toBeDefined();
      expect(page.content).toBeDefined();
      expect(page.createdDate).toBeInstanceOf(Date);
      expect(page.lastModifiedDate).toBeInstanceOf(Date);
    });

    it('should handle empty content', async () => {
      // Arrange
      const content = Buffer.alloc(0);
      
      // Act
      const page = await service.parsePageContent(content);

      // Assert
      expect(page).toBeDefined();
      expect(page.content).toBe('');
      expect(page.title).toBe('Untitled Page');
    });

    it('should respect parsing options for content', async () => {
      // Arrange
      const content = Buffer.from('Sample content with **bold** text');
      const options: OneNoteParsingOptions = {
        includeMetadata: true,
        extractImages: true,
        preserveFormatting: true,
        fallbackOnError: false
      };
      
      // Act
      const page = await service.parsePageContent(content, options);

      // Assert
      expect(page).toBeDefined();
      expect(page.metadata).toBeDefined();
      // Additional assertions based on options would go here
    });
  });

  describe('extractMetadata', () => {
    it('should extract metadata from .one file', async () => {
      // Arrange
      const onePath = path.join(testFixturesPath, 'sample.one');
      
      // Act
      const metadata = await service.extractMetadata(onePath);

      // Assert
      expect(metadata).toBeDefined();
      expect(typeof metadata).toBe('object');
      expect(metadata.createdDate).toBeDefined();
      expect(metadata.lastModifiedDate).toBeDefined();
      expect(metadata.sectionId).toBeDefined();
    });

    it('should handle files with minimal metadata', async () => {
      // Arrange
      const onePath = path.join(testFixturesPath, 'minimal.one');
      
      // Act
      const metadata = await service.extractMetadata(onePath);

      // Assert
      expect(metadata).toBeDefined();
      expect(Object.keys(metadata).length).toBeGreaterThan(0);
    });

    it('should throw error for non-existent file', async () => {
      // Arrange
      const nonExistentPath = path.join(testFixturesPath, 'nonexistent.one');
      
      // Act & Assert
      await expect(service.extractMetadata(nonExistentPath))
        .rejects
        .toThrow('File not found');
    });
  });
});
