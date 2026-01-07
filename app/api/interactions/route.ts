import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const limit = parseInt(searchParams.get("limit") || "20")

        const { data, error } = await supabase
            .from("interactions")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(limit)

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ interactions: data })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
