import React, { useState, useEffect } from 'react';
import { Interaction } from '@/components/features/history/InteractionTimeline';
import { DynamicRenderer } from '@/components/output/DynamicRenderer';
import { Search, Calendar, Terminal, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

// Win98-styled components (inline for now, or could be separate)
const Win98Button = ({ onClick, children, className, active }: any) => (
    <button
        onClick={onClick}
        className={cn(
            "px-2 py-1 border-t border-l border-white border-b-2 border-r-2 border-b-black border-r-black bg-[#c0c0c0] active:border-t-black active:border-l-black active:border-b-white active:border-r-white outline-none select-none text-xs",
            active && "border-t-black border-l-black border-b-white border-r-white bg-[#d4d0c8]",
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

interface HistoryViewerProps {
    onClose: () => void;
    isActive: boolean;
}

export function HistoryViewer({ onClose, isActive }: HistoryViewerProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [interactions, setInteractions] = useState<Interaction[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    // Initial Fetch
    useEffect(() => {
        fetchInteractions();
    }, []);

    // Debounced Search (or manual search button in Win98 style?) 
    // Win98 usually has a "Search" button. Let's do automatic for convenience but maybe add a refresh.
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchInteractions();
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const fetchInteractions = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (searchTerm) params.set("search", searchTerm);
            params.set("limit", "50");

            const res = await fetch(`/api/interactions?${params.toString()}`);
            const data = await res.json();

            if (data.interactions) {
                setInteractions(data.interactions);
                // Select first item if none selected and items exist
                if (!selectedId && data.interactions.length > 0) {
                    // Optional: auto-select first? Maybe not.
                }
            }
        } catch (error) {
            console.error("Failed to fetch history:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const selectedInteraction = interactions.find(i => i.id === selectedId);

    return (
        <div className="flex flex-col h-full bg-[#c0c0c0] text-black font-sans">
            {/* Toolbar */}
            <div className="flex items-center p-1 gap-2 border-b border-[#808080] mb-1">
                <span className="text-xs">Search:</span>
                <Win98Input
                    value={searchTerm}
                    onChange={(e: any) => setSearchTerm(e.target.value)}
                    placeholder="Tool name, Date..."
                    className="w-48"
                />
                <Win98Button onClick={fetchInteractions} className="flex items-center gap-1">
                    <RefreshCw size={10} />
                    <span>Refresh</span>
                </Win98Button>
            </div>

            {/* Split View */}
            <div className="flex flex-1 overflow-hidden p-1 gap-1">
                {/* Sidebar List */}
                <div className="w-1/3 flex flex-col border-2 border-[#808080] border-t-black border-l-black border-b-white border-r-white bg-white overflow-hidden">
                    <div className="bg-[#000080] text-white px-1 py-0.5 text-xs font-bold flex justify-between">
                        <span>History</span>
                        <span>{interactions.length} Items</span>
                    </div>
                    <div className="flex-1 overflow-y-auto bg-white">
                        <table className="w-full text-xs border-collapse">
                            <thead className="sticky top-0 bg-[#c0c0c0] z-10">
                                <tr className="text-black border-b border-[#808080]">
                                    <th className="text-left px-1 py-0.5 font-normal w-2/3 border-r border-[#808080]">Tool</th>
                                    <th className="text-left px-1 py-0.5 font-normal">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {interactions.map(item => (
                                    <tr
                                        key={item.id}
                                        onClick={() => setSelectedId(item.id)}
                                        className={cn(
                                            "cursor-default select-none group h-6",
                                            selectedId === item.id ? "bg-[#000080] text-white" : "text-black hover:bg-[#e0e0e0]"
                                        )}
                                    >
                                        <td className="px-1 border-r border-[#ececec] truncate overflow-hidden whitespace-nowrap max-w-[120px]">
                                            <div className="flex items-center gap-1.5 h-full">
                                                <Terminal size={10} className="shrink-0" />
                                                <span className="capitalize truncate">{item.tool_slug.replace(/-/g, ' ')}</span>
                                            </div>
                                        </td>
                                        <td className="px-1 whitespace-nowrap">
                                            {new Date(item.created_at).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })} {new Date(item.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {isLoading && <div className="p-2 text-xs text-gray-500">Loading...</div>}
                    </div>
                </div>

                <div className="flex-1 flex flex-col border-2 border-[#808080] border-t-black border-l-black border-b-white border-r-white bg-[#3a3a3a] overflow-hidden relative">
                    {selectedInteraction ? (
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                            <div className="flex flex-col gap-6">
                                {/* Floating Info */}
                                <div className="bg-white/5 p-2 rounded border border-white/10 text-white/50 text-xs">
                                    <div className="font-mono mb-1">ID: {selectedInteraction.id}</div>
                                    <div className="font-mono">Time: {new Date(selectedInteraction.created_at).toLocaleString()}</div>
                                </div>

                                {/* INPUT SECTION */}
                                <div className="space-y-2">
                                    <div className="bg-[#000080] text-white px-1 text-xs font-bold inline-block">
                                        Input Data
                                    </div>
                                    <div className="border border-white/10 p-2 rounded bg-black/20">
                                        <DynamicRenderer
                                            schema={{}}
                                            data={selectedInteraction.input_data}
                                        />
                                    </div>
                                </div>

                                {/* OUTPUT SECTION */}
                                <div className="space-y-2">
                                    <div className="bg-[#000080] text-white px-1 text-xs font-bold inline-block">
                                        Output Data
                                    </div>
                                    <div className="border border-white/10 p-2 rounded bg-black/20">
                                        <DynamicRenderer
                                            schema={{}}
                                            data={selectedInteraction.output_data}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-white/30 text-sm">
                            Select an interaction to view details.
                        </div>
                    )}
                </div>
            </div>

            {/* Status Bar */}
            <div className="h-6 border-t border-[#808080] mt-1 flex items-center px-2 text-xs gap-4">
                <span>{interactions.length} object(s)</span>
            </div>
        </div>
    );
}
