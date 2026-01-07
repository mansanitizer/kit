# 🤖 Mission Brief: Build "Kit" (The AI Superapp)

You are tasked with executing a **One-Shot Build** of "Kit," a retro-futuristic AI Superapp. 

## 📂 Context & Documentation
The project is fully documented in the local directory `/Users/blue1/kit/`. You **must** read these files first to understand the architecture:

- **`ADAM.md`** (Concept): Defines the "Superapp" framework, the "Do/Learn" loops, and the Component Library specs.
- **`EVE.md`** (Implementation): Your **primary execution roadmap**. Follow the "Phases" strictly.
- **`CAIN.md`** (Intelligence): Contains the System Prompts and JSON schemas for the tools (Food Lens, CV Fixer, etc.).
- **`ABEL.md`** (Operations): Covers monitoring and cost/token strategies.
- **`LUCIFER.md`** (Testing): Testing strategy (unit, integration, E2E).

## 🛠️ The Tech Stack
- **Frontend**: Next.js 14+ (App Router), Tailwind CSS (Glassmorphism tokens defined in `EVE.md`).
- **Database**: Supabase (PostgreSQL) + **pgvector** (for the Memory System).
- **AI**: OpenRouter API (Gemini 2.0 Flash Lite for generation, OpenAI for embeddings).
- **Validation**: Zod (strict JSON schema enforcement).

## ⚡ Superpowers (MCP Tools)
You have access to **Supabase** and **Netlify** MCP tools which are **already configured** and authenticated.
- **Supabase Project ID**: `rgizekzedmzekrikqjyc` (Name: "kit")
- **Use `mcp_supabase-mcp-server_execute_sql`** to create tables/indexes directly.
- **Use `mcp_netlify`** tools to handle deployment.

## 🎯 Your Objective
**Execute Phases 0 through 3** of `EVE.md` immediately.

1.  **Initialize**: Set up the Next.js app with TypeScript and the Glassmorphism design system.
2.  **Database**: Use the Supabase MCP to apply the initial schema (Tables: `tools`, `interactions`, `memory_embeddings`, `user_profiles`).
3.  **Core Components**: Build the Polymorphic UI engines (Input/Output cards).
4.  **Universal Router**: Implement the `/api/run-tool` endpoint that handles the `Input → LLM → Output` loop.
5.  **Hero Tool**: Deploy the "Food Lens" tool as a proof-of-concept.

## ⚠️ Important Constraints
- **Aesthetics Matter**: The UI must look like a "Premium Windows 98" — use the specific glassmorphism tokens provided in `EVE.md`.
- **One-Shot**: Try to build the working skeleton in a single coherent flow.
- **Secrets**: You will need to ask the user for the `OPENROUTER_API_KEY` to place in `.env.local`.

**🚀 START NOW.** Read `EVE.md` and begins Phase 0.
