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

export class AdvancedContentConverterService implements IAdvancedContentConverterService {
  async convertAdvancedPage(page: OneNotePage, options: AdvancedConversionOptions): Promise<AdvancedConversionResult> {
    const startTime = Date.now();
    const progressReports: AdvancedConversionProgress[] = [];

    try {
      // Progress: Parsing stage
      this.reportProgress(options, 'parsing', 10, 'Parsing content...', progressReports);

      // Extract all content types
      const extractedContent = await this.extractAllContentTypes(page, options, progressReports);

      // Process and format content
      const processedContent = await this.processContent(extractedContent, options, progressReports);

      // Progress: Complete
      this.reportProgress(options, 'complete', 100, 'Conversion completed successfully', progressReports);

      const processingTime = Date.now() - startTime;
      const itemsProcessed = extractedContent.tables.length + extractedContent.attachments.length + extractedContent.tags.length;

      return this.createSuccessResult(processedContent, extractedContent, processingTime, itemsProcessed);
    } catch (error) {
      return this.createErrorResult(error);
    }
  }

  private async extractAllContentTypes(
    page: OneNotePage, 
    options: AdvancedConversionOptions, 
    progressReports: AdvancedConversionProgress[]
  ): Promise<{
    content: string;
    tables: TableData[];
    attachments: AttachmentData[];
    tags: TagData[];
    metadata: Record<string, any>;
  }> {
    let content = page.content;
    const tables: TableData[] = [];
    const attachments: AttachmentData[] = [];
    const tags: TagData[] = [];
    let metadata: Record<string, any> = {};

    // Extract tables if requested
    if (options.preserveTables) {
      this.reportProgress(options, 'table-processing', 20, 'Processing tables...', progressReports);
      const extractedTables = await this.extractTables(content, options);
      tables.push(...extractedTables);
    }

    // Extract attachments if requested
    if (options.handleAttachments) {
      this.reportProgress(options, 'attachment-processing', 40, 'Processing attachments...', progressReports);
      const extractedAttachments = await this.extractAttachments(content, options);
      attachments.push(...extractedAttachments);
    }

    // Extract tags if requested
    if (options.convertTags) {
      this.reportProgress(options, 'tag-conversion', 50, 'Converting tags...', progressReports);
      const extractedTags = await this.extractTags(content, options);
      tags.push(...extractedTags);
    }

    // Extract metadata if requested
    if (options.includeMetadata) {
      this.reportProgress(options, 'metadata-extraction', 60, 'Extracting metadata...', progressReports);
      metadata = await this.extractPageMetadata(page, options);
    }

    return { content, tables, attachments, tags, metadata };
  }

  private async processContent(
    extractedContent: {
      content: string;
      tables: TableData[];
      attachments: AttachmentData[];
      tags: TagData[];
      metadata: Record<string, any>;
    },
    options: AdvancedConversionOptions,
    progressReports: AdvancedConversionProgress[]
  ): Promise<string> {
    this.reportProgress(options, 'formatting', 70, 'Formatting content...', progressReports);
    
    let content = extractedContent.content;

    // Apply performance optimizations
    content = this.optimizeForPerformance(content, options);

    // Convert code blocks
    if (options.preserveCodeBlocks) {
      content = this.convertCodeBlocks(content, options);
    }

    // Remove processed elements from content first
    content = this.cleanProcessedContent(content, extractedContent);

    // Convert tables to markdown and add to content
    if (extractedContent.tables.length > 0) {
      const tableMarkdown = this.convertTablesToMarkdown(extractedContent.tables, options);
      content = content + '\n\n' + tableMarkdown;
    }

    return content;
  }

  private createSuccessResult(
    content: string,
    extractedContent: {
      tables: TableData[];
      attachments: AttachmentData[];
      tags: TagData[];
      metadata: Record<string, any>;
    },
    processingTime: number,
    itemsProcessed: number
  ): AdvancedConversionResult {
    return {
      success: true,
      content,
      tables: extractedContent.tables.length > 0 ? extractedContent.tables : undefined,
      attachments: extractedContent.attachments.length > 0 ? extractedContent.attachments : undefined,
      tags: extractedContent.tags.length > 0 ? extractedContent.tags : undefined,
      metadata: Object.keys(extractedContent.metadata).length > 0 ? extractedContent.metadata : undefined,
      performance: {
        processingTime,
        itemsProcessed,
        memoryUsed: process.memoryUsage().heapUsed
      }
    };
  }

