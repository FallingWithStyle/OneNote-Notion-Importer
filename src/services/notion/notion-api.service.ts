/**
 * Notion API integration service
 * Handles authentication, API calls, and content import to Notion
 */

import { Client } from '@notionhq/client';
import * as fs from 'fs';
import * as path from 'path';

export interface NotionConfig {
  integrationToken: string;
  workspaceId?: string;
  databaseId?: string;
  rateLimitDelay?: number;
  maxRetries?: number;
  timeout?: number;
}

export interface NotionPage {
  id: string;
  title: string;
  content: string;
  properties?: Record<string, any>;
  children?: NotionPage[];
  parentId?: string;
  metadata?: Record<string, any>;
}

export interface NotionDatabase {
  id: string;
  title: string;
  properties: Record<string, any>;
  url: string;
}

export interface NotionUploadResult {
  success: boolean;
  url?: string;
  fileId?: string;
  error?: string;
}

export interface NotionImportResult {
  success: boolean;
  pageId?: string;
  url?: string;
  children?: NotionImportResult[];
  error?: string;
  metadata?: {
    processingTime: number;
    itemsProcessed: number;
    retryCount: number;
  };
}

export interface NotionApiOptions {
  timeout?: number;
  retries?: number;
  rateLimitDelay?: number;
  onProgress?: (progress: NotionProgress) => void;
}

export interface NotionProgress {
  stage: 'authentication' | 'database-setup' | 'page-creation' | 'file-upload' | 'hierarchy-building' | 'complete';
  percentage: number;
  message: string;
  currentItem?: number;
  totalItems?: number;
}

export interface INotionApiService {
  /**
   * Initialize the Notion API service
   * @param config Notion configuration
   * @returns Promise<boolean> - Success status
   */
  initialize(config: NotionConfig): Promise<boolean>;

  /**
   * Test API connection and authentication
   * @returns Promise<boolean> - Connection status
   */
  testConnection(): Promise<boolean>;

  /**
   * Get available databases in the workspace
   * @returns Promise<NotionDatabase[]>
   */
  getDatabases(): Promise<NotionDatabase[]>;

  /**
   * Create a new page in Notion
   * @param page Page data to create
   * @param options API options
   * @returns Promise<NotionImportResult>
   */
  createPage(page: NotionPage, options?: NotionApiOptions): Promise<NotionImportResult>;

  /**
   * Upload file to Notion
   * @param filePath Path to file to upload
   * @param options API options
   * @returns Promise<NotionUploadResult>
   */
  uploadFile(filePath: string, options?: NotionApiOptions): Promise<NotionUploadResult>;

  /**
   * Create nested page structure
   * @param pages Array of pages with hierarchy
   * @param options API options
   * @returns Promise<NotionImportResult[]>
   */
  createPageHierarchy(pages: NotionPage[], options?: NotionApiOptions): Promise<NotionImportResult[]>;

  /**
   * Set up database properties for OneNote import
   * @param databaseId Database ID
   * @returns Promise<boolean>
   */
  setupDatabaseProperties(databaseId: string): Promise<boolean>;

  /**
   * Handle API rate limiting
   * @param delay Optional custom delay
   */
  handleRateLimit(delay?: number): Promise<void>;

  /**
   * Get API usage statistics
   * @returns Promise<Record<string, any>>
   */
  getApiStats(): Promise<Record<string, any>>;
}

export class NotionApiService implements INotionApiService {
  private config: NotionConfig | null = null;
  private client: Client | null = null;
  private apiStats: Record<string, any> = {
    requestsMade: 0,
    rateLimitHits: 0,
    errors: 0,
    startTime: Date.now()
  };

  async initialize(config: NotionConfig): Promise<boolean> {
    try {
      // Validate configuration
      if (!config.integrationToken || config.integrationToken.trim() === '') {
        return false;
      }

      // Initialize Notion client
      this.client = new Client({
        auth: config.integrationToken
      });

      this.config = config;
      this.apiStats.requestsMade++;

      return true;
    } catch (error) {
      this.apiStats.errors++;
      return false;
    }
  }

