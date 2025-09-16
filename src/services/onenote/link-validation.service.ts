/**
 * Link Validation Service
 * 
 * Provides comprehensive validation and error recovery for OneNote links
 */

import { ParsedOneNoteLink } from '../../utils/onenote-link-parser';
import * as fs from 'fs';
import * as path from 'path';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export interface BatchValidationResult {
  totalLinks: number;
  validLinks: number;
  invalidLinks: number;
  errors: string[];
  warnings: string[];
  details: Array<{
    link: string;
    result: ValidationResult;
  }>;
}

export interface ErrorRecoveryResult {
  attempted: boolean;
  success: boolean;
  recoveredLink?: ParsedOneNoteLink;
  error?: string;
}

export interface ValidationReport {
  summary: {
    total: number;
    valid: number;
    invalid: number;
    successRate: number;
  };
  details: Array<{
    link: string;
    result: ValidationResult;
  }>;
  recommendations: string[];
}

export class LinkValidationService {
  private readonly maxUrlLength = 2048;
  private readonly maxFilenameLength = 255;
  private readonly supportedExtensions = ['.one', '.onepkg'];

  /**
   * Validate a single OneNote link
   */
  validateLink(parsedLink: ParsedOneNoteLink): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Basic validation
    if (!parsedLink.isValid) {
      errors.push(parsedLink.error || 'Invalid OneNote link format');
      suggestions.push(...this.suggestCorrections(parsedLink));
      return { isValid: false, errors, warnings, suggestions };
    }

    // Type-specific validation
    switch (parsedLink.type) {
      case 'onedrive':
        this.validateOneDriveLink(parsedLink, errors, warnings, suggestions);
        break;
      case 'onenote':
        this.validateOneNoteProtocolLink(parsedLink, errors, warnings, suggestions);
        break;
      case 'filepath':
        this.validateLocalFilePath(parsedLink, errors, warnings, suggestions);
        break;
    }

    // General validations
    this.validateGeneral(parsedLink, errors, warnings, suggestions);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  /**
   * Validate a batch of links
   */
  validateBatch(links: string[]): BatchValidationResult {
    const details: Array<{ link: string; result: ValidationResult }> = [];
    const allErrors: string[] = [];
    const allWarnings: string[] = [];

    for (const link of links) {
      const parsedLink = OneNoteLinkParser.parseLink(link);
      const result = this.validateLink(parsedLink);
      
      details.push({ link, result });
      
      allErrors.push(...result.errors);
      allWarnings.push(...result.warnings);
    }

    const validLinks = details.filter(d => d.result.isValid).length;
    const invalidLinks = details.length - validLinks;

    return {
      totalLinks: links.length,
      validLinks,
      invalidLinks,
      errors: allErrors,
      warnings: allWarnings,
      details
    };
  }

  /**
   * Suggest corrections for a parsed link
   */
  suggestCorrections(parsedLink: ParsedOneNoteLink): string[] {
    const suggestions: string[] = [];

    if (!parsedLink.isValid) {
      switch (parsedLink.type) {
        case 'onedrive':
          suggestions.push('Add wd parameter with filename');
          suggestions.push('Ensure URL includes target(filename.one|sectionId/)');
          suggestions.push('Check that resid parameter is present');
          break;
        case 'onenote':
          suggestions.push('Ensure URL follows onenote:https://d.docs.live.net/... format');
          suggestions.push('Include section-id in hash if needed');
          break;
        case 'filepath':
          suggestions.push('Add .one or .onepkg extension');
          suggestions.push('Check file path is correct');
          break;
        default:
          suggestions.push('Ensure URL is a valid OneNote link');
      }
    }

    return suggestions;
  }

