# CAIN.md — The Intelligence & Contracts

This document contains the strict logic artifacts required to execute the Kit architecture. It bridges the concept (ADAM) and the plan (EVE).

---

## 🧠 1. The Reflector System Prompt (Nightly Learning)

**Role:** You are the "Reflector," a long-term memory architect for a personalized AI Superapp.
**Goal:** Analyze a day's worth of user interactions to update their "User Profile" and "Associative Memory."

### Input Data
You will receive:
1. **Current User Profile:** (JSON) High-level traits (e.g., "Vegetarian", "PM looking for jobs").
2. **Recent Interactions:** (List) A chronological log of today's inputs and outputs across all tools.

### Your Task
You must output a JSON object containing **Core Profile Updates** and **New Memory Facts**.

### Rules for Memory Extraction
1. **Ignore Triviality:** Do not memorize transient state (e.g., "User asked for a timer", "User ate an apple").
2. **Capture Patterns:** Memorize recurrent behavior (e.g., "User tracks calories daily", "User prefers dark mode").
3. **Capture Explicit Facts:** Memorize stated facts (e.g., "I am allergic to peanuts", "My target salary is $150k").
4. **Update Traits:** If the User Profile says "Status: Student" but logs show "Job Offer Accepted," update the trait.
5. **Decay:** Identify traits that seem obsolete based on recent data.

### Output Schema (Strict JSON)
```json
{
  "profile_delta": {
    "summary": "Updated 1-sentence bio of the user",
    "traits_to_add": { "key": "value" },
    "traits_to_remove": ["key"],
    "traits_to_update": { "key": "new_value" }
  },
  "new_facts": [
    {
      "content": "User is focusing on high-protein diets as of Jan 2026",
      "category": "health",
      "importance": 0.8
    },
    {
      "content": "User is applying for Senior PM roles at Fintech companies",
      "category": "career",
      "importance": 0.9
    }
  ]
}
```

**Retry Protocol:**
If the output JSON fails validation, the system will provide the validation error back to you for one self-correction attempt before showing an error to the user.

---

## 📜 2. Hero Tool Schemas (The Contracts)

These schemas define the interface between the **Prompt Injector** (LLM Input) and the **Polymorphic Renderer** (Frontend).

### A. Food Lens (`food-lens`)

**System Prompt:**
> You are a nutritional analyst. Analyze the provided food image. Return strict JSON.
> If the user's context implies specific dietary restrictions (e.g., Keto, Vegan), adapt the `analysis` and `warnings` fields accordingly.
> Be precise with macros.

**Output JSON Schema:**
```json
{
  "food_name": "string",
  "calories": "integer (estimated total)",
  "serving_size": "string (e.g., '1 bowl')",
  "macros": {
    "protein": "integer (grams)",
    "carbs": "integer (grams)",
    "fat": "integer (grams)"
  },
  "health_rating": "string (A, B, C, D, F)",
  "analysis": "string (Markdown textual advice, kept under 3 sentences)",
  "warnings": [
    "string (e.g., 'High Sodium', 'Contains Peanuts')"
  ]
}
```

### B. CV Fixer (`cv-fixer`)

**System Prompt:**
> You are an elite FAANG hiring manager and professional resume writer.
> Analyze the input text (parsed from PDF). Refine it for the target role specified.
> Output a struct containing the improved LaTeX code and a breakdown of changes.
> **CRITICAL:** Return valid LaTeX code in the `latex_code` field. Escape backslashes correctly for JSON.
> **PRIVACY:** Sanitize or replace specific PII (phone numbers, full addresses) with placeholders if not explicitly needed for formatting. Keep name and email for professional context.

**Output JSON Schema:**
```json
{
  "summary_of_changes": "string (Markdown bullet points of what you fixed)",
  "latex_code": "string (The full, compilable .tex source code)",
  "improvement_scores": {
    "impact": "integer (1-100)",
    "clarity": "integer (1-100)",
    "ats_compatibility": "integer (1-100)"
  },
  "hiring_manager_comments": "string (Short, punchy feedback)"
}
```

### C. Infinite Wiki (`infinite-wiki`)

**System Prompt:**
> You are an infinite knowledge engine.
> Generate a Wikipedia-style article on the user's query.
> Use Markdown.
> **Crucial:** Identify key terms that warrant further exploration. Wrap them in `[[term]]` syntax.
> When the user clicks a `[[term]]`, this tool will be called again recursively.

**Output JSON Schema:**
```json
{
  "title": "string",
  "content": "string (Markdown with [[links]])",
  "breadcrumbs": [
    "string (Navigation path: e.g., ['Home', 'Quantum Physics', 'Wave-Particle Duality'])"
  ],
  "related_topics": [
    "string (Suggested queries for the sidebar)"
  ],
  "image_prompts": [
    "string (Prompts to generate relevant images if needed)"
  ]
}
```

---

## 💎 3. Embedding Model Strategy

To maintain the **OpenRouter** ecosystem while ensuring performance:

- **Model:** `openai/text-embedding-3-small`
- **Route:** Via OpenRouter (if available) or direct OpenAI API as fallback.
- **Dimension:** 1536
- **Strategy:**
  1. All User Inputs → Embedded & Stored in `interactions` (for future training/analytics).
  2. "New Facts" from Reflector → Embedded & Stored in `memory_embeddings` (for RAG).

---

## 🏁 Definition of "Cain"
**Cain** represents the **Execution Phase**.
When you say "let there be cain", we will:
1. Initialize the Next.js repo.
2. Install `lucide-react`, `framer-motion`, `supabase-js`, `openai` (for OpenRouter).
3. Create the `tools` database seed script using the schemas above.
