import React, { useState } from 'react';

interface FileSelectorProps {
  onFileSelected: (filePath: string) => void;
}

export const FileSelector: React.FC<FileSelectorProps> = ({ onFileSelected }) => {
  const [filePath, setFilePath] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleFileSelect = async () => {
    setIsLoading(true);
    try {
      const result = await window.electronAPI?.openFileDialog();
      if (result?.success && result.filePath) {
        setFilePath(result.filePath);
        onFileSelected(result.filePath);
      }
    } catch (error) {
      console.error('Error selecting file:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePathChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilePath(event.target.value);
  };

  const handleProcessFile = () => {
    if (filePath.trim()) {
      onFileSelected(filePath.trim());
    }
  };

  return (
    <div className="file-selector">
      <h3>Select OneNote File</h3>
      
      <div className="file-input-group">
        <input
          type="text"
          className="file-input"
          placeholder="Enter file path or click Browse..."
          value={filePath}
          onChange={handlePathChange}
        />
        <button
          className="file-button"
          onClick={handleFileSelect}
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Browse'}
        </button>
      </div>

      <button
        className="file-button"
        onClick={handleProcessFile}
        disabled={!filePath.trim() || isLoading}
        style={{ width: '100%' }}
      >
        Process File
      </button>

      <div className="file-info">
        <p>Supported formats:</p>
        <ul>
          <li>.onepkg (OneNote Package)</li>
          <li>.one (OneNote Section)</li>
        </ul>
      </div>
    </div>
  );
};
