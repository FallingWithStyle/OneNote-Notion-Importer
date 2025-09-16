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
    notionDatabaseId: '',
    exportFormat: 'markdown',
    outputPath: '',
    autoSetup: true,
    workspaceName: 'OneNote Import Workspace',
    databaseName: 'OneNote Import Database'
  });
  const [apiKeySource, setApiKeySource] = useState<'env' | 'manual' | 'unknown'>('unknown');

  useEffect(() => {
    setLocalConfig(prev => ({
      ...prev,
      notionApiKey: config.notionApiKey || '',
      notionWorkspaceId: config.workspaceId || '',
      notionDatabaseId: config.databaseId || '',
      exportFormat: config.exportFormat || 'markdown',
      outputPath: config.outputPath || '',
      autoSetup: config.autoSetup !== false,
      workspaceName: config.workspaceName || 'OneNote Import Workspace',
      databaseName: config.databaseName || 'OneNote Import Database'
    }));

    // Detect if API key was loaded from .env
    if (config.notionApiKey && config.notionApiKey !== localConfig.notionApiKey) {
      setApiKeySource('env');
    } else if (config.notionApiKey && apiKeySource === 'unknown') {
      setApiKeySource('manual');
    }
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
    setApiKeySource('manual');
  };

  const handleWorkspaceIdChange = (value: string) => {
    handleInputChange('notionWorkspaceId', value);
    handleSaveConfig('notion.workspaceId', value);
  };

  const handleDatabaseIdChange = (value: string) => {
    handleInputChange('notionDatabaseId', value);
    handleSaveConfig('notion.databaseId', value);
  };

  const handleAutoSetupChange = (value: boolean) => {
    handleInputChange('autoSetup', value.toString());
    handleSaveConfig('notion.autoSetup', value.toString());
  };

  const handleWorkspaceNameChange = (value: string) => {
    handleInputChange('workspaceName', value);
    handleSaveConfig('notion.workspaceName', value);
  };

  const handleDatabaseNameChange = (value: string) => {
    handleInputChange('databaseName', value);
    handleSaveConfig('notion.databaseName', value);
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
        <small>
          Get your API key from Notion's integration settings
          {apiKeySource === 'env' && (
            <span style={{ color: '#27ae60', fontWeight: 'bold' }}>
              {' '}• Loaded from .env file
            </span>
          )}
          {apiKeySource === 'manual' && (
            <span style={{ color: '#3498db', fontWeight: 'bold' }}>
              {' '}• Manually entered
            </span>
          )}
        </small>
      </div>

      <div className="config-group">
        <label>
          <input
            type="checkbox"
            checked={localConfig.autoSetup}
            onChange={(e) => handleAutoSetupChange(e.target.checked)}
          />
          Enable Auto-Setup (Recommended)
        </label>
        <small>Automatically create workspace and database if they don't exist</small>
      </div>

      {!localConfig.autoSetup && (
        <>
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
            <label htmlFor="notion-database-id">Notion Database ID</label>
            <input
              id="notion-database-id"
              type="text"
              value={localConfig.notionDatabaseId}
              onChange={(e) => handleDatabaseIdChange(e.target.value)}
              placeholder="Enter your Notion database ID"
            />
            <small>Find this in your Notion database URL</small>
          </div>
        </>
      )}

      {localConfig.autoSetup && (
        <>
          <div className="config-group">
            <label htmlFor="workspace-name">Workspace Name</label>
            <input
              id="workspace-name"
              type="text"
              value={localConfig.workspaceName}
              onChange={(e) => handleWorkspaceNameChange(e.target.value)}
              placeholder="OneNote Import Workspace"
            />
            <small>Name for the auto-created workspace</small>
          </div>

          <div className="config-group">
            <label htmlFor="database-name">Database Name</label>
            <input
              id="database-name"
              type="text"
              value={localConfig.databaseName}
              onChange={(e) => handleDatabaseNameChange(e.target.value)}
              placeholder="OneNote Import Database"
            />
            <small>Name for the auto-created database</small>
          </div>
        </>
      )}

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
        {localConfig.autoSetup ? (
          <div className="status-item">
            <span className="status-label">Auto-Setup:</span>
            <span className="status-value connected">
              ✓ Enabled - Will auto-create workspace and database
            </span>
          </div>
        ) : (
          <>
            <div className="status-item">
              <span className="status-label">Workspace:</span>
              <span className={`status-value ${localConfig.notionWorkspaceId ? 'connected' : 'disconnected'}`}>
                {localConfig.notionWorkspaceId ? '✓ Connected' : '✗ Not set'}
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">Database:</span>
              <span className={`status-value ${localConfig.notionDatabaseId ? 'connected' : 'disconnected'}`}>
                {localConfig.notionDatabaseId ? '✓ Connected' : '✗ Not set'}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
