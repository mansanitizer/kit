-- Bulk Upsert of Tools with ENRICHED Input Schemas (Sliders, Radios, MultiSelects)

-- 1. Say This Better (Added: desired_tone [Radio])
INSERT INTO tools (slug, name, description, icon, color, system_prompt, input_schema, output_schema)
VALUES (
 'say-this-better',
 'Say This Better',
 'Rewrites messages to avoid social damage.',
 'MessageSquare',
 'from-blue-500 to-cyan-500',
 $$You are a socially intelligent communicator. Rewrite the user’s message into 3 variants based on the desired tone. Be concise. No explanations. Return strict JSON. LAYOUT INSTRUCTIONS: Return a '_layout' field: '[[variants]] [[risk_note]]'.$$,
 $$ { 
    "type": "object", 
    "properties": { 
        "message": { "type": "string", "maxLength": 500, "description": "The drafted message" }, 
        "context": { "type": "string", "description": "Who are you sending this to?" },
        "desired_tone": { "type": "string", "enum": ["Professional", "Casual", "Empathetic", "Direct", "Witty"], "description": "Target vibe" } 
    }, 
    "required": ["message"] 
 } $$,
 $$ { "type": "object", "properties": { "variants": { "type": "array", "items": { "type": "string" }, "description": "3 rewritten message options" }, "risk_note": { "type": "string", "description": "One-line social risk warning" }, "_layout": { "type": "string" } } } $$
)
ON CONFLICT (slug) DO UPDATE SET 
    input_schema = EXCLUDED.input_schema,
    system_prompt = EXCLUDED.system_prompt;

-- 2. What Should I Reply? (Added: relationship [Radio], urgency [Slider])
INSERT INTO tools (slug, name, description, icon, color, system_prompt, input_schema, output_schema)
VALUES (
 'what-should-i-reply',
 'What Should I Reply?',
 'Generates calm replies to messages.',
 'MessageCircle',
 'from-indigo-500 to-violet-500',
 $$You are calm, empathetic, and practical. Suggest replies based on relationship depth. Return strict JSON only. LAYOUT INSTRUCTIONS: Return a '_layout' field: '[[primary_reply]] [[alt_reply]] [[tone]]'.$$,
 $$ { 
    "type": "object", 
    "properties": { 
        "received_message": { "type": "string", "description": "Text of message received" }, 
        "image": { "type": "string", "format": "data-url", "description": "Screenshot (optional)" },
        "relationship": { "type": "string", "enum": ["Stranger", "Acquaintance", "Friend", "Partner", "Family", "Boss"], "description": "Who is this?" },
        "urgency": { "type": "integer", "minimum": 1, "maximum": 10, "unit": "/10", "description": "1 = Whenever, 10 = ASAP" }
    }, 
    "required": ["received_message"] 
 } $$,
 $$ { "type": "object", "properties": { "primary_reply": { "type": "string" }, "alt_reply": { "type": "string" }, "tone": { "type": "string", "description": "Detected emotional tone" }, "_layout": { "type": "string" } } } $$
)
ON CONFLICT (slug) DO UPDATE SET 
    input_schema = EXCLUDED.input_schema,
    system_prompt = EXCLUDED.system_prompt;

-- 3. Explain This Simply (Added: expertise_level [Radio])
INSERT INTO tools (slug, name, description, icon, color, system_prompt, input_schema, output_schema)
VALUES (
 'explain-simply',
 'Explain This Simply',
 'Turns confusion into clarity.',
 'BookOpen',
 'from-emerald-500 to-teal-500',
 $$You explain things to tired people. Adapt to the requested expertise level. No jargon. Max 3 bullet points. Strict JSON. LAYOUT INSTRUCTIONS: Return a '_layout' field: '[[explanation]] [[difficulty]]'.$$,
 $$ { 
    "type": "object", 
    "properties": { 
        "topic": { "type": "string", "description": "What is confusing you?" }, 
        "expertise_level": { "type": "string", "enum": ["5-Year-Old", "High School", "College", "Expert"], "description": "Explain like I am a..." }
    }, 
    "required": ["topic"] 
 } $$,
 $$ { "type": "object", "properties": { "explanation": { "type": "array", "items": { "type": "string" }, "description": "Up to 3 bullets" }, "difficulty": { "type": "string", "description": "easy | medium | hard" }, "_layout": { "type": "string" } } } $$
)
ON CONFLICT (slug) DO UPDATE SET 
    input_schema = EXCLUDED.input_schema,
    system_prompt = EXCLUDED.system_prompt;

