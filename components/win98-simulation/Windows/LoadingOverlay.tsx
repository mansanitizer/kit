import React from 'react';
import './LoadingOverlay.css';

interface LoadingOverlayProps {
  message?: string;
  show: boolean;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message = 'Loading...', show }) => {
  if (!show) return null;

  return (
    <div className="win98-loading-overlay">
      <div className="win98-loading-overlay-content">
        <div className="win98-loading-spinner-large"></div>
        <p className="win98-loading-message">{message}</p>
      </div>
    </div>
  );
};

export default LoadingOverlay;
