import React, { useState, useEffect } from 'react';
import './Settings.css';

interface SettingsProps {
  onClose: () => void;
}

interface AppSettings {
  fileOpsServer: string;
  autoConnect: boolean;
  defaultSearchLimit: number;
  enableNotifications: boolean;
  theme: 'win98' | 'modern';
  language: string;
  autoSave: boolean;
  maxUploadSize: number;
  enableDragDrop: boolean;
  showFileExtensions: boolean;
}

const Settings: React.FC<SettingsProps> = ({ onClose }) => {
  const [settings, setSettings] = useState<AppSettings>({
    fileOpsServer: 'http://localhost:3001',
    autoConnect: true,
    defaultSearchLimit: 10,
    enableNotifications: true,
    theme: 'win98',
    language: 'en',
    autoSave: true,
    maxUploadSize: 100,
    enableDragDrop: true,
    showFileExtensions: true,
  });

  const [activeTab, setActiveTab] = useState<'general' | 'fileops' | 'appearance' | 'advanced'>('general');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      if (window.electronAPI) {
        const savedSettings = await window.electronAPI.settings.get();
        if (savedSettings) {
          setSettings(prev => ({ ...prev, ...savedSettings }));
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      if (window.electronAPI) {
        await window.electronAPI.settings.save(settings);
        console.log('Settings saved successfully');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSettingChange = (key: keyof AppSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const testConnection = async () => {
    try {
      if (window.electronAPI) {
        const isConnected = await window.electronAPI.fileops.testConnection();
        if (isConnected) {
          alert('Connection successful!');
        } else {
          alert('Connection failed. Please check the server URL.');
        }
      }
    } catch (error) {
      alert('Connection test failed: ' + error);
    }
  };

  const resetToDefaults = () => {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      setSettings({
        fileOpsServer: 'http://localhost:3001',
        autoConnect: true,
        defaultSearchLimit: 10,
        enableNotifications: true,
        theme: 'win98',
        language: 'en',
        autoSave: true,
        maxUploadSize: 100,
        enableDragDrop: true,
        showFileExtensions: true,
      });
    }
  };

  return (
    <div className="win98-settings">
      {/* Settings Tabs */}
      <div className="win98-settings-tabs">
        <button
          className={`win98-settings-tab ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          General
        </button>
        <button
          className={`win98-settings-tab ${activeTab === 'fileops' ? 'active' : ''}`}
          onClick={() => setActiveTab('fileops')}
        >
          FileOps
        </button>
        <button
          className={`win98-settings-tab ${activeTab === 'appearance' ? 'active' : ''}`}
          onClick={() => setActiveTab('appearance')}
        >
          Appearance
        </button>
        <button
          className={`win98-settings-tab ${activeTab === 'advanced' ? 'active' : ''}`}
          onClick={() => setActiveTab('advanced')}
        >
          Advanced
        </button>
      </div>

      {/* Settings Content */}
      <div className="win98-settings-content">
        {activeTab === 'general' && (
          <div className="win98-settings-section">
            <h3>General Settings</h3>
            
            <div className="win98-setting-group">
              <label className="win98-setting-label">Language:</label>
              <select
                className="win98-setting-select"
                value={settings.language}
                onChange={(e) => handleSettingChange('language', e.target.value)}
              >
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
              </select>
            </div>

            <div className="win98-setting-group">
              <label className="win98-checkbox">
                <input
                  type="checkbox"
                  checked={settings.enableNotifications}
                  onChange={(e) => handleSettingChange('enableNotifications', e.target.checked)}
                />
                <span className="win98-checkbox-label">Enable notifications</span>
              </label>
            </div>

            <div className="win98-setting-group">
              <label className="win98-checkbox">
                <input
                  type="checkbox"
                  checked={settings.autoSave}
                  onChange={(e) => handleSettingChange('autoSave', e.target.checked)}
                />
                <span className="win98-checkbox-label">Auto-save settings</span>
              </label>
            </div>
          </div>
        )}

        {activeTab === 'fileops' && (
          <div className="win98-settings-section">
            <h3>FileOps Configuration</h3>
            
            <div className="win98-setting-group">
              <label className="win98-setting-label">FileOps Server URL:</label>
              <div className="win98-setting-input-group">
                <input
                  type="text"
                  className="win98-setting-input"
                  value={settings.fileOpsServer}
                  onChange={(e) => handleSettingChange('fileOpsServer', e.target.value)}
                  placeholder="http://localhost:3001"
                />
                <button className="win98-button" onClick={testConnection}>
                  Test
                </button>
              </div>
            </div>

            <div className="win98-setting-group">
              <label className="win98-checkbox">
                <input
                  type="checkbox"
                  checked={settings.autoConnect}
                  onChange={(e) => handleSettingChange('autoConnect', e.target.checked)}
                />
                <span className="win98-checkbox-label">Auto-connect to FileOps server</span>
              </label>
            </div>

            <div className="win98-setting-group">
              <label className="win98-setting-label">Default search limit:</label>
              <input
                type="number"
                className="win98-setting-input"
                value={settings.defaultSearchLimit}
                onChange={(e) => handleSettingChange('defaultSearchLimit', parseInt(e.target.value))}
                min="1"
                max="100"
              />
            </div>

            <div className="win98-setting-group">
              <label className="win98-setting-label">Max upload size (MB):</label>
              <input
                type="number"
                className="win98-setting-input"
                value={settings.maxUploadSize}
                onChange={(e) => handleSettingChange('maxUploadSize', parseInt(e.target.value))}
                min="1"
                max="1000"
              />
            </div>
          </div>
        )}

        {activeTab === 'appearance' && (
          <div className="win98-settings-section">
            <h3>Appearance Settings</h3>
            
            <div className="win98-setting-group">
              <label className="win98-setting-label">Theme:</label>
              <select
                className="win98-setting-select"
                value={settings.theme}
                onChange={(e) => handleSettingChange('theme', e.target.value)}
              >
                <option value="win98">Windows 98</option>
                <option value="modern">Modern</option>
              </select>
            </div>

            <div className="win98-setting-group">
              <label className="win98-checkbox">
                <input
                  type="checkbox"
                  checked={settings.showFileExtensions}
                  onChange={(e) => handleSettingChange('showFileExtensions', e.target.checked)}
                />
                <span className="win98-checkbox-label">Show file extensions</span>
              </label>
            </div>

            <div className="win98-setting-group">
              <label className="win98-checkbox">
                <input
                  type="checkbox"
                  checked={settings.enableDragDrop}
                  onChange={(e) => handleSettingChange('enableDragDrop', e.target.checked)}
                />
                <span className="win98-checkbox-label">Enable drag and drop</span>
              </label>
            </div>
          </div>
        )}

        {activeTab === 'advanced' && (
          <div className="win98-settings-section">
            <h3>Advanced Settings</h3>
            
            <div className="win98-setting-group">
              <label className="win98-setting-label">Debug Mode:</label>
              <label className="win98-checkbox">
                <input
                  type="checkbox"
                  checked={process.env.NODE_ENV === 'development'}
                  disabled
                />
                <span className="win98-checkbox-label">Development mode</span>
              </label>
            </div>

            <div className="win98-setting-group">
              <button className="win98-button win98-button-warning" onClick={resetToDefaults}>
                Reset to Defaults
              </button>
            </div>

            <div className="win98-setting-group">
              <button className="win98-button" onClick={() => window.electronAPI?.openDevTools()}>
                Open Developer Tools
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Settings Actions */}
      <div className="win98-settings-actions">
        <button className="win98-button" onClick={saveSettings} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save'}
        </button>
        <button className="win98-button" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
};

export default Settings;
