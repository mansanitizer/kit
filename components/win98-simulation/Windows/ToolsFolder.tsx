"use client";

import React from 'react';
import { Tool } from '../shared/types';
import Win98Icon from '../Common/Win98Icon';
import '../styles/win98.css';

interface ToolsFolderProps {
    tools: Tool[];
    onToolOpen: (tool: Tool) => void;
    onClose: () => void;
    onFocus: () => void;
    isActive: boolean;
}

export const ToolsFolder: React.FC<ToolsFolderProps> = ({
    tools,
    onToolOpen,
    onClose,
    onFocus,
    isActive
}) => {
    return (
        <div className="h-full flex flex-col bg-[#ffffff] text-black" onClick={onFocus}>
            {/* Menu Bar */}
            <div className="win98-menubar bg-[#c0c0c0]">
                <div className="win98-menubar-item">File</div>
                <div className="win98-menubar-item">Edit</div>
                <div className="win98-menubar-item">View</div>
                <div className="win98-menubar-item">Help</div>
            </div>

            {/* Toolbar (Optional - simplified for folder) */}
            <div className="win98-toolbar bg-[#c0c0c0]">
                <div className="text-xs px-2">Address</div>
                <div className="win98-input w-full bg-white text-black text-xs px-1 border-2 border-gray-400 border-inset">
                    C:\Kit\Tools
                </div>
            </div>

            {/* Main Content Area - Grid of Icons */}
            <div className="flex-1 overflow-auto p-4 content-start grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-4">
                {tools.map(tool => (
                    <div
                        key={tool.slug}
                        className="flex flex-col items-center justify-start cursor-pointer hover:bg-blue-100/50 p-2 rounded group"
                        onDoubleClick={() => onToolOpen(tool)}
                    >
                        <div className="mb-1">
                            {/* Use dynamic icon mapping if possible, or generic tool icon */}
                            <Win98Icon name={tool.icon || "settings"} size={32} />
                        </div>
                        <span className="text-xs text-center line-clamp-2 w-full break-words group-hover:text-blue-800">
                            {tool.name}
                        </span>
                    </div>
                ))}

                {tools.length === 0 && (
                    <div className="col-span-full flex items-center justify-center text-gray-400 p-8">
                        No tools found.
                    </div>
                )}
            </div>

            {/* Status Bar */}
            <div className="win98-statusbar bg-[#c0c0c0]">
                <div className="flex-1">
                    {tools.length} object(s)
                </div>
            </div>
        </div>
    );
};
