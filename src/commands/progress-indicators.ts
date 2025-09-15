export interface Step {
  name: string;
  completed: boolean;
}

export interface FileProgressInfo {
  currentFile: string;
  currentIndex: number;
  totalFiles: number;
  processedBytes: number;
  totalBytes: number;
}

export interface MemoryUsage {
  used: number;
  total: number;
  peak: number;
}

export interface SpeedInfo {
  itemsPerSecond: number;
  bytesPerSecond: number;
  averageTime: number;
}

export interface SummaryInfo {
  totalItems: number;
  successful: number;
  failed: number;
  skipped: number;
  totalTime: number;
  averageTime: number;
}

export class ProgressIndicators {
  private spinnerChars = {
    dots: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
    bounce: ['⠁', '⠂', '⠄', '⠂'],
    line: ['-', '\\', '|', '/'],
    arrow: ['←', '↖', '↑', '↗', '→', '↘', '↓', '↙']
  };

  /**
   * Creates a progress bar
   */
  createProgressBar(current: number, total: number, length: number = 20): string {
    const percentage = Math.min(100, Math.max(0, (current / total) * 100));
    const filledLength = Math.round((percentage / 100) * length);
    const emptyLength = length - filledLength;
    
    const filled = '█'.repeat(filledLength);
    const empty = '░'.repeat(emptyLength);
    
    return `[${filled}${empty}]`;
  }

  /**
   * Creates a spinner with message
   */
  createSpinner(message: string, style: keyof typeof this.spinnerChars = 'dots'): string {
    const chars = this.spinnerChars[style];
    const index = Math.floor(Date.now() / 100) % chars.length;
    return `${chars[index]} ${message}`;
  }

  /**
   * Creates a status update with timestamp
   */
  createStatusUpdate(message: string, level: 'info' | 'warn' | 'error' | 'success'): string {
    const timestamp = new Date().toISOString();
    const levelUpper = level.toUpperCase();
    return `[${timestamp}] ${levelUpper}: ${message}`;
  }

  /**
   * Creates percentage display
   */
  createPercentageDisplay(current: number, total: number): string {
    const percentage = Math.round((current / total) * 100);
    return `${percentage}% (${current}/${total})`;
  }

