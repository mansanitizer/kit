import { Tool } from "@/types/tool";
import { ReactNode } from "react";

// Windows 98 UI Types
export interface WindowState {
  id: string; // "tool-slug" or special IDs like "my-computer"
  title: string;
  icon?: string; // Icon name e.g. "folder", "computer"
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  isFocused: boolean;
  type: 'tool' | 'folder' | 'system' | 'history' | 'my-computer' | 'recycle-bin' | 'about-me';
  data?: any; // To pass tool data or folder paths
}

export interface DesktopIcon {
  id: string;
  title: string;
  icon: string;
  position: { x: number; y: number };
  type: 'tool' | 'folder' | 'system' | 'link' | 'about-me';
  action?: () => void;
  target?: string; // Slug or path
}

export interface MenuItem {
  id: string;
  title: string;
  icon?: string;
  action?: () => void;
  disabled?: boolean;
  children?: MenuItem[];
}

export interface TaskbarItem {
  id: string;
  title: string;
  icon: string;
  isActive: boolean;
  windowId?: string;
}

// Re-export Tool type for convenience
export type { Tool };

// View Mode (simplified for Kit)
export type ViewMode = 'desktop' | 'tool-window' | 'folder-window';

// Application State
export interface AppState {
  windows: WindowState[];
  desktopIcons: DesktopIcon[];
  taskbarItems: TaskbarItem[];
  startMenuOpen: boolean;
  activeTool: Tool | null;
}

export interface FileInfo {
  fileId: string;
  title: string;
  description: string;
  originalPath: string;
  tags: string[];
  category: string;
  relevanceScore: number;
  finalScore: number;
  matchedFields: string[];
  reasoning: string;
  modifiedAt: string;
  sizeKB: number;
}

export type SearchResult = FileInfo;
