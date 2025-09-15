/**
 * Centralized error handling utilities for OneNote services
 * Provides consistent error handling patterns and error classification
 */
import { OneNoteExtractionResult } from '../../types/onenote';
export interface OneNoteErrorContext {
    filePath?: string;
    operation?: string;
    recoverable?: boolean;
}
export declare class OneNoteError extends Error {
    readonly code: string;
    readonly context: OneNoteErrorContext;
    readonly recoverable: boolean;
    constructor(message: string, code: string, context?: OneNoteErrorContext);
}
export declare class OneNoteErrorUtils {
    /**
     * Check if an error is recoverable based on its type and message
     */
    static isRecoverableError(error: Error): boolean;
    /**
     * Create a standardized error response
     */
    static createErrorResponse(error: Error, context?: OneNoteErrorContext): OneNoteExtractionResult;
    /**
     * Create a parsing error response with fallback
     */
    static createParsingErrorResponse(error: Error, context?: OneNoteErrorContext): OneNoteExtractionResult;
    /**
     * Classify error type for better handling
     */
    static classifyError(error: Error): {
        type: 'file' | 'parsing' | 'permission' | 'memory' | 'network' | 'unknown';
        recoverable: boolean;
    };
    /**
     * Create a user-friendly error message
     */
    static createUserFriendlyMessage(error: Error): string;
    /**
     * Wrap an error with additional context
     */
    static wrapError(error: Error, context: OneNoteErrorContext): OneNoteError;
}
//# sourceMappingURL=error-utils.d.ts.map