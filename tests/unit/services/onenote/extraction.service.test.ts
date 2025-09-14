/**
 * Tests for OneNote extraction service
 * Following TDD Red-Green-Refactor cycle
 */

import { OneNoteExtractionService, IOneNoteExtractionService } from '../../../../src/services/onenote/extraction.service';
import { OneNoteExtractionResult, OneNoteFileInfo, OneNoteParsingOptions } from '../../../../src/types/onenote';
import * as fs from 'fs';
import * as path from 'path';

describe('OneNoteExtractionService', () => {
  let service: IOneNoteExtractionService;
  const testFixturesPath = path.join(__dirname, '../../../fixtures/onenote');

  beforeEach(() => {
    service = new OneNoteExtractionService();
  });

  describe('extractFromOnepkg', () => {
    it('should extract content from a valid .onepkg file', async () => {
      // Arrange
      const onepkgPath = path.join(testFixturesPath, 'sample.onepkg');
      
      // Act
      const result = await service.extractFromOnepkg(onepkgPath);

      // Assert
      expect(result.success).toBe(true);
      expect(result.hierarchy).toBeDefined();
      expect(result.hierarchy?.notebooks).toHaveLength(1);
      expect(result.hierarchy?.totalNotebooks).toBe(1);
      expect(result.hierarchy?.totalSections).toBeGreaterThan(0);
      expect(result.hierarchy?.totalPages).toBeGreaterThan(0);
      expect(result.extractedFiles).toBeDefined();
      expect(result.extractedFiles?.length).toBeGreaterThan(0);
    });

    it('should handle corrupted .onepkg files gracefully', async () => {
      // Arrange
      const corruptedPath = path.join(testFixturesPath, 'corrupted.onepkg');
      
      // Act
      const result = await service.extractFromOnepkg(corruptedPath);

      // Assert
      expect(result.success).toBe(true);
      expect(result.hierarchy).toBeDefined();
      expect(result.hierarchy?.notebooks[0]?.name).toBe('Fallback Notebook');
    });

    it('should respect parsing options', async () => {
      // Arrange
      const onepkgPath = path.join(testFixturesPath, 'sample.onepkg');
      const options: OneNoteParsingOptions = {
        includeMetadata: true,
        extractImages: true,
        preserveFormatting: true,
        fallbackOnError: true
      };
      
      // Act
      const result = await service.extractFromOnepkg(onepkgPath, options);

      // Assert
      expect(result.success).toBe(true);
      expect(result.hierarchy).toBeDefined();
      // Additional assertions based on options would go here
    });

    it('should throw error for non-existent file', async () => {
      // Arrange
      const nonExistentPath = path.join(testFixturesPath, 'nonexistent.onepkg');
      
      // Act & Assert
      await expect(service.extractFromOnepkg(nonExistentPath))
        .rejects
        .toThrow('File not found');
    });
  });

  describe('extractFromOne', () => {
    it('should extract content from a valid .one file', async () => {
      // Arrange
      const onePath = path.join(testFixturesPath, 'sample.one');
      
      // Act
      const result = await service.extractFromOne(onePath);

      // Assert
      expect(result.success).toBe(true);
      expect(result.hierarchy).toBeDefined();
      expect(result.hierarchy?.notebooks).toHaveLength(1);
      expect(result.hierarchy?.notebooks?.[0]?.sections).toHaveLength(1);
      expect(result.hierarchy?.totalSections).toBe(1);
      expect(result.hierarchy?.totalPages).toBeGreaterThan(0);
    });

    it('should handle corrupted .one files gracefully', async () => {
      // Arrange
      const corruptedPath = path.join(testFixturesPath, 'corrupted.one');
      
      // Act
      const result = await service.extractFromOne(corruptedPath);

      // Assert
      expect(result.success).toBe(true);
      expect(result.hierarchy).toBeDefined();
      expect(result.hierarchy?.notebooks[0]?.name).toBe('Fallback Notebook');
    });

    it('should respect parsing options for .one files', async () => {
      // Arrange
      const onePath = path.join(testFixturesPath, 'sample.one');
      const options: OneNoteParsingOptions = {
        includeMetadata: false,
        extractImages: false,
        preserveFormatting: false,
        fallbackOnError: true
      };
      
      // Act
      const result = await service.extractFromOne(onePath, options);

      // Assert
      expect(result.success).toBe(true);
      expect(result.hierarchy).toBeDefined();
    });
  });

  describe('validateOneNoteFile', () => {
    it('should validate a valid .onepkg file', async () => {
      // Arrange
      const onepkgPath = path.join(testFixturesPath, 'sample.onepkg');
      
      // Act
      const fileInfo = await service.validateOneNoteFile(onepkgPath);

      // Assert
      expect(fileInfo.type).toBe('onepkg');
      expect(fileInfo.isValid).toBe(true);
      expect(fileInfo.size).toBeGreaterThan(0);
      expect(fileInfo.path).toBe(onepkgPath);
    });

    it('should validate a valid .one file', async () => {
      // Arrange
      const onePath = path.join(testFixturesPath, 'sample.one');
      
      // Act
      const fileInfo = await service.validateOneNoteFile(onePath);

      // Assert
      expect(fileInfo.type).toBe('one');
      expect(fileInfo.isValid).toBe(true);
      expect(fileInfo.size).toBeGreaterThan(0);
      expect(fileInfo.path).toBe(onePath);
    });

    it('should identify invalid OneNote files', async () => {
      // Arrange
      const invalidPath = path.join(testFixturesPath, 'invalid.txt');
      
      // Act
      const fileInfo = await service.validateOneNoteFile(invalidPath);

      // Assert
      expect(fileInfo.isValid).toBe(false);
    });

    it('should handle non-existent files', async () => {
      // Arrange
      const nonExistentPath = path.join(testFixturesPath, 'nonexistent.onepkg');
      
      // Act & Assert
      await expect(service.validateOneNoteFile(nonExistentPath))
        .rejects
        .toThrow('File not found');
    });
  });

  describe('extractMultiple', () => {
    it('should extract content from multiple .onepkg files', async () => {
      // Arrange
      const filePaths = [
        path.join(testFixturesPath, 'notebook1.onepkg'),
        path.join(testFixturesPath, 'notebook2.onepkg')
      ];
      
      // Act
      const result = await service.extractMultiple(filePaths);

      // Assert
      expect(result.success).toBe(true);
      expect(result.hierarchy).toBeDefined();
      expect(result.hierarchy?.notebooks).toHaveLength(2);
      expect(result.hierarchy?.totalNotebooks).toBe(2);
    });

    it('should extract content from mixed .onepkg and .one files', async () => {
      // Arrange
      const filePaths = [
        path.join(testFixturesPath, 'notebook.onepkg'),
        path.join(testFixturesPath, 'section1.one'),
        path.join(testFixturesPath, 'section2.one')
      ];
      
      // Act
      const result = await service.extractMultiple(filePaths);

      // Assert
      expect(result.success).toBe(true);
      expect(result.hierarchy).toBeDefined();
      expect(result.hierarchy?.totalNotebooks).toBeGreaterThan(0);
      expect(result.hierarchy?.totalSections).toBeGreaterThan(0);
    });

    it('should handle partial failures gracefully', async () => {
      // Arrange
      const filePaths = [
        path.join(testFixturesPath, 'valid.onepkg'),
        path.join(testFixturesPath, 'corrupted.onepkg'),
        path.join(testFixturesPath, 'valid.one')
      ];
      
      // Act
      const result = await service.extractMultiple(filePaths);

      // Assert
      expect(result.success).toBe(true); // Should succeed with fallback
      expect(result.hierarchy).toBeDefined();
      expect(result.hierarchy?.totalNotebooks).toBeGreaterThan(0);
    });

    it('should handle empty file array', async () => {
      // Arrange
      const filePaths: string[] = [];
      
      // Act
      const result = await service.extractMultiple(filePaths);

      // Assert
      expect(result.success).toBe(true);
      expect(result.hierarchy?.totalNotebooks).toBe(0);
    });
  });
});
