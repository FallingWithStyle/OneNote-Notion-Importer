import { OneNoteHierarchy, OneNoteNotebook, OneNoteSection, OneNotePage } from '../types/onenote';

export interface SelectionOptions {
  interactive?: boolean;
  showMetadata?: boolean;
  type?: 'notebooks' | 'sections' | 'pages' | 'all';
  maxDepth?: number;
}

export interface SelectionResult {
  isValid: boolean;
  errors: string[];
}

export interface SelectionSummary {
  totalItems: number;
  notebooks: number;
  sections: number;
  pages: number;
}

export class SelectionInterface {
  private inputHandler?: (prompt: string) => Promise<string>;

  /**
   * Sets a custom input handler for testing or different input methods
   */
  setInputHandler(handler: (prompt: string) => Promise<string>): void {
    this.inputHandler = handler;
  }

  /**
   * Displays the hierarchy in a formatted way
   */
  displayHierarchy(hierarchy: OneNoteHierarchy, options: SelectionOptions = {}): string {
    const { interactive = false, showMetadata = false, maxDepth = 10 } = options;
    let output = '';
    let currentDepth = 0;

    for (const notebook of hierarchy.notebooks) {
      if (currentDepth >= maxDepth) break;
      
      const checkbox = interactive ? '[ ] ' : '';
      output += `${checkbox}📚 ${notebook.name}\n`;
      
      if (showMetadata) {
        output += `    Created: ${notebook.createdDate?.toISOString() || 'Unknown'}\n`;
        output += `    Modified: ${notebook.lastModifiedDate?.toISOString() || 'Unknown'}\n`;
      }

      for (const section of notebook.sections) {
        if (currentDepth + 1 >= maxDepth) break;
        
        output += `  ${checkbox}📁 ${section.name}\n`;
        
        if (showMetadata) {
          output += `      Created: ${section.createdDate?.toISOString() || 'Unknown'}\n`;
          output += `      Modified: ${section.lastModifiedDate?.toISOString() || 'Unknown'}\n`;
        }

        for (const page of section.pages) {
          if (currentDepth + 2 >= maxDepth) break;
          
          output += `    ${checkbox}📄 ${page.title}\n`;
          
          if (showMetadata) {
            output += `        Created: ${page.createdDate.toISOString()}\n`;
            output += `        Modified: ${page.lastModifiedDate.toISOString()}\n`;
          }
        }
      }
      
      output += '\n';
    }

    return output;
  }

  /**
   * Allows interactive selection of items from the hierarchy
   */
  async selectItems(hierarchy: OneNoteHierarchy, options: SelectionOptions = {}): Promise<any[]> {
    const { type = 'all', interactive = false } = options;

    if (!interactive) {
      return this.selectAllItems(hierarchy, type);
    }

    return this.selectInteractiveItems(hierarchy, type);
  }

  /**
   * Selects all items of the specified type
   */
  private selectAllItems(hierarchy: OneNoteHierarchy, type: string): any[] {
    const allItems: any[] = [];

    for (const notebook of hierarchy.notebooks) {
      if (type === 'notebooks') {
        allItems.push(notebook);
      }

      for (const section of notebook.sections) {
        if (type === 'sections') {
          allItems.push(section);
        }

        for (const page of section.pages) {
          if (type === 'pages' || type === 'all') {
            allItems.push(page);
          }
        }
      }
    }

    return allItems;
  }

  /**
   * Handles interactive selection of items
   */
  private async selectInteractiveItems(hierarchy: OneNoteHierarchy, type: string): Promise<any[]> {
    if (!this.inputHandler) {
      throw new Error('Input handler not set. Call setInputHandler() first.');
    }

    // Display hierarchy for selection
    console.log(this.displayHierarchy(hierarchy, { interactive: true }));
    
    // Get user input
    const prompt = `Select ${type} (comma-separated IDs): `;
    const input = await this.inputHandler(prompt);
    
    // Parse selection
    const selectedIds = input.split(',').map(id => id.trim()).filter(id => id.length > 0);
    
    // Find selected items
    const selectedItems: any[] = [];
    const allItems = this.getAllItemsById(hierarchy);

    for (const id of selectedIds) {
      const item = allItems.get(id);
      if (item) {
        selectedItems.push(item);
      }
    }

    return selectedItems;
  }

  /**
   * Gets all items by their ID for quick lookup
   */
  private getAllItemsById(hierarchy: OneNoteHierarchy): Map<string, any> {
    const items = new Map<string, any>();

    for (const notebook of hierarchy.notebooks) {
      items.set(notebook.id, notebook);

      for (const section of notebook.sections) {
        items.set(section.id, section);

        for (const page of section.pages) {
          items.set(page.id, page);
        }
      }
    }

    return items;
  }

  /**
   * Validates that selected items exist in the hierarchy
   */
  validateSelection(selectedIds: string[], hierarchy: OneNoteHierarchy): SelectionResult {
    const errors: string[] = [];
    const allItems = this.getAllItemsById(hierarchy);

    if (selectedIds.length === 0) {
      errors.push('No items selected');
    }

    for (const id of selectedIds) {
      if (!allItems.has(id)) {
        errors.push(`Item "${id}" not found in hierarchy`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Provides a summary of selected items
   */
  getSelectionSummary(selectedIds: string[], hierarchy: OneNoteHierarchy): SelectionSummary {
    const allItems = this.getAllItemsById(hierarchy);
    let notebooks = 0;
    let sections = 0;
    let pages = 0;

    for (const id of selectedIds) {
      const item = allItems.get(id);
      if (item) {
        // Determine item type by checking the hierarchy structure
        const isNotebook = hierarchy.notebooks.some(nb => nb.id === id);
        const isSection = hierarchy.notebooks.some(nb => 
          nb.sections.some(section => section.id === id)
        );
        const isPage = hierarchy.notebooks.some(nb => 
          nb.sections.some(section => 
            section.pages.some(page => page.id === id)
          )
        );

        if (isNotebook) {
          notebooks++;
        } else if (isSection) {
          sections++;
        } else if (isPage) {
          pages++;
        }
      }
    }

    return {
      totalItems: selectedIds.length,
      notebooks,
      sections,
      pages
    };
  }
}
