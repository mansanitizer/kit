import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

interface RadioGroupProps {
    options: string[]
    value: string
    onChange: (value: string) => void
    disabled?: boolean
    label?: string
    orientation?: "horizontal" | "vertical"
}

export function RadioGroup({ options, value, onChange, disabled, label, orientation = "vertical" }: RadioGroupProps) {
    return (
        <div className={cn("space-y-3", disabled && "opacity-50 pointer-events-none")}>
            {label && <label className="text-sm font-medium text-white/80 block">{label}</label>}

            <div className={cn(
                "flex gap-3",
                orientation === "vertical" ? "flex-col" : "flex-row flex-wrap"
            )}>
                {options.map((option) => {
                    const isSelected = value === option
                    return (
                        <label
                            key={option}
                            className={cn(
                                "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all group",
                                isSelected
                                    ? "bg-indigo-500/10 border-indigo-500/50"
                                    : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                            )}
                        >
                            <div className="relative w-4 h-4">
                                <input
                                    type="radio"
                                    name={label} // naive grouping
                                    value={option}
                                    checked={isSelected}
                                    onChange={() => onChange(option)}
                                    className="sr-only"
                                    disabled={disabled}
                                />
                                <div className={cn(
                                    "w-4 h-4 rounded-full border transition-all",
                                    isSelected ? "border-indigo-400" : "border-white/30 group-hover:border-white/50"
                                )} />
                                <div className={cn(
                                    "absolute inset-0 w-2 h-2 m-auto rounded-full bg-indigo-400 transition-transform",
                                    isSelected ? "scale-100" : "scale-0"
                                )} />
                            </div>
                            <span className={cn("text-sm", isSelected ? "text-white" : "text-white/70")}>
                                {option}
                            </span>
                        </label>
                    )
                })}
            </div>
        </div>
    )
}
