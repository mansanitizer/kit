const https = require('https');

const apiKey = "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";

console.log("Testing OpenRouter Fetch...");

const data = JSON.stringify({
    model: "google/gemini-2.0-flash-lite-001",
    messages: [{ role: "user", content: "Hi" }]
});

const options = {
    hostname: 'openrouter.ai',
    path: '/api/v1/chat/completions',
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = https.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);

    let body = '';
    res.on('data', (chunk) => {
        body += chunk;
    });

    res.on('end', () => {
        console.log('BODY:', body);
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();
