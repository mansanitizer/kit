import { GlassCard } from "@/components/ui/GlassCard"
import { Download } from "lucide-react"
import { cn } from "@/lib/utils"

interface ImageDisplayProps {
    src: string
    alt?: string
    caption?: string
}

export function ImageDisplay({ src, alt, caption }: ImageDisplayProps) {
    if (!src) return null;

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = src;
        link.download = `generated-image-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-2">
            <div className="relative rounded-xl overflow-hidden border border-white/10 group">
                <img
                    src={src}
                    alt={alt || "Output image"}
                    className="w-full h-auto object-cover max-h-[400px]"
                />
                <button
                    onClick={handleDownload}
                    className="absolute top-2 right-2 p-2 rounded-lg bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-all duration-200 backdrop-blur-sm border border-white/20 hover:scale-105 active:scale-95"
                    title="Download Image"
                >
                    <Download className="w-4 h-4" />
                </button>
            </div>
            {caption && <p className="text-sm text-center text-white/50 italic">{caption}</p>}
        </div>
    )
}
