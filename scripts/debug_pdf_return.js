const path = require('path');
const fs = require('fs');
const { createRequire } = require('module');

const requireCjs = createRequire(__filename);
const pdfPath = path.join(process.cwd(), "node_modules/pdf-parse/dist/pdf-parse/cjs/index.cjs");
const pdfModule = requireCjs(pdfPath);

async function debugPdf() {
    console.log("Module Keys:", Object.keys(pdfModule));

    // Create a minimal PDF buffer
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
    const buffer = Buffer.from(pdfContent);
    const uint8Array = new Uint8Array(buffer);

    try {
        console.log("Attempting to instantiate PDFParse with Uint8Array...");
        const instance = new pdfModule.PDFParse(uint8Array);
        console.log("Instance created.");

        console.log("Calling getText()...");
        const textResult = await instance.getText();
        console.log("getText Result Type:", typeof textResult);
        if (typeof textResult === 'object') {
            console.log("getText Result Keys:", Object.keys(textResult));
            // Check standard props
            if (textResult.text) console.log("Found .text in result");
        }

        const content = typeof textResult === 'string' ? textResult : (textResult.text || JSON.stringify(textResult));
        console.log("Content Preview:", content.substring(0, 50));

    } catch (e) {
        console.error("Error calling PDFParse:", e);
    }
}

debugPdf();
