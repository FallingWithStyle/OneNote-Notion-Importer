/**
 * Batch Processor Service
 * 
 * Handles batch processing of multiple OneNote links
 */

import { CloudDownloadService, CloudDownloadResult } from './cloud-download.service';
import { OneNoteLinkParser, ParsedOneNoteLink } from '../../utils/onenote-link-parser';

export interface BatchProcessOptions {
  concurrency?: number;
  timeout?: number;
  retryAttempts?: number;
}

export interface BatchProcessResult {
  success: boolean;
  totalProcessed: number;
  successful: number;
  failed: number;
  results: CloudDownloadResult[];
  errors: string[];
}

export interface BatchValidationResult {
  validLinks: ParsedOneNoteLink[];
  invalidLinks: ParsedOneNoteLink[];
}

export interface BatchStatistics {
  total: number;
  successful: number;
  failed: number;
  successRate: number;
  bySource: Record<string, number>;
}

export type ProgressCallback = (completed: number, total: number, result: CloudDownloadResult) => void;

export class BatchProcessorService {
  private cloudDownloadService: CloudDownloadService;
  private defaultOptions: Required<BatchProcessOptions> = {
    concurrency: 5,
    timeout: 30000, // 30 seconds
    retryAttempts: 2
  };

  constructor(cloudDownloadService: CloudDownloadService) {
    this.cloudDownloadService = cloudDownloadService;
  }

  /**
   * Process a batch of OneNote links
   */
  async processBatch(links: string[], options: BatchProcessOptions = {}): Promise<BatchProcessResult> {
    const opts = { ...this.defaultOptions, ...options };
    const results: CloudDownloadResult[] = [];
    const errors: string[] = [];

    // Parse all links first
    const parsedLinks = links.map(link => OneNoteLinkParser.parseLink(link));
    
    // Process links with concurrency control
    const chunks = this.chunkArray(parsedLinks, opts.concurrency);
    
    for (const chunk of chunks) {
      const chunkPromises = chunk.map(async (parsedLink) => {
        try {
          const result = await this.processWithTimeout(
            () => this.cloudDownloadService.downloadFromCloudLink(parsedLink),
            opts.timeout
          );
          return result;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          return {
            success: false,
            error: errorMessage,
            source: 'unknown' as const
          };
        }
      });

      const chunkResults = await Promise.all(chunkPromises);
      results.push(...chunkResults);
    }

    // Calculate statistics
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const allErrors = results.filter(r => !r.success && r.error).map(r => r.error!);

    return {
      success: failed === 0,
      totalProcessed: results.length,
      successful,
      failed,
      results,
      errors: allErrors
    };
  }

  /**
   * Process batch with progress callback
   */
  async processBatchWithProgress(
    links: string[], 
    progressCallback: ProgressCallback,
    options: BatchProcessOptions = {}
  ): Promise<BatchProcessResult> {
    const opts = { ...this.defaultOptions, ...options };
    const results: CloudDownloadResult[] = [];
    const errors: string[] = [];
    let completed = 0;

    // Parse all links first
    const parsedLinks = links.map(link => OneNoteLinkParser.parseLink(link));
    
    // Process links with concurrency control
    const chunks = this.chunkArray(parsedLinks, opts.concurrency);
    
    for (const chunk of chunks) {
      const chunkPromises = chunk.map(async (parsedLink) => {
        try {
          const result = await this.processWithTimeout(
            () => this.cloudDownloadService.downloadFromCloudLink(parsedLink),
            opts.timeout
          );
          
          completed++;
          progressCallback(completed, parsedLinks.length, result);
          
          return result;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          const errorResult = {
            success: false,
            error: errorMessage,
            source: 'unknown' as const
          };
          
          completed++;
          progressCallback(completed, parsedLinks.length, errorResult);
          
          return errorResult;
        }
      });

      const chunkResults = await Promise.all(chunkPromises);
      results.push(...chunkResults);
    }

    // Calculate statistics
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const allErrors = results.filter(r => !r.success && r.error).map(r => r.error!);

    return {
      success: failed === 0,
      totalProcessed: results.length,
      successful,
      failed,
      results,
      errors: allErrors
    };
  }

  /**
   * Validate a batch of links before processing
   */
  validateBatch(links: string[]): BatchValidationResult {
    const parsedLinks = links.map(link => OneNoteLinkParser.parseLink(link));
    
    const validLinks = parsedLinks.filter(link => link.isValid);
    const invalidLinks = parsedLinks.filter(link => !link.isValid);

    return {
      validLinks,
      invalidLinks
    };
  }

  /**
   * Get statistics for a batch of results
   */
  getBatchStatistics(results: CloudDownloadResult[]): BatchStatistics {
    const total = results.length;
    const successful = results.filter(r => r.success).length;
    const failed = total - successful;
    const successRate = total > 0 ? Math.round((successful / total) * 100) : 0;

    const bySource: Record<string, number> = {};
    results.forEach(result => {
      bySource[result.source] = (bySource[result.source] || 0) + 1;
    });

    return {
      total,
      successful,
      failed,
      successRate,
      bySource
    };
  }

  /**
   * Process a single link with retry logic
   */
  async processSingleLink(
    link: string, 
    retryAttempts: number = this.defaultOptions.retryAttempts
  ): Promise<CloudDownloadResult> {
    const parsedLink = OneNoteLinkParser.parseLink(link);
    
    for (let attempt = 0; attempt <= retryAttempts; attempt++) {
      try {
        const result = await this.cloudDownloadService.downloadFromCloudLink(parsedLink);
        if (result.success || attempt === retryAttempts) {
          return result;
        }
      } catch (error) {
        if (attempt === retryAttempts) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          return {
            success: false,
            error: errorMessage,
            source: 'unknown'
          };
        }
      }
    }

    return {
      success: false,
      error: 'Max retry attempts exceeded',
      source: 'unknown'
    };
  }

  /**
   * Split array into chunks for concurrency control
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Process with timeout
   */
  private async processWithTimeout<T>(
    operation: () => Promise<T>,
    timeout: number
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Operation timeout'));
      }, timeout);

      operation()
        .then(result => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }
}
