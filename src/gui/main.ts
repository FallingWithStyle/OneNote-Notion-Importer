import { app } from 'electron';
import { ElectronApp } from './electron-app';
import { ConfigService } from '../services/config.service';
import { OneNoteService } from '../services/onenote/onenote.service';

// Initialize services
const configService = new ConfigService();
const oneNoteService = new OneNoteService();

// Make services available globally for IPC handlers
(global as any).configService = configService;
(global as any).fileProcessor = oneNoteService;

// Initialize Electron app
const electronApp = new ElectronApp();
electronApp.initialize(app);

// Handle app events
app.on('before-quit', () => {
  // Cleanup resources
  console.log('Application is shutting down...');
});

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    // Someone tried to run a second instance, focus our window instead
    const mainWindow = electronApp.getMainWindow();
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}
