export type Tool = {
    id: string
    slug: string
    name: string
    description: string
    icon?: string
    color?: string
    system_prompt: string
    input_schema: Record<string, any>
    output_schema: Record<string, any>
    schema_version?: number
    created_at?: string
    model?: string
    user_id?: string | null
}
