import { ElectronApp } from '../../../src/gui/electron-app';

describe('ElectronApp', () => {
  let electronApp: ElectronApp;

  beforeEach(() => {
    electronApp = new ElectronApp();
  });

  describe('createWindow', () => {
    it('should create main application window', () => {
      const window = electronApp.createWindow();

      expect(window).toBeDefined();
      expect(window.getBounds().width).toBe(1200);
      expect(window.getBounds().height).toBe(800);
      expect(window.webContents.getURL).toBeDefined();
    });

    it('should create window with custom dimensions', () => {
      const window = electronApp.createWindow({ width: 1600, height: 1000 });

      expect(window.getBounds().width).toBe(1600);
      expect(window.getBounds().height).toBe(1000);
    });

    it('should set window title', () => {
      const window = electronApp.createWindow();

      expect(window.getTitle()).toBe('OneNote to Notion Importer');
    });
  });

  describe('loadReactApp', () => {
    it('should load React application in development mode', () => {
      const mockWindow = {
        loadURL: jest.fn(),
        webContents: {
          openDevTools: jest.fn()
        }
      };

      electronApp.loadReactApp(mockWindow as any, 'development');

      expect(mockWindow.loadURL).toHaveBeenCalledWith('http://localhost:8020');
      expect(mockWindow.webContents.openDevTools).toHaveBeenCalled();
    });

    it('should load React application in production mode', () => {
      const mockWindow = {
        loadFile: jest.fn()
      };

      electronApp.loadReactApp(mockWindow as any, 'production');

      expect(mockWindow.loadFile).toHaveBeenCalledWith('dist/renderer/index.html');
    });
  });

  describe('setupMenu', () => {
    it('should create application menu', () => {
      const menu = electronApp.setupMenu();

      expect(menu).toBeDefined();
      expect(menu.items).toHaveLength(3); // File, Edit, Help
      expect(menu.items[0]?.label).toBe('File');
      expect(menu.items[1]?.label).toBe('Edit');
      expect(menu.items[2]?.label).toBe('Help');
    });

    it('should include file operations in menu', () => {
      const menu = electronApp.setupMenu();
      const fileMenu = menu.items[0];

      expect(fileMenu?.submenu).toBeDefined();
      expect(fileMenu?.submenu?.items.some((item: any) => item.label === 'Open OneNote File')).toBe(true);
      expect(fileMenu?.submenu?.items.some((item: any) => item.label === 'Export Settings')).toBe(true);
      expect(fileMenu?.submenu?.items.some((item: any) => item.label === 'Exit')).toBe(true);
    });
  });

  describe('setupIPC', () => {
    it('should setup IPC handlers for file operations', () => {
      const mockIpcMain = {
        handle: jest.fn()
      };

      electronApp.setupIPC(mockIpcMain as any);

      expect(mockIpcMain.handle).toHaveBeenCalledTimes(5);
      expect(mockIpcMain.handle).toHaveBeenCalledWith('open-file-dialog', expect.any(Function));
      expect(mockIpcMain.handle).toHaveBeenCalledWith('save-file-dialog', expect.any(Function));
      expect(mockIpcMain.handle).toHaveBeenCalledWith('process-onenote-file', expect.any(Function));
      expect(mockIpcMain.handle).toHaveBeenCalledWith('get-config', expect.any(Function));
      expect(mockIpcMain.handle).toHaveBeenCalledWith('set-config', expect.any(Function));
    });
  });

  describe('handleFileOpen', () => {
    it('should open file dialog and return selected file', async () => {
      const mockDialog = {
        showOpenDialog: jest.fn().mockResolvedValue({
          canceled: false,
          filePaths: ['/path/to/file.onepkg']
        })
      };

      const result = await electronApp.handleFileOpen(mockDialog as any);

      expect(result.success).toBe(true);
      expect(result.filePath).toBe('/path/to/file.onepkg');
    });

    it('should handle dialog cancellation', async () => {
      const mockDialog = {
        showOpenDialog: jest.fn().mockResolvedValue({
          canceled: true,
          filePaths: []
        })
      };

      const result = await electronApp.handleFileOpen(mockDialog as any);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No file selected');
    });
  });

  describe('handleFileSave', () => {
    it('should open save dialog and return selected path', async () => {
      const mockDialog = {
        showSaveDialog: jest.fn().mockResolvedValue({
          canceled: false,
          filePath: '/path/to/output.json'
        })
      };

      const result = await electronApp.handleFileSave(mockDialog as any, 'output.json');

      expect(result.success).toBe(true);
      expect(result.filePath).toBe('/path/to/output.json');
    });

    it('should handle save dialog cancellation', async () => {
      const mockDialog = {
        showSaveDialog: jest.fn().mockResolvedValue({
          canceled: true
        })
      };

      const result = await electronApp.handleFileSave(mockDialog as any, 'output.json');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Save cancelled');
    });
  });

  describe('handleOneNoteProcessing', () => {
    it('should process OneNote file and return hierarchy', async () => {
      const mockFileProcessor = {
        processFile: jest.fn().mockResolvedValue({
          success: true,
          hierarchy: {
            notebooks: [],
            totalNotebooks: 0,
            totalSections: 0,
            totalPages: 0
          }
        })
      };

      const result = await electronApp.handleOneNoteProcessing('/path/to/file.onepkg', mockFileProcessor as any);

      expect(result.success).toBe(true);
      expect(result.hierarchy).toBeDefined();
      expect(mockFileProcessor.processFile).toHaveBeenCalledWith('/path/to/file.onepkg');
    });

    it('should handle processing errors', async () => {
      const mockFileProcessor = {
        processFile: jest.fn().mockRejectedValue(new Error('Processing failed'))
      };

      const result = await electronApp.handleOneNoteProcessing('/path/to/file.onepkg', mockFileProcessor as any);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Processing failed');
    });
  });

  describe('handleConfigGet', () => {
    it('should get configuration value', async () => {
      const mockConfigService = {
        get: jest.fn().mockResolvedValue('workspace-123')
      };

      const result = await electronApp.handleConfigGet('notion.workspaceId', mockConfigService as any);

      expect(result.success).toBe(true);
      expect(result.value).toBe('workspace-123');
      expect(mockConfigService.get).toHaveBeenCalledWith('notion.workspaceId');
    });
  });

  describe('handleConfigSet', () => {
    it('should set configuration value', async () => {
      const mockConfigService = {
        set: jest.fn().mockResolvedValue(true)
      };

      const result = await electronApp.handleConfigSet('notion.workspaceId', 'workspace-456', mockConfigService as any);

      expect(result.success).toBe(true);
      expect(mockConfigService.set).toHaveBeenCalledWith('notion.workspaceId', 'workspace-456');
    });
  });

  describe('initialize', () => {
    it('should initialize Electron application', () => {
      const mockApp = {
        whenReady: jest.fn().mockResolvedValue(undefined),
        on: jest.fn(),
        quit: jest.fn()
      };

      electronApp.initialize(mockApp as any);

      expect(mockApp.whenReady).toHaveBeenCalled();
      expect(mockApp.on).toHaveBeenCalledWith('window-all-closed', expect.any(Function));
      expect(mockApp.on).toHaveBeenCalledWith('activate', expect.any(Function));
    });
  });
});
