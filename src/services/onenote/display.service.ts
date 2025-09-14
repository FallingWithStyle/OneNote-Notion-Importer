/**
 * OneNote hierarchy display service
 * Handles CLI display of notebook structure
 */

import { OneNoteHierarchy, OneNoteNotebook, OneNoteSection, OneNotePage, OneNoteDisplayOptions } from '../../types/onenote';

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

export class OneNoteDisplayService implements IOneNoteDisplayService {
  displayHierarchy(hierarchy: OneNoteHierarchy, options?: OneNoteDisplayOptions): void {
    const opts: Required<OneNoteDisplayOptions> = { 
      showMetadata: false, 
      showContent: false, 
      maxDepth: 3, 
      includeEmptySections: true, 
      sortBy: 'name',
      outputFormat: 'tree',
      ...options 
    };

    if (hierarchy.notebooks.length === 0) {
      console.log('No notebooks found');
      return;
    }

    console.log('OneNote Hierarchy:');
    hierarchy.notebooks.forEach((notebook, index) => {
      this.displayNotebook(notebook, { ...opts, maxDepth: opts.maxDepth - 1 });
    });
  }

  displayNotebook(notebook: OneNoteNotebook, options?: OneNoteDisplayOptions): void {
    const opts: Required<OneNoteDisplayOptions> = { 
      showMetadata: false, 
      showContent: false, 
      maxDepth: 3, 
      includeEmptySections: true, 
      sortBy: 'name',
      outputFormat: 'tree',
      ...options 
    };

    console.log(`📓 ${notebook.name}`);
    
    if (notebook.sections.length === 0) {
      console.log('  No sections found');
      return;
    }

    if (opts.maxDepth > 0) {
      notebook.sections.forEach(section => {
        this.displaySection(section, { ...opts, maxDepth: opts.maxDepth - 1 });
      });
    }
  }

  displaySection(section: OneNoteSection, options?: OneNoteDisplayOptions): void {
    const opts: Required<OneNoteDisplayOptions> = { 
      showMetadata: false, 
      showContent: false, 
      maxDepth: 3, 
      includeEmptySections: true, 
      sortBy: 'name',
      outputFormat: 'tree',
      ...options 
    };

    console.log(`  📁 ${section.name}`);
    
    if (section.pages.length === 0) {
      console.log('    No pages found');
      return;
    }

    if (opts.maxDepth > 0) {
      section.pages.forEach(page => {
        console.log(`    📄 ${page.title}`);
        if (opts.showContent && page.content) {
          console.log(`      ${page.content.substring(0, 100)}...`);
        }
      });
    }
  }

  displaySummary(hierarchy: OneNoteHierarchy): void {
    console.log('Summary:');
    console.log(`${hierarchy.totalNotebooks} notebook${hierarchy.totalNotebooks !== 1 ? 's' : ''}`);
    console.log(`${hierarchy.totalSections} section${hierarchy.totalSections !== 1 ? 's' : ''}`);
    console.log(`${hierarchy.totalPages} page${hierarchy.totalPages !== 1 ? 's' : ''}`);
  }
}
