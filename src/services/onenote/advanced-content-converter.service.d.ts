/**
 * Advanced OneNote content conversion service
 * Handles complex content types, tables, metadata, and advanced formatting
 */
import { OneNotePage } from '../../types/onenote';
export interface AdvancedConversionOptions {
    outputFormat: 'markdown' | 'docx' | 'notion';
    includeMetadata?: boolean;
    preserveTables?: boolean;
    preserveCodeBlocks?: boolean;
    handleAttachments?: boolean;
    convertTags?: boolean;
    performanceMode?: 'fast' | 'balanced' | 'thorough';
    onProgress?: (progress: AdvancedConversionProgress) => void;
}
export interface AdvancedConversionProgress {
    stage: 'parsing' | 'table-processing' | 'metadata-extraction' | 'tag-conversion' | 'attachment-processing' | 'formatting' | 'complete';
    percentage: number;
    message: string;
    processedItems?: number;
    totalItems?: number;
}
export interface TableData {
    headers: string[];
    rows: string[][];
    caption?: string | undefined;
    metadata?: Record<string, any>;
}
export interface AttachmentData {
    name: string;
    type: string;
    size: number;
    path: string;
    metadata?: Record<string, any>;
}
export interface TagData {
    name: string;
    color?: string;
    category?: string;
    metadata?: Record<string, any>;
}
export interface AdvancedConversionResult {
    success: boolean;
    content?: string;
    tables?: TableData[] | undefined;
    attachments?: AttachmentData[] | undefined;
    tags?: TagData[] | undefined;
    metadata?: Record<string, any> | undefined;
    error?: string;
    performance?: {
        processingTime: number;
        itemsProcessed: number;
        memoryUsed: number;
    };
}
export interface IAdvancedContentConverterService {
    /**
     * Convert OneNote page with advanced content types
     * @param page OneNote page to convert
     * @param options Advanced conversion options
     * @returns Advanced conversion result
     */
    convertAdvancedPage(page: OneNotePage, options: AdvancedConversionOptions): Promise<AdvancedConversionResult>;
    /**
     * Extract and process tables from content
     * @param content Raw content with potential tables
     * @param options Conversion options
     * @returns Array of processed tables
     */
    extractTables(content: string, options: AdvancedConversionOptions): Promise<TableData[]>;
    /**
     * Extract and process attachments from content
     * @param content Raw content with potential attachments
     * @param options Conversion options
     * @returns Array of processed attachments
     */
    extractAttachments(content: string, options: AdvancedConversionOptions): Promise<AttachmentData[]>;
    /**
     * Extract and convert OneNote tags
     * @param content Raw content with potential tags
     * @param options Conversion options
     * @returns Array of processed tags
     */
    extractTags(content: string, options: AdvancedConversionOptions): Promise<TagData[]>;
    /**
     * Extract page metadata
     * @param page OneNote page
     * @param options Conversion options
     * @returns Extracted metadata
     */
    extractPageMetadata(page: OneNotePage, options: AdvancedConversionOptions): Promise<Record<string, any>>;
    /**
     * Convert tables to markdown format
     * @param tables Array of table data
     * @param options Conversion options
     * @returns Markdown formatted tables
     */
    convertTablesToMarkdown(tables: TableData[], options: AdvancedConversionOptions): string;
    /**
     * Convert code blocks to markdown format
     * @param content Raw content with code blocks
     * @param options Conversion options
     * @returns Content with converted code blocks
     */
    convertCodeBlocks(content: string, options: AdvancedConversionOptions): string;
}
export declare class AdvancedContentConverterService implements IAdvancedContentConverterService {
    convertAdvancedPage(page: OneNotePage, options: AdvancedConversionOptions): Promise<AdvancedConversionResult>;
    private extractAllContentTypes;
    private processContent;
    private createSuccessResult;
    private createErrorResult;
    extractTables(content: string, options: AdvancedConversionOptions): Promise<TableData[]>;
    private processTable;
    private parseTableRow;
    extractAttachments(content: string, options: AdvancedConversionOptions): Promise<AttachmentData[]>;
    private parseAttachment;
    extractTags(content: string, options: AdvancedConversionOptions): Promise<TagData[]>;
    private parseTag;
    extractPageMetadata(page: OneNotePage, options: AdvancedConversionOptions): Promise<Record<string, any>>;
    convertTablesToMarkdown(tables: TableData[], options: AdvancedConversionOptions): string;
    convertCodeBlocks(content: string, options: AdvancedConversionOptions): string;
    private cleanProcessedContent;
    /**
     * Handle edge cases and complex content types
     */
    private handleEdgeCases;
    private processNestedLists;
    private processComplexTables;
    private normalizeSpecialCharacters;
    /**
     * Performance optimization for large files
     */
    private optimizeForPerformance;
    private reportProgress;
}
//# sourceMappingURL=advanced-content-converter.service.d.ts.map