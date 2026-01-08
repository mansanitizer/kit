import { createServerClient } from "./supabase-server"

const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || "openai/text-embedding-3-small"
const OPENROUTER_API_KEY = process.env.KIT_OPENROUTER_API_KEY;

export class RAGService {
    private supabase = createServerClient()

    async generateEmbedding(text: string): Promise<number[]> {
        console.log(`[RAG] Generating embedding for: "${text.substring(0, 50)}..."`)

        try {
            const response = await fetch("https://openrouter.ai/api/v1/embeddings", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://kit.com",
                    "X-Title": "Kit AI"
                },
                body: JSON.stringify({
                    model: EMBEDDING_MODEL,
                    input: text
                })
            })

            if (!response.ok) {
                const err = await response.text()
                console.error(`[RAG] Embedding Error: ${err}`)
                throw new Error(`Embedding failed: ${err}`)
            }

            const data = await response.json()
            return data.data[0].embedding
        } catch (error) {
            console.error("[RAG] Failed to generate embedding:", error)
            return [] // Fail gracefully or throw?
        }
    }

    async storeMemory(userId: string, content: string, category: string = "general", importance: number = 0.5) {
        if (!content || !userId) return

        const embedding = await this.generateEmbedding(content)
        if (embedding.length === 0) return

        const { error } = await this.supabase.from('memory_embeddings').insert({
            user_id: userId,
            content: content,
            embedding: embedding,
            category: category,
            importance: importance
        })

        if (error) console.error("[RAG] Failed to store memory:", error)
        else console.log("[RAG] Memory stored.")
    }

    async getMemories(userId: string) {
        if (!userId) return []

        const { data, error } = await this.supabase
            .from('memory_embeddings')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })

        if (error) {
            console.error("[RAG] Failed to fetch memories:", error)
            return []
        }
        return data
    }

    async deleteMemory(id: string, userId: string) {
        if (!id || !userId) return

        const { error } = await this.supabase
            .from('memory_embeddings')
            .delete()
            .eq('id', id)
            .eq('user_id', userId)

        if (error) console.error("[RAG] Failed to delete memory:", error)
    }

    async updateMemory(id: string, userId: string, content: string, category: string, importance: number) {
        // For vector stores, usually it's better to regenerate embedding.
        // So we can just update content and regenerate embedding.
        const embedding = await this.generateEmbedding(content)
        if (embedding.length === 0) return

        const { error } = await this.supabase
            .from('memory_embeddings')
            .update({
                content,
                category,
                importance,
                embedding
            })
            .eq('id', id)
            .eq('user_id', userId)

        if (error) console.error("[RAG] Failed to update memory:", error)
    }

    async searchMemories(userId: string, query: string, limit: number = 5) {
        if (!query || !userId) return []

        const embedding = await this.generateEmbedding(query)
        if (embedding.length === 0) return []

        // RPC call to match_documents (standard Supabase vector search pattern)
        // or direct query if possible. Usually need an RPC.
        // Let's assume we use the standard 'match_memories' RPC or similar if created.
        // If RPC doesn't exist, we can't search easily without raw SQL.
        // For now, I'll attempt a direct select if Supabase JS supports it, but usually it requires .rpc()

        // Let's use RPC 'match_memories' and WE MUST CREATE IT.
        console.log(`[RAG] Searching memories for user: ${userId}`)
        const { data, error } = await this.supabase.rpc('match_memories', {
            query_embedding: embedding,
            match_threshold: 0.3, // Lowered from 0.5 to catch more results (typos etc)
            match_count: limit,
            filter_user_id: userId
        })

        if (error) {
            console.error("[RAG] Search failed:", error)
            return []
        }

        console.log(`[RAG] Found ${data?.length || 0} memories.`)
        return data || []
    }
}
