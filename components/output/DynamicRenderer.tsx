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

    // Resiliency: If layout is completely missing, generate one
    if (!layoutDSL || typeof layoutDSL !== 'string') {
        layoutDSL = generateDefaultLayout(schema, data);
    }

    // New Bracket-Optional Parser
    let rows: string[] = [];
    if (layoutDSL.includes("[[")) {
        // Strict matching for [[row]] format
        rows = Array.from(layoutDSL.matchAll(/\[\[(.*?)\]\]/g)).map(m => m[1].trim());
    } else {
        // Tolerant matching: Treat space or comma separated lists as sequential rows or one big row
        const potentialKeys = layoutDSL.split(/[\s,]+/).filter(k => k.length > 0);
        if (potentialKeys.length > 0) {
            // We treat each key as its own row/cell for maximal visibility
            rows = potentialKeys;
        }
    }

    if (rows.length === 0) {
        layoutDSL = generateDefaultLayout(schema, data);
        const fallbackMatches = layoutDSL.match(/\[\[(.*?)\]\]/g);
        if (fallbackMatches) {
            rows.push(...fallbackMatches.map(m => m.replace(/[\[\]]/g, '').trim()));
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
            {rows.map((rowStr, rowIndex) => {
                const keys = rowStr.split(",").map(k => k.trim()).filter(k => k.length > 0);

                // Filter out keys that don't resolve to any actual data
                const validKeys = keys.filter(key => {
                    const val = resolveValue(data, key);
                    return val !== undefined && val !== null && key !== '_layout';
                });

                if (validKeys.length === 0) return null;

                return (
                    <div key={rowIndex} className={cn("grid gap-6 items-start", getGridCols(validKeys.length))}>
                        {validKeys.map((key) => {
                            const value = resolveValue(data, key);
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

function resolveValue(data: any, path: string) {
    if (!path || path === '.') return undefined;
    const parts = path.split('.');
    let current = data;
    for (const part of parts) {
        if (current && typeof current === 'object' && part in current) {
            current = current[part];
        } else {
            return undefined;
        }
    }
    return current;
}

function resolveSchema(rootSchema: any, path: string) {
    if (!path || !rootSchema || !rootSchema.properties) return {};
    const parts = path.split('.');
    let current = rootSchema;
    for (const part of parts) {
        if (current?.properties?.[part]) {
            current = current.properties[part];
        } else if (current?.items?.properties?.[part]) {
            current = current.items.properties[part];
        } else {
            return {};
        }
    }
    return current;
}

function generateDefaultLayout(schema: any, data: any) {
    // If we have an output schema, use those properties first
    const schemaKeys = schema?.properties ? Object.keys(schema.properties).filter(k => k !== '_layout') : [];

    if (schemaKeys.length > 0) {
        return schemaKeys.map(k => `[[${k}]]`).join(" ");
    }

    // Otherwise, fallback to data keys but filter out inputs
    const dataKeys = Object.keys(data).filter(k => k !== '_layout');
    return dataKeys.map(k => `[[${k}]]`).join(" ");
}

function renderComponent(key: string, value: any, schema: any, allData: any): React.ReactNode {
    const label = schema.title || key.replace(/_/g, ' ');

    // 0. Manual Override via Schema Hint
    const componentType = schema['x-component'];
    if (componentType === 'metric') return <MetricCard label={label} value={value} unit={schema.unit} />;
    if (componentType === 'image') return <ImageDisplay src={value} alt={label} />;

    // 1. Image Detect
    // Improved detection: Check key name OR value prefix
    const isImageKey = ['image', 'img', 'photo', 'picture', 'screenshot', 'thumbnail'].some(k => key.toLowerCase().includes(k));
    const isBase64Image = typeof value === 'string' && (value.startsWith('data:image') || (value.length > 1000 && /^[A-Za-z0-9+/=]+$/.test(value) && isImageKey));

    if (isImageKey || isBase64Image) {
        // If it's a raw base64 string without prefix, add it (assuming png/jpeg based on key or default)
        let src = value;
        if (typeof value === 'string' && !value.startsWith('data:') && !value.startsWith('http')) {
            src = `data:image/png;base64,${value}`;
        }
        return <ImageDisplay src={src} alt={label} />;
    }

    // 2. Metrics (Enhanced)
    if (typeof value === 'number') {
        let unit = schema?.unit || "";
        // Heuristic fallback for common units
        if (!unit) {
            const lowKey = key.toLowerCase();
            if (lowKey.includes('cal') || lowKey.includes('energy')) unit = 'kcal';
            else if (['protein', 'carbs', 'fat', 'fiber', 'sugar'].some(k => lowKey.includes(k))) unit = 'g';
            else if (lowKey.includes('score') || lowKey.includes('confidence') || lowKey.includes('pct') || lowKey.includes('percent')) unit = schema.unit || (lowKey.includes('pct') ? '%' : '/ 100');
        }

        return <MetricCard label={label} value={value} unit={unit} />;
    }

    // 3. Arrays
    if (Array.isArray(value)) {
        if (value.length === 0) return null;

        if (typeof value[0] === 'string') {
            return (
                <div className="glass-panel p-5 h-full border-l-4 border-l-yellow-500/50 bg-yellow-500/5">
                    <h4 className="text-yellow-200/80 font-medium mb-3 text-[10px] uppercase tracking-[0.2em]">{label}</h4>
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
        return (
            <div className="space-y-2">
                <h4 className="text-[10px] text-white/30 uppercase tracking-[0.2em] ml-1">{label}</h4>
                <DataTable data={value} />
            </div>
        );
    }

    // 4. Objects (Polymorphic: Detect if it's a Macro/Metric group)
    if (typeof value === 'object' && value !== null) {
        const objectKeys = Object.keys(value);
        const isMetricGroup = objectKeys.every(k => typeof value[k] === 'number');

        if (isMetricGroup) {
            return (
                <div className="space-y-3">
                    <h4 className="text-[10px] text-white/30 uppercase tracking-[0.2em] ml-1">{label}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {objectKeys.map(k => (
                            <MetricCard
                                key={k}
                                label={k}
                                value={value[k]}
                                unit={schema.properties?.[k]?.unit || (['protein', 'carbs', 'fat'].includes(k) ? 'g' : '')}
                            />
                        ))}
                    </div>
                </div>
            )
        }

        return (
            <div className="space-y-2">
                <h4 className="text-[10px] text-white/30 uppercase tracking-[0.2em] ml-1">{label}</h4>
                <DefaultJSONRenderer data={value} />
            </div>
        );
    }

    // 5. Short Strings (Status/Rating Types)
    if (typeof value === 'string' && value.length < 100) {
        const titleKeys = ['food_name', 'title', 'name', 'heading'];
        if (titleKeys.some(tk => key.toLowerCase().includes(tk))) {
            return (
                <div className="py-2">
                    <h2 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 tracking-tight leading-none">
                        {value}
                    </h2>
                </div>
            );
        }

        const semanticKeys = ['rating', 'grade', 'verdict', 'risk', 'status', 'level'];
        if (semanticKeys.some(sk => key.toLowerCase().includes(sk))) {
            const lowerVal = value.toLowerCase();
            let colorClass = 'text-white border-white/30 bg-white/10';

            if (['a', 'high', 'pass', 'low', 'safe', 'good'].some(v => lowerVal.includes(v))) {
                // Determine if 'high' is good or bad based on key
                const isBadHigh = key.toLowerCase().includes('risk');
                colorClass = isBadHigh
                    ? 'text-rose-400 border-rose-500/30 bg-rose-500/10'
                    : 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
            } else if (['b', 'moderate', 'medium', 'warning'].some(v => lowerVal.includes(v))) {
                colorClass = 'text-amber-400 border-amber-500/30 bg-amber-500/10';
            } else if (['c', 'd', 'f', 'bad', 'fail', 'critical'].some(v => lowerVal.includes(v))) {
                colorClass = 'text-rose-400 border-rose-500/30 bg-rose-500/10';
            }

            return (
                <div className="flex flex-col items-start justify-center h-full min-h-[60px]">
                    <span className="text-[10px] text-white/30 uppercase tracking-[0.2em] mb-2">{label}</span>
                    <span className={cn("px-4 py-1.5 rounded-md text-sm font-bold border backdrop-blur-sm shadow-lg", colorClass)}>
                        {value}
                    </span>
                </div>
            )
        }

        return (
            <div className="glass-panel p-4 h-full flex flex-col justify-center border-white/5">
                <span className="text-[10px] text-white/30 uppercase tracking-[0.2em] mb-1.5">{label}</span>
                <p className="text-white/90 font-medium leading-relaxed">{value}</p>
            </div>
        );
    }

    // 6. Long Strings (Markdown)
    return (
        <div className="glass-panel p-6 bg-white/5 border-white/10 hover:border-white/20 transition-colors">
            <h3 className="text-[10px] font-medium text-white/40 uppercase tracking-[0.2em] mb-4">{label}</h3>
            <div className="prose prose-invert prose-sm max-w-none prose-p:text-white/80 prose-p:leading-relaxed">
                <MarkdownRenderer content={value} />
            </div>
        </div>
    );
}
