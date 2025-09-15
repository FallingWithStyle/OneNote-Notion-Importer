/**
 * Mock data factory for OneNote services
 * Centralizes mock data creation to eliminate duplication
 */
import { OneNoteHierarchy, OneNoteNotebook, OneNoteSection, OneNotePage, OneNoteExtractionResult } from '../../types/onenote';
export declare class OneNoteMockDataFactory {
    /**
     * Create a mock page with default values
     */
    static createMockPage(overrides?: Partial<OneNotePage>): OneNotePage;
    /**
     * Create a mock section with default values
     */
    static createMockSection(overrides?: Partial<OneNoteSection>): OneNoteSection;
    /**
     * Create a mock notebook with default values
     */
    static createMockNotebook(overrides?: Partial<OneNoteNotebook>): OneNoteNotebook;
    /**
     * Create a mock hierarchy with default values
     */
    static createMockHierarchy(overrides?: Partial<OneNoteHierarchy>): OneNoteHierarchy;
    /**
     * Create a mock extraction result with default values
     */
    static createMockExtractionResult(overrides?: Partial<OneNoteExtractionResult>): OneNoteExtractionResult;
    /**
     * Create fallback hierarchy for error scenarios
     */
    static createFallbackHierarchy(type?: 'extraction' | 'parsing'): OneNoteHierarchy;
    /**
     * Create multiple mock pages for multi-page scenarios
     */
    static createMultipleMockPages(count: number): OneNotePage[];
    /**
     * Create multiple mock sections for multi-section scenarios
     */
    static createMultipleMockSections(count: number): OneNoteSection[];
    /**
     * Create multiple mock notebooks for multi-notebook scenarios
     */
    static createMultipleMockNotebooks(count: number): OneNoteNotebook[];
}
//# sourceMappingURL=mock-data.factory.d.ts.map