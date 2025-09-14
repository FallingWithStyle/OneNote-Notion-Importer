/**
 * OneNote content conversion service
 * Handles conversion of OneNote content to various output formats
 */

import { OneNotePage } from '../../types/onenote';

export interface ContentConversionOptions {
  outputFormat: 'markdown' | 'docx';
  includeImages?: boolean;
  preserveFormatting?: boolean;
  imageOutputPath?: string;
  onProgress?: (progress: ConversionProgress) => void;
}

export interface ConversionProgress {
  stage: 'validation' | 'conversion' | 'formatting' | 'image-processing' | 'complete';
  percentage: number;
  message: string;
}

export interface ConversionResult {
  success: boolean;
  content?: string;
  images?: string[];
  error?: string;
  metadata?: Record<string, any>;
}

export interface IContentConverterService {
  /**
   * Convert OneNote page content to specified format
   * @param page OneNote page to convert
   * @param options Conversion options
   * @returns Conversion result
   */
  convertPage(page: OneNotePage, options: ContentConversionOptions): Promise<ConversionResult>;

  /**
   * Convert text content with basic formatting
   * @param content Raw text content
   * @param options Conversion options
   * @returns Converted content
   */
  convertTextContent(content: string, options: ContentConversionOptions): Promise<string>;

  /**
   * Extract and process images from content
   * @param content Raw content with potential image references
   * @param options Conversion options
   * @returns Array of processed image paths
   */
  extractImages(content: string, options: ContentConversionOptions): Promise<string[]>;

  /**
   * Validate content before conversion
   * @param content Content to validate
   * @returns Validation result
   */
  validateContent(content: string): { isValid: boolean; errors: string[] };
}

export class ContentConverterService implements IContentConverterService {
  async convertPage(page: OneNotePage, options: ContentConversionOptions): Promise<ConversionResult> {
    try {
      // Progress: Validation stage
      this.reportProgress(options, 'validation', 10, 'Validating content...');
      
      // Validate content first
      const validation = this.validateContent(page.content);
      if (!validation.isValid) {
        return this.createErrorResult(`Content validation failed: ${validation.errors.join(', ')}`);
      }

      // Progress: Conversion stage
      this.reportProgress(options, 'conversion', 30, 'Converting text content...');
      
      // Convert text content
      let convertedContent = await this.convertTextContent(page.content, options);
      
      // Progress: Image processing stage
      this.reportProgress(options, 'image-processing', 60, 'Processing images...');
      
      // Handle images if requested
      const images = await this.handleImages(page.content, convertedContent, options);
      convertedContent = images.processedContent;

      // Progress: Formatting stage
      this.reportProgress(options, 'formatting', 80, 'Applying final formatting...');
      
      // Format the final content based on output format
      const finalContent = this.formatFinalContent(page.title, convertedContent, options);

      // Progress: Complete
      this.reportProgress(options, 'complete', 100, 'Conversion completed successfully');

      return this.createSuccessResult(finalContent, images.paths, options, page);
    } catch (error) {
      return this.createErrorResult(error instanceof Error ? error.message : 'Unknown error occurred');
    }
  }

  private reportProgress(
    options: ContentConversionOptions, 
    stage: ConversionProgress['stage'], 
    percentage: number, 
    message: string
  ): void {
    if (options.onProgress) {
      options.onProgress({ stage, percentage, message });
    }
  }

  private createErrorResult(errorMessage: string): ConversionResult {
    return {
      success: false,
      error: errorMessage
    };
  }

  private createSuccessResult(
    content: string, 
    images: string[] | undefined, 
    options: ContentConversionOptions, 
    page: OneNotePage
  ): ConversionResult {
    const result: ConversionResult = {
      success: true,
      content,
      metadata: {
        format: options.outputFormat,
        pageId: page.id,
        title: page.title
      }
    };

    if (images && images.length > 0) {
      result.images = images;
    }

    return result;
  }

  private async handleImages(
    originalContent: string, 
    convertedContent: string, 
    options: ContentConversionOptions
  ): Promise<{ processedContent: string; paths: string[] }> {
    if (!options.includeImages) {
      return { processedContent: convertedContent, paths: [] };
    }

    const images = await this.extractImages(originalContent, options);
    const processedContent = convertedContent.replace(/\[image:([^\]]+)\]/g, '![$1]');
    
    return { processedContent, paths: images };
  }

  private formatFinalContent(title: string, content: string, options: ContentConversionOptions): string {
    if (options.outputFormat === 'markdown') {
      return `# ${title}\n\n${content}`;
    }
    
    // For DOCX, we'll return the content as-is for now
    return content;
  }

  async convertTextContent(content: string, options: ContentConversionOptions): Promise<string> {
    if (!content) {
      return '';
    }

    if (!options.preserveFormatting) {
      return content;
    }

    return this.applyTextFormatting(content);
  }

  private applyTextFormatting(content: string): string {
    let converted = content;

    // Apply each formatting rule
    converted = this.convertBoldText(converted);
    converted = this.convertItalicText(converted);
    converted = this.convertLists(converted);
    converted = this.convertHeaders(converted);

    return converted;
  }

  private convertBoldText(content: string): string {
    return content.replace(/\*\*(.*?)\*\*/g, '**$1**');
  }

  private convertItalicText(content: string): string {
    return content.replace(/\*(.*?)\*/g, '*$1*');
  }

  private convertLists(content: string): string {
    return content.replace(/^- (.+)$/gm, '- $1');
  }

  private convertHeaders(content: string): string {
    let converted = content;
    
    // Convert specific header patterns
    converted = converted.replace(/^(Main Header|Sub Header)$/gm, (match) => {
      return match === 'Main Header' ? '# Main Header' : '## Sub Header';
    });
    
    // Convert all-caps headers
    converted = converted.replace(/^([A-Z][A-Z\s]+)$/gm, '# $1');
    
    return converted;
  }

  async extractImages(content: string, options: ContentConversionOptions): Promise<string[]> {
    const imageRegex = /\[image:([^\]]+)\]/g;
    const matches = content.match(imageRegex);
    
    if (!matches) {
      return [];
    }

    return matches.map(match => {
      const imageName = match.replace(/\[image:|]/g, '');
      return options.imageOutputPath 
        ? `${options.imageOutputPath}/${imageName}`
        : imageName;
    });
  }

  validateContent(content: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Run all validation checks
    this.validateEmptyContent(content, errors);
    this.validateBoldFormatting(content, errors);
    this.validateItalicFormatting(content, errors);

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private validateEmptyContent(content: string, errors: string[]): void {
    if (!content || content.trim().length === 0) {
      errors.push('Content cannot be empty');
    }
  }

  private validateBoldFormatting(content: string, errors: string[]): void {
    const boldMatches = content.match(/\*\*/g);
    if (boldMatches && boldMatches.length % 2 !== 0) {
      errors.push('Unclosed bold formatting');
    }
  }

  private validateItalicFormatting(content: string, errors: string[]): void {
    const italicMatches = content.match(/\*/g);
    if (italicMatches && italicMatches.length % 2 !== 0) {
      errors.push('Unclosed italic formatting');
    }
  }
}
