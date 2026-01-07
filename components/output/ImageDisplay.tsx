import { GlassCard } from "@/components/ui/GlassCard"

interface ImageDisplayProps {
    src: string
    alt?: string
    caption?: string
}

export function ImageDisplay({ src, alt, caption }: ImageDisplayProps) {
    if (!src) return null;

    return (
        <div className="space-y-2">
            <div className="relative rounded-xl overflow-hidden border border-white/10 group">
                <img
                    src={src}
                    alt={alt || "Output image"}
                    className="w-full h-auto object-cover max-h-[400px]"
                />
            </div>
            {caption && <p className="text-sm text-center text-white/50 italic">{caption}</p>}
        </div>
    )
}
