/**
 * Notion API integration service
 * Handles authentication, API calls, and content import to Notion
 */
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
    properties?: Record<string, any> | undefined;
    children?: NotionPage[] | undefined;
    parentId?: string | undefined;
    metadata?: Record<string, any> | undefined;
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
export declare class NotionApiService implements INotionApiService {
    private config;
    private client;
    private apiStats;
    initialize(config: NotionConfig): Promise<boolean>;
    testConnection(): Promise<boolean>;
    getDatabases(): Promise<NotionDatabase[]>;
    createPage(page: NotionPage, options?: NotionApiOptions): Promise<NotionImportResult>;
    uploadFile(filePath: string, options?: NotionApiOptions): Promise<NotionUploadResult>;
    createPageHierarchy(pages: NotionPage[], options?: NotionApiOptions): Promise<NotionImportResult[]>;
    setupDatabaseProperties(databaseId: string): Promise<boolean>;
    handleRateLimit(delay?: number): Promise<void>;
    getApiStats(): Promise<Record<string, any>>;
    private convertPropertyValue;
    private convertContentToBlocks;
    private isRateLimitError;
    private reportProgress;
}
//# sourceMappingURL=notion-api.service.d.ts.map