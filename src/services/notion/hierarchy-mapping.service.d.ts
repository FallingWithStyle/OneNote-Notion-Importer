/**
 * Hierarchy Mapping Service
 * Maps OneNote hierarchy to Notion structure
 */
import { OneNoteNotebook, OneNoteSection, OneNotePage } from '../../types/onenote';
import { NotionPage } from './notion-api.service';
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
    validateHierarchy(pages: NotionPage[]): {
        isValid: boolean;
        errors: string[];
    };
    /**
     * Flatten hierarchy for processing
     * @param pages Notion pages with hierarchy
     * @returns Flattened array of pages
     */
    flattenHierarchy(pages: NotionPage[]): NotionPage[];
}
export declare class HierarchyMappingService implements IHierarchyMappingService {
    mapHierarchy(notebooks: OneNoteNotebook[], options: HierarchyMappingOptions): Promise<HierarchyMappingResult>;
    createDatabaseStructure(notebooks: OneNoteNotebook[], options: HierarchyMappingOptions): Promise<string[]>;
    mapSectionToPage(section: OneNoteSection, parentId?: string, options?: HierarchyMappingOptions): Promise<NotionPage>;
    mapPageToNotionPage(page: OneNotePage, parentId?: string, options?: HierarchyMappingOptions): Promise<NotionPage>;
    validateHierarchy(pages: NotionPage[]): {
        isValid: boolean;
        errors: string[];
    };
    flattenHierarchy(pages: NotionPage[]): NotionPage[];
    private hasCircularReference;
    private countPages;
    private countSections;
    private mapNotebooks;
    private createNotebookPage;
    private mapSections;
    private createSuccessResult;
    private createErrorResult;
    private reportProgress;
}
//# sourceMappingURL=hierarchy-mapping.service.d.ts.map