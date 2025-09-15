import { SelectionInterface } from '../../../src/commands/selection-interface';
import { OneNoteHierarchy } from '../../../src/types/onenote';

describe('SelectionInterface', () => {
  let selectionInterface: SelectionInterface;
  let mockHierarchy: OneNoteHierarchy;

  beforeEach(() => {
    selectionInterface = new SelectionInterface();
    mockHierarchy = {
      notebooks: [
        {
          id: 'notebook-1',
          name: 'Test Notebook 1',
          createdDate: new Date(),
          lastModifiedDate: new Date(),
          metadata: {},
          sections: [
            {
              id: 'section-1',
              name: 'Section 1',
              createdDate: new Date(),
              lastModifiedDate: new Date(),
              metadata: {},
              pages: [
                { id: 'page-1', title: 'Page 1', content: 'Content 1', createdDate: new Date(), lastModifiedDate: new Date(), metadata: {} },
                { id: 'page-2', title: 'Page 2', content: 'Content 2', createdDate: new Date(), lastModifiedDate: new Date(), metadata: {} }
              ]
            },
            {
              id: 'section-2',
              name: 'Section 2',
              createdDate: new Date(),
              lastModifiedDate: new Date(),
              metadata: {},
              pages: [
                { id: 'page-3', title: 'Page 3', content: 'Content 3', createdDate: new Date(), lastModifiedDate: new Date(), metadata: {} }
              ]
            }
          ]
        },
        {
          id: 'notebook-2',
          name: 'Test Notebook 2',
          createdDate: new Date(),
          lastModifiedDate: new Date(),
          metadata: {},
          sections: [
            {
              id: 'section-3',
              name: 'Section 3',
              createdDate: new Date(),
              lastModifiedDate: new Date(),
              metadata: {},
              pages: [
                { id: 'page-4', title: 'Page 4', content: 'Content 4', createdDate: new Date(), lastModifiedDate: new Date(), metadata: {} }
              ]
            }
          ]
        }
      ],
      totalNotebooks: 2,
      totalSections: 3,
      totalPages: 4
    };
  });

  describe('displayHierarchy', () => {
    it('should display the complete hierarchy with proper indentation', () => {
      const output = selectionInterface.displayHierarchy(mockHierarchy);
      
      expect(output).toContain('Test Notebook 1');
      expect(output).toContain('Test Notebook 2');
      expect(output).toContain('Section 1');
      expect(output).toContain('Section 2');
      expect(output).toContain('Section 3');
      expect(output).toContain('Page 1');
      expect(output).toContain('Page 2');
      expect(output).toContain('Page 3');
      expect(output).toContain('Page 4');
    });

    it('should include selection indicators for interactive mode', () => {
      const output = selectionInterface.displayHierarchy(mockHierarchy, { interactive: true });
      
      expect(output).toContain('[ ]'); // Checkbox indicators
    });

    it('should show metadata when requested', () => {
      const output = selectionInterface.displayHierarchy(mockHierarchy, { showMetadata: true });
      
      expect(output).toContain('Created:');
      expect(output).toContain('Modified:');
    });
  });

  describe('selectItems', () => {
    it('should allow selecting specific notebooks', async () => {
      const mockInput = jest.fn().mockResolvedValue('notebook-1');
      selectionInterface.setInputHandler(mockInput);
      
      const selected = await selectionInterface.selectItems(mockHierarchy, { 
        type: 'notebooks',
        interactive: true 
      });
      
      expect(selected).toHaveLength(1);
      expect(selected[0].id).toBe('notebook-1');
    });

    it('should allow selecting specific sections', async () => {
      const mockInput = jest.fn().mockResolvedValue('section-1,section-2');
      selectionInterface.setInputHandler(mockInput);
      
      const selected = await selectionInterface.selectItems(mockHierarchy, { 
        type: 'sections',
        interactive: true 
      });
      
      expect(selected).toHaveLength(2);
      expect(selected.map(s => s.id)).toContain('section-1');
      expect(selected.map(s => s.id)).toContain('section-2');
    });

    it('should allow selecting specific pages', async () => {
      const mockInput = jest.fn().mockResolvedValue('page-1,page-3');
      selectionInterface.setInputHandler(mockInput);
      
      const selected = await selectionInterface.selectItems(mockHierarchy, { 
        type: 'pages',
        interactive: true 
      });
      
      expect(selected).toHaveLength(2);
      expect(selected.map(p => p.id)).toContain('page-1');
      expect(selected.map(p => p.id)).toContain('page-3');
    });

    it('should support all selection mode', async () => {
      const selected = await selectionInterface.selectItems(mockHierarchy, { 
        type: 'all',
        interactive: false 
      });
      
      expect(selected).toHaveLength(4); // All pages
    });

    it('should handle invalid selection gracefully', async () => {
      const mockInput = jest.fn().mockResolvedValue('invalid-id,page-1');
      selectionInterface.setInputHandler(mockInput);
      
      const selected = await selectionInterface.selectItems(mockHierarchy, { 
        type: 'pages',
        interactive: true 
      });
      
      expect(selected).toHaveLength(1);
      expect(selected[0].id).toBe('page-1');
    });
  });

  describe('validateSelection', () => {
    it('should validate that selected items exist in hierarchy', () => {
      const validSelection = ['page-1', 'page-2'];
      const result = selectionInterface.validateSelection(validSelection, mockHierarchy);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid item IDs', () => {
      const invalidSelection = ['page-1', 'invalid-page'];
      const result = selectionInterface.validateSelection(invalidSelection, mockHierarchy);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Item "invalid-page" not found in hierarchy');
    });

    it('should detect empty selection', () => {
      const emptySelection: string[] = [];
      const result = selectionInterface.validateSelection(emptySelection, mockHierarchy);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('No items selected');
    });
  });

  describe('getSelectionSummary', () => {
    it('should provide summary of selected items', () => {
      const selectedIds = ['page-1', 'page-2', 'section-1'];
      const summary = selectionInterface.getSelectionSummary(selectedIds, mockHierarchy);
      
      expect(summary.totalItems).toBe(3);
      expect(summary.notebooks).toBe(0); // section-1 is a section, not a notebook
      expect(summary.sections).toBe(1);
      expect(summary.pages).toBe(2);
    });
  });
});
