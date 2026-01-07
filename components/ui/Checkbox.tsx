import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string
}

export function Checkbox({ className, label, checked, disabled, ...props }: CheckboxProps) {
    return (
        <label className={cn(
            "flex items-center gap-3 cursor-pointer group select-none",
            disabled && "opacity-50 cursor-not-allowed"
        )}>
            <div className="relative">
                <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={checked}
                    disabled={disabled}
                    {...props}
                />
                <div className={cn(
                    "w-5 h-5 rounded border bg-white/5 border-white/20 transition-all",
                    "peer-checked:bg-indigo-500 peer-checked:border-indigo-400",
                    "peer-focus:ring-2 peer-focus:ring-indigo-500/50",
                    "group-hover:border-white/40"
                )}>
                    <Check className={cn(
                        "w-3.5 h-3.5 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
                        "opacity-0 scale-50 transition-all",
                        checked && "opacity-100 scale-100"
                    )} strokeWidth={3} />
                </div>
            </div>
            {label && <span className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">{label}</span>}
        </label>
    )
}
