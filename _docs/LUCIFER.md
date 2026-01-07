# TESTING.md — Kit: Testing & Quality Assurance Strategy

---

## 📌 Overview

This document provides a comprehensive testing strategy for the Kit AI Superapp. Testing is critical for ensuring reliability, performance, and user trust—especially when dealing with LLM outputs and user data.

---

## 🎯 Testing Philosophy

### Core Principles
1. **Test the Contract, Not the Implementation**: Focus on input/output behavior
2. **Embrace Non-Determinism**: LLM outputs vary; test for schema compliance, not exact strings
3. **Fast Feedback Loops**: Unit tests run in <5s, integration tests in <30s
4. **Production Parity**: Use real API keys in staging, mocks in CI/CD
5. **Accessibility First**: WCAG 2.1 AA compliance is non-negotiable

---

## 🧪 Phase 6.5: Testing & Quality Assurance (Day 16-17)

**Total Estimated Time**: 16-20 hours  
**Dependencies**: Phases 0-6 complete  
**Critical Path**: Yes (blocks deployment)

---

## 1️⃣ Unit Tests for Core Utilities (4-5 hours)

### 1.1 Embedding Generation (`lib/embeddings.ts`)

**What to Test:**
- ✅ Generates 1536-dimensional vectors
- ✅ Handles empty strings gracefully
- ✅ Caches embeddings for identical inputs
- ✅ Retries on API failures (with exponential backoff)

**Test Framework**: Jest + TypeScript

```typescript
// __tests__/lib/embeddings.test.ts
import { generateEmbedding, batchGenerateEmbeddings } from '@/lib/embeddings';

describe('generateEmbedding', () => {
  it('should return a 1536-dimensional vector', async () => {
    const embedding = await generateEmbedding('Hello world');
    expect(embedding).toHaveLength(1536);
    expect(embedding.every(n => typeof n === 'number')).toBe(true);
  });

  it('should return consistent embeddings for identical inputs', async () => {
    const text = 'Consistent test string';
    const embedding1 = await generateEmbedding(text);
    const embedding2 = await generateEmbedding(text);
    
    // Cosine similarity should be ~1.0
    const similarity = cosineSimilarity(embedding1, embedding2);
    expect(similarity).toBeGreaterThan(0.99);
  });

  it('should handle empty strings without crashing', async () => {
    await expect(generateEmbedding('')).rejects.toThrow('Input text cannot be empty');
  });

  it('should retry on network failures', async () => {
    // Mock OpenRouter API to fail twice, then succeed
    const mockFetch = jest.fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({ data: [{ embedding: new Array(1536).fill(0.1) }] });

    global.fetch = mockFetch as any;

    const embedding = await generateEmbedding('Retry test');
    expect(mockFetch).toHaveBeenCalledTimes(3);
    expect(embedding).toHaveLength(1536);
  });
});

describe('batchGenerateEmbeddings', () => {
  it('should process multiple texts in parallel', async () => {
    const texts = ['Text 1', 'Text 2', 'Text 3'];
    const embeddings = await batchGenerateEmbeddings(texts);
    
    expect(embeddings).toHaveLength(3);
    embeddings.forEach(emb => expect(emb).toHaveLength(1536));
  });

  it('should respect rate limits (max 100 requests/min)', async () => {
    const texts = new Array(150).fill('Test');
    const startTime = Date.now();
    
    await batchGenerateEmbeddings(texts);
    
    const duration = Date.now() - startTime;
    expect(duration).toBeGreaterThan(60000); // Should take >1 minute
  });
});
```

---

### 1.2 Context Engine (`lib/context-engine.ts`)

**What to Test:**
- ✅ Retrieves top-k most similar memories
- ✅ Filters by category when specified
- ✅ Applies recency boost correctly
- ✅ Returns empty array when no relevant memories exist

