import { GlassCard } from "@/components/ui/GlassCard"
import Link from "next/link"
import { Tool } from "@/types/tool"
import * as Icons from "lucide-react"

interface ToolSelectorProps {
    tools: Tool[]
}

export function ToolSelector({ tools }: ToolSelectorProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {tools.map((tool) => {
                // Dynamic Icon Lookup
                const IconComponent = (Icons as any)[tool.icon || "Box"] || Icons.Box

                return (
                    <Link key={tool.slug} href={`/tools/${tool.slug}`}>
                        <GlassCard className={`h-full hover:scale-[1.02] transition-transform cursor-pointer bg-gradient-to-br ${tool.color || 'from-gray-500/20 to-slate-500/20'}`}>
                            <div className="flex items-center gap-3 mb-3">
                                <IconComponent className="h-6 w-6 opacity-80" />
                                <h3 className="font-bold text-lg truncate">{tool.name}</h3>
                            </div>
                            <p className="text-sm opacity-70 line-clamp-2">{tool.description}</p>
                        </GlassCard>
                    </Link>
                )
            })}
        </div>
    )
}