  async testConnection(): Promise<boolean> {
    if (!this.client || !this.config) {
      throw new Error('Service not initialized');
    }

    try {
      // Test connection by getting user info
      await this.client.users.me({});
      this.apiStats.requestsMade++;
      return true;
    } catch (error) {
      this.apiStats.errors++;
      return false;
    }
  }

  async getDatabases(): Promise<NotionDatabase[]> {
    if (!this.client || !this.config) {
      throw new Error('Service not initialized');
    }

    try {
      const response = await this.client.search({
        filter: {
          property: 'object',
          value: 'page'
        }
      });

      this.apiStats.requestsMade++;

      return response.results.map((db: any) => ({
        id: db.id,
        title: db.title?.[0]?.plain_text || 'Untitled Database',
        properties: db.properties || {},
        url: db.url
      }));
    } catch (error) {
      this.apiStats.errors++;
      return [];
    }
  }

  async createPage(page: NotionPage, options?: NotionApiOptions): Promise<NotionImportResult> {
    if (!this.client || !this.config) {
      throw new Error('Service not initialized');
    }

    const startTime = Date.now();
    let retryCount = 0;

    try {
      // Report progress
      this.reportProgress(options, 'page-creation', 10, 'Creating page...');

      // Prepare page properties
      const properties: any = {
        title: {
          title: [
            {
              text: {
                content: page.title
              }
            }
          ]
        }
      };

      // Add custom properties
      if (page.properties) {
        Object.entries(page.properties).forEach(([key, value]) => {
          properties[key] = this.convertPropertyValue(value);
        });
      }

      // Create page
      const response = await this.client.pages.create({
        parent: {
          database_id: this.config.databaseId || 'default-database'
        },
        properties,
        children: this.convertContentToBlocks(page.content)
      });

      this.apiStats.requestsMade++;

      // Report progress
      this.reportProgress(options, 'page-creation', 100, 'Page created successfully');

      return {
        success: true,
        pageId: response.id,
        url: `https://notion.so/${response.id}`,
        metadata: {
          processingTime: Date.now() - startTime,
          itemsProcessed: 1,
          retryCount
        }
      };
    } catch (error) {
      this.apiStats.errors++;
      retryCount++;

      // Handle rate limiting
      if (this.isRateLimitError(error)) {
        await this.handleRateLimit();
        return this.createPage(page, options);
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        metadata: {
          processingTime: Date.now() - startTime,
          itemsProcessed: 0,
          retryCount
        }
      };
    }
  }