```typescript
// __tests__/lib/context-engine.test.ts
import { retrieveContext } from '@/lib/context-engine';
import { createClient } from '@supabase/supabase-js';

// Use Supabase local instance for testing
const supabase = createClient(
  process.env.TEST_SUPABASE_URL!,
  process.env.TEST_SUPABASE_ANON_KEY!
);

describe('retrieveContext', () => {
  beforeEach(async () => {
    // Seed test database with known memories
    await supabase.from('memory_embeddings').insert([
      {
        user_id: 'test-user-1',
        content: 'User prefers keto diet',
        embedding: await generateEmbedding('User prefers keto diet'),
        category: 'health',
        importance: 0.8,
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      },
      {
        user_id: 'test-user-1',
        content: 'User is allergic to peanuts',
        embedding: await generateEmbedding('User is allergic to peanuts'),
        category: 'health',
        importance: 0.9,
        created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) // 10 days ago
      },
      {
        user_id: 'test-user-1',
        content: 'User is applying for PM roles',
        embedding: await generateEmbedding('User is applying for PM roles'),
        category: 'career',
        importance: 0.7,
        created_at: new Date()
      }
    ]);
  });

  afterEach(async () => {
    // Clean up test data
    await supabase.from('memory_embeddings').delete().eq('user_id', 'test-user-1');
  });

  it('should retrieve top-k most similar memories', async () => {
    const query = 'What foods should I avoid?';
    const context = await retrieveContext('test-user-1', query, { topK: 2 });

    expect(context).toHaveLength(2);
    expect(context[0].content).toContain('peanuts'); // Most relevant
    expect(context[1].content).toContain('keto');
  });

  it('should filter by category', async () => {
    const query = 'Help me with my career';
    const context = await retrieveContext('test-user-1', query, { 
      category: 'career',
      topK: 5 
    });

    expect(context).toHaveLength(1);
    expect(context[0].content).toContain('PM roles');
  });

  it('should apply recency boost', async () => {
    const query = 'Tell me about my health preferences';
    const context = await retrieveContext('test-user-1', query, { 
      topK: 2,
      recencyBoost: true 
    });

    // "keto" is 2 days old, "peanuts" is 10 days old
    // With recency boost, "keto" should rank higher despite lower base similarity
    expect(context[0].content).toContain('keto');
  });

  it('should return empty array when no relevant memories exist', async () => {
    const query = 'What is quantum physics?';
    const context = await retrieveContext('test-user-1', query, { 
      similarityThreshold: 0.8 
    });

    expect(context).toHaveLength(0);
  });
});
```

---

### 1.3 Prompt Injector (`lib/prompt-injector.ts`)

**What to Test:**
- ✅ Correctly hydrates system prompt with user context
- ✅ Enforces JSON schema in prompt
- ✅ Handles missing user profile gracefully
- ✅ Respects token limits (truncates context if needed)

```typescript
// __tests__/lib/prompt-injector.test.ts
import { buildPrompt } from '@/lib/prompt-injector';

describe('buildPrompt', () => {
  it('should inject user context into system prompt', async () => {
    const toolPrompt = 'You are a nutritional analyst.';
    const userContext = [
      { content: 'User is vegan', importance: 0.9 },
      { content: 'User tracks macros daily', importance: 0.7 }
    ];

    const prompt = await buildPrompt({
      toolSlug: 'food-lens',
      systemPrompt: toolPrompt,
      userContext,
      userInput: 'Analyze this meal'
    });

    expect(prompt).toContain('User is vegan');
    expect(prompt).toContain('User tracks macros daily');
    expect(prompt).toContain('Analyze this meal');
  });

  it('should enforce JSON schema in prompt', async () => {
    const schema = {
      food_name: 'string',
      calories: 'integer'
    };

    const prompt = await buildPrompt({
      toolSlug: 'food-lens',
      systemPrompt: 'Analyze food',
      outputSchema: schema,
      userInput: 'Pizza'
    });

    expect(prompt).toContain('strict JSON');
    expect(prompt).toContain(JSON.stringify(schema, null, 2));
  });

  it('should handle missing user profile gracefully', async () => {
    const prompt = await buildPrompt({
      toolSlug: 'food-lens',
      systemPrompt: 'Analyze food',
      userContext: [], // No context available
      userInput: 'Pizza'
    });

    expect(prompt).not.toContain('User Context:');
    expect(prompt).toContain('Pizza');
  });

  it('should truncate context if token limit exceeded', async () => {
    const longContext = new Array(100).fill(null).map((_, i) => ({
      content: `User preference ${i}: ${'x'.repeat(100)}`,
      importance: 0.5
    }));

    const prompt = await buildPrompt({
      toolSlug: 'food-lens',
      systemPrompt: 'Analyze food',
      userContext: longContext,
      userInput: 'Pizza',
      maxTokens: 2000
    });

    const tokenCount = estimateTokens(prompt);
    expect(tokenCount).toBeLessThan(2000);
  });
});
```

