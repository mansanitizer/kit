import { RAGService } from "@/lib/rag"

const REFLECTOR_PROMPT = `
You are the "Reflector" — a background process in the Kit AI ecosystem.
Your job is to read a User <-> Tool interaction and extract **persistent facts** about the user.

**Rules:**
1. Only extract **enduring truths** (traits, preferences, goals, employment history, names).
2. Ignore transient context (e.g., "rewrite this email", "fix this typo").
3. Output strict JSON.
4. If nothing is worth saving, return an empty array.

**Input Format:**
User Input: ...
Tool Output: ...

**Output Schema:**
{
  "facts": [
    {
      "content": "User is a Senior PM at TechCorp",
      "category": "work",
      "confidence": 0.9
    }
  ]
}
`

export class ContextEngine {
    private rag = new RAGService()

    async retrieve(userId: string, query: string): Promise<string> {
        if (!userId || !query) return ""

        console.log(`[ContextEngine] Retrieving context for: ${query}`)
        const memories = await this.rag.searchMemories(userId, query, 5)

        if (memories.length === 0) return ""

        const contextBlock = memories.map((m: { content: string }) => `- ${m.content}`).join("\n")
        return `\n\n[[MEMORY CONTEXT]]\n${contextBlock}\n`
    }

    async reflect(userId: string, userQuery: string, toolOutput: any) {
        if (!userId) return

        const interactionText = `User Input: ${JSON.stringify(userQuery)}\nTool Output: ${JSON.stringify(toolOutput)}`

        // Call LLM (using simple fetch to OpenRouter here, duplicating run-tool logic slightly but cleaner to keep separate)
        // Ideally we abstract "callLLM" but for speed I'll inline a lightweight call.

        try {
            const apiKey = process.env.KIT_OPENROUTER_API_KEY;

            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "google/gemini-2.0-flash-lite-001", // Fast model for reflection
                    messages: [
                        { role: "system", content: REFLECTOR_PROMPT },
                        { role: "user", content: interactionText }
                    ],
                    response_format: { type: "json_object" }
                })
            })

            if (!response.ok) {
                console.error(`[ContextEngine] Reflector HTTP Error: ${response.status}`)
                return
            }

            const completion = await response.json()
            const content = completion.choices[0].message.content

            console.log("[ContextEngine] Raw Reflector Output:", content) // DEBUG LOG

            const data = JSON.parse(content)

            if (data.facts && Array.isArray(data.facts)) {
                for (const fact of data.facts) {
                    console.log(`[ContextEngine] Learned fact: ${fact.content}`)
                    await this.rag.storeMemory(userId, fact.content, fact.category, fact.confidence)
                }
            }

        } catch (err) {
            console.error("[ContextEngine] Reflection failed:", err)
        }
    }
}
