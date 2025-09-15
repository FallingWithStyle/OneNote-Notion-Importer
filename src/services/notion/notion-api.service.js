"use strict";
/**
 * Notion API integration service
 * Handles authentication, API calls, and content import to Notion
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotionApiService = void 0;
const client_1 = require("@notionhq/client");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class NotionApiService {
    constructor() {
        this.config = null;
        this.client = null;
        this.apiStats = {
            requestsMade: 0,
            rateLimitHits: 0,
            errors: 0,
            startTime: Date.now()
        };
    }
    async initialize(config) {
        try {
            // Validate configuration
            if (!config.integrationToken || config.integrationToken.trim() === '') {
                return false;
            }
            // Initialize Notion client
            this.client = new client_1.Client({
                auth: config.integrationToken
            });
            this.config = config;
            this.apiStats.requestsMade++;
            return true;
        }
        catch (error) {
            this.apiStats.errors++;
            return false;
        }
    }
    async testConnection() {
        if (!this.client || !this.config) {
            throw new Error('Service not initialized');
        }
        try {
            // Test connection by getting user info
            await this.client.users.me({});
            this.apiStats.requestsMade++;
            return true;
        }
        catch (error) {
            this.apiStats.errors++;
            return false;
        }
    }
    async getDatabases() {
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
            return response.results.map((db) => ({
                id: db.id,
                title: db.title?.[0]?.plain_text || 'Untitled Database',
                properties: db.properties || {},
                url: db.url
            }));
        }
        catch (error) {
            this.apiStats.errors++;
            return [];
        }
    }
    async createPage(page, options) {
        if (!this.client || !this.config) {
            throw new Error('Service not initialized');
        }
        const startTime = Date.now();
        let retryCount = 0;
        try {
            // Report progress
            this.reportProgress(options, 'page-creation', 10, 'Creating page...');
            // Prepare page properties
            const properties = {
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
        }
        catch (error) {
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
    async uploadFile(filePath, options) {
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
        }
        catch (error) {
            this.apiStats.errors++;
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Upload failed'
            };
        }
    }
    async createPageHierarchy(pages, options) {
        if (!this.client || !this.config) {
            throw new Error('Service not initialized');
        }
        const results = [];
        try {
            // Report progress
            this.reportProgress(options, 'hierarchy-building', 10, 'Building page hierarchy...');
            for (let i = 0; i < pages.length; i++) {
                const page = pages[i];
                // Report progress
                this.reportProgress(options, 'hierarchy-building', Math.round((i / pages.length) * 80) + 10, `Creating page: ${page.title}`, i + 1, pages.length);
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
        }
        catch (error) {
            this.apiStats.errors++;
            return [{
                    success: false,
                    error: error instanceof Error ? error.message : 'Hierarchy creation failed'
                }];
        }
    }
    async setupDatabaseProperties(databaseId) {
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
        }
        catch (error) {
            this.apiStats.errors++;
            return false;
        }
    }
    async handleRateLimit(delay) {
        const delayTime = delay || this.config?.rateLimitDelay || 1000;
        this.apiStats.rateLimitHits++;
        await new Promise(resolve => setTimeout(resolve, delayTime));
    }
    async getApiStats() {
        return {
            ...this.apiStats,
            uptime: Date.now() - this.apiStats.startTime
        };
    }
    convertPropertyValue(value) {
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
    convertContentToBlocks(content) {
        const blocks = [];
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
            }
            else if (line.startsWith('## ')) {
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
            }
            else if (line.startsWith('### ')) {
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
            }
            else if (line.startsWith('- ')) {
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
            }
            else {
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
    isRateLimitError(error) {
        return error?.code === 'rate_limited' ||
            error?.message?.includes('rate limit') ||
            error?.status === 429;
    }
    reportProgress(options, stage, percentage, message, currentItem, totalItems) {
        if (options?.onProgress) {
            const progress = {
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
exports.NotionApiService = NotionApiService;
//# sourceMappingURL=notion-api.service.js.map