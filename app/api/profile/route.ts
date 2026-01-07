import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

// GET Profile
export async function GET(req: NextRequest) {
    try {
        // For now, we fetch the first profile locally since we lack Auth context.
        // In future: .eq('user_id', authUser.id)
        const { data, error } = await supabase
            .from("user_profiles")
            .select("*")
            .single()

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows typically
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ profile: data || null })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// UPDATE Profile
export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { summary, traits } = body

        // Upsert logic. Since we don't have a user ID from auth, we might need to rely on a fixed dummy ID for MVP
        // OR we just insert a new one if empty.
        // Let's grab the existing one first.

        let { data: existing } = await supabase.from("user_profiles").select("user_id").single()

        const payload: any = {
            updated_at: new Date().toISOString()
        }
        if (summary) payload.summary = summary
        if (traits) payload.traits = traits

        let result;

        if (existing) {
            result = await supabase
                .from("user_profiles")
                .update(payload)
                .eq("user_id", existing.user_id)
                .select()
                .single()
        } else {
            // Create new anonymous profile
            result = await supabase
                .from("user_profiles")
                .insert(payload)
                .select()
                .single()
        }

        if (result.error) {
            return NextResponse.json({ error: result.error.message }, { status: 500 })
        }

        return NextResponse.json({ profile: result.data })

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
