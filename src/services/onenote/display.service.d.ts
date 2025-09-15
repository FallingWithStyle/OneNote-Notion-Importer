/**
 * OneNote hierarchy display service
 * Handles CLI display of notebook structure
 */
import { OneNoteHierarchy, OneNoteNotebook, OneNoteSection, OneNoteDisplayOptions } from '../../types/onenote';
export interface IOneNoteDisplayService {
    /**
     * Display the complete hierarchy in a tree format
     * @param hierarchy The OneNote hierarchy to display
     * @param options Display options
     */
    displayHierarchy(hierarchy: OneNoteHierarchy, options?: OneNoteDisplayOptions): void;
    /**
     * Display a single notebook
     * @param notebook The notebook to display
     * @param options Display options
     */
    displayNotebook(notebook: OneNoteNotebook, options?: OneNoteDisplayOptions): void;
    /**
     * Display a single section
     * @param section The section to display
     * @param options Display options
     */
    displaySection(section: OneNoteSection, options?: OneNoteDisplayOptions): void;
    /**
     * Display summary statistics
     * @param hierarchy The hierarchy to summarize
     */
    displaySummary(hierarchy: OneNoteHierarchy): void;
}
export declare class OneNoteDisplayService implements IOneNoteDisplayService {
    displayHierarchy(hierarchy: OneNoteHierarchy, options?: OneNoteDisplayOptions): void;
    displayNotebook(notebook: OneNoteNotebook, options?: OneNoteDisplayOptions): void;
    displaySection(section: OneNoteSection, options?: OneNoteDisplayOptions): void;
    displaySummary(hierarchy: OneNoteHierarchy): void;
}
//# sourceMappingURL=display.service.d.ts.map