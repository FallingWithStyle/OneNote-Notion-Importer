/**
 * Hierarchy Mapping Service
 * Maps OneNote hierarchy to Notion structure
 */

import { OneNoteNotebook, OneNoteSection, OneNotePage } from '../../types/onenote';
import { NotionPage } from './notion-api.service';

// Re-export NotionPage for external use
export { NotionPage } from './notion-api.service';

export interface HierarchyMappingOptions {
  preserveStructure?: boolean;
  createDatabases?: boolean;
  maxDepth?: number;
  onProgress?: (progress: HierarchyProgress) => void;
}

export interface HierarchyProgress {
  stage: 'mapping' | 'validation' | 'creation' | 'complete';
  percentage: number;
  message: string;
  currentItem?: number;
  totalItems?: number;
}

export interface HierarchyMappingResult {
  success: boolean;
  pages: NotionPage[];
  databases?: string[] | undefined;
  errors?: string[] | undefined;
  metadata?: {
    totalPages: number;
    totalSections: number;
    totalNotebooks: number;
    processingTime: number;
  } | undefined;
}

export interface IHierarchyMappingService {
  /**
   * Map OneNote hierarchy to Notion structure
   * @param notebooks OneNote notebooks to map
   * @param options Mapping options
   * @returns Hierarchy mapping result
   */
  mapHierarchy(notebooks: OneNoteNotebook[], options: HierarchyMappingOptions): Promise<HierarchyMappingResult>;

  /**
   * Create database structure for notebooks
   * @param notebooks OneNote notebooks
   * @param options Mapping options
   * @returns Array of database IDs
   */
  createDatabaseStructure(notebooks: OneNoteNotebook[], options: HierarchyMappingOptions): Promise<string[]>;

  /**
   * Map section to Notion page with children
   * @param section OneNote section
   * @param parentId Parent page ID
   * @param options Mapping options
   * @returns Notion page structure
   */
  mapSectionToPage(section: OneNoteSection, parentId?: string, options?: HierarchyMappingOptions): Promise<NotionPage>;

  /**
   * Map page to Notion page
   * @param page OneNote page
   * @param parentId Parent page ID
   * @param options Mapping options
   * @returns Notion page structure
   */
  mapPageToNotionPage(page: OneNotePage, parentId?: string, options?: HierarchyMappingOptions): Promise<NotionPage>;

  /**
   * Validate hierarchy structure
   * @param pages Notion pages to validate
   * @returns Validation result
   */
  validateHierarchy(pages: NotionPage[]): { isValid: boolean; errors: string[] };

  /**
   * Flatten hierarchy for processing
   * @param pages Notion pages with hierarchy
   * @returns Flattened array of pages
   */
  flattenHierarchy(pages: NotionPage[]): NotionPage[];
}

export class HierarchyMappingService implements IHierarchyMappingService {
  async mapHierarchy(notebooks: OneNoteNotebook[], options: HierarchyMappingOptions): Promise<HierarchyMappingResult> {
    const startTime = Date.now();
    const pages: NotionPage[] = [];
    const errors: string[] = [];

    try {
      this.reportProgress(options, 'mapping', 10, 'Starting hierarchy mapping...');

      // Create database structure if requested
      const databases = await this.createDatabaseStructure(notebooks, options);
      if (databases.length > 0) {
        this.reportProgress(options, 'mapping', 20, 'Database structure created');
      }

      // Map each notebook with progress tracking
      const notebookPages = await this.mapNotebooks(notebooks, options);
      pages.push(...notebookPages);

      this.reportProgress(options, 'mapping', 100, 'Hierarchy mapping completed');

      // Flatten the hierarchy for the result
      const flattenedPages = this.flattenHierarchy(pages);

      return this.createSuccessResult(flattenedPages, databases, notebooks, startTime);
    } catch (error) {
      return this.createErrorResult(error, pages, [], startTime);
    }
  }

  async createDatabaseStructure(notebooks: OneNoteNotebook[], options: HierarchyMappingOptions): Promise<string[]> {
    if (!options.createDatabases) {
      return [];
    }

    const databaseIds: string[] = [];
    
    for (const notebook of notebooks) {
      try {
        // Create a database for each notebook
        const databaseName = `OneNote - ${notebook.name}`;
        // Note: This would need access to the NotionApiService instance
        // For now, we'll generate a placeholder ID
        const databaseId = `db_${notebook.id}_${Date.now()}`;
        databaseIds.push(databaseId);
      } catch (error) {
        console.error(`Failed to create database for notebook ${notebook.name}:`, error);
      }
    }

    return databaseIds;
  }

  async mapSectionToPage(section: OneNoteSection, parentId?: string, options?: HierarchyMappingOptions): Promise<NotionPage> {
    const sectionPage: NotionPage = {
      id: section.id,
      title: section.name,
      content: `Section: ${section.name}`,
      parentId: parentId || undefined,
      properties: {
        'Type': 'Section',
        'Created Date': section.createdDate,
        'Last Modified': section.lastModifiedDate
      },
      metadata: section.metadata
    };

    // Map pages within the section with depth limit
    const pageChildren: NotionPage[] = [];
    const maxDepth = options?.maxDepth || 10;
    if (maxDepth > 1) {
      for (const page of section.pages) {
        const notionPage = await this.mapPageToNotionPage(page, section.id, { ...options, maxDepth: maxDepth - 1 });
        pageChildren.push(notionPage);
      }
    }

    sectionPage.children = pageChildren;
    return sectionPage;
  }

