
import React, { useState, useEffect, useRef } from 'react';
import { DynamicRenderer } from '@/components/output/DynamicRenderer';
import { RefreshCw, Upload, FileText, Image as ImageIcon, File } from 'lucide-react';
import { cn } from '@/lib/utils';
import Win98Icon from '../Common/Win98Icon';

// Win98-styled components (reused)
const Win98Button = ({ onClick, children, className, active, title, disabled }: any) => (
    <button
        onClick={onClick}
        title={title}
        disabled={disabled}
        className={cn(
            "px-2 py-1 border-t border-l border-white border-b-2 border-r-2 border-b-black border-r-black bg-[#c0c0c0] active:border-t-black active:border-l-black active:border-b-white active:border-r-white outline-none select-none text-xs flex items-center justify-center gap-1",
            active && "border-t-black border-l-black border-b-white border-r-white bg-[#d4d0c8]",
            disabled && "text-gray-500",
            className
        )}
    >
        {children}
    </button>
);

const Win98Input = ({ value, onChange, placeholder, className }: any) => (
    <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={cn(
            "border-t-2 border-l-2 border-b border-r border-t-black border-l-black border-b-white border-r-white bg-white p-1 text-sm outline-none",
            className
        )}
    />
);

interface UserFile {
    id: string;
    filename: string;
    type: string; // 'document' | 'image'
    size: number;
    created_at: string;
}

interface MyComputerWindowProps {
    onClose: () => void;
    isActive: boolean;
}

