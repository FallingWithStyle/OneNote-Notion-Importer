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

// Electron API interface
declare global {
  interface Window {
    electronAPI: {
      openFileDialog: () => Promise<{ success: boolean; filePath?: string; error?: string }>;
      saveFileDialog: (filename: string) => Promise<{ success: boolean; filePath?: string; error?: string }>;
      processOneNoteFile: (filePath: string) => Promise<{ success: boolean; hierarchy?: OneNoteHierarchy; error?: string }>;
      getConfig: (key: string) => Promise<{ success: boolean; value?: any; error?: string }>;
      setConfig: (key: string, value: any) => Promise<{ success: boolean; error?: string }>;
    };
  }
}