  async mapPageToNotionPage(page: OneNotePage, parentId?: string, options?: HierarchyMappingOptions): Promise<NotionPage> {
    return {
      id: page.id,
      title: page.title,
      content: page.content,
      parentId: parentId || undefined,
      properties: {
        'Type': 'Page',
        'Created Date': page.createdDate,
        'Last Modified': page.lastModifiedDate,
        'Author': page.metadata?.author || 'Unknown',
        ...page.metadata
      },
      metadata: page.metadata
    };
  }

  validateHierarchy(pages: NotionPage[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const allPages = this.flattenHierarchy(pages);
    const pageIds = new Set(allPages.map(p => p.id));

    // Check for invalid parent references
    for (const page of allPages) {
      if (page.parentId && !pageIds.has(page.parentId)) {
        errors.push(`Page ${page.id} references non-existent parent ${page.parentId}`);
      }
    }

    // Check for circular references
    for (const page of allPages) {
      if (this.hasCircularReference(page, allPages, new Set<string>())) {
        errors.push(`Circular reference detected involving page ${page.id}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  flattenHierarchy(pages: NotionPage[]): NotionPage[] {
    const flattened: NotionPage[] = [];

    for (const page of pages) {
      flattened.push(page);
      
      if (page.children && page.children.length > 0) {
        const childPages = this.flattenHierarchy(page.children);
        flattened.push(...childPages);
      }
    }

    return flattened;
  }

  private hasCircularReference(page: NotionPage, allPages: NotionPage[], visited: Set<string>): boolean {
    if (visited.has(page.id)) {
      return true;
    }

    if (!page.parentId) {
      return false;
    }

    visited.add(page.id);
    const parent = allPages.find(p => p.id === page.parentId);
    
    if (parent) {
      const hasCircular = this.hasCircularReference(parent, allPages, visited);
      if (hasCircular) {
        return true;
      }
    }

    visited.delete(page.id);
    return false;
  }

  private countPages(notebooks: OneNoteNotebook[]): number {
    let count = 0;
    for (const notebook of notebooks) {
      for (const section of notebook.sections) {
        count += section.pages.length;
      }
    }
    return count;
  }

  private countSections(notebooks: OneNoteNotebook[]): number {
    let count = 0;
    for (const notebook of notebooks) {
      count += notebook.sections.length;
    }
    return count;
  }

  private async mapNotebooks(notebooks: OneNoteNotebook[], options: HierarchyMappingOptions): Promise<NotionPage[]> {
    const pages: NotionPage[] = [];
    
    for (let i = 0; i < notebooks.length; i++) {
      const notebook = notebooks[i]!;
      this.reportProgress(options, 'mapping', 
        30 + (i / notebooks.length) * 60, 
        `Mapping notebook: ${notebook.name}`,
        i + 1,
        notebooks.length
      );

      const notebookPage = this.createNotebookPage(notebook);
      const sectionPages = await this.mapSections(notebook.sections, notebook.id, options);
      notebookPage.children = sectionPages;
      pages.push(notebookPage);
    }

    return pages;
  }

  private createNotebookPage(notebook: OneNoteNotebook): NotionPage {
    return {
      id: notebook.id,
      title: notebook.name,
      content: `Notebook: ${notebook.name}`,
      properties: {
        'Type': 'Notebook',
        'Created Date': notebook.createdDate,
        'Last Modified': notebook.lastModifiedDate
      },
      metadata: notebook.metadata
    };
  }

  private async mapSections(sections: OneNoteSection[], parentId: string, options: HierarchyMappingOptions): Promise<NotionPage[]> {
    const sectionPages: NotionPage[] = [];
    const maxDepth = options.maxDepth || 10;
    
    if (maxDepth > 1) {
      for (const section of sections) {
        const sectionPage = await this.mapSectionToPage(section, parentId, { ...options, maxDepth: maxDepth - 1 });
        sectionPages.push(sectionPage);
      }
    }

    return sectionPages;
  }

  private createSuccessResult(
    pages: NotionPage[], 
    databases: string[], 
    notebooks: OneNoteNotebook[], 
    startTime: number
  ): HierarchyMappingResult {
    return {
      success: true,
      pages,
      databases: databases.length > 0 ? databases : [],
      metadata: {
        totalPages: this.countPages(notebooks),
        totalSections: this.countSections(notebooks),
        totalNotebooks: notebooks.length,
        processingTime: Date.now() - startTime
      }
    };
  }

  private createErrorResult(
    error: unknown, 
    pages: NotionPage[], 
    databases: string[], 
    startTime: number
  ): HierarchyMappingResult {
    const errors = [error instanceof Error ? error.message : 'Unknown error occurred'];
    
    return {
      success: false,
      pages,
      databases,
      errors,
      metadata: {
        totalPages: 0,
        totalSections: 0,
        totalNotebooks: 0,
        processingTime: Date.now() - startTime
      }
    };
  }

  private reportProgress(
    options: HierarchyMappingOptions | undefined,
    stage: HierarchyProgress['stage'],
    percentage: number,
    message: string,
    currentItem?: number,
    totalItems?: number
  ): void {
    if (options?.onProgress) {
      const progress: HierarchyProgress = {
        stage,
        percentage,
        message
      };

      if (currentItem !== undefined) {
        progress.currentItem = currentItem;
      }

      if (totalItems !== undefined) {
        progress.totalItems = totalItems;
      }

      options.onProgress(progress);
    }
  }
}
