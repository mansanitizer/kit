import React, { useState, useEffect } from 'react';
import { FileInfo } from '../shared/types';
import FilePreview from './FilePreview';
import LoadingOverlay from './LoadingOverlay';
import ErrorDialog from './ErrorDialog';
import Win98Icon from '../Common/Win98Icon';
import './FileManager.css';

interface FileManagerProps {
  onClose: () => void;
}

const FileManager: React.FC<FileManagerProps> = ({ onClose }) => {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting' | 'error'>('disconnected');
  const [operationInProgress, setOperationInProgress] = useState<string | null>(null);

  useEffect(() => {
    loadFiles();
    setupConnectionMonitoring();
    
    // Listen for file updates
    const handleFilesUpdated = () => {
      console.log('FileManager: Files updated, refreshing...');
      loadFiles();
    };
    
    window.addEventListener('fileops:files-updated', handleFilesUpdated);
    
    return () => {
      window.removeEventListener('fileops:files-updated', handleFilesUpdated);
    };
  }, []);

  const setupConnectionMonitoring = () => {
    // Listen for connection status updates
    const handleStatusUpdate = (event: CustomEvent) => {
      const { status, isConnected } = event.detail;
      setConnectionStatus(status);
      
      if (isConnected && files.length === 0) {
        // Reload files if we just connected and have no files
        loadFiles();
      }
    };

    window.addEventListener('fileops:status-update', handleStatusUpdate as EventListener);
    
    // Check initial connection status
    checkConnectionStatus();
  };

  const checkConnectionStatus = async () => {
    try {
      if (window.electronAPI?.fileops?.testConnection) {
        const isConnected = await window.electronAPI.fileops.testConnection();
        setConnectionStatus(isConnected ? 'connected' : 'disconnected');
        
        if (isConnected && files.length === 0) {
          loadFiles();
        }
      }
    } catch (error) {
      console.warn('Failed to check connection status:', error);
      setConnectionStatus('error');
    }
  };

  const loadFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (window.electronAPI?.fileops?.listRecent) {
        const recentFiles = await window.electronAPI.fileops.listRecent(30, 50);
        setFiles(recentFiles);
        console.log(`Loaded ${recentFiles.length} files from FileOps`);
      } else {
        // Fallback mock data
        setFiles([
          {
            fileId: '1',
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
            fileId: '2',
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
        ]);
        console.log('Using fallback mock data');
      }
    } catch (error) {
      console.error('Failed to load files:', error);
      setError(`Failed to load files: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Show fallback data on error
      setFiles([
        {
          fileId: 'error-1',
          title: 'Connection Error',
          description: 'Unable to connect to FileOps server',
          originalPath: '/error',
          tags: ['error'],
          category: 'error',
          relevanceScore: 0,
          finalScore: 0,
          matchedFields: [],
          reasoning: 'Connection failed',
          modifiedAt: new Date().toISOString(),
          sizeKB: 0,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileAction = async (file: FileInfo, action: 'open' | 'delete' | 'info' | 'preview' | 'tag' | 'copy') => {
    try {
      setOperationInProgress(action);
      
      switch (action) {
        case 'open':
          if (window.electronAPI?.fileops?.readFile) {
            try {
              const fileContent = await window.electronAPI.fileops.readFile(file.fileId);
              console.log(`File opened via FileOps: ${file.title}`, fileContent);
              
              // Show success message
              showNotification(`File opened: ${file.title}`, 'success');
              
              // Open preview if it's a readable file
              if (fileContent.content || fileContent.text) {
                setSelectedFile(file);
                setShowPreview(true);
              }
            } catch (fileOpsError) {
              console.warn('FileOps open failed:', fileOpsError);
              showNotification(`Failed to open file: ${fileOpsError}`, 'error');
            }
          } else {
            showNotification(`Opening file: ${file.title}`, 'info');
          }
          break;
          
        case 'preview':
          setSelectedFile(file);
          setShowPreview(true);
          break;
          
        case 'delete':
          if (confirm(`Are you sure you want to delete "${file.title}"?`)) {
            if (window.electronAPI?.fileops?.deleteFile) {
              try {
                await window.electronAPI.fileops.deleteFile(file.fileId);
                setFiles(prev => prev.filter(f => f.fileId !== file.fileId));
                console.log(`File deleted via FileOps: ${file.title}`);
                showNotification(`File deleted: ${file.title}`, 'success');
              } catch (fileOpsError) {
                console.warn('FileOps delete failed:', fileOpsError);
                showNotification(`Failed to delete file: ${fileOpsError}`, 'error');
              }
            } else {
              // Fallback local delete
              setFiles(prev => prev.filter(f => f.fileId !== file.fileId));
              console.log(`File deleted locally: ${file.title}`);
              showNotification(`File deleted: ${file.title}`, 'success');
            }
          }
          break;
          
        case 'tag':
          // Create a simple input dialog instead of using prompt()
          const tagInput = document.createElement('div');
          tagInput.className = 'win98-tag-input-dialog';
          tagInput.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #c0c0c0;
            border: 2px solid #000;
            padding: 20px;
            z-index: 10000;
            font-family: 'MS Sans Serif', sans-serif;
            min-width: 300px;
          `;
          
          tagInput.innerHTML = `
            <div style="margin-bottom: 15px; font-weight: bold;">Add Tag to "${file.title}"</div>
            <input type="text" id="tag-input" placeholder="Enter tag name..." style="width: 100%; padding: 5px; margin-bottom: 15px;">
            <div style="text-align: right;">
              <button id="tag-cancel" style="margin-right: 10px; padding: 5px 15px;">Cancel</button>
              <button id="tag-ok" style="padding: 5px 15px;">OK</button>
            </div>
          `;
          
          document.body.appendChild(tagInput);
          
          const tagInputField = tagInput.querySelector('#tag-input') as HTMLInputElement;
          const tagOkButton = tagInput.querySelector('#tag-ok') as HTMLButtonElement;
          const tagCancelButton = tagInput.querySelector('#tag-cancel') as HTMLButtonElement;
          
          tagInputField.focus();
          
          const handleTagInput = () => {
            const newTag = tagInputField.value.trim();
            if (newTag) {
              addTagToFile(file, newTag);
            }
            document.body.removeChild(tagInput);
          };
          
          const handleTagCancel = () => {
            document.body.removeChild(tagInput);
          };
          
          tagOkButton.addEventListener('click', handleTagInput);
          tagCancelButton.addEventListener('click', handleTagCancel);
          tagInputField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
              handleTagInput();
            }
          });
          
          break;
          
        case 'copy':
          if (window.electronAPI?.fileops?.findSimilar) {
            try {
              const similarFiles = await window.electronAPI.fileops.findSimilar(file.fileId, 5);
              console.log(`Similar files found:`, similarFiles);
              showNotification(`Found ${similarFiles.length} similar files to "${file.title}"`, 'info');
              
              // Show similar files in a dialog
              const similarFilesList = similarFiles.map((f: any) => f.title).join('\n');
              alert(`Similar files to "${file.title}":\n\n${similarFilesList}`);
            } catch (fileOpsError) {
              console.warn('FileOps similar files failed:', fileOpsError);
              showNotification(`Failed to find similar files: ${fileOpsError}`, 'error');
            }
          } else {
            showNotification(`Similar files feature not available`, 'warning');
          }
          break;
          
        case 'info':
          // Enhanced file properties with FileOps data
          let info = `
File Properties:
- Name: ${file.title}
- Type: ${file.category}
- Size: ${formatFileSize(file.sizeKB)}
- Modified: ${formatDate(file.modifiedAt)}
- Tags: ${file.tags.join(', ')}
- Path: ${file.originalPath}
- Relevance Score: ${(file.finalScore * 100).toFixed(0)}%
          `;
          
          // Try to get additional FileOps info
          if (window.electronAPI?.fileops?.getFileInfo) {
            try {
              const fileInfo = await window.electronAPI.fileops.getFileInfo(file.fileId);
              info += `\n- FileOps ID: ${fileInfo.fileId || 'N/A'}`;
              info += `\n- FileOps Metadata: ${JSON.stringify(fileInfo.metadata || {}, null, 2)}`;
            } catch (fileOpsError) {
              console.warn('FileOps info failed:', fileOpsError);
            }
          }
          
          alert(info);
          break;
      }
    } catch (error) {
      console.error(`File action failed: ${action}`, error);
      showNotification(`Failed to ${action} file: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    } finally {
      setOperationInProgress(null);
    }
  };

  const addTagToFile = async (file: FileInfo, newTag: string) => {
    try {
      if (window.electronAPI?.fileops?.learn) {
        await window.electronAPI.fileops.learn(file.fileId, `Added tag: ${newTag}`, {
          learningType: 'custom',
          tags: [newTag]
        });
        console.log(`Tag added via FileOps: ${newTag} to ${file.title}`);
        showNotification(`Tag "${newTag}" added to file`, 'success');
        
        // Update the file in the list
        setFiles(prev => prev.map((f: FileInfo) => 
          f.fileId === file.fileId 
            ? { ...f, tags: [...f.tags, newTag] }
            : f
        ));
      } else {
        showNotification(`Tagging feature not available`, 'warning');
      }
    } catch (fileOpsError) {
      console.warn('FileOps tag failed:', fileOpsError);
      showNotification(`Failed to add tag: ${fileOpsError}`, 'error');
    }
  };

  const showNotification = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    // Create a simple notification
    const notification = document.createElement('div');
    notification.className = `win98-notification win98-notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 10px 15px;
      border: 2px solid #000;
      background: ${type === 'error' ? '#ffcccc' : type === 'success' ? '#ccffcc' : type === 'warning' ? '#ffffcc' : '#ccccff'};
      z-index: 10000;
      font-family: 'MS Sans Serif', sans-serif;
      font-size: 12px;
      max-width: 300px;
      word-wrap: break-word;
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  };

  const getFileIcon = (file: FileInfo) => {
    const extension = file.title.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'file';
      case 'docx':
      case 'doc':
        return 'file';
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
        return 'file';
      case 'txt':
        return 'file';
      default:
        return 'folder';
    }
  };

  const formatFileSize = (sizeKB: number) => {
    if (sizeKB < 1024) {
      return `${sizeKB} KB`;
    } else {
      return `${(sizeKB / 1024).toFixed(1)} MB`;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return '#00ff00';
      case 'connecting':
        return '#ffff00';
      case 'error':
        return '#ff0000';
      default:
        return '#cccccc';
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'FileOps Connected';
      case 'connecting':
        return 'Connecting...';
      case 'error':
        return 'Connection Error';
      default:
        return 'FileOps Disconnected';
    }
  };

  return (
    <div className="win98-file-manager">
      {/* Loading Overlay */}
      <LoadingOverlay 
        show={loading} 
        message="Loading files from FileOps..." 
      />

      {/* Error Dialog */}
      {error && (
        <ErrorDialog
          title="File Manager Error"
          message="Failed to load files"
          details={error}
          onClose={() => setError(null)}
          onRetry={() => loadFiles()}
        />
      )}

      {showPreview && selectedFile ? (
        <FilePreview 
          file={selectedFile} 
          onClose={() => {
            setShowPreview(false);
            setSelectedFile(null);
          }} 
        />
      ) : (
        <>
          {/* Toolbar */}
          <div className="win98-toolbar">
            <button 
              className="win98-toolbar-button" 
              onClick={loadFiles}
              disabled={loading}
              title="Refresh files"
            >
              <Win98Icon name="refresh" size={16} />
            </button>
            <button 
              className="win98-toolbar-button" 
              onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
              title={`Switch to ${viewMode === 'list' ? 'grid' : 'list'} view`}
            >
              {viewMode === 'list' ? '⊞' : '☰'}
            </button>
            <div className="win98-toolbar-separator"></div>
            <span className="win98-toolbar-text">FileOps File Manager</span>
            <div className="win98-toolbar-separator"></div>
            <div 
              className="win98-connection-indicator"
              style={{ 
                backgroundColor: getConnectionStatusColor(),
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                display: 'inline-block',
                marginRight: '5px'
              }}
              title={getConnectionStatusText()}
            ></div>
            <span className="win98-toolbar-text">{getConnectionStatusText()}</span>
          </div>

          {/* Content */}
          <div className="win98-file-manager-content">
            {loading ? (
              <div className="win98-loading">
                <div className="win98-loading-spinner"></div>
                <span>Loading files...</span>
              </div>
            ) : (
              <>
                {viewMode === 'list' ? (
                  <div className="win98-file-list">
                    <div className="win98-file-list-header">
                      <div className="win98-file-list-header-name">Name</div>
                      <div className="win98-file-list-header-size">Size</div>
                      <div className="win98-file-list-header-date">Modified</div>
                      <div className="win98-file-list-header-type">Type</div>
                      <div className="win98-file-list-header-actions">Actions</div>
                    </div>
                    {files.map((file) => (
                      <div key={file.fileId} className="win98-file-list-item">
                        <div className="win98-file-list-item-icon">
                          <Win98Icon name={getFileIcon(file)} size={16} />
                        </div>
                        <div className="win98-file-list-item-name" onClick={() => handleFileAction(file, 'open')}>
                          {file.title}
                        </div>
                        <div className="win98-file-list-item-size">{formatFileSize(file.sizeKB)}</div>
                        <div className="win98-file-list-item-date">{formatDate(file.modifiedAt)}</div>
                        <div className="win98-file-list-item-type">{file.category}</div>
                        <div className="win98-file-list-item-actions">
                          <button 
                            className="win98-button win98-button-small"
                            onClick={() => handleFileAction(file, 'preview')}
                            title="Preview File"
                            disabled={operationInProgress !== null}
                          >
                            <Win98Icon name="view" size={12} />
                          </button>
                          <button 
                            className="win98-button win98-button-small"
                            onClick={() => handleFileAction(file, 'tag')}
                            title="Add Tag"
                            disabled={operationInProgress !== null}
                          >
                            <Win98Icon name="tag" size={12} />
                          </button>
                          <button 
                            className="win98-button win98-button-small"
                            onClick={() => handleFileAction(file, 'copy')}
                            title="Find Similar"
                            disabled={operationInProgress !== null}
                          >
                            <Win98Icon name="search" size={12} />
                          </button>
                          <button 
                            className="win98-button win98-button-small"
                            onClick={() => handleFileAction(file, 'info')}
                            title="File Properties"
                            disabled={operationInProgress !== null}
                          >
                            <Win98Icon name="info" size={12} />
                          </button>
                          <button 
                            className="win98-button win98-button-small"
                            onClick={() => handleFileAction(file, 'delete')}
                            title="Delete File"
                            disabled={operationInProgress !== null}
                          >
                            <Win98Icon name="delete" size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="win98-file-grid">
                    {files.map((file) => (
                      <div key={file.fileId} className="win98-file-grid-item">
                        <div className="win98-file-grid-item-icon">
                          <Win98Icon name={getFileIcon(file)} size={32} />
                        </div>
                        <div className="win98-file-grid-item-name">{file.title}</div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Status Bar */}
          <div className="win98-statusbar">
            <span>{files.length} object(s)</span>
            <span className="win98-statusbar-separator">|</span>
            <span style={{ color: getConnectionStatusColor() }}>{getConnectionStatusText()}</span>
            {operationInProgress && (
              <>
                <span className="win98-statusbar-separator">|</span>
                <span>Working: {operationInProgress}...</span>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default FileManager;
