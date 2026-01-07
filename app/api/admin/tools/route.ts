import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"

export async function POST(req: NextRequest) {
    const adminKey = process.env.ADMIN_KEY
    const requestKey = req.headers.get("x-admin-key")

    if (!adminKey || requestKey !== adminKey) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const body = await req.json()
        const { id, slug, name, description, icon, system_prompt, input_schema, output_schema, schema_version, created_at, color } = body

        if (!slug || !name || !system_prompt) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        const supabase = createServerClient()

        const { data, error } = await supabase.from('tools').upsert({
            id,
            slug,
            name,
            description,
            icon,
            system_prompt,
            input_schema,
            output_schema,
            schema_version,
            created_at,
            color
        }, { onConflict: 'slug' }).select()

        if (error) {
            console.error("Supabase Error:", error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, tool: data })
    } catch (error: any) {
        console.error("API Error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
