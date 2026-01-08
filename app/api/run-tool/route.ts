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
        console.log(`[RunTool] Slug: ${toolSlug}, SessionId: ${sessionId || 'NULL'}`);

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

            // 1.7 Resolve File Attachments (@@filename)
            // Look for @@filename in the input string
            const inputString = JSON.stringify(input);
            const fileMatches = [...inputString.matchAll(/@@([\w\-. ]+)/g)];
            const uniqueFilenames = [...new Set(fileMatches.map(m => m[1]))];

            if (uniqueFilenames.length > 0) {
                console.log(`[RunTool] Found attachments: ${uniqueFilenames.join(", ")}`);
                const { data: files } = await supabase
                    .from('user_files')
                    .select('filename, content, file_type')
                    .in('filename', uniqueFilenames)
                    .or(`user_id.eq.${sessionId},user_id.is.null`);

                if (files && files.length > 0) {
                    contextBlock += "\n\n=== ATTACHED FILES ===\n";
                    for (const f of files) {
                        const label = f.file_type === 'image' ? `[Image Description: ${f.filename}]` : `[File: ${f.filename}]`;
                        contextBlock += `${label}\n${f.content}\n\n`;
                    }
                    contextBlock += "======================\n";
                }
            }
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
            if (toolSlug.startsWith('tool-forge')) {
                // The outputData IS the tool definition.
                // 1. Check if tool exists to handle updates gracefully (avoid duplicate slug error)
                const { data: existingTool } = await supabase
                    .from('tools')
                    .select('id')
                    .eq('slug', outputData.slug)
                    .maybeSingle();

                const toolId = existingTool?.id || crypto.randomUUID();

                const newTool = {
                    id: toolId,
                    slug: outputData.slug,
                    name: outputData.name,
                    description: outputData.description || "",
                    icon: outputData.icon || "Zap",
                    system_prompt: outputData.system_prompt,
                    input_schema: outputData.input_schema || {},
                    output_schema: outputData.output_schema || {},
                    schema_version: 1,
                    // If updating, ideally we preserve created_at, but for now refreshing it is acceptable as "last saved"
                    // or we could conditionally add it. Let's just set it to now to indicate revision.
                    created_at: new Date().toISOString(),
                    color: outputData.color || "from-gray-500 to-gray-700",
                    model: outputData.model || process.env.GENERATION_MODEL || "google/gemini-2.0-flash-lite-001",
                    user_id: sessionId || null
                }

                // Upsert ensures we update if exists (using the retrieved ID to avoid PK conflict) 
                // or insert if new.
                const { error: saveError } = await supabase.from('tools').upsert(newTool)

                if (saveError) {
                    console.error("ToolForge Auto-Save Error:", saveError)
                    outputData._tool_forge_status = "error"
                    outputData._tool_forge_error = saveError.message
                } else {
                    console.log(`[ToolForge] creating/updating tool: ${newTool.slug} (${newTool.id})`);
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
