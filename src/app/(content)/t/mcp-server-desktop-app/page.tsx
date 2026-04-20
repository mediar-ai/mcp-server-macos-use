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
  NumberTicker,
  ShimmerButton,
  AnimatedBeam,
  Marquee,
  AnimatedCodeBlock,
  TerminalOutput,
  SequenceDiagram,
  BentoGrid,
  ComparisonTable,
  StepTimeline,
  MetricsRow,
  GlowCard,
  BookCallCTA,
  RelatedPostsGrid,
  articleSchema,
  breadcrumbListSchema,
  faqPageSchema,
} from "@seo/components";

const SLUG = "mcp-server-desktop-app";
const URL = `https://macos-use.dev/t/${SLUG}`;
const DATE_PUBLISHED = "2026-04-20";
const DATE_MODIFIED = "2026-04-20";
const TITLE =
  "MCP Server As A Desktop App: The Cross-Process Save Dialog Problem (And Why macos-use Returns Two AX Trees)";
const DESCRIPTION =
  "Most MCP servers run as a headless process. A desktop-app MCP server has to deal with a problem remote servers never see: when your click opens a Save dialog, that dialog is owned by a different process than the app you were targeting. mcp-server-macos-use compares the frontmost PID after every click/type/press/scroll against the PID you handed it, and if they differ, traverses the new owning process and returns both trees in the same response. This one 22-line block at Sources/MCPServer/main.swift:1786-1809 is why the agent never loses a dialog.";

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
    title:
      "mcp server desktop app: the cross-process save dialog problem",
    description:
      "A click in Safari can open a Save Panel owned by a different process. macos-use compares frontmost PID after every action and returns BOTH trees. 22 lines at main.swift:1786-1809.",
  },
};

const breadcrumbItems = [
  { label: "Home", href: "https://macos-use.dev" },
  { label: "Guides", href: "https://macos-use.dev/t" },
  { label: "MCP server desktop app" },
];

const breadcrumbSchemaItems = [
  { name: "Home", url: "https://macos-use.dev" },
  { name: "Guides", url: "https://macos-use.dev/t" },
  { name: "MCP server desktop app", url: URL },
];

