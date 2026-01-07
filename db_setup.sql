-- 1. Add missing columns for UI/Theme support
ALTER TABLE tools ADD COLUMN IF NOT EXISTS color text DEFAULT 'from-gray-500 to-slate-500';
ALTER TABLE tools ADD COLUMN IF NOT EXISTS icon text DEFAULT 'Box';

-- 2. Insert the CV Fixer Tool (Now with input_schema!)
INSERT INTO tools (slug, name, description, icon, color, system_prompt, input_schema, output_schema)
VALUES (
 'cv-fixer',
 'CV Fixer',
 'Modernize your resume for top-tier tech roles.',
 'FileText', 
 'from-pink-500 to-rose-500', 
 $$You are a savage FAANG recruiter. You hate fluff. Analyze the user's CV text. Return a strict JSON response. 

CRITICAL: You must return the response in strict JSON format.

LAYOUT INSTRUCTIONS: 
You must return a '_layout' field: '[[score]] [[summary]] [[fix_list]]'.

- score: integer 0-100 rating
- summary: 1 sentence verdict
- fix_list: array of strings (bullet points)$$,
 
 -- Missing field that caused error:
 $$ {
    "type": "object",
    "properties": {
      "cv_text": { "type": "string", "description": "The full text of the resume" },
      "context": { "type": "string", "description": "Target role or specific constraints" }
    },
    "required": ["cv_text"]
 } $$,

 $$ { 
   "type": "object", 
   "properties": { 
     "score": {"type": "integer", "unit": "/ 100"}, 
     "summary": {"type": "string"}, 
     "fix_list": {"type": "array", "items": {"type": "string"}}, 
     "_layout": {"type": "string"} 
   } 
 } $$
);
