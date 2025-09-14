/**
 * Tests for OneNote error handler service
 * Following TDD Red-Green-Refactor cycle
 */

import { OneNoteErrorHandlerService, IOneNoteErrorHandlerService, OneNoteError } from '../../../../src/services/onenote/error-handler.service';
import { OneNoteExtractionResult } from '../../../../src/types/onenote';
import * as path from 'path';

describe('OneNoteErrorHandlerService', () => {
  let service: IOneNoteErrorHandlerService;
  const testFixturesPath = path.join(__dirname, '../../../fixtures/onenote');

  beforeEach(() => {
    service = new OneNoteErrorHandlerService();
  });

  describe('handleExtractionError', () => {
    it('should handle file not found errors', async () => {
      // Arrange
      const error = new Error('File not found');
      const filePath = path.join(testFixturesPath, 'nonexistent.onepkg');
      
      // Act
      const result = await service.handleExtractionError(error, filePath);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('File not found');
      expect(result.hierarchy).toBeUndefined();
    });

    it('should handle corrupted file errors with fallback', async () => {
      // Arrange
      const error = new Error('Invalid file format');
      const filePath = path.join(testFixturesPath, 'corrupted.onepkg');
      
      // Act
      const result = await service.handleExtractionError(error, filePath);

      // Assert
      expect(result.success).toBe(true); // Should succeed with fallback
      expect(result.hierarchy).toBeDefined();
      expect(result.hierarchy?.notebooks).toHaveLength(1);
      expect(result.hierarchy?.notebooks?.[0]?.name).toContain('Fallback');
    });

    it('should handle permission denied errors', async () => {
      // Arrange
      const error = new Error('Permission denied');
      const filePath = path.join(testFixturesPath, 'restricted.onepkg');
      
      // Act
      const result = await service.handleExtractionError(error, filePath);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Permission denied');
    });

    it('should handle disk space errors', async () => {
      // Arrange
      const error = new Error('No space left on device');
      const filePath = path.join(testFixturesPath, 'large.onepkg');
      
      // Act
      const result = await service.handleExtractionError(error, filePath);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('No space left');
    });

    it('should handle unknown errors gracefully', async () => {
      // Arrange
      const error = new Error('Unknown error occurred');
      const filePath = path.join(testFixturesPath, 'unknown.onepkg');
      
      // Act
      const result = await service.handleExtractionError(error, filePath);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Unknown error');
    });
  });

  describe('handleParsingError', () => {
    it('should handle parsing errors with basic content extraction', async () => {
      // Arrange
      const error = new Error('Failed to parse OneNote format');
      const filePath = path.join(testFixturesPath, 'unparseable.one');
      
      // Act
      const result = await service.handleParsingError(error, filePath);

      // Assert
      expect(result.success).toBe(true); // Should succeed with fallback
      expect(result.hierarchy).toBeDefined();
      expect(result.hierarchy?.notebooks).toHaveLength(1);
      expect(result.hierarchy?.notebooks?.[0]?.sections).toHaveLength(1);
      expect(result.hierarchy?.notebooks?.[0]?.sections?.[0]?.pages).toHaveLength(1);
      expect(result.hierarchy?.notebooks?.[0]?.sections?.[0]?.pages?.[0]?.title).toContain('Raw Content');
    });

    it('should handle encoding errors', async () => {
      // Arrange
      const error = new Error('Invalid character encoding');
      const filePath = path.join(testFixturesPath, 'encoding-error.one');
      
      // Act
      const result = await service.handleParsingError(error, filePath);

      // Assert
      expect(result.success).toBe(true);
      expect(result.hierarchy).toBeDefined();
      expect(result.hierarchy?.notebooks?.[0]?.sections?.[0]?.pages?.[0]?.content).toContain('Encoding error');
    });

    it('should handle memory errors', async () => {
      // Arrange
      const error = new Error('Out of memory');
      const filePath = path.join(testFixturesPath, 'memory-error.one');
      
      // Act
      const result = await service.handleParsingError(error, filePath);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Out of memory');
    });

    it('should handle timeout errors', async () => {
      // Arrange
      const error = new Error('Operation timed out');
      const filePath = path.join(testFixturesPath, 'timeout.one');
      
      // Act
      const result = await service.handleParsingError(error, filePath);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('timed out');
    });
  });

  describe('isRecoverableError', () => {
    it('should identify recoverable errors', () => {
      // Arrange
      const recoverableErrors = [
        new Error('Invalid file format'),
        new Error('Corrupted data'),
        new Error('Unsupported version'),
        new Error('Missing metadata')
      ];
      
      // Act & Assert
      recoverableErrors.forEach(error => {
        expect(service.isRecoverableError(error)).toBe(true);
      });
    });

    it('should identify non-recoverable errors', () => {
      // Arrange
      const nonRecoverableErrors = [
        new Error('File not found'),
        new Error('Permission denied'),
        new Error('Out of memory'),
        new Error('Disk full'),
        new Error('Network error')
      ];
      
      // Act & Assert
      nonRecoverableErrors.forEach(error => {
        expect(service.isRecoverableError(error)).toBe(false);
      });
    });

    it('should handle OneNoteError objects', () => {
      // Arrange
      const oneNoteError: OneNoteError = {
        name: 'OneNoteError',
        message: 'Corrupted file',
        code: 'CORRUPTED_FILE',
        filePath: '/path/to/file.one',
        recoverable: true
      };
      
      // Act
      const isRecoverable = service.isRecoverableError(oneNoteError);
      
      // Assert
      expect(isRecoverable).toBe(true);
    });

    it('should handle OneNoteError objects with recoverable false', () => {
      // Arrange
      const oneNoteError: OneNoteError = {
        name: 'OneNoteError',
        message: 'File not found',
        code: 'FILE_NOT_FOUND',
        filePath: '/path/to/file.one',
        recoverable: false
      };
      
      // Act
      const isRecoverable = service.isRecoverableError(oneNoteError);
      
      // Assert
      expect(isRecoverable).toBe(false);
    });
  });

  describe('getFallbackContent', () => {
    it('should extract basic text content from corrupted file', async () => {
      // Arrange
      const filePath = path.join(testFixturesPath, 'corrupted.one');
      
      // Act
      const content = await service.getFallbackContent(filePath);

      // Assert
      expect(content).toBeDefined();
      expect(typeof content).toBe('string');
      expect(content.length).toBeGreaterThan(0);
      expect(content).toContain('Raw content extracted');
    });

    it('should handle empty files', async () => {
      // Arrange
      const filePath = path.join(testFixturesPath, 'empty.one');
      
      // Act
      const content = await service.getFallbackContent(filePath);

      // Assert
      expect(content).toBeDefined();
      expect(content).toBe('No content could be extracted');
    });

    it('should handle binary files', async () => {
      // Arrange
      const filePath = path.join(testFixturesPath, 'binary.one');
      
      // Act
      const content = await service.getFallbackContent(filePath);

      // Assert
      expect(content).toBeDefined();
      expect(content).toContain('Binary content detected');
    });

    it('should handle non-existent files', async () => {
      // Arrange
      const filePath = path.join(testFixturesPath, 'nonexistent.one');
      
      // Act & Assert
      await expect(service.getFallbackContent(filePath))
        .rejects
        .toThrow('File not found');
    });

    it('should handle permission denied files', async () => {
      // Arrange
      const filePath = path.join(testFixturesPath, 'restricted.one');
      
      // Act
      const content = await service.getFallbackContent(filePath);

      // Assert
      expect(content).toBeDefined();
      expect(content).toContain('Permission denied');
    });
  });
});
