import Link from "next/link";

export default function HomePage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-24">
      <h1 className="text-4xl font-bold text-zinc-900 mb-6">macos-use</h1>
      <p className="text-lg text-zinc-600 mb-8">
        A Swift MCP server that lets AI agents control any macOS application
        through native accessibility APIs.
      </p>
      <ul className="space-y-3 text-teal-700">
        <li>
          <Link
            href="/t/macos-use"
            className="underline hover:text-teal-800"
          >
            Guide: how macos-use reports what the AI can actually see
          </Link>
        </li>
        <li>
          <a
            href="https://github.com/mediar-ai/mcp-server-macos-use"
            className="underline hover:text-teal-800"
          >
            GitHub: mediar-ai/mcp-server-macos-use
          </a>
        </li>
      </ul>
    </main>
  );
}
