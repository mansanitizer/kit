# ADAM.md — Kit: The AI Superapp (Concept Document)

---

## 🎯 Core Concept

**Kit** is a "Superapp" framework — a unified platform containing multiple AI-powered micro-tools. Each tool follows the same pattern:

```
System Prompt + User Input (+ optional base64 attachment) 
    → LLM API Call (with Streaming Support)
    → Strict JSON Output (Partial Streaming for faster UX)
    → Polymorphic Frontend Renderer (with Fallback)
```

---

## 🏗️ Architecture (Two Loops)

### Real-Time "Do" Loop
1. User selects tool → inputs data via **standardized Input Card**
2. **Context Engine** performs semantic search (pgvector) for relevant user preferences
3. **Prompt Injector** hydrates: `Base Tool Prompt + User Traits + Strict JSON Schema`
4. LLM streams structured JSON → Frontend renders **standardized Output Card** progressively
5. **Validation Layer** (Zod) ensures schema compliance; auto-retry on malformed JSON

### Async "Learn" Loop (Nightly + Manual)
1. **Reflector Agent** harvests daily interaction logs (or triggered manually for demos)
2. LLM synthesizes insights about the user
3. Updates `user_profile` (traits) and `memory_embeddings` (pgvector)
4. **Manual Trigger**: Debug menu includes "Force Reflect" for immediate memory updates

---

## 💾 Tiered Memory System

| Tier | Table | Purpose |
|------|-------|---------|
| 1. Raw Stream | `interactions` | Every input/output log |
| 2. Associative | `memory_embeddings` (pgvector) | Semantic facts/preferences |
| 3. Long-Term | `user_profile` | High-level JSON traits |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 14+, TypeScript, Tailwind CSS |
| **Design System** | **Glassmorphism** (frosted glass, blur, transparency) |
| **Backend** | Next.js Server Actions (Universal Router) |
| **Database** | Supabase (PostgreSQL + pgvector) |
| **LLM Provider** | **OpenRouter API** |
| **Generation Model** | `gemini-2.0-flash-lite` (testing) |
| **Embedding Model** | OpenRouter-compatible embedding model |

---

## 🎨 Design Direction

**Glassmorphism** — Modern frosted-glass aesthetic with:
- Semi-transparent backgrounds (`rgba` with blur)
- Subtle borders and shadows
- Soft gradients
- Clean, minimal typography

---

## 🧩 Standardized Component Library

All tools use a **fixed set of reusable components** for consistency and rapid development.

### Input Card Components

| Component | Description | Props |
|-----------|-------------|-------|
| `<ImageUpload />` | Drag-drop or click to upload image | `onUpload`, `accept`, `maxSize` |
| `<TextInput />` | Single-line text field | `placeholder`, `value`, `onChange` |
| `<TextArea />` | Multi-line text area | `placeholder`, `rows`, `value` |
| `<FileUpload />` | PDF/document upload | `accept`, `onUpload` |
| `<RadioGroup />` | Single-select options | `options[]`, `value`, `onChange` |
| `<CheckboxGroup />` | Multi-select options | `options[]`, `selected[]`, `onChange` |
| `<Slider />` | Numeric range input | `min`, `max`, `step`, `value` |
| `<DatePicker />` | Date selection | `value`, `onChange` |
| `<SubmitButton />` | Primary action button | `label`, `loading`, `disabled` |

### Output Card Components

| Component | Description | Props |
|-----------|-------------|-------|
| `<ImageDisplay />` | Renders image with src | `src`, `alt`, `caption` |
| `<DataTable />` | Tabular data display | `columns[]`, `rows[]` |
| `<TextBlock />` | Styled paragraph text | `content`, `variant` |
| `<MarkdownRenderer />` | Renders markdown content | `content` |
| `<MetricCard />` | Single stat with label | `label`, `value`, `unit`, `trend` |
| `<ProgressBar />` | Visual progress indicator | `value`, `max`, `label` |
| `<LinkButton />` | Clickable action/link | `href`, `label`, `icon` |
| `<TagList />` | List of tags/chips | `tags[]` |
| `<RatingDisplay />` | Star or score rating | `value`, `max`, `variant` |
| `<Accordion />` | Collapsible sections | `sections[]` |
| `<HyperlinkText />` | Text with `[[term]]` links | `content`, `onLinkClick` |
| `<Breadcrumbs />` | Navigation trail for recursive queries | `path[]`, `onNavigate` |
| `<DefaultJSONRenderer />` | Fallback for unknown schemas | `data` |

### Atomic UI Elements

| Element | Variants |
|---------|----------|
| `<Button />` | `primary`, `secondary`, `ghost`, `danger` |
| `<Badge />` | `success`, `warning`, `error`, `info` |
| `<Card />` | `glass` (default), `solid`, `outlined` |
| `<Modal />` | Glassmorphic overlay dialog |
| `<Tooltip />` | Hover info display |
| `<Spinner />` | Loading indicator |
| `<Skeleton />` | Loading placeholder matching output schema |
| `<Avatar />` | User/tool icon display |
| `<Divider />` | Horizontal separator |

---

## 🚀 Hero Tools (Build First)

### 1. Food Lens
**Purpose**: Analyze food images for nutritional data

**Input Card**:
- `<ImageUpload />` — Food photo
- `<TextArea />` — Optional context ("this is my lunch")

**Output Card**:
- `<ImageDisplay />` — Original image
- `<DataTable />` — Caloric breakdown (Calories, Protein, Carbs, Fat)
- `<MetricCard />` — Health rating (A/B/C)
- `<TextBlock />` — AI advice/suggestions

---

### 2. CV Fixer
**Purpose**: Upload resume, get improved LaTeX output

**Input Card**:
- `<FileUpload />` — PDF resume
- `<RadioGroup />` — Target role (Engineering, PM, Design, etc.)
- `<CheckboxGroup />` — Fix types (Grammar, Formatting, Content, ATS)

**Output Card**:
- `<MarkdownRenderer />` — Summary of changes
- `<TextBlock />` — LaTeX code output (copyable)
- `<DataTable />` — Improvement scores
- `<LinkButton />` — "Download PDF" action

---

### 3. Infinite Wiki
**Purpose**: Query anything, get Wikipedia-style expandable content

**Input Card**:
- `<TextInput />` — Search query

**Output Card**:
- `<MarkdownRenderer />` — Article content
- `<HyperlinkText />` — `[[terms]]` are clickable, triggering new queries
- `<Breadcrumbs />` — Navigation stack (Home → Query 1 → Query 2)
- `<TagList />` — Related topics
- `<Accordion />` — Expandable sections

---

## 🎯 Goal

**FAANG Portfolio Piece** — demonstrating:
- **Product Sense**: Unified tool architecture
- **Technical Fluency**: RAG, pgvector, structured outputs
- **Analytical Execution**: Observability, token tracking
- **Strategic Vision**: Extensible platform design

---

## 📋 See Also

- **[EVE.md](./EVE.md)** — Implementation Plan & Phases
