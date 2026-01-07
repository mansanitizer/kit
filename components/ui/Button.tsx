import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "ghost" | "danger"
    size?: "sm" | "md" | "lg"
    loading?: boolean
}

export function Button({
    className,
    variant = "primary",
    size = "md",
    loading,
    children,
    disabled,
    ...props
}: ButtonProps) {
    return (
        <button
            className={cn(
                "glass-button flex items-center justify-center gap-2 font-medium",
                loading && "opacity-70 cursor-not-allowed",
                variant === "primary" && "bg-white/10 hover:bg-white/20 border-white/20",
                variant === "danger" && "bg-red-500/20 hover:bg-red-500/30 border-red-500/30 text-red-100",
                size === "sm" && "text-sm px-3 py-1",
                size === "lg" && "text-lg px-6 py-3",
                className
            )}
            disabled={disabled || loading}
            {...props}
        >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {children}
        </button>
    )
}
