import { ToolSelector } from "@/components/layout/ToolSelector";
import { getAllTools } from "@/lib/tool-registry";

export const dynamic = 'force-dynamic';

export default async function Home() {
  const tools = await getAllTools();

  return (
    <div className="flex flex-col gap-8 py-10">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-200 via-indigo-200 to-purple-200 pb-2">
          What will you build today?
        </h1>
        <p className="text-lg text-white/60 max-w-2xl mx-auto">
          Kit is your personal AI superapp. Select a tool below to get started.
        </p>
      </div>

      <ToolSelector tools={tools} />
    </div>
  );
}
