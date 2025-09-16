/**
 * Tests for Cloud Download Service
 */

import { CloudDownloadService } from './cloud-download.service';
import { OneDriveApiService } from './onedrive-api.service';
import { ParsedOneNoteLink } from '../../utils/onenote-link-parser';

// Mock the OneDrive API service
jest.mock('./onedrive-api.service');

describe('CloudDownloadService', () => {
  let service: CloudDownloadService;
  let mockOneDriveService: jest.Mocked<OneDriveApiService>;

  beforeEach(() => {
    mockOneDriveService = new OneDriveApiService('mock-token') as jest.Mocked<OneDriveApiService>;
    service = new CloudDownloadService(mockOneDriveService);
  });

  describe('downloadFromCloudLink', () => {
    it('should download OneDrive file successfully', async () => {
      const mockParsedLink: ParsedOneNoteLink = {
        type: 'onedrive',
        fileName: 'Test Notebook',
        originalUrl: 'https://onedrive.live.com/view.aspx?resid=123&id=documents',
        isValid: true
      };

      const mockFileContent = new ArrayBuffer(1024);
      mockOneDriveService.downloadOneNoteFile.mockResolvedValue({
        success: true,
        fileName: 'Test Notebook.one',
        content: mockFileContent,
        size: 1024
      });

      const result = await service.downloadFromCloudLink(mockParsedLink);

      expect(result).toEqual({
        success: true,
        fileName: 'Test Notebook.one',
        content: mockFileContent,
        size: 1024,
        source: 'onedrive'
      });

      expect(mockOneDriveService.downloadOneNoteFile).toHaveBeenCalledWith(mockParsedLink);
    });

    it('should handle local file paths without cloud download', async () => {
      const mockParsedLink: ParsedOneNoteLink = {
        type: 'filepath',
        fileName: 'Local Notebook',
        filePath: '/path/to/notebook.one',
        originalUrl: '/path/to/notebook.one',
        isValid: true
      };

      const result = await service.downloadFromCloudLink(mockParsedLink);

      expect(result).toEqual({
        success: true,
        fileName: 'Local Notebook.one',
        filePath: '/path/to/notebook.one',
        source: 'local'
      });

      expect(mockOneDriveService.downloadOneNoteFile).not.toHaveBeenCalled();
    });

    it('should handle onenote: protocol URLs', async () => {
      const mockParsedLink: ParsedOneNoteLink = {
        type: 'onenote',
        fileName: 'Protocol Notebook',
        filePath: 'https://d.docs.live.net/123/Documents/notebook.one',
        originalUrl: 'onenote:https://d.docs.live.net/123/Documents/notebook.one',
        isValid: true
      };

      const mockFileContent = new ArrayBuffer(1024);
      mockOneDriveService.downloadOneNoteFile.mockResolvedValue({
        success: true,
        fileName: 'Protocol Notebook.one',
        content: mockFileContent,
        size: 1024
      });

      const result = await service.downloadFromCloudLink(mockParsedLink);

      expect(result).toEqual({
        success: true,
        fileName: 'Protocol Notebook.one',
        content: mockFileContent,
        size: 1024,
        source: 'onedrive'
      });
    });

    it('should handle download failures', async () => {
      const mockParsedLink: ParsedOneNoteLink = {
        type: 'onedrive',
        fileName: 'Test Notebook',
        originalUrl: 'https://onedrive.live.com/view.aspx?resid=123&id=documents',
        isValid: true
      };

      mockOneDriveService.downloadOneNoteFile.mockResolvedValue({
        success: false,
        error: 'Download failed'
      });

      const result = await service.downloadFromCloudLink(mockParsedLink);

      expect(result).toEqual({
        success: false,
        error: 'Download failed',
        source: 'onedrive'
      });
    });

    it('should handle invalid links', async () => {
      const mockParsedLink: ParsedOneNoteLink = {
        type: 'onedrive',
        fileName: '',
        originalUrl: 'invalid-url',
        isValid: false,
        error: 'Invalid URL'
      };

      const result = await service.downloadFromCloudLink(mockParsedLink);

      expect(result).toEqual({
        success: false,
        error: 'Invalid OneNote link: Invalid URL',
        source: 'unknown'
      });

      expect(mockOneDriveService.downloadOneNoteFile).not.toHaveBeenCalled();
    });
  });

  describe('isCloudLink', () => {
    it('should identify OneDrive links as cloud links', () => {
      const mockParsedLink: ParsedOneNoteLink = {
        type: 'onedrive',
        fileName: 'Test Notebook',
        originalUrl: 'https://onedrive.live.com/view.aspx?resid=123',
        isValid: true
      };

      expect(service.isCloudLink(mockParsedLink)).toBe(true);
    });

    it('should identify onenote: protocol URLs as cloud links', () => {
      const mockParsedLink: ParsedOneNoteLink = {
        type: 'onenote',
        fileName: 'Test Notebook',
        originalUrl: 'onenote:https://d.docs.live.net/123/Documents/notebook.one',
        isValid: true
      };

      expect(service.isCloudLink(mockParsedLink)).toBe(true);
    });

    it('should identify local file paths as non-cloud links', () => {
      const mockParsedLink: ParsedOneNoteLink = {
        type: 'filepath',
        fileName: 'Test Notebook',
        filePath: '/path/to/notebook.one',
        originalUrl: '/path/to/notebook.one',
        isValid: true
      };

      expect(service.isCloudLink(mockParsedLink)).toBe(false);
    });
  });

  describe('getDownloadProgress', () => {
    it('should return download progress for active downloads', async () => {
      const mockParsedLink: ParsedOneNoteLink = {
        type: 'onedrive',
        fileName: 'Test Notebook',
        originalUrl: 'https://onedrive.live.com/view.aspx?resid=123',
        isValid: true
      };

      // Start a download
      const downloadPromise = service.downloadFromCloudLink(mockParsedLink);
      
      // Check progress
      const progress = service.getDownloadProgress(mockParsedLink.originalUrl);
      expect(progress).toBeDefined();
      expect(progress?.status).toBe('downloading');

      // Wait for completion
      await downloadPromise;
    });

    it('should return undefined for non-active downloads', () => {
      const progress = service.getDownloadProgress('non-existent-url');
      expect(progress).toBeUndefined();
    });
  });
});
