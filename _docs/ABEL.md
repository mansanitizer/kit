# ABEL.md — Kit: Operations, Backlog & Future Enhancements

---

## 📌 Overview

This document serves as the **operational playbook** and **backlog tracker** for the Kit AI Superapp. It covers:
1. **Runtime Operations** — Monitoring, alerting, incident response
2. **Cost Optimization** — Token budgets, caching strategies
3. **User Feedback Loops** — Analytics, feature requests
4. **Security & Privacy** — Data retention, compliance, PII handling
5. **Future Enhancements** — Post-MVP features and improvements
6. **Backlog Items** — Prioritized improvements from initial analysis

---

## 🚨 1. Runtime Operations Guide

### 1.1 Monitoring & Observability

**Key Metrics to Track** (via Vercel Analytics + Supabase Dashboard):

| Metric | Target | Alert Threshold | Action |
|--------|--------|-----------------|--------|
| **P95 Latency** | <2000ms | >3000ms | Scale up, check OpenRouter status |
| **Error Rate** | <1% | >5% | Check logs, rollback if needed |
| **Token Usage** | <3000/req | >5000/req | Review prompts, optimize context |
| **DB Query Time** | <100ms | >500ms | Add indexes, optimize queries |
| **Validation Failures** | <2% | >10% | Review LLM output quality |
| **Memory Retrieval Hits** | >60% | <30% | Improve embedding quality |

---

### 1.2 Alerting Setup

**Vercel Cron Jobs**:
```javascript
// vercel.json
{
  "crons": [
    {
      "path": "/api/reflector",
      "schedule": "0 2 * * *" // 2 AM daily
    },
    {
      "path": "/api/health-check",
      "schedule": "*/5 * * * *" // Every 5 minutes
    }
  ]
}
```

**Health Check Endpoint**:
```typescript
// app/api/health-check/route.ts
export async function GET() {
  const checks = {
    database: await checkSupabase(),
    openrouter: await checkOpenRouter(),
    storage: await checkSupabaseStorage()
  };

  const allHealthy = Object.values(checks).every(c => c.status === 'ok');

  if (!allHealthy) {
    // Send alert to Slack/Discord
    await sendAlert({
      severity: 'high',
      message: 'Health check failed',
      details: checks
    });
  }

  return Response.json(checks, { 
    status: allHealthy ? 200 : 503 
  });
}
```

---

### 1.3 Incident Response Playbook

#### **High Latency (>3s P95)**
1. Check OpenRouter status page
2. Review recent prompt changes (may be too long)
3. Check Supabase query performance
4. Scale up Vercel function memory (1024MB → 2048MB)
5. Enable aggressive caching for embeddings

#### **High Error Rate (>5%)**
1. Check error logs in Vercel dashboard
2. Identify most common error type:
   - **JSON Parse Errors**: LLM output quality issue → adjust temperature
   - **Network Errors**: OpenRouter downtime → enable fallback model
   - **DB Errors**: Connection pool exhausted → increase pool size
3. Rollback to previous deployment if errors started after recent deploy

#### **Token Budget Exceeded**
1. Identify which tool is consuming most tokens
2. Review system prompts for verbosity
3. Reduce context window (top-5 → top-3 memories)
4. Enable prompt caching (if supported by model)

---

## 💰 2. Cost Optimization

### 2.1 Token Budget Strategy

**Monthly Budget**: $100 (for MVP testing)

| Model | Cost per 1M tokens | Expected Usage | Monthly Cost |
|-------|-------------------|----------------|--------------|
| `gemini-2.0-flash-lite` (input) | $0.075 | 50M tokens | $3.75 |
| `gemini-2.0-flash-lite` (output) | $0.30 | 20M tokens | $6.00 |
| `text-embedding-3-small` | $0.02 | 10M tokens | $0.20 |
| **Total** | | | **~$10/month** |

**Per-User Limits**:
- Free Tier: 50 requests/day
- Pro Tier: 500 requests/day
- Enterprise: Unlimited

---

### 2.2 Caching Strategies

**Embedding Cache** (Redis or Supabase):
```typescript
// lib/embeddings.ts
const embeddingCache = new Map<string, number[]>();

export async function generateEmbedding(text: string): Promise<number[]> {
  const cacheKey = hashText(text);
  
  if (embeddingCache.has(cacheKey)) {
    return embeddingCache.get(cacheKey)!;
  }

  const embedding = await callOpenRouter(text);
  embeddingCache.set(cacheKey, embedding);
  
  return embedding;
}
```

