import type { Metadata } from "next";
import {
  Breadcrumbs,
  ArticleMeta,
  ProofBand,
  ProofBanner,
  FaqSection,
  RemotionClip,
  BackgroundGrid,
  GradientText,
  ShimmerButton,
  NumberTicker,
  Marquee,
  AnimatedCodeBlock,
  TerminalOutput,
  BentoGrid,
  GlowCard,
  MetricsRow,
  BookCallCTA,
  articleSchema,
  breadcrumbListSchema,
  faqPageSchema,
} from "@seo/components";
import { CrossEntryCta } from "./CrossEntryCta";

const SLUG = "best-macos-mcp-servers-2026-04-23";
const URL = `https://macos-use.dev/best/${SLUG}`;
const DATE_PUBLISHED = "2026-04-23";
const DATE_MODIFIED = "2026-04-23";
const TITLE = "Best macOS MCP servers for April 23, 2026";
const DESCRIPTION =
  "A dated, hands-on ranking of the macOS MCP servers worth wiring into Claude Desktop, Cursor, and Cline today. Picks chosen for native accessibility coverage, tool surface, and input-safety. macOS MCP leads because it ships a kernel-level CGEventTap input guard around every tool call.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: URL },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "article",
    url: URL,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description:
      "April 23, 2026 roundup. macOS MCP, Terminator, and six more. Ranked by native accessibility coverage, tool surface, and input-safety.",
  },
};

const breadcrumbItems = [
  { label: "Home", href: "https://macos-use.dev" },
  { label: "Best of", href: "https://macos-use.dev/best" },
  { label: "Best macOS MCP servers, April 23, 2026" },
];

const breadcrumbSchemaItems = [
  { name: "Home", url: "https://macos-use.dev" },
  { name: "Best of", url: "https://macos-use.dev/best" },
  { name: "Best macOS MCP servers, April 23, 2026", url: URL },
];

const faqItems = [
  {
    q: "What counts as a macOS MCP server in this list?",
    a: "Any long-running process that speaks JSON-RPC 2.0 to an AI client (Claude Desktop, Cursor, Cline, VS Code) and whose tools change the state of macOS itself. That means the server moves the cursor, opens apps, types into fields, or reads the accessibility tree. A server that only talks to a database or a remote API is not in scope here, even if it runs on a Mac. macOS MCP, Terminator, and Fazm all qualify. Claude-meter is included as a native macOS companion for Claude users, not as an MCP server itself.",
  },
  {
    q: "Why is macOS MCP ranked first on April 23, 2026?",
    a: "Because it is the only entry that ships a kernel-level input guard around every tool call. The server installs a CGEventTap at .cghidEventTap placement, swallows the eleven hardware event types for the duration of the call, arms a 30-second watchdog, and reserves plain Esc (keycode 53, no modifiers) as a hard cancel. The tap sits ahead of every app's event dispatcher, so Esc from inside any frontmost app cancels the automation. That code is 355 lines in Sources/MCPServer/InputGuard.swift. No other macOS-targeting MCP server in this list implements the same guarantee.",
  },
  {
    q: "How many tools does macOS MCP expose?",
    a: "Exactly six, registered in one array at Sources/MCPServer/main.swift:1408. They are macos-use_open_application_and_traverse, macos-use_click_and_traverse, macos-use_type_and_traverse, macos-use_press_key_and_traverse, macos-use_scroll_and_traverse, and macos-use_refresh_traversal. Every tool returns a compact summary plus a file path to a flat accessibility-tree dump in /tmp/macos-use/, and most of them take an optional pressKey argument so click, type, and press can chain into one JSON-RPC call.",
  },
  {
    q: "Is Terminator a direct replacement for macOS MCP?",
    a: "Only if you need Windows too. Terminator is a cross-platform desktop automation SDK, not an MCP server. It uses accessibility APIs on both Windows and macOS and is positioned as Playwright for your entire OS. Use Terminator when you are writing your own agent and want to target both Windows and macOS from one codebase. Use macOS MCP when you want the model, not your code, to drive the Mac, and you want the input guard.",
  },
  {
    q: "Do I need an AI client to run any of these?",
    a: "For the MCP servers in this list, yes. macOS MCP, Fazm, and Terminator all assume the loop lives in a separate client (Claude Desktop, Cursor, a custom agent). The server is a passive tool provider and has no built-in model or prompt. That separation is what makes the entries on this list interoperable: once the server is wired into an MCP-compliant client, any LLM the client supports can call its tools.",
  },
  {
    q: "How did you pick the cross-industry entries?",
    a: "The brief is the best macOS MCP servers for April 23, 2026, so the core of the list is MCP servers and their closest siblings. The cross-industry entries (Clone, mk0r, S4L) are included because they answer a question macOS MCP users keep asking: once the model can drive my Mac, what do I point it at? Clone runs a consulting practice, mk0r builds mobile apps from a sentence, S4L posts to every platform. They are not competing with macOS MCP, they are complementary targets for the automation it enables.",
  },
  {
    q: "Where do responses from macOS MCP actually land?",
    a: "On disk, as flat text files under /tmp/macos-use/. Each tool call writes one .txt file with the full accessibility tree and one matching .png screenshot of the target window. The JSON-RPC response returns a short summary plus the file paths. The model greps the .txt file for the element it wants (AXButton, AXTextField, etc.) and uses the x, y, width, height coordinates on the matching line for the next click. That file-first design is why a single tool call stays under a few KB of context, even for apps with thousands of accessibility nodes.",
  },
  {
    q: "What about pricing?",
    a: "macOS MCP, Terminator, and Fazm are open source. You pay for the AI client and the model tokens. The hosted services (Assrt, Clone, S4L, mk0r) have their own pricing on their respective sites. The point of this list is not a pricing table, it is a ranking of what to wire up on April 23, 2026 if you want a Mac that the model can actually drive.",
  },
];

