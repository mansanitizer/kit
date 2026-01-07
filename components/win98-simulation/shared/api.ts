// Electron API types for type-safe communication
export interface FileOpsAPI {
  query: (query: string, filters?: any) => Promise<any>;
  listRecent: (days?: number, limit?: number) => Promise<any>;
  getFileInfo: (fileId: string) => Promise<any>;
  readFile: (fileId: string, options?: any) => Promise<any>;
  ingestFile: (filePath: string, options?: any) => Promise<any>;
  deleteFile: (fileId: string) => Promise<any>;
  updateFileTags: (fileId: string, tags: string[]) => Promise<any>;
  getStats: () => Promise<any>;
  getAllTags: () => Promise<any>;
  getAllTagsAndKeywords: () => Promise<any>;
  findSimilar: (fileId: string, limit?: number) => Promise<any>;
  searchLearnings: (query: string, options?: any) => Promise<any>;
  learn: (fileId: string, content: string, options?: any) => Promise<any>;
  getFileLearnings: (fileId: string, options?: any) => Promise<any>;
  testConnection: () => Promise<boolean>;
  getConnectionStatus: () => Promise<any>;
}

export interface ElectronAPI {
  fileops: FileOpsAPI;
  settings: {
    get: () => Promise<any>;
    save: (settings: any) => Promise<boolean>;
  };
  openDevTools: () => Promise<void>;
  openExternal: (url: string) => Promise<void>;
  app: {
    getVersion: () => Promise<string>;
    getPlatform: () => Promise<string>;
  };
  window: {
    minimize: () => Promise<void>;
    maximize: () => Promise<void>;
    close: () => Promise<void>;
  };
  dialog: {
    openFile: (options?: any) => Promise<any>;
    openDirectory: (options?: any) => Promise<any>;
    saveFile: (options?: any) => Promise<any>;
  };
  file: {
    saveToTemp: (fileName: string, fileData: string) => Promise<string>;
  };
  test: {
    ping: () => Promise<string>;
  };
  on: (channel: string, callback: Function) => void;
  off: (channel: string, callback: Function) => void;
}

// Global declaration for runtime access
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
