"use client";

import React, { useState, useEffect } from 'react';
import { Tool } from '../shared/types';
import { DynamicForm } from '@/components/input/DynamicForm';
import { DynamicRenderer } from '@/components/output/DynamicRenderer';
import { Button } from '@/components/ui/Button'; // We might want to style this differently later
import Win98Icon from '../Common/Win98Icon';
import '../styles/win98.css';

interface Win98ToolWindowProps {
    tool: Tool;
    onClose: () => void;
    isActive: boolean;
    onFocus: () => void;
    windowId: string;
    sessionId?: string;
}

export const Win98ToolWindow: React.FC<Win98ToolWindowProps> = ({
    tool,
    onClose,
    isActive,
    onFocus,
    windowId,
    sessionId
}) => {
    const [input, setInput] = useState<Record<string, any>>({});
    const [output, setOutput] = useState<Record<string, any> | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Removed internal sessionId state/effect in favor of prop

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);
        setOutput(null);

        try {
            const response = await fetch("/api/run-tool", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ toolSlug: tool.slug, input, sessionId }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to run tool");
            }

            setOutput(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [uploadStatus, setUploadStatus] = useState<string | null>(null);
    const [showFileMenu, setShowFileMenu] = useState(false);
    const [userFiles, setUserFiles] = useState<any[]>([]);

    useEffect(() => {
        if (showFileMenu && sessionId) {
            fetch(`/api/user-files?sessionId=${sessionId}`)
                .then(res => res.json())
                .then(data => {
                    if (data.files) setUserFiles(data.files);
                })
                .catch(err => console.error("Failed to load user files", err));
        }
    }, [showFileMenu, sessionId]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadStatus("Uploading...");
        setLoading(true); // Block UI during upload

        try {
            const formData = new FormData();
            formData.append("file", file);
            if (sessionId) formData.append("sessionId", sessionId);

            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Upload failed");

            setUploadStatus(`Uploaded: ${data.filename}`);

            // Auto-append logic
            injectAttachment(data.filename);

        } catch (err: any) {
            console.error(err);
            setUploadStatus("Upload Failed");
            setError(err.message);
        } finally {
            setLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
            setTimeout(() => setUploadStatus(null), 3000);
        }
    };

    const injectAttachment = (filename: string) => {
        // Naive injection into first string input
        // In a real app we might want a specific cursor position or dedicated input
        const keys = Object.keys(tool.input_schema?.properties || {});
        // Find first string field
        const targetField = keys.find(k => tool.input_schema.properties[k].type === 'string') || keys[0];

        if (targetField) {
            const currentVal = input[targetField] || "";
            const attachment = ` @@${filename}`;
            if (!currentVal.includes(attachment)) {
                setInput(prev => ({
                    ...prev,
                    [targetField]: currentVal + attachment
                }));
            }
        }
        setShowFileMenu(false);
    };

    return (
        <div className="h-full flex flex-col bg-[#c0c0c0]" onClick={() => { onFocus(); setShowFileMenu(false); }}>
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileUpload}
                accept=".pdf,.txt,.md,.png,.jpg,.jpeg,.webp"
            />
            {/* Menu Bar */}
            <div className="win98-menubar">
                <div className="win98-menubar-item">File</div>
                <div className="win98-menubar-item">Edit</div>
                <div className="win98-menubar-item">View</div>
                <div className="win98-menubar-item">Help</div>
            </div>

            {/* Toolbar */}
            <div className="win98-toolbar relative">
                <button className="win98-toolbar-button" title="Back">
                    <Win98Icon name="chevron-left" size={16} />
                </button>
                <div className="win98-toolbar-separator" />

                {/* Upload Button (OS Picker) */}
                <button className="win98-toolbar-button" title="Upload New File" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }} disabled={loading}>
                    <Win98Icon name="upload" size={16} />
                </button>

                {/* Attach Button (RAG Dropdown) */}
                <button
                    className={`win98-toolbar-button ${showFileMenu ? 'active' : ''}`}
                    title="Attach Existing File"
                    onClick={(e) => { e.stopPropagation(); setShowFileMenu(!showFileMenu); }}
                    disabled={loading}
                >
                    <Win98Icon name="paperclip" size={16} />
                </button>

                {/* File Dropdown Menu */}
                {showFileMenu && (
                    <div className="absolute top-full left-10 mt-1 w-64 bg-[#c0c0c0] border-2 border-white border-b-black border-r-black shadow-md z-50 flex flex-col" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-[#000080] text-white px-2 py-1 text-xs font-bold flex justify-between items-center">
                            <span>My Files</span>
                            <span className="cursor-pointer" onClick={() => setShowFileMenu(false)}>x</span>
                        </div>
                        <div className="max-h-48 overflow-y-auto p-1 border border-gray-400 bg-white m-1">
                            {userFiles.length === 0 ? (
                                <div className="text-xs text-gray-500 p-2 text-center">No files found. Upload one!</div>
                            ) : (
                                userFiles.map(f => (
                                    <div
                                        key={f.id}
                                        className="text-xs p-1 hover:bg-[#000080] hover:text-white cursor-pointer truncate flex items-center gap-2"
                                        onClick={() => injectAttachment(f.filename)}
                                    >
                                        <Win98Icon name={f.type === 'image' ? 'image' : 'file-text'} size={12} />
                                        {f.filename}
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="p-1 text-[10px] text-gray-600 border-t border-gray-300">
                            Click to attach @@filename
                        </div>
                    </div>
                )}


                <div className="win98-toolbar-separator" />
                <button className="win98-toolbar-button" title="Run" onClick={(e) => { e.stopPropagation(); handleSubmit(); }} disabled={loading}>
                    <Win98Icon name="run" size={16} />
                </button>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-auto p-4 space-y-4">

                {/* Input Form Frame */}
                <fieldset className="border-2 border-white border-l-gray-500 border-t-gray-500 p-2">
                    <legend className="px-1">Input</legend>
                    <DynamicForm
                        schema={tool.input_schema}
                        value={input}
                        onChange={setInput}
                        disabled={loading}
                    />
                    <div className="mt-4 flex justify-end">
                        <button
                            className="win98-button win98-button-primary px-6 py-1"
                            onClick={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? 'Running...' : 'Run Tool'}
                        </button>
                    </div>
                </fieldset>

                {/* Error Display */}
                {error && (
                    <div className="bg-red-100 border-2 border-red-500 text-red-800 p-2 text-sm flex items-center gap-2">
                        <Win98Icon name="error" size={16} className="text-red-500" />
                        {error}
                    </div>
                )}

                {/* Output Area */}
                {output && (
                    <fieldset className="border-2 border-white border-l-gray-500 border-t-gray-500 p-2 bg-[#333] text-white min-h-[200px]">
                        <legend className="px-1 text-black bg-[#c0c0c0]">Output</legend>
                        <div className="h-full">
                            {output._tool_forge_status ? (
                                <div className="flex flex-col items-center justify-center h-full p-8 text-black bg-[#c0c0c0] border-2 border-white border-b-gray-700 border-r-gray-700 m-4 shadow-md">
                                    {output._tool_forge_status === 'success' ? (
                                        <>
                                            <Win98Icon name="info" size={48} className="mb-4 text-blue-800" />
                                            <h3 className="text-xl font-bold mb-2">Ready!</h3>
                                            <p className="mb-4">Tool created successfully.</p>
                                            <button
                                                className="win98-button px-4 py-1"
                                                onClick={() => window.location.reload()}
                                            >
                                                Refresh
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <Win98Icon name="error" size={48} className="mb-4 text-red-600" />
                                            <h3 className="text-xl font-bold mb-2">Sorry :(</h3>
                                            <p className="text-center">Failed to create tool.</p>
                                            <p className="text-xs mt-2 text-gray-600 max-w-[200px] break-words">{output._tool_forge_error}</p>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <DynamicRenderer schema={tool.output_schema} data={{ ...input, ...output }} />
                            )}
                        </div>
                    </fieldset>
                )}
            </div>

            {/* Status Bar */}
            <div className="win98-statusbar">
                <div className="flex-1">
                    {uploadStatus ? uploadStatus : (loading ? 'Processing...' : output ? 'Done' : 'Ready')}
                </div>
                <div className="win98-statusbar-separator">|</div>
                <div className="w-20">{tool.slug}</div>
            </div>
        </div>
    );
};
