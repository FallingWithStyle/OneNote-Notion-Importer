import { OneNoteService } from '../../services/onenote/onenote.service';
import { NotionApiService } from '../../services/notion/notion-api.service';
import { HierarchyMappingService } from '../../services/notion/hierarchy-mapping.service';
import { AdvancedContentConverterService } from '../../services/onenote/advanced-content-converter.service';
import { ConfigService } from '../../services/config.service';
import { OneNoteHierarchy, OneNoteNotebook, OneNoteSection, OneNotePage } from '../../types/onenote';
import { logger } from '../../utils/logger';

export interface ImportOptions {
  filePath: string;
  workspaceId: string;
  databaseId?: string;
  selectedItems: string[];
  dryRun?: boolean;
}

export interface ImportProgress {
  status: 'idle' | 'processing' | 'importing' | 'completed' | 'error';
  currentStep: string;
  progress: number;
  totalPages: number;
  processedPages: number;
  successCount: number;
  errorCount: number;
  errors: string[];
}

export interface ImportResult {
  success: boolean;
  totalPages: number;
  successCount: number;
  errorCount: number;
  errors: string[];
  message: string;
}

export class GuiImportService {
  private oneNoteService: OneNoteService;
  private notionApiService: NotionApiService;
  private hierarchyMappingService: HierarchyMappingService;
  private contentConverter: AdvancedContentConverterService;
  private configService: ConfigService;
  private progressCallback?: (progress: ImportProgress) => void;

  constructor() {
    this.oneNoteService = new OneNoteService();
    this.notionApiService = new NotionApiService();
    this.hierarchyMappingService = new HierarchyMappingService();
    this.contentConverter = new AdvancedContentConverterService();
    this.configService = new ConfigService();
  }

  /**
   * Sets a callback for progress updates
   */
  setProgressCallback(callback: (progress: ImportProgress) => void): void {
    this.progressCallback = callback;
  }

