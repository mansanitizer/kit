import { cn } from "@/lib/utils"

export function DefaultJSONRenderer({ data }: { data: any }) {
    return (
        <pre className="glass-panel p-4 overflow-x-auto text-xs text-mono text-white/70">
            {JSON.stringify(data, null, 2)}
        </pre>
    )
}
