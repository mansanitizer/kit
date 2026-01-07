"use client";

import React from 'react';
import { DesktopIcon } from '../shared/types';
import Win98Icon from '../Common/Win98Icon';
import './Desktop.css';

interface DesktopProps {
  icons: DesktopIcon[];
  onIconClick: (iconId: string) => void;
  onIconSelect: (iconId: string) => void;
  selectedIconIds: string[];
}

const Desktop: React.FC<DesktopProps> = ({ icons, onIconClick, onIconSelect, selectedIconIds }) => {
  const handleIconClick = (e: React.MouseEvent, iconId: string) => {
    e.stopPropagation();
    onIconSelect(iconId); // Single click selects
  };

  const handleIconDoubleClick = (e: React.MouseEvent, iconId: string) => {
    e.stopPropagation();
    onIconClick(iconId); // Double click executes action
  };

  const handleDesktopClick = () => {
    onIconSelect(''); // Deselect all
  };

  return (
    <div className="win98-desktop" onClick={handleDesktopClick}>
      {icons.map((icon) => (
        <div
          key={icon.id}
          className={`win98-desktop-icon ${selectedIconIds.includes(icon.id) ? 'selected' : ''}`}
          style={{
            position: 'absolute',
            left: icon.position.x,
            top: icon.position.y,
          }}
          onClick={(e) => handleIconClick(e, icon.id)}
          onDoubleClick={(e) => handleIconDoubleClick(e, icon.id)}
        >
          <div className="win98-desktop-icon-image">
            <Win98Icon name={icon.icon} size={32} />
          </div>
          <span className="win98-desktop-icon-label">{icon.title}</span>
        </div>
      ))}

      {/* Branding / Watermark if desired */}
      <div className="absolute bottom-10 right-4 text-white/20 text-4xl font-bold select-none pointer-events-none">
        Kit98
      </div>
    </div>
  );
};

export default Desktop;
