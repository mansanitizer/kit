"use client";

import React, { ReactNode } from 'react';
import Win98Icon from './Win98Icon';
import '../styles/win98.css';

interface Win98WindowFrameProps {
    title: string;
    icon: string;
    isActive: boolean;
    onClose: () => void;
    onMinimize: () => void;
    onMaximize: () => void; // Optional if we don't fully support max yet
    onFocus: () => void;
    onMouseDown: (e: React.MouseEvent) => void; // For dragging
    position: { x: number; y: number };
    size: { width: number; height: number }; // Or auto
    zIndex: number;
    children: ReactNode;
    style?: React.CSSProperties;
}

const Win98WindowFrame: React.FC<Win98WindowFrameProps> = ({
    title,
    icon,
    isActive,
    onClose,
    onMinimize,
    onMaximize,
    onFocus,
    onMouseDown,
    position,
    size,
    zIndex,
    children,
    style,
}) => {
    return (
        <div
            className={`win98-window ${isActive ? 'active' : ''}`}
            style={{
                position: 'absolute',
                left: position.x,
                top: position.y,
                width: size.width,
                height: size.height,
                zIndex: zIndex,
                display: 'flex',
                flexDirection: 'column',
                ...style,
            }}
            onMouseDown={(e) => {
                onFocus();
                onMouseDown(e); // Pass validation to parent for drag start
            }}
        >
            <div className="win98-window-titlebar">
                <div className="win98-window-title">
                    <Win98Icon name={icon} size={16} />
                    <span style={{ marginLeft: 8 }}>{title}</span>
                </div>
                <div className="win98-window-controls">
                    <button className="win98-window-button" onClick={(e) => { e.stopPropagation(); onMinimize(); }} aria-label="Minimize">
                        _
                    </button>
                    <button className="win98-window-button" onClick={(e) => { e.stopPropagation(); onMaximize(); }} aria-label="Maximize">
                        □
                    </button>
                    <button className="win98-window-button close" onClick={(e) => { e.stopPropagation(); onClose(); }} aria-label="Close">
                        ×
                    </button>
                </div>
            </div>
            <div className="win98-window-body" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {children}
            </div>
        </div>
    );
};

export default Win98WindowFrame;