  /**
   * Attempt to recover from parsing errors
   */
  recoverFromError(parsedLink: ParsedOneNoteLink): ErrorRecoveryResult {
    if (parsedLink.isValid) {
      return { attempted: false, success: true };
    }

    try {
      // Attempt common recovery strategies
      const recoveredLink = this.attemptRecovery(parsedLink);
      
      if (recoveredLink && recoveredLink.isValid) {
        return {
          attempted: true,
          success: true,
          recoveredLink
        };
      }

      return {
        attempted: true,
        success: false,
        error: 'Could not recover from parsing error'
      };
    } catch (error) {
      return {
        attempted: true,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Generate comprehensive validation report
   */
  getValidationReport(links: string[]): ValidationReport {
    const batchResult = this.validateBatch(links);
    const successRate = batchResult.totalLinks > 0 
      ? Math.round((batchResult.validLinks / batchResult.totalLinks) * 100) 
      : 0;

    const recommendations = this.generateRecommendations(batchResult);

    return {
      summary: {
        total: batchResult.totalLinks,
        valid: batchResult.validLinks,
        invalid: batchResult.invalidLinks,
        successRate
      },
      details: batchResult.details,
      recommendations
    };
  }

  /**
   * Validate OneDrive link
   */
  private validateOneDriveLink(
    parsedLink: ParsedOneNoteLink, 
    errors: string[], 
    warnings: string[], 
    suggestions: string[]
  ): void {
    if (!parsedLink.fileName) {
      errors.push('Missing filename in OneDrive URL');
    }

    if (parsedLink.originalUrl.length > this.maxUrlLength) {
      warnings.push('URL is unusually long');
    }

    // Check for common OneDrive URL issues
    if (parsedLink.originalUrl.includes('&wd=') && !parsedLink.originalUrl.includes('target(')) {
      suggestions.push('OneDrive URL should include target(filename.one|sectionId/) in wd parameter');
    }
  }

  /**
   * Validate onenote: protocol link
   */
  private validateOneNoteProtocolLink(
    parsedLink: ParsedOneNoteLink, 
    errors: string[], 
    warnings: string[], 
    suggestions: string[]
  ): void {
    if (!parsedLink.fileName) {
      errors.push('Missing filename in onenote: URL');
    }

    if (!parsedLink.originalUrl.includes('d.docs.live.net')) {
      warnings.push('onenote: URL should point to d.docs.live.net');
    }
  }

  /**
   * Validate local file path
   */
  private validateLocalFilePath(
    parsedLink: ParsedOneNoteLink, 
    errors: string[], 
    warnings: string[], 
    suggestions: string[]
  ): void {
    if (!parsedLink.filePath) {
      errors.push('Missing file path');
      return;
    }

    // Check if file exists
    if (!fs.existsSync(parsedLink.filePath)) {
      errors.push('File does not exist');
    }

    // Check file extension
    const ext = path.extname(parsedLink.filePath).toLowerCase();
    if (!this.supportedExtensions.includes(ext)) {
      errors.push(`Unsupported file extension: ${ext}`);
      suggestions.push(`Use one of: ${this.supportedExtensions.join(', ')}`);
    }

    // Check file size (if file exists)
    if (fs.existsSync(parsedLink.filePath)) {
      try {
        const stats = fs.statSync(parsedLink.filePath);
        if (stats.size === 0) {
          warnings.push('File is empty');
        } else if (stats.size > 100 * 1024 * 1024) { // 100MB
          warnings.push('File is very large (>100MB)');
        }
      } catch (error) {
        warnings.push('Could not read file stats');
      }
    }
  }

  /**
   * General validation checks
   */
  private validateGeneral(
    parsedLink: ParsedOneNoteLink, 
    errors: string[], 
    warnings: string[], 
    suggestions: string[]
  ): void {
    // Check filename length
    if (parsedLink.fileName && parsedLink.fileName.length > this.maxFilenameLength) {
      warnings.push('Filename is very long');
    }

    // Check for suspicious characters
    if (parsedLink.fileName && /[<>:"|?*]/.test(parsedLink.fileName)) {
      warnings.push('Filename contains potentially problematic characters');
    }

    // Check URL length
    if (parsedLink.originalUrl.length > this.maxUrlLength) {
      warnings.push('URL is unusually long');
    }
  }

  /**
   * Attempt to recover from parsing errors
   */
  private attemptRecovery(parsedLink: ParsedOneNoteLink): ParsedOneNoteLink | null {
    const originalUrl = parsedLink.originalUrl;

    // Try to fix common OneDrive URL issues
    if (originalUrl.includes('onedrive.live.com') && !originalUrl.includes('&wd=')) {
      // Try to construct a basic wd parameter
      const url = new URL(originalUrl);
      const resid = url.searchParams.get('resid');
      if (resid) {
        const fixedUrl = `${originalUrl}&wd=target%28notebook.one%7Csection-id%2F%29`;
        return OneNoteLinkParser.parseLink(fixedUrl);
      }
    }

    // Try to fix local file path issues
    if (originalUrl.includes('.') && !originalUrl.endsWith('.one') && !originalUrl.endsWith('.onepkg')) {
      const fixedUrl = originalUrl + '.one';
      return OneNoteLinkParser.parseLink(fixedUrl);
    }

    return null;
  }

  /**
   * Generate recommendations based on validation results
   */
  private generateRecommendations(batchResult: BatchValidationResult): string[] {
    const recommendations: string[] = [];

    if (batchResult.invalidLinks > 0) {
      recommendations.push(`Fix ${batchResult.invalidLinks} invalid links before processing`);
    }

    if (batchResult.warnings.length > 0) {
      recommendations.push('Review warnings for potential issues');
    }

    if (batchResult.validLinks === 0) {
      recommendations.push('No valid links found - check input format');
    } else if (batchResult.validLinks < batchResult.totalLinks) {
      recommendations.push('Some links are invalid - consider fixing or removing them');
    }

    return recommendations;
  }
}

// Import OneNoteLinkParser at the end to avoid circular dependency
import { OneNoteLinkParser } from '../../utils/onenote-link-parser';
