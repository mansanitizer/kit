import { supabase } from "./supabase"
import { Tool } from "@/types/tool"

export async function getToolBySlug(slug: string): Promise<Tool | null> {
    const { data, error } = await supabase
        .from("tools")
        .select("*")
        .eq("slug", slug)
        .single()

    if (error) {
        console.error("Error fetching tool:", error)
        return null
    }

    return data as Tool
}

export async function getAllTools(userId?: string): Promise<Tool[]> {
    let query = supabase
        .from("tools")
        .select("*")
        .order('name', { ascending: true })

    if (userId) {
        // Show Global (null) OR User's (userId)
        query = query.or(`user_id.is.null,user_id.eq.${userId}`)
    } else {
        // Default to global only if no user? Or maybe all?
        // For backward compatibility let's just show global
        query = query.is('user_id', null)
    }

    const { data, error } = await query

    if (error) {
        console.error("Error fetching tools:", error)
        return []
    }

    return data as Tool[]
}
