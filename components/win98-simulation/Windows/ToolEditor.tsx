
import React, { useState, useEffect } from 'react';
import { Tool } from '../shared/types';
import '../styles/win98.css';

interface ToolEditorProps {
    tool: Tool;
    onClose: () => void;
    isActive: boolean;
    onFocus: () => void;
    sessionId?: string;
    onSave?: (updatedTool: Tool) => void;
}

export const ToolEditor: React.FC<ToolEditorProps> = ({
    tool,
    onClose,
    isActive,
    onFocus,
    sessionId,
    onSave
}) => {
    const [formData, setFormData] = useState<Partial<Tool>>({
        name: tool.name,
        description: tool.description,
        icon: tool.icon,
        color: tool.color,
        model: tool.model,
        system_prompt: tool.system_prompt,
        input_schema: tool.input_schema,
        output_schema: tool.output_schema
    });

    const [jsonErrors, setJsonErrors] = useState<{ input?: string, output?: string }>({});
    const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
    const [activeTab, setActiveTab] = useState<'general' | 'logic' | 'input' | 'output'>('general');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleJsonChange = (type: 'input_schema' | 'output_schema', value: string) => {
        // Try to parse to validate (but store stringified)
        // Wait, formData stores the object if it's Tool type.
        // We should probably edit it as string
    };

    // We need local state for stringified JSON to allow editing invalid JSON
    const [inputSchemaStr, setInputSchemaStr] = useState(JSON.stringify(tool.input_schema, null, 2));
    const [outputSchemaStr, setOutputSchemaStr] = useState(JSON.stringify(tool.output_schema, null, 2));

    useEffect(() => {
        setInputSchemaStr(JSON.stringify(tool.input_schema, null, 2));
        setOutputSchemaStr(JSON.stringify(tool.output_schema, null, 2));
    }, [tool.input_schema, tool.output_schema]);

    const handleSave = async () => {
        setStatus('saving');
        setJsonErrors({});

        // Validate JSON
        let parsedInput, parsedOutput;
        try {
            parsedInput = JSON.parse(inputSchemaStr);
        } catch (e: any) {
            setJsonErrors(prev => ({ ...prev, input: e.message }));
            setStatus('error');
            return;
        }
        try {
            parsedOutput = JSON.parse(outputSchemaStr);
        } catch (e: any) {
            setJsonErrors(prev => ({ ...prev, output: e.message }));
            setStatus('error');
            return;
        }

        const payload = {
            ...formData,
            input_schema: parsedInput,
            output_schema: parsedOutput
        };

        try {
            const res = await fetch(`/api/tools/${tool.slug}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'x-session-id': sessionId || ''
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to update tool');
            }

            const updatedTool = await res.json();
            setStatus('success');
            if (onSave) onSave(updatedTool);

            // Close after short delay? Or just show status.
            setTimeout(() => setStatus('idle'), 2000);
        } catch (e: any) {
            console.error(e);
            setStatus('error');
            alert(e.message);
        }
    };

    return (
        <div className="h-full flex flex-col bg-[#c0c0c0] text-black win98-window-content" onClick={onFocus}>
            {/* Menu Bar */}
            <div className="win98-menubar">
                <div className="win98-menubar-item" onClick={handleSave}>File</div>
                <div className="win98-menubar-item">Edit</div>
                <div className="win98-menubar-item">View</div>
                <div className="win98-menubar-item">Help</div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-400 mt-2 px-2">
                {['general', 'logic', 'input', 'output'].map(tab => (
                    <button
                        key={tab}
                        className={`px-4 py-1 mr-1 rounded-t border-t border-l border-r border-black relative -bottom-[1px] ${activeTab === tab ? 'bg-[#c0c0c0] font-bold z-10' : 'bg-gray-300'}`}
                        onClick={() => setActiveTab(tab as any)}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="flex-1 p-4 overflow-auto border-t border-white bg-[#c0c0c0]">
                {activeTab === 'general' && (
                    <div className="flex flex-col gap-4 max-w-lg mx-auto">
                        <div className="flex flex-col">
                            <label className="text-xs mb-1">Name</label>
                            <input
                                name="name"
                                value={formData.name || ''}
                                onChange={handleInputChange}
                                className="win98-input px-2 py-1"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-xs mb-1">Slug (Read Only)</label>
                            <input
                                value={tool.slug}
                                disabled
                                className="win98-input px-2 py-1 bg-gray-200 text-gray-500"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-xs mb-1">Description</label>
                            <input
                                name="description"
                                value={formData.description || ''}
                                onChange={handleInputChange}
                                className="win98-input px-2 py-1"
                            />
                        </div>
                        <div className="flex gap-4">
                            <div className="flex flex-col flex-1">
                                <label className="text-xs mb-1">Icon (Lucide Name)</label>
                                <input
                                    name="icon"
                                    value={formData.icon || ''}
                                    onChange={handleInputChange}
                                    className="win98-input px-2 py-1"
                                />
                            </div>
                            <div className="flex flex-col flex-1">
                                <label className="text-xs mb-1">Color (Tailwind Gradient)</label>
                                <input
                                    name="color"
                                    value={formData.color || ''}
                                    onChange={handleInputChange}
                                    className="win98-input px-2 py-1"
                                />
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <label className="text-xs mb-1">Model ID</label>
                            <input
                                name="model"
                                value={formData.model || ''}
                                onChange={handleInputChange}
                                className="win98-input px-2 py-1"
                                placeholder="mistralai/mistral-7b-instruct:free"
                            />
                        </div>
                    </div>
                )}

                {activeTab === 'logic' && (
                    <div className="h-full flex flex-col">
                        <label className="text-xs mb-1">System Prompt (The Brain)</label>
                        <textarea
                            name="system_prompt"
                            value={formData.system_prompt || ''}
                            onChange={handleInputChange}
                            className="win98-input flex-1 p-2 font-mono text-sm resize-none"
                        />
                    </div>
                )}

                {activeTab === 'input' && (
                    <div className="h-full flex flex-col">
                        <label className="text-xs mb-1">Input Schema (JSON)</label>
                        {jsonErrors.input && <div className="text-red-600 text-xs mb-1">{jsonErrors.input}</div>}
                        <textarea
                            value={inputSchemaStr}
                            onChange={(e) => setInputSchemaStr(e.target.value)}
                            className={`win98-input flex-1 p-2 font-mono text-sm resize-none ${jsonErrors.input ? 'border-red-500' : ''}`}
                        />
                    </div>
                )}

                {activeTab === 'output' && (
                    <div className="h-full flex flex-col">
                        <label className="text-xs mb-1">Output Schema (JSON)</label>
                        {jsonErrors.output && <div className="text-red-600 text-xs mb-1">{jsonErrors.output}</div>}
                        <textarea
                            value={outputSchemaStr}
                            onChange={(e) => setOutputSchemaStr(e.target.value)}
                            className={`win98-input flex-1 p-2 font-mono text-sm resize-none ${jsonErrors.output ? 'border-red-500' : ''}`}
                        />
                    </div>
                )}
            </div>

            {/* Status Bar */}
            <div className="win98-statusbar justify-between">
                <div>{status === 'saving' ? 'Saving...' : status === 'success' ? 'Saved successfully' : 'Ready'}</div>
                <button
                    onClick={handleSave}
                    disabled={status === 'saving'}
                    className="win98-btn px-4 py-0.5 mb-0.5 text-xs font-bold"
                >
                    Save
                </button>
            </div>
        </div>
    );
};
