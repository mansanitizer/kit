const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

async function uploadUserFile() {
    const baseUrl = 'http://localhost:3000';
    const filePath = "/Users/blue1/kit/app/Resume Final.pdf";
    const sessionId = uuidv4(); // Must be valid UUID for DB

    if (!fs.existsSync(filePath)) {
        console.error("File not found:", filePath);
        process.exit(1);
    }

    console.log(`Uploading ${filePath}...`);
    console.log(`Session ID: ${sessionId}`);

    try {
        const fileContent = fs.readFileSync(filePath);
        const fileBlob = new Blob([fileContent], { type: 'application/pdf' });
        const formData = new FormData();
        formData.append('file', fileBlob, path.basename(filePath));
        // formData.append('sessionId', sessionId); // Upload as Global/Shared

        const res = await fetch(`${baseUrl}/api/upload`, {
            method: 'POST',
            body: formData
        });

        if (!res.ok) {
            throw new Error(`Upload failed: ${res.status} ${await res.text()}`);
        }

        const data = await res.json();
        console.log("Upload Success!", data);
        console.log(`\nTo use this file in a tool, use syntax: @@${data.filename}`);
        console.log(`(Make sure the tool is running with Session ID: ${sessionId})`);

    } catch (err) {
        console.error("Error:", err);
    }
}

uploadUserFile();
