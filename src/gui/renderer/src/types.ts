export interface OneNoteNotebook {
  id: string;
  name: string;
  sections: OneNoteSection[];
}

export interface OneNoteSection {
  id: string;
  name: string;
  pages: OneNotePage[];
}

export interface OneNotePage {
  id: string;
  title: string;
  content?: string;
  lastModified?: Date;
  created?: Date;
}

export interface OneNoteHierarchy {
  notebooks: OneNoteNotebook[];
  totalNotebooks: number;
  totalSections: number;
  totalPages: number;
}

export type ProcessingStatus = 'idle' | 'processing' | 'completed' | 'error' | 'importing';

export interface LogEntry {
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
  timestamp: Date;
}

export interface Configuration {
  notion: {
    workspaceId?: string;
    apiKey?: string;
  };
  export: {
    format?: 'markdown' | 'docx';
    outputPath?: string;
  };
}

// Electron API interface is defined in preload.ts