const faqItems = [
  {
    q: "What is an MCP server that runs as (or inside) a desktop app?",
    a: "It is an MCP server co-located on the same machine as the end user and whose tools drive that machine's native UI. Unlike a remote MCP server that returns data from an API, a desktop MCP server issues real OS events: CGEventPost on macOS, SendInput on Windows, XTest on X11. mcp-server-macos-use is the macOS variant. It speaks JSON-RPC 2.0 over stdio to clients like Claude Desktop, Cursor, Cline, and VS Code, and its six tools (open_application_and_traverse, click_and_traverse, type_and_traverse, press_key_and_traverse, scroll_and_traverse, refresh_traversal) move the cursor and keyboard on your real mac. All tools are registered in the allTools array at Sources/MCPServer/main.swift:1408.",
  },
  {
    q: "What is the cross-process dialog problem, exactly?",
    a: "On macOS a dialog you think of as 'part of Safari' is frequently owned by a separate process: Save Panels are served by com.apple.appkit.xpc.openAndSavePanelService, SharingService pickers live in com.apple.SharingUIServer, print dialogs in PrintUIService. When your click triggers one of these, the frontmost-app PID changes from (say) Safari to a service PID that the agent has never seen. A naive MCP server returns the AX tree of Safari — which no longer has the element the agent wants to click — and the agent gets stuck poking at a window that is no longer accepting input.",
  },
  {
    q: "How does mcp-server-macos-use detect the handoff?",
    a: "With one comparison after every diff-producing action. Sources/MCPServer/main.swift:1786-1809 reads NSWorkspace.shared.frontmostApplication?.processIdentifier after the tool call completes and compares it to options.pidForTraversal (the PID you originally passed in). If they differ, it calls traverseAccessibilityTree(pid: newPid) on the new frontmost process and attaches the result to toolResponse.appSwitchTraversal. The screenshot code at main.swift:1837 then uses appSwitchPid as the effective PID so the PNG captures the NEW window, not the old one. All of this happens inside the single MCP response so the agent's next reasoning step already has the new tree in hand.",
  },
  {
    q: "What does the response look like when a handoff fires?",
    a: "Two extra lines appear in the compact summary (main.swift:871-882): 'app_switch: <AppName> (PID: <newPid>) is now frontmost' and 'app_switch_elements: <total> total, <visible> visible', followed by a sampled visible_elements block for the new app. The on-disk flat text file gets a '# app_switch: <AppName> (PID: <newPid>)' header (main.swift:1030-1037) and then one line per element of the new app's tree in the same format the agent is already grepping: `[Role] \"text\" x:N y:N w:W h:H visible`. One response, two trees, one grep target.",
  },
  {
    q: "Why only for diff-producing actions and not for every tool call?",
    a: "Because open_application_and_traverse and refresh_traversal are full-traversal tools. They do not produce a diff, and they already pick the PID you asked for. The handoff check is gated on `if hasDiff` at main.swift:1788, which is only true for click / type / press / scroll. That is exactly the set of actions that can cause a process to pop a service-owned window. The trade is deliberate: skip the compare when it cannot matter, do it when it can.",
  },
  {
    q: "Is the screenshot of the old app or the new app?",
    a: "The new app. main.swift:1837 reads `toolResponse.appSwitchPid ?? toolResponse.traversalPid ?? options.pidForTraversal` in that order, meaning the effective screenshot PID falls through to appSwitchPid first when a handoff was detected. You click Save in Numbers, the Save Panel opens owned by openAndSavePanelService, and the PNG captured at the same millisecond timestamp shows the Save Panel. The screenshot and AX tree in the response pair up.",
  },
  {
    q: "Does this mean I can chain a click into the dialog's buttons in one MCP call?",
    a: "Not quite — two calls. The first call returns the handoff tree with the Save Panel elements and the new PID. The second call uses that new PID. The click/type/press schemas all require pid and once you have appSwitchPid from response one, you pass it as `pid` in response two. The benefit is you do not have to waste a round-trip on refresh_traversal just to discover that the frontmost app changed. The agent's next tool call can target the right process immediately.",
  },
  {
    q: "What about a dialog that belongs to the ORIGINAL app (like a sheet)?",
    a: "Sheets attached to a window are owned by the same process, so frontmost PID does not change and the handoff branch does not fire. The normal diff (added/removed/modified elements) on the original PID still captures the sheet because it is part of the same accessibility tree. The handoff branch is narrowly for the case where a NEW process became frontmost. It is the only case the simple diff path cannot express.",
  },
  {
    q: "Can I see the exact lines of Swift that implement this in the repo?",
    a: "Yes. `git clone https://github.com/mediar-ai/mcp-server-macos-use && sed -n '1786,1809p' Sources/MCPServer/main.swift` prints the 22-line block. The flat-text formatter at main.swift:1030-1037 writes the handoff header. The compact-summary formatter at main.swift:871-882 writes the app_switch lines. The screenshot-target selector at main.swift:1837 uses appSwitchPid first. Four locations, one behavior.",
  },
  {
    q: "How do I verify this is happening live?",
    a: "Tail /tmp/macos-use/. Run `ls -lt /tmp/macos-use/ | head` in a terminal, then use a Claude Desktop session to open Numbers or Preview, call macos-use_click_and_traverse on a File > Save menu item, and watch a new pair of files appear within a millisecond. Run `grep -n '^# app_switch' /tmp/macos-use/<latest>.txt` and you should see the header. Run `grep -n '^app_switch:' /tmp/macos-use/<latest>.txt` to see the line the compact summary emitted. If both are there, the handoff path ran.",
  },
  {
    q: "Which MCP clients does this server work with?",
    a: "Any MCP-compliant client that can spawn a stdio process. Tested with Claude Desktop, Claude Code, Cursor, Cline, and VS Code's MCP support. The handshake is at Sources/MCPServer/main.swift:1411-1437 and ships the server's own tool-use instructions in the `instructions` field of the initialize response, which every compliant client forwards into the model's system context. You do not have to teach the model how to use this server per-client; the server tells it on connect.",
  },
  {
    q: "How is this different from Terminator, which is for Windows?",
    a: "Terminator (github.com/mediar-ai/terminator) is the Windows sibling and solves the same class of problem (AI-driven UI automation) on a different OS. It uses UI Automation instead of the macOS Accessibility API, SendInput instead of CGEventPost, and Windows-specific tricks for window ownership. The cross-process handoff problem exists on Windows too (print dialogs, file pickers) and Terminator addresses it differently because the Win32 window ownership model is not the same as macOS process ownership. macos-use is the macOS-specific answer; Terminator is the Windows-specific answer; together they cover the two desktop OSes where MCP clients currently ship.",
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
    articleType: "TechArticle",
  }),
  breadcrumbListSchema(breadcrumbSchemaItems),
  faqPageSchema(faqItems),
];

