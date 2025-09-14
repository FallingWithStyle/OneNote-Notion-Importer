/**
 * Centralized error handling utilities for OneNote services
 * Provides consistent error handling patterns and error classification
 */

import { OneNoteExtractionResult } from '../../types/onenote';
import { OneNoteMockDataFactory } from './mock-data.factory';

export interface OneNoteErrorContext {
  filePath?: string;
  operation?: string;
  recoverable?: boolean;
}

export class OneNoteError extends Error {
  public readonly code: string;
  public readonly context: OneNoteErrorContext;
  public readonly recoverable: boolean;

  constructor(message: string, code: string, context: OneNoteErrorContext = {}) {
    super(message);
    this.name = 'OneNoteError';
    this.code = code;
    this.context = context;
    this.recoverable = context.recoverable ?? false;
  }
}

export class OneNoteErrorUtils {
  /**
   * Check if an error is recoverable based on its type and message
   */
  static isRecoverableError(error: Error): boolean {
    if (error instanceof OneNoteError) {
      return error.recoverable;
    }

    const errorMessage = error.message.toLowerCase();
    
    // Non-recoverable error patterns
    const nonRecoverablePatterns = [
      'file not found',
      'permission denied',
      'out of memory',
      'disk full',
      'network error',
      'access denied'
    ];

    if (nonRecoverablePatterns.some(pattern => errorMessage.includes(pattern))) {
      return false;
    }

    // Recoverable error patterns
    const recoverablePatterns = [
      'invalid file format',
      'corrupted data',
      'unsupported version',
      'missing metadata',
      'parsing failed',
      'encoding error'
    ];

    return recoverablePatterns.some(pattern => errorMessage.includes(pattern));
  }

  /**
   * Create a standardized error response
   */
  static createErrorResponse(error: Error, context: OneNoteErrorContext = {}): OneNoteExtractionResult {
    const errorMessage = error.message;
    const isRecoverable = this.isRecoverableError(error);

    if (isRecoverable) {
      return {
        success: true,
        hierarchy: OneNoteMockDataFactory.createFallbackHierarchy('extraction')
      };
    }

    return {
      success: false,
      error: errorMessage
    };
  }

  /**
   * Create a parsing error response with fallback
   */
  static createParsingErrorResponse(error: Error, context: OneNoteErrorContext = {}): OneNoteExtractionResult {
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('failed to parse') || errorMessage.includes('invalid character encoding')) {
      return {
        success: true,
        hierarchy: OneNoteMockDataFactory.createFallbackHierarchy('parsing')
      };
    }

    return this.createErrorResponse(error, context);
  }

  /**
   * Classify error type for better handling
   */
  static classifyError(error: Error): {
    type: 'file' | 'parsing' | 'permission' | 'memory' | 'network' | 'unknown';
    recoverable: boolean;
  } {
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('file not found') || errorMessage.includes('no such file')) {
      return { type: 'file', recoverable: false };
    }
    
    if (errorMessage.includes('permission denied') || errorMessage.includes('access denied')) {
      return { type: 'permission', recoverable: false };
    }
    
    if (errorMessage.includes('out of memory') || errorMessage.includes('memory')) {
      return { type: 'memory', recoverable: false };
    }
    
    if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
      return { type: 'network', recoverable: false };
    }
    
    if (errorMessage.includes('parse') || errorMessage.includes('format') || errorMessage.includes('corrupted')) {
      return { type: 'parsing', recoverable: true };
    }
    
    return { type: 'unknown', recoverable: this.isRecoverableError(error) };
  }

  /**
   * Create a user-friendly error message
   */
  static createUserFriendlyMessage(error: Error): string {
    const classification = this.classifyError(error);
    
    switch (classification.type) {
      case 'file':
        return 'File not found. Please check the file path and try again.';
      case 'permission':
        return 'Permission denied. Please check file permissions and try again.';
      case 'memory':
        return 'Insufficient memory. Please try with smaller files or free up memory.';
      case 'network':
        return 'Network error. Please check your connection and try again.';
      case 'parsing':
        return 'File format error. The file may be corrupted or in an unsupported format.';
      default:
        return `An error occurred: ${error.message}`;
    }
  }

  /**
   * Wrap an error with additional context
   */
  static wrapError(error: Error, context: OneNoteErrorContext): OneNoteError {
    if (error instanceof OneNoteError) {
      return new OneNoteError(
        error.message,
        error.code,
        { ...error.context, ...context }
      );
    }

    return new OneNoteError(
      error.message,
      'UNKNOWN_ERROR',
      context
    );
  }
}
