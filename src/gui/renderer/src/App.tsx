import React, { useState, useEffect } from 'react';
import { FileSelector } from './components/FileSelector';
import { HierarchyViewer } from './components/HierarchyViewer';
import { ConfigurationPanel } from './components/ConfigurationPanel';
import { ProgressIndicator } from './components/ProgressIndicator';
import { LogViewer } from './components/LogViewer';
import { OneNoteHierarchy, ProcessingStatus, LogEntry } from './types';

const App: React.FC = () => {
  const [hierarchy, setHierarchy] = useState<OneNoteHierarchy | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>('idle');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [config, setConfig] = useState<any>({});

  useEffect(() => {
    // Load initial configuration
    window.electronAPI?.getConfig('notion.workspaceId').then((result) => {
      if (result.success) {
        setConfig(prev => ({ ...prev, workspaceId: result.value }));
      }
    });
  }, []);

  const handleFileSelected = async (filePath: string) => {
    setProcessingStatus('processing');
    setLogs(prev => [...prev, { level: 'info', message: `Processing file: ${filePath}`, timestamp: new Date() }]);
    
    try {
      const result = await window.electronAPI?.processOneNoteFile(filePath);
      if (result?.success && result.hierarchy) {
        setHierarchy(result.hierarchy);
        setProcessingStatus('completed');
        setLogs(prev => [...prev, { level: 'success', message: 'File processed successfully', timestamp: new Date() }]);
      } else {
        throw new Error(result?.error || 'Failed to process file');
      }
    } catch (error) {
      setProcessingStatus('error');
      setLogs(prev => [...prev, { 
        level: 'error', 
        message: `Error processing file: ${error instanceof Error ? error.message : String(error)}`, 
        timestamp: new Date() 
      }]);
    }
  };

  const handleItemSelection = (itemIds: string[]) => {
    setSelectedItems(itemIds);
  };

  const handleImport = async () => {
    if (!hierarchy || selectedItems.length === 0) return;
    
    setProcessingStatus('importing');
    setLogs(prev => [...prev, { level: 'info', message: 'Starting import to Notion...', timestamp: new Date() }]);
    
    // TODO: Implement actual import logic
    setTimeout(() => {
      setProcessingStatus('completed');
      setLogs(prev => [...prev, { level: 'success', message: 'Import completed successfully', timestamp: new Date() }]);
    }, 2000);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>OneNote to Notion Importer</h1>
        <div className="status-indicator">
          <span className={`status ${processingStatus}`}>
            {processingStatus.charAt(0).toUpperCase() + processingStatus.slice(1)}
          </span>
        </div>
      </header>

      <main className="app-main">
        <div className="left-panel">
          <FileSelector onFileSelected={handleFileSelected} />
          <ConfigurationPanel config={config} onConfigChange={setConfig} />
        </div>

        <div className="center-panel">
          {hierarchy && (
            <HierarchyViewer
              hierarchy={hierarchy}
              selectedItems={selectedItems}
              onItemSelection={handleItemSelection}
            />
          )}
        </div>

        <div className="right-panel">
          <ProgressIndicator status={processingStatus} />
          <LogViewer logs={logs} />
        </div>
      </main>

      <footer className="app-footer">
        {hierarchy && selectedItems.length > 0 && (
          <button 
            className="import-button"
            onClick={handleImport}
            disabled={processingStatus === 'processing' || processingStatus === 'importing'}
          >
            Import {selectedItems.length} selected items to Notion
          </button>
        )}
      </footer>
    </div>
  );
};

export default App;
