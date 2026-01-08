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

async function testOwnership() {
    console.log("--- Testing Tool Ownership & Security ---");
    const slug = `test-tool-owner-${Date.now()}`;
    const ownerId = randomUUID();
    const attackerId = randomUUID();

    console.log(`1. Creating tool for Owner: ${ownerId}`);
    const { data: tool, error: createError } = await supabase
        .from('tools')
        .insert({
            slug,
            name: 'Owner Tool',
            description: 'Owned by A',
            system_prompt: 'test',
            model: 'test',
            user_id: ownerId,
            input_schema: {},
            output_schema: {}
        })
        .select()
        .single();

    if (createError) {
        console.error("Failed to create tool:", createError);
        return;
    }
    console.log(`   Created tool: ${tool.slug}`);

    // 2. Try to Delete as Attacker
    console.log(`2. Attempting delete as Attacker: ${attackerId}`);
    try {
        const res = await fetch(`${BASE_URL}/api/tools/${slug}`, {
            method: 'DELETE',
            headers: {
                'x-session-id': attackerId
            }
        });

        if (res.status === 403) {
            console.log("   SUCCESS: Blocked (403 Forbidden)");
        } else {
            console.error(`   FAILURE: Unexpected status ${res.status}`);
        }
    } catch (e) {
        console.log("   (Skipping API test if server not reachable)");
    }

    // 3. Delete as Owner
    console.log(`3. Attempting delete as Owner: ${ownerId}`);
    try {
        const res = await fetch(`${BASE_URL}/api/tools/${slug}`, {
            method: 'DELETE',
            headers: {
                'x-session-id': ownerId
            }
        });

        if (res.status === 200) {
            console.log("   SUCCESS: Deleted (200 OK)");
        } else {
            console.error(`   FAILURE: Unexpected status ${res.status}`);
            const txt = await res.text();
            console.log("   Response:", txt);
        }
    } catch (e) {
        console.log("   (Skipping API test if server not reachable)");
    }

    // Cleanup if needed (if delete passed, it's gone from tools)
}

testOwnership();
