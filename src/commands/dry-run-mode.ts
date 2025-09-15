import { OneNoteHierarchy } from '../types/onenote';
import fs from 'fs';
import path from 'path';

export interface DryRunOptions {
  targetWorkspace: string;
  targetDatabase: string;
  includeMetadata?: boolean;
  showContent?: boolean;
  outputFile?: string;
  format?: 'text' | 'json' | 'markdown';
}

export interface ImportPlan {
  steps: string[];
  estimatedTime: string;
  totalItems: number;
  warnings: string[];
}

export interface ValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
}

export interface ExportResult {
  success: boolean;
  filePath?: string;
  error?: string;
}

export class DryRunMode {
  /**
   * Generates a detailed preview of what would be imported
   */
  generatePreview(hierarchy: OneNoteHierarchy, options: DryRunOptions): string {
    const { targetWorkspace, targetDatabase, includeMetadata = false, showContent = false } = options;
    
    let preview = '='.repeat(60) + '\n';
    preview += 'DRY RUN PREVIEW\n';
    preview += '='.repeat(60) + '\n\n';
    
    preview += `Target Workspace: ${targetWorkspace}\n`;
    preview += `Target Database: ${targetDatabase}\n\n`;
    
    // Statistics
    preview += this.generateStatistics(hierarchy);
    preview += '\n';
    
    // Hierarchy preview
    preview += this.generateHierarchyPreview(hierarchy, { includeMetadata, showContent });
    
    return preview;
  }

  /**
   * Generates a step-by-step import plan
   */
  generateImportPlan(hierarchy: OneNoteHierarchy, options: DryRunOptions): string {
    const { targetWorkspace, targetDatabase } = options;
    
    let plan = '='.repeat(60) + '\n';
    plan += 'IMPORT PLAN\n';
    plan += '='.repeat(60) + '\n\n';
    
    plan += `Target Workspace: ${targetWorkspace}\n`;
    plan += `Target Database: ${targetDatabase}\n\n`;
    
    let stepNumber = 1;
    
    // Step 1: Create databases for notebooks
    plan += `Step ${stepNumber++}: Create databases for notebooks\n`;
    for (const notebook of hierarchy.notebooks) {
      plan += `  - Create database: "${notebook.name}"\n`;
    }
    plan += '\n';
    
    // Step 2: Create section pages
    plan += `Step ${stepNumber++}: Create section pages\n`;
    for (const notebook of hierarchy.notebooks) {
      for (const section of notebook.sections) {
        plan += `  - Create section page: "${section.name}" in "${notebook.name}"\n`;
      }
    }
    plan += '\n';
    
    // Step 3: Create page content
    plan += `Step ${stepNumber++}: Create page content\n`;
    let totalPages = 0;
    for (const notebook of hierarchy.notebooks) {
      for (const section of notebook.sections) {
        for (const page of section.pages) {
          totalPages++;
          plan += `  - Create page: "${page.title}" in "${section.name}"\n`;
        }
      }
    }
    plan += '\n';
    
    // Step 4: Upload attachments
    plan += `Step ${stepNumber++}: Upload attachments and media\n`;
    plan += `  - Process images and files\n`;
    plan += `  - Update page content with media links\n`;
    plan += '\n';
    
    // Estimated time
    const estimatedMinutes = Math.ceil(totalPages * 0.5); // 30 seconds per page
    plan += `Estimated processing time: ${estimatedMinutes} minutes\n`;
    
    return plan;
  }

