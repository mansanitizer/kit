import { cn } from "@/lib/utils"
import { MetricCard } from "./MetricCard"
import { MarkdownRenderer } from "./MarkdownRenderer"
import { ImageDisplay } from "./ImageDisplay"
import { DataTable } from "./DataTable"
import { DefaultJSONRenderer } from "./DefaultJSONRenderer"

interface DynamicRendererProps {
    schema: Record<string, any>
    data: Record<string, any>
}

export function DynamicRenderer({ schema, data }: DynamicRendererProps) {
    if (!data) return null;

    let layoutDSL = data._layout as string;

    // Resiliency: If layout is missing OR clearly invalid (doesn't contain brackets), fallback
    if (!layoutDSL || !layoutDSL.includes("[[") || !layoutDSL.includes("]]")) {
        console.warn("Invalid or missing Layout DSL, falling back to auto-layout.", layoutDSL);
        layoutDSL = generateDefaultLayout(data);
    }

    // Safety: removing any text that isn't inside [[...]] to avoid hallucinations leaking into view
    // Actually, splitting by "]]" and cleaning is usually enough, but let's be strict.

    const rows = layoutDSL
        .split("]]")
        .map(r => {
            const match = r.match(/\[\[(.*)/); // Find starting bracket
            return match ? match[1].trim() : "";
        })
        .filter(r => r.length > 0);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
            {rows.map((rowStr, rowIndex) => {
                const keys = rowStr.split(",").map(k => k.trim());

                return (
                    <div key={rowIndex} className={cn("grid gap-6 items-start", getGridCols(keys.length))}>
                        {keys.map((key) => {
                            const value = resolveValue(data, key);
                            // Explicitly skip _layout key if it accidentally ends up in the DSL or default layout
                            if (key === '_layout') return null;

                            if (value === undefined || value === null) return null;

                            const fieldSchema = resolveSchema(schema, key);

                            return (
                                <div key={key} className="min-w-0 h-full flex flex-col">
                                    {renderComponent(key, value, fieldSchema, data)}
                                </div>
                            )
                        })}
                    </div>
                )
            })}
        </div>
    )
}

function getGridCols(count: number) {
    if (count === 1) return "grid-cols-1";
    if (count === 2) return "grid-cols-1 md:grid-cols-2";
    if (count === 3) return "grid-cols-1 md:grid-cols-3";
    return "grid-cols-1 md:grid-cols-2 lg:grid-cols-4";
}

function resolveValue(data: any, key: string) {
    if (key.includes('.')) {
        return key.split('.').reduce((acc, part) => acc && acc[part], data);
    }
    return data[key];
}

function resolveSchema(rootSchema: any, key: string) {
    return rootSchema?.properties?.[key] || {};
}

function generateDefaultLayout(data: any) {
    return Object.keys(data)
        .filter(k => k !== '_layout') // Exclude _layout from default view
        .map(k => `[[${k}]]`)
        .join(" ");
}

function renderComponent(key: string, value: any, schema: any, allData: any) {
    // 1. Image
    if (key === "image" || (typeof value === 'string' && value.startsWith('data:image'))) {
        return <ImageDisplay src={value} alt={key} />;
    }

    // 2. Metrics
    if (typeof value === 'number') {
        let unit = schema?.unit || "";
        if (!unit && (key === 'calories' || key.includes('energy'))) unit = 'kcal';
        if (!unit && (key === 'protein' || key === 'carbs' || key === 'fat')) unit = 'g';
        if (!unit && (key === 'score' || key === 'confidence')) unit = '/ 100';

        return <MetricCard label={key} value={value} unit={unit} />;
    }

    // 3. Arrays
    if (Array.isArray(value)) {
        if (value.length === 0) return null;

        if (typeof value[0] === 'string') {
            return (
                <div className="glass-panel p-5 h-full border-l-4 border-l-yellow-500/50 bg-yellow-500/5">
                    <h4 className="text-yellow-200/80 font-medium mb-3 text-xs uppercase tracking-widest">{key}</h4>
                    <ul className="space-y-2">
                        {value.map((v: string, i: number) => (
                            <li key={i} className="text-yellow-50/90 text-sm flex items-start gap-2">
                                <span className="opacity-40 select-none">•</span>
                                {v}
                            </li>
                        ))}
                    </ul>
                </div>
            )
        }
        return <DataTable data={value} />;
    }

    // 4. Objects
    if (typeof value === 'object') {
        return <DefaultJSONRenderer data={value} />;
    }

    // 5. Short Strings
    if (typeof value === 'string' && value.length < 100) {
        if (key === 'food_name' || key === 'title') {
            return (
                <div className="py-2">
                    <h2 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 tracking-tight">
                        {value}
                    </h2>
                </div>
            );
        }
        if (key === 'health_rating' || key === 'grade' || key === 'verdict' || key === 'misfire_risk') {
            // Dynamic color based on semantic meaning
            const lowerVal = value.toLowerCase();
            let gradeColor = 'text-white border-white/30 bg-white/10';

            if (['a', 'high', 'likely fine', 'low'].some(v => lowerVal.includes(v))) {
                gradeColor = 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
            } else if (['b', 'moderate', 'risky', 'medium'].some(v => lowerVal.includes(v))) {
                gradeColor = 'text-amber-400 border-amber-500/30 bg-amber-500/10';
            } else if (['c', 'd', 'f', 'bad', 'high'].some(v => lowerVal.includes(v))) { // 'High' risk is bad
                if (key === 'misfire_risk' && lowerVal.includes('high')) {
                    gradeColor = 'text-rose-400 border-rose-500/30 bg-rose-500/10';
                } else if (key !== 'misfire_risk') {
                    // For 'High' in 'health_rating' it might be good? Assume rating is grade usually.
                    // Let's stick to safe defaults or specific logic
                    gradeColor = 'text-rose-400 border-rose-500/30 bg-rose-500/10';
                }
            }

            return (
                <div className="flex flex-col items-start justify-center h-full">
                    <span className="text-[10px] text-white/30 uppercase tracking-widest mb-1.5">{key.replace(/_/g, ' ')}</span>
                    <span className={`px-4 py-1.5 rounded-md text-sm font-bold border ${gradeColor} backdrop-blur-sm shadow-lg`}>
                        {value}
                    </span>
                </div>
            )
        }
        return (
            <div className="glass-panel p-4 h-full flex flex-col justify-center">
                <span className="text-[10px] text-white/30 uppercase tracking-widest mb-1">{key.replace(/_/g, ' ')}</span>
                <p className="text-white/90 font-medium">{value}</p>
            </div>
        );
    }

    // 6. Long Strings (Markdown)
    return (
        <div className="mt-2 glass-panel p-6 bg-white/5">
            <h3 className="text-sm font-medium text-white/40 uppercase tracking-widest mb-3">{key.replace(/_/g, ' ')}</h3>
            <div className="prose prose-invert prose-sm max-w-none prose-headings:font-light prose-p:text-white/80">
                <MarkdownRenderer content={value} />
            </div>
        </div>
    );
}
