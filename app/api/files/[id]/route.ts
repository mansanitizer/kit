import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { moveToRecycleBin } from "@/lib/recycle-bin";

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = createServerClient();
    const { id } = await params;

    // 1. Fetch the file to backup data
    const { data: file, error: fetchError } = await supabase
        .from("user_files")
        .select("*")
        .eq("id", id)
        .single();

    if (fetchError || !file) {
        return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // 2. Move to Recycle Bin
    const recycleSuccess = await moveToRecycleBin(
        "file",
        file.id,
        file.filename,
        file,
        file.user_id
    );

    if (!recycleSuccess) {
        return NextResponse.json(
            { error: "Failed to move file to recycle bin" },
            { status: 500 }
        );
    }

    // 3. Hard Delete
    // Note: RLS might prevent deletion if not configured, but our key is nuclear for now or owner-based
    const { error: deleteError } = await supabase
        .from("user_files")
        .delete()
        .eq("id", file.id);

    if (deleteError) {
        return NextResponse.json(
            { error: `Failed to delete file: ${deleteError.message}` },
            { status: 500 }
        );
    }

    return NextResponse.json({ success: true });
}