---

## 2️⃣ Integration Tests for `/api/run-tool` (5-6 hours)

### 2.1 End-to-End API Flow

**What to Test:**
- ✅ Tool execution with valid input returns 200 + valid JSON
- ✅ Streaming response works correctly
- ✅ Invalid tool slug returns 404
- ✅ Malformed input returns 400 with error details
- ✅ Zod validation catches schema mismatches
- ✅ Interaction is logged to database

**Test Framework**: Jest + Supertest (for API testing)

```typescript
// __tests__/api/run-tool.test.ts
import request from 'supertest';
import { createMocks } from 'node-mocks-http';
import handler from '@/app/api/run-tool/route';

describe('POST /api/run-tool', () => {
  it('should execute Food Lens tool successfully', async () => {
    const response = await request(handler)
      .post('/api/run-tool')
      .send({
        tool_slug: 'food-lens',
        input: {
          image_base64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
          context: 'This is my lunch'
        },
        user_id: 'test-user-1'
      })
      .expect(200);

    const data = response.body;
    expect(data).toHaveProperty('food_name');
    expect(data).toHaveProperty('calories');
    expect(data.macros).toHaveProperty('protein');
    expect(['A', 'B', 'C', 'D', 'F']).toContain(data.health_rating);
  });

  it('should stream response progressively', async () => {
    const chunks: string[] = [];

    await request(handler)
      .post('/api/run-tool')
      .send({
        tool_slug: 'infinite-wiki',
        input: { query: 'Quantum entanglement' },
        stream: true
      })
      .on('data', (chunk) => {
        chunks.push(chunk.toString());
      });

    expect(chunks.length).toBeGreaterThan(1); // Multiple chunks received
    
    // Reconstruct full JSON from chunks
    const fullResponse = JSON.parse(chunks.join(''));
    expect(fullResponse).toHaveProperty('title');
    expect(fullResponse).toHaveProperty('content');
  });

  it('should return 404 for invalid tool slug', async () => {
    const response = await request(handler)
      .post('/api/run-tool')
      .send({
        tool_slug: 'non-existent-tool',
        input: {}
      })
      .expect(404);

    expect(response.body.error).toContain('Tool not found');
  });

  it('should validate input schema with Zod', async () => {
    const response = await request(handler)
      .post('/api/run-tool')
      .send({
        tool_slug: 'food-lens',
        input: {
          // Missing required 'image_base64' field
          context: 'Invalid input'
        }
      })
      .expect(400);

    expect(response.body.error).toContain('image_base64');
    expect(response.body.validation_errors).toBeDefined();
  });

  it('should retry on malformed LLM output', async () => {
    // Mock OpenRouter to return invalid JSON first, then valid JSON
    jest.spyOn(global, 'fetch').mockImplementation((url) => {
      if (url.toString().includes('openrouter')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            choices: [{
              message: {
                content: callCount++ === 0 
                  ? '{"invalid_json": ' // Malformed
                  : '{"food_name": "Pizza", "calories": 800, "macros": {"protein": 30, "carbs": 90, "fat": 30}, "health_rating": "C", "analysis": "High in calories", "warnings": []}'
              }
            }]
          })
        } as any);
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    let callCount = 0;

    const response = await request(handler)
      .post('/api/run-tool')
      .send({
        tool_slug: 'food-lens',
        input: {
          image_base64: 'data:image/png;base64,test',
          context: 'Pizza'
        }
      })
      .expect(200);

    expect(callCount).toBe(2); // Retried once
    expect(response.body.food_name).toBe('Pizza');
  });

  it('should log interaction to database', async () => {
    const userId = 'test-user-integration';
    
    await request(handler)
      .post('/api/run-tool')
      .send({
        tool_slug: 'food-lens',
        input: { image_base64: 'data:image/png;base64,test' },
        user_id: userId
      });

    // Verify interaction was logged
    const { data } = await supabase
      .from('interactions')
      .select('*')
      .eq('user_id', userId)
      .eq('tool_slug', 'food-lens')
      .order('created_at', { ascending: false })
      .limit(1);

    expect(data).toHaveLength(1);
    expect(data[0].input_data).toHaveProperty('image_base64');
    expect(data[0].output_data).toHaveProperty('food_name');
    expect(data[0].tokens_used).toBeGreaterThan(0);
  });
});
```

