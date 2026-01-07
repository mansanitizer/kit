"use client"

import { useState, useEffect } from "react"
import { Tool } from "@/types/tool"
import { Button } from "@/components/ui/Button"
import { GlassCard } from "@/components/ui/GlassCard"
import { DynamicRenderer } from "@/components/output/DynamicRenderer"
import { DynamicForm } from "@/components/input/DynamicForm"

export function ToolInterface({ tool }: { tool: Tool }) {
    const [input, setInput] = useState<Record<string, any>>({})
    const [output, setOutput] = useState<Record<string, any> | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [sessionId, setSessionId] = useState<string | null>(null)

    useEffect(() => {
        const stored = localStorage.getItem("kit_session_id")
        if (stored) {
            setSessionId(stored)
        } else {
            const newId = crypto.randomUUID()
            localStorage.setItem("kit_session_id", newId)
            setSessionId(newId)
        }
    }, [])

    const handleSubmit = async () => {
        setLoading(true)
        setError(null)
        setOutput(null)

        try {
            const response = await fetch("/api/run-tool", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ toolSlug: tool.slug, input, sessionId }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Failed to run tool")
            }

            setOutput(data)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-8">
            {/* Input Section - NOW GENERIC */}
            <GlassCard>
                <div className="space-y-6">
                    <DynamicForm
                        schema={tool.input_schema}
                        value={input}
                        onChange={setInput}
                        disabled={loading}
                    />

                    <Button onClick={handleSubmit} loading={loading} className="w-full">
                        Run {tool.name}
                    </Button>
                </div>
            </GlassCard>

            {/* Error State */}
            {error && (
                <div className="p-4 rounded-lg bg-red-500/20 border border-red-500/30 text-red-200">
                    Error: {error}
                </div>
            )}

            {/* Output Section - ALREADY GENERIC */}
            {output && (
                <GlassCard>
                    <DynamicRenderer schema={tool.output_schema} data={{ ...input, ...output }} />
                </GlassCard>
            )}
        </div>
    )
}
