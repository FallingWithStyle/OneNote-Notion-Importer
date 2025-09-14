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
  includeMetadata: boolean;
  extractImages: boolean;
  preserveFormatting: boolean;
  fallbackOnError: boolean;
}

export interface OneNoteFileInfo {
  path: string;
  type: 'onepkg' | 'one';
  size: number;
  isValid: boolean;
  lastModified: Date;
}
