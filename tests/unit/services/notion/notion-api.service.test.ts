/**
 * Notion API Service Tests
 * Tests for Notion API integration functionality
 */

import { 
  NotionApiService, 
  NotionConfig, 
  NotionPage, 
  NotionApiOptions,
  NotionImportResult,
  NotionUploadResult,
  NotionDatabase
} from '../../../../src/services/notion/notion-api.service';

// Mock the Notion client
jest.mock('@notionhq/client', () => {
  return {
    Client: jest.fn().mockImplementation(() => ({
      users: {
        me: jest.fn().mockImplementation((args) => {
          // Check if the service was initialized with invalid token
          if (args && args.auth === 'invalid-token') {
            throw new Error('API token is invalid.');
          }
          return Promise.resolve({ id: 'user-123', name: 'Test User' });
        })
      },
      search: jest.fn().mockImplementation((args) => {
        if (args.filter.value === 'page') {
          return Promise.resolve({
            results: [
              {
                id: 'db-1',
                title: [{ plain_text: 'Test Database' }],
                properties: { name: { title: {} } },
                url: 'https://notion.so/db-1'
              }
            ]
          });
        }
        return Promise.resolve({ results: [] });
      }),
      pages: {
        create: jest.fn().mockImplementation((args) => {
          if (args.parent.database_id === 'invalid-database') {
            throw new Error('Database not found');
          }
          return Promise.resolve({
            id: 'page-123',
            url: 'https://notion.so/page-123'
          });
        })
      },
      databases: {
        update: jest.fn().mockImplementation((args) => {
          if (args.database_id === 'invalid-database') {
            throw new Error('Database not found');
          }
          return Promise.resolve({ id: args.database_id });
        })
      }
    }))
  };
});

