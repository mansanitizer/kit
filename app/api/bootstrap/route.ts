
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
    try {
        const { sessionId } = await req.json();

        if (!sessionId) {
            return NextResponse.json({ error: "Session ID required" }, { status: 400 });
        }

        const supabase = createServerClient({
            'x-session-id': sessionId
        });

        // 1. Check if user already has their own Tool Forge
        const { data: existing } = await supabase
            .from("tools")
            .select("id")
            .eq("user_id", sessionId)
            .eq("name", "Tool Forge User") // Check by name or maybe by a convention
            .maybeSingle();

        if (existing) {
            return NextResponse.json({ success: true, message: "User tool forge already exists" });
        }

        // 2. Fetch the Global Tool Forge
        const { data: globalForge, error: fetchError } = await supabase
            .from("tools")
            .select("*")
            .eq("slug", "tool-forge")
            .single();

        if (fetchError || !globalForge) {
            console.error("Failed to fetch global tool forge", fetchError);
            return NextResponse.json({ error: "Global Tool Forge not found" }, { status: 500 });
        }

        // 3. Create the User-Scoped Copy
        // We must ensure the slug is unique.
        const userSlug = `tool-forge-user-${sessionId.slice(0, 8)}`; // Shorten ID for cleaner slug

        const newTool = {
            slug: userSlug,
            name: "Tool Forge User",
            description: "Your personal, editable Tool Forge.",
            icon: globalForge.icon,
            color: "from-purple-600 to-indigo-600", // Distinguish it slightly? Or keep same? User asked for "exact copy". Let's keep it similar but maybe distinguishable.
            system_prompt: globalForge.system_prompt,
            input_schema: globalForge.input_schema,
            output_schema: globalForge.output_schema,
            model: globalForge.model,
            user_id: sessionId,
            schema_version: globalForge.schema_version
        };

        const { error: insertError } = await supabase
            .from("tools")
            .insert(newTool);

        if (insertError) {
            // Uniqueness error?
            console.error("Failed to create user tool forge", insertError);
            return NextResponse.json({ error: "Failed to provision user tool" }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: "Provisioned Tool Forge User" });

    } catch (e: any) {
        console.error("Bootstrap error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
