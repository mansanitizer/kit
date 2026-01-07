import { getToolBySlug } from "@/lib/tool-registry"
import { ToolInterface } from "./ToolInterface"
import { notFound } from "next/navigation"

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    const tool = await getToolBySlug(slug)

    if (!tool) {
        notFound()
    }

    return (
        <div className="max-w-4xl mx-auto py-8">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold mb-2">{tool.name}</h1>
                <p className="text-white/60">{tool.description}</p>
            </div>

            <ToolInterface tool={tool} />
        </div>
    )
}
