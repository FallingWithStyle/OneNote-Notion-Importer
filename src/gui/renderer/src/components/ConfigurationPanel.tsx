import React, { useState, useEffect } from 'react';

interface ConfigurationPanelProps {
  config: any;
  onConfigChange: (config: any) => void;
}

export const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({
  config,
  onConfigChange
}) => {
  const [localConfig, setLocalConfig] = useState({
    notionApiKey: '',
    notionWorkspaceId: '',
    exportFormat: 'markdown',
    outputPath: ''
  });

  useEffect(() => {
    setLocalConfig(prev => ({
      ...prev,
      notionApiKey: config.notionApiKey || '',
      notionWorkspaceId: config.workspaceId || '',
      exportFormat: config.exportFormat || 'markdown',
      outputPath: config.outputPath || ''
    }));
  }, [config]);

  const handleInputChange = (field: string, value: string) => {
    setLocalConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveConfig = async (field: string, value: string) => {
    try {
      const result = await window.electronAPI?.setConfig(field, value);
      if (result?.success) {
        onConfigChange({ ...config, [field]: value });
      } else {
        console.error('Failed to save config:', result?.error);
      }
    } catch (error) {
      console.error('Error saving config:', error);
    }
  };

  const handleNotionApiKeyChange = (value: string) => {
    handleInputChange('notionApiKey', value);
    handleSaveConfig('notion.apiKey', value);
  };

  const handleWorkspaceIdChange = (value: string) => {
    handleInputChange('notionWorkspaceId', value);
    handleSaveConfig('notion.workspaceId', value);
  };

  const handleExportFormatChange = (value: string) => {
    handleInputChange('exportFormat', value);
    handleSaveConfig('export.format', value);
  };

  const handleOutputPathChange = (value: string) => {
    handleInputChange('outputPath', value);
    handleSaveConfig('export.outputPath', value);
  };

  const handleSelectOutputPath = async () => {
    try {
      const result = await window.electronAPI?.saveFileDialog('exported-content');
      if (result?.success && result.filePath) {
        handleOutputPathChange(result.filePath);
      }
    } catch (error) {
      console.error('Error selecting output path:', error);
    }
  };

  return (
    <div className="config-panel">
      <h3>Configuration</h3>

      <div className="config-group">
        <label htmlFor="notion-api-key">Notion API Key</label>
        <input
          id="notion-api-key"
          type="password"
          value={localConfig.notionApiKey}
          onChange={(e) => handleNotionApiKeyChange(e.target.value)}
          placeholder="Enter your Notion integration token"
        />
        <small>Get your API key from Notion's integration settings</small>
      </div>

      <div className="config-group">
        <label htmlFor="notion-workspace-id">Notion Workspace ID</label>
        <input
          id="notion-workspace-id"
          type="text"
          value={localConfig.notionWorkspaceId}
          onChange={(e) => handleWorkspaceIdChange(e.target.value)}
          placeholder="Enter your Notion workspace ID"
        />
        <small>Find this in your Notion workspace URL</small>
      </div>

      <div className="config-group">
        <label htmlFor="export-format">Export Format</label>
        <select
          id="export-format"
          value={localConfig.exportFormat}
          onChange={(e) => handleExportFormatChange(e.target.value)}
        >
          <option value="markdown">Markdown (.md)</option>
          <option value="docx">Word Document (.docx)</option>
        </select>
      </div>

      <div className="config-group">
        <label htmlFor="output-path">Output Path</label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            id="output-path"
            type="text"
            value={localConfig.outputPath}
            onChange={(e) => handleOutputPathChange(e.target.value)}
            placeholder="Select output directory"
            style={{ flex: 1 }}
          />
          <button
            type="button"
            onClick={handleSelectOutputPath}
            style={{
              padding: '0.5rem',
              background: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Browse
          </button>
        </div>
      </div>

      <div className="config-status">
        <h4>Status</h4>
        <div className="status-item">
          <span className="status-label">API Key:</span>
          <span className={`status-value ${localConfig.notionApiKey ? 'connected' : 'disconnected'}`}>
            {localConfig.notionApiKey ? '✓ Connected' : '✗ Not set'}
          </span>
        </div>
        <div className="status-item">
          <span className="status-label">Workspace:</span>
          <span className={`status-value ${localConfig.notionWorkspaceId ? 'connected' : 'disconnected'}`}>
            {localConfig.notionWorkspaceId ? '✓ Connected' : '✗ Not set'}
          </span>
        </div>
      </div>
    </div>
  );
};
