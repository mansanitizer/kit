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

export async function getAllTools(): Promise<Tool[]> {
    const { data, error } = await supabase
        .from("tools")
        .select("*")
        .order('name', { ascending: true })

    if (error) {
        console.error("Error fetching tools:", error)
        return []
    }

    return data as Tool[]
}
