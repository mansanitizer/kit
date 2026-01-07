import React, { useState, useEffect } from 'react';
import { FileInfo } from '../shared/types';
import type { FileOpsAPI } from '../shared/api';
import FilePreview from './FilePreview';
import LoadingOverlay from './LoadingOverlay';
import ErrorDialog from './ErrorDialog';
import Win98Icon from '../Common/Win98Icon';
import './FileManager.css';

interface CategoryViewProps {
  category: string;
  onClose: () => void;
}

const CategoryView: React.FC<CategoryViewProps> = ({ category, onClose }) => {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting' | 'error'>('disconnected');
  const [operationInProgress, setOperationInProgress] = useState<string | null>(null);

  const categoryNames: Record<string, string> = {
    'document': 'Documents',
    'image': 'Photos',
    'code': 'Code',
    'data': 'Data',
    'spreadsheet': 'Spreadsheets',
    'video': 'Videos',
    'audio': 'Audio',
    'archive': 'Archives',
  };

  const categoryQueries: Record<string, string> = {
    'document': 'document pdf doc docx txt rtf',
    'image': 'image photo picture jpg jpeg png gif bmp tiff',
    'code': 'code source program script js ts py java cpp html css',
    'data': 'data csv json xml database sql',
    'spreadsheet': 'spreadsheet excel xls xlsx csv table',
    'video': 'video movie mp4 avi mov wmv mkv',
    'audio': 'audio music mp3 wav flac aac',
    'archive': 'archive zip rar 7z tar gz',
  };

  // Type-safe access to electron API
  const fileopsAPI = window.electronAPI?.fileops as FileOpsAPI;

  useEffect(() => {
    loadCategoryFiles();
    setupConnectionMonitoring();

    // Listen for file updates
    const handleFilesUpdated = () => {
      console.log('CategoryView: Files updated, refreshing...');
      loadCategoryFiles();
    };

    window.addEventListener('fileops:files-updated', handleFilesUpdated);

    return () => {
      window.removeEventListener('fileops:files-updated', handleFilesUpdated);
    };
  }, [category]);

  const setupConnectionMonitoring = () => {
    // Listen for connection status updates
    const handleStatusUpdate = (event: CustomEvent) => {
      const { status, isConnected } = event.detail;
      setConnectionStatus(status);
      
      if (isConnected && files.length === 0) {
        // Reload files if we just connected and have no files
        loadCategoryFiles();
      }
    };

    window.addEventListener('fileops:status-update', handleStatusUpdate as EventListener);
    
    // Check initial connection status
    checkConnectionStatus();
  };

  const checkConnectionStatus = async () => {
    try {
      if (fileopsAPI?.testConnection) {
        const isConnected = await fileopsAPI.testConnection();
        setConnectionStatus(isConnected ? 'connected' : 'disconnected');

        if (isConnected && files.length === 0) {
          loadCategoryFiles();
        }
      }
    } catch (error) {
      console.warn('Failed to check connection status:', error);
      setConnectionStatus('error');
    }
  };

  const loadCategoryFiles = async () => {
    try {
      setLoading(true);
      setError(null);

      if (fileopsAPI?.query) {
        const query = categoryQueries[category] || category;
        const filters = {
          categories: [category],
          limit: 100
        };

        const categoryFiles = await fileopsAPI.query(query, filters);
        setFiles(categoryFiles);
        console.log(`Loaded ${categoryFiles.length} ${category} files from FileOps`);
      } else {
        // Fallback mock data for the specific category
        setFiles(generateMockCategoryFiles(category));
        console.log('Using fallback mock data for category:', category);
      }
    } catch (error) {
      console.error('Failed to load category files:', error);
      setError(`Failed to load ${category} files: ${error instanceof Error ? error.message : 'Unknown error'}`);

      // Show fallback data on error
      setFiles(generateMockCategoryFiles(category));
    } finally {
      setLoading(false);
    }
  };

  const generateMockCategoryFiles = (category: string): FileInfo[] => {
    const mockFiles: Record<string, FileInfo[]> = {
      'document': [
        {
          fileId: 'doc-1',
          title: 'Sample Document.pdf',
          description: 'A sample PDF document',
          originalPath: '/path/to/sample.pdf',
          tags: ['document', 'pdf'],
          category: 'document',
          relevanceScore: 0.95,
          finalScore: 0.95,
          matchedFields: ['title'],
          reasoning: 'High relevance',
          modifiedAt: new Date().toISOString(),
          sizeKB: 245,
        },
        {
          fileId: 'doc-2',
          title: 'Project Plan.docx',
          description: 'Project planning document',
          originalPath: '/path/to/project.docx',
          tags: ['document', 'planning'],
          category: 'document',
          relevanceScore: 0.88,
          finalScore: 0.88,
          matchedFields: ['title'],
          reasoning: 'Good relevance',
          modifiedAt: new Date(Date.now() - 86400000).toISOString(),
          sizeKB: 156,
        },
      ],
      'image': [
        {
          fileId: 'img-1',
          title: 'Vacation Photo.jpg',
          description: 'Beautiful vacation photo',
          originalPath: '/path/to/vacation.jpg',
          tags: ['image', 'photo', 'vacation'],
          category: 'image',
          relevanceScore: 0.92,
          finalScore: 0.92,
          matchedFields: ['title'],
          reasoning: 'High relevance',
          modifiedAt: new Date().toISOString(),
          sizeKB: 1024,
        },
      ],
      'code': [
        {
          fileId: 'code-1',
          title: 'main.js',
          description: 'Main application file',
          originalPath: '/path/to/main.js',
          tags: ['code', 'javascript'],
          category: 'code',
          relevanceScore: 0.90,
          finalScore: 0.90,
          matchedFields: ['title'],
          reasoning: 'High relevance',
          modifiedAt: new Date().toISOString(),
          sizeKB: 45,
        },
      ],
      'spreadsheet': [
        {
          fileId: 'sheet-1',
          title: 'Budget.xlsx',
          description: 'Monthly budget spreadsheet',
          originalPath: '/path/to/budget.xlsx',
          tags: ['spreadsheet', 'budget'],
          category: 'spreadsheet',
          relevanceScore: 0.87,
          finalScore: 0.87,
          matchedFields: ['title'],
          reasoning: 'Good relevance',
          modifiedAt: new Date().toISOString(),
          sizeKB: 89,
        },
      ],
    };

    return mockFiles[category] || [
      {
        fileId: 'no-files',
        title: 'No files found',
        description: `No ${category} files available`,
        originalPath: '/no-files',
        tags: [category],
        category: category,
        relevanceScore: 0,
        finalScore: 0,
        matchedFields: [],
        reasoning: 'No files in category',
        modifiedAt: new Date().toISOString(),
        sizeKB: 0,
      },
    ];
  };

  const handleFileAction = async (file: FileInfo, action: 'open' | 'delete' | 'info' | 'preview' | 'tag' | 'copy') => {
    try {
      setOperationInProgress(action);
      
      switch (action) {
        case 'open':
          if (fileopsAPI?.readFile) {
            try {
              const fileContent = await fileopsAPI.readFile(file.fileId);
              console.log(`File opened via FileOps: ${file.title}`, fileContent);

              // Show success message
              showNotification(`File opened: ${file.title}`, 'success');

              // Open preview if it's a readable file
              if (fileContent.content || fileContent.text) {
                setSelectedFile(file);
                setShowPreview(true);
              }
            } catch (error) {
              console.error('Failed to open file:', error);
              showNotification(`Failed to open file: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
            }
          }
          break;
          
        case 'delete':
          if (fileopsAPI?.deleteFile) {
            try {
              const confirmed = window.confirm(`Are you sure you want to delete "${file.title}"?`);
              if (confirmed) {
                await fileopsAPI.deleteFile(file.fileId);
                showNotification(`File deleted: ${file.title}`, 'success');
                loadCategoryFiles(); // Refresh the list
              }
            } catch (error) {
              console.error('Failed to delete file:', error);
              showNotification(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
            }
          }
          break;
          
        case 'preview':
          setSelectedFile(file);
          setShowPreview(true);
          break;
          
        case 'info':
          showNotification(`File Info: ${file.title}\nSize: ${file.sizeKB}KB\nModified: ${new Date(file.modifiedAt).toLocaleDateString()}\nTags: ${file.tags.join(', ')}`, 'info');
          break;
          
        case 'tag':
          const newTag = window.prompt('Enter new tag:');
          if (newTag && fileopsAPI?.updateFileTags) {
            try {
              await fileopsAPI.updateFileTags(file.fileId, [...file.tags, newTag]);
              showNotification(`Tag added: ${newTag}`, 'success');
              loadCategoryFiles(); // Refresh the list
            } catch (error) {
              console.error('Failed to add tag:', error);
              showNotification(`Failed to add tag: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
            }
          }
          break;
          
        case 'copy':
          // Copy file path to clipboard
          navigator.clipboard.writeText(file.originalPath);
          showNotification(`File path copied to clipboard: ${file.originalPath}`, 'success');
          break;
      }
    } catch (error) {
      console.error('File action failed:', error);
      showNotification(`Action failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    } finally {
      setOperationInProgress(null);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
    // Create a simple notification
    const notification = document.createElement('div');
    notification.className = `win98-notification win98-notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'error' ? '#ffcccc' : type === 'success' ? '#ccffcc' : type === 'warning' ? '#ffffcc' : '#cce5ff'};
      border: 2px solid ${type === 'error' ? '#ff0000' : type === 'success' ? '#00ff00' : type === 'warning' ? '#ffff00' : '#0066ff'};
      padding: 10px;
      border-radius: 5px;
      z-index: 10000;
      max-width: 300px;
      word-wrap: break-word;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  };

  const formatFileSize = (sizeKB: number): string => {
    if (sizeKB < 1024) {
      return `${sizeKB} KB`;
    } else if (sizeKB < 1024 * 1024) {
      return `${(sizeKB / 1024).toFixed(1)} MB`;
    } else {
      return `${(sizeKB / (1024 * 1024)).toFixed(1)} GB`;
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  if (showPreview && selectedFile) {
    return (
      <FilePreview
        file={selectedFile}
        onClose={() => setShowPreview(false)}
      />
    );
  }

  return (
    <div className="win98-window category-view">
      <div className="win98-window-header">
        <div className="win98-window-title">
          <Win98Icon name="folder" />
          {categoryNames[category] || category} ({files.length} files)
        </div>
        <div className="win98-window-controls">
          <button className="win98-button win98-button-minimize" onClick={() => {}}>
            <span>_</span>
          </button>
          <button className="win98-button win98-button-maximize" onClick={() => {}}>
            <span>□</span>
          </button>
          <button className="win98-button win98-button-close" onClick={onClose}>
            <span>×</span>
          </button>
        </div>
      </div>

      <div className="win98-window-content">
        <div className="win98-toolbar">
          <div className="win98-toolbar-group">
            <button 
              className={`win98-button ${viewMode === 'list' ? 'win98-button-active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              List
            </button>
            <button 
              className={`win98-button ${viewMode === 'grid' ? 'win98-button-active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              Grid
            </button>
          </div>
          
          <div className="win98-toolbar-group">
            <button 
              className="win98-button"
              onClick={loadCategoryFiles}
              disabled={loading}
            >
              Refresh
            </button>
          </div>

          <div className="win98-connection-status">
            <div className={`status-indicator ${connectionStatus}`}>
              {connectionStatus === 'connected' && '🟢'}
              {connectionStatus === 'disconnected' && '🔴'}
              {connectionStatus === 'connecting' && '🟡'}
              {connectionStatus === 'error' && '🔴'}
            </div>
            <span className="status-text">
              {connectionStatus === 'connected' && 'Connected'}
              {connectionStatus === 'disconnected' && 'Disconnected'}
              {connectionStatus === 'connecting' && 'Connecting...'}
              {connectionStatus === 'error' && 'Error'}
            </span>
          </div>
        </div>

        <div className="win98-content-area">
          {loading && <LoadingOverlay message={`Loading ${category} files...`} show={loading} />}
          
          {error && (
            <ErrorDialog
              title="Error"
              message={error}
              onClose={() => setError(null)}
            />
          )}

          {!loading && !error && (
            <div className={`file-list ${viewMode}`}>
              {files.length === 0 ? (
                <div className="no-files">
                  <p>No {category} files found.</p>
                  <p>Try uploading some files or check your search criteria.</p>
                </div>
              ) : (
                files.map((file) => (
                  <div key={file.fileId} className="file-item">
                    <div className="file-icon">
                      <Win98Icon name={getFileIcon(file)} />
                    </div>
                    <div className="file-info">
                      <div className="file-name">{file.title}</div>
                      <div className="file-details">
                        {formatFileSize(file.sizeKB)} • {formatDate(file.modifiedAt)}
                      </div>
                      {file.tags.length > 0 && (
                        <div className="file-tags">
                          {file.tags.slice(0, 3).map((tag, index) => (
                            <span key={index} className="tag">{tag}</span>
                          ))}
                          {file.tags.length > 3 && (
                            <span className="tag-more">+{file.tags.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="file-actions">
                      <button
                        className="win98-button win98-button-small"
                        onClick={() => handleFileAction(file, 'preview')}
                        disabled={operationInProgress !== null}
                      >
                        Preview
                      </button>
                      <button
                        className="win98-button win98-button-small"
                        onClick={() => handleFileAction(file, 'open')}
                        disabled={operationInProgress !== null}
                      >
                        Open
                      </button>
                      <button
                        className="win98-button win98-button-small"
                        onClick={() => handleFileAction(file, 'info')}
                        disabled={operationInProgress !== null}
                      >
                        Info
                      </button>
                      <button
                        className="win98-button win98-button-small win98-button-danger"
                        onClick={() => handleFileAction(file, 'delete')}
                        disabled={operationInProgress !== null}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const getFileIcon = (file: FileInfo): string => {
  const extension = file.title.split('.').pop()?.toLowerCase();
  
  // Document types
  if (['pdf', 'doc', 'docx', 'txt', 'rtf'].includes(extension || '')) {
    return 'document';
  }
  
  // Image types
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff'].includes(extension || '')) {
    return 'image';
  }
  
  // Code types
  if (['js', 'ts', 'py', 'java', 'cpp', 'html', 'css', 'json', 'xml'].includes(extension || '')) {
    return 'code';
  }
  
  // Spreadsheet types
  if (['xls', 'xlsx', 'csv'].includes(extension || '')) {
    return 'spreadsheet';
  }
  
  // Video types
  if (['mp4', 'avi', 'mov', 'wmv', 'mkv'].includes(extension || '')) {
    return 'video';
  }
  
  // Audio types
  if (['mp3', 'wav', 'flac', 'aac'].includes(extension || '')) {
    return 'audio';
  }
  
  // Archive types
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension || '')) {
    return 'archive';
  }
  
  // Default
  return 'file';
};

export default CategoryView;
