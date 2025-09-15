import { OneNotePage, OneNoteSection, OneNoteNotebook } from '../types/onenote';
import fs from 'fs';
import path from 'path';

export interface ContentPreviewOptions {
  showMetadata?: boolean;
  showContent?: boolean;
  maxContentLength?: number;
  outputFile?: string;
  format?: 'text' | 'html' | 'json' | 'markdown';
}

export interface ContentAnalysis {
  hasHeaders: boolean;
  hasLists: boolean;
  hasCodeBlocks: boolean;
  hasBoldText: boolean;
  hasItalicText: boolean;
  hasQuotes: boolean;
  hasLinks: boolean;
  hasImages: boolean;
  wordCount: number;
  characterCount: number;
  lineCount: number;
}

export interface ExportResult {
  success: boolean;
  filePath?: string;
  error?: string;
}

export class ContentPreview {
  /**
   * Generates a preview for a single page
   */
  previewPage(page: OneNotePage, options: ContentPreviewOptions = {}): string {
    const { showMetadata = true, showContent = true, maxContentLength = 500 } = options;
    
    let preview = '='.repeat(60) + '\n';
    preview += 'PAGE PREVIEW\n';
    preview += '='.repeat(60) + '\n\n';
    
    preview += `Title: ${page.title}\n`;
    preview += `ID: ${page.id}\n\n`;
    
    if (showMetadata) {
      preview += this.generateMetadataSection(page);
    }
    
    if (showContent) {
      preview += this.generateContentSection(page, maxContentLength);
    }
    
    return preview;
  }

  /**
   * Generates a preview for a section
   */
  previewSection(section: OneNoteSection, options: ContentPreviewOptions = {}): string {
    const { showMetadata = true, showContent = true, maxContentLength = 200 } = options;
    
    let preview = '='.repeat(60) + '\n';
    preview += 'SECTION PREVIEW\n';
    preview += '='.repeat(60) + '\n\n';
    
    preview += `Name: ${section.name}\n`;
    preview += `ID: ${section.id}\n\n`;
    
    if (showMetadata) {
      preview += this.generateSectionMetadata(section);
    }
    
    preview += this.generateSectionStatistics(section);
    preview += '\n';
    
    if (showContent) {
      preview += 'PAGES:\n';
      preview += '-'.repeat(20) + '\n';
      
      for (const page of section.pages) {
        preview += `📄 ${page.title}\n`;
        if (showMetadata) {
          preview += `   Created: ${page.createdDate.toISOString()}\n`;
          preview += `   Modified: ${page.lastModifiedDate.toISOString()}\n`;
        }
        preview += '\n';
      }
    }
    
    return preview;
  }

  /**
   * Generates a preview for a notebook
   */
  previewNotebook(notebook: OneNoteNotebook, options: ContentPreviewOptions = {}): string {
    const { showMetadata = true, showContent = true, maxContentLength = 200 } = options;
    
    let preview = '='.repeat(60) + '\n';
    preview += 'NOTEBOOK PREVIEW\n';
    preview += '='.repeat(60) + '\n\n';
    
    preview += `Name: ${notebook.name}\n`;
    preview += `ID: ${notebook.id}\n\n`;
    
    if (showMetadata) {
      preview += this.generateNotebookMetadata(notebook);
    }
    
    preview += this.generateNotebookStatistics(notebook);
    preview += '\n';
    
    if (showContent) {
      preview += 'SECTIONS:\n';
      preview += '-'.repeat(20) + '\n';
      
      for (const section of notebook.sections) {
        preview += `📁 ${section.name}\n`;
        preview += `   Pages: ${section.pages.length}\n`;
        if (showMetadata) {
          preview += `   Created: ${section.createdDate.toISOString()}\n`;
          preview += `   Modified: ${section.lastModifiedDate.toISOString()}\n`;
        }
        if (showContent) {
          for (const page of section.pages) {
            preview += `     📄 ${page.title}\n`;
          }
        }
        preview += '\n';
      }
    }
    
    return preview;
  }

