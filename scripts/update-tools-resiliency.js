const ADMIN_KEY = 'jabberwockymonkey';
const API_URL = 'http://localhost:3000/api/admin/tools';

const layouts = {
    'cv-fixer': '[[score]] [[summary]] [[fix_list]]',
    'laundry-crisis': '[[image]] [[stain_type, fabric_risk]] [[steps]] [[warnings]]',
    'stain-savior': '[[stain_type, fabric_risk]] [[steps]] [[warnings]]',
    'tomato-rater': '[[score, ripeness]] [[defects]] [[recommendation]]',
    'book-lens': '[[title, author]] [[rating, verdict]] [[summary]] [[similar_books]]',
    'food-lens': '[[food_name, health_rating]] [[calories]] [[macros]] [[analysis]] [[warnings]]',
    'pick-between-two': '[[recommendation]] [[why]] [[tradeoff]]',
    'statement-analyzer': '[[total_spend]] [[categories]] [[subscriptions]]',
    'gift-scout': '[[gift_ideas]] [[vibe_analysis]]',
    'pet-comic': '[[caption]] [[comic_prompt]]',
    'mnemonic-maker': '[[mnemonic]] [[explanation]] [[visual_prompt]]',
    'argument-ammo': '[[analysis]] [[logical_reply]] [[witty_reply]]'
};

async function updateTools() {
    console.log('Fetching tools...');
    const response = await fetch(API_URL, {
        headers: { 'x-admin-key': ADMIN_KEY }
    });
    const { tools } = await response.json();

    for (const tool of tools) {
        console.log(`Updating ${tool.slug}...`);

        // 1. Determine Layout
        let layout = layouts[tool.slug];
        if (!layout) {
            const keys = Object.keys(tool.output_schema.properties || {}).filter(k => k !== '_layout');
            layout = keys.map(k => `[[${k}]]`).join(' ');
        }

        // 2. Update System Prompt
        let system_prompt = tool.system_prompt;
        const layoutInstruction = `\n\nLAYOUT INSTRUCTIONS:\nYou MUST return a _layout field containing exactly matching keys in this exact format: ${layout}`;

        if (system_prompt.includes('LAYOUT INSTRUCTIONS:')) {
            system_prompt = system_prompt.replace(/LAYOUT INSTRUCTIONS:[\s\S]*/, layoutInstruction);
        } else {
            system_prompt += layoutInstruction;
        }

        // 3. Update Output Schema
        const output_schema = { ...tool.output_schema };
        if (!output_schema.properties) output_schema.properties = {};

        // Ensure _layout exists in properties
        output_schema.properties._layout = { type: 'string' };

        // Add to required if not present
        if (!output_schema.required) output_schema.required = [];
        if (!output_schema.required.includes('_layout')) {
            output_schema.required.push('_layout');
        }

        // 4. Submit Update
        const updateResponse = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-admin-key': ADMIN_KEY
            },
            body: JSON.stringify({
                ...tool,
                system_prompt,
                output_schema
            })
        });

        if (updateResponse.ok) {
            console.log(`✅ ${tool.slug} updated successfully.`);
        } else {
            console.error(`❌ Failed to update ${tool.slug}:`, await updateResponse.text());
        }
    }
    console.log('All updates complete.');
}

updateTools();
