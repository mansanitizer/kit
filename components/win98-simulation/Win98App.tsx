"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, WindowState, DesktopIcon, TaskbarItem, Tool } from './shared/types';
import Desktop from './Desktop/Desktop';
import Taskbar from './Desktop/Taskbar';
import StartMenu from './Desktop/StartMenu';
import Win98WindowFrame from './Common/Win98WindowFrame';
import { Win98ToolWindow } from './Windows/Win98ToolWindow';
import { ToolsFolder } from './Windows/ToolsFolder';
import { HistoryViewer } from './Windows/HistoryViewer';
import { RecycleBinWindow } from './Windows/RecycleBinWindow';
import { MyComputerWindow } from './Windows/MyComputerWindow';
import { AboutMeWindow } from './Windows/AboutMeWindow';
import { BrainWindow } from './Windows/BrainWindow';
import WelcomeWindow from './Windows/WelcomeWindow';
import Settings from './Windows/Settings';
import SpotlightSearch from './Desktop/SpotlightSearch';
import { getAllTools } from '@/lib/tool-registry';

import './styles/win98.css';

interface Win98AppProps {
    initialTutorialContent?: string;
}

const Win98App: React.FC<Win98AppProps> = ({ initialTutorialContent }) => {
    // State
    const [tools, setTools] = useState<Tool[]>([]);
    const [openWindows, setOpenWindows] = useState<WindowState[]>([]);
    const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
    const [startMenuOpen, setStartMenuOpen] = useState(false);
    const [minimizedWindows, setMinimizedWindows] = useState<string[]>([]);
    const [desktopIcons, setDesktopIcons] = useState<DesktopIcon[]>([]);
    const [selectedIconIds, setSelectedIconIds] = useState<string[]>([]);

    // Spotlight State
    const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);
    const pressedKeys = useRef<Set<string>>(new Set());

    // Session State
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [wallpaper, setWallpaper] = useState<string | null>(null);

    // Load Session
    useEffect(() => {
        const loadSession = () => {
            let id = localStorage.getItem('kit_session_id');
            if (!id) {
                id = crypto.randomUUID();
                localStorage.setItem('kit_session_id', id);
            }
            setSessionId(id);
        };
        loadSession();
    }, []);

    // Dragging state
    const dragRef = useRef<{ id: string, startX: number, startY: number, initialX: number, initialY: number } | null>(null);

    // Load tools on mount and when session changes
    // Load wallpaper
    const fetchWallpaper = useCallback(async () => {
        if (!sessionId) return;
        console.log("Fetching wallpaper for session:", sessionId);
        try {
            // Add timestamp to prevent caching
            const res = await fetch(`/api/wallpaper?userId=${sessionId}&t=${Date.now()}`);
            if (res.ok) {
                const data = await res.json();
                console.log("Wallpaper data received:", data.wallpaper_data ? "Yes" : "No");
                if (data.wallpaper_data) {
                    setWallpaper(data.wallpaper_data);
                }
            }
        } catch (e) {
            console.error("Failed to load wallpaper", e);
        }
    }, [sessionId]);

    useEffect(() => {
        // Load tools
        if (sessionId) {
            const fetchTools = async () => {
                try {
                    const _tools = await getAllTools(sessionId);
                    setTools(_tools);
                } catch (e) {
                    console.error("Failed to fetch tools", e);
                }
            };
            fetchTools();
        }

        // Load wallpaper
        fetchWallpaper();

        // Keep event listener for fallback/other windows
        const handleUpdate = () => {
            console.log("Wallpaper update event received");
            fetchWallpaper();
        };
        window.addEventListener('wallpaper-updated', handleUpdate);
        return () => window.removeEventListener('wallpaper-updated', handleUpdate);
    }, [sessionId, fetchWallpaper]);

    // Keyboard Chord Listener for Spotlight (9+8)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            pressedKeys.current.add(e.key);

            // Check for 9+8 chord
            if (pressedKeys.current.has('9') && pressedKeys.current.has('8')) {
                setIsSpotlightOpen(true);
            }

            if (e.key === 'Escape') {
                setIsSpotlightOpen(false);
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            pressedKeys.current.delete(e.key);
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);


    const openMyComputer = () => {
        openWindow({
            id: 'my-computer-window',
            title: 'My Computer',
            type: 'my-computer',
            icon: 'computer',
            size: { width: 700, height: 500 }
        });
    };

    // Initialize Desktop Icons
    useEffect(() => {
        const icons: DesktopIcon[] = [
            {
                id: 'my-computer',
                title: 'My Computer',
                icon: 'computer',
                position: { x: 20, y: 20 },
                type: 'system',
                action: () => openMyComputer(),
            },
            {
                id: 'tools-folder',
                title: 'Kit Tools',
                icon: 'toolbox',
                position: { x: 20, y: 120 },
                type: 'folder',
                action: () => openToolsFolder(),
            },
            {
                id: 'history-viewer',
                title: 'History',
                icon: 'history', // Make sure this icon maps to something or use generic
                position: { x: 20, y: 220 },
                type: 'folder', // It's an app but type property on DesktopIcon is loosely used
                action: () => openHistoryViewer(),
            },
            {
                id: 'recycle-bin',
                title: 'Recycle Bin',
                icon: 'recycle-bin',
                position: { x: 20, y: 320 },
                type: 'system',
                action: () => openWindow({
                    id: 'recycle-bin-window',
                    title: 'Recycle Bin',
                    type: 'recycle-bin',
                    icon: 'recycle-bin',
                    size: { width: 600, height: 400 }
                }),
            },
            {
                id: 'about-me',
                title: 'About Me',
                icon: 'info', // Map 'info' to Info icon in Win98Icon
                position: { x: 20, y: 420 },
                type: 'about-me',
                action: () => openAboutMe(),
            },
            {
                id: 'brain',
                title: 'My Brain',
                icon: 'brain', // Need to support this in Win98Icon? Or use fallback
                position: { x: 20, y: 520 },
                type: 'brain',
                action: () => openBrain(),
            },
            {
                id: 'welcome',
                title: 'Welcome to Kit',
                icon: 'book-open',
                position: { x: 100, y: 220 },
                type: 'welcome',
                action: () => openWelcome(),
            }
        ];

        // Add Tool Maker if found
        const toolForge = tools.find(t => t.slug === 'tool-forge');
        if (toolForge) {
            icons.push({
                id: 'tool-forge',
                title: 'Tool Maker',
                icon: 'hammer',
                position: { x: 100, y: 20 },
                type: 'tool',
                action: () => openTool(toolForge)
            });
        }

        // Add Settings
        icons.push({
            id: 'settings',
            title: 'Settings',
            icon: 'settings',
            position: { x: 100, y: 120 },
            type: 'system',
            action: () => openSettings()
        });

        setDesktopIcons(icons);
    }, [tools]);

    // Window Management
    const openWindow = (windowDetails: Partial<WindowState> & { id: string, title: string, type: 'tool' | 'folder' | 'system' | 'history' | 'recycle-bin' | 'my-computer' | 'about-me' | 'brain' | 'settings' | 'welcome' }) => {
        setOpenWindows(prev => {
            const existing = prev.find(w => w.id === windowDetails.id);
            if (existing) {
                // Bring to front and restore if minimized
                setActiveWindowId(existing.id);
                setMinimizedWindows(prevMin => prevMin.filter(id => id !== existing.id));
                return prev.map(w => w.id === windowDetails.id ? { ...w, zIndex: getNextZIndex() } : w);
            }

            const newWindow: WindowState = {
                isOpen: true,
                isMinimized: false,
                isMaximized: false,
                position: { x: 100 + (prev.length * 20), y: 100 + (prev.length * 20) },
                size: { width: 600, height: 400 },
                zIndex: getNextZIndex(),
                isFocused: true,
                ...windowDetails
            };

            setActiveWindowId(newWindow.id);
            return [...prev, newWindow];
        });
    };

    const closeWindow = (id: string) => {
        setOpenWindows(prev => prev.filter(w => w.id !== id));
        if (activeWindowId === id) {
            setActiveWindowId(null);
        }
    };

    const openToolsFolder = () => {
        openWindow({
            id: 'tools-folder-window',
            title: 'Kit Tools',
            type: 'folder',
            icon: 'folder',
            size: { width: 500, height: 400 }
        });
    };

    const openHistoryViewer = () => {
        openWindow({
            id: 'history-viewer-window',
            title: 'History Viewer',
            type: 'history',
            icon: 'history', // Make sure to handle this icon in Win98WindowFrame if needed or fallback
            size: { width: 800, height: 600 }
        });
    };

    const openAboutMe = () => {
        openWindow({
            id: 'about-me-window',
            title: 'About Me',
            type: 'about-me',
            icon: 'info',
            size: { width: 600, height: 500 }
        });
    };

    const openSettings = () => {
        openWindow({
            id: 'settings-window',
            title: 'Settings',
            type: 'settings',
            icon: 'settings',
            size: { width: 600, height: 500 }
        });
    };

    const openBrain = () => {
        openWindow({
            id: 'brain-window',
            title: 'My Brain',
            type: 'brain',
            icon: 'brain', // Needs support
            size: { width: 500, height: 600 }
        });
    };

    const openWelcome = () => {
        openWindow({
            id: 'welcome-window',
            title: 'Welcome to Kit',
            type: 'welcome',
            icon: 'book-open',
            size: { width: 600, height: 500 },
            data: { content: initialTutorialContent }
        });
    };

    const openTool = (tool: Tool) => {
        openWindow({
            id: `tool-${tool.slug}`,
            title: tool.name,
            type: 'tool',
            icon: tool.icon || 'settings', // Fallback icon
            data: tool
        });
    };

    const getNextZIndex = () => {
        const maxZ = Math.max(0, ...openWindows.map(w => w.zIndex));
        return maxZ + 1;
    };

    const bringToFront = (id: string) => {
        setOpenWindows(prev => prev.map(w =>
            w.id === id ? { ...w, zIndex: getNextZIndex(), isFocused: true } : { ...w, isFocused: false }
        ));
        setActiveWindowId(id);
        setMinimizedWindows(prev => prev.filter(minId => minId !== id));
    };

    // Drag handling
    const handleDragStart = (e: React.MouseEvent, id: string) => {
        const windowState = openWindows.find(w => w.id === id);
        if (!windowState) return;

        dragRef.current = {
            id,
            startX: e.clientX,
            startY: e.clientY,
            initialX: windowState.position.x,
            initialY: windowState.position.y
        };

        bringToFront(id);
    };

    const handleDragMove = useCallback((e: MouseEvent) => {
        if (!dragRef.current) return;

        const { id, startX, startY, initialX, initialY } = dragRef.current;
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;

        setOpenWindows(prev => prev.map(w =>
            w.id === id ? { ...w, position: { x: initialX + deltaX, y: initialY + deltaY } } : w
        ));
    }, []);

    const handleDragEnd = useCallback(() => {
        dragRef.current = null;
    }, []);

    useEffect(() => {
        window.addEventListener('mousemove', handleDragMove);
        window.addEventListener('mouseup', handleDragEnd);
        return () => {
            window.removeEventListener('mousemove', handleDragMove);
            window.removeEventListener('mouseup', handleDragEnd);
        };
    }, [handleDragMove, handleDragEnd]);

    // Taskbar helpers
    const getTaskbarItems = (): TaskbarItem[] => {
        return openWindows.map(w => ({
            id: w.id,
            title: w.title,
            icon: (w.type === 'tool' && w.data?.icon) ? w.data.icon : (w.icon || 'settings'), // need proper icon handling
            isActive: activeWindowId === w.id && !minimizedWindows.includes(w.id),
            windowId: w.id
        }));
    };

    const handleTaskbarItemClick = (windowId: string) => {
        const isMinimized = minimizedWindows.includes(windowId);
        const isActive = activeWindowId === windowId;

        if (isMinimized) {
            // Restore
            setMinimizedWindows(prev => prev.filter(id => id !== windowId));
            bringToFront(windowId);
        } else if (isActive) {
            // Minimize
            setMinimizedWindows(prev => [...prev, windowId]);
            setActiveWindowId(null);
        } else {
            // Focus
            bringToFront(windowId);
        }
        setStartMenuOpen(false);
    };

    // Render content based on window type
    const renderWindowContent = (win: WindowState) => {
        if (win.type === 'tool' && win.data) {
            return (
                <Win98ToolWindow
                    tool={win.data}
                    onClose={() => closeWindow(win.id)}
                    isActive={activeWindowId === win.id}
                    onFocus={() => bringToFront(win.id)}
                    windowId={win.id}
                    sessionId={sessionId || undefined}
                />
            );
        } else if (win.type === 'folder' && win.id === 'tools-folder-window') {
            return (
                <ToolsFolder
                    tools={tools}
                    onToolOpen={openTool}
                    onClose={() => closeWindow(win.id)}
                    onFocus={() => bringToFront(win.id)}
                    isActive={activeWindowId === win.id}
                    sessionId={sessionId || undefined}
                />
            );
        } else if (win.type === 'my-computer') {
            return (
                <MyComputerWindow
                    onClose={() => closeWindow(win.id)}
                    isActive={activeWindowId === win.id}
                />
            );
        } else if (win.type === 'recycle-bin') {
            return (
                <RecycleBinWindow
                    onClose={() => closeWindow(win.id)}
                    isActive={activeWindowId === win.id}
                    sessionId={sessionId || undefined}
                />
            );
        } else if (win.type === 'about-me') {
            return (
                <AboutMeWindow
                    onClose={() => closeWindow(win.id)}
                    isActive={activeWindowId === win.id}
                />
            );
        } else if (win.type === 'brain') {
            return (
                <BrainWindow
                    onClose={() => closeWindow(win.id)}
                    isActive={activeWindowId === win.id}
                    sessionId={sessionId || undefined}
                    onFocus={() => bringToFront(win.id)}
                />
            );
        } else if (win.type === 'settings') {
            return (
                <Settings
                    onClose={() => closeWindow(win.id)}
                    onWallpaperUpdated={fetchWallpaper}
                />
            );
        } else if (win.type === 'welcome') {
            return (
                <WelcomeWindow
                    onClose={() => closeWindow(win.id)}
                    content={win.data?.content}
                />
            );
        }
        return <div className="p-4">Unknown Window Content</div>;
    };

    return (
        <div className="w-screen h-screen overflow-hidden relative select-none">
            {/* Spotlight Overlay */}
            <SpotlightSearch
                isOpen={isSpotlightOpen}
                onClose={() => setIsSpotlightOpen(false)}
                tools={tools}
                onLaunchTool={openTool}
            />

            <Desktop
                icons={desktopIcons}
                onIconClick={(id) => {
                    const icon = desktopIcons.find(i => i.id === id);
                    if (icon && icon.action) icon.action();
                }}
                onIconSelect={(id) => setSelectedIconIds(id ? [id] : [])}
                selectedIconIds={selectedIconIds}
                wallpaper={wallpaper}
            />

            {openWindows.map(win => (
                <Win98WindowFrame
                    key={win.id}
                    title={win.title}
                    icon={win.type === 'tool' && win.data?.icon ? win.data.icon : (win.icon || 'application')} // Fix icon name mapping 
                    isActive={activeWindowId === win.id}
                    onClose={() => closeWindow(win.id)}
                    onMinimize={() => {
                        setMinimizedWindows(prev => [...prev, win.id]);
                        setActiveWindowId(null);
                    }}
                    onMaximize={() => { }} // TODO
                    onFocus={() => bringToFront(win.id)}
                    onMouseDown={(e) => handleDragStart(e, win.id)}
                    position={win.position}
                    size={win.size}
                    zIndex={win.zIndex}
                    style={{ display: minimizedWindows.includes(win.id) ? 'none' : 'flex' }}
                >
                    <div style={{ height: '100%' }}>
                        {/* Render content based on window type */}
                        {!minimizedWindows.includes(win.id) && (
                            win.type === 'history' ? (
                                <HistoryViewer
                                    onClose={() => closeWindow(win.id)}
                                    isActive={activeWindowId === win.id}
                                    sessionId={sessionId || undefined}
                                />
                            ) : win.type === 'recycle-bin' ? (
                                <RecycleBinWindow
                                    onClose={() => closeWindow(win.id)}
                                    isActive={activeWindowId === win.id}
                                    sessionId={sessionId || undefined}
                                />
                            ) : renderWindowContent(win)
                        )}
                    </div>
                </Win98WindowFrame>
            ))}

            {startMenuOpen && (
                <StartMenu
                    onClose={() => setStartMenuOpen(false)}
                    onMenuItemClick={(action) => {
                        setStartMenuOpen(false);
                        if (action === 'tools-folder') openToolsFolder();
                        if (action === 'settings') openSettings();
                        // Add other actions
                    }}
                />
            )}

            <Taskbar
                items={getTaskbarItems()}
                onStartClick={() => setStartMenuOpen(!startMenuOpen)}
                onItemClick={handleTaskbarItemClick}
                startMenuOpen={startMenuOpen}
            />
        </div>
    );
};

export default Win98App;
