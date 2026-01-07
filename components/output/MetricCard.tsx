import { GlassCard } from "@/components/ui/GlassCard"
import { cn } from "@/lib/utils"

interface MetricCardProps {
    label: string
    value: string | number
    unit?: string
    trend?: "up" | "down" | "neutral"
    variant?: "default" | "highlight"
}

export function MetricCard({ label, value, unit, trend, variant = "default" }: MetricCardProps) {
    return (
        <GlassCard className={cn(
            "flex flex-col items-center justify-center p-5 min-w-[120px] relative overflow-hidden group hover:border-white/20 transition-all",
            variant === "highlight" && "bg-indigo-500/20 border-indigo-500/30"
        )}>
            {/* Subtle Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            <span className="text-[10px] text-white/40 mb-2 uppercase tracking-[0.2em] font-medium z-10">{label}</span>
            <div className="text-3xl font-light flex items-end gap-1.5 z-10 font-mono text-white/90">
                {value}
                {unit && <span className="text-sm text-white/40 mb-1.5 font-sans font-normal opacity-70">{unit}</span>}
            </div>
        </GlassCard>
    )
}
