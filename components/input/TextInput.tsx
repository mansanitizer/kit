import { cn } from "@/lib/utils"

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string
}

export function TextInput({ className, label, ...props }: TextInputProps) {
    return (
        <div className="space-y-2">
            {label && <label className="text-sm font-medium text-white/80">{label}</label>}
            <input
                className={cn("glass-input", className)}
                {...props}
            />
        </div>
    )
}
