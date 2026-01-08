
import React from 'react';

interface ColorPaletteProps {
    onSelect: (color: string) => void;
    onClose: () => void;
}

const COLORS = [
    { name: 'Classic', value: 'classic' }, // Special case
    { name: 'Navy', value: '#000080' },
    { name: 'Crimson', value: '#800000' },
    { name: 'Green', value: '#008000' },
    { name: 'Olive', value: '#808000' },
    { name: 'Purple', value: '#800080' },
    { name: 'Teal', value: '#008080' },
    { name: 'Gray', value: '#808080' },
    { name: 'Black', value: '#000000' },
    { name: 'Rainy', value: '#4682B4' },
    { name: 'Pink', value: '#FF1493' },
    { name: 'Orange', value: '#FF4500' },
];

export const ColorPalette: React.FC<ColorPaletteProps> = ({ onSelect, onClose }) => {
    return (
        <>
            {/* Overlay to close on click outside */}
            <div className="fixed inset-0 z-[9998]" onClick={onClose} />

            <div
                className="absolute bottom-8 right-2 w-32 bg-[#c0c0c0] border-2 border-white border-b-[#808080] border-r-[#808080] p-1 shadow-md z-[9999]"
                style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}
            >
                {COLORS.map((c) => (
                    <div
                        key={c.name}
                        className="w-6 h-6 border border-gray-600 cursor-pointer hover:border-white hover:scale-110 transition-transform"
                        style={{
                            background: c.value === 'classic'
                                ? 'linear-gradient(135deg, #008080 50%, #000080 50%)'
                                : c.value
                        }}
                        title={c.name}
                        onClick={() => onSelect(c.value)}
                    />
                ))}
            </div>
        </>
    );
};
