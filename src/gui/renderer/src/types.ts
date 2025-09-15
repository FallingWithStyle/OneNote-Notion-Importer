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
      openFileDialog: () => Promise<any>;
      saveFileDialog: (filename: string) => Promise<any>;
      processOneNoteFile: (filePath: string) => Promise<any>;
      getConfig: (key: string) => Promise<any>;
      setConfig: (key: string, value: any) => Promise<any>;
      importToNotion: (options: any) => Promise<any>;
      onMenuOpenFile: (callback: () => void) => void;
      onMenuExportSettings: (callback: () => void) => void;
      onMenuAbout: (callback: () => void) => void;
      onMenuDocumentation: (callback: () => void) => void;
      removeAllListeners: (channel: string) => void;
    };
  }
}
