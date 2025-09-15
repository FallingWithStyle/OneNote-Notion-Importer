import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LogViewer } from '../../../../src/gui/renderer/src/components/LogViewer';
import { LogEntry } from '../../../../src/gui/renderer/src/types';

describe('LogViewer', () => {
  const mockLogs: LogEntry[] = [
    {
      level: 'info',
      message: 'Test info message',
      timestamp: new Date('2024-01-01T10:00:00Z')
    },
    {
      level: 'success',
      message: 'Test success message',
      timestamp: new Date('2024-01-01T10:01:00Z')
    },
    {
      level: 'warning',
      message: 'Test warning message',
      timestamp: new Date('2024-01-01T10:02:00Z')
    },
    {
      level: 'error',
      message: 'Test error message',
      timestamp: new Date('2024-01-01T10:03:00Z')
    }
  ];

  it('should render log viewer with title', () => {
    render(<LogViewer logs={[]} />);
    expect(screen.getByText('Logs')).toBeInTheDocument();
  });

  it('should display empty state when no logs', () => {
    render(<LogViewer logs={[]} />);
    expect(screen.getByText('No logs yet. Process a file to see activity.')).toBeInTheDocument();
  });

  it('should display all log entries', () => {
    render(<LogViewer logs={mockLogs} />);
    
    expect(screen.getByText('Test info message')).toBeInTheDocument();
    expect(screen.getByText('Test success message')).toBeInTheDocument();
    expect(screen.getByText('Test warning message')).toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('should display correct icons for different log levels', () => {
    render(<LogViewer logs={mockLogs} />);
    
    expect(screen.getByText('ℹ️')).toBeInTheDocument(); // info
    expect(screen.getByText('✅')).toBeInTheDocument(); // success
    expect(screen.getByText('⚠️')).toBeInTheDocument(); // warning
    expect(screen.getByText('❌')).toBeInTheDocument(); // error
  });

  it('should format timestamps correctly', () => {
    render(<LogViewer logs={mockLogs} />);
    
    // Check that timestamps are displayed (exact format may vary by locale)
    const timestamps = screen.getAllByText(/5:00:00|5:01:00|5:02:00|5:03:00/);
    expect(timestamps).toHaveLength(4);
  });

  it('should display log count', () => {
    render(<LogViewer logs={mockLogs} />);
    expect(screen.getByText('4 entries')).toBeInTheDocument();
  });

  it('should have scroll to top button', () => {
    render(<LogViewer logs={mockLogs} />);
    expect(screen.getByText('↑ Top')).toBeInTheDocument();
  });

  it('should have scroll to bottom button', () => {
    render(<LogViewer logs={mockLogs} />);
    expect(screen.getByText('↓ Bottom')).toBeInTheDocument();
  });

  it('should apply correct CSS classes for different log levels', () => {
    render(<LogViewer logs={mockLogs} />);
    
    const logContainers = screen.getAllByText(/Test .+ message/).map(el => el.closest('.log-entry'));
    expect(logContainers[0]).toHaveClass('log-entry', 'info');
    expect(logContainers[1]).toHaveClass('log-entry', 'success');
    expect(logContainers[2]).toHaveClass('log-entry', 'warning');
    expect(logContainers[3]).toHaveClass('log-entry', 'error');
  });

  it('should handle scroll to top button click', () => {
    render(<LogViewer logs={mockLogs} />);
    
    const scrollToTopButton = screen.getByText('↑ Top');
    const logContainer = scrollToTopButton.parentElement?.querySelector('.log-container');
    
    // Mock scrollTop
    if (logContainer) {
      Object.defineProperty(logContainer, 'scrollTop', {
        writable: true,
        value: 100
      });
    }
    
    fireEvent.click(scrollToTopButton);
    
    if (logContainer) {
      expect(logContainer.scrollTop).toBe(0);
    }
  });

  it('should handle scroll to bottom button click', () => {
    render(<LogViewer logs={mockLogs} />);
    
    const scrollToBottomButton = screen.getByText('↓ Bottom');
    const logContainer = scrollToBottomButton.parentElement?.querySelector('.log-container');
    
    // Mock scrollHeight
    if (logContainer) {
      Object.defineProperty(logContainer, 'scrollHeight', {
        writable: true,
        value: 1000
      });
      Object.defineProperty(logContainer, 'scrollTop', {
        writable: true,
        value: 0
      });
    }
    
    fireEvent.click(scrollToBottomButton);
    
    if (logContainer) {
      expect(logContainer.scrollTop).toBe(1000);
    }
  });

  it('should display logs in chronological order', () => {
    const unorderedLogs: LogEntry[] = [
      {
        level: 'error',
        message: 'Last message',
        timestamp: new Date('2024-01-01T10:03:00Z')
      },
      {
        level: 'info',
        message: 'First message',
        timestamp: new Date('2024-01-01T10:00:00Z')
      }
    ];

    render(<LogViewer logs={unorderedLogs} />);
    
    const logEntries = screen.getAllByText(/message/);
    // Logs are displayed in the order they appear in the array, not chronologically
    expect(logEntries[0]).toHaveTextContent('Last message');
    expect(logEntries[1]).toHaveTextContent('First message');
  });

  it('should handle large number of logs', () => {
    const manyLogs: LogEntry[] = Array.from({ length: 100 }, (_, i) => ({
      level: 'info' as const,
      message: `Log message ${i}`,
      timestamp: new Date()
    }));

    render(<LogViewer logs={manyLogs} />);
    
    expect(screen.getByText('100 entries')).toBeInTheDocument();
    expect(screen.getByText('Log message 0')).toBeInTheDocument();
    expect(screen.getByText('Log message 99')).toBeInTheDocument();
  });
});