  /**
   * Analyzes content structure and types
   */
  analyzeContent(content: string): ContentAnalysis {
    const analysis: ContentAnalysis = {
      hasHeaders: false,
      hasLists: false,
      hasCodeBlocks: false,
      hasBoldText: false,
      hasItalicText: false,
      hasQuotes: false,
      hasLinks: false,
      hasImages: false,
      wordCount: 0,
      characterCount: 0,
      lineCount: 0
    };

    // Basic counts
    analysis.characterCount = content.length;
    analysis.lineCount = content.split('\n').length;
    analysis.wordCount = content.split(/\s+/).filter(word => word.length > 0).length;

    // Content type detection
    analysis.hasHeaders = /^#+\s/m.test(content);
    analysis.hasLists = /^[\s]*[-*+]\s/m.test(content) || /^[\s]*\d+\.\s/m.test(content);
    analysis.hasCodeBlocks = /```[\s\S]*?```/.test(content);
    analysis.hasBoldText = /\*\*.*?\*\*/.test(content) || /__.*?__/.test(content);
    analysis.hasItalicText = /\*.*?\*/.test(content) || /_.*?_/.test(content);
    analysis.hasQuotes = /^>\s/m.test(content);
    analysis.hasLinks = /\[.*?\]\(.*?\)/.test(content);
    analysis.hasImages = /!\[.*?\]\(.*?\)/.test(content);

    return analysis;
  }

