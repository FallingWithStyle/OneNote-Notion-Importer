import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProgressIndicator } from '../../../../src/gui/renderer/src/components/ProgressIndicator';
import { ProcessingStatus } from '../../../../src/gui/renderer/src/types';

describe('ProgressIndicator', () => {
  it('should render progress indicator with title', () => {
    render(<ProgressIndicator status="idle" />);
    expect(screen.getByText('Progress')).toBeInTheDocument();
  });

  it('should display idle status message', () => {
    render(<ProgressIndicator status="idle" />);
    expect(screen.getByText('Ready to process files')).toBeInTheDocument();
  });

  it('should display processing status message', () => {
    render(<ProgressIndicator status="processing" />);
    expect(screen.getByText('Processing OneNote file...')).toBeInTheDocument();
  });

  it('should display importing status message', () => {
    render(<ProgressIndicator status="importing" />);
    expect(screen.getByText('Importing to Notion...')).toBeInTheDocument();
  });

  it('should display completed status message', () => {
    render(<ProgressIndicator status="completed" />);
    expect(screen.getByText('Operation completed successfully')).toBeInTheDocument();
  });

  it('should display error status message', () => {
    render(<ProgressIndicator status="error" />);
    expect(screen.getByText('An error occurred')).toBeInTheDocument();
  });

  it('should display custom message when provided', () => {
    render(
      <ProgressIndicator 
        status="processing" 
        message="Custom processing message" 
      />
    );
    expect(screen.getByText('Custom processing message')).toBeInTheDocument();
  });

  it('should display progress bar with correct width', () => {
    render(<ProgressIndicator status="processing" progress={75} />);
    
    const progressFill = screen.getByText('Processing OneNote file...').parentElement?.querySelector('.progress-fill');
    expect(progressFill).toHaveStyle('width: 75%');
  });

  it('should display progress bar with 0% width by default', () => {
    render(<ProgressIndicator status="idle" />);
    
    const progressFill = screen.getByText('Ready to process files').parentElement?.querySelector('.progress-fill');
    expect(progressFill).toHaveStyle('width: 0%');
  });

  it('should apply correct color for completed status', () => {
    render(<ProgressIndicator status="completed" />);
    
    const progressFill = screen.getByText('Operation completed successfully').parentElement?.querySelector('.progress-fill');
    expect(progressFill).toHaveStyle('background-color: #27ae60');
  });

  it('should apply correct color for error status', () => {
    render(<ProgressIndicator status="error" />);
    
    const progressFill = screen.getByText('An error occurred').parentElement?.querySelector('.progress-fill');
    expect(progressFill).toHaveStyle('background-color: #e74c3c');
  });

  it('should apply correct color for processing status', () => {
    render(<ProgressIndicator status="processing" />);
    
    const progressFill = screen.getByText('Processing OneNote file...').parentElement?.querySelector('.progress-fill');
    expect(progressFill).toHaveStyle('background-color: #3498db');
  });

  it('should apply correct color for importing status', () => {
    render(<ProgressIndicator status="importing" />);
    
    const progressFill = screen.getByText('Importing to Notion...').parentElement?.querySelector('.progress-fill');
    expect(progressFill).toHaveStyle('background-color: #3498db');
  });

  it('should apply default color for idle status', () => {
    render(<ProgressIndicator status="idle" />);
    
    const progressFill = screen.getByText('Ready to process files').parentElement?.querySelector('.progress-fill');
    expect(progressFill).toHaveStyle('background-color: #95a5a6');
  });

  it('should show spinner for processing status', () => {
    render(<ProgressIndicator status="processing" />);
    
    expect(screen.getByText('Please wait...')).toBeInTheDocument();
    const progressContainer = screen.getByText('Processing OneNote file...').parentElement;
    expect(progressContainer?.querySelector('.spinner')).toBeInTheDocument();
  });

  it('should show spinner for importing status', () => {
    render(<ProgressIndicator status="importing" />);
    
    expect(screen.getByText('Please wait...')).toBeInTheDocument();
    const progressContainer = screen.getByText('Importing to Notion...').parentElement;
    expect(progressContainer?.querySelector('.spinner')).toBeInTheDocument();
  });

  it('should not show spinner for idle status', () => {
    render(<ProgressIndicator status="idle" />);
    
    expect(screen.queryByText('Please wait...')).not.toBeInTheDocument();
    const progressContainer = screen.getByText('Ready to process files').parentElement;
    expect(progressContainer?.querySelector('.spinner')).toBeNull();
  });

  it('should not show spinner for completed status', () => {
    render(<ProgressIndicator status="completed" />);
    
    expect(screen.queryByText('Please wait...')).not.toBeInTheDocument();
    const progressContainer = screen.getByText('Operation completed successfully').parentElement;
    expect(progressContainer?.querySelector('.spinner')).toBeNull();
  });

  it('should not show spinner for error status', () => {
    render(<ProgressIndicator status="error" />);
    
    expect(screen.queryByText('Please wait...')).not.toBeInTheDocument();
    const progressContainer = screen.getByText('An error occurred').parentElement;
    expect(progressContainer?.querySelector('.spinner')).toBeNull();
  });

  it('should handle progress values at boundaries', () => {
    const { rerender } = render(<ProgressIndicator status="processing" progress={0} />);
    const progressFill = screen.getByText('Processing OneNote file...').parentElement?.querySelector('.progress-fill');
    expect(progressFill).toHaveStyle('width: 0%');

    rerender(<ProgressIndicator status="processing" progress={100} />);
    const progressFill2 = screen.getByText('Processing OneNote file...').parentElement?.querySelector('.progress-fill');
    expect(progressFill2).toHaveStyle('width: 100%');
  });

  it('should handle negative progress values', () => {
    render(<ProgressIndicator status="processing" progress={-10} />);
    const progressFill = screen.getByText('Processing OneNote file...').parentElement?.querySelector('.progress-fill');
    expect(progressFill).toHaveStyle('width: -10%');
  });

  it('should handle progress values over 100', () => {
    render(<ProgressIndicator status="processing" progress={150} />);
    const progressFill = screen.getByText('Processing OneNote file...').parentElement?.querySelector('.progress-fill');
    expect(progressFill).toHaveStyle('width: 150%');
  });

  it('should handle undefined progress value', () => {
    render(<ProgressIndicator status="processing" />);
    const progressFill = screen.getByText('Processing OneNote file...').parentElement?.querySelector('.progress-fill');
    expect(progressFill).toHaveStyle('width: 0%');
  });

  it('should handle all status types', () => {
    const statuses: ProcessingStatus[] = ['idle', 'processing', 'importing', 'completed', 'error'];
    
    statuses.forEach(status => {
      const { unmount } = render(<ProgressIndicator status={status} />);
      expect(screen.getByText('Progress')).toBeInTheDocument();
      unmount();
    });
  });
});