---

### 2.2 Context Injection Integration

```typescript
// __tests__/api/context-injection.test.ts
describe('Context Injection in /api/run-tool', () => {
  beforeEach(async () => {
    // Seed user profile and memories
    await supabase.from('user_profiles').insert({
      user_id: 'test-user-context',
      summary: 'Health-conscious software engineer',
      traits: { diet: 'keto', fitness_goal: 'muscle_gain' }
    });

    await supabase.from('memory_embeddings').insert({
      user_id: 'test-user-context',
      content: 'User avoids sugar and processed carbs',
      embedding: await generateEmbedding('User avoids sugar and processed carbs'),
      category: 'health',
      importance: 0.9
    });
  });

  it('should inject relevant context into Food Lens prompt', async () => {
    const response = await request(handler)
      .post('/api/run-tool')
      .send({
        tool_slug: 'food-lens',
        input: {
          image_base64: 'data:image/png;base64,donut_image',
          context: 'Should I eat this?'
        },
        user_id: 'test-user-context'
      })
      .expect(200);

    // LLM should reference user's keto diet in analysis
    expect(response.body.analysis.toLowerCase()).toMatch(/keto|carb|sugar/);
    expect(response.body.warnings).toContain('High in sugar');
  });

  it('should not inject context for tools that don\'t need it', async () => {
    // Infinite Wiki doesn't need personal context
    const response = await request(handler)
      .post('/api/run-tool')
      .send({
        tool_slug: 'infinite-wiki',
        input: { query: 'Photosynthesis' },
        user_id: 'test-user-context'
      })
      .expect(200);

    // Response should be generic, not personalized
    expect(response.body.content).not.toContain('keto');
  });
});
```

---

## 3️⃣ E2E Tests for Hero Tools (4-5 hours)

### 3.1 Food Lens E2E

**Test Framework**: Playwright (for browser automation)

