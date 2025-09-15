import { BatchOperations } from '../../../src/commands/batch-operations';
import { OneNoteHierarchy } from '../../../src/types/onenote';
import fs from 'fs';
import path from 'path';

describe('BatchOperations', () => {
  let batchOperations: BatchOperations;
  let mockHierarchy: OneNoteHierarchy;

  beforeEach(() => {
    batchOperations = new BatchOperations();
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
                {
                  id: 'page-1',
                  title: 'Page 1',
                  content: 'Content 1',
                  createdDate: new Date(),
                  lastModifiedDate: new Date(),
                  metadata: {}
                },
                {
                  id: 'page-2',
                  title: 'Page 2',
                  content: 'Content 2',
                  createdDate: new Date(),
                  lastModifiedDate: new Date(),
                  metadata: {}
                }
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
              id: 'section-2',
              name: 'Section 2',
              createdDate: new Date(),
              lastModifiedDate: new Date(),
              metadata: {},
              pages: [
                {
                  id: 'page-3',
                  title: 'Page 3',
                  content: 'Content 3',
                  createdDate: new Date(),
                  lastModifiedDate: new Date(),
                  metadata: {}
                }
              ]
            }
          ]
        }
      ],
      totalNotebooks: 2,
      totalSections: 2,
      totalPages: 3
    };
  });

  describe('selectFiles', () => {
    it('should select files from directory', async () => {
      const tempDir = '/tmp/test-batch';
      const files = ['file1.one', 'file2.onepkg', 'file3.txt'];
      
      // Create temp directory and files
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      files.forEach(file => {
        fs.writeFileSync(path.join(tempDir, file), 'test content');
      });

      const result = await batchOperations.selectFiles(tempDir, {
        patterns: ['*.one', '*.onepkg'],
        recursive: false
      });

      expect(result.success).toBe(true);
      expect(result.files).toHaveLength(2);
      expect(result.files).toContain(path.join(tempDir, 'file1.one'));
      expect(result.files).toContain(path.join(tempDir, 'file2.onepkg'));
      expect(result.files).not.toContain(path.join(tempDir, 'file3.txt'));

      // Cleanup
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    it('should select files recursively', async () => {
      const tempDir = '/tmp/test-batch-recursive';
      const subDir = path.join(tempDir, 'subdir');
      
      // Create temp directory structure
      fs.mkdirSync(tempDir, { recursive: true });
      fs.mkdirSync(subDir, { recursive: true });
      
      fs.writeFileSync(path.join(tempDir, 'file1.one'), 'test content');
      fs.writeFileSync(path.join(subDir, 'file2.one'), 'test content');

      const result = await batchOperations.selectFiles(tempDir, {
        patterns: ['*.one'],
        recursive: true
      });

      expect(result.success).toBe(true);
      expect(result.files).toHaveLength(2);
      expect(result.files).toContain(path.join(tempDir, 'file1.one'));
      expect(result.files).toContain(path.join(subDir, 'file2.one'));

      // Cleanup
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    it('should handle invalid directory', async () => {
      const result = await batchOperations.selectFiles('/nonexistent/directory', {
        patterns: ['*.one'],
        recursive: false
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Directory not found');
    });
  });

  describe('processBatch', () => {
    it('should process multiple files in batch', async () => {
      const files = ['file1.one', 'file2.one', 'file3.one'];
      const mockProcessor = jest.fn().mockResolvedValue({ success: true });

      const result = await batchOperations.processBatch(files, mockProcessor, {
        maxConcurrency: 2,
        continueOnError: true
      });

      expect(result.success).toBe(true);
      expect(result.processed).toBe(3);
      expect(result.successful).toBe(3);
      expect(result.failed).toBe(0);
      expect(mockProcessor).toHaveBeenCalledTimes(3);
    });

    it('should handle processing errors', async () => {
      const files = ['file1.one', 'file2.one', 'file3.one'];
      const mockProcessor = jest.fn()
        .mockResolvedValueOnce({ success: true })
        .mockRejectedValueOnce(new Error('Processing failed'))
        .mockResolvedValueOnce({ success: true });

      const result = await batchOperations.processBatch(files, mockProcessor, {
        maxConcurrency: 1,
        continueOnError: true
      });

      expect(result.success).toBe(true);
      expect(result.processed).toBe(3);
      expect(result.successful).toBe(2);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
    });

    it('should stop on first error when continueOnError is false', async () => {
      const files = ['file1.one', 'file2.one', 'file3.one'];
      const mockProcessor = jest.fn()
        .mockResolvedValueOnce({ success: true })
        .mockRejectedValueOnce(new Error('Processing failed'))
        .mockResolvedValueOnce({ success: true });

      const result = await batchOperations.processBatch(files, mockProcessor, {
        maxConcurrency: 1,
        continueOnError: false
      });

      expect(result.success).toBe(false);
      expect(result.processed).toBe(2);
      expect(result.successful).toBe(1);
      expect(result.failed).toBe(1);
      expect(mockProcessor).toHaveBeenCalledTimes(2);
    });
  });

  describe('createBatchPlan', () => {
    it('should create batch processing plan', () => {
      const files = ['file1.one', 'file2.one', 'file3.one'];
      const plan = batchOperations.createBatchPlan(files, {
        maxConcurrency: 2,
        estimatedTimePerFile: 1000
      });

      expect(plan.totalFiles).toBe(3);
      expect(plan.batches).toHaveLength(2);
      expect(plan.estimatedTime).toBeGreaterThan(0);
      expect(plan.batches[0]).toHaveLength(2);
      expect(plan.batches[1]).toHaveLength(1);
    });

    it('should handle single file batch', () => {
      const files = ['file1.one'];
      const plan = batchOperations.createBatchPlan(files, {
        maxConcurrency: 2,
        estimatedTimePerFile: 1000
      });

      expect(plan.totalFiles).toBe(1);
      expect(plan.batches).toHaveLength(1);
      expect(plan.batches[0]).toHaveLength(1);
    });
  });

  describe('validateBatchFiles', () => {
    it('should validate batch files exist and are accessible', async () => {
      const tempDir = '/tmp/test-validate';
      const files = ['file1.one', 'file2.one'];
      
      // Create temp directory and files
      fs.mkdirSync(tempDir, { recursive: true });
      files.forEach(file => {
        fs.writeFileSync(path.join(tempDir, file), 'test content');
      });

      const filePaths = files.map(f => path.join(tempDir, f));
      const result = await batchOperations.validateBatchFiles(filePaths);

      expect(result.validFiles).toHaveLength(2);
      expect(result.invalidFiles).toHaveLength(0);
      expect(result.errors).toHaveLength(0);

      // Cleanup
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    it('should detect invalid files', async () => {
      const files = ['/nonexistent/file1.one', '/nonexistent/file2.one'];
      const result = await batchOperations.validateBatchFiles(files);

      expect(result.validFiles).toHaveLength(0);
      expect(result.invalidFiles).toHaveLength(2);
      expect(result.errors).toHaveLength(2);
    });
  });

  describe('generateBatchReport', () => {
    it('should generate batch processing report', () => {
      const stats = {
        totalFiles: 10,
        processed: 8,
        successful: 6,
        failed: 2,
        skipped: 0,
        totalTime: 5000,
        averageTime: 625
      };

      const report = batchOperations.generateBatchReport(stats);

      expect(report).toContain('BATCH PROCESSING REPORT');
      expect(report).toContain('Total Files: 10');
      expect(report).toContain('Processed: 8');
      expect(report).toContain('Successful: 6');
      expect(report).toContain('Failed: 2');
      expect(report).toContain('Total Time: 5.00s');
      expect(report).toContain('Average Time: 625ms');
    });
  });

  describe('filterFilesByType', () => {
    it('should filter files by type', () => {
      const files = [
        'file1.one',
        'file2.onepkg',
        'file3.txt',
        'file4.one',
        'file5.doc'
      ];

      const oneFiles = batchOperations.filterFilesByType(files, 'one');
      const onepkgFiles = batchOperations.filterFilesByType(files, 'onepkg');

      expect(oneFiles).toHaveLength(2);
      expect(oneFiles).toContain('file1.one');
      expect(oneFiles).toContain('file4.one');

      expect(onepkgFiles).toHaveLength(1);
      expect(onepkgFiles).toContain('file2.onepkg');
    });
  });

  describe('groupFilesByNotebook', () => {
    it('should group files by notebook', () => {
      const files = [
        'notebook1/section1/page1.one',
        'notebook1/section1/page2.one',
        'notebook2/section1/page1.one',
        'notebook1/section2/page1.one'
      ];

      const grouped = batchOperations.groupFilesByNotebook(files);

      expect(grouped).toHaveProperty('notebook1');
      expect(grouped).toHaveProperty('notebook2');
      expect(grouped.notebook1).toHaveLength(3);
      expect(grouped.notebook2).toHaveLength(1);
    });
  });

  describe('createBatchScript', () => {
    it('should create batch processing script', () => {
      const files = ['file1.one', 'file2.one', 'file3.one'];
      const script = batchOperations.createBatchScript(files, {
        command: 'oni import',
        options: { workspace: 'workspace-123' }
      });

      expect(script).toContain('oni import');
      expect(script).toContain('--workspace workspace-123');
      expect(script).toContain('file1.one');
      expect(script).toContain('file2.one');
      expect(script).toContain('file3.one');
    });
  });
});
