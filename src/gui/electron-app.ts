import { BrowserWindow, app, dialog, ipcMain, Menu, MenuItemConstructorOptions, OpenDialogReturnValue, SaveDialogReturnValue } from 'electron';
import path from 'path';
import { GuiImportService, ImportOptions, ImportProgress } from './services/gui-import.service';

export interface WindowOptions {
  width?: number;
  height?: number;
  title?: string;
}

export interface FileDialogResult {
  success: boolean;
  filePath?: string;
  error?: string;
}

export interface OneNoteProcessingResult {
  success: boolean;
  hierarchy?: any;
  error?: string;
}

export interface ConfigResult {
  success: boolean;
  value?: any;
  error?: string;
}

export interface ImportResult {
  success: boolean;
  totalPages: number;
  successCount: number;
  errorCount: number;
  errors: string[];
  message: string;
}

export class ElectronApp {
  private mainWindow: BrowserWindow | null = null;
  private importService: GuiImportService;

  constructor() {
    this.importService = new GuiImportService();
  }

  /**
   * Creates the main application window
   */
  createWindow(options: WindowOptions = {}): BrowserWindow {
    const { width = 1200, height = 800, title = 'OneNote to Notion Importer' } = options;

    this.mainWindow = new BrowserWindow({
      width,
      height,
      title,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js')
      },
      icon: path.join(__dirname, 'assets/icon.png'),
      show: false
    });

    // Show window when ready
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show();
    });

    return this.mainWindow;
  }

  /**
   * Loads the React application
   */
  loadReactApp(window: BrowserWindow, mode: 'development' | 'production'): void {
    if (mode === 'development') {
      window.loadURL('http://localhost:8020');
      window.webContents.openDevTools();
    } else {
      window.loadFile('dist/renderer/index.html');
    }
  }

  /**
   * Sets up the application menu
   */
  setupMenu(): Menu {
    const template: MenuItemConstructorOptions[] = [
      {
        label: 'File',
        submenu: [
          {
            label: 'Open OneNote File',
            accelerator: 'CmdOrCtrl+O',
            click: () => {
              this.mainWindow?.webContents.send('menu-open-file');
            }
          },
          {
            label: 'Export Settings',
            accelerator: 'CmdOrCtrl+E',
            click: () => {
              this.mainWindow?.webContents.send('menu-export-settings');
            }
          },
          { type: 'separator' },
          {
            label: 'Exit',
            accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
            click: () => {
              app.quit();
            }
          }
        ]
      },
      {
        label: 'Edit',
        submenu: [
          { label: 'Undo', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
          { label: 'Redo', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
          { type: 'separator' },
          { label: 'Cut', accelerator: 'CmdOrCtrl+X', role: 'cut' },
          { label: 'Copy', accelerator: 'CmdOrCtrl+C', role: 'copy' },
          { label: 'Paste', accelerator: 'CmdOrCtrl+V', role: 'paste' }
        ]
      },
      {
        label: 'Help',
        submenu: [
          {
            label: 'About',
            click: () => {
              this.mainWindow?.webContents.send('menu-about');
            }
          },
          {
            label: 'Documentation',
            click: () => {
              this.mainWindow?.webContents.send('menu-documentation');
            }
          }
        ]
      }
    ];

    return Menu.buildFromTemplate(template);
  }

  /**
   * Sets up IPC handlers
   */
  setupIPC(ipcMainInstance: typeof ipcMain): void {
    ipcMainInstance.handle('open-file-dialog', async () => {
      return await this.handleFileOpen(dialog);
    });

    ipcMainInstance.handle('save-file-dialog', async (_event: any, filename: string) => {
      return await this.handleFileSave(dialog, filename);
    });

    ipcMainInstance.handle('process-onenote-file', async (_event: any, filePath: string) => {
      return await this.handleOneNoteProcessing(filePath);
    });

    ipcMainInstance.handle('get-config', async (_event: any, key: string) => {
      const configService = (global as any).configService;
      return await this.handleConfigGet(key, configService);
    });

    ipcMainInstance.handle('set-config', async (_event: any, key: string, value: any) => {
      const configService = (global as any).configService;
      return await this.handleConfigSet(key, value, configService);
    });

    ipcMainInstance.handle('import-to-notion', async (_event: any, options: ImportOptions) => {
      return await this.handleImportToNotion(options);
    });
  }

  /**
   * Handles file open dialog
   */
  async handleFileOpen(dialogInstance: typeof dialog): Promise<FileDialogResult> {
    try {
      const result = await dialogInstance.showOpenDialog(this.mainWindow!, {
        title: 'Select OneNote File',
        filters: [
          { name: 'OneNote Files', extensions: ['onepkg', 'one'] },
          { name: 'All Files', extensions: ['*'] }
        ],
        properties: ['openFile']
      });

      // Handle different return types based on Electron version
      if (Array.isArray(result)) {
        if (result.length === 0) {
          return { success: false, error: 'No file selected' };
        }
        return { success: true, filePath: result[0] || '' };
      } else {
        const dialogResult = result as any;
        if (dialogResult.canceled) {
          return { success: false, error: 'No file selected' };
        }
        return { success: true, filePath: dialogResult.filePaths?.[0] || '' };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Handles file save dialog
   */
  async handleFileSave(dialogInstance: typeof dialog, filename: string): Promise<FileDialogResult> {
    try {
      const result = await dialogInstance.showSaveDialog(this.mainWindow!, {
        title: 'Save File',
        defaultPath: filename,
        filters: [
          { name: 'JSON Files', extensions: ['json'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });

      // Handle different return types based on Electron version
      if (typeof result === 'string') {
        if (result === '') {
          return { success: false, error: 'Save cancelled' };
        }
        return { success: true, filePath: result };
      } else {
        const dialogResult = result as any;
        if (dialogResult.canceled) {
          return { success: false, error: 'Save cancelled' };
        }
        return { success: true, filePath: dialogResult.filePath || '' };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Handles OneNote file processing
   */
  async handleOneNoteProcessing(filePath: string): Promise<OneNoteProcessingResult> {
    try {
      const result = await this.importService.processFile(filePath);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Handles import to Notion
   */
  async handleImportToNotion(options: ImportOptions): Promise<ImportResult> {
    try {
      const result = await this.importService.importToNotion(options);
      return result;
    } catch (error) {
      return {
        success: false,
        totalPages: 0,
        successCount: 0,
        errorCount: 1,
        errors: [error instanceof Error ? error.message : String(error)],
        message: `Import failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Handles configuration get operation
   */
  async handleConfigGet(key: string, configService: any): Promise<ConfigResult> {
    try {
      const value = await configService.get(key);
      return { success: true, value };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Handles configuration set operation
   */
  async handleConfigSet(key: string, value: any, configService: any): Promise<ConfigResult> {
    try {
      await configService.set(key, value);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Initializes the Electron application
   */
  initialize(electronApp: typeof app): void {
    electronApp.whenReady().then(() => {
      this.createWindow();
      this.setupMenu();
      this.setupIPC(ipcMain);
    });

    electronApp.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        electronApp.quit();
      }
    });

    electronApp.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createWindow();
      }
    });
  }

  /**
   * Gets the main window instance
   */
  getMainWindow(): BrowserWindow | null {
    return this.mainWindow;
  }

  /**
   * Closes the application
   */
  quit(): void {
    app.quit();
  }
}