```typescript
// e2e/food-lens.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Food Lens Tool', () => {
  test('should analyze uploaded food image', async ({ page }) => {
    await page.goto('/tools/food-lens');

    // Upload image
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('e2e/fixtures/pizza.jpg');

    // Add optional context
    await page.fill('textarea[placeholder*="context"]', 'This is my dinner');

    // Submit
    await page.click('button:has-text("Analyze")');

    // Wait for streaming response
    await expect(page.locator('[data-testid="food-name"]')).toBeVisible({ timeout: 10000 });

    // Verify output card
    const foodName = await page.textContent('[data-testid="food-name"]');
    expect(foodName).toBeTruthy();

    const calories = await page.textContent('[data-testid="calories"]');
    expect(parseInt(calories!)).toBeGreaterThan(0);

    // Verify macros table
    await expect(page.locator('[data-testid="macros-table"]')).toBeVisible();
    
    // Verify health rating badge
    const rating = await page.textContent('[data-testid="health-rating"]');
    expect(['A', 'B', 'C', 'D', 'F']).toContain(rating);
  });

  test('should show skeleton loader during analysis', async ({ page }) => {
    await page.goto('/tools/food-lens');
    
    await page.locator('input[type="file"]').setInputFiles('e2e/fixtures/salad.jpg');
    await page.click('button:has-text("Analyze")');

    // Skeleton should appear immediately
    await expect(page.locator('[data-testid="skeleton-loader"]')).toBeVisible();

    // Skeleton should disappear when content loads
    await expect(page.locator('[data-testid="skeleton-loader"]')).toBeHidden({ timeout: 10000 });
  });

  test('should handle upload errors gracefully', async ({ page }) => {
    await page.goto('/tools/food-lens');

    // Try to upload invalid file type
    await page.locator('input[type="file"]').setInputFiles('e2e/fixtures/document.pdf');

    // Error message should appear
    await expect(page.locator('text=Please upload an image file')).toBeVisible();
  });
});
```

---

### 3.2 CV Fixer E2E

```typescript
// e2e/cv-fixer.spec.ts
test.describe('CV Fixer Tool', () => {
  test('should process resume PDF and generate LaTeX', async ({ page }) => {
    await page.goto('/tools/cv-fixer');

    // Upload resume
    await page.locator('input[type="file"]').setInputFiles('e2e/fixtures/sample_resume.pdf');

    // Select target role
    await page.click('input[value="Engineering"]');

    // Select fix types
    await page.check('input[value="Grammar"]');
    await page.check('input[value="ATS"]');

    // Submit
    await page.click('button:has-text("Fix My CV")');

    // Wait for output
    await expect(page.locator('[data-testid="summary-of-changes"]')).toBeVisible({ timeout: 15000 });

    // Verify LaTeX code is present
    const latexCode = await page.textContent('[data-testid="latex-code"]');
    expect(latexCode).toContain('\\documentclass');
    expect(latexCode).toContain('\\begin{document}');

    // Verify improvement scores
    const impactScore = await page.textContent('[data-testid="score-impact"]');
    expect(parseInt(impactScore!)).toBeGreaterThanOrEqual(1);
    expect(parseInt(impactScore!)).toBeLessThanOrEqual(100);

    // Test copy button
    await page.click('button:has-text("Copy LaTeX")');
    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboard).toContain('\\documentclass');
  });

  test('should sanitize PII in output', async ({ page }) => {
    await page.goto('/tools/cv-fixer');
    
    await page.locator('input[type="file"]').setInputFiles('e2e/fixtures/resume_with_phone.pdf');
    await page.click('input[value="PM"]');
    await page.click('button:has-text("Fix My CV")');

    await expect(page.locator('[data-testid="latex-code"]')).toBeVisible({ timeout: 15000 });

    const latexCode = await page.textContent('[data-testid="latex-code"]');
    
    // Phone numbers should be replaced with placeholder
    expect(latexCode).not.toMatch(/\d{3}-\d{3}-\d{4}/);
    expect(latexCode).toContain('[PHONE]');
  });
});
```

---

### 3.3 Infinite Wiki E2E

