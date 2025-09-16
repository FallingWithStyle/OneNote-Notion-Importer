import React, { useState, useEffect } from 'react';
import { OneNoteLinkParser, ParsedOneNoteLink } from '../../../../utils/onenote-link-parser';
import { CloudDownloadService } from '../../../../services/onenote/cloud-download.service';
import { OneDriveApiService } from '../../../../services/onenote/onedrive-api.service';

interface FileSelectorProps {
  onFileSelected: (filePath: string) => void;
  onCloudFileDownloaded?: (fileName: string, content: ArrayBuffer) => void;
}

export const FileSelector: React.FC<FileSelectorProps> = ({ onFileSelected, onCloudFileDownloaded }) => {
  const [filePath, setFilePath] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [parsedLink, setParsedLink] = useState<ParsedOneNoteLink | null>(null);
  const [inputMode, setInputMode] = useState<'file' | 'link'>('file');
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [downloadStatus, setDownloadStatus] = useState<string>('');

  // Initialize cloud download service
  const [cloudDownloadService] = useState(() => {
    // For now, we'll create a mock OneDrive service since we need an access token
    // In a real implementation, this would be passed as a prop or from context
    const mockOneDriveService = new OneDriveApiService('mock-token');
    return new CloudDownloadService(mockOneDriveService);
  });

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

  const handleProcessFile = async () => {
    if (filePath.trim()) {
      if (inputMode === 'link' && parsedLink) {
        if (parsedLink.isValid && parsedLink.type === 'filepath' && parsedLink.filePath) {
          onFileSelected(parsedLink.filePath);
        } else if (parsedLink.isValid && (parsedLink.type === 'onedrive' || parsedLink.type === 'onenote')) {
          // Handle cloud links
          await handleCloudDownload(parsedLink);
        } else {
          alert('Invalid OneNote link. Please check the URL and try again.');
        }
      } else {
        onFileSelected(filePath.trim());
      }
    }
  };

  const handleCloudDownload = async (parsedLink: ParsedOneNoteLink) => {
    setIsLoading(true);
    setDownloadStatus('Downloading from cloud...');
    setDownloadProgress(0);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setDownloadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const result = await cloudDownloadService.downloadFromCloudLink(parsedLink);

      clearInterval(progressInterval);
      setDownloadProgress(100);

      if (result.success) {
        setDownloadStatus('Download completed successfully!');
        
        if (result.content && result.fileName) {
          // Save the downloaded content to a temporary file
          const tempFilePath = await saveDownloadedFile(result.fileName, result.content);
          onFileSelected(tempFilePath);
          
          // Also notify parent component about the cloud download
          if (onCloudFileDownloaded) {
            onCloudFileDownloaded(result.fileName, result.content);
          }
        } else if (result.filePath) {
          // Local file path (for onenote: protocol)
          onFileSelected(result.filePath);
        }
      } else {
        setDownloadStatus(`Download failed: ${result.error}`);
        alert(`Failed to download file: ${result.error}`);
      }
    } catch (error) {
      setDownloadStatus(`Download error: ${error instanceof Error ? error.message : String(error)}`);
      alert(`Download failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        setDownloadStatus('');
        setDownloadProgress(0);
      }, 3000);
    }
  };

  const saveDownloadedFile = async (fileName: string, content: ArrayBuffer): Promise<string> => {
    // In a real implementation, this would save to a temporary directory
    // For now, we'll create a blob URL that can be used
    const blob = new Blob([content], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    
    // Create a temporary file path (in real implementation, this would be a proper temp file)
    const tempPath = `temp_${Date.now()}_${fileName}`;
    
    // Store the blob URL for later cleanup
    (window as any).tempBlobUrls = (window as any).tempBlobUrls || [];
    (window as any).tempBlobUrls.push(url);
    
    return tempPath;
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
            {(parsedLink.type === 'onedrive' || parsedLink.type === 'onenote') && parsedLink.isValid && (
              <p className="info">
                <strong>Note:</strong> This cloud link will be downloaded automatically.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Show download progress */}
      {isLoading && inputMode === 'link' && (
        <div className="download-progress">
          <h4>Download Progress</h4>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${downloadProgress}%` }}
            ></div>
          </div>
          <p className="progress-text">{downloadStatus}</p>
        </div>
      )}

      {/* Show download status */}
      {downloadStatus && !isLoading && (
        <div className="download-status">
          <p className={downloadStatus.includes('successfully') ? 'success' : 'error'}>
            {downloadStatus}
          </p>
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
          <li>OneDrive OneNote links (with automatic download)</li>
          <li>onenote: protocol URLs (with automatic download)</li>
        </ul>
      </div>
    </div>
  );
};
