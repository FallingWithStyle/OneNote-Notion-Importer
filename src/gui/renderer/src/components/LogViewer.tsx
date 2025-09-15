import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';

interface LogViewerProps {
  logs: LogEntry[];
}

export const LogViewer: React.FC<LogViewerProps> = ({ logs }) => {
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom when new logs are added
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString();
  };

  const getLogIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'info':
        return 'ℹ️';
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      default:
        return '📝';
    }
  };

  return (
    <div className="log-viewer">
      <h3>Logs</h3>
      
      <div className="log-controls">
        <button
          onClick={() => {
            if (logContainerRef.current) {
              logContainerRef.current.scrollTop = 0;
            }
          }}
          className="log-button"
        >
          ↑ Top
        </button>
        <button
          onClick={() => {
            if (logContainerRef.current) {
              logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
            }
          }}
          className="log-button"
        >
          ↓ Bottom
        </button>
        <span className="log-count">
          {logs.length} entries
        </span>
      </div>

      <div className="log-container" ref={logContainerRef}>
        {logs.length === 0 ? (
          <div className="log-empty">
            No logs yet. Process a file to see activity.
          </div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className={`log-entry ${log.level}`}>
              <span className="log-timestamp">
                {formatTimestamp(log.timestamp)}
              </span>
              <span className="log-icon">
                {getLogIcon(log.level)}
              </span>
              <span className="log-message">
                {log.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
