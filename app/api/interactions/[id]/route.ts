import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { moveToRecycleBin } from "@/lib/recycle-bin";

// Supporting DELETE by ID
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    // 1.5 Check Ownership
    const sessionId = req.headers.get("x-session-id");
    // Force recompile: 123
    console.log(`[DELETE Interaction] ID: ${id}, SessionID: ${sessionId}`);

    // Pass session ID to Supabase client for potential RLS
    const supabase = createServerClient({
        'x-session-id': sessionId || ''
    });

    // 2. Try Delete via RPC (Atomic & Secure)
    // We attempt to delete solely based on ID + UserID match.
    // This bypasses RLS "select" issues by running as Security Definer on the server.
    const { data: success, error: rpcError } = await supabase.rpc('delete_interaction_secure', {
        target_id: id,
        request_user_id: sessionId
    });

    if (rpcError) {
        console.error("RPC Error:", rpcError);
        return NextResponse.json({ error: rpcError.message }, { status: 500 });
    }

    if (!success) {
        return NextResponse.json({ error: "Interaction not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
}
