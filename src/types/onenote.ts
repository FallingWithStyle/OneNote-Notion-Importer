/**
 * OneNote file format types and interfaces
 */

export interface OneNotePage {
  id: string;
  title: string;
  content: string;
  createdDate: Date;
  lastModifiedDate: Date;
  metadata: Record<string, any>;
}

export interface OneNoteSection {
  id: string;
  name: string;
  pages: OneNotePage[];
  createdDate: Date;
  lastModifiedDate: Date;
  metadata: Record<string, any>;
}

export interface OneNoteNotebook {
  id: string;
  name: string;
  sections: OneNoteSection[];
  createdDate: Date;
  lastModifiedDate: Date;
  metadata: Record<string, any>;
}

export interface OneNoteHierarchy {
  notebooks: OneNoteNotebook[];
  totalNotebooks: number;
  totalSections: number;
  totalPages: number;
}

export interface OneNoteExtractionResult {
  success: boolean;
  hierarchy?: OneNoteHierarchy;
  error?: string;
  extractedFiles?: string[];
}

export interface OneNoteParsingOptions {
  includeMetadata?: boolean;
  extractImages?: boolean;
  preserveFormatting?: boolean;
  fallbackOnError?: boolean;
  maxFileSize?: number;
  timeout?: number;
}

export interface OneNoteDisplayOptions {
  showMetadata?: boolean;
  showContent?: boolean;
  maxDepth?: number;
  includeEmptySections?: boolean;
  sortBy?: 'name' | 'date' | 'size';
  outputFormat?: 'tree' | 'json' | 'table';
}

export interface OneNoteFileInfo {
  path: string;
  type: 'onepkg' | 'one';
  size: number;
  isValid: boolean;
  lastModified: Date;
  checksum?: string;
  encoding?: string;
}

export interface OneNoteProcessingResult {
  success: boolean;
  processedFiles: number;
  failedFiles: number;
  totalSize: number;
  processingTime: number;
  errors: string[];
}

export interface OneNoteValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  fileInfo: OneNoteFileInfo;
}
