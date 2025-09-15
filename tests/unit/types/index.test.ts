import {
  OneNoteNotebook,
  OneNoteSection,
  OneNotePage,
  OneNoteContent,
  OneNoteImage,
  OneNoteAttachment,
  OneNoteTable,
  OneNoteTableRow,
  OneNoteTableCell,
  OneNoteList,
  OneNoteListItem,
  NotionPage,
  NotionContent,
  NotionBlock,
  NotionImage,
  ConversionOptions,
  ConversionResult,
  ConversionError,
  ConversionWarning,
  CliOptions,
  FileService,
  ConversionService,
  NotionService,
} from '../../../src/types';

describe('Type Definitions', () => {
  describe('OneNote Types', () => {
    it('should define OneNoteNotebook interface correctly', () => {
      const notebook: OneNoteNotebook = {
        id: 'notebook-1',
        name: 'Test Notebook',
        sections: [],
        createdTime: new Date('2023-01-01'),
        lastModifiedTime: new Date('2023-01-02'),
      };

      expect(notebook.id).toBe('notebook-1');
      expect(notebook.name).toBe('Test Notebook');
      expect(Array.isArray(notebook.sections)).toBe(true);
      expect(notebook.createdTime).toBeInstanceOf(Date);
      expect(notebook.lastModifiedTime).toBeInstanceOf(Date);
    });

    it('should define OneNoteSection interface correctly', () => {
      const section: OneNoteSection = {
        id: 'section-1',
        name: 'Test Section',
        pages: [],
        createdTime: new Date('2023-01-01'),
        lastModifiedTime: new Date('2023-01-02'),
      };

      expect(section.id).toBe('section-1');
      expect(section.name).toBe('Test Section');
      expect(Array.isArray(section.pages)).toBe(true);
      expect(section.createdTime).toBeInstanceOf(Date);
      expect(section.lastModifiedTime).toBeInstanceOf(Date);
    });

    it('should define OneNotePage interface correctly', () => {
      const page: OneNotePage = {
        id: 'page-1',
        name: 'Test Page',
        content: {
          text: 'Test content',
          images: [],
          attachments: [],
          tables: [],
          lists: [],
        },
        createdTime: new Date('2023-01-01'),
        lastModifiedTime: new Date('2023-01-02'),
        tags: ['tag1', 'tag2'],
      };

      expect(page.id).toBe('page-1');
      expect(page.name).toBe('Test Page');
      expect(page.content).toBeDefined();
      expect(page.tags).toEqual(['tag1', 'tag2']);
    });

    it('should define OneNoteContent interface correctly', () => {
      const content: OneNoteContent = {
        text: 'Test text content',
        images: [],
        attachments: [],
        tables: [],
        lists: [],
      };

      expect(content.text).toBe('Test text content');
      expect(Array.isArray(content.images)).toBe(true);
      expect(Array.isArray(content.attachments)).toBe(true);
      expect(Array.isArray(content.tables)).toBe(true);
      expect(Array.isArray(content.lists)).toBe(true);
    });

    it('should define OneNoteImage interface correctly', () => {
      const image: OneNoteImage = {
        id: 'img-1',
        name: 'test.jpg',
        path: '/path/to/image.jpg',
        width: 100,
        height: 200,
        alt: 'Test image',
      };

      expect(image.id).toBe('img-1');
      expect(image.name).toBe('test.jpg');
      expect(image.path).toBe('/path/to/image.jpg');
      expect(image.width).toBe(100);
      expect(image.height).toBe(200);
      expect(image.alt).toBe('Test image');
    });

    it('should define OneNoteAttachment interface correctly', () => {
      const attachment: OneNoteAttachment = {
        id: 'att-1',
        name: 'document.pdf',
        path: '/path/to/document.pdf',
        size: 1024,
        mimeType: 'application/pdf',
      };

      expect(attachment.id).toBe('att-1');
      expect(attachment.name).toBe('document.pdf');
      expect(attachment.path).toBe('/path/to/document.pdf');
      expect(attachment.size).toBe(1024);
      expect(attachment.mimeType).toBe('application/pdf');
    });

    it('should define OneNoteTable interface correctly', () => {
      const table: OneNoteTable = {
        id: 'table-1',
        rows: [
          {
            cells: [
              { content: 'Cell 1', colspan: 1, rowspan: 1 },
              { content: 'Cell 2', colspan: 1, rowspan: 1 },
            ],
          },
        ],
        columns: 2,
      };

      expect(table.id).toBe('table-1');
      expect(Array.isArray(table.rows)).toBe(true);
      expect(table.columns).toBe(2);
    });

    it('should define OneNoteList interface correctly', () => {
      const list: OneNoteList = {
        id: 'list-1',
        type: 'unordered',
        items: [
          { text: 'Item 1', level: 0 },
          { text: 'Item 2', level: 1, children: [] },
        ],
      };

      expect(list.id).toBe('list-1');
      expect(list.type).toBe('unordered');
      expect(Array.isArray(list.items)).toBe(true);
    });
  });

  describe('Notion Types', () => {
    it('should define NotionPage interface correctly', () => {
      const page: NotionPage = {
        id: 'notion-page-1',
        title: 'Test Page',
        content: { blocks: [] },
        properties: { status: 'active' },
        children: [],
        createdTime: new Date('2023-01-01'),
        lastEditedTime: new Date('2023-01-02'),
      };

      expect(page.id).toBe('notion-page-1');
      expect(page.title).toBe('Test Page');
      expect(page.content).toBeDefined();
      expect(page.properties).toBeDefined();
      expect(Array.isArray(page.children)).toBe(true);
    });

    it('should define NotionImage interface correctly', () => {
      const externalImage: NotionImage = {
        type: 'external',
        external: { url: 'https://example.com/image.jpg' },
      };

      expect(externalImage.type).toBe('external');
      expect(externalImage.external?.url).toBe('https://example.com/image.jpg');

      const fileImage: NotionImage = {
        type: 'file',
        file: { url: 'https://notion.com/file.jpg', expiry_time: '2023-12-31' },
      };

      expect(fileImage.type).toBe('file');
      expect(fileImage.file?.url).toBe('https://notion.com/file.jpg');
    });
  });

  describe('Conversion Types', () => {
    it('should define ConversionOptions interface correctly', () => {
      const options: ConversionOptions = {
        preserveStructure: true,
        includeMetadata: true,
        outputFormat: 'markdown',
        imageHandling: 'upload',
        tableHandling: 'preserve',
      };

      expect(options.preserveStructure).toBe(true);
      expect(options.includeMetadata).toBe(true);
      expect(options.outputFormat).toBe('markdown');
      expect(options.imageHandling).toBe('upload');
      expect(options.tableHandling).toBe('preserve');
    });

    it('should define ConversionResult interface correctly', () => {
      const result: ConversionResult = {
        success: true,
        pagesConverted: 5,
        errors: [],
        warnings: [],
        outputPath: '/path/to/output',
      };

      expect(result.success).toBe(true);
      expect(result.pagesConverted).toBe(5);
      expect(Array.isArray(result.errors)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
      expect(result.outputPath).toBe('/path/to/output');
    });

    it('should define ConversionError interface correctly', () => {
      const error: ConversionError = {
        pageId: 'page-1',
        pageName: 'Test Page',
        error: 'Conversion failed',
        details: { reason: 'Invalid format' },
      };

      expect(error.pageId).toBe('page-1');
      expect(error.pageName).toBe('Test Page');
      expect(error.error).toBe('Conversion failed');
      expect(error.details).toBeDefined();
    });

    it('should define ConversionWarning interface correctly', () => {
      const warning: ConversionWarning = {
        pageId: 'page-1',
        pageName: 'Test Page',
        warning: 'Format not supported',
        details: { format: 'custom' },
      };

      expect(warning.pageId).toBe('page-1');
      expect(warning.pageName).toBe('Test Page');
      expect(warning.warning).toBe('Format not supported');
      expect(warning.details).toBeDefined();
    });
  });

  describe('CLI Types', () => {
    it('should define CliOptions interface correctly', () => {
      const options: CliOptions = {
        file: '/path/to/file.one',
        workspace: 'workspace-123',
        database: 'database-456',
        config: '/path/to/config.json',
        dryRun: true,
        verbose: true,
        output: '/path/to/output',
        format: 'markdown',
      };

      expect(options.file).toBe('/path/to/file.one');
      expect(options.workspace).toBe('workspace-123');
      expect(options.database).toBe('database-456');
      expect(options.config).toBe('/path/to/config.json');
      expect(options.dryRun).toBe(true);
      expect(options.verbose).toBe(true);
      expect(options.output).toBe('/path/to/output');
      expect(options.format).toBe('markdown');
    });
  });

  describe('Service Types', () => {
    it('should define FileService interface correctly', () => {
      const service: FileService = {
        extractOneNoteFile: jest.fn(),
        saveConvertedContent: jest.fn(),
      };

      expect(typeof service.extractOneNoteFile).toBe('function');
      expect(typeof service.saveConvertedContent).toBe('function');
    });

    it('should define ConversionService interface correctly', () => {
      const service: ConversionService = {
        convertNotebook: jest.fn(),
        convertPage: jest.fn(),
      };

      expect(typeof service.convertNotebook).toBe('function');
      expect(typeof service.convertPage).toBe('function');
    });

    it('should define NotionService interface correctly', () => {
      const service: NotionService = {
        createPage: jest.fn(),
        uploadImage: jest.fn(),
        createDatabase: jest.fn(),
      };

      expect(typeof service.createPage).toBe('function');
      expect(typeof service.uploadImage).toBe('function');
      expect(typeof service.createDatabase).toBe('function');
    });
  });
});