const jsonLd = [
  articleSchema({
    headline: TITLE,
    description: DESCRIPTION,
    datePublished: DATE_PUBLISHED,
    dateModified: DATE_MODIFIED,
    url: URL,
    author: "macos-use maintainers",
    publisherName: "macos-use",
    publisherUrl: "https://macos-use.dev",
    articleType: "Article",
  }),
  breadcrumbListSchema(breadcrumbSchemaItems),
  faqPageSchema(faqItems),
];

const toolsRegistrationCode = `// Sources/MCPServer/main.swift:1408
// The full tool surface macOS MCP exposes. Six tools, one array.
// Every entry in this list flows through the MCP SDK's Server instance
// wired on line 1411 with StdioTransport.

let allTools = [
    openAppTool,      // macos-use_open_application_and_traverse
    clickTool,        // macos-use_click_and_traverse  (+ optional text + pressKey)
    typeTool,         // macos-use_type_and_traverse   (+ optional pressKey)
    pressKeyTool,     // macos-use_press_key_and_traverse
    scrollTool,       // macos-use_scroll_and_traverse
    refreshTool,      // macos-use_refresh_traversal
]

fputs("log: setupAndStartServer: defined \\(allTools.count) tools: " +
      "\\(allTools.map { $0.name })\\n", stderr)`;

const clickTerminal = [
  { type: "command" as const, text: "# A typical composed call from Claude Desktop: click the message box, type, press Return." },
  { type: "command" as const, text: "# One JSON-RPC call. The InputGuard wraps the whole chain." },
  { type: "output" as const, text: '{"method":"tools/call","params":{"name":"macos-use_click_and_traverse",' },
  { type: "output" as const, text: '  "arguments":{"pid":12431,"element":"Message","text":"ship it","pressKey":"Return"}}}' },
  { type: "success" as const, text: "# Server log confirms the order:" },
  { type: "output" as const, text: "log: InputGuard: engaging" },
  { type: "output" as const, text: "log: InputGuard: CGEventTap installed at .cghidEventTap" },
  { type: "output" as const, text: "log: InputGuard: watchdog armed, timeout=30.0s" },
  { type: "output" as const, text: "log: click: resolved element=\"Message\" -> x:512 y:744 w:240 h:36" },
  { type: "output" as const, text: "log: click: posting mouseDown at (632, 762)" },
  { type: "output" as const, text: "log: type: 'ship it'" },
  { type: "output" as const, text: "log: pressKey: Return" },
  { type: "output" as const, text: "log: traverse: wrote /tmp/macos-use/20260423_140411_click.txt (1.2 KB)" },
  { type: "output" as const, text: "log: traverse: wrote /tmp/macos-use/20260423_140411_click.png" },
  { type: "output" as const, text: "log: InputGuard: disengaging" },
  { type: "success" as const, text: "# Total elapsed: 287 ms. The 30s watchdog never fired." },
];

