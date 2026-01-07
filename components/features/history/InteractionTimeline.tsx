import { useState } from "react"
import { GlassCard } from "@/components/ui/GlassCard"
import { ChevronDown, ChevronUp, Terminal, Calendar, Code, LayoutTemplate } from "lucide-react"
import { DynamicRenderer } from "@/components/output/DynamicRenderer"
import { cn } from "@/lib/utils"

export interface Interaction {
    id: string
    tool_slug: string
    input_data: any
    output_data: any
    created_at: string
}

interface InteractionTimelineProps {
    interactions: Interaction[]
    isLoading: boolean
}

export function InteractionTimeline({ interactions, isLoading }: InteractionTimelineProps) {
    if (isLoading) {
        return <div className="p-8 text-center opacity-60">Loading history...</div>
    }

    if (interactions.length === 0) {
        return <div className="p-8 text-center opacity-60">No interactions found.</div>
    }

    return (
        <div className="flex flex-col gap-4 p-2">
            {interactions.map((interaction) => (
                <InteractionItem key={interaction.id} interaction={interaction} />
            ))}
        </div>
    )
}

function InteractionItem({ interaction }: { interaction: Interaction }) {
    const [isExpanded, setIsExpanded] = useState(false)
    const [viewMode, setViewMode] = useState<"preview" | "json">("preview")
    const date = new Date(interaction.created_at)

    return (
        <GlassCard className="p-0 overflow-hidden border-opacity-30">
            <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-white/10">
                        <Terminal size={18} className="opacity-70" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm md:text-base capitalize">{interaction.tool_slug.replace(/-/g, ' ')}</h3>
                        <div className="flex items-center gap-2 text-xs opacity-50">
                            <Calendar size={10} />
                            <span>{date.toLocaleDateString()} {date.toLocaleTimeString()}</span>
                        </div>
                    </div>
                </div>
                <button className="opacity-50 hover:opacity-100">
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
            </div>

            {isExpanded && (
                <div className="border-t border-white/10 bg-black/20 text-xs font-mono">
                    {/* Toolbar */}
                    <div className="flex items-center gap-2 p-2 border-b border-white/5 bg-black/20">
                        <button
                            onClick={() => setViewMode("preview")}
                            className={cn(
                                "flex items-center gap-1 px-3 py-1.5 rounded transition-all",
                                viewMode === "preview"
                                    ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                                    : "opacity-60 hover:opacity-100 hover:bg-white/5"
                            )}
                        >
                            <LayoutTemplate size={12} />
                            <span>Preview</span>
                        </button>
                        <button
                            onClick={() => setViewMode("json")}
                            className={cn(
                                "flex items-center gap-1 px-3 py-1.5 rounded transition-all",
                                viewMode === "json"
                                    ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                                    : "opacity-60 hover:opacity-100 hover:bg-white/5"
                            )}
                        >
                            <Code size={12} />
                            <span>JSON</span>
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                        {viewMode === "preview" ? (
                            <div className="bg-black/20 rounded-lg p-4 border border-white/5">
                                <DynamicRenderer
                                    schema={{}} // Schema is not persisted, relying on data keys fallback
                                    data={interaction.output_data}
                                />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <h4 className="font-bold mb-2 opacity-70">Input</h4>
                                    <pre className="p-2 rounded bg-black/30 text-green-300/90 whitespace-pre-wrap break-all">
                                        {JSON.stringify(interaction.input_data, null, 2)}
                                    </pre>
                                </div>
                                <div>
                                    <h4 className="font-bold mb-2 opacity-70">Output</h4>
                                    <pre className="p-2 rounded bg-black/30 text-blue-300/90 whitespace-pre-wrap break-all h-64 overflow-y-auto custom-scrollbar">
                                        {JSON.stringify(interaction.output_data, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </GlassCard>
    )
}
