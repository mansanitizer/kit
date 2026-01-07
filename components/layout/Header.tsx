import { GlassCard } from "@/components/ui/GlassCard"
import Link from "next/link"

export function Header() {
    return (
        <header className="p-4 container mx-auto">
            <GlassCard className="flex items-center justify-between py-3 px-6">
                <Link href="/" className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 to-cyan-200">
                    Kit
                </Link>
                <div className="flex gap-4">
                    <Link href="/" className="text-sm opacity-80 hover:opacity-100 transition-opacity">Home</Link>
                </div>
            </GlassCard>
        </header>
    )
}
