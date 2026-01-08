import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
        return NextResponse.json({ error: "Missing userId" }, { status: 400 })
    }

    const supabase = createServerClient()
    const { data, error } = await supabase
        .from('user_wallpapers')
        .select('*')
        .eq('user_id', userId)
        .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "Row not found"
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || { wallpaper_data: null })
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { userId, wallpaperData, mimeType } = body

        if (!userId || !wallpaperData || !mimeType) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        // Basic validation on size (though client should handle this mostly)
        // 1MB = ~1.33MB base64. Client allows 2MB files (~2.7MB base64).
        // Set limit to 4,000,000 chars (~3MB) to be safe.
        if (wallpaperData.length > 4000000) {
            return NextResponse.json({ error: "Wallpaper too large" }, { status: 400 })
        }

        const supabase = createServerClient()
        const { error } = await supabase
            .from('user_wallpapers')
            .upsert({
                user_id: userId,
                wallpaper_data: wallpaperData,
                mime_type: mimeType,
                updated_at: new Date().toISOString()
            })

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const userId = searchParams.get('userId')

        if (!userId) {
            return NextResponse.json({ error: "Missing userId" }, { status: 400 })
        }

        const supabase = createServerClient()
        const { error } = await supabase
            .from('user_wallpapers')
            .delete()
            .eq('user_id', userId)

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
