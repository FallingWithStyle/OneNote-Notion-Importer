/**
 * Tests for Link Cache Service
 */

import { LinkCacheService } from './link-cache.service';
import { CloudDownloadResult } from './cloud-download.service';
import { ParsedOneNoteLink } from '../../utils/onenote-link-parser';

describe('LinkCacheService', () => {
  let service: LinkCacheService;

  beforeEach(() => {
    service = new LinkCacheService();
  });

  afterEach(() => {
    service.clearCache();
  });

  describe('cacheResult', () => {
    it('should cache download results', () => {
      const link = 'https://onedrive.live.com/view.aspx?resid=123&id=documents&wd=target%28notebook.one%7Csection-id%2F%29';
      const result: CloudDownloadResult = {
        success: true,
        fileName: 'notebook.one',
        content: new ArrayBuffer(1024),
        size: 1024,
        source: 'onedrive'
      };

      service.cacheResult(link, result);

      expect(service.hasCachedResult(link)).toBe(true);
    });

    it('should cache parsed links', () => {
      const link = 'https://onedrive.live.com/view.aspx?resid=123&id=documents&wd=target%28notebook.one%7Csection-id%2F%29';
      const parsedLink: ParsedOneNoteLink = {
        type: 'onedrive',
        fileName: 'notebook',
        originalUrl: link,
        isValid: true
      };

      service.cacheParsedLink(link, parsedLink);

      expect(service.hasCachedParsedLink(link)).toBe(true);
    });
  });

  describe('getCachedResult', () => {
    it('should retrieve cached download results', () => {
      const link = 'https://onedrive.live.com/view.aspx?resid=123&id=documents&wd=target%28notebook.one%7Csection-id%2F%29';
      const result: CloudDownloadResult = {
        success: true,
        fileName: 'notebook.one',
        content: new ArrayBuffer(1024),
        size: 1024,
        source: 'onedrive'
      };

      service.cacheResult(link, result);
      const cached = service.getCachedResult(link);

      expect(cached).toEqual(result);
    });

    it('should return undefined for non-cached results', () => {
      const link = 'https://onedrive.live.com/view.aspx?resid=123&id=documents&wd=target%28notebook.one%7Csection-id%2F%29';
      const cached = service.getCachedResult(link);

      expect(cached).toBeUndefined();
    });

    it('should retrieve cached parsed links', () => {
      const link = 'https://onedrive.live.com/view.aspx?resid=123&id=documents&wd=target%28notebook.one%7Csection-id%2F%29';
      const parsedLink: ParsedOneNoteLink = {
        type: 'onedrive',
        fileName: 'notebook',
        originalUrl: link,
        isValid: true
      };

      service.cacheParsedLink(link, parsedLink);
      const cached = service.getCachedParsedLink(link);

      expect(cached).toEqual(parsedLink);
    });
  });

  describe('cache invalidation', () => {
    it('should invalidate specific cached results', () => {
      const link1 = 'https://onedrive.live.com/view.aspx?resid=123&id=documents&wd=target%28notebook1.one%7Csection-id%2F%29';
      const link2 = 'https://onedrive.live.com/view.aspx?resid=456&id=documents&wd=target%28notebook2.one%7Csection-id%2F%29';
      
      const result1: CloudDownloadResult = {
        success: true,
        fileName: 'notebook1.one',
        content: new ArrayBuffer(1024),
        size: 1024,
        source: 'onedrive'
      };
      
      const result2: CloudDownloadResult = {
        success: true,
        fileName: 'notebook2.one',
        content: new ArrayBuffer(2048),
        size: 2048,
        source: 'onedrive'
      };

      service.cacheResult(link1, result1);
      service.cacheResult(link2, result2);

      expect(service.hasCachedResult(link1)).toBe(true);
      expect(service.hasCachedResult(link2)).toBe(true);

      service.invalidateResult(link1);

      expect(service.hasCachedResult(link1)).toBe(false);
      expect(service.hasCachedResult(link2)).toBe(true);
    });

    it('should clear all cached results', () => {
      const link = 'https://onedrive.live.com/view.aspx?resid=123&id=documents&wd=target%28notebook.one%7Csection-id%2F%29';
      const result: CloudDownloadResult = {
        success: true,
        fileName: 'notebook.one',
        content: new ArrayBuffer(1024),
        size: 1024,
        source: 'onedrive'
      };

      service.cacheResult(link, result);
      expect(service.hasCachedResult(link)).toBe(true);

      service.clearCache();
      expect(service.hasCachedResult(link)).toBe(false);
    });
  });

  describe('cache statistics', () => {
    it('should provide cache statistics', () => {
      const link1 = 'https://onedrive.live.com/view.aspx?resid=123&id=documents&wd=target%28notebook1.one%7Csection-id%2F%29';
      const link2 = 'https://onedrive.live.com/view.aspx?resid=456&id=documents&wd=target%28notebook2.one%7Csection-id%2F%29';
      
      const result1: CloudDownloadResult = {
        success: true,
        fileName: 'notebook1.one',
        content: new ArrayBuffer(1024),
        size: 1024,
        source: 'onedrive'
      };
      
      const parsedLink2: ParsedOneNoteLink = {
        type: 'onedrive',
        fileName: 'notebook2',
        originalUrl: link2,
        isValid: true
      };

      service.cacheResult(link1, result1);
      service.cacheParsedLink(link2, parsedLink2);

      const stats = service.getCacheStatistics();

      expect(stats.totalEntries).toBe(2);
      expect(stats.downloadResults).toBe(1);
      expect(stats.parsedLinks).toBe(1);
      expect(stats.totalSize).toBeGreaterThan(1000);
    });
  });

  describe('cache expiration', () => {
    it('should handle cache expiration', (done) => {
      const service = new LinkCacheService({ defaultTtl: 100 }); // 100ms TTL
      const link = 'https://onedrive.live.com/view.aspx?resid=123&id=documents&wd=target%28notebook.one%7Csection-id%2F%29';
      const result: CloudDownloadResult = {
        success: true,
        fileName: 'notebook.one',
        content: new ArrayBuffer(1024),
        size: 1024,
        source: 'onedrive'
      };

      service.cacheResult(link, result);
      expect(service.hasCachedResult(link)).toBe(true);

      setTimeout(() => {
        expect(service.hasCachedResult(link)).toBe(false);
        done();
      }, 150);
    });

    it('should not expire cache before TTL', (done) => {
      const service = new LinkCacheService({ defaultTtl: 200 }); // 200ms TTL
      const link = 'https://onedrive.live.com/view.aspx?resid=123&id=documents&wd=target%28notebook.one%7Csection-id%2F%29';
      const result: CloudDownloadResult = {
        success: true,
        fileName: 'notebook.one',
        content: new ArrayBuffer(1024),
        size: 1024,
        source: 'onedrive'
      };

      service.cacheResult(link, result);
      expect(service.hasCachedResult(link)).toBe(true);

      setTimeout(() => {
        expect(service.hasCachedResult(link)).toBe(true);
        done();
      }, 100);
    });
  });

  describe('cache size limits', () => {
    it('should respect maximum cache size', () => {
      const service = new LinkCacheService({ maxSize: 2 });
      const link1 = 'https://onedrive.live.com/view.aspx?resid=123&id=documents&wd=target%28notebook1.one%7Csection-id%2F%29';
      const link2 = 'https://onedrive.live.com/view.aspx?resid=456&id=documents&wd=target%28notebook2.one%7Csection-id%2F%29';
      const link3 = 'https://onedrive.live.com/view.aspx?resid=789&id=documents&wd=target%28notebook3.one%7Csection-id%2F%29';
      
      const result1: CloudDownloadResult = {
        success: true,
        fileName: 'notebook1.one',
        content: new ArrayBuffer(1024),
        size: 1024,
        source: 'onedrive'
      };
      
      const result2: CloudDownloadResult = {
        success: true,
        fileName: 'notebook2.one',
        content: new ArrayBuffer(1024),
        size: 1024,
        source: 'onedrive'
      };
      
      const result3: CloudDownloadResult = {
        success: true,
        fileName: 'notebook3.one',
        content: new ArrayBuffer(1024),
        size: 1024,
        source: 'onedrive'
      };

      service.cacheResult(link1, result1);
      service.cacheResult(link2, result2);
      service.cacheResult(link3, result3);

      // The first entry should be evicted due to LRU
      expect(service.hasCachedResult(link1)).toBe(false);
      expect(service.hasCachedResult(link2)).toBe(true);
      expect(service.hasCachedResult(link3)).toBe(true);
    });
  });
});