**Prompt Caching** (if model supports):
```typescript
// lib/openrouter.ts
const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
    'HTTP-Referer': 'https://kit.app',
  },
  body: JSON.stringify({
    model: 'google/gemini-2.0-flash-lite',
    messages: [
      {
        role: 'system',
        content: systemPrompt,
        cache_control: { type: 'ephemeral' } // Cache system prompt
      },
      {
        role: 'user',
        content: userInput
      }
    ]
  })
});
```

---

### 2.3 Cost Monitoring Dashboard

**Track in Supabase** (new table):
```sql
CREATE TABLE cost_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  tool_slug TEXT,
  total_tokens INT,
  estimated_cost DECIMAL(10, 4),
  request_count INT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Daily aggregation query
SELECT 
  date,
  tool_slug,
  SUM(total_tokens) as tokens,
  SUM(estimated_cost) as cost,
  SUM(request_count) as requests
FROM cost_tracking
WHERE date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY date, tool_slug
ORDER BY date DESC;
```

---

## 📊 3. User Feedback Loops

### 3.1 Analytics Events to Track

**User Engagement**:
- Tool selection frequency
- Average session duration
- Tools per session
- Repeat usage rate

**Quality Metrics**:
- User ratings (thumbs up/down on outputs)
- Regeneration requests (user didn't like first output)
- Copy/download actions (indicates useful output)

**Error Tracking**:
- Failed uploads
- Timeout errors
- Validation failures shown to user

---

### 3.2 Feedback Collection

**Add to Output Cards**:
```typescript
// components/output/FeedbackButtons.tsx
export function FeedbackButtons({ interactionId }: { interactionId: string }) {
  const [feedback, setFeedback] = useState<'positive' | 'negative' | null>(null);

  const handleFeedback = async (type: 'positive' | 'negative') => {
    setFeedback(type);
    
    await supabase
      .from('interactions')
      .update({ user_feedback: type })
      .eq('id', interactionId);
  };

  return (
    <div className="flex gap-2 mt-4">
      <button 
        onClick={() => handleFeedback('positive')}
        className={feedback === 'positive' ? 'active' : ''}
      >
        👍 Helpful
      </button>
      <button 
        onClick={() => handleFeedback('negative')}
        className={feedback === 'negative' ? 'active' : ''}
      >
        👎 Not helpful
      </button>
    </div>
  );
}
```

---

### 3.3 Feature Request Tracking

**Add to Database**:
```sql
CREATE TABLE feature_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT, -- 'new_tool', 'improvement', 'bug'
  votes INT DEFAULT 1,
  status TEXT DEFAULT 'open', -- 'open', 'planned', 'in_progress', 'shipped'
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔐 4. Security & Privacy

### 4.1 Data Retention Policy

| Data Type | Retention Period | Rationale |
|-----------|-----------------|-----------|
| **Interactions** | 90 days | Learning loop needs recent data |
| **Memory Embeddings** | 1 year | Long-term personalization |
| **User Profiles** | Until account deletion | Core user data |
| **Uploaded Files** | 7 days | Temporary processing only |
| **Error Logs** | 30 days | Debugging recent issues |

**Automated Cleanup**:
```sql
-- Run daily via cron
DELETE FROM interactions 
WHERE created_at < NOW() - INTERVAL '90 days';

DELETE FROM uploaded_files 
WHERE created_at < NOW() - INTERVAL '7 days';
```

---

### 4.2 PII Handling

**CV Fixer Sanitization**:
```typescript
// lib/sanitize-pii.ts
export function sanitizePII(text: string): string {
  return text
    .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE]') // Phone numbers
    .replace(/\b\d{5}(-\d{4})?\b/g, '[ZIP]') // ZIP codes
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN]') // SSN
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[EMAIL]'); // Emails (optional)
}
```

**User Data Export** (GDPR compliance):
```typescript
// app/api/export-data/route.ts
export async function GET(req: Request) {
  const userId = await getUserId(req);

  const data = {
    profile: await supabase.from('user_profiles').select('*').eq('user_id', userId).single(),
    interactions: await supabase.from('interactions').select('*').eq('user_id', userId),
    memories: await supabase.from('memory_embeddings').select('*').eq('user_id', userId)
  };

  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="my-kit-data.json"'
    }
  });
}
```

---

### 4.3 Rate Limiting

**Per-User Limits**:
```typescript
// middleware.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(50, '1 d'), // 50 requests per day
});

