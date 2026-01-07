# EVE.md — Kit: Implementation Plan

---

## 📌 Overview

This document outlines the phased implementation plan for **Kit**, the AI Superapp. Each phase builds upon the previous, ensuring a stable foundation before adding complexity.

---

## 🛠️ Tech Stack (Finalized)

| Component | Choice | Notes |
|-----------|--------|-------|
| **Framework** | Next.js 14+ (App Router) | TypeScript, Server Actions |
| **Styling** | Tailwind CSS | Glassmorphism design tokens |
| **Database** | Supabase (PostgreSQL) | Managed, includes Auth |
| **Vector Store** | pgvector (via Supabase) | Semantic search for RAG |
| **LLM Provider** | **OpenRouter API** | Model-agnostic gateway |
| **Generation Model** | `gemini-2.0-flash-lite` | Fast, cheap for testing |
| **Embedding Model** | TBD (OpenRouter compatible) | e.g., `text-embedding-3-small` |
| **File Storage** | Supabase Storage | Images, PDFs |
| **Validation** | **Zod** | Runtime schema validation |
| **Animation** | Framer Motion | Micro-interactions |

---

## 🎨 Design System: Glassmorphism Tokens

```css
/* Core Glassmorphism Variables */
:root {
  /* Backgrounds */
  --glass-bg: rgba(255, 255, 255, 0.1);
  --glass-bg-hover: rgba(255, 255, 255, 0.15);
  --glass-bg-active: rgba(255, 255, 255, 0.2);
  
  /* Blur */
  --glass-blur: blur(20px);
  --glass-blur-light: blur(10px);
  
  /* Borders */
  --glass-border: 1px solid rgba(255, 255, 255, 0.2);
  --glass-border-focus: 1px solid rgba(255, 255, 255, 0.4);
  
  /* Shadows */
  --glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  --glass-shadow-elevated: 0 16px 48px rgba(0, 0, 0, 0.15);
  
  /* Radius */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-full: 9999px;
  
  /* Colors */
  --accent-primary: #6366f1;    /* Indigo */
  --accent-success: #22c55e;    /* Green */
  --accent-warning: #f59e0b;    /* Amber */
  --accent-error: #ef4444;      /* Red */
  
  /* Text */
  --text-primary: rgba(255, 255, 255, 0.95);
  --text-secondary: rgba(255, 255, 255, 0.7);
  --text-muted: rgba(255, 255, 255, 0.5);
}
```

---

## 📦 Folder Structure

```
kit/
├── app/
│   ├── layout.tsx              # Root layout with providers
│   ├── page.tsx                # Home / Tool selector
│   ├── api/
│   │   ├── run-tool/route.ts   # Universal tool executor
│   │   ├── embeddings/route.ts # Generate embeddings
│   │   └── reflector/route.ts  # Nightly synthesis (cron)
│   └── tools/
│       ├── [slug]/page.tsx     # Dynamic tool page
│       └── layout.tsx          # Tool layout wrapper
├── components/
│   ├── ui/                     # Atomic elements (Button, Card, etc.)
│   ├── input/                  # Input card components
│   │   ├── ImageUpload.tsx
│   │   ├── TextInput.tsx
│   │   ├── FileUpload.tsx
│   │   ├── RadioGroup.tsx
│   │   ├── CheckboxGroup.tsx
│   │   └── SubmitButton.tsx
│   ├── output/                 # Output card components
│   │   ├── ImageDisplay.tsx
│   │   ├── DataTable.tsx
│   │   ├── MarkdownRenderer.tsx
│   │   ├── MetricCard.tsx
│   │   ├── HyperlinkText.tsx
│   │   └── TextBlock.tsx
│   └── layout/                 # App shell components
│       ├── ToolSelector.tsx
│       ├── Header.tsx
│       └── GlassCard.tsx
├── lib/
│   ├── openrouter.ts           # OpenRouter API client
│   ├── supabase.ts             # Supabase client
│   ├── embeddings.ts           # Embedding utilities
│   ├── context-engine.ts       # RAG retrieval logic
│   └── prompt-injector.ts      # Dynamic prompt construction
├── types/
│   ├── tool.ts                 # Tool definition types
│   ├── components.ts           # Component prop types
│   └── database.ts             # DB schema types
├── ADAM.md                     # Concept document
├── EVE.md                      # Implementation plan (this file)
└── package.json
```

---

## 🗃️ Database Schema

### Table: `tools`
```sql
CREATE TABLE tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,           -- "food-lens"
  name TEXT NOT NULL,                   -- "Food Lens"
  description TEXT,
  icon TEXT,                            -- Lucide icon name
  system_prompt TEXT NOT NULL,          -- The AI instruction
  input_schema JSONB NOT NULL,          -- Defines input card structure
  output_schema JSONB NOT NULL,         -- Defines output card structure
  schema_version INT DEFAULT 1,         -- Track schema evolution
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Table: `interactions`
```sql
CREATE TABLE interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users,
  tool_slug TEXT NOT NULL,
  schema_version INT,                   -- Track which schema was used
  input_data JSONB NOT NULL,            -- User's input
  output_data JSONB NOT NULL,           -- LLM's response
  tokens_used INT,
  latency_ms INT,
  validation_errors TEXT[],             -- Track any schema mismatches
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Table: `memory_embeddings`
```sql
CREATE TABLE memory_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users,
  content TEXT NOT NULL,                -- "User prefers keto diet"
  embedding VECTOR(1536),               -- pgvector
  category TEXT,                        -- 'diet', 'finance', etc.
  importance FLOAT DEFAULT 0.5,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for similarity search
CREATE INDEX ON memory_embeddings 
  USING ivfflat (embedding vector_cosine_ops);
```

