import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { Tool } from "@/types/tool"

// Note: In a real app, this should be protected by Admin Auth.
// For now, we assume it's an internal protected route or dev-only.

export async function POST(req: NextRequest) {
    const supabase = createServerClient()

    try {
        const body = await req.json()
        const { slug, name, description, icon, system_prompt, input_schema, output_schema, color, model } = body

        // Basic Validation
        if (!slug || !name || !system_prompt) {
            return NextResponse.json({ error: "Missing required fields (slug, name, system_prompt)" }, { status: 400 })
        }

        // Check if slug exists to get ID if needed, or just upsert
        const { data: existing } = await supabase.from('tools').select('id').eq('slug', slug).single()

        const newTool: Tool = {
            id: existing?.id || crypto.randomUUID(),
            slug,
            name,
            description: description || "",
            icon: icon || "Zap",
            system_prompt,
            input_schema: input_schema || {},
            output_schema: output_schema || {},
            schema_version: 1,
            created_at: new Date().toISOString(),
            color: color || "from-gray-500 to-gray-700",
            model: model || process.env.GENERATION_MODEL || "google/gemini-2.0-flash-lite-001"
        }

        const { error } = await supabase.from('tools').upsert(newTool)

        if (error) {
            console.error("DB Insert Error:", error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, tool: newTool })

    } catch (error: any) {
        console.error("API Error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
