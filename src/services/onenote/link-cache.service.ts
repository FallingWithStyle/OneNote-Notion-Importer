/**
 * Link Cache Service
 * 
 * Provides caching for frequently accessed OneNote links and download results
 */

import { CloudDownloadResult } from './cloud-download.service';
import { ParsedOneNoteLink } from '../../utils/onenote-link-parser';

export interface CacheOptions {
  defaultTtl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of entries
  maxMemorySize?: number; // Maximum memory usage in bytes
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

export interface CacheStatistics {
  totalEntries: number;
  downloadResults: number;
  parsedLinks: number;
  totalSize: number;
  hitRate: number;
  averageAccessCount: number;
}

export class LinkCacheService {
  private downloadCache = new Map<string, CacheEntry<CloudDownloadResult>>();
  private parsedLinkCache = new Map<string, CacheEntry<ParsedOneNoteLink>>();
  private options: Required<CacheOptions>;
  private accessOrder: string[] = []; // For LRU eviction
  private hitCount = 0;
  private missCount = 0;

  constructor(options: CacheOptions = {}) {
    this.options = {
      defaultTtl: options.defaultTtl || 5 * 60 * 1000, // 5 minutes
      maxSize: options.maxSize || 1000,
      maxMemorySize: options.maxMemorySize || 100 * 1024 * 1024 // 100MB
    };
  }

  /**
   * Cache a download result
   */
  cacheResult(link: string, result: CloudDownloadResult, ttl?: number): void {
    const entry: CacheEntry<CloudDownloadResult> = {
      data: result,
      timestamp: Date.now(),
      ttl: ttl || this.options.defaultTtl,
      accessCount: 0,
      lastAccessed: Date.now()
    };

    this.downloadCache.set(link, entry);
    this.updateAccessOrder(link);
    this.enforceLimits();
  }

  /**
   * Cache a parsed link
   */
  cacheParsedLink(link: string, parsedLink: ParsedOneNoteLink, ttl?: number): void {
    const entry: CacheEntry<ParsedOneNoteLink> = {
      data: parsedLink,
      timestamp: Date.now(),
      ttl: ttl || this.options.defaultTtl,
      accessCount: 0,
      lastAccessed: Date.now()
    };

    this.parsedLinkCache.set(link, entry);
    this.updateAccessOrder(link);
    this.enforceLimits();
  }

  /**
   * Get cached download result
   */
  getCachedResult(link: string): CloudDownloadResult | undefined {
    const entry = this.downloadCache.get(link);
    
    if (!entry) {
      this.missCount++;
      return undefined;
    }

    if (this.isExpired(entry)) {
      this.downloadCache.delete(link);
      this.removeFromAccessOrder(link);
      this.missCount++;
      return undefined;
    }

    this.updateAccessStats(entry);
    this.hitCount++;
    return entry.data;
  }

  /**
   * Get cached parsed link
   */
  getCachedParsedLink(link: string): ParsedOneNoteLink | undefined {
    const entry = this.parsedLinkCache.get(link);
    
    if (!entry) {
      this.missCount++;
      return undefined;
    }

    if (this.isExpired(entry)) {
      this.parsedLinkCache.delete(link);
      this.removeFromAccessOrder(link);
      this.missCount++;
      return undefined;
    }

    this.updateAccessStats(entry);
    this.hitCount++;
    return entry.data;
  }

  /**
   * Check if a download result is cached
   */
  hasCachedResult(link: string): boolean {
    const entry = this.downloadCache.get(link);
    return entry !== undefined && !this.isExpired(entry);
  }

  /**
   * Check if a parsed link is cached
   */
  hasCachedParsedLink(link: string): boolean {
    const entry = this.parsedLinkCache.get(link);
    return entry !== undefined && !this.isExpired(entry);
  }

  /**
   * Invalidate a specific cached result
   */
  invalidateResult(link: string): boolean {
    const hadResult = this.downloadCache.has(link);
    this.downloadCache.delete(link);
    this.removeFromAccessOrder(link);
    return hadResult;
  }

  /**
   * Invalidate a specific cached parsed link
   */
  invalidateParsedLink(link: string): boolean {
    const hadParsedLink = this.parsedLinkCache.has(link);
    this.parsedLinkCache.delete(link);
    this.removeFromAccessOrder(link);
    return hadParsedLink;
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.downloadCache.clear();
    this.parsedLinkCache.clear();
    this.accessOrder = [];
    this.hitCount = 0;
    this.missCount = 0;
  }

