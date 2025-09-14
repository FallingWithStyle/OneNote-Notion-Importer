/**
 * Advanced Content Converter Service Tests
 * Tests for advanced OneNote content conversion functionality
 */

import { 
  AdvancedContentConverterService, 
  AdvancedConversionOptions, 
  AdvancedConversionResult,
  TableData,
  AttachmentData,
  TagData
} from '../../../../src/services/onenote/advanced-content-converter.service';
import { OneNotePage } from '../../../../src/types/onenote';

describe('AdvancedContentConverterService', () => {
  let converter: AdvancedContentConverterService;

  beforeEach(() => {
    converter = new AdvancedContentConverterService();
  });

  describe('convertAdvancedPage', () => {
    it('should convert a page with tables to markdown', async () => {
      // Arrange
      const page: OneNotePage = {
        id: 'page-1',
        title: 'Page with Tables',
        content: 'Here is a table:\n| Name | Age | City |\n| John | 25 | NYC |\n| Jane | 30 | LA |',
        createdDate: new Date('2024-01-01'),
        lastModifiedDate: new Date('2024-01-01'),
        metadata: {}
      };

      const options: AdvancedConversionOptions = {
        outputFormat: 'markdown',
        includeMetadata: true,
        preserveTables: true,
        performanceMode: 'balanced'
      };

      // Act
      const result = await converter.convertAdvancedPage(page, options);

      // Assert
      expect(result.success).toBe(true);
      expect(result.content).toContain('| Name | Age | City |');
      expect(result.content).toContain('| John | 25 | NYC |');
      expect(result.tables).toHaveLength(1);
      expect(result.tables?.[0]?.headers).toEqual(['Name', 'Age', 'City']);
      expect(result.tables?.[0]?.rows).toHaveLength(2);
    });

    it('should convert a page with code blocks', async () => {
      // Arrange
      const page: OneNotePage = {
        id: 'page-2',
        title: 'Page with Code',
        content: 'Here is some code:\n```javascript\nfunction hello() {\n  console.log("Hello World");\n}\n```',
        createdDate: new Date('2024-01-01'),
        lastModifiedDate: new Date('2024-01-01'),
        metadata: {}
      };

      const options: AdvancedConversionOptions = {
        outputFormat: 'markdown',
        preserveCodeBlocks: true,
        performanceMode: 'balanced'
      };

      // Act
      const result = await converter.convertAdvancedPage(page, options);

      // Assert
      expect(result.success).toBe(true);
      expect(result.content).toContain('```javascript');
      expect(result.content).toContain('function hello() {');
      expect(result.content).toContain('console.log("Hello World");');
      expect(result.content).toContain('```');
    });

    it('should extract and convert OneNote tags', async () => {
      // Arrange
      const page: OneNotePage = {
        id: 'page-3',
        title: 'Page with Tags',
        content: 'This is important! [TAG:important] and this is a question [TAG:question]',
        createdDate: new Date('2024-01-01'),
        lastModifiedDate: new Date('2024-01-01'),
        metadata: {}
      };

      const options: AdvancedConversionOptions = {
        outputFormat: 'notion',
        convertTags: true,
        performanceMode: 'balanced'
      };

      // Act
      const result = await converter.convertAdvancedPage(page, options);

      // Assert
      expect(result.success).toBe(true);
      expect(result.tags).toHaveLength(2);
      expect(result.tags?.[0]?.name).toBe('important');
      expect(result.tags?.[1]?.name).toBe('question');
      expect(result.content).not.toContain('[TAG:important]');
      expect(result.content).not.toContain('[TAG:question]');
    });

    it('should handle attachments and embedded files', async () => {
      // Arrange
      const page: OneNotePage = {
        id: 'page-4',
        title: 'Page with Attachments',
        content: 'Here is a document: [ATTACHMENT:document.pdf] and an image: [ATTACHMENT:image.jpg]',
        createdDate: new Date('2024-01-01'),
        lastModifiedDate: new Date('2024-01-01'),
        metadata: {}
      };

      const options: AdvancedConversionOptions = {
        outputFormat: 'markdown',
        handleAttachments: true,
        performanceMode: 'balanced'
      };

      // Act
      const result = await converter.convertAdvancedPage(page, options);

      // Assert
      expect(result.success).toBe(true);
      expect(result.attachments).toHaveLength(2);
      expect(result.attachments?.[0]?.name).toBe('document.pdf');
      expect(result.attachments?.[1]?.name).toBe('image.jpg');
      expect(result.content).toContain('[document.pdf]');
      expect(result.content).toContain('[image.jpg]');
    });

    it('should preserve page metadata when requested', async () => {
      // Arrange
      const page: OneNotePage = {
        id: 'page-5',
        title: 'Page with Metadata',
        content: 'Simple content',
        createdDate: new Date('2024-01-01T10:00:00Z'),
        lastModifiedDate: new Date('2024-01-02T15:30:00Z'),
        metadata: { author: 'John Doe', category: 'Work' }
      };

      const options: AdvancedConversionOptions = {
        outputFormat: 'markdown',
        includeMetadata: true,
        performanceMode: 'balanced'
      };

      // Act
      const result = await converter.convertAdvancedPage(page, options);

      // Assert
      expect(result.success).toBe(true);
      expect(result.metadata).toBeDefined();
      expect(result.metadata!.createdDate).toBeDefined();
      expect(result.metadata!.lastModifiedDate).toBeDefined();
      expect(result.metadata!.author).toBe('John Doe');
      expect(result.metadata!.category).toBe('Work');
    });

    it('should report progress during conversion', async () => {
      // Arrange
      const page: OneNotePage = {
        id: 'page-6',
        title: 'Progress Test Page',
        content: 'Test content with table:\n| A | B |\n| 1 | 2 |',
        createdDate: new Date('2024-01-01'),
        lastModifiedDate: new Date('2024-01-01'),
        metadata: {}
      };

      const progressReports: any[] = [];
      const options: AdvancedConversionOptions = {
        outputFormat: 'markdown',
        preserveTables: true,
        includeMetadata: true,
        performanceMode: 'balanced',
        onProgress: (progress) => progressReports.push(progress)
      };

      // Act
      await converter.convertAdvancedPage(page, options);

      // Assert
      expect(progressReports.length).toBeGreaterThan(0);
      expect(progressReports[0]?.stage).toBe('parsing');
      expect(progressReports[progressReports.length - 1]?.stage).toBe('complete');
    });
  });

  describe('extractTables', () => {
    it('should extract simple tables from content', async () => {
      // Arrange
      const content = 'Here is a table:\n| Name | Age |\n| John | 25 |\n| Jane | 30 |';
      const options: AdvancedConversionOptions = {
        outputFormat: 'markdown',
        preserveTables: true,
        performanceMode: 'balanced'
      };

      // Act
      const result = await converter.extractTables(content, options);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]?.headers).toEqual(['Name', 'Age']);
      expect(result[0]?.rows).toHaveLength(2);
      expect(result[0]?.rows[0]).toEqual(['John', '25']);
      expect(result[0]?.rows[1]).toEqual(['Jane', '30']);
    });

    it('should extract tables with captions', async () => {
      // Arrange
      const content = 'Table 1: Employee Data\n| Name | Department |\n| Alice | Engineering |';
      const options: AdvancedConversionOptions = {
        outputFormat: 'markdown',
        preserveTables: true,
        performanceMode: 'balanced'
      };

      // Act
      const result = await converter.extractTables(content, options);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]?.caption).toBe('Employee Data');
    });

    it('should return empty array when no tables found', async () => {
      // Arrange
      const content = 'Just plain text without any tables';
      const options: AdvancedConversionOptions = {
        outputFormat: 'markdown',
        preserveTables: true,
        performanceMode: 'balanced'
      };

      // Act
      const result = await converter.extractTables(content, options);

      // Assert
      expect(result).toHaveLength(0);
    });
  });

  describe('extractAttachments', () => {
    it('should extract file attachments from content', async () => {
      // Arrange
      const content = 'Document: [ATTACHMENT:report.pdf] Image: [ATTACHMENT:photo.jpg]';
      const options: AdvancedConversionOptions = {
        outputFormat: 'markdown',
        handleAttachments: true,
        performanceMode: 'balanced'
      };

      // Act
      const result = await converter.extractAttachments(content, options);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0]?.name).toBe('report.pdf');
      expect(result[0]?.type).toBe('pdf');
      expect(result[1]?.name).toBe('photo.jpg');
      expect(result[1]?.type).toBe('jpg');
    });

    it('should extract attachment metadata', async () => {
      // Arrange
      const content = 'File: [ATTACHMENT:document.docx:size=1024:type=docx]';
      const options: AdvancedConversionOptions = {
        outputFormat: 'markdown',
        handleAttachments: true,
        performanceMode: 'balanced'
      };

      // Act
      const result = await converter.extractAttachments(content, options);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]?.name).toBe('document.docx');
      expect(result[0]?.type).toBe('docx');
      expect(result[0]?.size).toBe(1024);
    });
  });

  describe('extractTags', () => {
    it('should extract OneNote tags from content', async () => {
      // Arrange
      const content = 'Important note [TAG:important] and question [TAG:question:color=blue]';
      const options: AdvancedConversionOptions = {
        outputFormat: 'notion',
        convertTags: true,
        performanceMode: 'balanced'
      };

      // Act
      const result = await converter.extractTags(content, options);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0]?.name).toBe('important');
      expect(result[1]?.name).toBe('question');
      expect(result[1]?.color).toBe('blue');
    });

    it('should categorize tags by type', async () => {
      // Arrange
      const content = 'Task [TAG:task:category=work] and idea [TAG:idea:category=personal]';
      const options: AdvancedConversionOptions = {
        outputFormat: 'notion',
        convertTags: true,
        performanceMode: 'balanced'
      };

      // Act
      const result = await converter.extractTags(content, options);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0]?.category).toBe('work');
      expect(result[1]?.category).toBe('personal');
    });
  });

  describe('extractPageMetadata', () => {
    it('should extract basic page metadata', async () => {
      // Arrange
      const page: OneNotePage = {
        id: 'page-1',
        title: 'Test Page',
        content: 'Content',
        createdDate: new Date('2024-01-01T10:00:00Z'),
        lastModifiedDate: new Date('2024-01-02T15:30:00Z'),
        metadata: { author: 'John Doe', category: 'Work' }
      };

      const options: AdvancedConversionOptions = {
        outputFormat: 'markdown',
        includeMetadata: true,
        performanceMode: 'balanced'
      };

      // Act
      const result = await converter.extractPageMetadata(page, options);

      // Assert
      expect(result.id).toBe('page-1');
      expect(result.title).toBe('Test Page');
      expect(result.createdDate).toBeDefined();
      expect(result.lastModifiedDate).toBeDefined();
      expect(result.author).toBe('John Doe');
      expect(result.category).toBe('Work');
    });
  });

  describe('convertTablesToMarkdown', () => {
    it('should convert table data to markdown format', () => {
      // Arrange
      const tables: TableData[] = [{
        headers: ['Name', 'Age', 'City'],
        rows: [['John', '25', 'NYC'], ['Jane', '30', 'LA']],
        caption: 'Employee Data'
      }];

      const options: AdvancedConversionOptions = {
        outputFormat: 'markdown',
        preserveTables: true,
        performanceMode: 'balanced'
      };

      // Act
      const result = converter.convertTablesToMarkdown(tables, options);

      // Assert
      expect(result).toContain('## Employee Data');
      expect(result).toContain('| Name | Age | City |');
      expect(result).toContain('| John | 25 | NYC |');
      expect(result).toContain('| Jane | 30 | LA |');
    });
  });

  describe('convertCodeBlocks', () => {
    it('should convert code blocks to markdown format', () => {
      // Arrange
      const content = 'Here is code:\n```javascript\nfunction test() {\n  return "hello";\n}\n```';
      const options: AdvancedConversionOptions = {
        outputFormat: 'markdown',
        preserveCodeBlocks: true,
        performanceMode: 'balanced'
      };

      // Act
      const result = converter.convertCodeBlocks(content, options);

      // Assert
      expect(result).toContain('```javascript');
      expect(result).toContain('function test() {');
      expect(result).toContain('return "hello";');
      expect(result).toContain('```');
    });

    it('should handle multiple code blocks', () => {
      // Arrange
      const content = 'Code 1:\n```python\nprint("hello")\n```\nCode 2:\n```bash\necho "world"\n```';
      const options: AdvancedConversionOptions = {
        outputFormat: 'markdown',
        preserveCodeBlocks: true,
        performanceMode: 'balanced'
      };

      // Act
      const result = converter.convertCodeBlocks(content, options);

      // Assert
      expect(result).toContain('```python');
      expect(result).toContain('print("hello")');
      expect(result).toContain('```bash');
      expect(result).toContain('echo "world"');
    });
  });

  describe('Edge Cases and Performance', () => {
    it('should handle special characters and encoding issues', async () => {
      // Arrange
      const page: OneNotePage = {
        id: 'page-1',
        title: 'Special Characters Test',
        content: 'Smart quotes: "Hello" and \'World\'. Em dash — and ellipsis…',
        createdDate: new Date('2024-01-01'),
        lastModifiedDate: new Date('2024-01-01'),
        metadata: {}
      };

      const options: AdvancedConversionOptions = {
        outputFormat: 'markdown',
        performanceMode: 'thorough'
      };

      // Act
      const result = await converter.convertAdvancedPage(page, options);

      // Assert
      expect(result.success).toBe(true);
      expect(result.content).toContain('"Hello"');
      expect(result.content).toContain("'World'");
      expect(result.content).toContain('--');
      expect(result.content).toContain('...');
    });

    it('should handle nested lists properly', async () => {
      // Arrange
      const page: OneNotePage = {
        id: 'page-2',
        title: 'Nested Lists Test',
        content: '  - Level 1\n    - Level 2\n      - Level 3',
        createdDate: new Date('2024-01-01'),
        lastModifiedDate: new Date('2024-01-01'),
        metadata: {}
      };

      const options: AdvancedConversionOptions = {
        outputFormat: 'markdown',
        performanceMode: 'thorough'
      };

      // Act
      const result = await converter.convertAdvancedPage(page, options);

      // Assert
      expect(result.success).toBe(true);
      expect(result.content).toContain('- Level 1');
      expect(result.content).toContain('- Level 2');
      expect(result.content).toContain('- Level 3');
    });

    it('should optimize for performance in fast mode', async () => {
      // Arrange
      const page: OneNotePage = {
        id: 'page-3',
        title: 'Performance Test',
        content: 'Large content with many special characters: "quotes" and \'apostrophes\' and — dashes and… ellipsis',
        createdDate: new Date('2024-01-01'),
        lastModifiedDate: new Date('2024-01-01'),
        metadata: {}
      };

      const options: AdvancedConversionOptions = {
        outputFormat: 'markdown',
        performanceMode: 'fast'
      };

      // Act
      const result = await converter.convertAdvancedPage(page, options);

      // Assert
      expect(result.success).toBe(true);
      expect(result.performance?.processingTime).toBeLessThan(100); // Should be very fast
    });

    it('should apply thorough processing in thorough mode', async () => {
      // Arrange
      const page: OneNotePage = {
        id: 'page-4',
        title: 'Thorough Processing Test',
        content: 'Content with "smart quotes" and — em dashes and… ellipsis',
        createdDate: new Date('2024-01-01'),
        lastModifiedDate: new Date('2024-01-01'),
        metadata: {}
      };

      const options: AdvancedConversionOptions = {
        outputFormat: 'markdown',
        performanceMode: 'thorough'
      };

      // Act
      const result = await converter.convertAdvancedPage(page, options);

      // Assert
      expect(result.success).toBe(true);
      expect(result.content).toContain('"smart quotes"');
      expect(result.content).toContain('--');
      expect(result.content).toContain('...');
    });
  });
});
