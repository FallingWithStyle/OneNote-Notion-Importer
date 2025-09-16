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
    validateContent(content: string): {
        isValid: boolean;
        errors: string[];
    };
}
export declare class ContentConverterService implements IContentConverterService {
    convertPage(page: OneNotePage, options: ContentConversionOptions): Promise<ConversionResult>;
    private reportProgress;
    private createErrorResult;
    private createSuccessResult;
    private handleImages;
    private formatFinalContent;
    convertTextContent(content: string, options: ContentConversionOptions): Promise<string>;
    private applyTextFormatting;
    private convertBoldText;
    private convertItalicText;
    private convertLists;
    private convertHeaders;
    extractImages(content: string, options: ContentConversionOptions): Promise<string[]>;
    validateContent(content: string): {
        isValid: boolean;
        errors: string[];
    };
    private validateEmptyContent;
    private validateBoldFormatting;
    private validateItalicFormatting;
}
//# sourceMappingURL=content-converter.service.d.ts.map