/**
 * Hierarchy Mapping Service Tests
 * Tests for OneNote to Notion hierarchy mapping functionality
 */

import { 
  HierarchyMappingService, 
  HierarchyMappingOptions, 
  HierarchyMappingResult,
  NotionPage
} from '../../../../src/services/notion/hierarchy-mapping.service';
import { OneNoteNotebook, OneNoteSection, OneNotePage } from '../../../../src/types/onenote';

describe('HierarchyMappingService', () => {
  let service: HierarchyMappingService;
  let mockNotebooks: OneNoteNotebook[];

  beforeEach(() => {
    service = new HierarchyMappingService();
    
    mockNotebooks = [
      {
        id: 'notebook-1',
        name: 'Work Notebook',
        createdDate: new Date('2024-01-01'),
        lastModifiedDate: new Date('2024-01-01'),
        metadata: {},
        sections: [
          {
            id: 'section-1',
            name: 'Meeting Notes',
            createdDate: new Date('2024-01-01'),
            lastModifiedDate: new Date('2024-01-01'),
            metadata: {},
            pages: [
              {
                id: 'page-1',
                title: 'Weekly Standup',
                content: 'Meeting notes content',
                createdDate: new Date('2024-01-01'),
                lastModifiedDate: new Date('2024-01-01'),
                metadata: {}
              },
              {
                id: 'page-2',
                title: 'Project Planning',
                content: 'Planning content',
                createdDate: new Date('2024-01-02'),
                lastModifiedDate: new Date('2024-01-02'),
                metadata: {}
              }
            ]
          },
          {
            id: 'section-2',
            name: 'Ideas',
            createdDate: new Date('2024-01-02'),
            lastModifiedDate: new Date('2024-01-02'),
            metadata: {},
            pages: [
              {
                id: 'page-3',
                title: 'New Feature Ideas',
                content: 'Ideas content',
                createdDate: new Date('2024-01-03'),
                lastModifiedDate: new Date('2024-01-03'),
                metadata: {}
              }
            ]
          }
        ]
      },
      {
        id: 'notebook-2',
        name: 'Personal Notebook',
        createdDate: new Date('2024-01-02'),
        lastModifiedDate: new Date('2024-01-02'),
        metadata: {},
        sections: [
          {
            id: 'section-3',
            name: 'Journal',
            createdDate: new Date('2024-01-03'),
            lastModifiedDate: new Date('2024-01-03'),
            metadata: {},
            pages: [
              {
                id: 'page-4',
                title: 'Daily Entry',
                content: 'Journal content',
                createdDate: new Date('2024-01-04'),
                lastModifiedDate: new Date('2024-01-04'),
                metadata: {}
              }
            ]
          }
        ]
      }
    ];
  });

  describe('mapHierarchy', () => {
    it('should map complete hierarchy structure', async () => {
      // Arrange
      const options: HierarchyMappingOptions = {
        preserveStructure: true,
        createDatabases: true,
        maxDepth: 3
      };

      // Act
      const result = await service.mapHierarchy(mockNotebooks, options);

      // Assert
      expect(result.success).toBe(true);
      expect(result.pages).toHaveLength(9); // 2 notebooks + 3 sections + 4 pages
      expect(result.databases).toHaveLength(2); // 2 notebooks
      expect(result.metadata?.totalPages).toBe(4);
      expect(result.metadata?.totalSections).toBe(3);
      expect(result.metadata?.totalNotebooks).toBe(2);
    });

    it('should handle empty notebook list', async () => {
      // Arrange
      const options: HierarchyMappingOptions = {
        preserveStructure: true,
        createDatabases: true
      };

      // Act
      const result = await service.mapHierarchy([], options);

      // Assert
      expect(result.success).toBe(true);
      expect(result.pages).toHaveLength(0);
      expect(result.databases).toHaveLength(0);
    });

    it('should respect max depth limit', async () => {
      // Arrange
      const options: HierarchyMappingOptions = {
        preserveStructure: true,
        createDatabases: true,
        maxDepth: 1
      };

      // Act
      const result = await service.mapHierarchy(mockNotebooks, options);

      // Assert
      expect(result.success).toBe(true);
      expect(result.pages.length).toBeLessThanOrEqual(2); // Only notebooks
    });

    it('should report progress during mapping', async () => {
      // Arrange
      const options: HierarchyMappingOptions = {
        preserveStructure: true,
        createDatabases: true,
        onProgress: jest.fn()
      };

      // Act
      await service.mapHierarchy(mockNotebooks, options);

      // Assert
      expect(options.onProgress).toHaveBeenCalled();
    });
  });

  describe('createDatabaseStructure', () => {
    it('should create databases for notebooks', async () => {
      // Arrange
      const options: HierarchyMappingOptions = {
        createDatabases: true
      };

      // Act
      const result = await service.createDatabaseStructure(mockNotebooks, options);

      // Assert
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);
      expect(result[0]).toMatch(/^db_/);
      expect(result[1]).toMatch(/^db_/);
    });

    it('should not create databases when disabled', async () => {
      // Arrange
      const options: HierarchyMappingOptions = {
        createDatabases: false
      };

      // Act
      const result = await service.createDatabaseStructure(mockNotebooks, options);

      // Assert
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });
  });

  describe('mapSectionToPage', () => {
    it('should map section to Notion page with children', async () => {
      // Arrange
      const section: OneNoteSection = {
        id: 'section-1',
        name: 'Meeting Notes',
        createdDate: new Date('2024-01-01'),
        lastModifiedDate: new Date('2024-01-01'),
        metadata: {},
        pages: [
          {
            id: 'page-1',
            title: 'Weekly Standup',
            content: 'Meeting notes content',
            createdDate: new Date('2024-01-01'),
            lastModifiedDate: new Date('2024-01-01'),
            metadata: {}
          }
        ]
      };

      const options: HierarchyMappingOptions = {
        preserveStructure: true
      };

      // Act
      const result = await service.mapSectionToPage(section, 'parent-123', options);

      // Assert
      expect(result.id).toBe('section-1');
      expect(result.title).toBe('Meeting Notes');
      expect(result.children).toHaveLength(1);
      expect(result.children?.[0]?.title).toBe('Weekly Standup');
      expect(result.parentId).toBe('parent-123');
    });

    it('should handle section without pages', async () => {
      // Arrange
      const section: OneNoteSection = {
        id: 'section-2',
        name: 'Empty Section',
        createdDate: new Date('2024-01-01'),
        lastModifiedDate: new Date('2024-01-01'),
        metadata: {},
        pages: []
      };

      const options: HierarchyMappingOptions = {
        preserveStructure: true
      };

      // Act
      const result = await service.mapSectionToPage(section, undefined, options);

      // Assert
      expect(result.id).toBe('section-2');
      expect(result.title).toBe('Empty Section');
      expect(result.children).toHaveLength(0);
      expect(result.parentId).toBeUndefined();
    });
  });

  describe('mapPageToNotionPage', () => {
    it('should map OneNote page to Notion page', async () => {
      // Arrange
      const page: OneNotePage = {
        id: 'page-1',
        title: 'Weekly Standup',
        content: 'Meeting notes content',
        createdDate: new Date('2024-01-01'),
        lastModifiedDate: new Date('2024-01-01'),
        metadata: { author: 'John Doe' }
      };

      const options: HierarchyMappingOptions = {
        preserveStructure: true
      };

      // Act
      const result = await service.mapPageToNotionPage(page, 'parent-123', options);

      // Assert
      expect(result.id).toBe('page-1');
      expect(result.title).toBe('Weekly Standup');
      expect(result.content).toBe('Meeting notes content');
      expect(result.parentId).toBe('parent-123');
      expect(result.properties).toBeDefined();
      expect(result.properties!['Created Date']).toBeDefined();
      expect(result.properties!['Author']).toBe('John Doe');
    });

    it('should handle page without parent', async () => {
      // Arrange
      const page: OneNotePage = {
        id: 'page-2',
        title: 'Standalone Page',
        content: 'Content',
        createdDate: new Date('2024-01-01'),
        lastModifiedDate: new Date('2024-01-01'),
        metadata: {}
      };

      const options: HierarchyMappingOptions = {
        preserveStructure: true
      };

      // Act
      const result = await service.mapPageToNotionPage(page, undefined, options);

      // Assert
      expect(result.id).toBe('page-2');
      expect(result.title).toBe('Standalone Page');
      expect(result.parentId).toBeUndefined();
    });
  });

  describe('validateHierarchy', () => {
    it('should validate correct hierarchy structure', () => {
      // Arrange
      const pages: NotionPage[] = [
        {
          id: 'parent-page',
          title: 'Parent Page',
          content: 'Parent content',
          children: [
            {
              id: 'child-page-1',
              title: 'Child Page 1',
              content: 'Child content 1',
              parentId: 'parent-page'
            },
            {
              id: 'child-page-2',
              title: 'Child Page 2',
              content: 'Child content 2',
              parentId: 'parent-page'
            }
          ]
        }
      ];

      // Act
      const result = service.validateHierarchy(pages);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid parent references', () => {
      // Arrange
      const pages: NotionPage[] = [
        {
          id: 'parent-page',
          title: 'Parent Page',
          content: 'Parent content',
          children: [
            {
              id: 'child-page-1',
              title: 'Child Page 1',
              content: 'Child content 1',
              parentId: 'non-existent-parent'
            }
          ]
        }
      ];

      // Act
      const result = service.validateHierarchy(pages);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('parent');
    });

    it('should detect circular references', () => {
      // Arrange
      const pages: NotionPage[] = [
        {
          id: 'page-1',
          title: 'Page 1',
          content: 'Content 1',
          parentId: 'page-2',
          children: [
            {
              id: 'page-2',
              title: 'Page 2',
              content: 'Content 2',
              parentId: 'page-1'
            }
          ]
        }
      ];

      // Act
      const result = service.validateHierarchy(pages);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]?.toLowerCase()).toContain('circular');
    });
  });

  describe('flattenHierarchy', () => {
    it('should flatten nested hierarchy structure', () => {
      // Arrange
      const pages: NotionPage[] = [
        {
          id: 'parent-page',
          title: 'Parent Page',
          content: 'Parent content',
          children: [
            {
              id: 'child-page-1',
              title: 'Child Page 1',
              content: 'Child content 1',
              parentId: 'parent-page'
            },
            {
              id: 'child-page-2',
              title: 'Child Page 2',
              content: 'Child content 2',
              parentId: 'parent-page',
              children: [
                {
                  id: 'grandchild-page',
                  title: 'Grandchild Page',
                  content: 'Grandchild content',
                  parentId: 'child-page-2'
                }
              ]
            }
          ]
        }
      ];

      // Act
      const result = service.flattenHierarchy(pages);

      // Assert
      expect(result).toHaveLength(4); // parent + 2 children + 1 grandchild
      expect(result.map(p => p.id)).toContain('parent-page');
      expect(result.map(p => p.id)).toContain('child-page-1');
      expect(result.map(p => p.id)).toContain('child-page-2');
      expect(result.map(p => p.id)).toContain('grandchild-page');
    });

    it('should handle empty hierarchy', () => {
      // Arrange
      const pages: NotionPage[] = [];

      // Act
      const result = service.flattenHierarchy(pages);

      // Assert
      expect(result).toHaveLength(0);
    });

    it('should preserve parent-child relationships in flattened structure', () => {
      // Arrange
      const pages: NotionPage[] = [
        {
          id: 'parent-page',
          title: 'Parent Page',
          content: 'Parent content',
          children: [
            {
              id: 'child-page',
              title: 'Child Page',
              content: 'Child content',
              parentId: 'parent-page'
            }
          ]
        }
      ];

      // Act
      const result = service.flattenHierarchy(pages);

      // Assert
      expect(result).toHaveLength(2);
      const childPage = result.find(p => p.id === 'child-page');
      expect(childPage?.parentId).toBe('parent-page');
    });
  });
});
