import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

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
