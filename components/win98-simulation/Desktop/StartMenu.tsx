"use client";

import React from 'react';
import Win98Icon from '../Common/Win98Icon';
import './StartMenu.css';

interface StartMenuProps {
  onClose: () => void;
  onMenuItemClick: (action: string) => void;
}

const StartMenu: React.FC<StartMenuProps> = ({ onClose, onMenuItemClick }) => {
  const handleMenuItemClick = (action: string) => {
    onMenuItemClick(action);
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div className="win98-start-menu-overlay" onClick={onClose}>
      <div className="win98-start-menu" onClick={handleMenuClick}>
        {/* Kit98 / Windows 98 Logo Sidebar */}
        <div className="win98-start-menu-sidebar">
          <div className="win98-start-menu-logo">
            <span className="win98-start-menu-logo-text">Kit98</span>
            {/* Or "Windows98" if we want pure nostalgia, but let's brand it slightly */}
          </div>
        </div>

        {/* Main Menu Items */}
        <div className="win98-start-menu-content">
          {/* Programs */}
          <div className="win98-menu-section">
            <div className="win98-menu-item">
              <span className="win98-menu-icon">
                <Win98Icon name="folder" size={24} />
              </span>
              <span className="font-bold">Programs</span>
              <span className="win98-menu-arrow">▶</span>

              {/* Programs Submenu */}
              <div className="win98-submenu">
                <div className="win98-menu-item" onClick={() => handleMenuItemClick('tools-folder')}>
                  <span className="win98-menu-icon">
                    <Win98Icon name="folder" size={16} />
                  </span>
                  <span>Kit Tools</span>
                </div>
              </div>
            </div>

            {/* Documents */}
            <div className="win98-menu-item" onClick={() => handleMenuItemClick('documents')}>
              <span className="win98-menu-icon">
                <Win98Icon name="folder" size={24} />
              </span>
              <span className="font-bold">Documents</span>
            </div>

            {/* Settings */}
            <div className="win98-menu-item" onClick={() => handleMenuItemClick('settings')}>
              <span className="win98-menu-icon">
                <Win98Icon name="settings" size={24} />
              </span>
              <span className="font-bold">Settings</span>
            </div>

            {/* Find */}
            <div className="win98-menu-item" onClick={() => handleMenuItemClick('find')}>
              <span className="win98-menu-icon">
                <Win98Icon name="search" size={24} />
              </span>
              <span className="font-bold">Find</span>
            </div>

            {/* Help */}
            <div className="win98-menu-item" onClick={() => handleMenuItemClick('help')}>
              <span className="win98-menu-icon">
                <Win98Icon name="help" size={24} />
              </span>
              <span className="font-bold">Help</span>
            </div>
          </div>

          <div className="win98-separator" />

          {/* System Actions */}
          <div className="win98-menu-section">
            <div className="win98-menu-item" onClick={() => handleMenuItemClick('logout')}>
              <span className="win98-menu-icon">
                <Win98Icon name="logout" size={24} />
              </span>
              <span className="font-bold">Log Off User...</span>
            </div>
            <div className="win98-menu-item" onClick={() => handleMenuItemClick('shutdown')}>
              <span className="win98-menu-icon">
                <Win98Icon name="shutdown" size={24} />
              </span>
              <span className="font-bold">Shut Down...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StartMenu;
