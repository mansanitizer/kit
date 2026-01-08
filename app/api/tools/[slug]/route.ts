import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;
    const sessionId = req.headers.get("x-session-id");

    const supabase = createServerClient({
        'x-session-id': sessionId || ''
    });

    const { data: tool, error } = await supabase
        .from("tools")
        .select("*")
        .eq("slug", slug)
        .single();

    if (error) {
        return NextResponse.json({ error: "Tool not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json(tool);
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;
    const sessionId = req.headers.get("x-session-id");
    const body = await req.json();

    const supabase = createServerClient({
        'x-session-id': sessionId || ''
    });

    // 1. Verify ownership (or global status - global tools shouldn't be edited by users usually, but for now assuming user edits their own)
    const { data: tool } = await supabase
        .from("tools")
        .select("user_id")
        .eq("slug", slug)
        .single();

    if (!tool) {
        return NextResponse.json({ error: "Tool not found" }, { status: 404 });
    }

    if (tool.user_id === null) {
        // Global tools are protected
        return NextResponse.json({ error: "Cannot modify global system tools." }, { status: 403 });
    }

    // 2. Update
    // Filter allowed fields
    const { name, description, icon, color, system_prompt, input_schema, output_schema, model } = body;
    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (icon !== undefined) updates.icon = icon;
    if (color !== undefined) updates.color = color;
    if (system_prompt !== undefined) updates.system_prompt = system_prompt;
    if (input_schema !== undefined) updates.input_schema = input_schema;
    if (output_schema !== undefined) updates.output_schema = output_schema;
    if (model !== undefined) updates.model = model;

    const { data: updatedTool, error } = await supabase
        .from("tools")
        .update(updates)
        .eq("slug", slug)
        .eq("user_id", sessionId) // Ensure RLS via user_id check just in case
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(updatedTool);
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;
    const sessionId = req.headers.get("x-session-id");
    console.log(`[DELETE Tool] Slug: ${slug}, SessionID: ${sessionId}`);

    // Pass session ID to Supabase client to satisfy RLS (if relying on x-session-id policy)
    const supabase = createServerClient({
        'x-session-id': sessionId || ''
    });

    // 1. Check if tool is Global (user_id is null) -- ALLOWED because Global tools are visible to all.
    // If it's another user's tool, we won't find it (404), which is good privacy.
    const { data: tool } = await supabase
        .from("tools")
        .select("user_id")
        .eq("slug", slug)
        .single();

    if (tool && tool.user_id === null) {
        return NextResponse.json({ error: "Cannot delete global system tools." }, { status: 403 });
    }

    // 2. Try Delete via RPC (Atomic & Secure)
    // Wait, if we use standard RLS DELETE, we don't strictly need RPC unless there are side effects. 
    // The previous implementation used an RPC. I will stick to it for DELETE.
    const { data: success, error: rpcError } = await supabase.rpc('delete_tool_secure', {
        target_slug: slug,
        request_user_id: sessionId
    });

    if (rpcError) {
        console.error("RPC Error:", rpcError);
        return NextResponse.json({ error: rpcError.message }, { status: 500 });
    }

    if (!success) {
        return NextResponse.json({ error: "Tool not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
}