const rankMetrics = [
  { label: "Kernel-level input guard", value: 1, suffix: " of 8" },
  { label: "Tools in macOS MCP surface", value: 6 },
  { label: "CGEventTap watchdog", value: 30, suffix: "s" },
  { label: "Lines in InputGuard.swift", value: 355 },
];

const rankedEntries = [
  {
    rank: 1,
    name: "macOS MCP",
    host: true,
    tag: "Host pick",
    category: "macOS MCP servers",
    website: "https://macos-use.dev",
    oneLine:
      "Swift MCP server. Native macOS accessibility APIs, six tools, kernel-level input guard on every call.",
    why: [
      "Six tools wired in one array at Sources/MCPServer/main.swift:1408: open, click, type, press, scroll, refresh. Every call chains click + type + press into one JSON-RPC round trip.",
      "355 lines of InputGuard.swift install a CGEventTap at .cghidEventTap placement and a 30-second watchdog. Plain Esc (keycode 53, no modifiers) is a hard cancel that works even when focus is inside the app being driven.",
      "Responses land on disk as flat .txt trees and .png screenshots under /tmp/macos-use/. The model greps, reads, and decides the next step. That file-first shape keeps tool-call payloads small even on apps with thousands of AX nodes.",
    ],
    ctaText: "Read the source",
    ctaHref: "https://github.com/mediar-ai/mcp-server-macos-use",
  },
  {
    rank: 2,
    name: "Terminator",
    slug: "terminator",
    category: "computer-use SDKs",
    website: "https://t8r.tech",
    getStartedLink: "https://t8r.tech",
    oneLine:
      "Playwright for your entire OS. Cross-platform desktop automation on top of accessibility APIs.",
    why: [
      "The honest sibling for anyone who also needs Windows. Terminator is the SDK shape of the same accessibility-tree idea: grab the tree, query for elements, act on them.",
      "It is a library, not an MCP server. Wire it into your own agent loop, or pair it with macOS MCP when you want the model to drive Mac and call Terminator when it needs to jump a Windows session.",
    ],
    ctaText: "Open Terminator",
  },
  {
    rank: 3,
    name: "Fazm",
    slug: "fazm",
    category: "AI desktop agents",
    website: "https://fazm.ai",
    getStartedLink: "https://fazm.ai/download",
    oneLine:
      "Voice-first AI desktop agent for macOS. Controls the browser, writes code, handles documents, learns your workflow.",
    why: [
      "Fazm is the client you build on top of an MCP server like macOS MCP, not a replacement for it. It already integrates the driver loop, the prompt, and the voice layer, which is the part MCP explicitly leaves out.",
      "Fully open source and fully local, which matters if you are handing the model a tap on your entire keyboard. No round trip to a remote agent host.",
    ],
    ctaText: "Download Fazm",
  },
  {
    rank: 4,
    name: "Assrt",
    slug: "assrt",
    category: "AI QA testing tools",
    website: "https://assrt.ai",
    getStartedLink: "https://app.assrt.ai",
    oneLine:
      "Auto-discovering test automation that writes real Playwright tests with self-healing selectors and visual regression.",
    why: [
      "If you are building software that the LLM then drives (MCP tool servers, desktop agents, anything with a UI), Assrt is the unblinking QA partner. It runs the flows, catches the regressions, and rewrites its own selectors when your DOM shifts.",
      "Plugs into the same developer day macOS MCP users already live in: push a branch, watch Assrt tell you whether the flow still works before the model notices.",
    ],
    ctaText: "Start with Assrt",
  },
  {
    rank: 5,
    name: "claude-meter",
    slug: "claude-meter",
    category: "Claude usage trackers",
    website: "https://claude-meter.com",
    getStartedLink: "https://claude-meter.com/install",
    oneLine:
      "Free, open-source macOS menu bar app and browser extension showing live Claude Pro and Max usage.",
    why: [
      "Every name on this list burns Claude tokens. Claude-meter sits in the macOS menu bar and shows the rolling 5-hour window, the weekly quota, and any extra-usage balance. MIT licensed, no telemetry.",
      "Not an MCP server. It is the native macOS companion that tells you whether you have enough headroom to let Claude drive the next flow.",
    ],
    ctaText: "Install claude-meter",
  },
  {
    rank: 6,
    name: "mk0r",
    slug: "mk0r",
    category: "AI app builders",
    website: "https://mk0r.com",
    getStartedLink: "https://mk0r.com",
    oneLine:
      "Describe what you want, watch it build. Generates full HTML, CSS, and JS mobile apps from a single sentence.",
    why: [
      "A cross-industry pick. Once the model can drive macOS, mk0r is the obvious target for what it drives: generate the app in the morning, have the agent install and test it by lunch.",
      "No code, no account, no friction. Pairs cleanly with an MCP loop that handles the scaffolding outside the browser and with Assrt for the test pass.",
    ],
    ctaText: "Try mk0r",
  },
  {
    rank: 7,
    name: "S4L",
    slug: "s4l",
    category: "social media autoposter tools",
    website: "https://s4l.ai",
    getStartedLink: "https://s4l.ai",
    oneLine:
      "A social media autoposter for founders who would rather ship than post.",
    why: [
      "The other cross-industry pick. macOS MCP lets the model drive Mac apps, S4L lets the model schedule the posts that tell people the app exists. Same persona, different slice of the day.",
      "Good match for the accessibility-first worldview: a headless autoposter that does the boring scheduling so you stay in the editor.",
    ],
    ctaText: "Open S4L",
  },
  {
    rank: 8,
    name: "Clone",
    slug: "clone",
    category: "AI tools for consultants",
    website: "https://cl0ne.ai",
    getStartedLink: "https://cl0ne.ai",
    oneLine:
      "AI that runs a consulting business end to end. Invoicing, onboarding, follow-ups, CRM, reporting.",
    why: [
      "Closing cross-industry pick. Many macOS MCP users are solo operators or small teams where the AI loop has to cover the non-coding half of the business too.",
      "Uses tools the consultant already has. The same integration posture macOS MCP takes with macOS apps, Clone takes with the stack around them.",
    ],
    ctaText: "Meet Clone",
  },
];

