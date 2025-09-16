import React, { useState, useEffect } from 'react';
import { OneNoteLinkParser, ParsedOneNoteLink } from '../../../../utils/onenote-link-parser';

interface FileSelectorProps {
  onFileSelected: (filePath: string) => void;
}

export const FileSelector: React.FC<FileSelectorProps> = ({ onFileSelected }) => {
  const [filePath, setFilePath] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [parsedLink, setParsedLink] = useState<ParsedOneNoteLink | null>(null);
  const [inputMode, setInputMode] = useState<'file' | 'link'>('file');

  const handleFileSelect = async () => {
    setIsLoading(true);
    try {
      console.log('Opening file dialog...');
      console.log('electronAPI available:', !!window.electronAPI);
      
      if (!window.electronAPI) {
        throw new Error('Electron API not available');
      }
      
      const result = await window.electronAPI.openFileDialog();
      console.log('File dialog result:', result);
      
      if (result?.success && result.filePath) {
        setFilePath(result.filePath);
        onFileSelected(result.filePath);
        console.log('File selected:', result.filePath);
      } else {
        console.log('No file selected or error:', result?.error);
      }
    } catch (error) {
      console.error('Error selecting file:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePathChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setFilePath(value);
    
    // Auto-detect if input is a OneNote link
    if (value.includes('onedrive.live.com') || value.startsWith('onenote:')) {
      setInputMode('link');
      const parsed = OneNoteLinkParser.parseLink(value);
      setParsedLink(parsed);
    } else {
      setInputMode('file');
      setParsedLink(null);
    }
  };

  const handleProcessFile = () => {
    if (filePath.trim()) {
      if (inputMode === 'link' && parsedLink) {
        if (parsedLink.isValid && parsedLink.type === 'filepath' && parsedLink.filePath) {
          onFileSelected(parsedLink.filePath);
        } else {
          // For OneDrive and onenote: links, we need special handling
          console.warn('OneDrive and onenote: links require special processing:', parsedLink);
          // For now, we'll show an error message
          alert('OneDrive and onenote: links are not yet supported for direct processing. Please use a local file path instead.');
        }
      } else {
        onFileSelected(filePath.trim());
      }
    }
  };

  return (
    <div className="file-selector">
      <h3>Select OneNote File</h3>
      
      <div className="input-mode-tabs">
        <button
          className={`tab-button ${inputMode === 'file' ? 'active' : ''}`}
          onClick={() => setInputMode('file')}
        >
          Local File
        </button>
        <button
          className={`tab-button ${inputMode === 'link' ? 'active' : ''}`}
          onClick={() => setInputMode('link')}
        >
          OneNote Link
        </button>
      </div>
      
      <div className="file-input-group">
        <input
          type="text"
          className="file-input"
          placeholder={
            inputMode === 'file' 
              ? "Enter file path or click Browse..." 
              : "Paste OneNote link (OneDrive or onenote: URL)..."
          }
          value={filePath}
          onChange={handlePathChange}
        />
        {inputMode === 'file' && (
          <button
            className="file-button"
            onClick={handleFileSelect}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Browse'}
          </button>
        )}
      </div>

      {/* Show parsed link information */}
      {inputMode === 'link' && parsedLink && (
        <div className="parsed-link-info">
          <h4>Parsed Link Information:</h4>
          <div className="link-details">
            <p><strong>Type:</strong> {parsedLink.type}</p>
            <p><strong>File Name:</strong> {parsedLink.fileName || 'N/A'}</p>
            {parsedLink.sectionId && (
              <p><strong>Section ID:</strong> {parsedLink.sectionId}</p>
            )}
            <p><strong>Valid:</strong> {parsedLink.isValid ? 'Yes' : 'No'}</p>
            {parsedLink.error && (
              <p className="error"><strong>Error:</strong> {parsedLink.error}</p>
            )}
            {parsedLink.type === 'onedrive' && (
              <p className="warning">
                <strong>Note:</strong> OneDrive links require special processing and are not yet fully supported.
              </p>
            )}
          </div>
        </div>
      )}

      <button
        className="file-button"
        onClick={handleProcessFile}
        disabled={!filePath.trim() || isLoading || (inputMode === 'link' && parsedLink && !parsedLink.isValid)}
        style={{ width: '100%' }}
      >
        Process File
      </button>

      <div className="file-info">
        <p>Supported formats:</p>
        <ul>
          <li>.onepkg (OneNote Package)</li>
          <li>.one (OneNote Section)</li>
          <li>OneDrive OneNote links (limited support)</li>
          <li>onenote: protocol URLs (limited support)</li>
        </ul>
      </div>
    </div>
  );
};
