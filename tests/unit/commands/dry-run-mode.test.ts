import { DryRunMode } from '../../../src/commands/dry-run-mode';
import { OneNoteHierarchy } from '../../../src/types/onenote';

describe('DryRunMode', () => {
  let dryRunMode: DryRunMode;
  let mockHierarchy: OneNoteHierarchy;

  beforeEach(() => {
    dryRunMode = new DryRunMode();
    mockHierarchy = {
      notebooks: [
        {
          id: 'notebook-1',
          name: 'Test Notebook 1',
          createdDate: new Date('2023-01-01'),
          lastModifiedDate: new Date('2023-01-02'),
          metadata: { author: 'Test User' },
          sections: [
            {
              id: 'section-1',
              name: 'Section 1',
              createdDate: new Date('2023-01-01'),
              lastModifiedDate: new Date('2023-01-02'),
              metadata: { color: 'blue' },
              pages: [
                { 
                  id: 'page-1', 
                  title: 'Page 1', 
                  content: 'Content 1 with **bold** text', 
                  createdDate: new Date('2023-01-01'), 
                  lastModifiedDate: new Date('2023-01-02'), 
                  metadata: { tags: ['important'] } 
                },
                { 
                  id: 'page-2', 
                  title: 'Page 2', 
                  content: 'Content 2 with *italic* text', 
                  createdDate: new Date('2023-01-01'), 
                  lastModifiedDate: new Date('2023-01-02'), 
                  metadata: { tags: ['draft'] } 
                }
              ]
            }
          ]
        }
      ],
      totalNotebooks: 1,
      totalSections: 1,
      totalPages: 2
    };
  });

  describe('generatePreview', () => {
    it('should generate detailed preview of what would be imported', () => {
      const preview = dryRunMode.generatePreview(mockHierarchy, {
        targetWorkspace: 'workspace-123',
        targetDatabase: 'database-456',
        includeMetadata: true,
        showContent: true
      });

      expect(preview).toContain('DRY RUN PREVIEW');
      expect(preview).toContain('Test Notebook 1');
      expect(preview).toContain('Section 1');
      expect(preview).toContain('Page 1');
      expect(preview).toContain('Page 2');
      expect(preview).toContain('workspace-123');
      expect(preview).toContain('database-456');
    });

    it('should show content preview when requested', () => {
      const preview = dryRunMode.generatePreview(mockHierarchy, {
        targetWorkspace: 'workspace-123',
        targetDatabase: 'database-456',
        includeMetadata: false,
        showContent: true
      });

      expect(preview).toContain('Content 1 with **bold** text');
      expect(preview).toContain('Content 2 with *italic* text');
    });

    it('should show metadata when requested', () => {
      const preview = dryRunMode.generatePreview(mockHierarchy, {
        targetWorkspace: 'workspace-123',
        targetDatabase: 'database-456',
        includeMetadata: true,
        showContent: false
      });

      expect(preview).toContain('Author: Test User');
      expect(preview).toContain('Color: blue');
      expect(preview).toContain('Tags: important');
      expect(preview).toContain('Tags: draft');
    });

    it('should calculate and display statistics', () => {
      const preview = dryRunMode.generatePreview(mockHierarchy, {
        targetWorkspace: 'workspace-123',
        targetDatabase: 'database-456',
        includeMetadata: false,
        showContent: false
      });

      expect(preview).toContain('Total Notebooks: 1');
      expect(preview).toContain('Total Sections: 1');
      expect(preview).toContain('Total Pages: 2');
    });
  });

  describe('generateImportPlan', () => {
    it('should generate step-by-step import plan', () => {
      const plan = dryRunMode.generateImportPlan(mockHierarchy, {
        targetWorkspace: 'workspace-123',
        targetDatabase: 'database-456'
      });

      expect(plan).toContain('IMPORT PLAN');
      expect(plan).toContain('Step 1: Create databases for notebooks');
      expect(plan).toContain('Create database: "Test Notebook 1"');
      expect(plan).toContain('Step 2: Create section pages');
      expect(plan).toContain('Step 3: Create page content');
      expect(plan).toContain('Step 4: Upload attachments');
    });

    it('should estimate processing time', () => {
      const plan = dryRunMode.generateImportPlan(mockHierarchy, {
        targetWorkspace: 'workspace-123',
        targetDatabase: 'database-456'
      });

      expect(plan).toContain('Estimated processing time:');
    });
  });

  describe('validateImportPlan', () => {
    it('should validate the import plan for potential issues', () => {
      const validation = dryRunMode.validateImportPlan(mockHierarchy, {
        targetWorkspace: 'workspace-123',
        targetDatabase: 'database-456'
      });

      expect(validation.isValid).toBe(true);
      expect(validation.warnings).toHaveLength(0);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect potential issues', () => {
      const largeHierarchy = {
        ...mockHierarchy,
        notebooks: Array(100).fill(null).map((_, i) => ({
          id: `notebook-${i}`,
          name: `Notebook ${i}`,
          createdDate: new Date(),
          lastModifiedDate: new Date(),
          metadata: {},
          sections: []
        })),
        totalNotebooks: 100,
        totalSections: 0,
        totalPages: 0
      };

      const validation = dryRunMode.validateImportPlan(largeHierarchy, {
        targetWorkspace: 'workspace-123',
        targetDatabase: 'database-456'
      });

      expect(validation.warnings.length).toBeGreaterThan(0);
      expect(validation.warnings.some(w => w.includes('Large number of notebooks'))).toBe(true);
    });
  });

  describe('exportPreview', () => {
    it('should export preview to file', async () => {
      const tempFile = '/tmp/preview-test.txt';
      const result = await dryRunMode.exportPreview(mockHierarchy, {
        targetWorkspace: 'workspace-123',
        targetDatabase: 'database-456',
        outputFile: tempFile,
        format: 'text'
      });

      expect(result.success).toBe(true);
      expect(result.filePath).toBe(tempFile);
    });

    it('should support different output formats', async () => {
      const tempFile = '/tmp/preview-test.json';
      const result = await dryRunMode.exportPreview(mockHierarchy, {
        targetWorkspace: 'workspace-123',
        targetDatabase: 'database-456',
        outputFile: tempFile,
        format: 'json'
      });

      expect(result.success).toBe(true);
      expect(result.filePath).toBe(tempFile);
    });
  });
});