  /**
   * Processes a OneNote file and returns the hierarchy
   */
  async processFile(filePath: string): Promise<{ success: boolean; hierarchy?: OneNoteHierarchy; error?: string }> {
    try {
      this.updateProgress({
        status: 'processing',
        currentStep: 'Processing OneNote file...',
        progress: 0,
        totalPages: 0,
        processedPages: 0,
        successCount: 0,
        errorCount: 0,
        errors: []
      });

      const extractionResult = await this.oneNoteService.processFiles([filePath], {
        includeMetadata: true,
        extractImages: true,
        preserveFormatting: true,
        fallbackOnError: true
      });

      if (!extractionResult.success) {
        throw new Error(`Failed to process OneNote files: ${extractionResult.error || 'Unknown error'}`);
      }

      if (!extractionResult.hierarchy) {
        throw new Error('No hierarchy data extracted from OneNote files');
      }

      // Convert to correct hierarchy format
      const guiHierarchy: OneNoteHierarchy = {
        notebooks: extractionResult.hierarchy.notebooks.map(nb => ({
          id: nb.id,
          name: nb.name,
          sections: nb.sections.map(section => ({
            id: section.id,
            name: section.name,
            pages: section.pages.map(page => ({
              id: page.id,
              title: page.title,
              content: page.content,
              createdDate: page.createdDate,
              lastModifiedDate: page.lastModifiedDate,
              metadata: page.metadata || {}
            })),
            createdDate: section.createdDate,
            lastModifiedDate: section.lastModifiedDate,
            metadata: section.metadata || {}
          })),
          createdDate: nb.createdDate,
          lastModifiedDate: nb.lastModifiedDate,
          metadata: nb.metadata || {}
        })),
        totalNotebooks: extractionResult.hierarchy.notebooks.length,
        totalSections: extractionResult.hierarchy.notebooks.reduce((sum, nb) => sum + nb.sections.length, 0),
        totalPages: extractionResult.hierarchy.notebooks.reduce((sum, nb) => 
          sum + nb.sections.reduce((sectionSum, section) => sectionSum + section.pages.length, 0), 0)
      };

      this.updateProgress({
        status: 'completed',
        currentStep: 'File processed successfully',
        progress: 100,
        totalPages: guiHierarchy.totalPages,
        processedPages: guiHierarchy.totalPages,
        successCount: guiHierarchy.totalPages,
        errorCount: 0,
        errors: []
      });

      return {
        success: true,
        hierarchy: guiHierarchy
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.updateProgress({
        status: 'error',
        currentStep: 'Error processing file',
        progress: 0,
        totalPages: 0,
        processedPages: 0,
        successCount: 0,
        errorCount: 1,
        errors: [errorMessage]
      });

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Imports selected items to Notion
   */
  async importToNotion(options: ImportOptions): Promise<ImportResult> {
    try {
      this.updateProgress({
        status: 'importing',
        currentStep: 'Initializing import...',
        progress: 0,
        totalPages: 0,
        processedPages: 0,
        successCount: 0,
        errorCount: 0,
        errors: []
      });

      // Load configuration
      const config = await this.configService.loadConfig();

      // Process the file first
      const fileResult = await this.processFile(options.filePath);
      if (!fileResult.success || !fileResult.hierarchy) {
        throw new Error(fileResult.error || 'Failed to process file');
      }

      // Filter selected items
      const selectedItems = this.filterSelectedItems(fileResult.hierarchy, options.selectedItems);
      const totalPages = this.countSelectedPages(selectedItems);

      this.updateProgress({
        status: 'importing',
        currentStep: 'Connecting to Notion...',
        progress: 10,
        totalPages,
        processedPages: 0,
        successCount: 0,
        errorCount: 0,
        errors: []
      });

      if (options.dryRun) {
        return this.performDryRun(selectedItems, options);
      }

      // Initialize Notion API
      await this.notionApiService.initialize({
        integrationToken: config.notion.apiKey || '',
        workspaceId: options.workspaceId,
        databaseId: options.databaseId || ''
      });

      // Test connection
      const connectionTest = await this.notionApiService.testConnection();
      if (!connectionTest) {
        throw new Error('Failed to connect to Notion API. Please check your token and workspace ID.');
      }

      this.updateProgress({
        status: 'importing',
        currentStep: 'Mapping hierarchy to Notion...',
        progress: 20,
        totalPages,
        processedPages: 0,
        successCount: 0,
        errorCount: 0,
        errors: []
      });

      // Map hierarchy to Notion structure
      const notionMapping = await this.hierarchyMappingService.mapHierarchy(selectedItems, {
        createDatabases: true,
        maxDepth: 10
      });

      // Convert content and create pages
      this.updateProgress({
        status: 'importing',
        currentStep: 'Converting content and creating pages...',
        progress: 30,
        totalPages,
        processedPages: 0,
        successCount: 0,
        errorCount: 0,
        errors: []
      });

      let processedPages = 0;
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (const notebook of selectedItems) {
        for (const section of notebook.sections) {
          for (const page of section.pages) {
            processedPages++;
            const progress = 30 + (processedPages / totalPages) * 60; // 30-90% for page processing

            try {
              this.updateProgress({
                status: 'importing',
                currentStep: `Processing page: ${page.title}`,
                progress,
                totalPages,
                processedPages,
                successCount,
                errorCount,
                errors
              });

              // Convert page content
              const convertedPage = await this.contentConverter.convertAdvancedPage(page, {
                includeMetadata: true,
                outputFormat: 'notion',
                preserveTables: true,
                preserveCodeBlocks: true,
                handleAttachments: true,
                convertTags: true
              });

              // Create Notion page
              const notionPageId = await this.notionApiService.createPage({
                id: page.id,
                title: page.title,
                content: convertedPage.content || '',
                properties: convertedPage.metadata || {},
                children: [],
                metadata: {
                  createdDate: page.createdDate,
                  lastModifiedDate: page.lastModifiedDate
                }
              });

              successCount++;
              logger.debug(`Created page: ${page.title} (ID: ${notionPageId})`);
            } catch (error) {
              errorCount++;
              const errorMessage = `Failed to create page "${page.title}": ${error instanceof Error ? error.message : String(error)}`;
              errors.push(errorMessage);
              logger.error(errorMessage);
            }
          }
        }
      }

      // Final update
      this.updateProgress({
        status: 'completed',
        currentStep: 'Import completed',
        progress: 100,
        totalPages,
        processedPages,
        successCount,
        errorCount,
        errors
      });

      return {
        success: errorCount === 0,
        totalPages,
        successCount,
        errorCount,
        errors,
        message: `Import completed: ${successCount}/${totalPages} pages successfully imported`
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.updateProgress({
        status: 'error',
        currentStep: 'Import failed',
        progress: 0,
        totalPages: 0,
        processedPages: 0,
        successCount: 0,
        errorCount: 1,
        errors: [errorMessage]
      });

      return {
        success: false,
        totalPages: 0,
        successCount: 0,
        errorCount: 1,
        errors: [errorMessage],
        message: `Import failed: ${errorMessage}`
      };
    }
  }

  /**
   * Filters the hierarchy to only include selected items
   */
  private filterSelectedItems(hierarchy: OneNoteHierarchy, selectedIds: string[]): OneNoteNotebook[] {
    const selectedNotebooks: OneNoteNotebook[] = [];

    for (const notebook of hierarchy.notebooks) {
      if (selectedIds.includes(notebook.id)) {
        // Entire notebook selected
        selectedNotebooks.push(notebook);
      } else {
        // Check if any sections or pages are selected
        const selectedSections = notebook.sections.filter(section => 
          selectedIds.includes(section.id) || 
          section.pages.some(page => selectedIds.includes(page.id))
        );

        if (selectedSections.length > 0) {
          const filteredSections = selectedSections.map(section => {
            if (selectedIds.includes(section.id)) {
              // Entire section selected
              return section;
            } else {
              // Only some pages selected
              const selectedPages = section.pages.filter(page => selectedIds.includes(page.id));
              return {
                ...section,
                pages: selectedPages
              };
            }
          });

          selectedNotebooks.push({
            ...notebook,
            sections: filteredSections
          });
        }
      }
    }

    return selectedNotebooks;
  }

  /**
   * Counts the total number of pages in selected items
   */
  private countSelectedPages(notebooks: OneNoteNotebook[]): number {
    return notebooks.reduce((sum, notebook) => 
      sum + notebook.sections.reduce((sectionSum, section) => 
        sectionSum + section.pages.length, 0), 0);
  }

  /**
   * Performs a dry run of the import
   */
  private async performDryRun(selectedItems: OneNoteNotebook[], options: ImportOptions): Promise<ImportResult> {
    const totalPages = this.countSelectedPages(selectedItems);
    
    this.updateProgress({
      status: 'completed',
      currentStep: 'Dry run completed',
      progress: 100,
      totalPages,
      processedPages: totalPages,
      successCount: totalPages,
      errorCount: 0,
      errors: []
    });

    return {
      success: true,
      totalPages,
      successCount: totalPages,
      errorCount: 0,
      errors: [],
      message: `Dry run completed: Would import ${totalPages} pages to Notion`
    };
  }

  /**
   * Updates progress via callback
   */
  private updateProgress(progress: ImportProgress): void {
    if (this.progressCallback) {
      this.progressCallback(progress);
    }
  }
}