### Table: `user_profiles`
```sql
CREATE TABLE user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users,
  summary TEXT,                         -- "Tech PM in Bangalore..."
  traits JSONB DEFAULT '{}',            -- {"diet": "keto", "budget": "tight"}
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🚦 Implementation Phases

### Phase 0: Foundation (Day 1-2)
- [ ] Initialize Next.js 14 project with TypeScript
- [ ] Set up Tailwind CSS with glassmorphism tokens
- [ ] Configure Supabase project
- [ ] Enable pgvector extension
- [ ] Create database tables (migrations)
- [ ] Set up OpenRouter API client
- [ ] Environment variables (`.env.local`)

### Phase 1: Core Components (Day 3-4)
- [ ] Build atomic UI components (`Button`, `Card`, `Badge`, etc.)
- [ ] Build Input Card components (`ImageUpload`, `TextInput`, etc.)
- [ ] Build Output Card components (`DataTable`, `MarkdownRenderer`, etc.)
- [ ] Create `GlassCard` wrapper component
- [ ] Build `Skeleton` loading states matching each output component
- [ ] Create `DefaultJSONRenderer` fallback component
- [ ] Test components in isolation (Storybook optional)

### Phase 2: Universal Router (Day 5-6)
- [ ] Install and configure Zod for schema validation
- [ ] Create `/api/run-tool` endpoint with streaming support
- [ ] Implement tool registry fetch from Supabase
- [ ] Build Prompt Injector (system + schema enforcement)
- [ ] Integrate OpenRouter API call with `gemini-2.0-flash-lite`
- [ ] Implement streaming JSON parsing with progressive rendering
- [ ] Add Zod validation layer with auto-retry on malformed JSON
- [ ] Log interactions to database (including validation errors)
- [ ] Build optimistic UI with skeleton states

### Phase 3: First Hero Tool — Food Lens (Day 7-8)
- [ ] Seed `tools` table with Food Lens definition
- [ ] Build Food Lens page (`/tools/food-lens`)
- [ ] Wire up Input Card → API → Output Card
- [ ] Handle image upload to Supabase Storage
- [ ] Test end-to-end flow

### Phase 4: Context Engine (Day 9-10)
- [ ] Build embedding generation utility
- [ ] Implement semantic search on `memory_embeddings`
- [ ] Build Context Retriever (RAG logic)
- [ ] Inject user context into prompts
- [ ] Test with Food Lens (e.g., "user avoids gluten")

### Phase 5: Remaining Hero Tools (Day 11-14)
- [ ] **CV Fixer**: PDF parsing, LaTeX output
- [ ] **Infinite Wiki**: Hyperlink parsing, recursive queries
- [ ] Refine UI/UX based on testing

### Phase 6: Reflector Agent (Day 15-16)
- [ ] Create `/api/reflector` endpoint
- [ ] Implement daily log harvesting
- [ ] Build synthesis prompt
- [ ] Upsert to `memory_embeddings` and `user_profiles`
- [ ] Set up Supabase cron job (or Vercel cron)
- [ ] Add "Force Reflect" debug trigger for manual memory updates

### Phase 7: Polish & Portfolio (Day 17-20)
- [ ] Build tool selector home page
- [ ] Add loading states and error handling
- [ ] Implement observability (token usage, latency tracking)
- [ ] Write portfolio case study
- [ ] Create architecture diagrams
- [ ] Deploy to Vercel

---

## 📊 Observability Requirements

Track per-request:
- `tool_slug`: Which tool was used
- `tokens_used`: Input + Output tokens
- `latency_ms`: Time from request to response
- `streaming_enabled`: Whether partial rendering was used
- `error_rate`: Failed JSON parses or API errors
- `validation_failures`: Zod schema mismatches
- `user_context_hits`: How many memory embeddings were injected

---

## 🔐 Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# OpenRouter
OPENROUTER_API_KEY=

# Models
GENERATION_MODEL=google/gemini-2.0-flash-lite
EMBEDDING_MODEL=openai/text-embedding-3-small
```

---

## ✅ Definition of Done (Per Tool)

A tool is "complete" when:
1. ✅ Seeded in `tools` table with full schema
2. ✅ Input Card renders correctly
3. ✅ API call returns strict JSON
4. ✅ Output Card renders all fields
5. ✅ Interaction logged to database
6. ✅ Context injection works (if applicable)
7. ✅ Error states handled gracefully

---

## 📋 See Also

- **[ADAM.md](./ADAM.md)** — Concept Document & Component Library
