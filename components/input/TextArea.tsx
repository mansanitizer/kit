import { cn } from "@/lib/utils"

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string
}

export function TextArea({ className, label, ...props }: TextAreaProps) {
    return (
        <div className="space-y-2">
            {label && <label className="text-sm font-medium text-white/80">{label}</label>}
            <textarea
                className={cn("glass-input min-h-[100px]", className)}
                {...props}
            />
        </div>
    )
}