```typescript
// e2e/infinite-wiki.spec.ts
test.describe('Infinite Wiki Tool', () => {
  test('should generate article with clickable links', async ({ page }) => {
    await page.goto('/tools/infinite-wiki');

    // Search for topic
    await page.fill('input[placeholder*="Search"]', 'Quantum Computing');
    await page.press('input[placeholder*="Search"]', 'Enter');

    // Wait for article
    await expect(page.locator('[data-testid="article-title"]')).toBeVisible({ timeout: 10000 });

    const title = await page.textContent('[data-testid="article-title"]');
    expect(title).toContain('Quantum Computing');

    // Verify content has [[links]]
    const content = page.locator('[data-testid="article-content"]');
    await expect(content.locator('a[data-wiki-link]')).toHaveCount({ min: 1 });

    // Click a link to trigger recursive query
    await content.locator('a[data-wiki-link]').first().click();

    // Breadcrumbs should update
    await expect(page.locator('[data-testid="breadcrumbs"]')).toContainText('Quantum Computing');
    
    // New article should load
    await expect(page.locator('[data-testid="article-title"]')).not.toContainText('Quantum Computing');
  });

  test('should navigate breadcrumbs correctly', async ({ page }) => {
    await page.goto('/tools/infinite-wiki');

    // Query 1
    await page.fill('input[placeholder*="Search"]', 'Machine Learning');
    await page.press('input[placeholder*="Search"]', 'Enter');
    await expect(page.locator('[data-testid="article-title"]')).toBeVisible();

    // Query 2 (click link)
    await page.locator('a[data-wiki-link]').first().click();
    await expect(page.locator('[data-testid="breadcrumbs"]')).toContainText('Machine Learning');

    // Click breadcrumb to go back
    await page.click('[data-testid="breadcrumbs"] >> text=Machine Learning');
    
    const title = await page.textContent('[data-testid="article-title"]');
    expect(title).toContain('Machine Learning');
  });
});
```

---

## 4️⃣ Performance Testing (3-4 hours)

### 4.1 Token Usage Benchmarks

```typescript
// __tests__/performance/token-usage.test.ts
describe('Token Usage Benchmarks', () => {
  it('should stay within budget for Food Lens', async () => {
    const response = await request(handler)
      .post('/api/run-tool')
      .send({
        tool_slug: 'food-lens',
        input: { image_base64: 'data:image/png;base64,test' }
      });

    // Verify token usage was logged
    const { data } = await supabase
      .from('interactions')
      .select('tokens_used')
      .order('created_at', { ascending: false })
      .limit(1);

    expect(data[0].tokens_used).toBeLessThan(2000); // Budget: 2k tokens
  });

  it('should track token usage across all tools', async () => {
    const tools = ['food-lens', 'cv-fixer', 'infinite-wiki'];
    const results = [];

    for (const tool of tools) {
      const response = await request(handler)
        .post('/api/run-tool')
        .send({
          tool_slug: tool,
          input: getTestInput(tool)
        });

      const { data } = await supabase
        .from('interactions')
        .select('tokens_used, latency_ms')
        .eq('tool_slug', tool)
        .order('created_at', { ascending: false })
        .limit(1);

      results.push({
        tool,
        tokens: data[0].tokens_used,
        latency: data[0].latency_ms
      });
    }

    console.table(results);

    // Assert average token usage
    const avgTokens = results.reduce((sum, r) => sum + r.tokens, 0) / results.length;
    expect(avgTokens).toBeLessThan(3000);
  });
});
```

---

### 4.2 Latency Benchmarks

```typescript
// __tests__/performance/latency.test.ts
describe('Latency Benchmarks', () => {
  it('should respond within 2 seconds (P95)', async () => {
    const iterations = 20;
    const latencies: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = Date.now();
      
      await request(handler)
        .post('/api/run-tool')
        .send({
          tool_slug: 'food-lens',
          input: { image_base64: 'data:image/png;base64,test' }
        });

      latencies.push(Date.now() - start);
    }

    latencies.sort((a, b) => a - b);
    const p95 = latencies[Math.floor(latencies.length * 0.95)];

    console.log(`P50: ${latencies[Math.floor(latencies.length * 0.5)]}ms`);
    console.log(`P95: ${p95}ms`);
    console.log(`P99: ${latencies[Math.floor(latencies.length * 0.99)]}ms`);

    expect(p95).toBeLessThan(2000);
  });

  it('should stream first chunk within 500ms', async () => {
    const start = Date.now();
    let firstChunkTime = 0;

    await request(handler)
      .post('/api/run-tool')
      .send({
        tool_slug: 'infinite-wiki',
        input: { query: 'Test' },
        stream: true
      })
      .on('data', (chunk) => {
        if (firstChunkTime === 0) {
          firstChunkTime = Date.now() - start;
        }
      });

    expect(firstChunkTime).toBeLessThan(500);
  });
});
```

