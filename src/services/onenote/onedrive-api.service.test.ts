/**
 * Tests for OneDrive API Service
 */

import { OneDriveApiService } from './onedrive-api.service';
import { ParsedOneNoteLink } from '../../utils/onenote-link-parser';

// Mock fetch for testing
global.fetch = jest.fn();

describe('OneDriveApiService', () => {
  let service: OneDriveApiService;
  const mockAccessToken = 'mock-access-token';

  beforeEach(() => {
    service = new OneDriveApiService(mockAccessToken);
    jest.clearAllMocks();
  });

  describe('downloadOneNoteFile', () => {
    it('should download OneNote file from OneDrive URL', async () => {
      const mockParsedLink: ParsedOneNoteLink = {
        type: 'onedrive',
        fileName: 'Test Notebook',
        originalUrl: 'https://onedrive.live.com/view.aspx?resid=123&id=documents',
        isValid: true
      };

      const mockFileContent = new ArrayBuffer(1024);
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        arrayBuffer: () => Promise.resolve(mockFileContent)
      });

      const result = await service.downloadOneNoteFile(mockParsedLink);

      expect(result).toEqual({
        success: true,
        fileName: 'Test Notebook.one',
        content: mockFileContent,
        size: 1024
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('https://graph.microsoft.com/v1.0/me/drive/items/123/content'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockAccessToken}`
          })
        })
      );
    });

    it('should handle download errors gracefully', async () => {
      const mockParsedLink: ParsedOneNoteLink = {
        type: 'onedrive',
        fileName: 'Test Notebook',
        originalUrl: 'https://onedrive.live.com/view.aspx?resid=123&id=documents',
        isValid: true
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      const result = await service.downloadOneNoteFile(mockParsedLink);

      expect(result).toEqual({
        success: false,
        error: 'Failed to download file: 404 Not Found'
      });
    });

    it('should validate parsed link before attempting download', async () => {
      const invalidParsedLink: ParsedOneNoteLink = {
        type: 'onedrive',
        fileName: '',
        originalUrl: 'invalid-url',
        isValid: false,
        error: 'Invalid URL'
      };

      const result = await service.downloadOneNoteFile(invalidParsedLink);

      expect(result).toEqual({
        success: false,
        error: 'Invalid OneNote link: Invalid URL'
      });

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle network errors', async () => {
      const mockParsedLink: ParsedOneNoteLink = {
        type: 'onedrive',
        fileName: 'Test Notebook',
        originalUrl: 'https://onedrive.live.com/view.aspx?resid=123&id=documents',
        isValid: true
      };

      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await service.downloadOneNoteFile(mockParsedLink);

      expect(result).toEqual({
        success: false,
        error: 'Network error: Network error'
      });
    });
  });

  describe('validateAccessToken', () => {
    it('should validate access token successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'user123', displayName: 'Test User' })
      });

      const result = await service.validateAccessToken();

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://graph.microsoft.com/v1.0/me',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockAccessToken}`
          })
        })
      );
    });

    it('should return false for invalid access token', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      });

      const result = await service.validateAccessToken();

      expect(result).toBe(false);
    });

    it('should handle network errors during validation', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await service.validateAccessToken();

      expect(result).toBe(false);
    });
  });

  describe('getFileMetadata', () => {
    it('should retrieve file metadata successfully', async () => {
      const mockMetadata = {
        id: 'file123',
        name: 'Test Notebook.one',
        size: 1024,
        lastModifiedDateTime: '2023-01-01T00:00:00Z'
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMetadata)
      });

      const result = await service.getFileMetadata('file123');

      expect(result).toEqual({
        success: true,
        metadata: mockMetadata
      });
    });

    it('should handle metadata retrieval errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      const result = await service.getFileMetadata('invalid-id');

      expect(result).toEqual({
        success: false,
        error: 'Failed to retrieve file metadata: 404 Not Found'
      });
    });
  });
});
