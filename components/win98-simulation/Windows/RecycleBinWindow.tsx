import React, { useState, useEffect } from 'react';
import Win98Icon from '../Common/Win98Icon';
import './RecycleBin.css';

interface RecycleBinItem {
    id: string;
    original_id: string;
    item_type: 'tool' | 'file' | 'interaction';
    display_text: string;
    deleted_at: string;
    data: any;
}

interface RecycleBinWindowProps {
    onClose: () => void;
    isActive: boolean;
    sessionId?: string;
}

export const RecycleBinWindow: React.FC<RecycleBinWindowProps> = ({ onClose, isActive, sessionId }) => {
    const [items, setItems] = useState<RecycleBinItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    useEffect(() => {
        if (isActive) {
            fetchItems();
        }
    }, [isActive, sessionId]); // Reload when focused or session changes

    const fetchItems = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/recycle-bin', {
                headers: {
                    'x-session-id': sessionId || ''
                }
            });
            const data = await res.json();
            if (data.items) {
                setItems(data.items);
            }
        } catch (error) {
            console.error('Failed to fetch recycle bin items:', error);
        } finally {
            setLoading(false);
        }
    };

    const getIconName = (type: string) => {
        switch (type) {
            case 'tool': return 'settings';
            case 'file': return 'file';
            case 'interaction': return 'history';
            default: return 'file';
        }
    };

    return (
        <div className="flex flex-col h-full bg-white text-black font-sans">
            {/* Menu Bar (Visual only for now) */}
            <div className="win98-menubar bg-[#c0c0c0] flex border-b border-[#808080]">
                <div className="win98-menubar-item px-2 py-0.5 hover:bg-[#000080] hover:text-white cursor-pointer">File</div>
                <div className="win98-menubar-item px-2 py-0.5 hover:bg-[#000080] hover:text-white cursor-pointer">Edit</div>
                <div className="win98-menubar-item px-2 py-0.5 hover:bg-[#000080] hover:text-white cursor-pointer">View</div>
                <div className="win98-menubar-item px-2 py-0.5 hover:bg-[#000080] hover:text-white cursor-pointer">Help</div>
            </div>

            {/* List View */}
            <div className="flex-1 overflow-auto bg-white">
                <table className="w-full text-xs border-collapse table-fixed">
                    <thead className="sticky top-0 bg-[#c0c0c0] z-10 shadow-sm">
                        <tr className="text-black border-b border-[#808080] border-r border-r-white border-l border-l-white">
                            <th className="text-left px-1 py-1 font-normal border-r border-[#808080] w-[40%]">Name</th>
                            <th className="text-left px-1 py-1 font-normal border-r border-[#808080] w-[20%]">Original Location</th>
                            <th className="text-left px-1 py-1 font-normal border-r border-[#808080] w-[20%]">Date Deleted</th>
                            <th className="text-left px-1 py-1 font-normal w-[20%]">Type</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map(item => (
                            <tr
                                key={item.id}
                                onClick={() => setSelectedId(item.id)}
                                className={`cursor-default select-none ${selectedId === item.id ? 'bg-[#000080] text-white' : 'hover:bg-gray-100'}`}
                            >
                                <td className="px-1 py-0.5 border-r border-gray-100 truncate flex items-center gap-1.5">
                                    <Win98Icon name={getIconName(item.item_type)} size={16} />
                                    <span className="truncate">{item.display_text}</span>
                                </td>
                                <td className="px-1 py-0.5 border-r border-gray-100 truncate">C:\Kit\{item.item_type}s</td>
                                <td className="px-1 py-0.5 border-r border-gray-100 truncate">
                                    {new Date(item.deleted_at).toLocaleString()}
                                </td>
                                <td className="px-1 py-0.5 truncate capitalize">{item.item_type}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {items.length === 0 && !loading && (
                    <div className="p-4 text-gray-500 text-center text-sm">
                        Recycle Bin is empty
                    </div>
                )}
            </div>

            {/* Status Bar */}
            <div className="bg-[#c0c0c0] border-t border-[#808080] px-2 py-0.5 text-xs flex justify-between">
                <span>{items.length} object(s)</span>
                <span>0 bytes</span>
            </div>
        </div>
    );
};
