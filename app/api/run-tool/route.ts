import { NextRequest, NextResponse } from "next/server"
import { getToolBySlug } from "@/lib/tool-registry"
import { createServerClient } from "@/lib/supabase-server"
import { ProfileService } from "@/lib/profile-service"
import { ContextEngine } from "@/lib/context-engine"

export async function POST(req: NextRequest) {
    const supabase = createServerClient(); // Isolating 401 cause
    try {
        // PRODUCTION CREDENTIALS
        const apiKey = "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";

        const model = process.env.GENERATION_MODEL || "google/gemini-2.0-flash-lite-001"
        // console.log(`[RunTool] STARTING REQUEST. Key length: ${apiKey.length}`)

        const body = await req.json()
        const { toolSlug, input, sessionId } = body

        if (!toolSlug || !input) {
            return NextResponse.json({ error: "Missing toolSlug or input" }, { status: 400 })
        }

        // 1. Fetch Tool
        const tool = await getToolBySlug(toolSlug)
        if (!tool) {
            return NextResponse.json({ error: "Tool not found" }, { status: 404 })
        }

        // 1.5 Ensure Profile Exists & Retrieve Context
        let contextBlock = ""
        if (sessionId) {
            const profileService = new ProfileService()
            await profileService.ensureProfile(sessionId)

            // Context Retrieval
            const contextEngine = new ContextEngine()
            contextBlock = await contextEngine.retrieve(sessionId, JSON.stringify(input))
        }

        // 2. Construct Prompt
        const messages = [
            { role: "system", content: tool.system_prompt + contextBlock + "\n\nCRITICAL: Output strict JSON matching this schema:\n" + JSON.stringify(tool.output_schema) },
            { role: "user", content: JSON.stringify(input) }
        ]

        console.log("--- [LLM RAW INPUT MESSAGES] ---")
        console.log(JSON.stringify(messages, null, 2))
        console.log("--------------------------------")

        // 3. Call OpenRouter
        console.log(`[RunTool] Fetching OpenRouter...`)

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://kit.com", // Optional, for OpenRouter rankings
                "X-Title": "Kit AI"
            },
            body: JSON.stringify({
                model: model,
                messages: messages,
                response_format: { type: "json_object" }
            })
        })

        console.log(`[RunTool] Response Status: ${response.status}`)

        if (!response.ok) {
            const errorText = await response.text()
            console.error(`[RunTool] ERROR BODY: ${errorText}`)
            return NextResponse.json({ error: `OpenRouter Error: ${errorText}` }, { status: response.status })
        }

        const completion = await response.json()
        const outputContent = completion.choices[0].message.content

        console.log("\n------ [LLM RAW OUTPUT] ------")
        console.log(outputContent)
        console.log("------------------------------\n")

        const outputData = JSON.parse(outputContent)

        // 4. Log Interaction to Supabase (Async, fire and forget)
        // Note: In Next.js App Router, strictly awaiting is safer for serverless execution duration, 
        // but for speed we can try Promise.all or just await it. Awaiting is safer.
        try {
            const { error: dbError } = await supabase.from('interactions').insert({
                tool_slug: toolSlug,
                input_data: input,
                output_data: outputData,
                user_id: sessionId || null
            })

            if (dbError) {
                console.error("Failed to log interaction:", dbError)
            } else {
                console.log("[RunTool] Interaction logged to DB.")
            }

            // 5. Context Reflection (Fire and forget)
            if (sessionId) {
                const contextEngine = new ContextEngine()
                // We don't await this to keep the API fast (Next.js serverless considerations aside)
                contextEngine.reflect(sessionId, JSON.stringify(input), outputData).catch(err => console.error(err))
            }

        } catch (dbEx) {
            console.error("Exception logging into DB/Reflection:", dbEx)
        }

        return NextResponse.json(outputData)

    } catch (error: any) {
        console.error("Error running tool:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
