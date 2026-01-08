import React, { useState, useEffect } from 'react';

interface WallpaperSettingsProps {
    onWallpaperUpdated?: () => void;
}

export const WallpaperSettings: React.FC<WallpaperSettingsProps> = ({ onWallpaperUpdated }) => {
    const [preview, setPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        const id = localStorage.getItem('kit_session_id');
        setUserId(id);
        if (id) {
            fetchWallpaper(id);
        }
    }, []);

    const fetchWallpaper = async (uid: string) => {
        try {
            // Add cache busting here too for the preview
            const res = await fetch(`/api/wallpaper?userId=${uid}&t=${Date.now()}`);
            if (res.ok) {
                const data = await res.json();
                if (data.wallpaper_data) {
                    setPreview(data.wallpaper_data);
                }
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            alert("File too large. Max 2MB.");
            return;
        }

        const reader = new FileReader();
        reader.onload = (ev) => {
            const result = ev.target?.result as string;
            setPreview(result);
        };
        reader.readAsDataURL(file);
    };

    const handleSave = async () => {
        if (!userId || !preview) return;
        setLoading(true);

        try {
            const mimeType = preview.split(';')[0].split(':')[1] || 'image/jpeg';

            const res = await fetch('/api/wallpaper', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    wallpaperData: preview,
                    mimeType
                })
            });

            if (res.ok) {
                alert("Wallpaper updated!");
                if (onWallpaperUpdated) {
                    onWallpaperUpdated();
                } else {
                    // Fallback for safety
                    window.dispatchEvent(new Event('wallpaper-updated'));
                }
            } else {
                const errData = await res.json();
                alert(`Failed to save wallpaper: ${errData.error || "Unknown error"}`);
            }
        } catch (err) {
            console.log(err);
            alert("Error saving wallpaper: " + err);
        } finally {
            setLoading(false);
        }
    };

    const handleClear = async () => {
        if (!userId) return;
        if (!confirm("Are you sure you want to remove the wallpaper?")) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/wallpaper?userId=${userId}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                setPreview(null);
                alert("Wallpaper cleared!");
                if (onWallpaperUpdated) {
                    onWallpaperUpdated();
                } else {
                    window.dispatchEvent(new Event('wallpaper-updated'));
                }
            } else {
                alert("Failed to clear wallpaper.");
            }
        } catch (e) {
            console.error(e);
            alert("Error clearing wallpaper.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{
                width: '100%',
                height: '200px',
                backgroundColor: '#008080',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundImage: preview ? `url(${preview})` : 'none',
                border: '2px inset white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                {!preview && <span style={{ color: 'white' }}>No Wallpaper</span>}
            </div>

            <div className="win98-setting-group">
                <input type="file" accept="image/*" onChange={handleFileChange} />
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button className="win98-button" onClick={handleClear} disabled={loading}>Clear</button>
                <button className="win98-button" onClick={handleSave} disabled={loading}>
                    {loading ? "Saving..." : "Apply Wallpaper"}
                </button>
            </div>
            <p style={{ fontSize: '12px', color: '#666' }}>Max size: 2MB. Stored locally/database.</p>
        </div>
    );
};
