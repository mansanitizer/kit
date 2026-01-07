# ABRAHAM: The Tool Design Schema

This document defines the "Genetic Code" for creating tools within the Kit ecosystem. All tools must adhere to this schema to ensure compatibility with the polymorphic UI and the AI operating system.

## 1. Tool Anatomy (Root Metadata)

Every tool is defined by a strict JSON object with the following root properties:

| Field | Type | Description | Example |
|---|---|---|---|
| `slug` | String | Unique kebab-case identifier. | `"cv-fixer"` |
| `name` | String | Display name of the tool. | `"CV Fixer"` |
| `description` | String | Short, punchy tagline (max 50 chars). | `"Modernize your resume."` |
| `icon` | String | [Lucide Icon](https://lucide.dev/icons/) name. | `"FileText"` |
| `color` | String | Tailwind CSS gradient classes. | `"from-pink-500 to-rose-500"` |
| `schema_version` | Integer | Always set to `1`. | `1` |

---

## 2. Input Schema (`input_schema`)

The input schema defines what the tool accepts from the user. It must be a valid **Strict JSON Schema**.

### Key Principles:
*   **Images**: Use `{"format": "data-url"}` for image inputs.
*   **Simplicity**: Keep inputs to the absolute minimum needed context.
*   **Enums**: Use strictly defined `enum` lists for dropdowns/choices.

**Example:**
```json
{
  "type": "object",
  "required": ["cv_text", "target_level"],
  "properties": {
    "cv_text": {
      "type": "string",
      "description": "Paste resume text here"
    },
    "target_level": {
      "type": "string",
      "enum": ["Intern", "Junior", "Senior", "Staff"],
      "description": "Target seniority level"
    },
    "image": {
      "type": "string",
      "format": "data-url",
      "description": "Optional screenshot"
    }
  }
}
```

---

## 3. System Prompt (`system_prompt`)

The System Prompt is the brain of the tool. It follows a specific architecture to ensure consistent, high-fidelity outputs.

### Architecture:

1.  **The Persona**: Define a specific, expert persona.
    *   *Template*: "You are a [Role] with [Years] of experience in [Field A], [Field B], and [Field C]."
2.  **The Objective**: Clear statement of the goal.
    *   *Template*: "Your objective: Provide a high-fidelity, professional analysis of the user input."
3.  **Strategic Directives**: Three (3) specific, numbered rules that define the "secret sauce" of the analysis.
    *   *Example*: "1. **ATS Mastery**: Ensure keywords are naturally woven..."
4.  **Layout Instructions (CRITICAL)**: You **MUST** include explicit instructions on how to format the output `_layout` key.

### Layout Instructions Template:
> "LAYOUT INSTRUCTIONS: You MUST return a _layout field containing exactly matching keys in this exact format: [[row1_key]] [[row2_col1, row2_col2]]"

---

## 4. Output Schema (`output_schema`) & The UI DSL

The output schema drives the **Polymorphic UI**. The Kit UI renders data differently based on its **Data Type**.

### The `_layout` String
Every output schema **MUST** include a `_layout` string. This string defines the grid:
*   `[[A]]`: Row 1, Column A (Full Width)
*   `[[B, C]]`: Row 2, Split 50/50 between B and C.

### Polymorphic Rendering Rules

The type of data you return determines the UI component used:

| Data Type | UI Component | Best For |
|---|---|---|
| **String** | **Text Card** | Summaries, Paragraphs, Analysis, simple text. |
| **Number** | **Big Metric** | Scores, Prices, Percentages, Counts. |
| **Array <String>** | **List** | Bullet points, Steps, Warnings, Tags. |
| **Object** | **Property Grid** | Key-Value tables, Technical Specs, Details. |
| **Array <Object>** | **Interactive Table/List** | Lists of items with multiple properties (e.g., specific gift ideas with prices). |

### Example Output Schema:
```json
{
  "type": "object",
  "required": ["_layout", "score", "summary", "fix_list"],
  "properties": {
    "_layout": { 
      "type": "string" 
    },
    "score": { 
      "type": "integer", 
      "description": "Renders as Big Metric" 
    },
    "summary": { 
      "type": "string", 
      "description": "Renders as Text Card" 
    },
    "fix_list": { 
      "type": "array", 
      "items": { "type": "string" }, 
      "description": "Renders as Bulleted List" 
    }
  }
}
```
