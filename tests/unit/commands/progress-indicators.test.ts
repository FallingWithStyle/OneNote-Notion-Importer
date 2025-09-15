import { ProgressIndicators } from '../../../src/commands/progress-indicators';

describe('ProgressIndicators', () => {
  let progressIndicators: ProgressIndicators;

  beforeEach(() => {
    progressIndicators = new ProgressIndicators();
  });

  describe('createProgressBar', () => {
    it('should create a progress bar with correct length', () => {
      const bar = progressIndicators.createProgressBar(50, 100, 20);
      
      expect(bar).toContain('[');
      expect(bar).toContain(']');
      expect(bar.length).toBe(22); // 20 chars + brackets
    });

    it('should show correct filled portion', () => {
      const bar = progressIndicators.createProgressBar(25, 100, 20);
      
      const filledLength = (bar.match(/█/g) || []).length;
      const emptyLength = (bar.match(/░/g) || []).length;
      
      expect(filledLength).toBe(5); // 25% of 20
      expect(emptyLength).toBe(15); // 75% of 20
    });

    it('should handle edge cases', () => {
      const bar0 = progressIndicators.createProgressBar(0, 100, 20);
      const bar100 = progressIndicators.createProgressBar(100, 100, 20);
      
      expect(bar0).toContain('░░░░░░░░░░░░░░░░░░░░');
      expect(bar100).toContain('████████████████████');
    });
  });

  describe('createSpinner', () => {
    it('should create a spinner with message', () => {
      const spinner = progressIndicators.createSpinner('Processing...');
      
      expect(spinner).toContain('Processing...');
      expect(spinner).toMatch(/[⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏]/); // Spinner character
    });

    it('should support different spinner styles', () => {
      const spinner1 = progressIndicators.createSpinner('Loading...', 'dots');
      const spinner2 = progressIndicators.createSpinner('Working...', 'bounce');
      
      expect(spinner1).toContain('Loading...');
      expect(spinner2).toContain('Working...');
    });
  });

  describe('createStatusUpdate', () => {
    it('should create status update with timestamp', () => {
      const status = progressIndicators.createStatusUpdate('Import started', 'info');
      
      expect(status).toContain('Import started');
      expect(status).toContain('INFO');
      expect(status).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/); // ISO timestamp
    });

    it('should support different status levels', () => {
      const info = progressIndicators.createStatusUpdate('Info message', 'info');
      const warn = progressIndicators.createStatusUpdate('Warning message', 'warn');
      const error = progressIndicators.createStatusUpdate('Error message', 'error');
      const success = progressIndicators.createStatusUpdate('Success message', 'success');
      
      expect(info).toContain('INFO');
      expect(warn).toContain('WARN');
      expect(error).toContain('ERROR');
      expect(success).toContain('SUCCESS');
    });
  });

  describe('createPercentageDisplay', () => {
    it('should create percentage display', () => {
      const display = progressIndicators.createPercentageDisplay(75, 100);
      
      expect(display).toContain('75%');
      expect(display).toContain('(75/100)');
    });

    it('should handle decimal percentages', () => {
      const display = progressIndicators.createPercentageDisplay(33, 100);
      
      expect(display).toContain('33%');
    });
  });

  describe('createETA', () => {
    it('should calculate and display ETA', () => {
      const eta = progressIndicators.createETA(50, 100, Date.now() - 5000);
      
      expect(eta).toContain('ETA:');
      expect(eta).toMatch(/\d+:\d+/); // Time format
    });

    it('should handle zero progress', () => {
      const eta = progressIndicators.createETA(0, 100, Date.now());
      
      expect(eta).toContain('ETA: Calculating...');
    });
  });

  describe('createMultiStepProgress', () => {
    it('should create multi-step progress display', () => {
      const steps = [
        { name: 'Step 1', completed: true },
        { name: 'Step 2', completed: true },
        { name: 'Step 3', completed: false },
        { name: 'Step 4', completed: false }
      ];
      
      const display = progressIndicators.createMultiStepProgress(steps, 2);
      
      expect(display).toContain('Step 1');
      expect(display).toContain('Step 2');
      expect(display).toContain('Step 3');
      expect(display).toContain('Step 4');
      expect(display).toContain('✓'); // Completed steps
      expect(display).toContain('→'); // Current step
    });
  });

  describe('createFileProgress', () => {
    it('should create file processing progress', () => {
      const progress = progressIndicators.createFileProgress({
        currentFile: 'file1.one',
        currentIndex: 3,
        totalFiles: 10,
        processedBytes: 1024,
        totalBytes: 10240
      });
      
      expect(progress).toContain('file1.one');
      expect(progress).toContain('(3/10)');
      expect(progress).toContain('10%'); // 1024/10240
    });
  });

  describe('createMemoryUsage', () => {
    it('should create memory usage display', () => {
      const memory = progressIndicators.createMemoryUsage({
        used: 50 * 1024 * 1024, // 50MB
        total: 100 * 1024 * 1024, // 100MB
        peak: 75 * 1024 * 1024 // 75MB
      });
      
      expect(memory).toContain('50.0 MB');
      expect(memory).toContain('100.0 MB');
      expect(memory).toContain('75.0 MB');
      expect(memory).toContain('Peak:');
    });
  });

  describe('createSpeedIndicator', () => {
    it('should create speed indicator', () => {
      const speed = progressIndicators.createSpeedIndicator({
        itemsPerSecond: 10.5,
        bytesPerSecond: 1024 * 1024, // 1MB/s
        averageTime: 100 // 100ms per item
      });
      
      expect(speed).toContain('10.5 items/s');
      expect(speed).toContain('1.0 MB/s');
      expect(speed).toContain('100ms avg');
    });
  });

  describe('clearLine', () => {
    it('should clear the current line', () => {
      const cleared = progressIndicators.clearLine();
      
      expect(cleared).toContain('\r');
      expect(cleared).toContain(' '.repeat(80)); // Clear with spaces
    });
  });

  describe('createSummary', () => {
    it('should create operation summary', () => {
      const summary = progressIndicators.createSummary({
        totalItems: 100,
        successful: 95,
        failed: 3,
        skipped: 2,
        totalTime: 30000,
        averageTime: 300
      });
      
      expect(summary).toContain('Total Items: 100');
      expect(summary).toContain('Successful: 95');
      expect(summary).toContain('Failed: 3');
      expect(summary).toContain('Skipped: 2');
      expect(summary).toContain('30.0s');
      expect(summary).toContain('300ms per item');
    });
  });
});
