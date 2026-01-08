import React, { useState, useEffect } from 'react';
import './Brain.css';

interface Memory {
    id: string;
    content: string;
    category: string;
    importance: number;
    created_at: string;
}

interface BrainWindowProps {
    onClose: () => void;
    isActive: boolean;
    sessionId?: string;
    onFocus: () => void;
}

export const BrainWindow: React.FC<BrainWindowProps> = ({ onClose, isActive, sessionId, onFocus }) => {
    const [memories, setMemories] = useState<Memory[]>([]);
    const [loading, setLoading] = useState(false);
    const [newContent, setNewContent] = useState('');
    const [newCategory, setNewCategory] = useState('general');
    const [newImportance, setNewImportance] = useState(0.5);
    const [editingId, setEditingId] = useState<string | null>(null);

    useEffect(() => {
        if (sessionId) {
            fetchMemories();
        }
    }, [sessionId]);

    const fetchMemories = async () => {
        if (!sessionId) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/memories?userId=${sessionId}`);
            if (res.ok) {
                const data = await res.json();
                setMemories(data);
            }
        } catch (err) {
            console.error("Failed to fetch memories", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!sessionId || !newContent.trim()) return;

        try {
            const res = await fetch('/api/memories', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: sessionId,
                    content: newContent,
                    category: newCategory,
                    importance: newImportance
                })
            });

            if (res.ok) {
                setNewContent('');
                setNewCategory('general');
                setNewImportance(0.5);
                fetchMemories();
            }
        } catch (err) {
            console.error("Failed to add memory", err);
        }
    };

    const handleDelete = async (id: string) => {
        if (!sessionId || !confirm("Delete this memory?")) return;

        try {
            const res = await fetch(`/api/memories?id=${id}&userId=${sessionId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                fetchMemories();
            }
        } catch (err) {
            console.error("Failed to delete memory", err);
        }
    };

    const handleUpdate = async () => {
        if (!sessionId || !editingId) return;

        // Find the current editing memory values - wait, I should have separate state for editing or populate form
        // For simplicity, let's just use the main form for adding, and maybe valid editing logic
        // Actually, let's implement inline editing or populating the form

        // ... skipping complex inline editing for now, focusing on Add/Delete/View
        // If I want Edit, I should probably populate the form and switch button to "Update"

        // Basic Edit Flow:
        const mem = memories.find(m => m.id === editingId);
        if (!mem) return;

        try {
            const res = await fetch('/api/memories', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: editingId,
                    userId: sessionId,
                    content: newContent,
                    category: newCategory,
                    importance: newImportance
                })
            });

            if (res.ok) {
                setEditingId(null);
                setNewContent('');
                setNewCategory('general');
                setNewImportance(0.5);
                fetchMemories();
            }
        } catch (err) {
            console.error("Failed to update memory", err);
        }
    };

    const startEdit = (mem: Memory) => {
        setEditingId(mem.id);
        setNewContent(mem.content);
        setNewCategory(mem.category);
        setNewImportance(mem.importance);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setNewContent('');
        setNewCategory('general');
        setNewImportance(0.5);
    };

    return (
        <div className={`brain-window w-full h-full ${isActive ? 'active' : ''}`} onClick={onFocus}>
            <div className="brain-content">
                {loading ? <p>Loading thoughts...</p> : (
                    memories.length === 0 ? <p>No memories found.</p> : memories.map(mem => (
                        <div key={mem.id} className="memory-item">
                            <div className="memory-header">
                                <span className="memory-category">[{mem.category}]</span>
                                <span className="memory-importance">Imp: {mem.importance}</span>
                            </div>
                            <div className="memory-body">{mem.content}</div>
                            <div className="memory-actions">
                                <button className="win98-btn" onClick={() => startEdit(mem)}>Edit</button>
                                <button className="win98-btn" onClick={() => handleDelete(mem.id)}>Del</button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="brain-form">
                <label style={{ fontWeight: 'bold' }}>{editingId ? "Edit Memory" : "New Memory"}</label>
                <textarea
                    className="form-input"
                    rows={3}
                    placeholder="What do you want to remember?"
                    value={newContent}
                    onChange={e => setNewContent(e.target.value)}
                />
                <div className="form-row">
                    <input
                        className="form-input"
                        placeholder="Category (e.g. work, fun)"
                        value={newCategory}
                        onChange={e => setNewCategory(e.target.value)}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>Imp:</span>
                        <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="1"
                            style={{ width: '50px' }}
                            value={newImportance}
                            onChange={e => setNewImportance(parseFloat(e.target.value))}
                        />
                    </div>
                </div>
                <div className="form-row" style={{ justifyContent: 'flex-end' }}>
                    {editingId && <button className="win98-btn" onClick={cancelEdit}>Cancel</button>}
                    <button className="win98-btn" onClick={editingId ? handleUpdate : handleAdd}>
                        {editingId ? "Update" : "Add Memory"}
                    </button>
                </div>
            </div>
        </div>
    );
};