-- 4. Is This a Bad Idea? (Added: stakes [Slider], risk_tolerance [Radio])
INSERT INTO tools (slug, name, description, icon, color, system_prompt, input_schema, output_schema)
VALUES (
 'bad-idea-check',
 'Is This a Bad Idea?',
 'Quick reality check before acting.',
 'AlertTriangle',
 'from-orange-500 to-red-500',
 $$You are a skeptical advisor. Consider the stakes. Identify risks. Strict JSON. LAYOUT INSTRUCTIONS: Return a '_layout' field: '[[verdict]] [[risks]]'.$$,
 $$ { 
    "type": "object", 
    "properties": { 
        "idea": { "type": "string", "description": "What are you thinking of doing?" },
        "stakes": { "type": "integer", "minimum": 1, "maximum": 10, "unit": "/10", "description": "How ruinous if it fails?" },
        "risk_tolerance": { "type": "string", "enum": ["Safe Player", "YOLO"], "description": "Your vibe" }
    }, 
    "required": ["idea"] 
 } $$,
 $$ { "type": "object", "properties": { "verdict": { "type": "string", "description": "Likely fine | Risky | Bad idea" }, "risks": { "type": "array", "items": { "type": "string" } }, "_layout": { "type": "string" } } } $$
)
ON CONFLICT (slug) DO UPDATE SET 
    input_schema = EXCLUDED.input_schema,
    system_prompt = EXCLUDED.system_prompt;

-- 5. Thread to Action Items (Added: output_format [Radio])
INSERT INTO tools (slug, name, description, icon, color, system_prompt, input_schema, output_schema)
VALUES (
 'thread-to-actions',
 'Thread -> Actions',
 'Extracts what actually needs to be done.',
 'CheckSquare',
 'from-green-500 to-lime-500',
 $$You extract tasks. Respect the requested output format. Strict JSON. LAYOUT INSTRUCTIONS: Return a '_layout' field: '[[actions]] [[open_questions]]'.$$,
 $$ { 
    "type": "object", 
    "properties": { 
        "thread_text": { "type": "string", "description": "Paste the email/slack thread" },
        "output_format": { "type": "string", "enum": ["Bullet Points", "Checklist", "Jira Tickets"], "description": "How do you want it?" }
    }, 
    "required": ["thread_text"] 
 } $$,
 $$ { "type": "object", "properties": { "actions": { "type": "array", "items": { "type": "string" } }, "open_questions": { "type": "array", "items": { "type": "string" } }, "_layout": { "type": "string" } } } $$
)
ON CONFLICT (slug) DO UPDATE SET 
    input_schema = EXCLUDED.input_schema,
    system_prompt = EXCLUDED.system_prompt;

-- 6. Tone Check (Added: audience [Radio])
INSERT INTO tools (slug, name, description, icon, color, system_prompt, input_schema, output_schema)
VALUES (
 'tone-check',
 'Tone Check',
 'Detects how your message might land.',
 'Activity',
 'from-purple-500 to-fuchsia-500',
 $$You evaluate social tone. Context matters. Strict JSON output. LAYOUT INSTRUCTIONS: Return a '_layout' field: '[[perceived_tone, misfire_risk]] [[note]]'.$$,
 $$ { 
    "type": "object", 
    "properties": { 
        "draft": { "type": "string", "description": "Your input text" }, 
        "audience": { "type": "string", "enum": ["Boss", "Colleague", "Friend", "Partner", "Internet"], "description": "Who reads this?" }
    }, 
    "required": ["draft"] 
 } $$,
 $$ { "type": "object", "properties": { "perceived_tone": { "type": "string" }, "misfire_risk": { "type": "string", "description": "Low | Medium | High" }, "note": { "type": "string" }, "_layout": { "type": "string" } } } $$
)
ON CONFLICT (slug) DO UPDATE SET 
    input_schema = EXCLUDED.input_schema,
    system_prompt = EXCLUDED.system_prompt;

