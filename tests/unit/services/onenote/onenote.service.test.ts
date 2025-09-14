/**
 * Tests for main OneNote service
 * Following TDD Red-Green-Refactor cycle
 */

import { OneNoteService, IOneNoteService } from '../../../../src/services/onenote/onenote.service';
import { OneNoteExtractionService, IOneNoteExtractionService } from '../../../../src/services/onenote/extraction.service';
import { OneNoteParserService, IOneNoteParserService } from '../../../../src/services/onenote/parser.service';
import { OneNoteDisplayService, IOneNoteDisplayService } from '../../../../src/services/onenote/display.service';
import { OneNoteErrorHandlerService, IOneNoteErrorHandlerService } from '../../../../src/services/onenote/error-handler.service';
import { OneNoteHierarchy, OneNoteExtractionResult, OneNoteParsingOptions } from '../../../../src/types/onenote';
import * as path from 'path';

describe('OneNoteService', () => {
  let service: IOneNoteService;
  let mockExtractionService: jest.Mocked<IOneNoteExtractionService>;
  let mockParserService: jest.Mocked<IOneNoteParserService>;
  let mockDisplayService: jest.Mocked<IOneNoteDisplayService>;
  let mockErrorHandlerService: jest.Mocked<IOneNoteErrorHandlerService>;
  const testFixturesPath = path.join(__dirname, '../../../fixtures/onenote');

  beforeEach(() => {
    // Create mock services
    mockExtractionService = {
      extractFromOnepkg: jest.fn(),
      extractFromOne: jest.fn(),
      validateOneNoteFile: jest.fn(),
      extractMultiple: jest.fn()
    } as jest.Mocked<IOneNoteExtractionService>;

    mockParserService = {
      parseOneFile: jest.fn(),
      parseMultipleOneFiles: jest.fn(),
      parsePageContent: jest.fn(),
      extractMetadata: jest.fn()
    } as jest.Mocked<IOneNoteParserService>;

    mockDisplayService = {
      displayHierarchy: jest.fn(),
      displayNotebook: jest.fn(),
      displaySection: jest.fn(),
      displaySummary: jest.fn()
    } as jest.Mocked<IOneNoteDisplayService>;

    mockErrorHandlerService = {
      handleExtractionError: jest.fn(),
      handleParsingError: jest.fn(),
      isRecoverableError: jest.fn(),
      getFallbackContent: jest.fn()
    } as jest.Mocked<IOneNoteErrorHandlerService>;

    service = new OneNoteService(
      mockExtractionService,
      mockParserService,
      mockDisplayService,
      mockErrorHandlerService
    );
  });

  describe('processFiles', () => {
    it('should process multiple OneNote files successfully', async () => {
      // Arrange
      const filePaths = [
        path.join(testFixturesPath, 'notebook1.onepkg'),
        path.join(testFixturesPath, 'section1.one')
      ];
      const mockHierarchy: OneNoteHierarchy = {
        notebooks: [],
        totalNotebooks: 2,
        totalSections: 3,
        totalPages: 10
      };
      const mockResult: OneNoteExtractionResult = {
        success: true,
        hierarchy: mockHierarchy,
        extractedFiles: ['file1.one', 'file2.one']
      };

      mockExtractionService.extractMultiple.mockResolvedValue(mockResult);

      // Act
      const result = await service.processFiles(filePaths);

      // Assert
      expect(result.success).toBe(true);
      expect(result.hierarchy).toBeDefined();
      expect(result.hierarchy?.totalNotebooks).toBe(2);
      expect(mockExtractionService.extractMultiple).toHaveBeenCalledWith(filePaths, undefined);
    });

    it('should process files with custom options', async () => {
      // Arrange
      const filePaths = [path.join(testFixturesPath, 'notebook.onepkg')];
      const options: OneNoteParsingOptions = {
        includeMetadata: true,
        extractImages: true,
        preserveFormatting: true,
        fallbackOnError: true
      };
      const mockResult: OneNoteExtractionResult = {
        success: true,
        hierarchy: {
          notebooks: [],
          totalNotebooks: 1,
          totalSections: 2,
          totalPages: 5
        }
      };

      mockExtractionService.extractMultiple.mockResolvedValue(mockResult);

      // Act
      const result = await service.processFiles(filePaths, options);

      // Assert
      expect(result.success).toBe(true);
      expect(mockExtractionService.extractMultiple).toHaveBeenCalledWith(filePaths, options);
    });

    it('should handle extraction errors with fallback', async () => {
      // Arrange
      const filePaths = [path.join(testFixturesPath, 'corrupted.onepkg')];
      const mockError = new Error('Extraction failed');
      const mockFallbackResult: OneNoteExtractionResult = {
        success: true,
        hierarchy: {
          notebooks: [],
          totalNotebooks: 1,
          totalSections: 1,
          totalPages: 1
        }
      };

      mockExtractionService.extractMultiple.mockRejectedValue(mockError);
      mockErrorHandlerService.handleExtractionError.mockResolvedValue(mockFallbackResult);

      // Act
      const result = await service.processFiles(filePaths);

      // Assert
      expect(result.success).toBe(true);
      expect(mockErrorHandlerService.handleExtractionError).toHaveBeenCalledWith(mockError, filePaths[0]);
    });

    it('should handle parsing errors with fallback', async () => {
      // Arrange
      const filePaths = [path.join(testFixturesPath, 'unparseable.one')];
      const mockError = new Error('Parsing failed');
      const mockFallbackResult: OneNoteExtractionResult = {
        success: true,
        hierarchy: {
          notebooks: [],
          totalNotebooks: 1,
          totalSections: 1,
          totalPages: 1
        }
      };

      mockExtractionService.extractMultiple.mockRejectedValue(mockError);
      mockErrorHandlerService.handleParsingError.mockResolvedValue(mockFallbackResult);

      // Act
      const result = await service.processFiles(filePaths);

      // Assert
      expect(result.success).toBe(true);
      expect(mockErrorHandlerService.handleParsingError).toHaveBeenCalledWith(mockError, filePaths[0]);
    });

    it('should handle non-recoverable errors', async () => {
      // Arrange
      const filePaths = [path.join(testFixturesPath, 'nonexistent.onepkg')];
      const mockError = new Error('File not found');
      const mockErrorResult: OneNoteExtractionResult = {
        success: false,
        error: 'File not found'
      };

      mockExtractionService.extractMultiple.mockRejectedValue(mockError);
      mockErrorHandlerService.handleExtractionError.mockResolvedValue(mockErrorResult);
      mockErrorHandlerService.isRecoverableError.mockReturnValue(false);

      // Act
      const result = await service.processFiles(filePaths);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle empty file array', async () => {
      // Arrange
      const filePaths: string[] = [];
      const mockResult: OneNoteExtractionResult = {
        success: true,
        hierarchy: {
          notebooks: [],
          totalNotebooks: 0,
          totalSections: 0,
          totalPages: 0
        }
      };

      mockExtractionService.extractMultiple.mockResolvedValue(mockResult);

      // Act
      const result = await service.processFiles(filePaths);

      // Assert
      expect(result.success).toBe(true);
      expect(result.hierarchy?.totalNotebooks).toBe(0);
    });
  });

  describe('displayHierarchy', () => {
    it('should display hierarchy using display service', () => {
      // Arrange
      const mockHierarchy: OneNoteHierarchy = {
        notebooks: [],
        totalNotebooks: 1,
        totalSections: 2,
        totalPages: 5
      };
      const options = { showMetadata: true };

      // Act
      service.displayHierarchy(mockHierarchy, options);

      // Assert
      expect(mockDisplayService.displayHierarchy).toHaveBeenCalledWith(mockHierarchy, options);
    });

    it('should display hierarchy with default options', () => {
      // Arrange
      const mockHierarchy: OneNoteHierarchy = {
        notebooks: [],
        totalNotebooks: 1,
        totalSections: 2,
        totalPages: 5
      };

      // Act
      service.displayHierarchy(mockHierarchy);

      // Assert
      expect(mockDisplayService.displayHierarchy).toHaveBeenCalledWith(mockHierarchy, undefined);
    });
  });

  describe('validateFiles', () => {
    it('should validate multiple files', async () => {
      // Arrange
      const filePaths = [
        path.join(testFixturesPath, 'valid.onepkg'),
        path.join(testFixturesPath, 'valid.one'),
        path.join(testFixturesPath, 'invalid.txt')
      ];

      mockExtractionService.validateOneNoteFile
        .mockResolvedValueOnce({ path: filePaths[0]!, type: 'onepkg', size: 1000, isValid: true, lastModified: new Date() })
        .mockResolvedValueOnce({ path: filePaths[1]!, type: 'one', size: 500, isValid: true, lastModified: new Date() })
        .mockResolvedValueOnce({ path: filePaths[2]!, type: 'one', size: 0, isValid: false, lastModified: new Date() });

      // Act
      const results = await service.validateFiles(filePaths);

      // Assert
      expect(results).toEqual([true, true, false]);
      expect(mockExtractionService.validateOneNoteFile).toHaveBeenCalledTimes(3);
    });

    it('should handle validation errors', async () => {
      // Arrange
      const filePaths = [path.join(testFixturesPath, 'error.onepkg')];
      const mockError = new Error('Validation failed');

      mockExtractionService.validateOneNoteFile.mockRejectedValue(mockError);

      // Act
      const results = await service.validateFiles(filePaths);

      // Assert
      expect(results).toEqual([false]);
    });

    it('should handle empty file array', async () => {
      // Arrange
      const filePaths: string[] = [];

      // Act
      const results = await service.validateFiles(filePaths);

      // Assert
      expect(results).toEqual([]);
    });
  });
});
