// Native fetch is available in Node 18+

// Configuration
const BASE_URL = 'http://localhost:3000';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

async function run() {
    let idea = process.argv[2];
    const filePath = process.argv[3];

    if (!idea) {
        console.error("Please provide a tool idea in quotes.");
        console.error("Usage: node scripts/test_forge.js \"A tool that...\" [optional_context_file]");
        process.exit(1);
    }

    if (filePath) {
        try {
            const fs = require('fs');
            const fileContent = fs.readFileSync(filePath, 'utf8');
            idea += `\n\nCONTEXT:\n${fileContent}`;
            console.log(`\n📄 Added context from ${filePath}`);
        } catch (err) {
            console.error(`Failed to read file ${filePath}:`, err.message);
            process.exit(1);
        }
    }

    console.log(`\n🔨 Tool Forge: "${process.argv[2]}" (with context)\n`);

    try {
        // 1. Generate Tool Definition
        console.log("1. Generating tool definition...");
        const runToolResponse = await fetch(`${BASE_URL}/api/run-tool`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                toolSlug: 'tool-forge', // The meta-tool
                input: { idea: idea }
            })
        });

        if (!runToolResponse.ok) {
            throw new Error(`Run Tool Failed: ${runToolResponse.statusText} ${await runToolResponse.text()}`);
        }

        const toolDefinition = await runToolResponse.json();
        console.log("✨ Generated Definition:");
        console.log(JSON.stringify(toolDefinition, null, 2));

        // 2. Save Tool to DB
        console.log("\n2. Saving to Registry...");
        const saveResponse = await fetch(`${BASE_URL}/api/admin/create-tool`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(toolDefinition)
        });

        if (!saveResponse.ok) {
            throw new Error(`Save Failed: ${saveResponse.statusText} ${await saveResponse.text()}`);
        }

        const saveResult = await saveResponse.json();
        console.log("✅ Tool Created Successfully!");
        console.log(`Slug: ${saveResult.tool.slug}`);
        console.log(`ID: ${saveResult.tool.id}`);

    } catch (error) {
        console.error("\n❌ Error:", error.message);
    }
}

run();
