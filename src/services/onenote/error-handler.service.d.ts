/**
 * OneNote error handling service
 * Handles errors and provides fallback mechanisms
 */
import { OneNoteExtractionResult } from '../../types/onenote';
export interface IOneNoteErrorHandlerService {
    /**
     * Handle extraction errors with fallback mechanisms
     * @param error The error that occurred
     * @param filePath Path to the file that caused the error
     * @returns Result with fallback data if available
     */
    handleExtractionError(error: Error, filePath: string): Promise<OneNoteExtractionResult>;
    /**
     * Handle parsing errors with fallback mechanisms
     * @param error The error that occurred
     * @param filePath Path to the file that caused the error
     * @returns Basic content extraction result
     */
    handleParsingError(error: Error, filePath: string): Promise<OneNoteExtractionResult>;
    /**
     * Validate if an error is recoverable
     * @param error The error to check
     * @returns True if the error can be recovered from
     */
    isRecoverableError(error: Error): boolean;
    /**
     * Get fallback content for corrupted files
     * @param filePath Path to the corrupted file
     * @returns Basic content that could be extracted
     */
    getFallbackContent(filePath: string): Promise<string>;
}
export declare class OneNoteErrorHandlerService implements IOneNoteErrorHandlerService {
    handleExtractionError(error: Error, filePath: string): Promise<OneNoteExtractionResult>;
    handleParsingError(error: Error, filePath: string): Promise<OneNoteExtractionResult>;
    isRecoverableError(error: Error): boolean;
    getFallbackContent(filePath: string): Promise<string>;
}
//# sourceMappingURL=error-handler.service.d.ts.map