import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FileSelector } from '../../../../src/gui/renderer/src/components/FileSelector';

// Mock the electron API
const mockElectronAPI = {
  openFileDialog: jest.fn(),
  saveFileDialog: jest.fn(),
  processOneNoteFile: jest.fn(),
  getConfig: jest.fn(),
  setConfig: jest.fn(),
};

// Mock window.electronAPI
Object.defineProperty(window, 'electronAPI', {
  value: mockElectronAPI,
  writable: true,
});

describe('FileSelector', () => {
  const mockOnFileSelected = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render file selector component', () => {
    render(<FileSelector onFileSelected={mockOnFileSelected} />);
    
    expect(screen.getByText('Select OneNote File')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter file path or click Browse...')).toBeInTheDocument();
    expect(screen.getByText('Browse')).toBeInTheDocument();
    expect(screen.getByText('Process File')).toBeInTheDocument();
  });

  it('should handle file path input', () => {
    render(<FileSelector onFileSelected={mockOnFileSelected} />);
    
    const input = screen.getByPlaceholderText('Enter file path or click Browse...');
    fireEvent.change(input, { target: { value: '/path/to/file.onepkg' } });
    
    expect(input).toHaveValue('/path/to/file.onepkg');
  });

  it('should call onFileSelected when process file is clicked with valid path', () => {
    render(<FileSelector onFileSelected={mockOnFileSelected} />);
    
    const input = screen.getByPlaceholderText('Enter file path or click Browse...');
    const processButton = screen.getByText('Process File');
    
    fireEvent.change(input, { target: { value: '/path/to/file.onepkg' } });
    fireEvent.click(processButton);
    
    expect(mockOnFileSelected).toHaveBeenCalledWith('/path/to/file.onepkg');
  });

  it('should not call onFileSelected when process file is clicked with empty path', () => {
    render(<FileSelector onFileSelected={mockOnFileSelected} />);
    
    const processButton = screen.getByText('Process File');
    fireEvent.click(processButton);
    
    expect(mockOnFileSelected).not.toHaveBeenCalled();
    expect(processButton).toBeDisabled();
  });

  it('should handle file dialog selection', async () => {
    mockElectronAPI.openFileDialog.mockResolvedValue({
      success: true,
      filePath: '/selected/file.onepkg'
    });

    render(<FileSelector onFileSelected={mockOnFileSelected} />);
    
    const browseButton = screen.getByText('Browse');
    fireEvent.click(browseButton);
    
    await waitFor(() => {
      expect(mockElectronAPI.openFileDialog).toHaveBeenCalled();
      expect(mockOnFileSelected).toHaveBeenCalledWith('/selected/file.onepkg');
    });
  });

  it('should handle file dialog cancellation', async () => {
    mockElectronAPI.openFileDialog.mockResolvedValue({
      success: false,
      error: 'No file selected'
    });

    render(<FileSelector onFileSelected={mockOnFileSelected} />);
    
    const browseButton = screen.getByText('Browse');
    fireEvent.click(browseButton);
    
    await waitFor(() => {
      expect(mockElectronAPI.openFileDialog).toHaveBeenCalled();
      expect(mockOnFileSelected).not.toHaveBeenCalled();
    });
  });

  it('should show loading state during file dialog', async () => {
    mockElectronAPI.openFileDialog.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ success: true, filePath: '/test.onepkg' }), 100))
    );

    render(<FileSelector onFileSelected={mockOnFileSelected} />);
    
    const browseButton = screen.getByText('Browse');
    fireEvent.click(browseButton);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Browse')).toBeInTheDocument();
    });
  });

  it('should show supported file formats', () => {
    render(<FileSelector onFileSelected={mockOnFileSelected} />);
    
    expect(screen.getByText('Supported formats:')).toBeInTheDocument();
    expect(screen.getByText('.onepkg (OneNote Package)')).toBeInTheDocument();
    expect(screen.getByText('.one (OneNote Section)')).toBeInTheDocument();
  });
});
