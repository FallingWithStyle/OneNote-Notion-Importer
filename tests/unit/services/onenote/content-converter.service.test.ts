/**
 * Content Converter Service Tests
 * Tests for OneNote content conversion functionality
 */

import { ContentConverterService, ContentConversionOptions, ConversionResult, ConversionProgress } from '../../../../src/services/onenote/content-converter.service';
import { OneNotePage } from '../../../../src/types/onenote';

describe('ContentConverterService', () => {
  let converter: ContentConverterService;

  beforeEach(() => {
    converter = new ContentConverterService();
  });

  describe('convertPage', () => {
    it('should convert a simple text page to markdown', async () => {
      // Arrange
      const page: OneNotePage = {
        id: 'page-1',
        title: 'Test Page',
        content: 'This is a simple test page with some content.',
        createdDate: new Date('2024-01-01'),
        lastModifiedDate: new Date('2024-01-01'),
        metadata: {}
      };

      const options: ContentConversionOptions = {
        outputFormat: 'markdown',
        includeImages: false,
        preserveFormatting: true
      };

      // Act
      const result = await converter.convertPage(page, options);

      // Assert
      expect(result.success).toBe(true);
      expect(result.content).toContain('# Test Page');
      expect(result.content).toContain('This is a simple test page with some content.');
      expect(result.error).toBeUndefined();
    });

    it('should convert a page with basic formatting to markdown', async () => {
      // Arrange
      const page: OneNotePage = {
        id: 'page-2',
        title: 'Formatted Page',
        content: 'This is **bold text** and *italic text* and a list:\n- Item 1\n- Item 2',
        createdDate: new Date('2024-01-01'),
        lastModifiedDate: new Date('2024-01-01'),
        metadata: {}
      };

      const options: ContentConversionOptions = {
        outputFormat: 'markdown',
        includeImages: false,
        preserveFormatting: true
      };

      // Act
      const result = await converter.convertPage(page, options);

      // Assert
      expect(result.success).toBe(true);
      expect(result.content).toContain('# Formatted Page');
      expect(result.content).toContain('**bold text**');
      expect(result.content).toContain('*italic text*');
      expect(result.content).toContain('- Item 1');
      expect(result.content).toContain('- Item 2');
    });

    it('should handle pages with images', async () => {
      // Arrange
      const page: OneNotePage = {
        id: 'page-3',
        title: 'Page with Images',
        content: 'This page has an image: [image:test-image.png]',
        createdDate: new Date('2024-01-01'),
        lastModifiedDate: new Date('2024-01-01'),
        metadata: {}
      };

      const options: ContentConversionOptions = {
        outputFormat: 'markdown',
        includeImages: true,
        preserveFormatting: true,
        imageOutputPath: '/tmp/images'
      };

      // Act
      const result = await converter.convertPage(page, options);

      // Assert
      expect(result.success).toBe(true);
      expect(result.images).toHaveLength(1);
      expect(result.images![0]).toContain('test-image.png');
      expect(result.content).toContain('![test-image.png]');
    });

    it('should convert to DOCX format when specified', async () => {
      // Arrange
      const page: OneNotePage = {
        id: 'page-4',
        title: 'DOCX Page',
        content: 'This will be converted to DOCX format.',
        createdDate: new Date('2024-01-01'),
        lastModifiedDate: new Date('2024-01-01'),
        metadata: {}
      };

      const options: ContentConversionOptions = {
        outputFormat: 'docx',
        includeImages: false,
        preserveFormatting: true
      };

      // Act
      const result = await converter.convertPage(page, options);

      // Assert
      expect(result.success).toBe(true);
      expect(result.content).toBeDefined();
      expect(result.metadata?.format).toBe('docx');
    });

    it('should handle conversion errors gracefully', async () => {
      // Arrange
      const page: OneNotePage = {
        id: 'page-5',
        title: 'Error Page',
        content: 'This page will cause an error',
        createdDate: new Date('2024-01-01'),
        lastModifiedDate: new Date('2024-01-01'),
        metadata: {}
      };

      const options: ContentConversionOptions = {
        outputFormat: 'markdown',
        includeImages: false,
        preserveFormatting: true
      };

      // Mock the converter to throw an error
      jest.spyOn(converter, 'convertPage').mockRejectedValue(new Error('Conversion failed'));

      // Act & Assert
      await expect(converter.convertPage(page, options)).rejects.toThrow('Conversion failed');
    });
  });

  describe('convertTextContent', () => {
    it('should convert basic text to markdown', async () => {
      // Arrange
      const content = 'Simple text content';
      const options: ContentConversionOptions = {
        outputFormat: 'markdown',
        includeImages: false,
        preserveFormatting: true
      };

      // Act
      const result = await converter.convertTextContent(content, options);

      // Assert
      expect(result).toBe('Simple text content');
    });

    it('should convert bold and italic formatting', async () => {
      // Arrange
      const content = 'This is **bold** and *italic* text';
      const options: ContentConversionOptions = {
        outputFormat: 'markdown',
        includeImages: false,
        preserveFormatting: true
      };

      // Act
      const result = await converter.convertTextContent(content, options);

      // Assert
      expect(result).toBe('This is **bold** and *italic* text');
    });

    it('should convert lists to markdown format', async () => {
      // Arrange
      const content = 'Here is a list:\n- First item\n- Second item\n- Third item';
      const options: ContentConversionOptions = {
        outputFormat: 'markdown',
        includeImages: false,
        preserveFormatting: true
      };

      // Act
      const result = await converter.convertTextContent(content, options);

      // Assert
      expect(result).toContain('- First item');
      expect(result).toContain('- Second item');
      expect(result).toContain('- Third item');
    });

    it('should convert headers to markdown format', async () => {
      // Arrange
      const content = 'Main Header\nSub Header\nRegular text';
      const options: ContentConversionOptions = {
        outputFormat: 'markdown',
        includeImages: false,
        preserveFormatting: true
      };

      // Act
      const result = await converter.convertTextContent(content, options);

      // Assert
      expect(result).toContain('# Main Header');
      expect(result).toContain('## Sub Header');
      expect(result).toContain('Regular text');
    });
  });

  describe('extractImages', () => {
    it('should extract image references from content', async () => {
      // Arrange
      const content = 'Text with [image:image1.png] and [image:image2.jpg]';
      const options: ContentConversionOptions = {
        outputFormat: 'markdown',
        includeImages: true,
        preserveFormatting: true,
        imageOutputPath: '/tmp/images'
      };

      // Act
      const result = await converter.extractImages(content, options);

      // Assert
      expect(result).toHaveLength(2);
      expect(result).toContain('/tmp/images/image1.png');
      expect(result).toContain('/tmp/images/image2.jpg');
    });

    it('should return empty array when no images found', async () => {
      // Arrange
      const content = 'Text without any images';
      const options: ContentConversionOptions = {
        outputFormat: 'markdown',
        includeImages: true,
        preserveFormatting: true,
        imageOutputPath: '/tmp/images'
      };

      // Act
      const result = await converter.extractImages(content, options);

      // Assert
      expect(result).toHaveLength(0);
    });
  });

  describe('validateContent', () => {
    it('should validate valid content', () => {
      // Arrange
      const content = 'Valid content with proper formatting';

      // Act
      const result = converter.validateContent(content);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid content', () => {
      // Arrange
      const content = '';

      // Act
      const result = converter.validateContent(content);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should detect malformed formatting', () => {
      // Arrange
      const content = 'Text with **unclosed bold and *unclosed italic';

      // Act
      const result = converter.validateContent(content);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Unclosed bold formatting');
      expect(result.errors).toContain('Unclosed italic formatting');
    });
  });

  describe('Progress Tracking', () => {
    it('should report progress during conversion', async () => {
      // Arrange
      const page: OneNotePage = {
        id: 'page-1',
        title: 'Test Page',
        content: 'Test content',
        createdDate: new Date('2024-01-01'),
        lastModifiedDate: new Date('2024-01-01'),
        metadata: {}
      };

      const progressReports: ConversionProgress[] = [];
      const options: ContentConversionOptions = {
        outputFormat: 'markdown',
        includeImages: false,
        preserveFormatting: true,
        onProgress: (progress) => progressReports.push(progress)
      };

      // Act
      await converter.convertPage(page, options);

      // Assert
      expect(progressReports).toHaveLength(5);
      expect(progressReports[0]?.stage).toBe('validation');
      expect(progressReports[0]?.percentage).toBe(10);
      expect(progressReports[1]?.stage).toBe('conversion');
      expect(progressReports[1]?.percentage).toBe(30);
      expect(progressReports[2]?.stage).toBe('image-processing');
      expect(progressReports[2]?.percentage).toBe(60);
      expect(progressReports[3]?.stage).toBe('formatting');
      expect(progressReports[3]?.percentage).toBe(80);
      expect(progressReports[4]?.stage).toBe('complete');
      expect(progressReports[4]?.percentage).toBe(100);
    });

    it('should work without progress callback', async () => {
      // Arrange
      const page: OneNotePage = {
        id: 'page-1',
        title: 'Test Page',
        content: 'Test content',
        createdDate: new Date('2024-01-01'),
        lastModifiedDate: new Date('2024-01-01'),
        metadata: {}
      };

      const options: ContentConversionOptions = {
        outputFormat: 'markdown',
        includeImages: false,
        preserveFormatting: true
        // No onProgress callback
      };

      // Act & Assert - should not throw
      const result = await converter.convertPage(page, options);
      expect(result.success).toBe(true);
    });
  });
});
