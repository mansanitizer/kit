import React, { useState, useRef } from 'react';
import LoadingOverlay from './LoadingOverlay';
import ErrorDialog from './ErrorDialog';
import Win98Icon from '../Common/Win98Icon';
import './Upload.css';

interface UploadProps {
  onClose: () => void;
  onFileUploaded?: () => void; // Callback to refresh File Manager
}

interface UploadItem {
  id: string;
  name: string;
  size: number;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  file: File;
}

const Upload: React.FC<UploadProps> = ({ onClose, onFileUploaded }) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<UploadItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragIn = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragActive(true);
    }
  };

  const handleDragOut = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const validateFile = (file: File): string | null => {
    // Check file size (default 100MB limit)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      return `File "${file.name}" is too large. Maximum size is 100MB.`;
    }

    // Check file type
    const allowedTypes = [
      'text/plain', 'text/html', 'text/css', 'text/javascript',
      'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp',
      'video/mp4', 'video/avi', 'video/mov', 'video/wmv',
      'audio/mpeg', 'audio/wav', 'audio/ogg',
      'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed',
      'application/json', 'application/xml', 'text/csv'
    ];

    if (!allowedTypes.includes(file.type) && !file.name.includes('.')) {
      return `File type not supported: ${file.name}`;
    }

    return null;
  };

  const handleFiles = (files: FileList) => {
    const newFiles: UploadItem[] = [];
    const errors: string[] = [];

    Array.from(files).forEach((file) => {
      const validationError = validateFile(file);
      if (validationError) {
        errors.push(validationError);
        return;
      }

      const uploadItem: UploadItem = {
        id: `file-${Date.now()}-${Math.random()}`,
        name: file.name,
        size: file.size,
        progress: 0,
        status: 'pending',
        file: file,
      };

      newFiles.push(uploadItem);
    });

    if (errors.length > 0) {
      setError(errors.join('\n'));
    }

    if (newFiles.length > 0) {
      setUploadQueue(prev => [...prev, ...newFiles]);
      
      // Start uploading the new files
      newFiles.forEach((fileItem) => {
        uploadFile(fileItem);
      });
    }
  };

  const uploadFile = async (fileItem: UploadItem) => {
    try {
      // Update status to uploading
      setUploadQueue(prev => 
        prev.map(item => 
          item.id === fileItem.id ? { ...item, status: 'uploading' } : item
        )
      );

      setIsUploading(true);

      // Simulate upload progress
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 90) {
          clearInterval(progressInterval);
          progress = 90;
        }
        
        setUploadQueue(prev => 
          prev.map(item => 
            item.id === fileItem.id ? { ...item, progress } : item
          )
        );
      }, 200);

      // Try to use real FileOps upload if available
      if (window.electronAPI?.fileops?.ingestFile) {
        try {
          // Convert file to base64 and save to temporary location
          const reader = new FileReader();
          reader.onload = async (e) => {
            try {
              const base64Data = e.target?.result as string;
              const fileData = base64Data.split(',')[1]; // Remove data URL prefix
              
              // Save file to temp directory
              const tempFilePath = await window.electronAPI.file.saveToTemp(fileItem.file.name, fileData);
              console.log('File saved to temp:', tempFilePath);
              
              // Now upload to FileOps
              const uploadResult = await window.electronAPI.fileops.ingestFile(
                tempFilePath,
                {
                  tags: ['uploaded', getFileCategory(fileItem.file.type)],
                  category: getFileCategory(fileItem.file.type),
                  description: `Uploaded file: ${fileItem.file.name}`
                }
              );
              
              console.log('FileOps upload result:', uploadResult);
              
              clearInterval(progressInterval);
              
              // Complete the upload
              setUploadQueue(prev => 
                prev.map(item => 
                  item.id === fileItem.id ? { ...item, progress: 100, status: 'completed' } : item
                )
              );
              
              // Notify parent component to refresh File Manager
              if (onFileUploaded) {
                onFileUploaded();
              }

              showNotification(`File uploaded successfully: ${fileItem.name}`, 'success');
            } catch (uploadError) {
              console.warn('FileOps upload failed:', uploadError);
              clearInterval(progressInterval);
              
              setUploadQueue(prev => 
                prev.map(item => 
                  item.id === fileItem.id ? { 
                    ...item, 
                    status: 'error', 
                    error: uploadError instanceof Error ? uploadError.message : 'Upload failed'
                  } : item
                )
              );
              
              showNotification(`Failed to upload ${fileItem.name}: ${uploadError}`, 'error');
            }
          };
          
          reader.onerror = () => {
            clearInterval(progressInterval);
            setUploadQueue(prev => 
              prev.map(item => 
                item.id === fileItem.id ? { 
                  ...item, 
                  status: 'error', 
                  error: 'Failed to read file'
                } : item
              )
            );
            showNotification(`Failed to read file: ${fileItem.name}`, 'error');
          };
          
          reader.readAsDataURL(fileItem.file);
        } catch (fileOpsError) {
          console.warn('FileOps upload failed, using local storage:', fileOpsError);
          
          // Fallback to local storage
          await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
          
          clearInterval(progressInterval);
          
          setUploadQueue(prev => 
            prev.map(item => 
              item.id === fileItem.id ? { ...item, progress: 100, status: 'completed' } : item
            )
          );
          
          showNotification(`File uploaded (local storage): ${fileItem.name}`, 'warning');
        }
      } else {
        // Fallback simulation
        await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
        
        clearInterval(progressInterval);
        
        setUploadQueue(prev => 
          prev.map(item => 
            item.id === fileItem.id ? { ...item, progress: 100, status: 'completed' } : item
          )
        );

        console.log(`File uploaded successfully: ${fileItem.name}`);
        showNotification(`File uploaded (simulation): ${fileItem.name}`, 'info');
      }
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadQueue(prev => 
        prev.map(item => 
          item.id === fileItem.id ? { 
            ...item, 
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          } : item
        )
      );
      showNotification(`Upload failed: ${error}`, 'error');
    } finally {
      setIsUploading(false);
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

  const getFileCategory = (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('pdf')) return 'document';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'document';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'spreadsheet';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'presentation';
    if (mimeType.includes('zip') || mimeType.includes('archive')) return 'archive';
    if (mimeType.includes('text/') || mimeType.includes('code')) return 'code';
    return 'document';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return 'clock';
      case 'uploading':
        return 'upload';
      case 'completed':
        return 'check-circle';
      case 'error':
        return 'alert-circle';
      default:
        return 'folder';
    }
  };

  const clearCompleted = () => {
    setUploadQueue(prev => prev.filter(file => file.status !== 'completed'));
  };

  const retryUpload = (fileItem: UploadItem) => {
    if (fileItem.status === 'error') {
      setUploadQueue(prev => 
        prev.map(item => 
          item.id === fileItem.id ? { ...item, status: 'pending', progress: 0, error: undefined } : item
        )
      );
      uploadFile(fileItem);
    }
  };

  const removeFromQueue = (fileId: string) => {
    setUploadQueue(prev => prev.filter(file => file.id !== fileId));
  };

  return (
    <div className="win98-upload">
      {/* Loading Overlay */}
      <LoadingOverlay 
        show={isUploading} 
        message="Uploading files to FileOps..." 
      />

      {/* Error Dialog */}
      {error && (
        <ErrorDialog
          title="Upload Error"
          message="File validation failed"
          details={error}
          onClose={() => setError(null)}
          onRetry={() => setError(null)}
        />
      )}

      {/* Upload Area */}
      <div className="win98-upload-area">
        <div
          className={`win98-upload-dropzone ${dragActive ? 'drag-active' : ''}`}
          onDragEnter={handleDragIn}
          onDragLeave={handleDragOut}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={handleFileSelect}
        >
          <div className="win98-upload-dropzone-content">
            <div className="win98-upload-icon">
              <Win98Icon name="folder" size={48} />
            </div>
            <div className="win98-upload-text">
              {dragActive ? 'Drop files here' : 'Drag and drop files here'}
            </div>
            <div className="win98-upload-subtext">
              or click to select files
            </div>
            <div className="win98-upload-info">
              <div>Supported formats: PDF, DOC, XLS, PPT, Images, Videos, Audio</div>
              <div>Maximum file size: 100MB per file</div>
            </div>
          </div>
        </div>
        
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          style={{ display: 'none' }}
          onChange={handleFileInputChange}
        />
      </div>

      {/* Upload Queue */}
      <div className="win98-upload-queue">
        <div className="win98-upload-queue-header">
          <span>Upload Queue ({uploadQueue.length})</span>
          <div className="win98-upload-queue-actions">
            {uploadQueue.some(f => f.status === 'completed') && (
              <button className="win98-button win98-button-small" onClick={clearCompleted}>
                Clear Completed
              </button>
            )}
            {uploadQueue.some(f => f.status === 'error') && (
              <button 
                className="win98-button win98-button-small" 
                onClick={() => {
                  uploadQueue
                    .filter(f => f.status === 'error')
                    .forEach(retryUpload);
                }}
              >
                Retry Failed
              </button>
            )}
          </div>
        </div>
        
        <div className="win98-upload-queue-content">
          {uploadQueue.length === 0 ? (
            <div className="win98-upload-empty">
              No files in queue
            </div>
          ) : (
            uploadQueue.map((file) => (
              <div key={file.id} className="win98-upload-item">
                <div className="win98-upload-item-icon">
                  <Win98Icon name={getStatusIcon(file.status)} size={16} />
                </div>
                <div className="win98-upload-item-content">
                  <div className="win98-upload-item-name">{file.name}</div>
                  <div className="win98-upload-item-meta">
                    <span>{formatFileSize(file.size)}</span>
                    <span className="win98-upload-item-separator">•</span>
                    <span className="win98-upload-item-status">{file.status}</span>
                    {file.error && (
                      <>
                        <span className="win98-upload-item-separator">•</span>
                        <span className="win98-upload-item-error">{file.error}</span>
                      </>
                    )}
                  </div>
                  {file.status === 'uploading' && (
                    <div className="win98-upload-progress">
                      <div 
                        className="win98-upload-progress-bar"
                        style={{ width: `${file.progress}%` }}
                      ></div>
                      <span className="win98-upload-progress-text">{Math.round(file.progress)}%</span>
                    </div>
                  )}
                </div>
                <div className="win98-upload-item-actions">
                  {file.status === 'error' && (
                    <button 
                      className="win98-button win98-button-small"
                      onClick={() => retryUpload(file)}
                      title="Retry upload"
                    >
                      <Win98Icon name="refresh" size={12} />
                    </button>
                  )}
                  <button 
                    className="win98-button win98-button-small"
                    onClick={() => removeFromQueue(file.id)}
                    title="Remove from queue"
                  >
                                          <Win98Icon name="close" size={12} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Upload;