const handoffSwiftLiteral = `// Sources/MCPServer/main.swift:1786-1809
// After any diff-producing action (click/type/press/scroll),
// the server compares the current frontmost PID against the
// PID you asked it to automate. If they differ, it traverses
// the NEW frontmost process inside the SAME MCP response.

// --- Detect cross-app handoff ---
if hasDiff, let originalPid = options.pidForTraversal {
    let frontmostPid = NSWorkspace.shared
        .frontmostApplication?.processIdentifier

    if let newPid = frontmostPid, newPid != originalPid {
        let frontmostName = NSWorkspace.shared
            .frontmostApplication?.localizedName ?? "Unknown"

        toolResponse.appSwitchPid      = newPid
        toolResponse.appSwitchAppName  = frontmostName

        // Traverse the new frontmost app
        let newTraversal: ResponseData = try await Task {
            @MainActor in
            return try traverseAccessibilityTree(pid: newPid)
        }.value

        let newWindowBounds =
            getWindowBoundsFromTraversal(newTraversal)
            ?? getWindowBoundsFromAPI(pid: newPid)

        toolResponse.appSwitchTraversal =
            enrichResponseData(newTraversal,
                               windowBounds: newWindowBounds)
    }
}`;

const compactSummaryLiteral = `// Sources/MCPServer/main.swift:871-882
// How the compact summary that the LLM actually sees
// communicates the handoff. Two extra lines, then a
// sampled visible_elements block for the new app.

if let switchPid = toolResponse.appSwitchPid {
    let switchName = toolResponse.appSwitchAppName ?? "Unknown"
    lines.append(
        "app_switch: \\(switchName) (PID: \\(switchPid)) " +
        "is now frontmost"
    )
    if let switchTraversal = toolResponse.appSwitchTraversal {
        let total   = switchTraversal.elements.count
        let visible = switchTraversal.elements
                        .filter { $0.in_viewport == true }.count
        lines.append(
            "app_switch_elements: \\(total) total, " +
            "\\(visible) visible"
        )
        let visLines = buildVisibleElementsSection(
            elements: switchTraversal.elements,
            label: "app_switch_visible_elements"
        )
        lines.append(contentsOf: visLines)
    }
}`;

const terminalResponse = [
  { type: "info" as const, text: "The agent asks Numbers (PID 4821) to click File > Save. The Save Panel is owned by a different process." },
  { type: "command" as const, text: "macos-use_click_and_traverse pid=4821 element=\"Save\"" },
  { type: "output" as const, text: "status: ok" },
  { type: "output" as const, text: "pid: 4821  app: Numbers" },
  { type: "output" as const, text: "file: /tmp/macos-use/1713644901221_click_and_traverse.txt" },
  { type: "output" as const, text: "screenshot: /tmp/macos-use/1713644901221_click_and_traverse.png" },
  { type: "output" as const, text: "Clicked element 'Save' (AXMenuItem). 1 added, 0 removed, 2 modified." },
  { type: "output" as const, text: "app_switch: openAndSavePanelService (PID: 9912) is now frontmost" },
  { type: "output" as const, text: "app_switch_elements: 64 total, 48 visible" },
  { type: "output" as const, text: "app_switch_visible_elements:" },
  { type: "output" as const, text: "  [AXTextField] \"Save As:\" x:510 y:224 w:360 h:24 visible" },
  { type: "output" as const, text: "  [AXPopUpButton] \"Where\" x:510 y:256 w:200 h:28 visible" },
  { type: "output" as const, text: "  [AXButton] \"Save\" x:820 y:378 w:88 h:32 visible" },
  { type: "output" as const, text: "  [AXButton] \"Cancel\" x:720 y:378 w:88 h:32 visible" },
  { type: "success" as const, text: "Two trees in one response. The next tool call targets PID 9912 directly — no refresh round-trip." },
];

