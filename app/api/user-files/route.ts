import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const sessionId = searchParams.get("sessionId");

        const supabase = createServerClient();

        // Check for content retrieval
        const fileId = searchParams.get("id");
        const action = searchParams.get("action");

        if (action === "content" && fileId) {
            let contentQuery = supabase.from('user_files').select('content, file_type, filename').eq('id', fileId);

            // Security check: ensure user owns file or it is shared (user_id is null)
            if (sessionId) {
                contentQuery = contentQuery.or(`user_id.eq.${sessionId},user_id.is.null`);
            } else {
                contentQuery = contentQuery.is('user_id', null);
            }

            const { data: file, error } = await contentQuery.single();

            if (error || !file) {
                return NextResponse.json({ error: "File not found or access denied" }, { status: 404 });
            }

            return NextResponse.json({
                content: file.content,
                type: file.file_type,
                filename: file.filename
            });
        }

        // Fetch files: either owned by sessionId OR shared (user_id is null)
        let query = supabase.from('user_files').select('id, filename, file_type, created_at, char_count');

        if (sessionId) {
            query = query.or(`user_id.eq.${sessionId},user_id.is.null`);
        } else {
            query = query.is('user_id', null);
        }

        const { data: files, error } = await query.order('created_at', { ascending: false });

        if (error) {
            console.error("[UserFiles] DB Error:", error);
            return NextResponse.json({ error: "Failed to fetch files" }, { status: 500 });
        }

        return NextResponse.json({
            files: files.map(f => ({
                id: f.id,
                filename: f.filename,
                type: f.file_type,
                size: f.char_count, // rough proxy for size/relevance
                created_at: f.created_at
            }))
        });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
