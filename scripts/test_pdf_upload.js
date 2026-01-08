const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

async function testPdfUpload() {
    const baseUrl = 'http://localhost:3000';
    const filename = `test_simple_${Date.now()}.pdf`;
    const sessionId = uuidv4();

    // Minimal valid PDF 1.0 (Hello World)
    const pdfContent = `%PDF-1.0
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 3 3]/Parent 2 0 R/Resources<<>>>>endobj
xref
0 4
0000000000 65535 f
0000000010 00000 n
0000000060 00000 n
0000000111 00000 n
trailer<</Size 4/Root 1 0 R>>
startxref
190
%%EOF`;

    console.log(`Uploading minimal PDF (${filename})...`);

    try {
        const fileBlob = new Blob([pdfContent], { type: 'application/pdf' });
        const formData = new FormData();
        formData.append('file', fileBlob, filename);
        formData.append('sessionId', sessionId);

        const res = await fetch(`${baseUrl}/api/upload`, {
            method: 'POST',
            body: formData
        });

        if (!res.ok) {
            throw new Error(`Upload failed: ${res.status} ${await res.text()}`);
        }

        const data = await res.json();
        console.log("PDF Upload Success!", data);

    } catch (err) {
        console.error("Test Failed:", err);
    }
}

testPdfUpload();
