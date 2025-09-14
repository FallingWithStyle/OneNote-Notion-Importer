/**
 * Tests for OneNote error utilities
 * Following TDD Red-Green-Refactor cycle
 */

import { OneNoteErrorUtils, OneNoteError } from '../../../../src/services/onenote/error-utils';
import { OneNoteExtractionResult } from '../../../../src/types/onenote';

describe('OneNoteErrorUtils', () => {
  describe('isRecoverableError', () => {
    it('should return true for recoverable errors', () => {
      const error = new Error('Invalid file format');
      expect(OneNoteErrorUtils.isRecoverableError(error)).toBe(true);
    });

    it('should return true for corrupted data errors', () => {
      const error = new Error('Corrupted data detected');
      expect(OneNoteErrorUtils.isRecoverableError(error)).toBe(true);
    });

    it('should return false for file not found errors', () => {
      const error = new Error('File not found');
      expect(OneNoteErrorUtils.isRecoverableError(error)).toBe(false);
    });

    it('should return false for permission denied errors', () => {
      const error = new Error('Permission denied');
      expect(OneNoteErrorUtils.isRecoverableError(error)).toBe(false);
    });

    it('should return false for memory errors', () => {
      const error = new Error('Out of memory');
      expect(OneNoteErrorUtils.isRecoverableError(error)).toBe(false);
    });

    it('should return true for OneNoteError with recoverable flag', () => {
      const error = new OneNoteError('Test error', 'TEST_ERROR', { recoverable: true });
      expect(OneNoteErrorUtils.isRecoverableError(error)).toBe(true);
    });

    it('should return false for OneNoteError with non-recoverable flag', () => {
      const error = new OneNoteError('Test error', 'TEST_ERROR', { recoverable: false });
      expect(OneNoteErrorUtils.isRecoverableError(error)).toBe(false);
    });
  });

  describe('createErrorResponse', () => {
    it('should create success response for recoverable errors', () => {
      const error = new Error('Invalid file format');
      const result = OneNoteErrorUtils.createErrorResponse(error);
      
      expect(result.success).toBe(true);
      expect(result.hierarchy).toBeDefined();
    });

    it('should create failure response for non-recoverable errors', () => {
      const error = new Error('File not found');
      const result = OneNoteErrorUtils.createErrorResponse(error);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('File not found');
    });

    it('should include context in error response', () => {
      const error = new Error('Test error');
      const context = { filePath: '/test/path', operation: 'test' };
      const result = OneNoteErrorUtils.createErrorResponse(error, context);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Test error');
    });
  });

  describe('createParsingErrorResponse', () => {
    it('should create success response for parsing errors', () => {
      const error = new Error('Failed to parse content');
      const result = OneNoteErrorUtils.createParsingErrorResponse(error);
      
      expect(result.success).toBe(true);
      expect(result.hierarchy).toBeDefined();
    });

    it('should create success response for encoding errors', () => {
      const error = new Error('Invalid character encoding');
      const result = OneNoteErrorUtils.createParsingErrorResponse(error);
      
      expect(result.success).toBe(true);
      expect(result.hierarchy).toBeDefined();
    });

    it('should create failure response for non-parsing errors', () => {
      const error = new Error('File not found');
      const result = OneNoteErrorUtils.createParsingErrorResponse(error);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('File not found');
    });
  });

  describe('classifyError', () => {
    it('should classify file errors correctly', () => {
      const error = new Error('File not found');
      const classification = OneNoteErrorUtils.classifyError(error);
      
      expect(classification.type).toBe('file');
      expect(classification.recoverable).toBe(false);
    });

    it('should classify permission errors correctly', () => {
      const error = new Error('Permission denied');
      const classification = OneNoteErrorUtils.classifyError(error);
      
      expect(classification.type).toBe('permission');
      expect(classification.recoverable).toBe(false);
    });

    it('should classify memory errors correctly', () => {
      const error = new Error('Out of memory');
      const classification = OneNoteErrorUtils.classifyError(error);
      
      expect(classification.type).toBe('memory');
      expect(classification.recoverable).toBe(false);
    });

    it('should classify network errors correctly', () => {
      const error = new Error('Network timeout');
      const classification = OneNoteErrorUtils.classifyError(error);
      
      expect(classification.type).toBe('network');
      expect(classification.recoverable).toBe(false);
    });

    it('should classify parsing errors correctly', () => {
      const error = new Error('Failed to parse format');
      const classification = OneNoteErrorUtils.classifyError(error);
      
      expect(classification.type).toBe('parsing');
      expect(classification.recoverable).toBe(true);
    });

    it('should classify unknown errors correctly', () => {
      const error = new Error('Unknown error');
      const classification = OneNoteErrorUtils.classifyError(error);
      
      expect(classification.type).toBe('unknown');
      expect(classification.recoverable).toBe(false);
    });
  });

  describe('createUserFriendlyMessage', () => {
    it('should create user-friendly message for file errors', () => {
      const error = new Error('File not found');
      const message = OneNoteErrorUtils.createUserFriendlyMessage(error);
      
      expect(message).toBe('File not found. Please check the file path and try again.');
    });

    it('should create user-friendly message for permission errors', () => {
      const error = new Error('Permission denied');
      const message = OneNoteErrorUtils.createUserFriendlyMessage(error);
      
      expect(message).toBe('Permission denied. Please check file permissions and try again.');
    });

    it('should create user-friendly message for memory errors', () => {
      const error = new Error('Out of memory');
      const message = OneNoteErrorUtils.createUserFriendlyMessage(error);
      
      expect(message).toBe('Insufficient memory. Please try with smaller files or free up memory.');
    });

    it('should create user-friendly message for network errors', () => {
      const error = new Error('Network timeout');
      const message = OneNoteErrorUtils.createUserFriendlyMessage(error);
      
      expect(message).toBe('Network error. Please check your connection and try again.');
    });

    it('should create user-friendly message for parsing errors', () => {
      const error = new Error('Failed to parse format');
      const message = OneNoteErrorUtils.createUserFriendlyMessage(error);
      
      expect(message).toBe('File format error. The file may be corrupted or in an unsupported format.');
    });

    it('should create user-friendly message for unknown errors', () => {
      const error = new Error('Unknown error occurred');
      const message = OneNoteErrorUtils.createUserFriendlyMessage(error);
      
      expect(message).toBe('An error occurred: Unknown error occurred');
    });
  });

  describe('wrapError', () => {
    it('should wrap regular error with context', () => {
      const error = new Error('Test error');
      const context = { filePath: '/test/path', operation: 'test' };
      const wrappedError = OneNoteErrorUtils.wrapError(error, context);
      
      expect(wrappedError).toBeInstanceOf(OneNoteError);
      expect(wrappedError.message).toBe('Test error');
      expect(wrappedError.code).toBe('UNKNOWN_ERROR');
      expect(wrappedError.context.filePath).toBe('/test/path');
      expect(wrappedError.context.operation).toBe('test');
    });

    it('should preserve existing OneNoteError context', () => {
      const originalError = new OneNoteError('Original error', 'ORIGINAL_ERROR', { 
        filePath: '/original/path' 
      });
      const context = { operation: 'test' };
      const wrappedError = OneNoteErrorUtils.wrapError(originalError, context);
      
      expect(wrappedError).toBeInstanceOf(OneNoteError);
      expect(wrappedError.message).toBe('Original error');
      expect(wrappedError.code).toBe('ORIGINAL_ERROR');
      expect(wrappedError.context.filePath).toBe('/original/path');
      expect(wrappedError.context.operation).toBe('test');
    });
  });
});

describe('OneNoteError', () => {
  it('should create error with required properties', () => {
    const error = new OneNoteError('Test error', 'TEST_ERROR');
    
    expect(error.message).toBe('Test error');
    expect(error.name).toBe('OneNoteError');
    expect(error.code).toBe('TEST_ERROR');
    expect(error.context).toEqual({});
    expect(error.recoverable).toBe(false);
  });

  it('should create error with context', () => {
    const context = { filePath: '/test/path', operation: 'test', recoverable: true };
    const error = new OneNoteError('Test error', 'TEST_ERROR', context);
    
    expect(error.context).toEqual(context);
    expect(error.recoverable).toBe(true);
  });

  it('should be instanceof Error', () => {
    const error = new OneNoteError('Test error', 'TEST_ERROR');
    expect(error).toBeInstanceOf(Error);
  });
});