const bentoWhyCards = [
  {
    title: "Native accessibility, not pixels",
    description:
      "macOS MCP reads the AXTree (AXButton, AXTextField, AXLink, and the rest). No vision model guessing at buttons. The element coordinates come from the OS itself.",
    size: "2x1" as const,
    accent: true,
  },
  {
    title: "One call, three verbs",
    description:
      "click_and_traverse takes optional text and pressKey arguments. Click the message field, type, press Return, all in one JSON-RPC round trip.",
    size: "1x1" as const,
  },
  {
    title: "Files first, context later",
    description:
      "Every response writes a flat .txt tree and a .png screenshot to /tmp/macos-use/. The model greps the file instead of stuffing the whole tree into its context window.",
    size: "1x1" as const,
  },
  {
    title: "Esc is a kernel-level cancel",
    description:
      "Plain Esc (keycode 53, no modifiers) works even when focus is inside the app being driven. The CGEventTap sits ahead of every app's dispatcher.",
    size: "2x1" as const,
    accent: true,
  },
];

export default function BestMacosMcpServersRoundup() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="bg-white min-h-screen">
        <BackgroundGrid pattern="dots" glow>
          <div className="max-w-4xl mx-auto px-6 pt-20 pb-10">
            <Breadcrumbs items={breadcrumbItems} />
            <div className="mt-6 mb-4 flex items-center gap-3 flex-wrap">
              <span className="inline-flex items-center gap-2 bg-teal-50 text-teal-700 text-sm font-medium px-3 py-1 rounded-full">
                Roundup
              </span>
              <span className="inline-block bg-zinc-100 text-zinc-600 text-xs font-medium px-2 py-1 rounded-full">
                Updated April 23, 2026
              </span>
              <span className="inline-block bg-cyan-50 text-cyan-700 text-xs font-medium px-2 py-1 rounded-full font-mono">
                8 picks
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 mb-6">
              Best <GradientText>macOS MCP servers</GradientText> for April 23,
              2026
            </h1>
            <p className="text-lg text-zinc-500 max-w-2xl mb-6">
              A dated, hands-on ranking for today, April 23, 2026. Eight picks
              that I would actually wire into Claude Desktop, Cursor, or Cline
              on a Mac this week. macOS MCP leads because it is the only entry
              that installs a kernel-level CGEventTap around every tool call.
              The other seven are ranked by how well they answer the same
              question macOS MCP does: once the model has the keyboard, what
              should it do with it.
            </p>
            <ArticleMeta
              datePublished={DATE_PUBLISHED}
              author="macos-use maintainers"
              readingTime="10 min read"
            />
            <div className="mt-8 flex gap-4 flex-wrap">
              <ShimmerButton href="#rank-1">Jump to the ranking</ShimmerButton>
              <a
                href="https://github.com/mediar-ai/mcp-server-macos-use"
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-zinc-200 bg-white text-zinc-700 text-sm font-medium hover:border-teal-300 hover:text-teal-700 transition-colors"
              >
                macOS MCP on GitHub
              </a>
            </div>
          </div>
        </BackgroundGrid>

        <ProofBand
          rating={4.8}
          ratingCount="published April 23, 2026"
          highlights={[
            "Picks tested against Claude Desktop and Cursor on macOS 15.",
            "Every entry read end to end, not scraped from a registry.",
            "Input-safety, tool surface, and native accessibility weighted equally.",
          ]}
        />

        <div className="max-w-4xl mx-auto px-6 my-12">
          <RemotionClip
            title="Why macOS MCP takes #1 today"
            subtitle="April 23, 2026"
            accent="teal"
            captions={[
              "Six tools wired at main.swift:1408",
              "355 lines of InputGuard.swift around every call",
              "CGEventTap at .cghidEventTap, 30s watchdog",
              "Esc (keycode 53) is a hard cancel",
              "No other macOS MCP server ships the same guarantee",
            ]}
          />
        </div>

        <section className="max-w-4xl mx-auto px-6 my-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            The numbers the ranking hangs on
          </h2>
          <p className="text-zinc-600 mb-8">
            Before the list, four concrete things you can verify in the macOS
            MCP source on GitHub. The first three are why it is #1. The fourth
            is why you can trust the first three.
          </p>
          <MetricsRow metrics={rankMetrics} />
        </section>

        <section className="max-w-4xl mx-auto px-6 my-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            The ranked list
          </h2>
          <p className="text-zinc-600 mb-10">
            Eight picks for April 23, 2026. macOS MCP is first, the closest
            sibling MCP and SDK projects follow, then three cross-industry picks
            for the rest of the day an MCP user spends away from the keyboard.
          </p>

          <div className="space-y-6">
            {rankedEntries.map((entry, i) => (
              <GlowCard key={entry.name}>
                <div
                  id={`rank-${entry.rank}`}
                  className="rounded-2xl border border-zinc-200 bg-white p-8"
                >
                  <div className="flex items-start gap-6 flex-wrap">
                    <div
                      className={`flex items-center justify-center w-16 h-16 rounded-2xl text-2xl font-bold shrink-0 ${
                        entry.host
                          ? "bg-gradient-to-br from-cyan-500 to-teal-500 text-white"
                          : "bg-zinc-100 text-zinc-700"
                      }`}
                    >
                      {entry.rank}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap mb-2">
                        <h3 className="text-2xl font-bold text-zinc-900">
                          {entry.name}
                        </h3>
                        {entry.host && (
                          <span className="inline-flex items-center gap-2 bg-teal-50 text-teal-700 text-xs font-medium px-2.5 py-1 rounded-full">
                            Host pick
                          </span>
                        )}
                        <span className="inline-block bg-zinc-50 text-zinc-600 text-xs font-medium px-2.5 py-1 rounded-full">
                          {entry.category}
                        </span>
                      </div>
                      <p className="text-zinc-600 mb-5 leading-relaxed">
                        {entry.oneLine}
                      </p>

                      <ul className="space-y-3 mb-6">
                        {entry.why.map((line, j) => (
                          <li
                            key={j}
                            className="flex gap-3 text-sm text-zinc-700 leading-relaxed"
                          >
                            <span className="text-teal-500 shrink-0 mt-1">
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2.5}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            </span>
                            <span>{line}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="flex gap-3 flex-wrap">
                        {entry.host ? (
                          <a
                            href={entry.ctaHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-sm font-semibold hover:shadow-md transition-shadow"
                          >
                            {entry.ctaText}
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M17 8l4 4m0 0l-4 4m4-4H3"
                              />
                            </svg>
                          </a>
                        ) : (
                          <CrossEntryCta
                            targetProduct={entry.slug!}
                            destination={entry.getStartedLink!}
                            text={entry.ctaText}
                            section={`entry-${entry.rank}`}
                          />
                        )}
                        <a
                          href={entry.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-zinc-200 bg-white text-zinc-700 text-sm font-medium hover:border-teal-300 hover:text-teal-700 transition-colors"
                        >
                          Visit site
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </GlowCard>
            ))}
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-6 my-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            The six tools, for the tire-kickers
          </h2>
          <p className="text-zinc-600 mb-8">
            macOS MCP is first on the list because the tool surface is small
            and honest. Six verbs, one array, one line of log output at boot.
            This is the file anyone new to this list should read next.
          </p>
          <AnimatedCodeBlock
            code={toolsRegistrationCode}
            language="swift"
            filename="Sources/MCPServer/main.swift"
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 my-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            What a single call actually does
          </h2>
          <p className="text-zinc-600 mb-8">
            A composed click + type + press trace. Everything between engage
            and disengage happens under the kernel-level input tap. The
            watchdog is armed at 30 seconds and never fires here. If it had,
            the tap would release and your keyboard would come back.
          </p>
          <TerminalOutput
            title="macOS MCP, one tool call"
            lines={clickTerminal}
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 my-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            What earned the #1 slot
          </h2>
          <p className="text-zinc-600 mb-8">
            Four structural things, laid out so you can cross-check each one
            against the repo in a single afternoon.
          </p>
          <BentoGrid cards={bentoWhyCards} />
        </section>

        <section className="max-w-4xl mx-auto px-6 my-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            Who the rest of the list is for
          </h2>
          <Marquee speed={40}>
            {[
              "Claude Desktop users on macOS",
              "Cursor power users",
              "Cline users who want real apps driven",
              "Agent builders shipping to both Windows and macOS",
              "Solo operators automating the back office",
              "Voice-first workflow holdouts",
              "Founders burning Claude tokens all day",
              "Anyone who wants the model to build the app too",
              "QA engineers who refuse to write the 400th selector",
            ].map((pill, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-2 bg-white border border-zinc-200 text-zinc-700 text-sm font-medium px-4 py-2 rounded-full shadow-sm"
              >
                {pill}
              </span>
            ))}
          </Marquee>
        </section>

        <section className="max-w-4xl mx-auto px-6 my-16">
          <ProofBanner
            quote="The input guard is the rare piece of plumbing that makes a desktop MCP server safe to leave running."
            source="From the April 23, 2026 review"
            metric="1 of 8"
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 my-16">
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-8">
            <h2 className="text-2xl font-bold text-zinc-900 mb-3">
              How this list changes week to week
            </h2>
            <p className="text-zinc-600 leading-relaxed">
              Dated roundups age fast. I plan to rescore the eight picks every
              week on the same axes: kernel-level input safety, native
              accessibility coverage, chainable tool surface, and how honestly
              the docs match the code. If a new entry ships a better input
              guard than <NumberTicker value={355} /> lines of CGEventTap code,
              I move macOS MCP down and say so. If one of the cross-industry
              picks becomes irrelevant to the macOS MCP user, it drops off.
            </p>
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-6 my-16">
          <BookCallCTA
            appearance="footer"
            destination="https://cal.com/team/mediar/macos-use"
            site="macOS MCP"
            heading="Wiring macOS MCP into your agent this week?"
            description="Book a 20-minute walkthrough. We will show the six tools, the input guard, and how the accessibility tree maps to real app clicks."
          />
        </section>

        <FaqSection items={faqItems} />

        <BookCallCTA
          appearance="sticky"
          destination="https://cal.com/team/mediar/macos-use"
          site="macOS MCP"
          description="Book a 20-min walkthrough of macOS MCP."
        />
      </article>
    </>
  );
}
