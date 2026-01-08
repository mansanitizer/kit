import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
    const supabase = createServerClient();
    const sessionId = req.headers.get("x-session-id");

    const { data, error } = await supabase
        .from("recycle_bin")
        .select("*")
        .or(`user_id.is.null,user_id.eq.${sessionId}`) // Show global + own
        .order("deleted_at", { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ items: data });
}
