// Native fetch is available in Node 18+

const BASE_URL = 'http://localhost:3000';

async function run() {
    console.log("\n🧪 Recursive Validation Pipeline initiating...\n");

    try {
        // Step 1: Generate a Tool
        const idea = "A tool that rates photos of pizza based on cheesiness and crust char. Strict JSON.";
        console.log(`1️⃣  Forge: Generating tool for: "${idea}"...`);

        const forgeResponse = await fetch(`${BASE_URL}/api/run-tool`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                toolSlug: 'tool-forge',
                input: { idea: idea }
            })
        });

        if (!forgeResponse.ok) throw new Error(`Forge failed: ${forgeResponse.statusText}`);
        const generatedTool = await forgeResponse.json();

        if (generatedTool._tool_forge_status === 'error') {
            console.warn(`   ⚠️  Tool Forge Save Warning: ${generatedTool._tool_forge_error}`);
            console.warn("      (Proceeding with validation of the generated artifact despite save failure...)");
        }

        console.log("   ✅ Tool Generated successfully.");
        console.log(`      Slug: ${generatedTool.slug}`);

        // Step 2: Validate the Tool
        console.log("\n2️⃣  Validator: Checking against Abraham Schema...");

        // The validator expects a stringified JSON object
        const jsonString = JSON.stringify(generatedTool, null, 2);

        const payload = {
            toolSlug: 'abraham-validator',
            input: { json_object: jsonString }
        };
        console.log("   📤 Sending payload to validator (preview first 100 chars):", JSON.stringify(payload).substring(0, 100) + "...");

        const validateResponse = await fetch(`${BASE_URL}/api/run-tool`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!validateResponse.ok) throw new Error(`Validator failed: ${validateResponse.statusText}`);
        const validationResult = await validateResponse.json();

        console.log("\n   📥 Raw Validation Response:", JSON.stringify(validationResult, null, 2));

        console.log("\n📊 Validation Report:");
        console.log("----------------------------------------");

        // Handle rendering of the validation result based on its layout
        // We expect: [[is_valid, validation_summary]] [[validation_errors]] [[schema_compliance]]

        console.log(`Is Valid: ${validationResult.is_valid}`);
        console.log(`Summary:  ${validationResult.validation_summary}`);

        if (validationResult.validation_errors && validationResult.validation_errors.length > 0) {
            console.log("\n❌ Errors:");
            validationResult.validation_errors.forEach(err => console.log(`   - ${err}`));
        } else {
            console.log("\n✅ No Errors Found.");
        }

        if (validationResult.schema_compliance) {
            console.log(`\nCompliance Score/Notes: ${validationResult.schema_compliance}`);
        }
        console.log("----------------------------------------");


    } catch (error) {
        console.error("\n❌ Pipeline Error:", error.message);
    }
}

run();
