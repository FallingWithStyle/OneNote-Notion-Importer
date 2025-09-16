/**
 * Tests for Batch Processor Service
 */

import { BatchProcessorService } from './batch-processor.service';
import { CloudDownloadService, CloudDownloadResult } from './cloud-download.service';
import { OneNoteLinkParser, ParsedOneNoteLink } from '../../utils/onenote-link-parser';

// Mock the Cloud Download service
jest.mock('./cloud-download.service');

describe('BatchProcessorService', () => {
  let service: BatchProcessorService;
  let mockCloudDownloadService: jest.Mocked<CloudDownloadService>;

  beforeEach(() => {
    mockCloudDownloadService = new CloudDownloadService({} as any) as jest.Mocked<CloudDownloadService>;
    service = new BatchProcessorService(mockCloudDownloadService);
  });

  describe('processBatch', () => {
    it('should process multiple OneNote links successfully', async () => {
      const links = [
        'https://onedrive.live.com/view.aspx?resid=123&id=documents',
        '/path/to/local/notebook.one',
        'onenote:https://d.docs.live.net/456/Documents/notebook.one'
      ];

      const mockResults: CloudDownloadResult[] = [
        {
          success: true,
          fileName: 'Notebook1.one',
          content: new ArrayBuffer(1024),
          size: 1024,
          source: 'onedrive'
        },
        {
          success: true,
          fileName: 'Notebook2.one',
          filePath: '/path/to/local/notebook.one',
          source: 'local'
        },
        {
          success: true,
          fileName: 'Notebook3.one',
          content: new ArrayBuffer(2048),
          size: 2048,
          source: 'onedrive'
        }
      ];

      mockCloudDownloadService.downloadFromCloudLink
        .mockResolvedValueOnce(mockResults[0]!)
        .mockResolvedValueOnce(mockResults[1]!)
        .mockResolvedValueOnce(mockResults[2]!);

      const result = await service.processBatch(links);

      expect(result).toEqual({
        success: true,
        totalProcessed: 3,
        successful: 3,
        failed: 0,
        results: mockResults,
        errors: []
      });

      expect(mockCloudDownloadService.downloadFromCloudLink).toHaveBeenCalledTimes(3);
    });

    it('should handle mixed success and failure results', async () => {
      const links = [
        'https://onedrive.live.com/view.aspx?resid=123&id=documents',
        'invalid-url',
        '/path/to/local/notebook.one'
      ];

      const mockResults: CloudDownloadResult[] = [
        {
          success: true,
          fileName: 'Notebook1.one',
          content: new ArrayBuffer(1024),
          size: 1024,
          source: 'onedrive'
        },
        {
          success: false,
          error: 'Invalid OneNote link: Invalid URL',
          source: 'unknown'
        },
        {
          success: true,
          fileName: 'Notebook2.one',
          filePath: '/path/to/local/notebook.one',
          source: 'local'
        }
      ];

      mockCloudDownloadService.downloadFromCloudLink
        .mockResolvedValueOnce(mockResults[0]!)
        .mockResolvedValueOnce(mockResults[1]!)
        .mockResolvedValueOnce(mockResults[2]!);

      const result = await service.processBatch(links);

      expect(result).toEqual({
        success: false,
        totalProcessed: 3,
        successful: 2,
        failed: 1,
        results: mockResults,
        errors: ['Invalid OneNote link: Invalid URL']
      });
    });

    it('should handle empty batch', async () => {
      const result = await service.processBatch([]);

      expect(result).toEqual({
        success: true,
        totalProcessed: 0,
        successful: 0,
        failed: 0,
        results: [],
        errors: []
      });

      expect(mockCloudDownloadService.downloadFromCloudLink).not.toHaveBeenCalled();
    });

    it('should process links with concurrency limit', async () => {
      const links = Array(10).fill('https://onedrive.live.com/view.aspx?resid=123&id=documents');
      
      const mockResult: CloudDownloadResult = {
        success: true,
        fileName: 'Notebook.one',
        content: new ArrayBuffer(1024),
        size: 1024,
        source: 'onedrive'
      };

      mockCloudDownloadService.downloadFromCloudLink.mockResolvedValue(mockResult);

      const result = await service.processBatch(links, { concurrency: 3 });

      expect(result.success).toBe(true);
      expect(result.totalProcessed).toBe(10);
      expect(result.successful).toBe(10);
      expect(mockCloudDownloadService.downloadFromCloudLink).toHaveBeenCalledTimes(10);
    });

    it('should handle network errors gracefully', async () => {
      const links = ['https://onedrive.live.com/view.aspx?resid=123&id=documents'];

      mockCloudDownloadService.downloadFromCloudLink.mockRejectedValue(new Error('Network error'));

      const result = await service.processBatch(links);

      expect(result.success).toBe(false);
      expect(result.totalProcessed).toBe(1);
      expect(result.successful).toBe(0);
      expect(result.failed).toBe(1);
      expect(result.errors).toContain('Network error');
    });
  });

  describe('processBatchWithProgress', () => {
    it('should call progress callback for each completed item', async () => {
      const links = [
        'https://onedrive.live.com/view.aspx?resid=123&id=documents',
        '/path/to/local/notebook.one'
      ];

      const mockResults: CloudDownloadResult[] = [
        {
          success: true,
          fileName: 'Notebook1.one',
          content: new ArrayBuffer(1024),
          size: 1024,
          source: 'onedrive'
        },
        {
          success: true,
          fileName: 'Notebook2.one',
          filePath: '/path/to/local/notebook.one',
          source: 'local'
        }
      ];

      mockCloudDownloadService.downloadFromCloudLink
        .mockResolvedValueOnce(mockResults[0]!)
        .mockResolvedValueOnce(mockResults[1]!);

      const progressCallback = jest.fn();

      const result = await service.processBatchWithProgress(links, progressCallback);

      expect(result.success).toBe(true);
      expect(progressCallback).toHaveBeenCalledTimes(2);
      expect(progressCallback).toHaveBeenCalledWith(1, 2, mockResults[0]);
      expect(progressCallback).toHaveBeenCalledWith(2, 2, mockResults[1]);
    });
  });

  describe('validateBatch', () => {
    it('should validate all links in batch', () => {
      const links = [
        'https://onedrive.live.com/view.aspx?resid=123&id=documents&wd=target%28notebook.one%7Csection-id%2F%29',
        'invalid-url',
        '/path/to/local/notebook.one'
      ];

      const result = service.validateBatch(links);

      // The OneDrive URL should be valid, local file should be valid, only invalid-url should be invalid
      expect(result.validLinks).toHaveLength(2);
      expect(result.invalidLinks).toHaveLength(1);
      expect(result.invalidLinks[0]?.error).toBe('Invalid OneNote link format');
    });
  });

  describe('getBatchStatistics', () => {
    it('should calculate correct statistics', () => {
      const results = [
        { success: true, fileName: 'Notebook1.one', source: 'onedrive' as const },
        { success: false, error: 'Error 1', source: 'unknown' as const },
        { success: true, fileName: 'Notebook2.one', source: 'local' as const },
        { success: false, error: 'Error 2', source: 'unknown' as const }
      ];

      const stats = service.getBatchStatistics(results);

      expect(stats).toEqual({
        total: 4,
        successful: 2,
        failed: 2,
        successRate: 50,
        bySource: {
          onedrive: 1,
          local: 1,
          unknown: 2
        }
      });
    });
  });
});
