/**
 * Main OneNote service
 * Orchestrates extraction, parsing, and display of OneNote files
 */

import { OneNoteHierarchy, OneNoteExtractionResult, OneNoteParsingOptions } from '../../types/onenote';
import { IOneNoteExtractionService, OneNoteExtractionService } from './extraction.service';
import { IOneNoteParserService, OneNoteParserService } from './parser.service';
import { IOneNoteDisplayService, OneNoteDisplayService } from './display.service';
import { IOneNoteErrorHandlerService, OneNoteErrorHandlerService } from './error-handler.service';

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

export class OneNoteService implements IOneNoteService {
  private extractionService: IOneNoteExtractionService;
  private parserService: IOneNoteParserService;
  private displayService: IOneNoteDisplayService;
  private errorHandlerService: IOneNoteErrorHandlerService;

  constructor(
    extractionService?: IOneNoteExtractionService,
    parserService?: IOneNoteParserService,
    displayService?: IOneNoteDisplayService,
    errorHandlerService?: IOneNoteErrorHandlerService
  ) {
    this.extractionService = extractionService || new OneNoteExtractionService();
    this.parserService = parserService || new OneNoteParserService();
    this.displayService = displayService || new OneNoteDisplayService();
    this.errorHandlerService = errorHandlerService || new OneNoteErrorHandlerService();
  }

  async processFiles(filePaths: string[], options?: OneNoteParsingOptions): Promise<OneNoteExtractionResult> {
    try {
      // Use extraction service to process files
      return await this.extractionService.extractMultiple(filePaths, options);
    } catch (error) {
      // Handle extraction errors with fallback
      if (error instanceof Error) {
        if (this.errorHandlerService.isRecoverableError(error)) {
          const result = await this.errorHandlerService.handleExtractionError(error, filePaths[0] || '');
          return result;
        } else {
          // For non-recoverable errors, try parsing error handler first, then extraction error handler
          if (error.message.includes('Parsing failed') || error.message.includes('parse')) {
            const result = await this.errorHandlerService.handleParsingError(error, filePaths[0] || '');
            return result;
          } else {
            const result = await this.errorHandlerService.handleExtractionError(error, filePaths[0] || '');
            return result;
          }
        }
      }
      
      // Handle unknown errors
      return {
        success: false,
        error: 'Unknown error occurred'
      };
    }
  }

  displayHierarchy(hierarchy: OneNoteHierarchy, options?: any): void {
    this.displayService.displayHierarchy(hierarchy, options);
  }

  async validateFiles(filePaths: string[]): Promise<boolean[]> {
    const results: boolean[] = [];
    
    for (const filePath of filePaths) {
      try {
        const fileInfo = await this.extractionService.validateOneNoteFile(filePath);
        results.push(fileInfo.isValid);
      } catch (error) {
        results.push(false);
      }
    }
    
    return results;
  }
}
