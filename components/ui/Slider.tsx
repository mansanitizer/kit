import * as React from "react"
import { cn } from "@/lib/utils"

interface SliderProps {
    min: number
    max: number
    step?: number
    value: number
    onChange: (value: number) => void
    disabled?: boolean
    label?: string
    unit?: string
}

export function Slider({ min, max, step = 1, value, onChange, disabled, label, unit }: SliderProps) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(Number(e.target.value))
    }

    const percentage = ((value - min) / (max - min)) * 100

    return (
        <div className={cn("space-y-3", disabled && "opacity-50 pointer-events-none")}>
            <div className="flex justify-between items-center">
                {label && <label className="text-sm font-medium text-white/80">{label}</label>}
                <span className="text-xs font-mono text-white/60 bg-white/5 px-2 py-1 rounded">
                    {value} {unit}
                </span>
            </div>

            <div className="relative w-full h-2 rounded-full bg-white/10">
                <div
                    className="absolute h-full rounded-full bg-indigo-500"
                    style={{ width: `${percentage}%` }}
                />
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={handleChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={disabled}
                />
                <div
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg border border-indigo-500/50 pointer-events-none"
                    style={{ left: `calc(${percentage}% - 8px)` }}
                />
            </div>

            <div className="flex justify-between text-[10px] text-white/30 font-mono">
                <span>{min}</span>
                <span>{max}</span>
            </div>
        </div>
    )
}
