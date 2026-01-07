import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
    try {
        const apiKey = "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";
        // if (!apiKey) return NextResponse.json({ error: "No API Key" }, { status: 500 })

        console.log("[DebugAuth] Testing OpenRouter...")
        console.log("[DebugAuth] Fetch is:", fetch.toString())
        console.log("[DebugAuth] Headers being sent:", JSON.stringify({
            "Authorization": `Bearer ${apiKey.substring(0, 10)}...`,
        }))

        // Simple model check
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "google/gemini-2.0-flash-lite-001",
                messages: [{ role: "user", content: "Hi" }]
            })
        })

        if (!response.ok) {
            const text = await response.text()
            console.error("[DebugAuth] Error Text:", text)
            console.error("[DebugAuth] Headers:", JSON.stringify([...response.headers.entries()]))
            return NextResponse.json({
                error: text,
                status: response.status,
                headers: Object.fromEntries(response.headers.entries())
            }, { status: response.status })
        }

        const data = await response.json()
        return NextResponse.json({ success: true, data })

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
