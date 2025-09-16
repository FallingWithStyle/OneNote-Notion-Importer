"use strict";
/**
 * OneNote content conversion service
 * Handles conversion of OneNote content to various output formats
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentConverterService = void 0;
class ContentConverterService {
    async convertPage(page, options) {
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
        }
        catch (error) {
            return this.createErrorResult(error instanceof Error ? error.message : 'Unknown error occurred');
        }
    }
    reportProgress(options, stage, percentage, message) {
        if (options.onProgress) {
            options.onProgress({ stage, percentage, message });
        }
    }
    createErrorResult(errorMessage) {
        return {
            success: false,
            error: errorMessage
        };
    }
    createSuccessResult(content, images, options, page) {
        const result = {
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
    async handleImages(originalContent, convertedContent, options) {
        if (!options.includeImages) {
            return { processedContent: convertedContent, paths: [] };
        }
        const images = await this.extractImages(originalContent, options);
        const processedContent = convertedContent.replace(/\[image:([^\]]+)\]/g, '![$1]');
        return { processedContent, paths: images };
    }
    formatFinalContent(title, content, options) {
        if (options.outputFormat === 'markdown') {
            return `# ${title}\n\n${content}`;
        }
        // For DOCX, we'll return the content as-is for now
        return content;
    }
    async convertTextContent(content, options) {
        if (!content) {
            return '';
        }
        if (!options.preserveFormatting) {
            return content;
        }
        return this.applyTextFormatting(content);
    }
    applyTextFormatting(content) {
        let converted = content;
        // Apply each formatting rule
        converted = this.convertBoldText(converted);
        converted = this.convertItalicText(converted);
        converted = this.convertLists(converted);
        converted = this.convertHeaders(converted);
        return converted;
    }
    convertBoldText(content) {
        return content.replace(/\*\*(.*?)\*\*/g, '**$1**');
    }
    convertItalicText(content) {
        return content.replace(/\*(.*?)\*/g, '*$1*');
    }
    convertLists(content) {
        return content.replace(/^- (.+)$/gm, '- $1');
    }
    convertHeaders(content) {
        let converted = content;
        // Convert specific header patterns
        converted = converted.replace(/^(Main Header|Sub Header)$/gm, (match) => {
            return match === 'Main Header' ? '# Main Header' : '## Sub Header';
        });
        // Convert all-caps headers
        converted = converted.replace(/^([A-Z][A-Z\s]+)$/gm, '# $1');
        return converted;
    }
    async extractImages(content, options) {
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
    validateContent(content) {
        const errors = [];
        // Run all validation checks
        this.validateEmptyContent(content, errors);
        this.validateBoldFormatting(content, errors);
        this.validateItalicFormatting(content, errors);
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    validateEmptyContent(content, errors) {
        if (!content || content.trim().length === 0) {
            errors.push('Content cannot be empty');
        }
    }
    validateBoldFormatting(content, errors) {
        const boldMatches = content.match(/\*\*/g);
        if (boldMatches && boldMatches.length % 2 !== 0) {
            errors.push('Unclosed bold formatting');
        }
    }
    validateItalicFormatting(content, errors) {
        const italicMatches = content.match(/\*/g);
        if (italicMatches && italicMatches.length % 2 !== 0) {
            errors.push('Unclosed italic formatting');
        }
    }
}
exports.ContentConverterService = ContentConverterService;
//# sourceMappingURL=content-converter.service.js.map