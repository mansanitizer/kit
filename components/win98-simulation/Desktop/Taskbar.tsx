import React, { useState, useEffect } from 'react';
import { TaskbarItem } from '../shared/types';
import './Taskbar.css';
import { ColorPalette } from './ColorPalette';

interface TaskbarProps {
  items: TaskbarItem[];
  onStartClick: () => void;
  onItemClick: (itemId: string) => void;
  startMenuOpen: boolean;
  onColorSelect: (color: string) => void;
}

const Taskbar: React.FC<TaskbarProps> = ({ items, onStartClick, onItemClick, startMenuOpen, onColorSelect }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showPalette, setShowPalette] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="win98-taskbar select-none">
      {/* Start Button */}
      <button
        className={`win98-start-button ${startMenuOpen ? 'active' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          onStartClick();
        }}
      >
        <span className="win98-start-icon">🪟</span>
        <span>Start</span>
      </button>

      {/* Taskbar Items */}
      <div className="win98-taskbar-items">
        {items.map((item) => (
          <button
            key={item.id}
            className={`win98-taskbar-item ${item.isActive ? 'active' : ''}`}
            onClick={() => onItemClick(item.id)}
          >
            <span className="win98-taskbar-item-icon">{item.icon}</span>
            <span className="win98-taskbar-item-title">{item.title}</span>
          </button>
        ))}
      </div>

      {/* System Tray */}
      <div className="win98-system-tray">
        <div
          className="win98-tray-icon cursor-pointer hover:bg-gray-300 p-0.5"
          title="Theme Color"
          onClick={() => setShowPalette(!showPalette)}
        >
          🎨
        </div>
        <div className="win98-tray-icon" title="Volume">
          🔊
        </div>

        <div className="win98-clock">
          {formatTime(currentTime)}
        </div>
      </div>

      {showPalette && (
        <ColorPalette
          onSelect={(c) => {
            onColorSelect(c);
            setShowPalette(false);
          }}
          onClose={() => setShowPalette(false)}
        />
      )}
    </div>
  );
};

export default Taskbar;
