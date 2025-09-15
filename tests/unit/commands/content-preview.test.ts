import { ContentPreview } from '../../../src/commands/content-preview';
import { OneNotePage, OneNoteSection, OneNoteNotebook } from '../../../src/types/onenote';

describe('ContentPreview', () => {
  let contentPreview: ContentPreview;
  let mockPage: OneNotePage;
  let mockSection: OneNoteSection;
  let mockNotebook: OneNoteNotebook;

  beforeEach(() => {
    contentPreview = new ContentPreview();
    
    mockPage = {
      id: 'page-1',
      title: 'Sample Page',
      content: '# Heading 1\n\nThis is **bold** text and *italic* text.\n\n- List item 1\n- List item 2\n\n```javascript\nconsole.log("Hello World");\n```',
      createdDate: new Date('2023-01-01'),
      lastModifiedDate: new Date('2023-01-02'),
      metadata: { tags: ['important', 'draft'], author: 'Test User' }
    };

    mockSection = {
      id: 'section-1',
      name: 'Sample Section',
      createdDate: new Date('2023-01-01'),
      lastModifiedDate: new Date('2023-01-02'),
      metadata: { color: 'blue' },
      pages: [mockPage]
    };

    mockNotebook = {
      id: 'notebook-1',
      name: 'Sample Notebook',
      createdDate: new Date('2023-01-01'),
      lastModifiedDate: new Date('2023-01-02'),
      metadata: { author: 'Test User' },
      sections: [mockSection]
    };
  });

  describe('previewPage', () => {
    it('should generate preview for a single page', () => {
      const preview = contentPreview.previewPage(mockPage, {
        showMetadata: true,
        showContent: true,
        maxContentLength: 500
      });

      expect(preview).toContain('PAGE PREVIEW');
      expect(preview).toContain('Sample Page');
      expect(preview).toContain('Heading 1');
      expect(preview).toContain('**bold** text');
      expect(preview).toContain('*italic* text');
      expect(preview).toContain('List item 1');
      expect(preview).toContain('console.log("Hello World")');
    });

    it('should show metadata when requested', () => {
      const preview = contentPreview.previewPage(mockPage, {
        showMetadata: true,
        showContent: false,
        maxContentLength: 500
      });

      expect(preview).toContain('Tags: important, draft');
      expect(preview).toContain('Author: Test User');
      expect(preview).toContain('Created: 2023-01-01');
      expect(preview).toContain('Modified: 2023-01-02');
    });

    it('should truncate content when exceeding max length', () => {
      const longContent = 'A'.repeat(1000);
      const longPage = { ...mockPage, content: longContent };
      
      const preview = contentPreview.previewPage(longPage, {
        showMetadata: false,
        showContent: true,
        maxContentLength: 100
      });

      expect(preview).toContain('... (truncated)');
      expect(preview).toContain('A'.repeat(100));
      expect(preview).not.toContain('A'.repeat(101));
    });

    it('should highlight different content types', () => {
      const preview = contentPreview.previewPage(mockPage, {
        showMetadata: false,
        showContent: true,
        maxContentLength: 500
      });

      expect(preview).toContain('📝 Text Content');
      expect(preview).toContain('📋 Lists');
      expect(preview).toContain('💻 Code Blocks');
      expect(preview).toContain('📊 Headers');
    });
  });

  describe('previewSection', () => {
    it('should generate preview for a section with all pages', () => {
      const preview = contentPreview.previewSection(mockSection, {
        showMetadata: true,
        showContent: true,
        maxContentLength: 200
      });

      expect(preview).toContain('SECTION PREVIEW');
      expect(preview).toContain('Sample Section');
      expect(preview).toContain('Color: blue');
      expect(preview).toContain('Pages: 1');
      expect(preview).toContain('Sample Page');
    });

    it('should show section statistics', () => {
      const preview = contentPreview.previewSection(mockSection, {
        showMetadata: false,
        showContent: false,
        maxContentLength: 200
      });

      expect(preview).toContain('Total Pages: 1');
      expect(preview).toContain('Total Content Size:');
    });
  });

  describe('previewNotebook', () => {
    it('should generate preview for a notebook with all sections and pages', () => {
      const preview = contentPreview.previewNotebook(mockNotebook, {
        showMetadata: true,
        showContent: true,
        maxContentLength: 200
      });

      expect(preview).toContain('NOTEBOOK PREVIEW');
      expect(preview).toContain('Sample Notebook');
      expect(preview).toContain('Author: Test User');
      expect(preview).toContain('Sample Section');
      expect(preview).toContain('Sample Page');
    });

    it('should show notebook statistics', () => {
      const preview = contentPreview.previewNotebook(mockNotebook, {
        showMetadata: false,
        showContent: false,
        maxContentLength: 200
      });

      expect(preview).toContain('Total Sections: 1');
      expect(preview).toContain('Total Pages: 1');
      expect(preview).toContain('Total Content Size:');
    });
  });

  describe('analyzeContent', () => {
    it('should analyze content structure and types', () => {
      const analysis = contentPreview.analyzeContent(mockPage.content);

      expect(analysis.hasHeaders).toBe(true);
      expect(analysis.hasLists).toBe(true);
      expect(analysis.hasCodeBlocks).toBe(true);
      expect(analysis.hasBoldText).toBe(true);
      expect(analysis.hasItalicText).toBe(true);
      expect(analysis.wordCount).toBeGreaterThan(0);
      expect(analysis.characterCount).toBeGreaterThan(0);
    });

    it('should detect different content patterns', () => {
      const complexContent = `
# Main Title
## Subtitle

**Bold text** and *italic text*.

- Bullet point 1
- Bullet point 2

1. Numbered item 1
2. Numbered item 2

\`\`\`javascript
function hello() {
  console.log("Hello World");
}
\`\`\`

> This is a quote

[Link text](https://example.com)

![Image alt](image.jpg)
      `;

      const analysis = contentPreview.analyzeContent(complexContent);

      expect(analysis.hasHeaders).toBe(true);
      expect(analysis.hasLists).toBe(true);
      expect(analysis.hasCodeBlocks).toBe(true);
      expect(analysis.hasBoldText).toBe(true);
      expect(analysis.hasItalicText).toBe(true);
      expect(analysis.hasQuotes).toBe(true);
      expect(analysis.hasLinks).toBe(true);
      expect(analysis.hasImages).toBe(true);
    });
  });

  describe('exportPreview', () => {
    it('should export page preview to file', async () => {
      const tempFile = '/tmp/page-preview.html';
      const result = await contentPreview.exportPreview(mockPage, {
        outputFile: tempFile,
        format: 'html',
        showMetadata: true,
        showContent: true
      });

      expect(result.success).toBe(true);
      expect(result.filePath).toBe(tempFile);
    });

    it('should support different output formats', async () => {
      const tempFile = '/tmp/page-preview.json';
      const result = await contentPreview.exportPreview(mockPage, {
        outputFile: tempFile,
        format: 'json',
        showMetadata: true,
        showContent: true
      });

      expect(result.success).toBe(true);
      expect(result.filePath).toBe(tempFile);
    });
  });
});