export async function middleware(req: Request) {
  const userId = await getUserId(req);
  const { success, remaining } = await ratelimit.limit(userId);

  if (!success) {
    return new Response('Rate limit exceeded', { 
      status: 429,
      headers: { 'X-RateLimit-Remaining': remaining.toString() }
    });
  }

  return NextResponse.next();
}
```

---

## 🚀 5. Future Enhancements (Post-MVP)

### 5.1 New Hero Tools (Phase 8+)

#### **A. Code Reviewer**
- **Input**: GitHub PR URL or code snippet
- **Output**: Line-by-line review with suggestions
- **Tech**: GitHub API integration, syntax highlighting

#### **B. Meeting Summarizer**
- **Input**: Audio file or transcript
- **Output**: Action items, key decisions, attendee sentiment
- **Tech**: Whisper API for transcription

#### **C. Email Drafter**
- **Input**: Context (e.g., "Decline job offer politely")
- **Output**: 3 tone variants (formal, casual, friendly)
- **Tech**: User's email history for style matching

#### **D. Budget Analyzer**
- **Input**: Bank statement CSV
- **Output**: Spending breakdown, savings recommendations
- **Tech**: CSV parsing, category classification

---

### 5.2 Platform Enhancements

#### **Multi-Modal Inputs**
- Voice input for all tools (Whisper API)
- Video analysis for Food Lens (extract frames)
- Batch processing (upload 10 images at once)

#### **Collaborative Features**
- Share tool outputs with unique URLs
- Team workspaces (shared memory pool)
- Public tool gallery (community-created tools)

#### **Advanced Memory**
- Cross-tool memory (CV Fixer learns from Food Lens)
- Temporal memory decay (old preferences fade)
- Conflict resolution (user changes diet from keto → vegan)

#### **Custom Tool Builder**
- No-code tool creator (define input/output schemas via UI)
- Template library (start from "Translator" template)
- Community marketplace (publish/monetize custom tools)

---

### 5.3 Infrastructure Upgrades

#### **Edge Functions**
- Deploy critical paths to Vercel Edge for <100ms latency
- Use Cloudflare Workers for global distribution

#### **Streaming Improvements**
- Partial JSON rendering (show `food_name` before `macros` loads)
- Progressive image generation (Food Lens shows image while analyzing)

#### **Offline Support**
- Service worker caching for tool definitions
- Local-first interactions (sync when online)

---

## 📋 6. Backlog Items (From Initial Analysis)

### Priority 1: Critical (Pre-Launch)

- [ ] **Security Section in ADAM.md**
  - Add data retention policy
  - Document PII handling for CV Fixer
  - Define encryption standards
  - Add RLS policy examples

- [ ] **Error Handling Strategy**
  - Network failure retry logic (exponential backoff)
  - Malformed JSON auto-retry (max 1 attempt)
  - Rate limit queue with user notification
  - Graceful degradation (show cached results if API down)

- [ ] **Database Indexes** (EVE.md)
  ```sql
  CREATE INDEX idx_interactions_user_tool ON interactions(user_id, tool_slug);
  CREATE INDEX idx_interactions_created ON interactions(created_at DESC);
  CREATE INDEX idx_memory_user_category ON memory_embeddings(user_id, category);
  CREATE INDEX idx_memory_importance ON memory_embeddings(importance DESC);
  ```

- [ ] **Dark Mode Support** (EVE.md glassmorphism tokens)
  ```css
  @media (prefers-color-scheme: dark) {
    :root {
      --glass-bg: rgba(0, 0, 0, 0.3);
      --glass-bg-hover: rgba(0, 0, 0, 0.4);
      --text-primary: rgba(255, 255, 255, 0.95);
    }
  }
  ```

- [ ] **Deployment Checklist** (EVE.md Phase 7)
  - Set up Vercel project with environment variables
  - Configure Supabase production instance
  - Set up custom domain with SSL
  - Configure Vercel cron for Reflector Agent
  - Set up error monitoring (Sentry)
  - Create staging environment

---

### Priority 2: High (Week 1 Post-Launch)

- [ ] **Component Examples** (ADAM.md)
  - Add usage examples to component tables
  - Create Storybook for component library
  - Document prop types with TypeScript interfaces

- [ ] **Reflector Prompt Examples** (CAIN.md)
  - Add 3 example scenarios with expected outputs
  - Document edge cases (conflicting memories)
  - Add retry protocol pseudocode

- [ ] **Schema Versioning** (CAIN.md)
  - Implement version field in tool schemas
  - Create migration strategy for schema updates
  - Add backward compatibility layer

- [ ] **RAG Retrieval Parameters** (CAIN.md)
  - Document similarity threshold (0.75)
  - Define max results (top-5)
  - Explain recency boost algorithm
  - Add category filtering logic

- [ ] **Observability Dashboard**
  - Build admin page at `/admin/metrics`
  - Display token usage, latency, error rate
  - Set up alerts for threshold breaches
  - Integrate with Grafana or Vercel Analytics

---

### Priority 3: Medium (Month 1)

- [ ] **Architecture Diagrams**
  - System architecture (frontend ↔ API ↔ Supabase ↔ OpenRouter)
  - Data flow diagram (Do Loop + Learn Loop)
  - Component hierarchy tree
  - Database schema ERD

- [ ] **Success Metrics** (EVE.md Phase 7)
  - P95 latency <2s for all tools
  - >90% JSON validation success rate
  - Users complete 3+ tool interactions per session
  - Reflector generates 5-10 facts per day

- [ ] **Code Snippets in CAIN.md**
  - Add TypeScript interfaces for all tool outputs
  - Include Zod schemas for validation
  - Provide example API responses

- [ ] **LLM Model Strategy** (ADAM.md)
  - Define production model (vs. testing model)
  - Document fallback strategy
  - Add model rotation logic for reliability

- [ ] **Time Estimates Refinement** (EVE.md)
  - Add effort estimates to each phase task
  - Document dependencies between phases
  - Mark critical path items

---

### Priority 4: Low (Month 2+)

- [ ] **Testing Strategy Expansion**
  - Add mutation testing (Stryker)
  - Visual regression testing (Percy)
  - Security testing (OWASP ZAP)

- [ ] **Performance Optimizations**
  - Implement prompt caching
  - Add Redis for embedding cache
  - Enable CDN for static assets
  - Optimize bundle size (<100KB initial load)

- [ ] **Internationalization**
  - Support 5 languages (EN, ES, FR, DE, HI)
  - Locale-aware date/number formatting
  - RTL support for Arabic/Hebrew

- [ ] **Mobile App**
  - React Native wrapper
  - Offline mode with sync
  - Push notifications for Reflector insights

---

## 🎯 7. Success Metrics (Portfolio Presentation)

### Technical Excellence
- **Code Quality**: >80% test coverage, zero critical vulnerabilities
- **Performance**: P95 <2s, First Contentful Paint <1s
- **Reliability**: 99.9% uptime, <1% error rate

### Product Sense
- **User Engagement**: 70% of users try 2+ tools in first session
- **Retention**: 40% weekly active users (WAU)
- **Quality**: >80% positive feedback on outputs

### Business Impact
- **Cost Efficiency**: <$0.10 per user per month (token costs)
- **Scalability**: Handles 10,000 concurrent users
- **Extensibility**: New tool can be added in <4 hours

---

## 📚 8. Documentation Roadmap

### For Developers
- [ ] **API Reference** — OpenAPI spec for all endpoints
- [ ] **Component Library Docs** — Storybook with live examples
- [ ] **Database Schema Docs** — Auto-generated from Supabase

### For Users
- [ ] **User Guide** — How to use each tool
- [ ] **FAQ** — Common questions and troubleshooting
- [ ] **Privacy Policy** — Data handling and retention

### For Portfolio
- [ ] **Case Study** — Problem, solution, impact
- [ ] **Architecture Deep Dive** — Technical decisions and tradeoffs
- [ ] **Demo Video** — 3-minute walkthrough

---

## 🏁 Definition of "Abel"

**Abel** represents the **Operational Maturity Phase**.

When you say "let there be abel", we will:
1. Set up monitoring and alerting infrastructure
2. Implement cost tracking and budgets
3. Add user feedback collection
4. Configure data retention policies
5. Create operational runbooks
6. Build admin dashboard for metrics

---

## 📋 See Also

- **[ADAM.md](./ADAM.md)** — Concept Document
- **[EVE.md](./EVE.md)** — Implementation Plan
- **[CAIN.md](./CAIN.md)** — Intelligence & Contracts
- **[LUCIFER.md](./LUCIFER.md)** — Testing & Quality Assurance
