import Link from "next/link";
import { BookCallButton } from "@/components/book-call-button";
import { CopyConfig } from "@/components/copy-config";
import { HeroInstall } from "@/components/hero-install";

const GITHUB_URL = "https://github.com/mediar-ai/mcp-server-macos-use";

export default function HomePage() {
  return (
    <main className="max-w-4xl mx-auto px-6 pt-16 pb-24">
      {/* Hero */}
      <section className="mb-16">
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-600">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
            Open source · MCP over stdio · Swift
          </div>
          <a
            href={GITHUB_URL}
            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition"
            aria-label="GitHub stars"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 .587l3.668 7.568L24 9.75l-6 5.852L19.336 24 12 19.897 4.664 24 6 15.602 0 9.75l8.332-1.595z"/>
            </svg>
            274 stars on GitHub
          </a>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-100 bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700">
            Shipping inside Fazm
          </span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-zinc-900 mb-5 leading-tight">
          Drive any Mac app from Claude Code.
          <span className="text-teal-600"> No AppleScript. No screenshots.</span>
        </h1>
        <p className="text-lg text-zinc-600 mb-5 max-w-2xl leading-relaxed">
          A Swift MCP server that hands your AI assistant the same accessibility tree Apple
          gives VoiceOver. Click any button by text. Type into any field. Drive Xcode, Slack,
          Mail, System Settings, anything with an AX tree.
        </p>
        <ul className="text-sm text-zinc-700 mb-6 space-y-1.5 max-w-2xl">
          <li className="flex items-start gap-2">
            <span className="text-teal-600 mt-0.5">→</span>
            <span><strong>Not an AppleScript wrapper.</strong> Native AX APIs + CGEvent, so it works on apps with no scripting dictionary (most modern Mac apps).</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-600 mt-0.5">→</span>
            <span><strong>Not a screenshot agent.</strong> Structured tree responses, diff-only after each action. No OCR tax, no vision-model bill.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-600 mt-0.5">→</span>
            <span><strong>100% local.</strong> One Swift binary over stdio. No SaaS, no network egress from the server.</span>
          </li>
        </ul>

        <div className="mb-6 max-w-2xl">
          <HeroInstall />
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <BookCallButton section="hero" label="Book a 20-min walkthrough" />
          <a
            href={GITHUB_URL}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 transition"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.21 11.38.6.11.82-.26.82-.58v-2.23c-3.34.73-4.04-1.41-4.04-1.41-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.21.08 1.85 1.24 1.85 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.14-.3-.54-1.52.1-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 016 0c2.29-1.55 3.3-1.23 3.3-1.23.64 1.66.24 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.61-2.81 5.62-5.49 5.92.43.37.82 1.1.82 2.22v3.29c0 .32.22.7.82.58A12 12 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            Source on GitHub
          </a>
        </div>

        <p className="text-sm text-zinc-500 mb-8">
          Works with: Claude Code · Claude Desktop · Cursor · VS Code · Windsurf · Cline · Zed
        </p>

        <div className="rounded-2xl overflow-hidden border border-zinc-200 bg-zinc-50">
          <video
            src="/macos-use-demo.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-auto"
          />
        </div>
        <p className="text-sm text-zinc-500 mt-3">
          Claude Code using macos-use to open an app, read the accessibility tree, click by text, and
          verify the result, end to end.
        </p>
      </section>

      {/* Install */}
      <section id="install" className="mb-16 scroll-mt-16">
        <h2 className="text-2xl font-bold text-zinc-900 mb-2">
          Install in two steps
        </h2>
        <p className="text-zinc-600 mb-6">
          Anything that speaks MCP works. Pick your client, paste the config, restart.
        </p>
        <CopyConfig />
        <p className="text-xs text-zinc-500 mt-4">
          macOS 13+ required. Swift builds on install. First run prompts for Accessibility permission
          on whichever app is running your MCP client.
        </p>
      </section>

      {/* Links */}
      <section>
        <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3">
          Keep reading
        </h3>
        <ul className="space-y-2 text-teal-700">
          <li>
            <Link href="/t/macos-use" className="underline hover:text-teal-800">
              Guide: how macos-use reports what the AI can actually see
            </Link>
          </li>
          <li>
            <Link href="/t/macos-automation" className="underline hover:text-teal-800">
              macOS automation for AI agents, end to end
            </Link>
          </li>
          <li>
            <Link href="/t/mcp-server-desktop-app" className="underline hover:text-teal-800">
              What an MCP server for a desktop app actually does
            </Link>
          </li>
          <li>
            <Link href="/t/macos-accessibility-tree-agents" className="underline hover:text-teal-800">
              Why the accessibility tree matters for AI agents
            </Link>
          </li>
          <li>
            <a href={GITHUB_URL} className="underline hover:text-teal-800">
              GitHub: mediar-ai/mcp-server-macos-use
            </a>
          </li>
        </ul>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "macos-use",
            description:
              "Open source MCP server in Swift that lets Claude Code, Cursor, VS Code, and Windsurf drive macOS apps through native accessibility APIs.",
            applicationCategory: "DeveloperApplication",
            operatingSystem: "macOS 13+",
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
            url: "https://macos-use.dev",
            sameAs: [GITHUB_URL],
          }),
        }}
      />

    </main>
  );
}
