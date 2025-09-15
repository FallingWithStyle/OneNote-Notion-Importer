/**
 * Main OneNote service
 * Orchestrates extraction, parsing, and display of OneNote files
 */
import { OneNoteHierarchy, OneNoteExtractionResult, OneNoteParsingOptions } from '../../types/onenote';
import { IOneNoteExtractionService } from './extraction.service';
import { IOneNoteParserService } from './parser.service';
import { IOneNoteDisplayService } from './display.service';
import { IOneNoteErrorHandlerService } from './error-handler.service';
export interface IOneNoteService {
    /**
     * Process OneNote files and return hierarchy
     * @param filePaths Array of OneNote file paths
     * @param options Processing options
     * @returns Complete hierarchy or error result
     */
    processFiles(filePaths: string[], options?: OneNoteParsingOptions): Promise<OneNoteExtractionResult>;
    /**
     * Display OneNote hierarchy in CLI
     * @param hierarchy The hierarchy to display
     * @param options Display options
     */
    displayHierarchy(hierarchy: OneNoteHierarchy, options?: any): void;
    /**
     * Validate OneNote files before processing
     * @param filePaths Array of file paths to validate
     * @returns Array of validation results
     */
    validateFiles(filePaths: string[]): Promise<boolean[]>;
}
export declare class OneNoteService implements IOneNoteService {
    private extractionService;
    private parserService;
    private displayService;
    private errorHandlerService;
    constructor(extractionService?: IOneNoteExtractionService, parserService?: IOneNoteParserService, displayService?: IOneNoteDisplayService, errorHandlerService?: IOneNoteErrorHandlerService);
    processFiles(filePaths: string[], options?: OneNoteParsingOptions): Promise<OneNoteExtractionResult>;
    displayHierarchy(hierarchy: OneNoteHierarchy, options?: any): void;
    validateFiles(filePaths: string[]): Promise<boolean[]>;
}
//# sourceMappingURL=onenote.service.d.ts.map