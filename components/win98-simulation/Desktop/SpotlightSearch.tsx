
import React, { useState, useEffect, useRef } from 'react';
import { Tool } from '../shared/types';
import Win98Icon from '../Common/Win98Icon';
import './SpotlightSearch.css';

interface SpotlightSearchProps {
    isOpen: boolean;
    onClose: () => void;
    tools: Tool[];
    onLaunchTool: (tool: Tool) => void;
}

const SpotlightSearch: React.FC<SpotlightSearchProps> = ({ isOpen, onClose, tools, onLaunchTool }) => {
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    // Filter tools based on query
    const filteredTools = tools.filter(tool =>
        tool.name.toLowerCase().includes(query.toLowerCase()) ||
        tool.description.toLowerCase().includes(query.toLowerCase()) ||
        tool.slug.toLowerCase().includes(query.toLowerCase())
    );

    // Reset selection when query changes
    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
            setQuery(''); // Reset query on open
        }
    }, [isOpen]);

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % filteredTools.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + filteredTools.length) % filteredTools.length);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredTools[selectedIndex]) {
                onLaunchTool(filteredTools[selectedIndex]);
                onClose();
            }
        } else if (e.key === 'Escape') {
            e.preventDefault();
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="win98-spotlight-overlay" onClick={onClose}>
            <div className="win98-spotlight-container" onClick={e => e.stopPropagation()}>
                <div className="win98-spotlight-bar">
                    <div className="win98-spotlight-icon">
                        <Win98Icon name="search" size={20} />
                    </div>
                    <input
                        ref={inputRef}
                        type="text"
                        className="win98-spotlight-input"
                        placeholder="Type to search tools..."
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        autoFocus
                    />
                    <div className="win98-spotlight-hint">
                        9+8
                    </div>
                </div>

                {filteredTools.length > 0 && (
                    <div className="win98-spotlight-results">
                        {filteredTools.map((tool, index) => (
                            <div
                                key={tool.slug}
                                className={`win98-spotlight-item ${index === selectedIndex ? 'selected' : ''}`}
                                onClick={() => {
                                    onLaunchTool(tool);
                                    onClose();
                                }}
                                onMouseEnter={() => setSelectedIndex(index)}
                            >
                                <div className="win98-spotlight-item-icon">
                                    <Win98Icon name={tool.icon || 'settings'} size={16} />
                                </div>
                                <div className="win98-spotlight-item-content">
                                    <div className="win98-spotlight-item-title">{tool.name}</div>
                                    <div className="win98-spotlight-item-desc">{tool.description}</div>
                                </div>
                                {index === selectedIndex && (
                                    <div className="win98-spotlight-item-enter">↵</div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {filteredTools.length === 0 && query && (
                    <div className="win98-spotlight-empty">
                        No tools found for "{query}"
                    </div>
                )}
            </div>
        </div>
    );
};

export default SpotlightSearch;