export function MyComputerWindow({ onClose, isActive }: MyComputerWindowProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [files, setFiles] = useState<UserFile[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [fileContent, setFileContent] = useState<string | null>(null);
    const [isContentLoading, setIsContentLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initial Fetch & Session
    useEffect(() => {
        const stored = localStorage.getItem("kit_session_id");
        if (stored) setSessionId(stored);
        fetchFiles(stored);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            // Client-side filtering for simplicity since API handles session filtering
            // If API supported search, we'd call it here.
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const fetchFiles = async (sid: string | null = sessionId) => {
        setIsLoading(true);
        try {
            const url = sid ? `/api/user-files?sessionId=${sid}` : '/api/user-files';
            const res = await fetch(url);
            const data = await res.json();

            if (data.files) {
                setFiles(data.files);
            }
        } catch (error) {
            console.error("Failed to fetch files:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            if (sessionId) formData.append("sessionId", sessionId);

            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData
            });

            if (!res.ok) throw new Error("Upload failed");

            // Refresh list
            await fetchFiles(sessionId);
            alert("File uploaded successfully!");

        } catch (err: any) {
            console.error(err);
            alert("Upload failed: " + err.message);
        } finally {
            setIsLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const fetchFileContent = async (fileId: string) => {
        setIsContentLoading(true);
        setFileContent(null);
        try {
            const sid = sessionId || localStorage.getItem("kit_session_id");
            const url = sid
                ? `/api/user-files?sessionId=${sid}&id=${fileId}&action=content`
                : `/api/user-files?id=${fileId}&action=content`;

            const res = await fetch(url);
            const data = await res.json();

            if (data.content) {
                setFileContent(data.content);
            }
        } catch (error) {
            console.error("Failed to fetch content:", error);
            setFileContent("Error loading content.");
        } finally {
            setIsContentLoading(false);
        }
    };

    const handleFileSelect = (id: string) => {
        setSelectedId(id);
        fetchFileContent(id);
    };

    const filteredFiles = files.filter(f =>
        f.filename.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedFile = files.find(f => f.id === selectedId);

    const getFileIcon = (type: string) => {
        if (type === 'image') return <ImageIcon size={14} />;
        if (type === 'document') return <FileText size={14} />;
        return <File size={14} />;
    };

    return (
        <div className="flex flex-col h-full bg-[#c0c0c0] text-black font-sans">
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileUpload}
            />

            {/* Toolbar */}
            <div className="flex items-center p-1 gap-2 border-b border-[#808080] mb-1">
                <span className="text-xs">Search:</span>
                <Win98Input
                    value={searchTerm}
                    onChange={(e: any) => setSearchTerm(e.target.value)}
                    placeholder="Filename..."
                    className="w-48"
                />
                <Win98Button onClick={() => fetchFiles(sessionId)} title="Refresh">
                    <RefreshCw size={12} />
                </Win98Button>
                <div className="h-4 w-px bg-gray-400 mx-1" />
                <Win98Button onClick={() => fileInputRef.current?.click()} title="Upload File">
                    <Win98Icon name="upload" size={12} />
                    <span>Upload</span>
                </Win98Button>
            </div>

            {/* Split View */}
            <div className="flex flex-1 overflow-hidden p-1 gap-1">
                {/* Sidebar List */}
                <div className="w-1/3 flex flex-col border-2 border-[#808080] border-t-black border-l-black border-b-white border-r-white bg-white overflow-hidden">
                    <div className="bg-[#000080] text-white px-1 py-0.5 text-xs font-bold flex justify-between">
                        <span>Name</span>
                        <span>Size</span>
                    </div>
                    <div className="flex-1 overflow-y-auto bg-white">
                        <table className="w-full text-xs border-collapse">
                            <tbody>
                                {filteredFiles.map(file => (
                                    <tr
                                        key={file.id}
                                        onClick={() => handleFileSelect(file.id)}
                                        className={cn(
                                            "cursor-default select-none group h-6",
                                            selectedId === file.id ? "bg-[#000080] text-white" : "text-black hover:bg-[#e0e0e0]"
                                        )}
                                    >
                                        <td className="px-1 border-r border-[#ececec] truncate overflow-hidden whitespace-nowrap">
                                            <div className="flex items-center gap-1.5 h-full">
                                                {getFileIcon(file.type)}
                                                <span className="truncate">{file.filename}</span>
                                            </div>
                                        </td>
                                        <td className="px-1 w-12 text-right">
                                            {file.size}
                                        </td>
                                    </tr>
                                ))}
                                {filteredFiles.length === 0 && !isLoading && (
                                    <tr>
                                        <td colSpan={2} className="p-2 text-gray-500 text-center italic">No files</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right Pane: Details/Preview */}
                <div className="flex-1 flex flex-col border-2 border-[#808080] border-t-black border-l-black border-b-white border-r-white bg-[#e0e0e0] overflow-hidden relative p-4">
                    {selectedFile ? (
                        <div className="flex flex-col gap-4 h-full">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-white border border-gray-500 flex items-center justify-center">
                                    {getFileIcon(selectedFile.type)}
                                </div>
                                <div>
                                    <h2 className="font-bold text-lg">{selectedFile.filename}</h2>
                                    <div className="text-xs text-gray-600">Type: {selectedFile.type}</div>
                                    <div className="text-xs text-gray-600">Size: {selectedFile.size} chars</div>
                                    <div className="text-xs text-gray-600">ID: {selectedFile.id}</div>
                                </div>
                            </div>

                            <div className="border-t border-gray-400 pt-2 flex-1 flex flex-col">
                                <h3 className="font-bold mb-2">Use in Tools:</h3>
                                <div className="bg-white border border-gray-500 p-2 text-sm font-mono select-all">
                                    @@{selectedFile.filename}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Copy this tag into any tool prompt to attach this file.</p>
                            </div>

                            <div className="flex-1 flex flex-col min-h-0 mt-4">
                                <h3 className="font-bold mb-2">Preview:</h3>
                                <div className="flex-1 bg-white border border-gray-500 p-2 overflow-auto font-mono text-xs whitespace-pre-wrap">
                                    {isContentLoading ? (
                                        <span className="text-gray-500">Loading content...</span>
                                    ) : (
                                        fileContent || <span className="text-gray-400 italic">No content preview available</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
                            Select a file to view details.
                        </div>
                    )}
                </div>
            </div>

            {/* Status Bar */}
            <div className="h-6 border-t border-[#808080] mt-1 flex items-center px-2 text-xs gap-4">
                <span>{filteredFiles.length} item(s)</span>
                {isLoading && <span>Loading...</span>}
            </div>
        </div>
    );
}