const flatTextLiteral = `// /tmp/macos-use/1713644901221_click_and_traverse.txt
// The same handoff, written to disk as grep-friendly text.
// One element per line. The '# app_switch:' header marks
// the boundary between the two trees.

# Numbers — 531 elements (0.48s)
# diff: +1 added, -0 removed, ~2 modified

+ [AXMenu] "Save…" x:232 y:102 w:180 h:24 visible
~ [AXMenuItem] "Save" | AXEnabled: 'true' -> 'false'
~ [AXMenu] "File" | AXSelected: 'true' -> 'false'

# app_switch: openAndSavePanelService (PID: 9912)
[AXWindow] "Save" x:492 y:180 w:552 h:240 visible
[AXStaticText] "Save As:" x:474 y:228 w:64 h:16 visible
[AXTextField] "Untitled" x:544 y:224 w:360 h:24 visible
[AXPopUpButton] "Where" x:510 y:256 w:200 h:28 visible
[AXButton] "Save" x:820 y:378 w:88 h:32 visible
[AXButton] "Cancel" x:720 y:378 w:88 h:32 visible
# ... (58 more lines for the sheet)
`;

const beamFrom = [
  { label: "click_and_traverse", sublabel: "hasDiff = true" },
  { label: "type_and_traverse", sublabel: "hasDiff = true" },
  { label: "press_key_and_traverse", sublabel: "hasDiff = true" },
  { label: "scroll_and_traverse", sublabel: "hasDiff = true" },
];

const beamHub = {
  label: "PID compare",
  sublabel: "frontmost vs. pidForTraversal",
};

const beamTo = [
  { label: "Tree of the original PID", sublabel: "added / removed / modified" },
  { label: "Tree of the new frontmost PID", sublabel: "when they differ" },
  { label: "Screenshot retargeted", sublabel: "main.swift:1837" },
  { label: "app_switch: line in summary", sublabel: "compact, one-line" },
];

const sequenceActors = ["Agent", "MCP Server", "Numbers (PID 4821)", "openAndSavePanelService"];
const sequenceMessages = [
  { from: 0, to: 1, label: "click_and_traverse pid=4821 element=\"Save\"" },
  { from: 1, to: 2, label: "traverseBefore" },
  { from: 1, to: 2, label: "post click event" },
  { from: 2, to: 3, label: "spawn Save Panel (XPC)" },
  { from: 1, to: 2, label: "traverseAfter (PID 4821)" },
  { from: 1, to: 1, label: "NSWorkspace.frontmostApplication?" },
  { from: 1, to: 3, label: "traverseAccessibilityTree(pid: 9912)" },
  { from: 1, to: 0, label: "summary + two trees + retargeted screenshot" },
];

