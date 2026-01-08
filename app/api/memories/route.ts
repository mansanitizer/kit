import { NextRequest, NextResponse } from "next/server"
import { RAGService } from "@/lib/rag"

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
        return NextResponse.json({ error: "Missing userId" }, { status: 400 })
    }

    const rag = new RAGService()
    const memories = await rag.getMemories(userId)
    return NextResponse.json(memories)
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { userId, content, category, importance } = body

        if (!userId || !content) {
            return NextResponse.json({ error: "Missing userId or content" }, { status: 400 })
        }

        const rag = new RAGService()
        await rag.storeMemory(userId, content, category || 'general', importance || 0.5)

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: "Failed to create memory" }, { status: 500 })
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const id = searchParams.get('id')
        const userId = searchParams.get('userId')

        if (!id || !userId) {
            return NextResponse.json({ error: "Missing id or userId" }, { status: 400 })
        }

        const rag = new RAGService()
        await rag.deleteMemory(id, userId)

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete memory" }, { status: 500 })
    }
}

export async function PUT(req: NextRequest) {
    try {
        const body = await req.json()
        const { id, userId, content, category, importance } = body

        if (!id || !userId || !content) {
            return NextResponse.json({ error: "Missing id, userId or content" }, { status: 400 })
        }

        const rag = new RAGService()
        await rag.updateMemory(id, userId, content, category || 'general', importance || 0.5)

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: "Failed to update memory" }, { status: 500 })
    }
}
