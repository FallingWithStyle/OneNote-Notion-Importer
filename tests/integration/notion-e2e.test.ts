import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { NotionService } from '../../src/services/notion/notion.service';
import { OneNoteService } from '../../src/services/onenote/onenote.service';
import { ConfigService } from '../../src/services/config.service';
import { logger } from '../../src/utils/logger';
import * as fs from 'fs';
import * as path from 'path';

describe('End-to-End Notion Integration', () => {
  let notionService: NotionService;
  let oneNoteService: OneNoteService;
  let configService: ConfigService;
  let testDatabaseId: string;
  let testPageId: string;

  beforeAll(async () => {
    // Initialize services
    configService = new ConfigService();
    notionService = new NotionService();
    oneNoteService = new OneNoteService();

    // Load test configuration
    const config = await configService.loadConfig();
    expect(config.notion.apiKey).toBeDefined();
    expect(config.notion.databaseId).toBeDefined();

    // Create a test database for E2E testing
    try {
      const database = await notionService.createTestDatabase('ONI E2E Test Database');
      testDatabaseId = database.id;
      logger.info(`Created test database: ${testDatabaseId}`);
    } catch (error) {
      logger.error('Failed to create test database:', error);
      throw error;
    }
  });

  afterAll(async () => {
    // Clean up test database
    if (testDatabaseId) {
      try {
        await notionService.archiveDatabase(testDatabaseId);
        logger.info(`Archived test database: ${testDatabaseId}`);
      } catch (error) {
        logger.error('Failed to clean up test database:', error);
      }
    }
  });

  beforeEach(() => {
    // Reset test state
    testPageId = '';
  });

  describe('Complete Import Flow', () => {
    it('should import a simple OneNote page to Notion', async () => {
      // Load test OneNote file
      const testFilePath = path.join(__dirname, '../fixtures/onenote/simple-page.one');
      expect(fs.existsSync(testFilePath)).toBe(true);

      // Process OneNote file
      const notebook = await oneNoteService.processOneNoteFile(testFilePath);
      expect(notebook).toBeDefined();
      expect(notebook.pages.length).toBeGreaterThan(0);

      const page = notebook.pages[0];
      expect(page.title).toBeDefined();
      expect(page.content).toBeDefined();

      // Convert to Notion format
      const notionPage = await notionService.convertOneNotePageToNotion(page);
      expect(notionPage).toBeDefined();

      // Create page in Notion
      const createdPage = await notionService.createPage(testDatabaseId, notionPage);
      expect(createdPage).toBeDefined();
      expect(createdPage.id).toBeDefined();

      testPageId = createdPage.id;
      logger.info(`Created test page: ${testPageId}`);

      // Verify page was created correctly
      const retrievedPage = await notionService.getPage(testPageId);
      expect(retrievedPage).toBeDefined();
      expect(retrievedPage.properties.Title?.title?.[0]?.text?.content).toBe(page.title);
    });

    it('should import a complex OneNote notebook with multiple pages', async () => {
      // Load test OneNote package
      const testFilePath = path.join(__dirname, '../fixtures/onenote/complex-notebook.onepkg');
      expect(fs.existsSync(testFilePath)).toBe(true);

      // Process OneNote package
      const notebook = await oneNoteService.processOneNotePackage(testFilePath);
      expect(notebook).toBeDefined();
      expect(notebook.sections.length).toBeGreaterThan(0);
      expect(notebook.pages.length).toBeGreaterThan(0);

      // Import all pages
      const createdPages: string[] = [];
      for (const page of notebook.pages) {
        const notionPage = await notionService.convertOneNotePageToNotion(page);
        const createdPage = await notionService.createPage(testDatabaseId, notionPage);
        createdPages.push(createdPage.id);
      }

      expect(createdPages.length).toBe(notebook.pages.length);
      logger.info(`Created ${createdPages.length} pages in Notion`);

      // Verify all pages were created
      for (const pageId of createdPages) {
        const page = await notionService.getPage(pageId);
        expect(page).toBeDefined();
      }
    });

    it('should handle images and attachments correctly', async () => {
      // Load OneNote file with images
      const testFilePath = path.join(__dirname, '../fixtures/onenote/page-with-images.one');
      if (!fs.existsSync(testFilePath)) {
        logger.warn('Test file with images not found, skipping test');
        return;
      }

      const notebook = await oneNoteService.processOneNoteFile(testFilePath);
      const page = notebook.pages[0];

      // Check if page has images
      const hasImages = page.content.includes('![image]') || page.attachments.length > 0;
      if (!hasImages) {
        logger.warn('No images found in test file, skipping test');
        return;
      }

      // Convert and create page
      const notionPage = await notionService.convertOneNotePageToNotion(page);
      const createdPage = await notionService.createPage(testDatabaseId, notionPage);
      testPageId = createdPage.id;

      // Verify page content includes image references
      const retrievedPage = await notionService.getPage(testPageId);
      expect(retrievedPage).toBeDefined();
      
      // Check if images were uploaded to Notion
      const pageContent = await notionService.getPageContent(testPageId);
      expect(pageContent).toBeDefined();
    });

    it('should preserve page hierarchy and relationships', async () => {
      // Load hierarchical OneNote file
      const testFilePath = path.join(__dirname, '../fixtures/onenote/hierarchical-notebook.onepkg');
      if (!fs.existsSync(testFilePath)) {
        logger.warn('Hierarchical test file not found, skipping test');
        return;
      }

      const notebook = await oneNoteService.processOneNotePackage(testFilePath);
      expect(notebook.sections.length).toBeGreaterThan(0);

      // Create sections as parent pages
      const sectionPages: { [key: string]: string } = {};
      for (const section of notebook.sections) {
        const notionSection = await notionService.convertOneNoteSectionToNotion(section);
        const createdSection = await notionService.createPage(testDatabaseId, notionSection);
        sectionPages[section.id] = createdSection.id;
      }

      // Create pages under their respective sections
      for (const page of notebook.pages) {
        const notionPage = await notionService.convertOneNotePageToNotion(page);
        const parentSectionId = sectionPages[page.sectionId];
        
        if (parentSectionId) {
          notionPage.parent = { page_id: parentSectionId };
        }

        const createdPage = await notionService.createPage(testDatabaseId, notionPage);
        expect(createdPage).toBeDefined();
      }

      // Verify hierarchy was preserved
      for (const [sectionId, pageId] of Object.entries(sectionPages)) {
        const section = await notionService.getPage(pageId);
        expect(section).toBeDefined();
        expect(section.properties.Type?.select?.name).toBe('Section');
      }
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle API rate limiting gracefully', async () => {
      // Create multiple pages rapidly to trigger rate limiting
      const promises = [];
      for (let i = 0; i < 10; i++) {
        const testPage = {
          parent: { database_id: testDatabaseId },
          properties: {
            Title: {
              title: [{ text: { content: `Rate Limit Test Page ${i}` } }]
            }
          }
        };
        promises.push(notionService.createPage(testDatabaseId, testPage));
      }

      const results = await Promise.allSettled(promises);
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      logger.info(`Rate limit test: ${successful} successful, ${failed} failed`);
      expect(successful).toBeGreaterThan(0);
    });

    it('should handle invalid OneNote files gracefully', async () => {
      // Test with corrupted file
      const corruptedFilePath = path.join(__dirname, '../fixtures/onenote/corrupted.one');
      if (!fs.existsSync(corruptedFilePath)) {
        logger.warn('Corrupted test file not found, skipping test');
        return;
      }

      await expect(oneNoteService.processOneNoteFile(corruptedFilePath))
        .rejects
        .toThrow();
    });

    it('should handle Notion API errors gracefully', async () => {
      // Test with invalid database ID
      const invalidDatabaseId = 'invalid-database-id';
      const testPage = {
        parent: { database_id: invalidDatabaseId },
        properties: {
          Title: {
            title: [{ text: { content: 'Test Page' } }]
          }
        }
      };

      await expect(notionService.createPage(invalidDatabaseId, testPage))
        .rejects
        .toThrow();
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large notebooks efficiently', async () => {
      const startTime = Date.now();
      
      // Load large notebook
      const testFilePath = path.join(__dirname, '../fixtures/onenote/large-notebook.onepkg');
      if (!fs.existsSync(testFilePath)) {
        logger.warn('Large notebook test file not found, skipping test');
        return;
      }

      const notebook = await oneNoteService.processOneNotePackage(testFilePath);
      const processingTime = Date.now() - startTime;
      
      logger.info(`Processed large notebook in ${processingTime}ms`);
      expect(processingTime).toBeLessThan(30000); // Should complete within 30 seconds
      expect(notebook.pages.length).toBeGreaterThan(0);
    });

    it('should handle concurrent operations', async () => {
      const startTime = Date.now();
      
      // Create multiple pages concurrently
      const promises = [];
      for (let i = 0; i < 5; i++) {
        const testPage = {
          parent: { database_id: testDatabaseId },
          properties: {
            Title: {
              title: [{ text: { content: `Concurrent Test Page ${i}` } }]
            }
          }
        };
        promises.push(notionService.createPage(testDatabaseId, testPage));
      }

      const results = await Promise.all(promises);
      const totalTime = Date.now() - startTime;
      
      expect(results.length).toBe(5);
      expect(totalTime).toBeLessThan(10000); // Should complete within 10 seconds
      logger.info(`Created 5 pages concurrently in ${totalTime}ms`);
    });
  });
});
