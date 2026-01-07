import { cn } from "@/lib/utils"
import { Check, X } from "lucide-react"

interface MultiSelectProps {
    options: string[]
    value: string[] // Array of selected strings
    onChange: (value: string[]) => void
    disabled?: boolean
    label?: string
}

export function MultiSelect({ options, value = [], onChange, disabled, label }: MultiSelectProps) {

    const toggleOption = (option: string) => {
        if (value.includes(option)) {
            onChange(value.filter(v => v !== option))
        } else {
            onChange([...value, option])
        }
    }

    return (
        <div className={cn("space-y-3", disabled && "opacity-50 pointer-events-none")}>
            {label && <label className="text-sm font-medium text-white/80 block">{label}</label>}

            <div className="flex flex-wrap gap-2">
                {options.map((option) => {
                    const isSelected = value.includes(option)
                    return (
                        <button
                            key={option}
                            type="button"
                            onClick={() => toggleOption(option)}
                            className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                                isSelected
                                    ? "bg-indigo-500 text-white border-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.4)]"
                                    : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white hover:border-white/30"
                            )}
                            disabled={disabled}
                        >
                            {isSelected && <Check className="w-3 h-3" />}
                            {option}
                        </button>
                    )
                })}
            </div>
            {value.length === 0 && (
                <p className="text-[10px] text-white/30 italic">No items selected</p>
            )}
        </div>
    )
}
