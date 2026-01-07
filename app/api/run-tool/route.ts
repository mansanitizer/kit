import { NextRequest, NextResponse } from "next/server"
import { getToolBySlug } from "@/lib/tool-registry"
import { createServerClient } from "@/lib/supabase-server"
import { ProfileService } from "@/lib/profile-service"
import { ContextEngine } from "@/lib/context-engine"

export async function POST(req: NextRequest) {
    const supabase = createServerClient();
    try {
        const apiKey = process.env.KIT_OPENROUTER_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "Missing KIT_OPENROUTER_API_KEY in environment" }, { status: 500 })
        }



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

        const model = tool.model || process.env.GENERATION_MODEL || "google/gemini-2.0-flash-lite-001"

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

        // 3. Call OpenRouter
        console.log("Using Model:", model)
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://kit.com",
                "X-Title": "Kit AI"
            },
            body: JSON.stringify({
                model: model,
                messages: messages,
                response_format: { type: "json_object" }
            })
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error(`[RunTool] OpenRouter Error: ${errorText}`)
            return NextResponse.json({ error: `OpenRouter Error: ${errorText}` }, { status: response.status })
        }

        const completion = await response.json()
        const outputContent = completion.choices[0].message.content
        const outputData = JSON.parse(outputContent)

        // 3.5 Robust Layout Injection (Server-side)
        if (!outputData._layout) {
            // Attempt to find layout pattern in system prompt or just generate a default
            const layoutRegex = /LAYOUT INSTRUCTIONS:.*?(?:Return a _layout field: )?(\[\[.*?\]\](?:\s+\[\[.*?\]\])*)/i;
            const match = tool.system_prompt.match(layoutRegex);
            if (match && match[1]) {
                outputData._layout = match[1];
            }
        }

        // 4. Log Interaction to Supabase
        try {
            const { error: dbError } = await supabase.from('interactions').insert({
                tool_slug: toolSlug,
                input_data: input,
                output_data: outputData,
                user_id: sessionId || null
            })

            if (dbError) {
                console.error("Failed to log interaction:", dbError)
            }

            // 5. Context Reflection (Fire and forget)
            if (sessionId) {
                const contextEngine = new ContextEngine()
                contextEngine.reflect(sessionId, JSON.stringify(input), outputData).catch(err => console.error(err))
            }

            // --- SPECIAL HANDLER: Tool Forge ---
            if (toolSlug === 'tool-forge') {
                // The outputData IS the tool definition.
                // We simply need to save it to the 'tools' table.
                const newTool = {
                    id: crypto.randomUUID(),
                    slug: outputData.slug,
                    name: outputData.name,
                    description: outputData.description || "",
                    icon: outputData.icon || "Zap",
                    system_prompt: outputData.system_prompt,
                    input_schema: outputData.input_schema || {},
                    output_schema: outputData.output_schema || {},
                    schema_version: 1,
                    created_at: new Date().toISOString(),
                    color: outputData.color || "from-gray-500 to-gray-700",
                    model: outputData.model || process.env.GENERATION_MODEL || "google/gemini-2.0-flash-lite-001"
                }

                const { error: insertError } = await supabase.from('tools').insert(newTool)

                if (insertError) {
                    console.error("ToolForge Auto-Save Error:", insertError)
                    // We don't fail the request, but we might want to signal error in the output?
                    // For now, let's assume if it fails, the user will see it when they try to find it.
                    // But the prompt wants specific success/fail UI.

                    // Let's flag the output so frontend knows
                    outputData._tool_forge_status = "error"
                    outputData._tool_forge_error = insertError.message
                } else {
                    outputData._tool_forge_status = "success"
                }
            }
            // -----------------------------------

        } catch (dbEx) {
            console.error("Exception logging into DB/Reflection:", dbEx)
        }

        return NextResponse.json(outputData)

    } catch (error: any) {
        console.error("Error running tool:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
