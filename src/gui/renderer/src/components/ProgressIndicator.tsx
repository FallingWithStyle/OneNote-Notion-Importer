import React from 'react';
import { ProcessingStatus } from '../types';

interface ProgressIndicatorProps {
  status: ProcessingStatus;
  progress?: number;
  message?: string;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  status,
  progress = 0,
  message
}) => {
  const getStatusMessage = () => {
    switch (status) {
      case 'idle':
        return 'Ready to process files';
      case 'processing':
        return 'Processing OneNote file...';
      case 'importing':
        return 'Importing to Notion...';
      case 'completed':
        return 'Operation completed successfully';
      case 'error':
        return 'An error occurred';
      default:
        return 'Unknown status';
    }
  };

  const getProgressColor = () => {
    switch (status) {
      case 'completed':
        return '#27ae60';
      case 'error':
        return '#e74c3c';
      case 'processing':
      case 'importing':
        return '#3498db';
      default:
        return '#95a5a6';
    }
  };

  return (
    <div className="progress-indicator">
      <h3>Progress</h3>
      
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{
            width: `${progress}%`,
            backgroundColor: getProgressColor()
          }}
        />
      </div>
      
      <div className="progress-text">
        {message || getStatusMessage()}
      </div>
      
      {status === 'processing' || status === 'importing' ? (
        <div className="progress-details">
          <div className="spinner" />
          <span>Please wait...</span>
        </div>
      ) : null}
    </div>
  );
};
