import React from 'react';
import './ErrorDialog.css';

interface ErrorDialogProps {
  title: string;
  message: string;
  details?: string;
  onClose: () => void;
  onRetry?: () => void;
}

const ErrorDialog: React.FC<ErrorDialogProps> = ({ title, message, details, onClose, onRetry }) => {
  return (
    <div className="win98-error-dialog-overlay">
      <div className="win98-error-dialog">
        <div className="win98-error-dialog-header">
          <div className="win98-error-dialog-icon">⚠️</div>
          <div className="win98-error-dialog-title">{title}</div>
          <button className="win98-button win98-button-small" onClick={onClose}>
            ✕
          </button>
        </div>
        
        <div className="win98-error-dialog-content">
          <p className="win98-error-dialog-message">{message}</p>
          {details && (
            <details className="win98-error-dialog-details">
              <summary>Technical Details</summary>
              <pre>{details}</pre>
            </details>
          )}
        </div>
        
        <div className="win98-error-dialog-actions">
          {onRetry && (
            <button className="win98-button" onClick={onRetry}>
              Retry
            </button>
          )}
          <button className="win98-button" onClick={onClose}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorDialog;