  private createErrorResult(error: unknown): AdvancedConversionResult {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }

  async extractTables(content: string, options: AdvancedConversionOptions): Promise<TableData[]> {
    const tables: TableData[] = [];
    const tableRegex = /\|(.+)\|/g;
    const lines = content.split('\n');
    
    let currentTable: string[] = [];
    let caption = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      
      // Check for caption (line before table)
      if (line.includes('Table') && line.includes(':')) {
        caption = line.split(':')[1]?.trim() || '';
        continue;
      }

      if (line.includes('|')) {
        currentTable.push(line);
      } else if (currentTable.length > 0) {
        // End of table, process it
        const table = this.processTable(currentTable, caption);
        if (table) {
          tables.push(table);
        }
        currentTable = [];
        caption = '';
      }
    }

    // Process last table if exists
    if (currentTable.length > 0) {
      const table = this.processTable(currentTable, caption);
      if (table) {
        tables.push(table);
      }
    }

    return tables;
  }

  private processTable(tableLines: string[], caption: string): TableData | null {
    if (tableLines.length < 2) return null;

    const headers = this.parseTableRow(tableLines[0]!);
    const rows: string[][] = [];

    for (let i = 1; i < tableLines.length; i++) {
      const row = this.parseTableRow(tableLines[i]!);
      if (row.length === headers.length) {
        rows.push(row);
      }
    }

    return {
      headers,
      rows,
      caption: caption || undefined
    };
  }

  private parseTableRow(row: string): string[] {
    return row.split('|')
      .map(cell => cell.trim())
      .filter(cell => cell.length > 0);
  }

  async extractAttachments(content: string, options: AdvancedConversionOptions): Promise<AttachmentData[]> {
    const attachments: AttachmentData[] = [];
    const attachmentRegex = /\[ATTACHMENT:([^\]]+)\]/g;
    let match;

    while ((match = attachmentRegex.exec(content)) !== null) {
      const attachmentString = match[1]!;
      const attachment = this.parseAttachment(attachmentString);
      if (attachment) {
        attachments.push(attachment);
      }
    }

    return attachments;
  }

  private parseAttachment(attachmentString: string): AttachmentData | null {
    const parts = attachmentString.split(':');
    const name = parts[0]!;
    const extension = name.split('.').pop()?.toLowerCase() || '';
    
    const attachment: AttachmentData = {
      name,
      type: extension,
      size: 0,
      path: name
    };

    // Parse additional metadata
    for (let i = 1; i < parts.length; i++) {
      const part = parts[i]!;
      if (part.startsWith('size=')) {
        attachment.size = parseInt(part.split('=')[1]!) || 0;
      } else if (part.startsWith('type=')) {
        attachment.type = part.split('=')[1]!;
      }
    }

    return attachment;
  }

  async extractTags(content: string, options: AdvancedConversionOptions): Promise<TagData[]> {
    const tags: TagData[] = [];
    const tagRegex = /\[TAG:([^\]]+)\]/g;
    let match;

    while ((match = tagRegex.exec(content)) !== null) {
      const tagString = match[1]!;
      const tag = this.parseTag(tagString);
      if (tag) {
        tags.push(tag);
      }
    }

    return tags;
  }

  private parseTag(tagString: string): TagData | null {
    const parts = tagString.split(':');
    const name = parts[0]!;
    
    const tag: TagData = {
      name
    };

    // Parse additional metadata
    for (let i = 1; i < parts.length; i++) {
      const part = parts[i]!;
      if (part.startsWith('color=')) {
        tag.color = part.split('=')[1]!;
      } else if (part.startsWith('category=')) {
        tag.category = part.split('=')[1]!;
      }
    }

    return tag;
  }

  async extractPageMetadata(page: OneNotePage, options: AdvancedConversionOptions): Promise<Record<string, any>> {
    const metadata: Record<string, any> = {
      id: page.id,
      title: page.title,
      createdDate: page.createdDate,
      lastModifiedDate: page.lastModifiedDate
    };

    // Add custom metadata from page
    Object.assign(metadata, page.metadata);

    return metadata;
  }

  convertTablesToMarkdown(tables: TableData[], options: AdvancedConversionOptions): string {
    let markdown = '';

    for (const table of tables) {
      if (table.caption) {
        markdown += `## ${table.caption}\n\n`;
      }

      // Headers
      markdown += '| ' + table.headers.join(' | ') + ' |\n';
      markdown += '| ' + table.headers.map(() => '---').join(' | ') + ' |\n';

      // Rows
      for (const row of table.rows) {
        markdown += '| ' + row.join(' | ') + ' |\n';
      }

      markdown += '\n';
    }

    return markdown.trim();
  }

  convertCodeBlocks(content: string, options: AdvancedConversionOptions): string {
    // This is a simple implementation - in reality, we'd need more sophisticated parsing
    return content.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, language, code) => {
      const lang = language || '';
      return `\`\`\`${lang}\n${code}\`\`\``;
    });
  }

  private cleanProcessedContent(content: string, processed: { tables: TableData[]; attachments: AttachmentData[]; tags: TagData[] }): string {
    let cleaned = content;

    // Remove table markers (more sophisticated regex to avoid removing valid content)
    cleaned = cleaned.replace(/^\|(.+)\|$/gm, '');

    // Remove attachment markers
    cleaned = cleaned.replace(/\[ATTACHMENT:([^\]]+)\]/g, '[$1]');

    // Remove tag markers
    cleaned = cleaned.replace(/\[TAG:([^\]]+)\]/g, '');

    // Clean up extra whitespace
    cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n');
    cleaned = cleaned.replace(/^\s+|\s+$/gm, '');

    return cleaned.trim();
  }

  /**
   * Handle edge cases and complex content types
   */
  private handleEdgeCases(content: string, options: AdvancedConversionOptions): string {
    let processed = content;

    // Handle nested lists
    processed = this.processNestedLists(processed);

    // Handle complex tables with merged cells
    processed = this.processComplexTables(processed);

    // Handle special characters and encoding issues
    processed = this.normalizeSpecialCharacters(processed);

    return processed;
  }

  private processNestedLists(content: string): string {
    // Convert nested list markers to proper markdown
    return content.replace(/^(\s*)- (.+)$/gm, (match, indent, text) => {
      // Preserve the original indentation structure
      return match;
    });
  }

  private processComplexTables(content: string): string {
    // Handle tables with merged cells or complex formatting
    return content.replace(/\|(.+)\|/g, (match, row) => {
      // Split by | and clean up each cell
      const cells = row.split('|').map((cell: string) => cell.trim());
      return '| ' + cells.join(' | ') + ' |';
    });
  }

  private normalizeSpecialCharacters(content: string): string {
    // Handle common encoding issues and special characters
    return content
      .replace(/[\u201C\u201D]/g, '"') // Smart quotes
      .replace(/[\u2018\u2019]/g, "'") // Smart apostrophes
      .replace(/\u2014/g, '--') // Em dash
      .replace(/\u2013/g, '-') // En dash
      .replace(/\u2026/g, '...'); // Ellipsis
  }

  /**
   * Performance optimization for large files
   */
  private optimizeForPerformance(content: string, options: AdvancedConversionOptions): string {
    if (options.performanceMode === 'fast') {
      // Skip complex processing for speed
      return content;
    }

    if (options.performanceMode === 'thorough') {
      // Apply all optimizations
      return this.handleEdgeCases(content, options);
    }

    // Balanced mode - apply basic optimizations
    return this.normalizeSpecialCharacters(content);
  }

  private reportProgress(
    options: AdvancedConversionOptions,
    stage: AdvancedConversionProgress['stage'],
    percentage: number,
    message: string,
    progressReports?: AdvancedConversionProgress[]
  ): void {
    const progress: AdvancedConversionProgress = {
      stage,
      percentage,
      message
    };

    if (progressReports) {
      progressReports.push(progress);
    }

    if (options.onProgress) {
      options.onProgress(progress);
    }
  }
}
