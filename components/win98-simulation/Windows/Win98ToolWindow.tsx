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
}

export const Win98ToolWindow: React.FC<Win98ToolWindowProps> = ({
    tool,
    onClose,
    isActive,
    onFocus,
    windowId
}) => {
    const [input, setInput] = useState<Record<string, any>>({});
    const [output, setOutput] = useState<Record<string, any> | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem("kit_session_id");
        if (stored) {
            setSessionId(stored);
        } else {
            const newId = crypto.randomUUID();
            localStorage.setItem("kit_session_id", newId);
            setSessionId(newId);
        }
    }, []);

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

    return (
        <div className="h-full flex flex-col bg-[#c0c0c0]" onClick={onFocus}>
            {/* Menu Bar */}
            <div className="win98-menubar">
                <div className="win98-menubar-item">File</div>
                <div className="win98-menubar-item">Edit</div>
                <div className="win98-menubar-item">View</div>
                <div className="win98-menubar-item">Help</div>
            </div>

            {/* Toolbar (Optional) */}
            <div className="win98-toolbar">
                <button className="win98-toolbar-button" title="Back">
                    <Win98Icon name="chevron-left" size={16} /> {/* We might need to map this icon */}
                </button>
                <div className="win98-toolbar-separator" />
                <button className="win98-toolbar-button" title="Run" onClick={handleSubmit} disabled={loading}>
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
                    // We might need to pass classNames to style inputs as Win98 style
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

                {/* Output Area - Using Hybrid Approach (Glassmorphism inside Win98) */}
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
                    {loading ? 'Processing...' : output ? 'Done' : 'Ready'}
                </div>
                <div className="win98-statusbar-separator">|</div>
                <div className="w-20">{tool.slug}</div>
            </div>
        </div>
    );
};
