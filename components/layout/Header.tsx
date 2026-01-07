"use client"

import { useState } from "react"
import { GlassCard } from "@/components/ui/GlassCard"
import Link from "next/link"
import { History } from "lucide-react"
import { HistoryWindow } from "@/components/features/history/HistoryWindow"

export function Header() {
    const [showHistory, setShowHistory] = useState(false)

    return (
        <>
            <header className="p-4 container mx-auto relative z-40">
                <GlassCard className="flex items-center justify-between py-3 px-6">
                    <Link href="/" className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 to-cyan-200">
                        Kit
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link href="/" className="text-sm opacity-80 hover:opacity-100 transition-opacity hidden sm:block">Home</Link>

                        <div className="h-4 w-px bg-white/10 hidden sm:block"></div>

                        <button
                            onClick={() => setShowHistory(true)}
                            className="flex items-center gap-2 text-sm opacity-70 hover:opacity-100 transition-all hover:text-indigo-200"
                            title="Interactive History"
                        >
                            <History size={16} />
                            <span className="hidden sm:inline">History</span>
                        </button>
                    </div>
                </GlassCard>
            </header>

            {showHistory && <HistoryWindow onClose={() => setShowHistory(false)} />}
        </>
    )
}

