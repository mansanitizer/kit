import React from 'react';
import './About.css';

interface AboutProps {
  onClose: () => void;
}

const About: React.FC<AboutProps> = ({ onClose }) => {
  const appVersion = '1.0.0';
  const buildDate = new Date().toLocaleDateString();
  const platform = navigator.platform;

  return (
    <div className="win98-about">
      <div className="win98-about-header">
        <div className="win98-about-icon">🪟</div>
        <div className="win98-about-title">
          <h2>FileOps Windows 98</h2>
          <p>Intelligent File Management System</p>
        </div>
      </div>

      <div className="win98-about-content">
        <div className="win98-about-info">
          <div className="win98-about-section">
            <h3>Version Information</h3>
            <div className="win98-about-details">
              <div className="win98-about-row">
                <span className="win98-about-label">Version:</span>
                <span className="win98-about-value">{appVersion}</span>
              </div>
              <div className="win98-about-row">
                <span className="win98-about-label">Build Date:</span>
                <span className="win98-about-value">{buildDate}</span>
              </div>
              <div className="win98-about-row">
                <span className="win98-about-label">Platform:</span>
                <span className="win98-about-value">{platform}</span>
              </div>
            </div>
          </div>

          <div className="win98-about-section">
            <h3>Features</h3>
            <ul className="win98-about-features">
              <li>Windows 98-style user interface</li>
              <li>AI-powered file search and organization</li>
              <li>Drag & drop file upload</li>
              <li>Advanced file management</li>
              <li>Real-time file indexing</li>
              <li>Multi-format file support</li>
            </ul>
          </div>

          <div className="win98-about-section">
            <h3>System Requirements</h3>
            <ul className="win98-about-requirements">
              <li>Electron 25.0 or higher</li>
              <li>Node.js 18.0 or higher</li>
              <li>FileOps MCP Server</li>
              <li>4GB RAM (recommended)</li>
              <li>100MB free disk space</li>
            </ul>
          </div>

          <div className="win98-about-section">
            <h3>Credits</h3>
            <p className="win98-about-credits">
              Built with Electron, React, TypeScript, and Tailwind CSS.<br />
              Windows 98 design inspired by Microsoft Windows 98.<br />
              FileOps integration powered by MCP (Model Context Protocol).
            </p>
          </div>
        </div>
      </div>

      <div className="win98-about-actions">
        <button className="win98-button" onClick={onClose}>
          OK
        </button>
      </div>
    </div>
  );
};

export default About;
