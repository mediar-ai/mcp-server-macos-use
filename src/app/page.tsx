import Link from "next/link";
import {
  BentoGrid,
  ComparisonTable,
  FaqSection,
  faqPageSchema,
} from "@seo/components";
import { BookCallButton } from "@/components/book-call-button";
import { CopyConfig } from "@/components/copy-config";

const GITHUB_URL = "https://github.com/mediar-ai/mcp-server-macos-use";

const FAQS = [
  {
    q: "Which MCP clients does it work with?",
    a: "Anything that speaks MCP over stdio. Tested daily with Claude Code, Claude Desktop, Cursor, VS Code (Copilot Chat), Windsurf, Cline, and Zed. Same JSON config, different file path per client.",
  },
  {
    q: "How is this different from screenshot-based macOS agents?",
    a: "It reads Apple's native accessibility tree (AXUIElement), so the AI gets structured elements with roles, labels, and coordinates instead of pixels. No OCR, no vision-model tax, no guessing pixel positions. Click by text match (element: \"Submit\") or exact coordinates from the tree. Responses are diff-only, so after an action you get what changed in the UI, not the whole screen again.",
  },
  {
    q: "What macOS permissions does it need, and who grants them?",
    a: "Accessibility permission is granted to the host process (Claude Desktop, Terminal, iTerm, VS Code — whoever spawns the MCP server), not to macos-use itself. That's macOS's TCC model. Screen Recording is needed only if you want window screenshots. Both are revocable from System Settings > Privacy & Security.",
  },
  {
    q: "Will it click things I didn't approve?",
    a: "No. Every tool call is gated by your MCP client's approval UI (Claude Code shows a diff-style prompt before each call). During automation, an InputGuard overlay blocks stray keyboard and mouse input so you don't fight the agent. Escape cancels the current action immediately. A 30-second watchdog prevents permanent lockout.",
  },
  {
    q: "Is this safe to install? Where does the code run?",
    a: "Fully local. The MCP server is a Swift binary running on your Mac, communicating with your AI client over stdio. No network egress from the server itself. Source is open on GitHub under mediar-ai/mcp-server-macos-use. Pin a specific npm version if you want reproducible installs.",
  },
  {
    q: "What can't it do yet?",
    a: "Apps that expose no accessibility tree (some Electron and custom-rendered games) fall back to coordinate-only clicks. Drag gestures across windows are basic. There is no recording/replay API yet. If you hit something missing, open an issue or book a call — the roadmap follows actual users.",
  },
  {
    q: "How do I uninstall?",
    a: "Remove the entry from your MCP config file and (optionally) npm uninstall -g mcp-server-macos-use. Revoke Accessibility/Screen Recording in System Settings > Privacy & Security > Accessibility by removing the host app.",
  },
];

const BENTO_CARDS = [
  {
    title: "Accessibility tree, not pixels",
    description:
      "Every action returns structured elements with role, text, and coordinates — `[AXButton] \"Open\" x:680 y:520 w:80 h:30 visible`. No OCR, no vision model tax.",
    size: "2x1" as const,
    accent: true,
  },
  {
    title: "Click by text",
    description:
      "element: \"Submit\" finds and clicks. No pixel guessing.",
  },
  {
    title: "Diff responses",
    description:
      "After each action, only changed elements come back. Cheaper tokens, faster loops.",
  },
  {
    title: "Native event injection",
    description:
      "CGEvent clicks and keystrokes are OS-level. Works with apps that reject other simulated input.",
  },
  {
    title: "InputGuard + Escape",
    description:
      "User input blocked during automation so you can't fight the agent. Escape cancels, 30s watchdog prevents lockout.",
  },
  {
    title: "Cross-app handoff",
    description:
      "Click a link that opens Safari? The server detects the new frontmost app and traverses it automatically.",
  },
];

const COMPARISON_ROWS = [
  {
    feature: "How it sees the UI",
    competitor: "Screenshot + OCR / vision model",
    ours: "Accessibility tree with roles and coordinates",
  },
  {
    feature: "Token cost per action",
    competitor: "Full screen re-described every step",
    ours: "Diff-only: elements added / removed / changed",
  },
  {
    feature: "Click targeting",
    competitor: "Pixel guess from screenshot",
    ours: "Exact coords from tree, or element text match",
  },
  {
    feature: "Input injection",
    competitor: "AppleScript / simulated keystrokes",
    ours: "CGEvent, indistinguishable from real user input",
  },
  {
    feature: "Setup",
    competitor: "Electron/Docker/Python stack",
    ours: "One Swift binary + stdio MCP",
  },
  {
    feature: "Where it runs",
    competitor: "Often hosted SaaS",
    ours: "100% local on your Mac",
  },
];

