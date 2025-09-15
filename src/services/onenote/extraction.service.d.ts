/**
 * OneNote file extraction service
 * Handles extraction of .onepkg and .one files
 */
import { OneNoteExtractionResult, OneNoteFileInfo, OneNoteParsingOptions } from '../../types/onenote';
export interface IOneNoteExtractionService {
    /**
     * Extract content from a .onepkg file (notebook package)
     * @param filePath Path to the .onepkg file
     * @param options Parsing options
     * @returns Extraction result with hierarchy
     */
    extractFromOnepkg(filePath: string, options?: OneNoteParsingOptions): Promise<OneNoteExtractionResult>;
    /**
     * Extract content from a .one file (section file)
     * @param filePath Path to the .one file
     * @param options Parsing options
     * @returns Extraction result with hierarchy
     */
    extractFromOne(filePath: string, options?: OneNoteParsingOptions): Promise<OneNoteExtractionResult>;
    /**
     * Validate if a file is a valid OneNote file
     * @param filePath Path to the file
     * @returns File information and validation result
     */
    validateOneNoteFile(filePath: string): Promise<OneNoteFileInfo>;
    /**
     * Extract multiple OneNote files (mixed .onepkg and .one)
     * @param filePaths Array of file paths
     * @param options Parsing options
     * @returns Combined extraction result
     */
    extractMultiple(filePaths: string[], options?: OneNoteParsingOptions): Promise<OneNoteExtractionResult>;
}
export declare class OneNoteExtractionService implements IOneNoteExtractionService {
    private realParser;
    constructor();
    extractFromOnepkg(filePath: string, options?: OneNoteParsingOptions): Promise<OneNoteExtractionResult>;
    extractFromOne(filePath: string, options?: OneNoteParsingOptions): Promise<OneNoteExtractionResult>;
    validateOneNoteFile(filePath: string): Promise<OneNoteFileInfo>;
    extractMultiple(filePaths: string[], options?: OneNoteParsingOptions): Promise<OneNoteExtractionResult>;
    private extractNotebookName;
    private generateId;
}
//# sourceMappingURL=extraction.service.d.ts.map