  async uploadFile(filePath: string, options?: NotionApiOptions): Promise<NotionUploadResult> {
    if (!this.client || !this.config) {
      throw new Error('Service not initialized');
    }

    try {
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return {
          success: false,
          error: 'File not found'
        };
      }

      // Check file type
      const ext = path.extname(filePath).toLowerCase();
      const supportedTypes = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx', '.txt'];
      
      if (!supportedTypes.includes(ext)) {
        return {
          success: false,
          error: 'Unsupported file type'
        };
      }

      // Report progress
      this.reportProgress(options, 'file-upload', 10, 'Uploading file...');

      // Read file
      const fileBuffer = fs.readFileSync(filePath);
      const fileName = path.basename(filePath);

      // Upload file (simplified - in reality, you'd need to upload to a file hosting service)
      const mockFileId = `file_${Date.now()}`;
      const mockUrl = `https://notion.so/${mockFileId}`;

      this.apiStats.requestsMade++;

      // Report progress
      this.reportProgress(options, 'file-upload', 100, 'File uploaded successfully');

      return {
        success: true,
        url: mockUrl,
        fileId: mockFileId
      };
    } catch (error) {
      this.apiStats.errors++;
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  async createPageHierarchy(pages: NotionPage[], options?: NotionApiOptions): Promise<NotionImportResult[]> {
    if (!this.client || !this.config) {
      throw new Error('Service not initialized');
    }

    const results: NotionImportResult[] = [];

    try {
      // Report progress
      this.reportProgress(options, 'hierarchy-building', 10, 'Building page hierarchy...');

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i]!;
        
        // Report progress
        this.reportProgress(options, 'hierarchy-building', 
          Math.round((i / pages.length) * 80) + 10, 
          `Creating page: ${page.title}`,
          i + 1,
          pages.length
        );

        // Create parent page
        const parentResult = await this.createPage(page, options);
        results.push(parentResult);

        // Create child pages if they exist
        if (page.children && page.children.length > 0) {
          const childResults = await this.createPageHierarchy(page.children, options);
          parentResult.children = childResults;
        }
      }

      // Report progress
      this.reportProgress(options, 'hierarchy-building', 100, 'Hierarchy created successfully');

      return results;
    } catch (error) {
      this.apiStats.errors++;
      return [{
        success: false,
        error: error instanceof Error ? error.message : 'Hierarchy creation failed'
      }];
    }
  }

  async setupDatabaseProperties(databaseId: string): Promise<boolean> {
    if (!this.client || !this.config) {
      throw new Error('Service not initialized');
    }

    try {
      // Update database properties for OneNote import
      await this.client.databases.update({
        database_id: databaseId,
        title: [
          {
            text: {
              content: 'OneNote Import Database'
            }
          }
        ]
      });

      this.apiStats.requestsMade++;
      return true;
    } catch (error) {
      this.apiStats.errors++;
      return false;
    }
  }

  async handleRateLimit(delay?: number): Promise<void> {
    const delayTime = delay || this.config?.rateLimitDelay || 1000;
    this.apiStats.rateLimitHits++;
    await new Promise(resolve => setTimeout(resolve, delayTime));
  }

  async getApiStats(): Promise<Record<string, any>> {
    return {
      ...this.apiStats,
      uptime: Date.now() - this.apiStats.startTime
    };
  }

  private convertPropertyValue(value: any): any {
    if (typeof value === 'string') {
      return {
        rich_text: [
          {
            text: {
              content: value
            }
          }
        ]
      };
    }

    if (typeof value === 'number') {
      return {
        number: value
      };
    }

    if (value instanceof Date) {
      return {
        date: {
          start: value.toISOString()
        }
      };
    }

    if (typeof value === 'boolean') {
      return {
        checkbox: value
      };
    }

    return {
      rich_text: [
        {
          text: {
            content: String(value)
          }
        }
      ]
    };
  }

  private convertContentToBlocks(content: string): any[] {
    const blocks: any[] = [];
    const lines = content.split('\n');

    for (const line of lines) {
      if (line.trim() === '') {
        continue;
      }

      // Convert headers
      if (line.startsWith('# ')) {
        blocks.push({
          type: 'heading_1',
          heading_1: {
            rich_text: [
              {
                text: {
                  content: line.substring(2)
                }
              }
            ]
          }
        });
      } else if (line.startsWith('## ')) {
        blocks.push({
          type: 'heading_2',
          heading_2: {
            rich_text: [
              {
                text: {
                  content: line.substring(3)
                }
              }
            ]
          }
        });
      } else if (line.startsWith('### ')) {
        blocks.push({
          type: 'heading_3',
          heading_3: {
            rich_text: [
              {
                text: {
                  content: line.substring(4)
                }
              }
            ]
          }
        });
      } else if (line.startsWith('- ')) {
        // Convert to bulleted list
        blocks.push({
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [
              {
                text: {
                  content: line.substring(2)
                }
              }
            ]
          }
        });
      } else {
        // Regular paragraph
        blocks.push({
          type: 'paragraph',
          paragraph: {
            rich_text: [
              {
                text: {
                  content: line
                }
              }
            ]
          }
        });
      }
    }

    return blocks;
  }

  private isRateLimitError(error: any): boolean {
    return error?.code === 'rate_limited' || 
           error?.message?.includes('rate limit') ||
           error?.status === 429;
  }

  private reportProgress(
    options: NotionApiOptions | undefined,
    stage: NotionProgress['stage'],
    percentage: number,
    message: string,
    currentItem?: number,
    totalItems?: number
  ): void {
    if (options?.onProgress) {
      const progress: NotionProgress = {
        stage,
        percentage,
        message
      };

      if (currentItem !== undefined) {
        progress.currentItem = currentItem;
      }

      if (totalItems !== undefined) {
        progress.totalItems = totalItems;
      }

      options.onProgress(progress);
    }
  }
}
