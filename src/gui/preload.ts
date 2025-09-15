import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // File operations
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  saveFileDialog: (filename: string) => ipcRenderer.invoke('save-file-dialog', filename),
  processOneNoteFile: (filePath: string) => ipcRenderer.invoke('process-onenote-file', filePath),

  // Configuration operations
  getConfig: (key: string) => ipcRenderer.invoke('get-config', key),
  setConfig: (key: string, value: any) => ipcRenderer.invoke('set-config', key, value),

  // Import operations
  importToNotion: (options: any) => ipcRenderer.invoke('import-to-notion', options),

  // Menu events
  onMenuOpenFile: (callback: () => void) => ipcRenderer.on('menu-open-file', callback),
  onMenuExportSettings: (callback: () => void) => ipcRenderer.on('menu-export-settings', callback),
  onMenuAbout: (callback: () => void) => ipcRenderer.on('menu-about', callback),
  onMenuDocumentation: (callback: () => void) => ipcRenderer.on('menu-documentation', callback),

  // Remove listeners
  removeAllListeners: (channel: string) => ipcRenderer.removeAllListeners(channel)
});

// Type definitions for the exposed API
declare global {
  interface Window {
    electronAPI: {
      openFileDialog: () => Promise<any>;
      saveFileDialog: (filename: string) => Promise<any>;
      processOneNoteFile: (filePath: string) => Promise<any>;
      getConfig: (key: string) => Promise<any>;
      setConfig: (key: string, value: any) => Promise<any>;
      onMenuOpenFile: (callback: () => void) => void;
      onMenuExportSettings: (callback: () => void) => void;
      onMenuAbout: (callback: () => void) => void;
      onMenuDocumentation: (callback: () => void) => void;
      removeAllListeners: (channel: string) => void;
    };
  }
}
