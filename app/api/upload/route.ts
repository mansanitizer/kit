import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { RAGService } from "@/lib/rag";
import { createRequire } from "module";
import path from "path";

const VISION_MODEL = "google/gemini-2.0-flash-lite-001";
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;
        const sessionId = formData.get("sessionId") as string;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const fileType = file.type;
        const filename = file.name;

        console.log(`[Upload] Processing ${filename} (${fileType})...`);

        let content = "";
        let finalFileType = "document";

        // 1. Extract/Generate Content
        if (fileType === "application/pdf") {
            try {
                // Lazy load pdf-parse to avoid top-level crashes in serverless
                const require = createRequire(import.meta.url);
                let pdfModule;
                try {
                    pdfModule = require("pdf-parse");
                } catch (e: any) {
                    console.error("Failed to require pdf-parse:", e);
                    throw new Error(`Server configuration error: pdf-parse module missing. ${e.message}`);
                }

                // Convert Buffer to Uint8Array first
                const uint8Array = new Uint8Array(buffer);

                // Instantiate PDFParse - v2.4.5 style
                if (!pdfModule.PDFParse) {
                    // Fallback check if it's the older v1 style just in case deployment differs
                    if (typeof pdfModule === 'function') {
                        const data = await pdfModule(buffer);
                        content = data.text;
                    } else {
                        throw new Error("pdf-parse module structure unrecognized");
                    }
                } else {
                    const instance = new pdfModule.PDFParse(uint8Array);
                    const data = await instance.getText();
                    content = data.text || "";
                }

                if (!content) {
                    console.warn("[Upload] PDF parsed but no text content found.");
                }

                console.log(`[Upload] Extracted ${content.length} chars from PDF.`);
            } catch (err: any) {
                console.error("PDF Parse Error:", err);
                return NextResponse.json({ error: `Failed to parse PDF: ${err.message}` }, { status: 500 });
            }
        } else if (fileType.startsWith("image/")) {
            finalFileType = "image";
            // Use Gemini 2.0 Flash Lite for Vision Description
            content = await generateImageDescription(buffer, fileType);
            console.log(`[Upload] Generated description for image: ${content.substring(0, 50)}...`);
        } else {
            // Assume text/markdown
            content = buffer.toString("utf-8");
        }

        if (!content) {
            return NextResponse.json({ error: "Failed to extract content" }, { status: 500 });
        }

        // 2. Store in Supabase
        const supabase = createServerClient();
        const { data: fileRecord, error: dbError } = await supabase
            .from("user_files")
            .insert({
                user_id: sessionId || null,
                filename: filename,
                file_type: finalFileType,
                content: content,
                char_count: content.length
            })
            .select()
            .single();

        if (dbError) {
            console.error("DB Insert Error:", dbError);
            return NextResponse.json({ error: "Failed to save file record" }, { status: 500 });
        }

        // 3. Generate Embeddings (Background/Sync for MVP)
        // For MVP we do it synchronously to ensure it's ready immediately
        const ragService = new RAGService();
        await storeFileEmbeddings(ragService, fileRecord.id, content, supabase);

        return NextResponse.json({
            success: true,
            id: fileRecord.id,
            filename: filename,
            type: finalFileType,
            preview: content.substring(0, 100)
        });

    } catch (error: any) {
        console.error("[Upload] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

async function generateImageDescription(buffer: Buffer, mimeType: string): Promise<string> {
    const apiKey = process.env.KIT_OPENROUTER_API_KEY;
    if (!apiKey) throw new Error("Missing OpenRouter API Key");

    const base64Image = buffer.toString("base64");
    const dataUrl = `data:${mimeType};base64,${base64Image}`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://kit.com",
            "X-Title": "Kit AI"
        },
        body: JSON.stringify({
            model: VISION_MODEL,
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: "Describe this image in detail. Focus on text, UI elements, objects, and layout. This description will be used for RAG retrieval, so be comprehensive." },
                        { type: "image_url", image_url: { url: dataUrl } }
                    ]
                }
            ]
        })
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Vision API Failed: ${errText}`);
    }

    const json = await response.json();
    return json.choices[0].message.content || "No description generated.";
}

async function storeFileEmbeddings(ragService: RAGService, fileId: string, content: string, supabase: any) {
    // Simple chunking
    const chunkSize = 1000;
    const overlap = 200;
    const chunks = [];

    for (let i = 0; i < content.length; i += (chunkSize - overlap)) {
        const chunk = content.substring(i, i + chunkSize);
        if (chunk.length < 50) continue; // Skip tiny chunks
        chunks.push(chunk);
    }

    if (chunks.length === 0) chunks.push(content); // At least one

    console.log(`[Upload] Generating embeddings for ${chunks.length} chunks...`);

    for (let i = 0; i < chunks.length; i++) {
        const embedding = await ragService.generateEmbedding(chunks[i]);
        if (embedding.length > 0) {
            await supabase.from("file_embeddings").insert({
                file_id: fileId,
                chunk_index: i,
                content_chunk: chunks[i],
                embedding: embedding
            });
        }
    }
}