  /**
   * Exports preview to a file
   */
  async exportPreview(page: OneNotePage, options: ContentPreviewOptions): Promise<ExportResult> {
    const { outputFile, format = 'text' } = options;
    
    if (!outputFile) {
      return {
        success: false,
        error: 'Output file path is required'
      };
    }
    
    try {
      let content: string;
      
      if (format === 'json') {
        const analysis = this.analyzeContent(page.content);
        const previewData = {
          page: {
            id: page.id,
            title: page.title,
            content: page.content,
            metadata: page.metadata,
            createdDate: page.createdDate,
            lastModifiedDate: page.lastModifiedDate
          },
          analysis,
          preview: this.previewPage(page, options)
        };
        content = JSON.stringify(previewData, null, 2);
      } else if (format === 'html') {
        content = this.generateHtmlPreview(page, options);
      } else if (format === 'markdown') {
        content = this.generateMarkdownPreview(page, options);
      } else {
        content = this.previewPage(page, options);
      }
      
      // Ensure directory exists
      const dir = path.dirname(outputFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(outputFile, content, 'utf8');
      
      return {
        success: true,
        filePath: outputFile
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Generates metadata section for a page
   */
  private generateMetadataSection(page: OneNotePage): string {
    let metadata = 'METADATA\n';
    metadata += '-'.repeat(20) + '\n';
    
    if (page.metadata.tags) {
      metadata += `Tags: ${page.metadata.tags.join(', ')}\n`;
    }
    if (page.metadata.author) {
      metadata += `Author: ${page.metadata.author}\n`;
    }
    metadata += `Created: ${page.createdDate.toISOString()}\n`;
    metadata += `Modified: ${page.lastModifiedDate.toISOString()}\n\n`;
    
    return metadata;
  }

  /**
   * Generates content section for a page
   */
  private generateContentSection(page: OneNotePage, maxLength: number): string {
    let content = 'CONTENT\n';
    content += '-'.repeat(20) + '\n';
    
    const analysis = this.analyzeContent(page.content);
    
    // Content type indicators
    content += 'Content Types:\n';
    if (analysis.hasHeaders) content += '📊 Headers\n';
    if (analysis.hasLists) content += '📋 Lists\n';
    if (analysis.hasCodeBlocks) content += '💻 Code Blocks\n';
    if (analysis.hasBoldText) content += '** Bold Text\n';
    if (analysis.hasItalicText) content += '* Italic Text\n';
    if (analysis.hasQuotes) content += '💬 Quotes\n';
    if (analysis.hasLinks) content += '🔗 Links\n';
    if (analysis.hasImages) content += '🖼️ Images\n';
    content += '\n';
    
    // Statistics
    content += `Word Count: ${analysis.wordCount}\n`;
    content += `Character Count: ${analysis.characterCount}\n`;
    content += `Line Count: ${analysis.lineCount}\n\n`;
    
    // Content preview
    content += '📝 Text Content:\n';
    let displayContent = page.content;
    if (displayContent.length > maxLength) {
      displayContent = displayContent.substring(0, maxLength) + '\n... (truncated)';
    }
    content += displayContent + '\n\n';
    
    return content;
  }

  /**
   * Generates metadata section for a section
   */
  private generateSectionMetadata(section: OneNoteSection): string {
    let metadata = 'METADATA\n';
    metadata += '-'.repeat(20) + '\n';
    
    if (section.metadata.color) {
      metadata += `Color: ${section.metadata.color}\n`;
    }
    metadata += `Created: ${section.createdDate.toISOString()}\n`;
    metadata += `Modified: ${section.lastModifiedDate.toISOString()}\n\n`;
    
    return metadata;
  }

  /**
   * Generates statistics for a section
   */
  private generateSectionStatistics(section: OneNoteSection): string {
    let stats = 'STATISTICS\n';
    stats += '-'.repeat(20) + '\n';
    stats += `Total Pages: ${section.pages.length}\n`;
    
    let totalContentSize = 0;
    for (const page of section.pages) {
      totalContentSize += page.content.length;
    }
    stats += `Total Content Size: ${this.formatBytes(totalContentSize)}\n\n`;
    
    return stats;
  }

  /**
   * Generates metadata section for a notebook
   */
  private generateNotebookMetadata(notebook: OneNoteNotebook): string {
    let metadata = 'METADATA\n';
    metadata += '-'.repeat(20) + '\n';
    
    if (notebook.metadata.author) {
      metadata += `Author: ${notebook.metadata.author}\n`;
    }
    metadata += `Created: ${notebook.createdDate.toISOString()}\n`;
    metadata += `Modified: ${notebook.lastModifiedDate.toISOString()}\n\n`;
    
    return metadata;
  }

  /**
   * Generates statistics for a notebook
   */
  private generateNotebookStatistics(notebook: OneNoteNotebook): string {
    let stats = 'STATISTICS\n';
    stats += '-'.repeat(20) + '\n';
    stats += `Total Sections: ${notebook.sections.length}\n`;
    
    let totalPages = 0;
    let totalContentSize = 0;
    
    for (const section of notebook.sections) {
      totalPages += section.pages.length;
      for (const page of section.pages) {
        totalContentSize += page.content.length;
      }
    }
    
    stats += `Total Pages: ${totalPages}\n`;
    stats += `Total Content Size: ${this.formatBytes(totalContentSize)}\n\n`;
    
    return stats;
  }

  /**
   * Generates HTML preview
   */
  private generateHtmlPreview(page: OneNotePage, options: ContentPreviewOptions): string {
    const analysis = this.analyzeContent(page.content);
    
    let html = '<!DOCTYPE html>\n<html>\n<head>\n';
    html += '<title>Content Preview - ' + page.title + '</title>\n';
    html += '<style>body{font-family:Arial,sans-serif;margin:40px;}</style>\n';
    html += '</head>\n<body>\n';
    
    html += '<h1>Content Preview</h1>\n';
    html += '<h2>' + page.title + '</h2>\n';
    
    if (options.showMetadata) {
      html += '<h3>Metadata</h3>\n';
      html += '<ul>\n';
      if (page.metadata.tags) {
        html += '<li><strong>Tags:</strong> ' + page.metadata.tags.join(', ') + '</li>\n';
      }
      if (page.metadata.author) {
        html += '<li><strong>Author:</strong> ' + page.metadata.author + '</li>\n';
      }
      html += '<li><strong>Created:</strong> ' + page.createdDate.toISOString() + '</li>\n';
      html += '<li><strong>Modified:</strong> ' + page.lastModifiedDate.toISOString() + '</li>\n';
      html += '</ul>\n';
    }
    
    if (options.showContent) {
      html += '<h3>Content Analysis</h3>\n';
      html += '<ul>\n';
      html += '<li><strong>Word Count:</strong> ' + analysis.wordCount + '</li>\n';
      html += '<li><strong>Character Count:</strong> ' + analysis.characterCount + '</li>\n';
      html += '<li><strong>Line Count:</strong> ' + analysis.lineCount + '</li>\n';
      html += '</ul>\n';
      
      html += '<h3>Content</h3>\n';
      html += '<pre>' + page.content + '</pre>\n';
    }
    
    html += '</body>\n</html>';
    return html;
  }

  /**
   * Generates markdown preview
   */
  private generateMarkdownPreview(page: OneNotePage, options: ContentPreviewOptions): string {
    let markdown = '# Content Preview\n\n';
    markdown += '## ' + page.title + '\n\n';
    
    if (options.showMetadata) {
      markdown += '### Metadata\n\n';
      if (page.metadata.tags) {
        markdown += '- **Tags:** ' + page.metadata.tags.join(', ') + '\n';
      }
      if (page.metadata.author) {
        markdown += '- **Author:** ' + page.metadata.author + '\n';
      }
      markdown += '- **Created:** ' + page.createdDate.toISOString() + '\n';
      markdown += '- **Modified:** ' + page.lastModifiedDate.toISOString() + '\n\n';
    }
    
    if (options.showContent) {
      markdown += '### Content\n\n';
      markdown += page.content + '\n';
    }
    
    return markdown;
  }

  /**
   * Formats bytes into human-readable format
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