-- 7. Cut the Fluff (Added: intensity [Slider])
INSERT INTO tools (slug, name, description, icon, color, system_prompt, input_schema, output_schema)
VALUES (
 'cut-the-fluff',
 'Cut the Fluff',
 'Shortens text without weakening it.',
 'Scissors',
 'from-zinc-500 to-stone-500',
 $$You are ruthless about brevity. Intensity determines how much to cut (1=Light trim, 10=Minimalist). Strict JSON. LAYOUT INSTRUCTIONS: Return a '_layout' field: '[[shortened_text]] [[reduction_pct]]'.$$,
 $$ { 
    "type": "object", 
    "properties": { 
        "text": { "type": "string", "description": "Paste verbose text" },
        "intensity": { "type": "integer", "minimum": 1, "maximum": 10, "unit": "/10", "description": "1 = Light trim, 10 = Brutal" }
    }, 
    "required": ["text"] 
 } $$,
 $$ { "type": "object", "properties": { "shortened_text": { "type": "string" }, "reduction_pct": { "type": "integer", "unit": "%" }, "_layout": { "type": "string" } } } $$
)
ON CONFLICT (slug) DO UPDATE SET 
    input_schema = EXCLUDED.input_schema,
    system_prompt = EXCLUDED.system_prompt;

-- 8. Pick Between Two (Added: importance [Slider])
INSERT INTO tools (slug, name, description, icon, color, system_prompt, input_schema, output_schema)
VALUES (
 'pick-between-two',
 'Pick Between Two',
 'Breaks ties when you’re stuck.',
 'Scale',
 'from-yellow-500 to-amber-500',
 $$You help users decide. Weight based on importance. Strict JSON only. LAYOUT INSTRUCTIONS: Return a '_layout' field: '[[recommendation]] [[why]] [[tradeoff]]'.$$,
 $$ { 
    "type": "object", 
    "properties": { 
        "option_a": { "type": "string", "description": "Option A" }, 
        "option_b": { "type": "string", "description": "Option B" }, 
        "importance": { "type": "integer", "minimum": 1, "maximum": 10, "unit": "/10", "description": "How big of a deal is this?" }
    }, 
    "required": ["option_a", "option_b"] 
 } $$,
 $$ { "type": "object", "properties": { "recommendation": { "type": "string" }, "why": { "type": "string" }, "tradeoff": { "type": "string" }, "_layout": { "type": "string" } } } $$
)
ON CONFLICT (slug) DO UPDATE SET 
    input_schema = EXCLUDED.input_schema,
    system_prompt = EXCLUDED.system_prompt;

-- 9. CV Fixer (Enriched with MultiSelect)
INSERT INTO tools (slug, name, description, icon, color, system_prompt, input_schema, output_schema)
VALUES (
 'cv-fixer',
 'CV Fixer',
 'Modernize your resume for top-tier tech roles.',
 'FileText',
 'from-pink-500 to-rose-500',
 $$You are a FAANG recruiter. Optimize CV based on focus areas. Strict JSON. LAYOUT INSTRUCTIONS: Return a '_layout' field: '[[score]] [[summary]] [[fix_list]]'.$$,
 $$ { 
    "type": "object", 
    "properties": { 
        "cv_text": { "type": "string", "description": "Paste resume text" },
        "target_level": { "type": "string", "enum": ["Intern", "Junior", "Senior", "Staff", "Executive"], "description": "Target Seniority" },
        "focus_areas": { 
            "type": "array", 
            "items": { "type": "string", "enum": ["Formatting", "Action Verbs", "Quantifiable Impact", "Brevity", "Keywords"] }, 
            "description": "What should we improve?" 
        }
    }, 
    "required": ["cv_text"] 
 } $$,
 $$ { "type": "object", "properties": { "score": { "type": "integer", "unit": "/ 100" }, "_layout": { "type": "string" }, "summary": { "type": "string" }, "fix_list": { "type": "array", "items": { "type": "string" } } } } $$
)
ON CONFLICT (slug) DO UPDATE SET 
    input_schema = EXCLUDED.input_schema,
    system_prompt = EXCLUDED.system_prompt;
