/**
 * Mock data factory for OneNote services
 * Centralizes mock data creation to eliminate duplication
 */

import { OneNoteHierarchy, OneNoteNotebook, OneNoteSection, OneNotePage, OneNoteExtractionResult } from '../../types/onenote';

export class OneNoteMockDataFactory {
  /**
   * Create a mock page with default values
   */
  static createMockPage(overrides: Partial<OneNotePage> = {}): OneNotePage {
    return {
      id: 'mock-page',
      title: 'Mock Page',
      content: 'Mock content',
      createdDate: new Date('2023-01-01'),
      lastModifiedDate: new Date('2023-01-02'),
      metadata: {},
      ...overrides
    };
  }

  /**
   * Create a mock section with default values
   */
  static createMockSection(overrides: Partial<OneNoteSection> = {}): OneNoteSection {
    return {
      id: 'mock-section',
      name: 'Mock Section',
      pages: [this.createMockPage()],
      createdDate: new Date('2023-01-01'),
      lastModifiedDate: new Date('2023-01-02'),
      metadata: {},
      ...overrides
    };
  }

  /**
   * Create a mock notebook with default values
   */
  static createMockNotebook(overrides: Partial<OneNoteNotebook> = {}): OneNoteNotebook {
    return {
      id: 'mock-notebook',
      name: 'Mock Notebook',
      sections: [this.createMockSection()],
      createdDate: new Date('2023-01-01'),
      lastModifiedDate: new Date('2023-01-02'),
      metadata: {},
      ...overrides
    };
  }

  /**
   * Create a mock hierarchy with default values
   */
  static createMockHierarchy(overrides: Partial<OneNoteHierarchy> = {}): OneNoteHierarchy {
    return {
      notebooks: [this.createMockNotebook()],
      totalNotebooks: 1,
      totalSections: 1,
      totalPages: 1,
      ...overrides
    };
  }

  /**
   * Create a mock extraction result with default values
   */
  static createMockExtractionResult(overrides: Partial<OneNoteExtractionResult> = {}): OneNoteExtractionResult {
    return {
      success: true,
      hierarchy: this.createMockHierarchy(),
      ...overrides
    };
  }

  /**
   * Create fallback hierarchy for error scenarios
   */
  static createFallbackHierarchy(type: 'extraction' | 'parsing' = 'extraction'): OneNoteHierarchy {
    const prefix = type === 'extraction' ? 'fallback' : 'parsed';
    return {
      notebooks: [{
        id: `${prefix}-notebook`,
        name: `${prefix.charAt(0).toUpperCase() + prefix.slice(1)} Notebook`,
        sections: [{
          id: `${prefix}-section`,
          name: `${prefix.charAt(0).toUpperCase() + prefix.slice(1)} Section`,
          pages: [{
            id: `${prefix}-page`,
            title: type === 'extraction' ? 'Fallback Page' : 'Raw Content',
            content: type === 'extraction' ? 'Raw content extracted' : 'Raw content extracted',
            createdDate: new Date(),
            lastModifiedDate: new Date(),
            metadata: {}
          }],
          createdDate: new Date(),
          lastModifiedDate: new Date(),
          metadata: {}
        }],
        createdDate: new Date(),
        lastModifiedDate: new Date(),
        metadata: {}
      }],
      totalNotebooks: 1,
      totalSections: 1,
      totalPages: 1
    };
  }

  /**
   * Create multiple mock pages for multi-page scenarios
   */
  static createMultipleMockPages(count: number): OneNotePage[] {
    return Array.from({ length: count }, (_, index) => 
      this.createMockPage({
        id: `page-${index + 1}`,
        title: `Page ${index + 1}`,
        content: `Content ${index + 1}`
      })
    );
  }

  /**
   * Create multiple mock sections for multi-section scenarios
   */
  static createMultipleMockSections(count: number): OneNoteSection[] {
    return Array.from({ length: count }, (_, index) => 
      this.createMockSection({
        id: `section-${index + 1}`,
        name: `Section ${index + 1}`,
        pages: [this.createMockPage({
          id: `page-${index + 1}`,
          title: `Page ${index + 1}`,
          content: `Content ${index + 1}`
        })]
      })
    );
  }

  /**
   * Create multiple mock notebooks for multi-notebook scenarios
   */
  static createMultipleMockNotebooks(count: number): OneNoteNotebook[] {
    return Array.from({ length: count }, (_, index) => 
      this.createMockNotebook({
        id: `notebook-${index + 1}`,
        name: `Notebook ${index + 1}`,
        sections: [this.createMockSection({
          id: `section-${index + 1}`,
          name: `Section ${index + 1}`
        })]
      })
    );
  }
}
