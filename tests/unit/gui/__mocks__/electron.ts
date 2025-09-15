// Mock Electron modules for testing
export const BrowserWindow = jest.fn().mockImplementation((options) => ({
  width: options.width,
  height: options.height,
  title: options.title,
  webPreferences: options.webPreferences,
  getBounds: () => ({ width: options.width, height: options.height }),
  getTitle: () => options.title,
  webContents: {
    getURL: jest.fn(),
    openDevTools: jest.fn(),
    send: jest.fn()
  },
  loadURL: jest.fn(),
  loadFile: jest.fn(),
  on: jest.fn(),
  once: jest.fn(),
  show: jest.fn()
}));

export const app = {
  whenReady: jest.fn().mockResolvedValue(undefined),
  on: jest.fn(),
  quit: jest.fn(),
  requestSingleInstanceLock: jest.fn().mockReturnValue(true)
};

export const dialog = {
  showOpenDialog: jest.fn().mockResolvedValue({
    canceled: false,
    filePaths: ['/path/to/file.onepkg']
  }),
  showSaveDialog: jest.fn().mockResolvedValue({
    canceled: false,
    filePath: '/path/to/output.json'
  })
};

export const ipcMain = {
  handle: jest.fn()
};

export const Menu = {
  buildFromTemplate: jest.fn().mockImplementation((template) => ({
    items: template.map((item: any) => ({
      label: item.label,
      submenu: item.submenu ? {
        items: item.submenu.map((subItem: any) => ({
          label: subItem.label,
          click: subItem.click
        }))
      } : undefined
    }))
  }))
};

export const MenuItemConstructorOptions = {};
export const OpenDialogReturnValue = {};
export const SaveDialogReturnValue = {};