  /**
   * Validates the import plan for potential issues
   */
  validateImportPlan(hierarchy: OneNoteHierarchy, options: DryRunOptions): ValidationResult {
    const warnings: string[] = [];
    const errors: string[] = [];
    
    // Check for large imports
    if (hierarchy.totalNotebooks > 50) {
      warnings.push(`Large number of notebooks (${hierarchy.totalNotebooks}) - import may take a long time`);
    }
    
    if (hierarchy.totalPages > 1000) {
      warnings.push(`Large number of pages (${hierarchy.totalPages}) - import may take a long time`);
    }
    
    // Check for empty notebooks
    for (const notebook of hierarchy.notebooks) {
      if (notebook.sections.length === 0) {
        warnings.push(`Notebook "${notebook.name}" has no sections`);
      }
    }
    
    // Check for empty sections
    for (const notebook of hierarchy.notebooks) {
      for (const section of notebook.sections) {
        if (section.pages.length === 0) {
          warnings.push(`Section "${section.name}" in notebook "${notebook.name}" has no pages`);
        }
      }
    }
    
    // Check for very long content
    for (const notebook of hierarchy.notebooks) {
      for (const section of notebook.sections) {
        for (const page of section.pages) {
          if (page.content.length > 100000) {
            warnings.push(`Page "${page.title}" has very long content (${page.content.length} characters)`);
          }
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      warnings,
      errors
    };
  }

  /**
   * Exports preview to a file
   */
  async exportPreview(hierarchy: OneNoteHierarchy, options: DryRunOptions): Promise<ExportResult> {
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
        const previewData = {
          preview: this.generatePreview(hierarchy, options),
          plan: this.generateImportPlan(hierarchy, options),
          validation: this.validateImportPlan(hierarchy, options),
          statistics: this.calculateStatistics(hierarchy)
        };
        content = JSON.stringify(previewData, null, 2);
      } else if (format === 'markdown') {
        content = this.generateMarkdownPreview(hierarchy, options);
      } else {
        content = this.generatePreview(hierarchy, options);
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
   * Generates statistics for the hierarchy
   */
  private generateStatistics(hierarchy: OneNoteHierarchy): string {
    let stats = 'STATISTICS\n';
    stats += '-'.repeat(20) + '\n';
    stats += `Total Notebooks: ${hierarchy.totalNotebooks}\n`;
    stats += `Total Sections: ${hierarchy.totalSections}\n`;
    stats += `Total Pages: ${hierarchy.totalPages}\n`;
    
    // Calculate total content size
    let totalContentSize = 0;
    for (const notebook of hierarchy.notebooks) {
      for (const section of notebook.sections) {
        for (const page of section.pages) {
          totalContentSize += page.content.length;
        }
      }
    }
    
    stats += `Total Content Size: ${this.formatBytes(totalContentSize)}\n`;
    
    return stats;
  }

  /**
   * Generates hierarchy preview
   */
  private generateHierarchyPreview(hierarchy: OneNoteHierarchy, options: { includeMetadata: boolean; showContent: boolean }): string {
    let preview = 'HIERARCHY PREVIEW\n';
    preview += '-'.repeat(20) + '\n';
    
    for (const notebook of hierarchy.notebooks) {
      preview += `📚 ${notebook.name}\n`;
      
      if (options.includeMetadata) {
        preview += `   Author: ${notebook.metadata.author || 'Unknown'}\n`;
        preview += `   Created: ${notebook.createdDate.toISOString()}\n`;
        preview += `   Modified: ${notebook.lastModifiedDate.toISOString()}\n`;
      }
      
      for (const section of notebook.sections) {
        preview += `  📁 ${section.name}\n`;
        
        if (options.includeMetadata) {
          preview += `     Color: ${section.metadata.color || 'Default'}\n`;
          preview += `     Created: ${section.createdDate.toISOString()}\n`;
          preview += `     Modified: ${section.lastModifiedDate.toISOString()}\n`;
        }
        
        for (const page of section.pages) {
          preview += `    📄 ${page.title}\n`;
          
          if (options.includeMetadata) {
            const tags = page.metadata.tags ? page.metadata.tags.join(', ') : 'None';
            preview += `       Tags: ${tags}\n`;
            preview += `       Created: ${page.createdDate.toISOString()}\n`;
            preview += `       Modified: ${page.lastModifiedDate.toISOString()}\n`;
          }
          
          if (options.showContent) {
            const contentPreview = page.content.length > 100 
              ? page.content.substring(0, 100) + '...' 
              : page.content;
            preview += `       Content: ${contentPreview}\n`;
          }
        }
      }
      preview += '\n';
    }
    
    return preview;
  }

  /**
   * Generates markdown format preview
   */
  private generateMarkdownPreview(hierarchy: OneNoteHierarchy, options: DryRunOptions): string {
    let markdown = '# OneNote to Notion Import Preview\n\n';
    markdown += `**Target Workspace:** ${options.targetWorkspace}\n`;
    markdown += `**Target Database:** ${options.targetDatabase}\n\n`;
    
    markdown += '## Statistics\n\n';
    markdown += `- **Total Notebooks:** ${hierarchy.totalNotebooks}\n`;
    markdown += `- **Total Sections:** ${hierarchy.totalSections}\n`;
    markdown += `- **Total Pages:** ${hierarchy.totalPages}\n\n`;
    
    markdown += '## Hierarchy\n\n';
    
    for (const notebook of hierarchy.notebooks) {
      markdown += `### 📚 ${notebook.name}\n\n`;
      
      for (const section of notebook.sections) {
        markdown += `#### 📁 ${section.name}\n\n`;
        
        for (const page of section.pages) {
          markdown += `- **📄 ${page.title}**\n`;
        }
        markdown += '\n';
      }
    }
    
    return markdown;
  }

  /**
   * Calculates detailed statistics
   */
  private calculateStatistics(hierarchy: OneNoteHierarchy) {
    let totalContentSize = 0;
    let totalImages = 0;
    let totalAttachments = 0;
    
    for (const notebook of hierarchy.notebooks) {
      for (const section of notebook.sections) {
        for (const page of section.pages) {
          totalContentSize += page.content.length;
          
          // Count images and attachments (simple regex-based detection)
          const imageMatches = page.content.match(/!\[.*?\]\(.*?\)/g);
          if (imageMatches) totalImages += imageMatches.length;
          
          const attachmentMatches = page.content.match(/\[.*?\]\(.*?\.(pdf|doc|docx|xls|xlsx|ppt|pptx)\)/gi);
          if (attachmentMatches) totalAttachments += attachmentMatches.length;
        }
      }
    }
    
    return {
      totalNotebooks: hierarchy.totalNotebooks,
      totalSections: hierarchy.totalSections,
      totalPages: hierarchy.totalPages,
      totalContentSize,
      totalImages,
      totalAttachments,
      averagePageSize: Math.round(totalContentSize / hierarchy.totalPages)
    };
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