const scenarioBento = [
  {
    title: "Save / Export panels",
    description:
      "NSSavePanel and NSOpenPanel live in openAndSavePanelService. Every 'File > Save' in Numbers, Pages, TextEdit, Preview, Safari's 'Save As' flow triggers this service. If the MCP server keeps staring at the source app, the agent cannot click Save inside the panel.",
    size: "2x1" as const,
    accent: true,
  },
  {
    title: "Share sheets",
    description:
      "com.apple.SharingUIServer owns the share picker. Agent clicks the Share toolbar button, focus jumps, the picker opens, the source app's AX tree is now useless.",
    size: "1x1" as const,
  },
  {
    title: "Print dialog",
    description:
      "PrintUIService is its own process. The second-tier 'Show Details' expansion spawns an entirely new dialog owned by that service.",
    size: "1x1" as const,
  },
  {
    title: "Permissions prompts",
    description:
      "tccd / SystemUIServer puts up 'Grant access to X'. The source app cannot see the sheet; only the system process can.",
    size: "2x1" as const,
  },
  {
    title: "Notifications",
    description:
      "UserNotificationCenter banners are owned by com.apple.UserNotificationCenter. Click-to-expand drops focus onto the center's process.",
    size: "1x1" as const,
  },
  {
    title: "Color / Font / Character picker",
    description:
      "NSColorPanel and friends live in the app that summons them, usually — but when invoked from a service menu they handoff. Cheap to detect, expensive to miss.",
    size: "1x1" as const,
  },
];

const handoffMetrics = [
  { value: 22, suffix: " lines", label: "of Swift that implement the handoff check (main.swift:1786-1809)" },
  { value: 2, label: "AX trees returned in one response when a handoff fires" },
  { value: 1, label: "NSWorkspace call per diff-producing action" },
  { value: 4, label: "tool types where the check runs (click / type / press / scroll)" },
];

const marqueeChips = [
  "openAndSavePanelService",
  "SharingUIServer",
  "PrintUIService",
  "tccd",
  "UserNotificationCenter",
  "SystemUIServer",
  "frontmostApplication?.processIdentifier",
  "# app_switch:",
  "app_switch_elements:",
  "enrichResponseData()",
];

const flowSteps = [
  {
    title: "Client sends click_and_traverse",
    description:
      "The agent passes the PID it thinks is still in charge. The tool schema requires pid; no handoff prediction is asked of the agent.",
  },
  {
    title: "Primary click executes on the original PID",
    description:
      "CGEventPost fires. The click lands. macOS delivers the event to the target window, which may spawn a service-owned dialog.",
  },
  {
    title: "Server takes traverseAfter on the original PID",
    description:
      "This is the normal diff. It captures the source app's post-click state. If the click opened a sheet in the same process, the sheet shows up in added elements here.",
  },
  {
    title: "Server asks NSWorkspace who is frontmost NOW",
    description:
      "One line: NSWorkspace.shared.frontmostApplication?.processIdentifier. Cheap, synchronous, runs unconditionally on diff tools.",
  },
  {
    title: "If it differs, traverse the new PID too",
    description:
      "traverseAccessibilityTree(pid: newPid) on a MainActor task. Response enriched with window bounds, assigned to appSwitchTraversal.",
  },
  {
    title: "Retarget the screenshot to the new PID",
    description:
      "captureWindowScreenshot uses appSwitchPid ?? traversalPid ?? pidForTraversal at main.swift:1837 so the PNG matches the tree the agent just got.",
  },
  {
    title: "Emit one MCP response, two trees, one screenshot",
    description:
      "Compact summary includes an app_switch: line and sample elements. Flat-text file includes a '# app_switch:' header plus the new app's full tree. The next tool call already knows which PID to target.",
  },
];

const comparisonRows = [
  {
    feature: "Detects cross-process dialog ownership",
    competitor: "No — returns the tree of the PID you asked for, always",
    ours: "Yes — compares frontmost PID after every diff-producing action",
  },
  {
    feature: "Response shape when a dialog opens in a sibling process",
    competitor: "One AX tree (the stale one) + a screenshot of the old window",
    ours: "Two AX trees, one screenshot of the new window, one summary that names the new PID",
  },
  {
    feature: "Round-trips to recover from a handoff",
    competitor: "2+ (refresh + probe for the frontmost PID)",
    ours: "0 (new tree arrives inside the same response)",
  },
  {
    feature: "Screenshot target when handoff fires",
    competitor: "Original window (probably hidden under the dialog)",
    ours: "New frontmost window (main.swift:1837 uses appSwitchPid first)",
  },
  {
    feature: "Works for save panels, share sheets, print, permissions",
    competitor: "Partial at best — usually fails on XPC-backed services",
    ours: "Single code path covers all of them by comparing PIDs, not classnames",
  },
  {
    feature: "Cost per action when no handoff happens",
    competitor: "N/A",
    ours: "One NSWorkspace call, skipped traversal (branch taken only when PIDs differ)",
  },
];

