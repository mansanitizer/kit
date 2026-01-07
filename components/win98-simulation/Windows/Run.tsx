import React, { useState } from 'react';
import './Run.css';

interface RunProps {
  onClose: () => void;
}

const Run: React.FC<RunProps> = ({ onClose }) => {
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState<string[]>([
    'fileops://search',
    'fileops://upload',
    'fileops://settings',
    'fileops://help',
  ]);

  const handleRun = async () => {
    if (!command.trim()) return;

    // Add to history if not already there
    if (!history.includes(command)) {
      setHistory(prev => [command, ...prev.slice(0, 9)]); // Keep last 10 commands
    }

    try {
      // Parse command and execute
      if (command.startsWith('fileops://')) {
        const action = command.replace('fileops://', '');
        await executeFileOpsAction(action);
      } else if (command.startsWith('http://') || command.startsWith('https://')) {
        // Open URL in default browser
        if (window.electronAPI) {
          await window.electronAPI.openExternal(command);
        }
      } else {
        // Try to execute as a system command
        await executeSystemCommand(command);
      }

      onClose();
    } catch (error) {
      console.error('Run command error:', error);
      alert(`Error executing command: ${error}`);
    }
  };

  const executeFileOpsAction = async (action: string) => {
    switch (action.toLowerCase()) {
      case 'search':
        // Open search window
        window.dispatchEvent(new CustomEvent('window:open', { detail: { type: 'search' } }));
        break;
      case 'upload':
        // Open upload window
        window.dispatchEvent(new CustomEvent('window:open', { detail: { type: 'upload' } }));
        break;
      case 'files':
      case 'filemanager':
        // Open file manager
        window.dispatchEvent(new CustomEvent('window:open', { detail: { type: 'fileManager' } }));
        break;
      case 'settings':
        // Open settings window
        window.dispatchEvent(new CustomEvent('window:open', { detail: { type: 'settings' } }));
        break;
      case 'help':
        // Open help window
        window.dispatchEvent(new CustomEvent('window:open', { detail: { type: 'help' } }));
        break;
      case 'stats':
        // Show FileOps stats
        if (window.electronAPI?.fileops?.getStats) {
          try {
            const stats = await window.electronAPI.fileops.getStats();
            const statsInfo = `
FileOps System Statistics:
- Total Files: ${stats.totalFiles}
- Total Size: ${stats.totalSize}
- Categories: ${Object.entries(stats.categories).map(([cat, count]) => `${cat}: ${count}`).join(', ')}
- Recent Uploads: ${stats.recentUploads}
- Search Queries: ${stats.searchQueries}
- System Health: ${stats.systemHealth}
- Last Indexed: ${new Date(stats.lastIndexed).toLocaleString()}
            `;
            alert(statsInfo);
          } catch (error) {
            alert(`Failed to get stats: ${error}`);
          }
        }
        break;
      case 'about':
        // Open about dialog
        window.dispatchEvent(new CustomEvent('window:open', { detail: { type: 'about' } }));
        break;
      default:
        throw new Error(`Unknown FileOps action: ${action}`);
    }
  };

  const executeSystemCommand = async (cmd: string) => {
    const command = cmd.toLowerCase();
    
    // Handle common system commands
    switch (command) {
      case 'calc':
      case 'calculator':
        alert('Calculator\n\nIn a real application, this would open the Windows calculator.');
        break;
      case 'notepad':
        alert('Notepad\n\nIn a real application, this would open the Windows notepad.');
        break;
      case 'paint':
        alert('Paint\n\nIn a real application, this would open the Windows paint application.');
        break;
      case 'cmd':
      case 'command':
      case 'command prompt':
        alert('Command Prompt\n\nIn a real application, this would open the Windows command prompt.');
        break;
      case 'explorer':
        alert('File Explorer\n\nIn a real application, this would open the Windows file explorer.');
        break;
      case 'control':
      case 'control panel':
        alert('Control Panel\n\nIn a real application, this would open the Windows control panel.');
        break;
      default:
        alert(`System command: ${cmd}\n\nIn a real application, this would execute the system command.`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRun();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const selectHistoryItem = (item: string) => {
    setCommand(item);
  };

  return (
    <div className="win98-run">
      <div className="win98-run-header">
        <h3>Run</h3>
        <p>Type the name of a program, folder, document, or Internet resource, and Windows will open it for you.</p>
      </div>

      <div className="win98-run-content">
        <div className="win98-run-input-group">
          <label className="win98-run-label">Open:</label>
          <input
            type="text"
            className="win98-run-input"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter command or URL..."
            autoFocus
          />
        </div>

        {history.length > 0 && (
          <div className="win98-run-history">
            <label className="win98-run-label">Recent commands:</label>
            <div className="win98-run-history-list">
              {history.map((item, index) => (
                <button
                  key={index}
                  className="win98-run-history-item"
                  onClick={() => selectHistoryItem(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="win98-run-help">
          <h4>Examples:</h4>
          <ul>
            <li><strong>fileops://search</strong> - Open FileOps search</li>
            <li><strong>fileops://upload</strong> - Open FileOps upload</li>
            <li><strong>fileops://files</strong> - Open FileOps file manager</li>
            <li><strong>fileops://settings</strong> - Open FileOps settings</li>
            <li><strong>fileops://help</strong> - Open FileOps help</li>
            <li><strong>fileops://stats</strong> - Show FileOps statistics</li>
            <li><strong>fileops://about</strong> - Show about dialog</li>
            <li><strong>https://example.com</strong> - Open website</li>
            <li><strong>calc</strong> - Open calculator</li>
            <li><strong>notepad</strong> - Open notepad</li>
            <li><strong>paint</strong> - Open paint</li>
            <li><strong>cmd</strong> - Open command prompt</li>
          </ul>
        </div>
      </div>

      <div className="win98-run-actions">
        <button className="win98-button" onClick={handleRun}>
          OK
        </button>
        <button className="win98-button" onClick={onClose}>
          Cancel
        </button>
        <button className="win98-button" onClick={() => setHistory([])}>
          Clear History
        </button>
      </div>
    </div>
  );
};

export default Run;
