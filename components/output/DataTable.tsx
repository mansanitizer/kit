import { GlassCard } from "@/components/ui/GlassCard"

interface DataTableProps {
    data: Record<string, any>[]
}

export function DataTable({ data }: DataTableProps) {
    if (!data || data.length === 0) return null
    const headers = Object.keys(data[0])

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="text-white/60 uppercase bg-white/5">
                    <tr>
                        {headers.map((h) => (
                            <th key={h} className="px-4 py-3">
                                {h.replace(/_/g, ' ')}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, i) => (
                        <tr key={i} className="border-b border-white/10 last:border-0 hover:bg-white/5">
                            {headers.map((h) => (
                                <td key={h} className="px-4 py-3">
                                    {typeof row[h] === 'object' ? JSON.stringify(row[h]) : row[h]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
