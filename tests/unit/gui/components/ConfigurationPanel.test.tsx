import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ConfigurationPanel } from '../../../../src/gui/renderer/src/components/ConfigurationPanel';

// Mock the electron API
const mockElectronAPI = {
  setConfig: jest.fn(),
  saveFileDialog: jest.fn()
};

// Mock window.electronAPI
Object.defineProperty(window, 'electronAPI', {
  value: mockElectronAPI,
  writable: true
});

// Extend Window interface for tests
declare global {
  interface Window {
    electronAPI: typeof mockElectronAPI;
  }
}

describe('ConfigurationPanel', () => {
  const mockConfig = {
    notionApiKey: 'test-api-key',
    workspaceId: 'test-workspace-id',
    exportFormat: 'markdown',
    outputPath: '/test/path'
  };

  const mockOnConfigChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render configuration panel with all fields', () => {
    render(
      <ConfigurationPanel 
        config={mockConfig} 
        onConfigChange={mockOnConfigChange} 
      />
    );

    expect(screen.getByText('Configuration')).toBeInTheDocument();
    expect(screen.getByLabelText('Notion API Key')).toBeInTheDocument();
    expect(screen.getByLabelText('Notion Workspace ID')).toBeInTheDocument();
    expect(screen.getByLabelText('Export Format')).toBeInTheDocument();
    expect(screen.getByLabelText('Output Path')).toBeInTheDocument();
  });

  it('should display current configuration values', () => {
    render(
      <ConfigurationPanel 
        config={mockConfig} 
        onConfigChange={mockOnConfigChange} 
      />
    );

    expect(screen.getByDisplayValue('test-api-key')).toBeInTheDocument();
    expect(screen.getByDisplayValue('test-workspace-id')).toBeInTheDocument();
    expect(screen.getByDisplayValue('/test/path')).toBeInTheDocument();
    // Check select value differently
    const select = screen.getByLabelText('Export Format');
    expect(select).toHaveValue('markdown');
  });

  it('should handle API key changes', async () => {
    mockElectronAPI.setConfig.mockResolvedValue({ success: true });

    render(
      <ConfigurationPanel 
        config={mockConfig} 
        onConfigChange={mockOnConfigChange} 
      />
    );

    const apiKeyInput = screen.getByLabelText('Notion API Key');
    fireEvent.change(apiKeyInput, { target: { value: 'new-api-key' } });

    await waitFor(() => {
      expect(mockElectronAPI.setConfig).toHaveBeenCalledWith('notion.apiKey', 'new-api-key');
    });
  });

  it('should handle workspace ID changes', async () => {
    mockElectronAPI.setConfig.mockResolvedValue({ success: true });

    render(
      <ConfigurationPanel 
        config={mockConfig} 
        onConfigChange={mockOnConfigChange} 
      />
    );

    const workspaceInput = screen.getByLabelText('Notion Workspace ID');
    fireEvent.change(workspaceInput, { target: { value: 'new-workspace-id' } });

    await waitFor(() => {
      expect(mockElectronAPI.setConfig).toHaveBeenCalledWith('notion.workspaceId', 'new-workspace-id');
    });
  });

  it('should handle export format changes', async () => {
    mockElectronAPI.setConfig.mockResolvedValue({ success: true });

    render(
      <ConfigurationPanel 
        config={mockConfig} 
        onConfigChange={mockOnConfigChange} 
      />
    );

    const formatSelect = screen.getByLabelText('Export Format');
    fireEvent.change(formatSelect, { target: { value: 'docx' } });

    await waitFor(() => {
      expect(mockElectronAPI.setConfig).toHaveBeenCalledWith('export.format', 'docx');
    });
  });

  it('should handle output path changes', async () => {
    mockElectronAPI.setConfig.mockResolvedValue({ success: true });

    render(
      <ConfigurationPanel 
        config={mockConfig} 
        onConfigChange={mockOnConfigChange} 
      />
    );

    const outputPathInput = screen.getByLabelText('Output Path');
    fireEvent.change(outputPathInput, { target: { value: '/new/path' } });

    await waitFor(() => {
      expect(mockElectronAPI.setConfig).toHaveBeenCalledWith('export.outputPath', '/new/path');
    });
  });

  it('should handle file dialog for output path', async () => {
    mockElectronAPI.saveFileDialog.mockResolvedValue({ 
      success: true, 
      filePath: '/selected/path' 
    });
    mockElectronAPI.setConfig.mockResolvedValue({ success: true });

    render(
      <ConfigurationPanel 
        config={mockConfig} 
        onConfigChange={mockOnConfigChange} 
      />
    );

    const browseButton = screen.getByText('Browse');
    fireEvent.click(browseButton);

    await waitFor(() => {
      expect(mockElectronAPI.saveFileDialog).toHaveBeenCalledWith('exported-content');
      expect(mockElectronAPI.setConfig).toHaveBeenCalledWith('export.outputPath', '/selected/path');
    });
  });

  it('should show connection status indicators', () => {
    render(
      <ConfigurationPanel 
        config={mockConfig} 
        onConfigChange={mockOnConfigChange} 
      />
    );

    expect(screen.getAllByText('✓ Connected')).toHaveLength(2);
  });

  it('should show disconnected status when values are empty', () => {
    const emptyConfig = {
      notionApiKey: '',
      workspaceId: '',
      exportFormat: 'markdown',
      outputPath: ''
    };

    render(
      <ConfigurationPanel 
        config={emptyConfig} 
        onConfigChange={mockOnConfigChange} 
      />
    );

    expect(screen.getAllByText('✗ Not set')).toHaveLength(2);
  });

  it('should handle API errors gracefully', async () => {
    mockElectronAPI.setConfig.mockResolvedValue({ 
      success: false, 
      error: 'API Error' 
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    render(
      <ConfigurationPanel 
        config={mockConfig} 
        onConfigChange={mockOnConfigChange} 
      />
    );

    const apiKeyInput = screen.getByLabelText('Notion API Key');
    fireEvent.change(apiKeyInput, { target: { value: 'new-api-key' } });

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to save config:', 'API Error');
    });

    consoleSpy.mockRestore();
  });

  it('should handle file dialog cancellation', async () => {
    mockElectronAPI.saveFileDialog.mockResolvedValue({ 
      success: false, 
      error: 'Save cancelled' 
    });

    render(
      <ConfigurationPanel 
        config={mockConfig} 
        onConfigChange={mockOnConfigChange} 
      />
    );

    const browseButton = screen.getByText('Browse');
    fireEvent.click(browseButton);

    await waitFor(() => {
      expect(mockElectronAPI.saveFileDialog).toHaveBeenCalledWith('exported-content');
      expect(mockElectronAPI.setConfig).not.toHaveBeenCalled();
    });
  });
});
