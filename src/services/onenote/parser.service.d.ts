/**
 * OneNote file parser service
 * Handles parsing of .one files to extract notebooks, sections, and pages
 */
import { OneNoteHierarchy, OneNoteSection, OneNotePage, OneNoteParsingOptions } from '../../types/onenote';
export interface IOneNoteParserService {
    /**
     * Parse a .one file to extract section and page information
     * @param filePath Path to the .one file
     * @param options Parsing options
     * @returns Parsed section with pages
     */
    parseOneFile(filePath: string, options?: OneNoteParsingOptions): Promise<OneNoteSection>;
    /**
     * Parse multiple .one files to build a complete hierarchy
     * @param filePaths Array of .one file paths
     * @param options Parsing options
     * @returns Complete hierarchy with notebooks, sections, and pages
     */
    parseMultipleOneFiles(filePaths: string[], options?: OneNoteParsingOptions): Promise<OneNoteHierarchy>;
    /**
     * Parse raw OneNote content data
     * @param content Raw content data
     * @param options Parsing options
     * @returns Parsed page content
     */
    parsePageContent(content: Buffer, options?: OneNoteParsingOptions): Promise<OneNotePage>;
    /**
     * Extract metadata from OneNote file
     * @param filePath Path to the .one file
     * @returns Extracted metadata
     */
    extractMetadata(filePath: string): Promise<Record<string, any>>;
}
export declare class OneNoteParserService implements IOneNoteParserService {
    private realParser;
    constructor();
    parseOneFile(filePath: string, options?: OneNoteParsingOptions): Promise<OneNoteSection>;
    parseMultipleOneFiles(filePaths: string[], options?: OneNoteParsingOptions): Promise<OneNoteHierarchy>;
    parsePageContent(content: Buffer, options?: OneNoteParsingOptions): Promise<OneNotePage>;
    extractMetadata(filePath: string): Promise<Record<string, any>>;
    private generateId;
}
//# sourceMappingURL=parser.service.d.ts.map