export default function HomePage() {
  return (
    <main className="max-w-4xl mx-auto px-6 pt-16 pb-24">
      {/* Hero */}
      <section className="mb-14">
        <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-600 mb-6">
          <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
          Open source · MCP over stdio · Swift
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-zinc-900 mb-5 leading-tight">
          Let Claude Code drive your Mac,
          <span className="text-teal-600"> not just your browser.</span>
        </h1>
        <p className="text-lg text-zinc-600 mb-8 max-w-2xl leading-relaxed">
          <code className="text-zinc-900 bg-zinc-100 rounded px-1.5 py-0.5 text-base">macos-use</code>{" "}
          is a Swift MCP server that gives Claude Code, Cursor, VS Code, and Windsurf native control
          of any macOS app through Apple&apos;s accessibility APIs. Structured UI trees, not screenshots.
          Runs locally, plugs into the same MCP config you already have.
        </p>

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <a
            href={GITHUB_URL}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 transition"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.21 11.38.6.11.82-.26.82-.58v-2.23c-3.34.73-4.04-1.41-4.04-1.41-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.21.08 1.85 1.24 1.85 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.14-.3-.54-1.52.1-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 016 0c2.29-1.55 3.3-1.23 3.3-1.23.64 1.66.24 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.61-2.81 5.62-5.49 5.92.43.37.82 1.1.82 2.22v3.29c0 .32.22.7.82.58A12 12 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            View on GitHub
          </a>
          <BookCallButton section="hero" label="Book a walkthrough" />
        </div>

        <p className="text-sm text-zinc-500">
          Works with: Claude Code · Claude Desktop · Cursor · VS Code · Windsurf · Cline · Zed
        </p>
      </section>

      {/* Install (highest intent block) */}
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

      {/* Demo */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-zinc-900 mb-4">See it drive a real app</h2>
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

      {/* Features */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-zinc-900 mb-2">Why native accessibility beats screenshots</h2>
        <p className="text-zinc-600 mb-2">
          Screenshot agents burn tokens re-describing the screen every step and guess pixel positions.
          macos-use hands Claude a structured tree with semantic roles and coordinates, then returns
          only what changed after each action.
        </p>
        <BentoGrid cards={BENTO_CARDS} />
      </section>

      {/* Comparison */}
      <section className="mb-16">
        <ComparisonTable
          heading="macos-use vs. screenshot-based agents"
          productName="macos-use"
          competitorName="Screenshot agents"
          rows={COMPARISON_ROWS}
          caveat="Screenshots still matter for apps that expose no accessibility tree. macos-use captures windows on demand so you can combine both when you need to."
        />
      </section>

      {/* Proof */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-zinc-900 mb-4">Battle tested in production</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6">
            <div className="text-sm font-semibold text-teal-700 mb-1">Powers Fazm</div>
            <p className="text-zinc-600 leading-relaxed">
              The same server ships inside{" "}
              <a href="https://fazm.ai" className="underline hover:text-teal-700">Fazm</a> as the
              screen-control layer for a real, paying-customer product. If it works there, it works
              for your side project.
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-6">
            <div className="text-sm font-semibold text-teal-700 mb-1">Open source, MIT</div>
            <p className="text-zinc-600 leading-relaxed">
              Every line is on{" "}
              <a href={GITHUB_URL} className="underline hover:text-teal-700">GitHub</a>. Pin a
              version, fork it, audit the Swift. Local binary over stdio, no network calls from the
              server itself.
            </p>
          </div>
        </div>
      </section>

      {/* Tools list */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-zinc-900 mb-4">Six MCP tools</h2>
        <ul className="grid sm:grid-cols-2 gap-3">
          {[
            ["open_application_and_traverse", "Launch or focus any app by name, bundle ID, or path."],
            ["click_and_traverse", "Click by coordinates or text. Optionally type and press a key in one call."],
            ["type_and_traverse", "Type into the focused field, with optional modifier keystroke."],
            ["press_key_and_traverse", "Arrow keys, Cmd+Shift+4, anything. Full modifier support."],
            ["scroll_and_traverse", "Scroll lines in any direction at a given position."],
            ["refresh_traversal", "Re-read the tree without taking an action."],
          ].map(([name, desc]) => (
            <li key={name} className="rounded-xl border border-zinc-200 bg-white p-4">
              <code className="text-sm font-mono text-teal-700">{name}</code>
              <p className="text-sm text-zinc-600 mt-1 leading-relaxed">{desc}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* FAQ */}
      <FaqSection items={FAQS} heading="Questions developers ask before installing" />

      {/* Footer CTAs */}
      <section className="mt-20 mb-6 rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50 to-cyan-50 p-8">
        <h2 className="text-2xl font-bold text-zinc-900 mb-2">Ready to try it?</h2>
        <p className="text-zinc-700 mb-6 leading-relaxed">
          Install with one command. If you&apos;re building something bigger on top of it and want the
          Swift, accessibility, or MCP side tailored to your use case, book 20 minutes with the team.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <a
            href="#install"
            className="inline-flex items-center justify-center rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 transition"
          >
            Copy install config
          </a>
          <BookCallButton section="footer" label="Book a 20-min call" />
        </div>
      </section>

      <section className="mt-10">
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
        </ul>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPageSchema(FAQS)) }}
      />
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