  /**
   * Creates ETA display
   */
  createETA(current: number, total: number, startTime: number): string {
    if (current === 0) {
      return 'ETA: Calculating...';
    }
    
    const elapsed = Date.now() - startTime;
    const rate = current / elapsed;
    const remaining = total - current;
    const etaMs = remaining / rate;
    
    const etaSeconds = Math.round(etaMs / 1000);
    const minutes = Math.floor(etaSeconds / 60);
    const seconds = etaSeconds % 60;
    
    return `ETA: ${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Creates multi-step progress display
   */
  createMultiStepProgress(steps: Step[], currentIndex: number): string {
    let display = 'Progress Steps:\n';
    
    steps.forEach((step, index) => {
      let indicator = '○';
      if (step.completed) {
        indicator = '✓';
      } else if (index === currentIndex) {
        indicator = '→';
      }
      
      display += `  ${indicator} ${step.name}\n`;
    });
    
    return display;
  }

  /**
   * Creates file processing progress
   */
  createFileProgress(info: FileProgressInfo): string {
    const { currentFile, currentIndex, totalFiles, processedBytes, totalBytes } = info;
    const percentage = Math.round((processedBytes / totalBytes) * 100);
    
    return `Processing: ${currentFile} (${currentIndex}/${totalFiles}) - ${percentage}%`;
  }

  /**
   * Creates memory usage display
   */
  createMemoryUsage(memory: MemoryUsage): string {
    const usedMB = (memory.used / (1024 * 1024)).toFixed(1);
    const totalMB = (memory.total / (1024 * 1024)).toFixed(1);
    const peakMB = (memory.peak / (1024 * 1024)).toFixed(1);
    
    return `Memory: ${usedMB} MB / ${totalMB} MB (Peak: ${peakMB} MB)`;
  }

  /**
   * Creates speed indicator
   */
  createSpeedIndicator(speed: SpeedInfo): string {
    const { itemsPerSecond, bytesPerSecond, averageTime } = speed;
    const mbPerSecond = (bytesPerSecond / (1024 * 1024)).toFixed(1);
    
    return `Speed: ${itemsPerSecond.toFixed(1)} items/s, ${mbPerSecond} MB/s (${averageTime}ms avg)`;
  }

  /**
   * Clears the current line
   */
  clearLine(): string {
    return '\r' + ' '.repeat(80) + '\r';
  }

  /**
   * Creates operation summary
   */
  createSummary(info: SummaryInfo): string {
    const { totalItems, successful, failed, skipped, totalTime, averageTime } = info;
    const totalSeconds = (totalTime / 1000).toFixed(1);
    const avgMs = averageTime.toFixed(0);
    
    let summary = 'Operation Summary:\n';
    summary += `  Total Items: ${totalItems}\n`;
    summary += `  Successful: ${successful}\n`;
    summary += `  Failed: ${failed}\n`;
    summary += `  Skipped: ${skipped}\n`;
    summary += `  Total Time: ${totalSeconds}s\n`;
    summary += `  Average Time: ${avgMs}ms per item\n`;
    
    const successRate = ((successful / totalItems) * 100).toFixed(1);
    summary += `  Success Rate: ${successRate}%\n`;
    
    return summary;
  }

  /**
   * Creates a combined progress display
   */
  createCombinedProgress(options: {
    current: number;
    total: number;
    currentItem: string;
    operation: string;
    showBar?: boolean;
    showETA?: boolean;
    startTime?: number;
  }): string {
    const { current, total, currentItem, operation, showBar = true, showETA = true, startTime } = options;
    
    let display = '';
    
    // Progress bar
    if (showBar) {
      display += this.createProgressBar(current, total) + ' ';
    }
    
    // Percentage
    display += this.createPercentageDisplay(current, total) + ' ';
    
    // Current operation
    display += `${operation}: ${currentItem}`;
    
    // ETA
    if (showETA && startTime) {
      display += ' ' + this.createETA(current, total, startTime);
    }
    
    return display;
  }

  /**
   * Creates a file transfer progress
   */
  createTransferProgress(options: {
    fileName: string;
    transferredBytes: number;
    totalBytes: number;
    speed: number;
  }): string {
    const { fileName, transferredBytes, totalBytes, speed } = options;
    const percentage = Math.round((transferredBytes / totalBytes) * 100);
    const transferredMB = (transferredBytes / (1024 * 1024)).toFixed(1);
    const totalMB = (totalBytes / (1024 * 1024)).toFixed(1);
    const speedMB = (speed / (1024 * 1024)).toFixed(1);
    
    return `${fileName}: ${transferredMB}MB / ${totalMB}MB (${percentage}%) - ${speedMB}MB/s`;
  }

  /**
   * Creates a countdown timer
   */
  createCountdown(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const timeStr = `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    
    return `Countdown: ${timeStr}`;
  }

  /**
   * Creates a loading indicator with dots
   */
  createLoadingDots(message: string, count: number = 3): string {
    const dots = '.'.repeat(count);
    return `${message}${dots}`;
  }

  /**
   * Creates a progress table
   */
  createProgressTable(rows: Array<{
    name: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    progress?: number;
    message?: string;
  }>): string {
    let table = 'Progress Table:\n';
    table += '┌─────────────┬──────────┬──────────┬─────────────┐\n';
    table += '│ Name        │ Status   │ Progress │ Message     │\n';
    table += '├─────────────┼──────────┼──────────┼─────────────┤\n';
    
    rows.forEach(row => {
      const name = row.name.padEnd(11).substring(0, 11);
      const status = row.status.toUpperCase().padEnd(8).substring(0, 8);
      const progress = row.progress ? `${row.progress}%`.padEnd(8).substring(0, 8) : 'N/A'.padEnd(8).substring(0, 8);
      const message = (row.message || '').padEnd(11).substring(0, 11);
      
      table += `│ ${name} │ ${status} │ ${progress} │ ${message} │\n`;
    });
    
    table += '└─────────────┴──────────┴──────────┴─────────────┘\n';
    
    return table;
  }
}
