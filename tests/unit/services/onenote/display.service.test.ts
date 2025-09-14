/**
 * Tests for OneNote display service
 * Following TDD Red-Green-Refactor cycle
 */

import { OneNoteDisplayService, IOneNoteDisplayService, DisplayOptions } from '../../../../src/services/onenote/display.service';
import { OneNoteHierarchy, OneNoteNotebook, OneNoteSection, OneNotePage } from '../../../../src/types/onenote';

describe('OneNoteDisplayService', () => {
  let service: IOneNoteDisplayService;
  let mockHierarchy: OneNoteHierarchy;
  let mockNotebook: OneNoteNotebook;
  let mockSection: OneNoteSection;
  let mockPage: OneNotePage;

  beforeEach(() => {
    service = new OneNoteDisplayService();
    
    // Create mock data
    mockPage = {
      id: 'page-1',
      title: 'Test Page',
      content: 'This is test content',
      createdDate: new Date('2023-01-01'),
      lastModifiedDate: new Date('2023-01-02'),
      metadata: { author: 'Test User' }
    };

    mockSection = {
      id: 'section-1',
      name: 'Test Section',
      pages: [mockPage],
      createdDate: new Date('2023-01-01'),
      lastModifiedDate: new Date('2023-01-02'),
      metadata: { color: 'blue' }
    };

    mockNotebook = {
      id: 'notebook-1',
      name: 'Test Notebook',
      sections: [mockSection],
      createdDate: new Date('2023-01-01'),
      lastModifiedDate: new Date('2023-01-02'),
      metadata: { description: 'Test notebook' }
    };

    mockHierarchy = {
      notebooks: [mockNotebook],
      totalNotebooks: 1,
      totalSections: 1,
      totalPages: 1
    };
  });

  describe('displayHierarchy', () => {
    it('should display complete hierarchy in tree format', () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // Act
      service.displayHierarchy(mockHierarchy);

      // Assert
      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls.map(call => call[0]).join('\n');
      expect(output).toContain('Test Notebook');
      expect(output).toContain('Test Section');
      expect(output).toContain('Test Page');
      
      consoleSpy.mockRestore();
    });

    it('should respect display options', () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const options: DisplayOptions = {
        showMetadata: true,
        showContent: false,
        maxDepth: 2,
        includeEmptySections: false,
        sortBy: 'name'
      };
      
      // Act
      service.displayHierarchy(mockHierarchy, options);

      // Assert
      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls.map(call => call[0]).join('\n');
      expect(output).toContain('Test Notebook');
      // Additional assertions based on options would go here
      
      consoleSpy.mockRestore();
    });

    it('should handle empty hierarchy', () => {
      // Arrange
      const emptyHierarchy: OneNoteHierarchy = {
        notebooks: [],
        totalNotebooks: 0,
        totalSections: 0,
        totalPages: 0
      };
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // Act
      service.displayHierarchy(emptyHierarchy);

      // Assert
      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls.map(call => call[0]).join('\n');
      expect(output).toContain('No notebooks found');
      
      consoleSpy.mockRestore();
    });

    it('should limit depth based on maxDepth option', () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const options: DisplayOptions = {
        showMetadata: false,
        showContent: false,
        maxDepth: 1,
        includeEmptySections: false,
        sortBy: 'name'
      };
      
      // Act
      service.displayHierarchy(mockHierarchy, options);

      // Assert
      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls.map(call => call[0]).join('\n');
      expect(output).toContain('Test Notebook');
      expect(output).not.toContain('Test Section'); // Should be truncated at depth 1
      
      consoleSpy.mockRestore();
    });
  });

  describe('displayNotebook', () => {
    it('should display a single notebook', () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // Act
      service.displayNotebook(mockNotebook);

      // Assert
      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls.map(call => call[0]).join('\n');
      expect(output).toContain('Test Notebook');
      expect(output).toContain('Test Section');
      expect(output).toContain('Test Page');
      
      consoleSpy.mockRestore();
    });

    it('should respect display options for notebook', () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const options: DisplayOptions = {
        showMetadata: true,
        showContent: true,
        maxDepth: 3,
        includeEmptySections: true,
        sortBy: 'date'
      };
      
      // Act
      service.displayNotebook(mockNotebook, options);

      // Assert
      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls.map(call => call[0]).join('\n');
      expect(output).toContain('Test Notebook');
      // Additional assertions based on options would go here
      
      consoleSpy.mockRestore();
    });

    it('should handle notebook with no sections', () => {
      // Arrange
      const emptyNotebook: OneNoteNotebook = {
        id: 'empty-notebook',
        name: 'Empty Notebook',
        sections: [],
        createdDate: new Date(),
        lastModifiedDate: new Date(),
        metadata: {}
      };
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // Act
      service.displayNotebook(emptyNotebook);

      // Assert
      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls.map(call => call[0]).join('\n');
      expect(output).toContain('Empty Notebook');
      expect(output).toContain('No sections found');
      
      consoleSpy.mockRestore();
    });
  });

  describe('displaySection', () => {
    it('should display a single section', () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // Act
      service.displaySection(mockSection);

      // Assert
      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls.map(call => call[0]).join('\n');
      expect(output).toContain('Test Section');
      expect(output).toContain('Test Page');
      
      consoleSpy.mockRestore();
    });

    it('should respect display options for section', () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const options: DisplayOptions = {
        showMetadata: true,
        showContent: false,
        maxDepth: 2,
        includeEmptySections: false,
        sortBy: 'size'
      };
      
      // Act
      service.displaySection(mockSection, options);

      // Assert
      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls.map(call => call[0]).join('\n');
      expect(output).toContain('Test Section');
      // Additional assertions based on options would go here
      
      consoleSpy.mockRestore();
    });

    it('should handle section with no pages', () => {
      // Arrange
      const emptySection: OneNoteSection = {
        id: 'empty-section',
        name: 'Empty Section',
        pages: [],
        createdDate: new Date(),
        lastModifiedDate: new Date(),
        metadata: {}
      };
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // Act
      service.displaySection(emptySection);

      // Assert
      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls.map(call => call[0]).join('\n');
      expect(output).toContain('Empty Section');
      expect(output).toContain('No pages found');
      
      consoleSpy.mockRestore();
    });
  });

  describe('displaySummary', () => {
    it('should display summary statistics', () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // Act
      service.displaySummary(mockHierarchy);

      // Assert
      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls.map(call => call[0]).join('\n');
      expect(output).toContain('Summary');
      expect(output).toContain('1 notebook');
      expect(output).toContain('1 section');
      expect(output).toContain('1 page');
      
      consoleSpy.mockRestore();
    });

    it('should handle empty hierarchy in summary', () => {
      // Arrange
      const emptyHierarchy: OneNoteHierarchy = {
        notebooks: [],
        totalNotebooks: 0,
        totalSections: 0,
        totalPages: 0
      };
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // Act
      service.displaySummary(emptyHierarchy);

      // Assert
      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls.map(call => call[0]).join('\n');
      expect(output).toContain('0 notebooks');
      expect(output).toContain('0 sections');
      expect(output).toContain('0 pages');
      
      consoleSpy.mockRestore();
    });

    it('should display large hierarchy summary correctly', () => {
      // Arrange
      const largeHierarchy: OneNoteHierarchy = {
        notebooks: Array.from({ length: 5 }, (_, i) => ({
          ...mockNotebook,
          id: `notebook-${i}`,
          name: `Notebook ${i + 1}`,
          sections: Array.from({ length: 3 }, (_, j) => ({
            ...mockSection,
            id: `section-${i}-${j}`,
            name: `Section ${j + 1}`,
            pages: Array.from({ length: 10 }, (_, k) => ({
              ...mockPage,
              id: `page-${i}-${j}-${k}`,
              title: `Page ${k + 1}`
            }))
          }))
        })),
        totalNotebooks: 5,
        totalSections: 15,
        totalPages: 150
      };
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // Act
      service.displaySummary(largeHierarchy);

      // Assert
      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls.map(call => call[0]).join('\n');
      expect(output).toContain('5 notebooks');
      expect(output).toContain('15 sections');
      expect(output).toContain('150 pages');
      
      consoleSpy.mockRestore();
    });
  });
});
