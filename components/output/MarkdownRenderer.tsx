import ReactMarkdown from 'react-markdown'
import { cn } from "@/lib/utils"

interface MarkdownRendererProps {
    content: string
    className?: string
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
    return (
        <div className={cn("prose prose-invert max-w-none text-white/90", className)}>
            <ReactMarkdown>
                {content}
            </ReactMarkdown>
        </div>
    )
}