---

### 4.3 Load Testing

```typescript
// __tests__/performance/load.test.ts
import autocannon from 'autocannon';

describe('Load Testing', () => {
  it('should handle 100 concurrent requests', async () => {
    const result = await autocannon({
      url: 'http://localhost:3000/api/run-tool',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tool_slug: 'food-lens',
        input: { image_base64: 'data:image/png;base64,test' }
      }),
      connections: 100,
      duration: 30 // 30 seconds
    });

    console.log(`Requests: ${result.requests.total}`);
    console.log(`Throughput: ${result.throughput.average} bytes/sec`);
    console.log(`Latency P99: ${result.latency.p99}ms`);

    expect(result.errors).toBe(0);
    expect(result.latency.p99).toBeLessThan(3000);
  });
});
```

---

## 5️⃣ Accessibility Audit (2-3 hours)

### 5.1 Automated Accessibility Testing

**Tool**: Axe-core + Playwright

```typescript
// e2e/accessibility.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Audit', () => {
  test('Food Lens page should have no WCAG 2.1 AA violations', async ({ page }) => {
    await page.goto('/tools/food-lens');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('CV Fixer page should have no WCAG 2.1 AA violations', async ({ page }) => {
    await page.goto('/tools/cv-fixer');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Infinite Wiki page should have no WCAG 2.1 AA violations', async ({ page }) => {
    await page.goto('/tools/infinite-wiki');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
```

---

### 5.2 Manual Accessibility Checklist

**Keyboard Navigation**:
- [ ] All interactive elements are focusable with Tab
- [ ] Focus indicators are clearly visible (2px outline)
- [ ] Modal dialogs trap focus correctly
- [ ] Escape key closes modals and dropdowns

**Screen Reader Support**:
- [ ] All images have descriptive `alt` text
- [ ] Form inputs have associated `<label>` elements
- [ ] ARIA landmarks used correctly (`role="main"`, `role="navigation"`)
- [ ] Loading states announced with `aria-live="polite"`
- [ ] Error messages announced with `aria-live="assertive"`

**Color Contrast**:
- [ ] Text has minimum 4.5:1 contrast ratio (WCAG AA)
- [ ] Large text (18pt+) has minimum 3:1 contrast ratio
- [ ] Glassmorphism backgrounds don't reduce text readability

**Responsive Design**:
- [ ] All tools work at 200% zoom
- [ ] Touch targets are at least 44x44px
- [ ] No horizontal scrolling on mobile (320px width)

---

### 5.3 Accessibility Test Cases

```typescript
// e2e/accessibility-manual.spec.ts
test.describe('Manual Accessibility Tests', () => {
  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/tools/food-lens');

    // Tab through all interactive elements
    await page.keyboard.press('Tab'); // Focus on file input
    await expect(page.locator('input[type="file"]')).toBeFocused();

    await page.keyboard.press('Tab'); // Focus on textarea
    await expect(page.locator('textarea')).toBeFocused();

    await page.keyboard.press('Tab'); // Focus on submit button
    await expect(page.locator('button[type="submit"]')).toBeFocused();

    // Submit with Enter key
    await page.keyboard.press('Enter');
  });

  test('should announce loading state to screen readers', async ({ page }) => {
    await page.goto('/tools/food-lens');

    await page.locator('input[type="file"]').setInputFiles('e2e/fixtures/pizza.jpg');
    await page.click('button:has-text("Analyze")');

    // Verify aria-live region
    const liveRegion = page.locator('[aria-live="polite"]');
    await expect(liveRegion).toContainText('Analyzing');

    await expect(liveRegion).toContainText('Analysis complete', { timeout: 10000 });
  });

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('/tools/food-lens');

    // Get computed styles
    const button = page.locator('button[type="submit"]');
    const bgColor = await button.evaluate((el) => 
      window.getComputedStyle(el).backgroundColor
    );
    const textColor = await button.evaluate((el) => 
      window.getComputedStyle(el).color
    );

    const contrastRatio = calculateContrastRatio(bgColor, textColor);
    expect(contrastRatio).toBeGreaterThanOrEqual(4.5);
  });

  test('should work at 200% zoom', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/tools/food-lens');

    // Zoom to 200%
    await page.evaluate(() => {
      document.body.style.zoom = '2';
    });

    // Verify no horizontal scroll
    const hasHorizontalScroll = await page.evaluate(() => 
      document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(hasHorizontalScroll).toBe(false);

    // Verify all content is still visible
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });
});
```

