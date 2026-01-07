"use client"

import { useState, useEffect } from "react"
import { GlassCard } from "@/components/ui/GlassCard"
import { X, Search, Clock, Calendar, Terminal } from "lucide-react"
import { InteractionTimeline, Interaction } from "@/components/features/history/InteractionTimeline"

interface HistoryWindowProps {
    onClose: () => void
}

export function HistoryWindow({ onClose }: HistoryWindowProps) {
    const [searchTerm, setSearchTerm] = useState("")
    const [interactions, setInteractions] = useState<Interaction[]>([])
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        // Debounce search
        const timer = setTimeout(() => {
            fetchInteractions()
        }, 500)

        return () => clearTimeout(timer)
    }, [searchTerm])

    const fetchInteractions = async () => {
        setIsLoading(true)
        try {
            const params = new URLSearchParams()
            if (searchTerm) params.set("search", searchTerm)
            params.set("limit", "50")

            const res = await fetch(`/api/interactions?${params.toString()}`)
            const data = await res.json()

            if (data.interactions) {
                setInteractions(data.interactions)
            }
        } catch (error) {
            console.error("Failed to fetch history:", error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <GlassCard className="w-full max-w-4xl h-[80vh] flex flex-col p-0 overflow-hidden relative shadow-2xl border-white/20">
                {/* Header */}
                <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
                    <div className="flex items-center gap-2">
                        <Clock className="text-indigo-300" size={20} />
                        <h2 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 to-cyan-200">
                            Interaction History
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded hover:bg-white/10 transition-colors opacity-70 hover:opacity-100"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="p-4 border-b border-white/10 bg-black/20">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" size={16} />
                        <input
                            type="text"
                            placeholder="Search by tool name or date (e.g. 'search', 'January', '2024')..."
                            className="w-full bg-black/40 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-indigo-500/50 transition-colors placeholder:text-white/20"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                        {/* Quick Tips */}
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 text-[10px] opacity-40 hidden md:flex">
                            <span className="flex items-center gap-1"><Terminal size={10} /> Tool Name</span>
                            <span className="flex items-center gap-1"><Calendar size={10} /> Date</span>
                        </div>
                    </div>
                </div>

                {/* Timeline */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-black/10">
                    <InteractionTimeline interactions={interactions} isLoading={isLoading} />
                </div>
            </GlassCard>
        </div>
    )
}