  /**
   * Get cache statistics
   */
  getCacheStatistics(): CacheStatistics {
    const totalEntries = this.downloadCache.size + this.parsedLinkCache.size;
    const totalSize = this.calculateTotalSize();
    const hitRate = this.hitCount + this.missCount > 0 
      ? (this.hitCount / (this.hitCount + this.missCount)) * 100 
      : 0;
    
    const allEntries = [...this.downloadCache.values(), ...this.parsedLinkCache.values()];
    const averageAccessCount = allEntries.length > 0
      ? allEntries.reduce((sum, entry) => sum + entry.accessCount, 0) / allEntries.length
      : 0;

    return {
      totalEntries,
      downloadResults: this.downloadCache.size,
      parsedLinks: this.parsedLinkCache.size,
      totalSize,
      hitRate: Math.round(hitRate * 100) / 100,
      averageAccessCount: Math.round(averageAccessCount * 100) / 100
    };
  }

  /**
   * Clean up expired entries
   */
  cleanupExpired(): number {
    let cleanedCount = 0;

    // Clean download cache
    for (const [link, entry] of this.downloadCache.entries()) {
      if (this.isExpired(entry)) {
        this.downloadCache.delete(link);
        this.removeFromAccessOrder(link);
        cleanedCount++;
      }
    }

    // Clean parsed link cache
    for (const [link, entry] of this.parsedLinkCache.entries()) {
      if (this.isExpired(entry)) {
        this.parsedLinkCache.delete(link);
        this.removeFromAccessOrder(link);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }

  /**
   * Get cache keys for debugging
   */
  getCacheKeys(): { downloadResults: string[]; parsedLinks: string[] } {
    return {
      downloadResults: Array.from(this.downloadCache.keys()),
      parsedLinks: Array.from(this.parsedLinkCache.keys())
    };
  }

  /**
   * Check if an entry is expired
   */
  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  /**
   * Update access statistics
   */
  private updateAccessStats(entry: CacheEntry<any>): void {
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.updateAccessOrder(entry.data.originalUrl || entry.data.fileName || 'unknown');
  }

  /**
   * Update access order for LRU eviction
   */
  private updateAccessOrder(link: string): void {
    this.removeFromAccessOrder(link);
    this.accessOrder.push(link);
  }

  /**
   * Remove from access order
   */
  private removeFromAccessOrder(link: string): void {
    const index = this.accessOrder.indexOf(link);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  /**
   * Enforce cache limits
   */
  private enforceLimits(): void {
    // Enforce size limit
    while (this.downloadCache.size + this.parsedLinkCache.size > this.options.maxSize) {
      this.evictLRU();
    }

    // Enforce memory limit
    while (this.calculateTotalSize() > this.options.maxMemorySize) {
      this.evictLRU();
    }
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    if (this.accessOrder.length === 0) return;

    const linkToEvict = this.accessOrder[0];
    if (linkToEvict) {
      this.downloadCache.delete(linkToEvict);
      this.parsedLinkCache.delete(linkToEvict);
      this.removeFromAccessOrder(linkToEvict);
    }
  }

  /**
   * Calculate total memory usage
   */
  private calculateTotalSize(): number {
    let totalSize = 0;

    for (const entry of this.downloadCache.values()) {
      totalSize += this.estimateEntrySize(entry);
    }

    for (const entry of this.parsedLinkCache.values()) {
      totalSize += this.estimateEntrySize(entry);
    }

    return totalSize;
  }

  /**
   * Estimate entry size in bytes
   */
  private estimateEntrySize(entry: CacheEntry<any>): number {
    let size = 0;

    if (entry.data.content instanceof ArrayBuffer) {
      size += entry.data.content.byteLength;
    }

    if (entry.data.fileName) {
      size += entry.data.fileName.length * 2; // UTF-16
    }

    if (entry.data.filePath) {
      size += entry.data.filePath.length * 2; // UTF-16
    }

    if (entry.data.originalUrl) {
      size += entry.data.originalUrl.length * 2; // UTF-16
    }

    // Add overhead for object structure
    size += 100;

    return size;
  }
}
