/**
 * Tests for OneNote mock data factory
 * Following TDD Red-Green-Refactor cycle
 */

import { OneNoteMockDataFactory } from '../../../../src/services/onenote/mock-data.factory';
import { OneNotePage, OneNoteSection, OneNoteNotebook, OneNoteHierarchy, OneNoteExtractionResult } from '../../../../src/types/onenote';

describe('OneNoteMockDataFactory', () => {
  describe('createMockPage', () => {
    it('should create a mock page with default values', () => {
      const page = OneNoteMockDataFactory.createMockPage();
      
      expect(page).toBeDefined();
      expect(page.id).toBe('mock-page');
      expect(page.title).toBe('Mock Page');
      expect(page.content).toBe('Mock content');
      expect(page.createdDate).toBeInstanceOf(Date);
      expect(page.lastModifiedDate).toBeInstanceOf(Date);
      expect(page.metadata).toEqual({});
    });

    it('should create a mock page with overrides', () => {
      const overrides = {
        id: 'custom-page',
        title: 'Custom Page',
        content: 'Custom content',
        metadata: { author: 'Test User' }
      };
      
      const page = OneNoteMockDataFactory.createMockPage(overrides);
      
      expect(page.id).toBe('custom-page');
      expect(page.title).toBe('Custom Page');
      expect(page.content).toBe('Custom content');
      expect(page.metadata).toEqual({ author: 'Test User' });
    });
  });

  describe('createMockSection', () => {
    it('should create a mock section with default values', () => {
      const section = OneNoteMockDataFactory.createMockSection();
      
      expect(section).toBeDefined();
      expect(section.id).toBe('mock-section');
      expect(section.name).toBe('Mock Section');
      expect(section.pages).toHaveLength(1);
      expect(section.pages[0]).toBeDefined();
      expect(section.createdDate).toBeInstanceOf(Date);
      expect(section.lastModifiedDate).toBeInstanceOf(Date);
      expect(section.metadata).toEqual({});
    });

    it('should create a mock section with overrides', () => {
      const overrides = {
        id: 'custom-section',
        name: 'Custom Section',
        pages: [OneNoteMockDataFactory.createMockPage({ id: 'page-1' })]
      };
      
      const section = OneNoteMockDataFactory.createMockSection(overrides);
      
      expect(section.id).toBe('custom-section');
      expect(section.name).toBe('Custom Section');
      expect(section.pages).toHaveLength(1);
      expect(section.pages[0]?.id).toBe('page-1');
    });
  });

  describe('createMockNotebook', () => {
    it('should create a mock notebook with default values', () => {
      const notebook = OneNoteMockDataFactory.createMockNotebook();
      
      expect(notebook).toBeDefined();
      expect(notebook.id).toBe('mock-notebook');
      expect(notebook.name).toBe('Mock Notebook');
      expect(notebook.sections).toHaveLength(1);
      expect(notebook.sections[0]).toBeDefined();
      expect(notebook.createdDate).toBeInstanceOf(Date);
      expect(notebook.lastModifiedDate).toBeInstanceOf(Date);
      expect(notebook.metadata).toEqual({});
    });

    it('should create a mock notebook with overrides', () => {
      const overrides = {
        id: 'custom-notebook',
        name: 'Custom Notebook',
        sections: [OneNoteMockDataFactory.createMockSection({ id: 'section-1' })]
      };
      
      const notebook = OneNoteMockDataFactory.createMockNotebook(overrides);
      
      expect(notebook.id).toBe('custom-notebook');
      expect(notebook.name).toBe('Custom Notebook');
      expect(notebook.sections).toHaveLength(1);
      expect(notebook.sections[0]?.id).toBe('section-1');
    });
  });

  describe('createMockHierarchy', () => {
    it('should create a mock hierarchy with default values', () => {
      const hierarchy = OneNoteMockDataFactory.createMockHierarchy();
      
      expect(hierarchy).toBeDefined();
      expect(hierarchy.notebooks).toHaveLength(1);
      expect(hierarchy.totalNotebooks).toBe(1);
      expect(hierarchy.totalSections).toBe(1);
      expect(hierarchy.totalPages).toBe(1);
    });

    it('should create a mock hierarchy with overrides', () => {
      const overrides = {
        notebooks: [],
        totalNotebooks: 0,
        totalSections: 0,
        totalPages: 0
      };
      
      const hierarchy = OneNoteMockDataFactory.createMockHierarchy(overrides);
      
      expect(hierarchy.notebooks).toHaveLength(0);
      expect(hierarchy.totalNotebooks).toBe(0);
      expect(hierarchy.totalSections).toBe(0);
      expect(hierarchy.totalPages).toBe(0);
    });
  });

  describe('createMockExtractionResult', () => {
    it('should create a mock extraction result with default values', () => {
      const result = OneNoteMockDataFactory.createMockExtractionResult();
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.hierarchy).toBeDefined();
      expect(result.hierarchy?.totalNotebooks).toBe(1);
    });

    it('should create a mock extraction result with overrides', () => {
      const overrides = {
        success: false,
        error: 'Test error'
      };
      
      const result = OneNoteMockDataFactory.createMockExtractionResult(overrides);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Test error');
    });
  });

  describe('createFallbackHierarchy', () => {
    it('should create fallback hierarchy for extraction errors', () => {
      const hierarchy = OneNoteMockDataFactory.createFallbackHierarchy('extraction');
      
      expect(hierarchy).toBeDefined();
      expect(hierarchy.notebooks).toHaveLength(1);
      expect(hierarchy.notebooks[0]?.name).toBe('Fallback Notebook');
      expect(hierarchy.notebooks[0]?.sections[0]?.name).toBe('Fallback Section');
      expect(hierarchy.notebooks[0]?.sections[0]?.pages[0]?.title).toBe('Fallback Page');
    });

    it('should create fallback hierarchy for parsing errors', () => {
      const hierarchy = OneNoteMockDataFactory.createFallbackHierarchy('parsing');
      
      expect(hierarchy).toBeDefined();
      expect(hierarchy.notebooks).toHaveLength(1);
      expect(hierarchy.notebooks[0]?.name).toBe('Parsed Notebook');
      expect(hierarchy.notebooks[0]?.sections[0]?.name).toBe('Parsed Section');
      expect(hierarchy.notebooks[0]?.sections[0]?.pages[0]?.title).toBe('Raw Content');
    });
  });

  describe('createMultipleMockPages', () => {
    it('should create multiple mock pages', () => {
      const pages = OneNoteMockDataFactory.createMultipleMockPages(3);
      
      expect(pages).toHaveLength(3);
      pages.forEach((page, index) => {
        expect(page.id).toBe(`page-${index + 1}`);
        expect(page.title).toBe(`Page ${index + 1}`);
        expect(page.content).toBe(`Content ${index + 1}`);
      });
    });

    it('should create empty array for zero count', () => {
      const pages = OneNoteMockDataFactory.createMultipleMockPages(0);
      
      expect(pages).toHaveLength(0);
    });
  });

  describe('createMultipleMockSections', () => {
    it('should create multiple mock sections', () => {
      const sections = OneNoteMockDataFactory.createMultipleMockSections(2);
      
      expect(sections).toHaveLength(2);
      sections.forEach((section, index) => {
        expect(section.id).toBe(`section-${index + 1}`);
        expect(section.name).toBe(`Section ${index + 1}`);
        expect(section.pages).toHaveLength(1);
        expect(section.pages[0]?.id).toBe(`page-${index + 1}`);
      });
    });
  });

  describe('createMultipleMockNotebooks', () => {
    it('should create multiple mock notebooks', () => {
      const notebooks = OneNoteMockDataFactory.createMultipleMockNotebooks(2);
      
      expect(notebooks).toHaveLength(2);
      notebooks.forEach((notebook, index) => {
        expect(notebook.id).toBe(`notebook-${index + 1}`);
        expect(notebook.name).toBe(`Notebook ${index + 1}`);
        expect(notebook.sections).toHaveLength(1);
        expect(notebook.sections[0]?.id).toBe(`section-${index + 1}`);
      });
    });
  });
});