---

## 📊 Testing Metrics & Success Criteria

### Coverage Targets
- **Unit Tests**: >80% code coverage for `lib/` utilities
- **Integration Tests**: 100% coverage of API routes
- **E2E Tests**: All critical user paths covered (3 tools × 2 scenarios each)

### Performance Targets
- **P95 Latency**: <2000ms for all tools
- **First Chunk**: <500ms for streaming responses
- **Token Usage**: <3000 tokens average per request
- **Error Rate**: <1% failed requests under normal load

### Accessibility Targets
- **Zero WCAG 2.1 AA violations** (automated)
- **100% keyboard navigable**
- **4.5:1 minimum contrast ratio** for all text

---

## 🛠️ Testing Infrastructure Setup

### Install Dependencies

```bash
npm install --save-dev \
  jest \
  @types/jest \
  ts-jest \
  @testing-library/react \
  @testing-library/jest-dom \
  supertest \
  @types/supertest \
  playwright \
  @axe-core/playwright \
  autocannon \
  node-mocks-http
```

### Jest Configuration

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    'lib/**/*.ts',
    'app/api/**/*.ts',
    '!**/*.d.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts']
};
```

### Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  retries: 2,
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'firefox', use: { browserName: 'firefox' } },
    { name: 'webkit', use: { browserName: 'webkit' } }
  ]
});
```

---

## 📋 Testing Checklist (Day 16-17)

### Day 16: Unit & Integration Tests
- [ ] Set up Jest and testing infrastructure (1h)
- [ ] Write unit tests for `embeddings.ts` (1.5h)
- [ ] Write unit tests for `context-engine.ts` (1.5h)
- [ ] Write unit tests for `prompt-injector.ts` (1h)
- [ ] Write integration tests for `/api/run-tool` (3h)
- [ ] Achieve >80% code coverage (1h)

### Day 17: E2E, Performance & Accessibility
- [ ] Set up Playwright (0.5h)
- [ ] Write E2E tests for Food Lens (1.5h)
- [ ] Write E2E tests for CV Fixer (1.5h)
- [ ] Write E2E tests for Infinite Wiki (1.5h)
- [ ] Run performance benchmarks (token, latency, load) (2h)
- [ ] Run accessibility audit with Axe (1h)
- [ ] Fix any violations found (2h)
- [ ] Document test results and metrics (0.5h)

---

## 🎯 Definition of Done

Phase 6.5 is complete when:
1. ✅ All unit tests pass with >80% coverage
2. ✅ All integration tests pass
3. ✅ All E2E tests pass across Chrome, Firefox, Safari
4. ✅ P95 latency <2000ms for all tools
5. ✅ Zero WCAG 2.1 AA violations
6. ✅ Test suite runs in CI/CD pipeline
7. ✅ Test results documented in `TEST_RESULTS.md`

---

## 📋 See Also

- **[ADAM.md](./ADAM.md)** — Concept Document
- **[EVE.md](./EVE.md)** — Implementation Plan
- **[CAIN.md](./CAIN.md)** — Intelligence & Contracts
