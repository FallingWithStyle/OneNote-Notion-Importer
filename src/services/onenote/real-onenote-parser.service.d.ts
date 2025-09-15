/**
 * Real OneNote file parser service
 * Handles actual parsing of .one and .onepkg files
 */
import { OneNoteHierarchy, OneNoteSection, OneNoteParsingOptions } from '../../types/onenote';
export interface OneNoteFileHeader {
    magic: string;
    version: number;
    fileType: 'onepkg' | 'one';
    isValid: boolean;
}
export interface ParsedOneNoteContent {
    title: string;
    content: string;
    metadata: Record<string, any>;
    images: string[];
    attachments: string[];
}
export declare class RealOneNoteParserService {
    private static readonly ONENOTE_MAGIC;
    private static readonly ONEPKG_MAGIC;
    private static readonly HEADER_SIZE;
    /**
     * Parse a .one file to extract actual content
     */
    parseOneFile(filePath: string, options?: OneNoteParsingOptions): Promise<OneNoteSection>;
    /**
     * Parse a .onepkg file to extract multiple sections
     */
    parseOnepkgFile(filePath: string, options?: OneNoteParsingOptions): Promise<OneNoteHierarchy>;
    /**
     * Parse file header to determine type and validity
     */
    private parseFileHeader;
    /**
     * Parse OneNote content from file buffer
     */
    parseOneNoteContent(buffer: Buffer, options?: OneNoteParsingOptions): Promise<ParsedOneNoteContent>;
    /**
     * Extract text content from OneNote buffer
     */
    private extractTextContent;
    /**
     * Extract title from content
     */
    private extractTitleFromContent;
    /**
     * Extract image references from buffer
     */
    private extractImageReferences;
    /**
     * Extract attachment references from buffer
     */
    private extractAttachmentReferences;
    /**
     * Check if text is likely binary data
     */
    private isBinaryData;
    /**
     * Extract .one files from .onepkg package
     */
    private extractOnepkgContents;
    /**
     * Extract section name from file path or content
     */
    private extractSectionName;
    /**
     * Extract notebook name from file path
     */
    private extractNotebookName;
    /**
     * Create pages from parsed content, handling multiple pages
     */
    private createPagesFromContent;
    /**
     * Extract page title from content
     */
    private extractPageTitle;
    /**
     * Generate unique ID
     */
    private generateId;
}
//# sourceMappingURL=real-onenote-parser.service.d.ts.map