const { createClient } = require('@supabase/supabase-js');

// Mock environment variables since we are running a script
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
// Use ANON key for dev testing since RLS is open
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_KEY) {
    console.error("Please set NEXT_PUBLIC_SUPABASE_ANON_KEY env var");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testDeleteTool() {
    console.log("--- Testing Tool Deletion ---");
    const slug = `test-tool-${Date.now()}`;

    // 1. Create Tool
    const { data: tool, error: createError } = await supabase
        .from('tools')
        .insert({
            slug,
            name: 'Test Tool',
            description: 'A temporary tool for testing delete',
            system_prompt: 'You are a test.',
            model: 'test-model',
            input_schema: {},
            output_schema: {}
        })
        .select()
        .single();

    if (createError) {
        console.error("Failed to create tool:", createError);
        return;
    }
    console.log(`Created tool: ${tool.slug} (${tool.id})`);

    // 2. Simulate Backend Logic (Move to Recycle Bin + Delete)
    // Since we can't call the Next.js API directly from this node script without running the server,
    // we will manually run the helper logic here to verify valid SQL permissions and flow.
    // Ideally we would fetch against localhost:3000 but the server might not be running.

    // Step 2a: Insert to Recycle Bin
    const { error: recycleError } = await supabase
        .from('recycle_bin')
        .insert({
            original_id: tool.id,
            item_type: 'tool',
            display_text: tool.name,
            data: tool
        });

    if (recycleError) {
        console.error("Failed to move to recycle bin:", recycleError);
        return;
    }
    console.log("Moved to recycle bin.");

    // Step 2b: Delete from Tools
    const { error: deleteError } = await supabase
        .from('tools')
        .delete()
        .eq('id', tool.id);

    if (deleteError) {
        console.error("Failed to delete tool:", deleteError);
        return;
    }
    console.log("Deleted from tools table.");

    // 3. Verify
    const { data: checkTool } = await supabase.from('tools').select('*').eq('id', tool.id).maybeSingle();
    const { data: checkRecycle } = await supabase.from('recycle_bin').select('*').eq('original_id', tool.id).single();

    if (!checkTool) console.log("SUCCESS: Tool is gone from tools table.");
    else console.error("FAILURE: Tool still exists in tools table.");

    if (checkRecycle) console.log("SUCCESS: Tool found in recycle_bin.");
    else console.error("FAILURE: Tool not found in recycle_bin.");
}

async function testDeleteFile() {
    console.log("\n--- Testing File Deletion ---");
    const { data: file, error: createError } = await supabase
        .from('user_files')
        .insert({
            filename: `test-file-${Date.now()}.txt`,
            file_type: 'document',
            content: 'test content'
        })
        .select()
        .single();

    if (createError) {
        console.error("Failed to create file:", createError);
        return;
    }
    console.log(`Created file: ${file.filename} (${file.id})`);

    // Recycle
    const { error: recycleError } = await supabase
        .from('recycle_bin')
        .insert({
            original_id: file.id,
            item_type: 'file',
            display_text: file.filename,
            data: file
        });

    if (recycleError) { console.error(recycleError); return; }

    // Delete
    const { error: deleteError } = await supabase.from('user_files').delete().eq('id', file.id);
    if (deleteError) { console.error(deleteError); return; }

    console.log("File deleted and recycled successfully (simulated flow).");
}

async function run() {
    await testDeleteTool();
    await testDeleteFile();
}

run();