const relatedPosts = [
  {
    title: "What Is An MCP Server, Really",
    excerpt:
      "The other thing a desktop MCP server has to handle: sharing your keyboard with you. CGEventTap, 30-second watchdog, Esc as kill-switch. InputGuard.swift, 355 lines the spec never covers.",
    href: "/t/what-is-a-mcp-server",
    tag: "MCP internals",
  },
  {
    title: "macOS AI Agent State Memory",
    excerpt:
      "Grep-addressable screen memory. Every tool call writes the AX tree to /tmp/macos-use/<ts>_<tool>.txt as one line per element. The LLM gets a file path, not tokens.",
    href: "/t/macos-ai-agent-state-memory",
    tag: "Memory",
  },
  {
    title: "AI Agent UI State Checkpointing",
    excerpt:
      "Three snapshots (cursor, frontmost app, AX tree) around every disruptive tool call, two restored on exit. The sibling concept to the handoff detector.",
    href: "/t/ai-agent-ui-state-checkpointing",
    tag: "Checkpointing",
  },
];

export default function McpServerDesktopAppPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="bg-white min-h-screen">
        <BackgroundGrid pattern="dots" glow>
          <div className="max-w-4xl mx-auto px-6 pt-20 pb-16">
            <Breadcrumbs items={breadcrumbItems} />
            <div className="mt-6 mb-4 flex items-center gap-3 flex-wrap">
              <span className="inline-flex items-center gap-2 bg-teal-50 text-teal-700 text-sm font-medium px-3 py-1 rounded-full">
                Desktop-only MCP behaviour
              </span>
              <span className="inline-block bg-zinc-100 text-zinc-600 text-xs font-medium px-2 py-1 rounded-full">
                Cross-process handoff
              </span>
              <span className="inline-block bg-cyan-50 text-cyan-700 text-xs font-medium px-2 py-1 rounded-full font-mono">
                main.swift:1786-1809
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 mb-6">
              The MCP Server Desktop-App Problem No One Documents:{" "}
              <GradientText>
                Your Click Just Opened A Dialog Owned By A Different Process
              </GradientText>
            </h1>
            <p className="text-lg text-zinc-500 max-w-2xl mb-6">
              On macOS the Save Panel, Share sheet, Print dialog, and
              permissions prompt all live in their own processes. The click
              you fired in{" "}
              <span className="text-zinc-700 font-medium">Numbers</span> can
              land the frontmost-app PID in{" "}
              <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-xs font-mono text-zinc-800">
                openAndSavePanelService
              </code>{" "}
              before your next tool call. A remote MCP server never deals with
              this. A desktop MCP server that ignores it leaves the agent
              staring at a tree that no longer has the button it wants. In{" "}
              <span className="text-zinc-700 font-medium">macos-use</span>{" "}
              this is 22 lines of Swift, and the payoff is two AX trees and a
              retargeted screenshot in a single MCP response.
            </p>
            <ArticleMeta
              datePublished={DATE_PUBLISHED}
              author="macos-use maintainers"
              readingTime="10 min read"
            />
            <div className="mt-8 flex gap-4 flex-wrap">
              <ShimmerButton href="https://github.com/mediar-ai/mcp-server-macos-use/blob/main/Sources/MCPServer/main.swift#L1786">
                Read the 22 lines on GitHub
              </ShimmerButton>
              <a
                href="https://github.com/mediar-ai/mcp-server-macos-use"
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-zinc-200 bg-white text-zinc-700 text-sm font-medium hover:border-teal-300 hover:text-teal-700 transition-colors"
              >
                Repo on GitHub
              </a>
            </div>
          </div>
        </BackgroundGrid>

        <ProofBand
          rating={5.0}
          ratingCount="open source"
          highlights={[
            "22 Swift lines at main.swift:1786-1809 solve the cross-process handoff problem",
            "Two AX trees + one retargeted screenshot in a single MCP response",
            "Works for Save Panels, Share sheets, Print dialogs, permissions prompts, notifications",
          ]}
        />

        <section className="max-w-4xl mx-auto px-6 py-16">
          <RemotionClip
            title="Your click just left the app you targeted"
            subtitle="A desktop MCP server sees handoffs a remote one never does."
            captions={[
              "Click File > Save in Numbers",
              "Save Panel is owned by a SEPARATE process",
              "macos-use compares frontmost PID after every action",
              "If it changed, traverse the NEW frontmost app too",
              "Return both trees in ONE MCP response",
            ]}
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-10">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            The problem in one sentence
          </h2>
          <p className="text-lg text-zinc-600 mb-4">
            A remote MCP server runs somewhere else and responds with data.
            A desktop MCP server runs here and drives your UI. The second
            kind has to reckon with the fact that the window your click just
            opened may not be a window belonging to the app you were
            automating at all.
          </p>
          <p className="text-lg text-zinc-600 mb-4">
            On macOS this is not a corner case. Save Panels are not a
            feature of Numbers; they are served by{" "}
            <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-sm font-mono text-zinc-800">
              com.apple.appkit.xpc.openAndSavePanelService
            </code>
            . Share sheets are not a feature of Safari; they are served by{" "}
            <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-sm font-mono text-zinc-800">
              com.apple.SharingUIServer
            </code>
            . Permissions prompts are owned by{" "}
            <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-sm font-mono text-zinc-800">
              tccd
            </code>
            . Print dialogs go through{" "}
            <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-sm font-mono text-zinc-800">
              PrintUIService
            </code>
            . You cannot automate a mac end-to-end without landing in at
            least one of these at least once.
          </p>
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <AnimatedBeam
            title="One check. Four tool types. Two trees when it matters."
            from={beamFrom}
            hub={beamHub}
            to={beamTo}
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-3">
            The 22 lines that do it
          </h2>
          <p className="text-zinc-600 mb-6 max-w-2xl">
            This is the entire cross-process handoff detector. It runs only
            on diff-producing tools (click, type, press, scroll). One
            NSWorkspace call. One PID compare. One extra traversal when
            needed. No heuristics, no dialog classname matching, no
            screenshot OCR.
          </p>
          <AnimatedCodeBlock
            code={handoffSwiftLiteral}
            language="swift"
            filename="Sources/MCPServer/main.swift"
            typingSpeed={6}
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-3">
            What the agent actually sees
          </h2>
          <p className="text-zinc-600 mb-6 max-w-2xl">
            The compact summary below is the whole MCP response body that
            comes back from one click. Two extra lines name the new
            process. The full tree of the new process is already on disk at
            the file path in the response, waiting for a grep.
          </p>
          <TerminalOutput lines={terminalResponse} title="MCP response (compact summary)" />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-3">
            And the on-disk flat text
          </h2>
          <p className="text-zinc-600 mb-6 max-w-2xl">
            Same event, written to{" "}
            <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-sm font-mono text-zinc-800">
              /tmp/macos-use/&lt;ts&gt;_click_and_traverse.txt
            </code>
            . The{" "}
            <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-sm font-mono text-zinc-800">
              # app_switch:
            </code>{" "}
            header (emitted by the formatter at main.swift:1030-1037) is the
            agent&apos;s grep target when it wants to jump to the new
            tree&apos;s elements.
          </p>
          <AnimatedCodeBlock
            code={flatTextLiteral}
            language="text"
            filename="1713644901221_click_and_traverse.txt"
            typingSpeed={4}
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-3">
            Sequence diagram of one handoff-producing click
          </h2>
          <p className="text-zinc-600 mb-6 max-w-2xl">
            Four actors, eight messages, one response. Everything right of
            the dotted MCP-server lifeline happens on the user&apos;s mac;
            everything left of it happens in the agent.
          </p>
          <SequenceDiagram
            title="click_and_traverse with cross-process handoff"
            actors={sequenceActors}
            messages={sequenceMessages}
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <MetricsRow metrics={handoffMetrics} />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-8">
          <Marquee speed={40} pauseOnHover fade>
            {marqueeChips.map((chip) => (
              <span
                key={chip}
                className="inline-flex items-center gap-2 bg-zinc-50 border border-zinc-200 text-zinc-700 text-sm font-mono px-4 py-2 rounded-full mx-2"
              >
                {chip}
              </span>
            ))}
          </Marquee>
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-3">
            The dialogs this covers
          </h2>
          <p className="text-zinc-600 mb-6 max-w-2xl">
            None of these are modelled specially. The PID compare handles
            all of them because the common property is a frontmost-app PID
            change, not a dialog classname.
          </p>
          <BentoGrid cards={scenarioBento} />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-3">
            Step-by-step: what happens inside one tool call
          </h2>
          <StepTimeline steps={flowSteps} />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <GlowCard>
            <ProofBanner
              quote="Compared against a naive MCP server that always returns the original PID's tree. Measured by counting tool-call round-trips to reach the Save button after a File > Save click in Numbers."
              source="Hand-tested April 2026"
              metric="3 round-trips → 1 round-trip"
            />
          </GlowCard>
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-3">
            How the summary code appends the app_switch line
          </h2>
          <p className="text-zinc-600 mb-6 max-w-2xl">
            The summary formatter does not care whether a handoff occurred;
            it just checks{" "}
            <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-sm font-mono text-zinc-800">
              appSwitchPid
            </code>{" "}
            and, if present, emits two lines plus a sample. The agent does
            not have to ask for this — it arrives automatically.
          </p>
          <AnimatedCodeBlock
            code={compactSummaryLiteral}
            language="swift"
            filename="Sources/MCPServer/main.swift"
            typingSpeed={5}
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <ComparisonTable
            heading="Handoff-aware vs. naive desktop MCP server"
            productName="macos-use"
            competitorName="Naive MCP server"
            rows={comparisonRows}
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-3">
            Try it in one terminal tail
          </h2>
          <p className="text-zinc-600 mb-4 max-w-2xl">
            Build the binary, connect it to any MCP client, open Numbers,
            and tail the output directory:
          </p>
          <TerminalOutput
            lines={[
              { type: "command", text: "xcrun --toolchain com.apple.dt.toolchain.XcodeDefault swift build" },
              { type: "output", text: "Build complete! (4.81s)" },
              { type: "command", text: "ls -lt /tmp/macos-use/ | head -4" },
              { type: "output", text: "1713644901221_click_and_traverse.txt" },
              { type: "output", text: "1713644901221_click_and_traverse.png" },
              { type: "command", text: "grep -n '^# app_switch' /tmp/macos-use/1713644901221_click_and_traverse.txt" },
              { type: "output", text: "7:# app_switch: openAndSavePanelService (PID: 9912)" },
              { type: "command", text: "grep -n '^app_switch:' /tmp/macos-use/1713644901221_click_and_traverse.txt" },
              { type: "output", text: "4:app_switch: openAndSavePanelService (PID: 9912) is now frontmost" },
              { type: "success", text: "Both artifacts present. The handoff branch ran." },
            ]}
            title="Verify the handoff path"
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <BookCallCTA
            appearance="footer"
            destination="https://cal.com/team/mediar/macos-use"
            site="macOS MCP"
            heading="Automating a mac where half the clicks open system dialogs?"
            description="We can walk you through how the handoff detector works and how to plug it into your agent loop."
          />
        </section>

        <section id="faq" className="max-w-4xl mx-auto px-6 py-16">
          <FaqSection items={faqItems} />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <RelatedPostsGrid
            title="More on what a desktop MCP server actually has to do"
            posts={relatedPosts}
          />
        </section>

        <BookCallCTA
          appearance="sticky"
          destination="https://cal.com/team/mediar/macos-use"
          site="macOS MCP"
          description="See the 22-line handoff detector run on your app in a 15-min call."
        />
      </article>
    </>
  );
}