describe('NotionApiService', () => {
  let service: NotionApiService;
  let mockConfig: NotionConfig;

  beforeEach(() => {
    service = new NotionApiService();
    mockConfig = {
      integrationToken: 'test-token-123',
      workspaceId: 'workspace-123',
      databaseId: 'database-123',
      rateLimitDelay: 100,
      maxRetries: 3,
      timeout: 30000
    };
  });

  describe('initialize', () => {
    it('should initialize with valid configuration', async () => {
      // Arrange
      const config: NotionConfig = {
        integrationToken: 'valid-token',
        workspaceId: 'workspace-123'
      };

      // Act
      const result = await service.initialize(config);

      // Assert
      expect(result).toBe(true);
    });

    it('should fail with invalid token', async () => {
      // Arrange
      const config: NotionConfig = {
        integrationToken: '',
        workspaceId: 'workspace-123'
      };

      // Act
      const result = await service.initialize(config);

      // Assert
      expect(result).toBe(false);
    });

    it('should handle missing workspace ID', async () => {
      // Arrange
      const config: NotionConfig = {
        integrationToken: 'valid-token'
      };

      // Act
      const result = await service.initialize(config);

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('testConnection', () => {
    it('should return true for valid connection', async () => {
      // Arrange
      await service.initialize(mockConfig);

      // Act
      const result = await service.testConnection();

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for invalid connection', async () => {
      // Arrange
      const invalidConfig: NotionConfig = {
        integrationToken: 'invalid-token'
      };
      await service.initialize(invalidConfig);

      // Mock the client to throw an error
      const mockClient = (service as any).client;
      mockClient.users.me.mockRejectedValueOnce(new Error('API token is invalid.'));

      // Act
      const result = await service.testConnection();

      // Assert
      expect(result).toBe(false);
    });

    it('should throw error if not initialized', async () => {
      // Act & Assert
      await expect(service.testConnection()).rejects.toThrow('Service not initialized');
    });
  });

  describe('getDatabases', () => {
    it('should return list of databases', async () => {
      // Arrange
      await service.initialize(mockConfig);

      // Act
      const result = await service.getDatabases();

      // Assert
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('title');
      expect(result[0]).toHaveProperty('properties');
    });

    it('should return empty array when no databases found', async () => {
      // Arrange
      const config: NotionConfig = {
        integrationToken: 'valid-token',
        workspaceId: 'empty-workspace'
      };
      await service.initialize(config);

      // Mock the client to return empty results
      const mockClient = (service as any).client;
      mockClient.search.mockResolvedValueOnce({ results: [] });

      // Act
      const result = await service.getDatabases();

      // Assert
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe('createPage', () => {
    it('should create a simple page successfully', async () => {
      // Arrange
      await service.initialize(mockConfig);
      const page: NotionPage = {
        id: 'page-1',
        title: 'Test Page',
        content: 'This is test content'
      };

      // Act
      const result = await service.createPage(page);

      // Assert
      expect(result.success).toBe(true);
      expect(result.pageId).toBeDefined();
      expect(result.url).toBeDefined();
      expect(result.error).toBeUndefined();
    });

    it('should create a page with properties', async () => {
      // Arrange
      await service.initialize(mockConfig);
      const page: NotionPage = {
        id: 'page-2',
        title: 'Page with Properties',
        content: 'Content with properties',
        properties: {
          'Created Date': new Date().toISOString(),
          'Status': 'Active',
          'Priority': 'High'
        }
      };

      // Act
      const result = await service.createPage(page);

      // Assert
      expect(result.success).toBe(true);
      expect(result.pageId).toBeDefined();
      expect(result.metadata?.itemsProcessed).toBe(1);
    });

    it('should handle page creation errors', async () => {
      // Arrange
      await service.initialize(mockConfig);
      const page: NotionPage = {
        id: 'page-3',
        title: 'Error Page',
        content: 'This will fail'
      };

      // Mock the client to throw an error
      const mockClient = (service as any).client;
      mockClient.pages.create.mockRejectedValueOnce(new Error('Database not found'));

      // Act
      const result = await service.createPage(page);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should report progress during page creation', async () => {
      // Arrange
      await service.initialize(mockConfig);
      const page: NotionPage = {
        id: 'page-4',
        title: 'Progress Test Page',
        content: 'Testing progress reporting'
      };

      const progressReports: any[] = [];
      const options: NotionApiOptions = {
        onProgress: (progress) => progressReports.push(progress)
      };

      // Act
      await service.createPage(page, options);

      // Assert
      expect(progressReports.length).toBeGreaterThan(0);
      expect(progressReports[0]?.stage).toBe('page-creation');
    });
  });

  describe('uploadFile', () => {
    it('should upload image file successfully', async () => {
      // Arrange
      await service.initialize(mockConfig);
      const filePath = '/tmp/test-image.jpg';
      
      // Create a temporary file
      const fs = require('fs');
      fs.writeFileSync(filePath, 'fake image content');

      // Act
      const result = await service.uploadFile(filePath);

      // Assert
      expect(result.success).toBe(true);
      expect(result.url).toBeDefined();
      expect(result.fileId).toBeDefined();

      // Cleanup
      fs.unlinkSync(filePath);
    });

    it('should upload document file successfully', async () => {
      // Arrange
      await service.initialize(mockConfig);
      const filePath = '/tmp/test-document.pdf';
      
      // Create a temporary file
      const fs = require('fs');
      fs.writeFileSync(filePath, 'fake pdf content');

      // Act
      const result = await service.uploadFile(filePath);

      // Assert
      expect(result.success).toBe(true);
      expect(result.url).toBeDefined();
      expect(result.fileId).toBeDefined();

      // Cleanup
      fs.unlinkSync(filePath);
    });

    it('should handle file upload errors', async () => {
      // Arrange
      const invalidConfig: NotionConfig = {
        integrationToken: 'invalid-token'
      };
      await service.initialize(invalidConfig);
      const filePath = '/path/to/nonexistent-file.jpg';

      // Act
      const result = await service.uploadFile(filePath);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle unsupported file types', async () => {
      // Arrange
      await service.initialize(mockConfig);
      const filePath = '/path/to/unsupported-file.xyz';

      // Act
      const result = await service.uploadFile(filePath);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('File not found');
    });

    it('should handle unsupported file types when file exists', async () => {
      // Arrange
      await service.initialize(mockConfig);
      const filePath = '/tmp/unsupported-file.xyz';
      
      // Create a temporary file
      const fs = require('fs');
      fs.writeFileSync(filePath, 'test content');

      // Act
      const result = await service.uploadFile(filePath);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Unsupported file type');

      // Cleanup
      fs.unlinkSync(filePath);
    });
  });

  describe('createPageHierarchy', () => {
    it('should create nested page structure', async () => {
      // Arrange
      await service.initialize(mockConfig);
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
      const result = await service.createPageHierarchy(pages);

      // Assert
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0]?.success).toBe(true);
      expect(result[0]?.children).toHaveLength(2);
    });

    it('should handle hierarchy creation errors', async () => {
      // Arrange
      await service.initialize(mockConfig);
      const pages: NotionPage[] = [
        {
          id: 'error-page',
          title: 'Error Page',
          content: 'This will fail'
        }
      ];

      // Mock the client to throw an error
      const mockClient = (service as any).client;
      mockClient.pages.create.mockRejectedValueOnce(new Error('Database not found'));

      // Act
      const result = await service.createPageHierarchy(pages);

      // Assert
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]?.success).toBe(false);
      expect(result[0]?.error).toBeDefined();
    });

    it('should report progress for hierarchy creation', async () => {
      // Arrange
      await service.initialize(mockConfig);
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

      const progressReports: any[] = [];
      const options: NotionApiOptions = {
        onProgress: (progress) => progressReports.push(progress)
      };

      // Act
      await service.createPageHierarchy(pages, options);

      // Assert
      expect(progressReports.length).toBeGreaterThan(0);
      expect(progressReports.some(p => p.stage === 'hierarchy-building')).toBe(true);
    });
  });

  describe('setupDatabaseProperties', () => {
    it('should set up database properties successfully', async () => {
      // Arrange
      await service.initialize(mockConfig);
      const databaseId = 'database-123';

      // Act
      const result = await service.setupDatabaseProperties(databaseId);

      // Assert
      expect(result).toBe(true);
    });

    it('should handle database setup errors', async () => {
      // Arrange
      const invalidConfig: NotionConfig = {
        integrationToken: 'invalid-token'
      };
      await service.initialize(invalidConfig);
      const databaseId = 'invalid-database';

      // Act
      const result = await service.setupDatabaseProperties(databaseId);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('handleRateLimit', () => {
    it('should handle rate limiting with default delay', async () => {
      // Arrange
      await service.initialize(mockConfig);
      const startTime = Date.now();

      // Act
      await service.handleRateLimit();

      // Assert
      const endTime = Date.now();
      expect(endTime - startTime).toBeGreaterThanOrEqual(100);
    });

    it('should handle rate limiting with custom delay', async () => {
      // Arrange
      await service.initialize(mockConfig);
      const customDelay = 500;
      const startTime = Date.now();

      // Act
      await service.handleRateLimit(customDelay);

      // Assert
      const endTime = Date.now();
      expect(endTime - startTime).toBeGreaterThanOrEqual(customDelay);
    });
  });

  describe('getApiStats', () => {
    it('should return API usage statistics', async () => {
      // Arrange
      await service.initialize(mockConfig);

      // Act
      const result = await service.getApiStats();

      // Assert
      expect(typeof result).toBe('object');
      expect(result).toHaveProperty('requestsMade');
      expect(result).toHaveProperty('rateLimitHits');
      expect(result).toHaveProperty('errors');
    });

    it('should track API calls correctly', async () => {
      // Arrange
      await service.initialize(mockConfig);
      await service.testConnection();
      await service.getDatabases();

      // Act
      const stats = await service.getApiStats();

      // Assert
      expect(stats.requestsMade).toBeGreaterThan(0);
    });
  });
});
