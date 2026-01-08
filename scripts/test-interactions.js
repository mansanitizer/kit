const { createClient } = require('@supabase/supabase-js');
const { randomUUID } = require('crypto');

// Mock environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_KEY) {
    console.error("Please set NEXT_PUBLIC_SUPABASE_ANON_KEY env var");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const BASE_URL = 'http://localhost:3000';

async function testInteractionScoping() {
    console.log("--- Testing Interaction Scoping ---");
    const toolSlug = 'test-tool';
    const ownerId = randomUUID();
    const attackerId = randomUUID();

    // 1. Create Interaction for Owner
    console.log(`1. Creating interaction for Owner: ${ownerId}`);
    const { data: interaction, error: createError } = await supabase
        .from('interactions')
        .insert({
            tool_slug: toolSlug,
            input_data: { test: 'data' },
            output_data: { result: 'ok' },
            user_id: ownerId
        })
        .select()
        .single();

    if (createError) {
        console.error("Failed to create interaction:", createError);
        return;
    }
    console.log(`   Created interaction: ${interaction.id}`);

    // 2. Attacker tries to GET interactions (should NOT find it)
    // We mock the fetch to our API endpoint
    console.log(`2. Attacker (${attackerId}) fetches interactions`);
    try {
        const res = await fetch(`${BASE_URL}/api/interactions?limit=10`, {
            headers: { 'x-session-id': attackerId }
        });
        const data = await res.json();
        const found = data.interactions?.find(i => i.id === interaction.id);

        if (!found) {
            console.log("   SUCCESS: Interaction Hidden from Attacker");
        } else {
            console.error("   FAILURE: Attacker can see Owner's interaction!");
        }
    } catch (e) { console.error(e); }

    // 3. Owner fetches interactions (SHOULD find it)
    console.log(`3. Owner (${ownerId}) fetches interactions`);
    try {
        const res = await fetch(`${BASE_URL}/api/interactions?limit=10`, {
            headers: { 'x-session-id': ownerId }
        });
        const data = await res.json();
        const found = data.interactions?.find(i => i.id === interaction.id);

        if (found) {
            console.log("   SUCCESS: Owner sees interaction");
        } else {
            console.error("   FAILURE: Owner cannot see their interaction");
        }
    } catch (e) { console.error(e); }

    // 4. Attacker tries to DELETE (should fail)
    console.log(`4. Attacker tries DELETE`);
    try {
        const res = await fetch(`${BASE_URL}/api/interactions/${interaction.id}`, {
            method: 'DELETE',
            headers: { 'x-session-id': attackerId }
        });
        if (res.status === 403 || res.status === 404) {
            console.log(`   SUCCESS: Blocked (${res.status})`);
        } else {
            console.error(`   FAILURE: Unexpected status ${res.status}`);
        }
    } catch (e) { console.error(e); }

    // 5. Owner tries to DELETE (should succeed)
    console.log(`5. Owner tries DELETE`);
    try {
        const res = await fetch(`${BASE_URL}/api/interactions/${interaction.id}`, {
            method: 'DELETE',
            headers: { 'x-session-id': ownerId }
        });
        if (res.status === 200) {
            console.log("   SUCCESS: Deleted");
        } else {
            console.error(`   FAILURE: Unexpected status ${res.status}`);
            console.log(await res.text());
        }
    } catch (e) { console.error(e); }
}

testInteractionScoping();
