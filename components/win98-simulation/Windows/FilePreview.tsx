import React, { useState, useEffect } from 'react';
import { FileInfo } from '../shared/types';
import Win98Icon from '../Common/Win98Icon';
import './FilePreview.css';

interface FilePreviewProps {
  file: FileInfo | null;
  onClose: () => void;
}

const FilePreview: React.FC<FilePreviewProps> = ({ file, onClose }) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (file) {
      loadFileContent();
    }
  }, [file]);

  const loadFileContent = async () => {
    if (!file) return;

    setLoading(true);
    setError('');

    try {
      if (window.electronAPI?.fileops?.readFile) {
        const fileContent = await window.electronAPI.fileops.readFile(file.fileId);
        setContent(fileContent.content || fileContent.text || 'No preview available');
      } else {
        // Fallback: show file info
        setContent(`File: ${file.title}\n\nType: ${file.category}\nSize: ${formatFileSize(file.sizeKB)}\nPath: ${file.originalPath}\nTags: ${file.tags.join(', ')}\n\nDescription: ${file.description}`);
      }
    } catch (error) {
      console.error('Failed to load file content:', error);
      setError('Failed to load file preview');
      setContent(`File: ${file.title}\n\nType: ${file.category}\nSize: ${formatFileSize(file.sizeKB)}\nPath: ${file.originalPath}\nTags: ${file.tags.join(', ')}\n\nDescription: ${file.description}`);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (sizeKB: number): string => {
    if (sizeKB < 1024) return `${sizeKB} KB`;
    if (sizeKB < 1024 * 1024) return `${(sizeKB / 1024).toFixed(1)} MB`;
    return `${(sizeKB / (1024 * 1024)).toFixed(1)} GB`;
  };

  const getFileIcon = (file: FileInfo) => {
    switch (file.category) {
      case 'document':
        return 'file';
      case 'image':
        return 'file';
      case 'spreadsheet':
        return 'bar-chart-3';
      case 'video':
        return 'file';
      case 'audio':
        return 'file';
      case 'archive':
        return 'file';
      case 'code':
        return 'file';
      default:
        return 'folder';
    }
  };

  const canPreview = (file: FileInfo): boolean => {
    const previewableTypes = ['document', 'code', 'text'];
    return previewableTypes.includes(file.category);
  };

  if (!file) {
    return null;
  }

  return (
    <div className="win98-file-preview">
      <div className="win98-file-preview-header">
        <div className="win98-file-preview-title">
          <span className="win98-file-preview-icon">
            <Win98Icon name={getFileIcon(file)} size={16} />
          </span>
          <span>{file.title}</span>
        </div>
        <button className="win98-button win98-button-small" onClick={onClose}>
          <Win98Icon name="close" size={12} />
        </button>
      </div>

      <div className="win98-file-preview-content">
        {loading ? (
          <div className="win98-file-preview-loading">
            <div className="win98-loading-spinner"></div>
            <p>Loading preview...</p>
          </div>
        ) : error ? (
          <div className="win98-file-preview-error">
            <p>⚠️ {error}</p>
          </div>
        ) : (
          <div className="win98-file-preview-body">
            {canPreview(file) ? (
              <pre className="win98-file-preview-text">{content}</pre>
            ) : (
              <div className="win98-file-preview-info">
                <div className="win98-file-preview-info-item">
                  <strong>Type:</strong> {file.category}
                </div>
                <div className="win98-file-preview-info-item">
                  <strong>Size:</strong> {formatFileSize(file.sizeKB)}
                </div>
                <div className="win98-file-preview-info-item">
                  <strong>Modified:</strong> {new Date(file.modifiedAt).toLocaleString()}
                </div>
                <div className="win98-file-preview-info-item">
                  <strong>Path:</strong> {file.originalPath}
                </div>
                <div className="win98-file-preview-info-item">
                  <strong>Tags:</strong> {file.tags.join(', ')}
                </div>
                <div className="win98-file-preview-info-item">
                  <strong>Description:</strong> {file.description}
                </div>
                <div className="win98-file-preview-info-item">
                  <strong>Relevance Score:</strong> {(file.finalScore * 100).toFixed(0)}%
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="win98-file-preview-actions">
        <button className="win98-button" onClick={() => window.electronAPI?.openExternal(`file://${file.originalPath}`)}>
          Open File
        </button>
        <button className="win98-button" onClick={() => window.electronAPI?.fileops?.getFileInfo(file.fileId)}>
          Properties
        </button>
        <button className="win98-button" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};

export default FilePreview;
