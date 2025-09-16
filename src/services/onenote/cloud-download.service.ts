/**
 * Cloud Download Service
 * 
 * Handles downloading OneNote files from cloud sources (OneDrive, etc.)
 */

import { OneDriveApiService, OneDriveDownloadResult } from './onedrive-api.service';
import { ParsedOneNoteLink } from '../../utils/onenote-link-parser';

export interface CloudDownloadResult {
  success: boolean;
  fileName?: string;
  content?: ArrayBuffer;
  filePath?: string;
  size?: number;
  source: 'local' | 'onedrive' | 'unknown';
  error?: string;
}

export interface DownloadProgress {
  status: 'downloading' | 'completed' | 'failed';
  progress: number; // 0-100
  fileName?: string;
  error?: string;
}

export class CloudDownloadService {
  private oneDriveService: OneDriveApiService;
  private activeDownloads: Map<string, DownloadProgress> = new Map();

  constructor(oneDriveService: OneDriveApiService) {
    this.oneDriveService = oneDriveService;
  }

  /**
   * Download OneNote file from cloud link
   */
  async downloadFromCloudLink(parsedLink: ParsedOneNoteLink): Promise<CloudDownloadResult> {
    // Validate the parsed link
    if (!parsedLink.isValid) {
      return {
        success: false,
        error: `Invalid OneNote link: ${parsedLink.error || 'Unknown error'}`,
        source: 'unknown'
      };
    }

    // Handle local file paths
    if (parsedLink.type === 'filepath') {
      const result: CloudDownloadResult = {
        success: true,
        fileName: `${parsedLink.fileName}.one`,
        source: 'local'
      };
      if (parsedLink.filePath) {
        result.filePath = parsedLink.filePath;
      }
      return result;
    }

    // Handle cloud links
    if (parsedLink.type === 'onedrive' || parsedLink.type === 'onenote') {
      return this.downloadFromOneDrive(parsedLink);
    }

    return {
      success: false,
      error: 'Unsupported cloud link type',
      source: 'unknown'
    };
  }

  /**
   * Check if a parsed link is a cloud link
   */
  isCloudLink(parsedLink: ParsedOneNoteLink): boolean {
    return parsedLink.type === 'onedrive' || parsedLink.type === 'onenote';
  }

  /**
   * Get download progress for a specific URL
   */
  getDownloadProgress(url: string): DownloadProgress | undefined {
    return this.activeDownloads.get(url);
  }

  /**
   * Download from OneDrive
   */
  private async downloadFromOneDrive(parsedLink: ParsedOneNoteLink): Promise<CloudDownloadResult> {
    const url = parsedLink.originalUrl;
    
    // Set initial progress
    this.activeDownloads.set(url, {
      status: 'downloading',
      progress: 0,
      fileName: parsedLink.fileName
    });

    try {
      // Update progress
      this.updateProgress(url, 50);

      const result = await this.oneDriveService.downloadOneNoteFile(parsedLink);

      if (result.success) {
        this.updateProgress(url, 100, 'completed');
        
        const downloadResult: CloudDownloadResult = {
          success: true,
          source: 'onedrive'
        };
        if (result.fileName) downloadResult.fileName = result.fileName;
        if (result.content) downloadResult.content = result.content;
        if (result.size) downloadResult.size = result.size;
        
        return downloadResult;
      } else {
        this.updateProgress(url, 0, 'failed', result.error);
        
        const downloadResult: CloudDownloadResult = {
          success: false,
          source: 'onedrive'
        };
        if (result.error) downloadResult.error = result.error;
        
        return downloadResult;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.updateProgress(url, 0, 'failed', errorMessage);
      
      return {
        success: false,
        error: `Download failed: ${errorMessage}`,
        source: 'onedrive'
      };
    } finally {
      // Clean up progress after a delay
      setTimeout(() => {
        this.activeDownloads.delete(url);
      }, 5000);
    }
  }

  /**
   * Update download progress
   */
  private updateProgress(url: string, progress: number, status?: 'downloading' | 'completed' | 'failed', error?: string): void {
    const currentProgress = this.activeDownloads.get(url);
    if (currentProgress) {
      const updatedProgress: DownloadProgress = {
        ...currentProgress,
        progress,
        status: status || currentProgress.status
      };
      if (error) {
        updatedProgress.error = error;
      }
      this.activeDownloads.set(url, updatedProgress);
    }
  }

  /**
   * Cancel an active download
   */
  cancelDownload(url: string): boolean {
    const progress = this.activeDownloads.get(url);
    if (progress && progress.status === 'downloading') {
      this.updateProgress(url, 0, 'failed', 'Download cancelled');
      return true;
    }
    return false;
  }

  /**
   * Get all active downloads
   */
  getActiveDownloads(): Map<string, DownloadProgress> {
    return new Map(this.activeDownloads);
  }

  /**
   * Clear completed downloads
   */
  clearCompletedDownloads(): void {
    for (const [url, progress] of this.activeDownloads.entries()) {
      if (progress.status === 'completed' || progress.status === 'failed') {
        this.activeDownloads.delete(url);
      }
    }
  }
}
