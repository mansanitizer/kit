const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const baseUrl = 'http://localhost:3000';

// Colors for output
const colors = {
    reset: "\x1b[0m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    cyan: "\x1b[36m"
};

function log(msg, color = colors.reset) {
    console.log(`${color}${msg}${colors.reset}`);
}

async function uploadFile(filename, content, type, sessionId) {
    const blob = new Blob([content], { type });
    const formData = new FormData();
    formData.append('file', blob, filename);
    formData.append('sessionId', sessionId);

    const res = await fetch(`${baseUrl}/api/upload`, { method: 'POST', body: formData });
    if (!res.ok) throw new Error(`Upload Failed: ${res.status} ${await res.text()}`);
    return await res.json();
}

async function runTool(toolSlug, sessionId, input) {
    const res = await fetch(`${baseUrl}/api/run-tool`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolSlug, sessionId, input })
    });
    if (!res.ok) throw new Error(`Run Tool Failed: ${res.status} ${await res.text()}`);
    return await res.json();
}

async function runTests() {
    log("=== STARTING EXTENDED RAG VERIFICATION ===", colors.cyan);

    const sessionA = uuidv4();
    const sessionB = uuidv4();
    const toolSlug = 'cv-fixer'; // Assumed existing tool

    // --- TEST 1: Basic Text RAG ---
    log(`\n[Test 1] Basic Text RAG (Session A: ${sessionA})`, colors.yellow);
    try {
        const secret = `SECRET-KEY-${Date.now()}`;
        const filename = `secret_${Date.now()}.txt`;
        await uploadFile(filename, `The secret key is ${secret}.`, 'text/plain', sessionA);
        log(`✓ Uploaded ${filename}`, colors.green);

        const output = await runTool(toolSlug, sessionA, {
            user_request: `What is the secret key in @@${filename}? Return JSON { "key": "..." }`
        });

        const outputStr = JSON.stringify(output);
        if (outputStr.includes(secret)) {
            log(`✓ Verified: found secret ${secret}`, colors.green);
        } else {
            throw new Error(`Failed to find secret. Output: ${outputStr}`);
        }
    } catch (e) {
        log(`✗ Test 1 Failed: ${e.message}`, colors.red);
        if (e.cause) console.error(e.cause);
    }

    // --- TEST 2: Multiple Files ---
    log(`\n[Test 2] Multiple File Injection`, colors.yellow);
    try {
        const file1 = `file1_${Date.now()}.txt`;
        const file2 = `file2_${Date.now()}.txt`;
        await uploadFile(file1, "Content of file one.", 'text/plain', sessionA);
        await uploadFile(file2, "Content of file two.", 'text/plain', sessionA);

        // We just check if the call succeeds and mentions fetching them in logs (implicit check)
        // ideally we check the output reflects both.
        const output = await runTool(toolSlug, sessionA, {
            user_request: `Contrast content of @@${file1} and @@${file2}.`
        });
        log(`✓ Call successful with multiple files`, colors.green);
        console.log("Output snippet:", JSON.stringify(output).substring(0, 100));

    } catch (e) {
        log(`✗ Test 2 Failed: ${e.message}`, colors.red);
    }

    // --- TEST 3: Session Isolation ---
    log(`\n[Test 3] Session Isolation (User B accessing User A's file)`, colors.yellow);
    try {
        const secureFile = `secure_${Date.now()}.txt`;
        const secureContent = "User A Private Data";
        await uploadFile(secureFile, secureContent, 'text/plain', sessionA);

        const output = await runTool(toolSlug, sessionB, { // User B
            user_request: `Read @@${secureFile}`
        });

        const outputStr = JSON.stringify(output);
        // The context injection logic filters by user_id, so User B should NOT get the file content injected.
        // The LLM should say "I don't see that file" or similar, or just not have the context.
        // We strictly check that the secret content is NOT in the analysis if it was somehow injected.

        // Actually, if context is missing, LLM might hallucinate, but it definitely won't have the exact string "User A Private Data" unless it hallucinates it exactly.
        if (outputStr.includes(secureContent)) {
            throw new Error("SECURITY FAIL: User B accessed User A's file content!");
        } else {
            log(`✓ Verified: User B could not read User A's file`, colors.green);
        }

    } catch (e) {
        log(`✗ Test 3 Failed: ${e.message}`, colors.red);
    }

    // --- TEST 4: Image Handling (Minimal PNG) ---
    log(`\n[Test 4] Image Upload (Tiny PNG)`, colors.yellow);
    try {
        // 1x1 Transparent PNG
        const pngBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64');
        const imgName = `pixel_${Date.now()}.png`;

        // Start upload
        log("Uploading PNG...", colors.blue);
        const data = await uploadFile(imgName, pngBuffer, 'image/png', sessionA);

        log(`✓ Uploaded Image: ${data.filename}`, colors.green);
        log(`  Description Preview: ${data.preview}`, colors.cyan);

        if (data.type !== 'image') throw new Error("File type mismatch");
        if (!data.preview || data.preview.length < 5) throw new Error("No description generated");

    } catch (e) {
        log(`✗ Test 4 Failed: ${e.message}`, colors.red);
        log("Note: This might fail if the Vision API Key is invalid or rate limited.", colors.yellow);
    }

    log("\n=== VERIFICATION COMPLETE ===", colors.cyan);
}

runTests();
