import React, { useState } from 'react';
import Win98Icon from '../Common/Win98Icon';
import './Help.css';

interface HelpProps {
  onClose: () => void;
}

const Help: React.FC<HelpProps> = ({ onClose }) => {
  const [activeSection, setActiveSection] = useState<'getting-started' | 'fileops' | 'search' | 'upload' | 'settings' | 'troubleshooting'>('getting-started');

  const helpContent = {
    'getting-started': {
      title: 'Getting Started',
      content: `
        <h3>Welcome to FileOps Windows 98!</h3>
        <p>This application provides a Windows 98-style interface for managing files using the FileOps intelligent file management system.</p>
        
        <h4>Quick Start Guide:</h4>
        <ol>
          <li><strong>Connect to FileOps:</strong> Open Settings and configure your FileOps server URL</li>
          <li><strong>Browse Files:</strong> Use the File Manager to view and manage your files</li>
          <li><strong>Search:</strong> Use the Search tool to find files by content, tags, or metadata</li>
          <li><strong>Upload:</strong> Drag and drop files to upload them to FileOps</li>
        </ol>
        
        <h4>Desktop Icons:</h4>
        <ul>
          <li><strong><Win98Icon name="folder" size={12} /> FileOps:</strong> Open the main file manager</li>
          <li><strong><Win98Icon name="search" size={12} /> Search Files:</strong> Search for files in your FileOps system</li>
          <li><strong><Win98Icon name="upload" size={12} /> Upload Files:</strong> Upload new files to FileOps</li>
          <li><strong><Win98Icon name="settings" size={12} /> Settings:</strong> Configure application settings</li>
          <li><strong><Win98Icon name="help" size={12} /> Help:</strong> View this help documentation</li>
          <li><strong><Win98Icon name="run" size={12} /> Run:</strong> Quick access to run commands</li>
        </ul>
      `
    },
    'fileops': {
      title: 'FileOps System',
      content: `
        <h3>FileOps Intelligent File Management</h3>
        <p>FileOps is an AI-powered file management system that helps you organize, search, and manage your files intelligently.</p>
        
        <h4>Key Features:</h4>
        <ul>
          <li><strong>AI-Powered Search:</strong> Find files using natural language queries</li>
          <li><strong>Automatic Tagging:</strong> Files are automatically tagged based on content</li>
          <li><strong>Smart Organization:</strong> Files are categorized and organized automatically</li>
          <li><strong>Content Extraction:</strong> Extract text and metadata from various file types</li>
          <li><strong>Similar File Detection:</strong> Find similar files automatically</li>
        </ul>
        
        <h4>Supported File Types:</h4>
        <ul>
          <li>Documents: PDF, DOCX, TXT, RTF</li>
          <li>Images: PNG, JPG, GIF, BMP (with OCR)</li>
          <li>Spreadsheets: XLSX, CSV</li>
          <li>Presentations: PPTX</li>
          <li>And many more...</li>
        </ul>
      `
    },
    'search': {
      title: 'Search Features',
      content: `
        <h3>Searching Files</h3>
        <p>FileOps provides powerful search capabilities to help you find files quickly and accurately.</p>
        
        <h4>Search Methods:</h4>
        <ul>
          <li><strong>Natural Language:</strong> "Find all documents about project planning"</li>
          <li><strong>Keyword Search:</strong> "budget spreadsheet 2024"</li>
          <li><strong>File Type:</strong> "PDF documents"</li>
          <li><strong>Date Range:</strong> "Files modified last week"</li>
        </ul>
        
        <h4>Search Options:</h4>
        <ul>
          <li><strong>Include Archived:</strong> Search through archived files</li>
          <li><strong>File Type Filter:</strong> Limit search to specific file types</li>
          <li><strong>Category Filter:</strong> Search within specific categories</li>
          <li><strong>Relevance Score:</strong> Results are ranked by relevance</li>
        </ul>
        
        <h4>Search Results:</h4>
        <p>Each search result shows:</p>
        <ul>
          <li>File name and type</li>
          <li>File size and modification date</li>
          <li>Relevance score</li>
          <li>Matched fields (where the search term was found)</li>
          <li>Reasoning for the match</li>
        </ul>
      `
    },
    'upload': {
      title: 'Uploading Files',
      content: `
        <h3>Uploading Files to FileOps</h3>
        <p>Upload files to make them searchable and manageable through the FileOps system.</p>
        
        <h4>Upload Methods:</h4>
        <ul>
          <li><strong>Drag and Drop:</strong> Simply drag files from your computer to the upload area</li>
          <li><strong>File Selection:</strong> Click the upload area to select files</li>
          <li><strong>Batch Upload:</strong> Upload multiple files at once</li>
        </ul>
        
        <h4>Upload Process:</h4>
        <ol>
          <li>Select or drag files to upload</li>
          <li>Files are uploaded to FileOps server</li>
          <li>AI processing extracts content and metadata</li>
          <li>Files are automatically tagged and categorized</li>
          <li>Files become searchable in the system</li>
        </ol>
        
        <h4>Upload Queue:</h4>
        <ul>
          <li>View upload progress in real-time</li>
          <li>See file status (pending, uploading, completed, error)</li>
          <li>Clear completed uploads from the queue</li>
          <li>Monitor upload speed and progress</li>
        </ul>
        
        <h4>File Size Limits:</h4>
        <p>Maximum upload size can be configured in Settings. Default is 100MB per file.</p>
      `
    },
    'settings': {
      title: 'Settings Configuration',
      content: `
        <h3>Application Settings</h3>
        <p>Configure the application to suit your preferences and FileOps setup.</p>
        
        <h4>General Settings:</h4>
        <ul>
          <li><strong>Language:</strong> Choose your preferred language</li>
          <li><strong>Notifications:</strong> Enable/disable system notifications</li>
          <li><strong>Auto-save:</strong> Automatically save settings changes</li>
        </ul>
        
        <h4>FileOps Configuration:</h4>
        <ul>
          <li><strong>Server URL:</strong> Set your FileOps server address</li>
          <li><strong>Auto-connect:</strong> Automatically connect on startup</li>
          <li><strong>Search Limit:</strong> Default number of search results</li>
          <li><strong>Upload Size:</strong> Maximum file upload size</li>
        </ul>
        
        <h4>Appearance Settings:</h4>
        <ul>
          <li><strong>Theme:</strong> Choose between Windows 98 and Modern themes</li>
          <li><strong>File Extensions:</strong> Show/hide file extensions</li>
          <li><strong>Drag and Drop:</strong> Enable/disable drag and drop functionality</li>
        </ul>
        
        <h4>Advanced Settings:</h4>
        <ul>
          <li><strong>Debug Mode:</strong> Enable development mode features</li>
          <li><strong>Reset to Defaults:</strong> Restore default settings</li>
          <li><strong>Developer Tools:</strong> Open browser developer tools</li>
        </ul>
      `
    },
    'troubleshooting': {
      title: 'Troubleshooting',
      content: `
        <h3>Troubleshooting Common Issues</h3>
        <p>Solutions for common problems you might encounter.</p>
        
        <h4>Connection Issues:</h4>
        <ul>
          <li><strong>Cannot connect to FileOps server:</strong>
            <ul>
              <li>Check the server URL in Settings</li>
              <li>Ensure the FileOps server is running</li>
              <li>Verify network connectivity</li>
              <li>Check firewall settings</li>
            </ul>
          </li>
          <li><strong>Connection timeout:</strong>
            <ul>
              <li>Increase timeout settings</li>
              <li>Check server performance</li>
              <li>Try a different network</li>
            </ul>
          </li>
        </ul>
        
        <h4>Upload Issues:</h4>
        <ul>
          <li><strong>File upload fails:</strong>
            <ul>
              <li>Check file size limits</li>
              <li>Verify file format is supported</li>
              <li>Check available disk space</li>
              <li>Try uploading smaller files first</li>
            </ul>
          </li>
          <li><strong>Upload stuck:</strong>
            <ul>
              <li>Cancel and retry the upload</li>
              <li>Check network stability</li>
              <li>Restart the application</li>
            </ul>
          </li>
        </ul>
        
        <h4>Search Issues:</h4>
        <ul>
          <li><strong>No search results:</strong>
            <ul>
              <li>Try different search terms</li>
              <li>Check if files are properly indexed</li>
              <li>Verify FileOps server is running</li>
            </ul>
          </li>
          <li><strong>Slow search:</strong>
            <ul>
              <li>Reduce search limit</li>
              <li>Use more specific search terms</li>
              <li>Check server performance</li>
            </ul>
          </li>
        </ul>
        
        <h4>Getting Help:</h4>
        <p>If you continue to experience issues:</p>
        <ul>
          <li>Check the FileOps server logs</li>
          <li>Open Developer Tools for error details</li>
          <li>Contact your system administrator</li>
          <li>Refer to FileOps documentation</li>
        </ul>
      `
    }
  };

  return (
    <div className="win98-help">
      {/* Help Navigation */}
      <div className="win98-help-nav">
        <div className="win98-help-nav-header">
          <span>Help Topics</span>
        </div>
        <div className="win98-help-nav-content">
          {Object.entries(helpContent).map(([key, section]) => (
            <button
              key={key}
              className={`win98-help-nav-item ${activeSection === key ? 'active' : ''}`}
              onClick={() => setActiveSection(key as any)}
            >
              {section.title}
            </button>
          ))}
        </div>
      </div>

      {/* Help Content */}
      <div className="win98-help-content">
        <div className="win98-help-content-header">
          <h2>{helpContent[activeSection].title}</h2>
        </div>
        <div 
          className="win98-help-content-body"
          dangerouslySetInnerHTML={{ __html: helpContent[activeSection].content }}
        />
      </div>

      {/* Help Actions */}
      <div className="win98-help-actions">
        <button className="win98-button" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};

export default Help;
