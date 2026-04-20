import type { Metadata } from "next";
import {
  Breadcrumbs,
  ArticleMeta,
  ProofBand,
  FaqSection,
  RemotionClip,
  BackgroundGrid,
  GradientText,
  NumberTicker,
  ShimmerButton,
  AnimatedBeam,
  AnimatedCodeBlock,
  TerminalOutput,
  SequenceDiagram,
  ComparisonTable,
  HorizontalStepper,
  GlowCard,
  ProofBanner,
  BookCallCTA,
  RelatedPostsGrid,
  articleSchema,
  breadcrumbListSchema,
  faqPageSchema,
} from "@seo/components";

const SLUG = "ai-agent-ui-state-checkpointing";
const URL = `https://macos-use.dev/t/${SLUG}`;
const DATE_PUBLISHED = "2026-04-19";
const DATE_MODIFIED = "2026-04-19";
const TITLE =
  "AI Agent UI State Checkpointing: The Three Snapshots macOS-Use Takes Around Every Click";
const DESCRIPTION =
  "Most articles on AI agent state checkpointing talk about LLM graph state in LangGraph or AG-UI sessions. mcp-server-macos-use checkpoints something different: the operating system. Before every click, type, press, or scroll, the server snapshots the human's cursor position, the frontmost app, and the AX tree, then restores the cursor and foreground app after the action completes and writes a UI diff to /tmp/macos-use/. Plus an Esc-cancellable input guard with a 30-second watchdog so a stuck tool call cannot lock the machine.";

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
      "AI agent UI state checkpointing on macOS: cursor + frontmost app + AX tree, restored after every action",
    description:
      "LangGraph checkpoints LLM state. mcp-server-macos-use checkpoints OS state. Three snapshots taken before every disruptive tool call, two restored on exit, one written to disk as a diff. Esc cancels mid-action.",
  },
};

const breadcrumbItems = [
  { label: "Home", href: "https://macos-use.dev" },
  { label: "Guides", href: "https://macos-use.dev/t" },
  { label: "AI agent UI state checkpointing" },
];

const breadcrumbSchemaItems = [
  { name: "Home", url: "https://macos-use.dev" },
  { name: "Guides", url: "https://macos-use.dev/t" },
  { name: "AI agent UI state checkpointing", url: URL },
];

const faqItems = [
  {
    q: "What is 'AI agent UI state checkpointing' as mcp-server-macos-use defines it?",
    a: "It is not graph-state checkpointing in the LangGraph sense. It is a per-tool-call transaction at the OS layer. Before every disruptive action (click, type, press, scroll, open) the server captures three snapshots: NSWorkspace.shared.frontmostApplication at main.swift:1671, NSEvent.mouseLocation flipped into top-left CGEvent coordinates at main.swift:1672-1676, and the full AX tree of the target app via showDiff = true at main.swift:1600/1617/1633/1651. The action runs. Two of those snapshots are then restored: the cursor via a CGEvent mouseMoved at main.swift:1767-1772, and the previous frontmost app via prevApp.activate at main.swift:1775-1781. The third (the AX tree) is differenced against a fresh post-action traversal and written to /tmp/macos-use/ as the artifact the agent reads.",
  },
  {
    q: "Why restore the cursor and the frontmost app at all? The agent does not care.",
    a: "The agent does not. The human does. macOS automation that fights the user for foreground focus or strands the cursor in the wrong app produces a workflow nobody can supervise. The contract this server encodes is: when the tool call returns, the human's interrupted state is back where they left it. That is what makes the loop usable as something the user runs in the foreground while still doing their own work, instead of a batch script they kick off and walk away from.",
  },
  {
    q: "What protects the human if a tool call hangs while the input guard is engaged?",
    a: "InputGuard.swift sets watchdogTimeout = 30 seconds at line 24. The engage() path schedules a one-shot timer at InputGuard.swift:174 that fires regardless of whether the action ever returns. When the timer fires it logs 'watchdog fired after 30s — auto-disengaging' and tears down the event tap. Without that, a crashed Swift process holding an active CGEventTap could lock keyboard and mouse for the user. The 30-second ceiling is the lockout safety net.",
  },
  {
    q: "How does Esc cancel an in-flight tool call?",
    a: "InputGuard installs a CGEventTap that intercepts every keyboard and mouse event during automation. When it sees an Escape keydown with no modifiers, it sets _cancelled = true at InputGuard.swift:292 and invokes onUserCancelled. The MCP handler checks InputGuard.shared.throwIfCancelled() between every primary and additional action (main.swift:1708, 1721, 1728, 1734) and again after a 200ms grace period at main.swift:1757-1763. If cancelled, it throws InputGuardCancelled, which the catch block at main.swift:1847 traps. Inside that catch block: disengage the guard, restore the cursor, reactivate the previous frontmost app, return an isError response. The cancellation path runs the same restore code as the success path.",
  },
  {
    q: "Why does NSEvent.mouseLocation get flipped before being saved?",
    a: "AppKit gives mouse coordinates with origin at the bottom-left of the primary screen. CGEvent posts mouse events with origin at the top-left. main.swift:1673-1675 flips by computing primaryScreen.frame.height - nsPos.y so the saved CGPoint can be passed directly back to CGEvent(mouseEventSource:mouseType:.mouseMoved, mouseCursorPosition:) on restore. Skip that flip and the cursor restores to the wrong y on multi-monitor setups, sometimes off-screen entirely.",
  },
  {
    q: "Where is the diff between checkpoints actually written?",
    a: "Every tool call writes two files to /tmp/macos-use/ named with millisecond-precision timestamps: <ts>_<tool>.txt and <ts>_<tool>.png. The .txt holds the flat-text diff produced at main.swift:1007-1028 with prefixes + (added), - (removed), and ~ (modified, with attribute transitions). The .png is captured at main.swift:1832-1840 with a red crosshair drawn at the click point if applicable. Both files share the same timestamp so an agent can correlate the visual receipt with the symbolic diff.",
  },
  {
    q: "What happens if the action accidentally hands focus to a different app, like clicking an email link that launches Mail?",
    a: "The handler detects this at main.swift:1788-1808. After the action it compares the current NSWorkspace.shared.frontmostApplication processIdentifier against the original PID the tool was called with. If they differ, it traverses the new frontmost app, populates appSwitchPid, appSwitchAppName, and appSwitchTraversal on the response, and appends an 'app_switch:' header to the .txt file. The agent gets one tool call, one .txt, but two traversals when focus escapes. This is also the only case where the frontmost-app restore is intentionally relaxed: if the previous frontmost was the launching app and the launched app is now what the user expects to see, restoring would be wrong. The restore at main.swift:1775-1781 only fires when isDisruptive and the previous app is still alive.",
  },
  {
    q: "Does this overlap with what LangGraph or AG-UI mean by checkpointing?",
    a: "No, it is orthogonal. LangGraph checkpointers persist agent graph state (the AgentState dict, message history, the next-node pointer) into a SQLite or Postgres backend so the workflow can resume after a process exit. AG-UI synchronizes UI state between a running agent and a web frontend. Neither addresses what mcp-server-macos-use addresses: the OS-level state of a real human's desktop while an agent is poking at it. You can run macos-use under a LangGraph agent and stack both layers — the LangGraph checkpointer covers conversation resume, the macOS checkpoint-restore covers per-action atomicity on the user's desktop.",
  },
  {
    q: "How does the diff payload actually fit into the 'checkpoint' framing?",
    a: "Think of each tool call as a database transaction. traverseBefore captures the read snapshot. The action is the write. traverseAfter captures the post-write read. The diff at main.swift:612-718 is the changed-rows result set. Filters at main.swift:591-607 strip non-actionable noise before persisting. The /tmp/macos-use/<ts>_<tool>.txt file is the commit log. If you ran the agent for a thousand actions, /tmp/macos-use/ would hold a thousand .txt + .png pairs, one per transaction, replayable from disk for post-mortem.",
  },
  {
    q: "Does the InputGuard overlay block the agent's own input events?",
    a: "No. The CGEventTap installed by InputGuard at the .cghidEventTap layer filters events by source. Agent input is generated via CGEvent.post(tap: .cghidEventTap) inside the same process; those events are emitted from the macos-use binary and are not blocked. Human input from the physical keyboard and mouse is blocked because it originates from outside the process. The Esc keydown is the one human keystroke the tap forwards: it captures, sets _cancelled, and lets the rest of the event drop. Other keystrokes are swallowed silently.",
  },
  {
    q: "Why is this checkpoint-and-restore design specifically a macOS thing? Could a Windows agent do the same?",
    a: "The pattern generalizes; the APIs do not. macOS uses NSWorkspace + NSEvent + CGEvent and exposes the foreground app via processIdentifier. The Windows equivalent (the Terminator project, also MCP-speaking) uses GetForegroundWindow + UI Automation and would need GetCursorPos / SetCursorPos instead of CGEvent mouseMoved, and would diff against UIA tree snapshots instead of AX tree snapshots. The contract — three snapshots, two restored, one diffed and persisted — ports cleanly. The implementation is per-OS.",
  },
  {
    q: "What is the smallest reproducible test of all three snapshots firing?",
    a: "Build the binary with xcrun --toolchain com.apple.dt.toolchain.XcodeDefault swift build, point an MCP client at it, and call click_and_traverse on any Mac app while you have a different app frontmost. Watch /tmp/macos-use/ for the new <ts>_click_and_traverse.txt + .png pair. Move your cursor to the corner of the screen before triggering the call; when the call returns, the cursor lands back at that corner and the originally-frontmost app is foreground again. The .txt holds the AX diff. That is all three checkpoints visible in one round trip.",
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

const checkpointBlockCode = `// Sources/MCPServer/main.swift:1669-1697
// Three things get snapshotted before any disruptive tool call.

if isDisruptive {
    // (1) WHICH APP HAD FOCUS — for restore at main.swift:1775
    savedFrontmostApp = NSWorkspace.shared.frontmostApplication

    // (2) WHERE THE CURSOR WAS — flipped from AppKit (bottom-left)
    //     into CGEvent coordinates (top-left) so SetCursor can replay it.
    let nsPos = NSEvent.mouseLocation
    if let primaryScreen = NSScreen.screens.first {
        savedCursorPos = CGPoint(
            x: nsPos.x,
            y: primaryScreen.frame.height - nsPos.y
        )
    }

    // (3) BLOCK HUMAN INPUT WHILE THE AGENT WORKS — Esc cancels.
    //     Watchdog auto-releases after 30s (InputGuard.swift:24)
    //     so a hung tool call can never lock the machine.
    InputGuard.shared.engage(message: "AI: \\(toolDesc) — press Esc to cancel")
}

// (4) THE AX TREE SNAPSHOT — implicit. Setting showDiff = true
//     forces a traverseBefore pass before the action executes.
//     See clickTool at main.swift:1600, typeTool at 1617,
//     pressKey at 1633, scroll at 1651.
options.showDiff = true`;

const restoreBlockCode = `// Sources/MCPServer/main.swift:1766-1781
// After the action returns (or after the user pressed Esc),
// two of the three snapshots get reapplied to the OS.

// (A) PUT THE CURSOR BACK where the human left it.
//     CGEvent posts the mouseMoved event with the saved
//     top-left-origin point.
if let pos = savedCursorPos,
   let moveEvent = CGEvent(
       mouseEventSource: nil,
       mouseType: .mouseMoved,
       mouseCursorPosition: pos,
       mouseButton: .left
   ) {
    moveEvent.post(tap: .cghidEventTap)
}

// (B) REACTIVATE THE PREVIOUSLY-FRONTMOST APP.
//     Skipped if the action triggered a legitimate app switch
//     (handled separately at main.swift:1788-1808).
if isDisruptive,
   let prevApp = savedFrontmostApp,
   prevApp.isTerminated == false {
    let currentFrontmost = NSWorkspace.shared.frontmostApplication
    if currentFrontmost?.processIdentifier != prevApp.processIdentifier {
        prevApp.activate(options: [])
    }
}

// (C) THE AX TREE SNAPSHOT was already differenced against a
//     post-action traversal and written to /tmp/macos-use/.
//     That is the artifact the agent will read next.`;

const watchdogCode = `// Sources/MCPServer/InputGuard.swift:18-24, 173-178
// The lockout safety net. If the Swift process crashes mid-action
// while the input tap is engaged, the watchdog releases it.

/// Maximum seconds the guard stays engaged before auto-releasing.
var watchdogTimeout: TimeInterval = 30

// In engage():
let timer = DispatchSource.makeTimerSource(queue: .main)
timer.schedule(deadline: .now() + watchdogTimeout)
timer.setEventHandler { [weak self] in
    fputs("warning: InputGuard: watchdog fired after \\(self?.watchdogTimeout ?? 0)s — auto-disengaging\\n", stderr)
    self?.disengage()
}
timer.resume()
self.watchdogTimer = timer`;

const onDiskExample = [
  { type: "command" as const, text: "ls /tmp/macos-use/ | tail -4" },
  { type: "output" as const, text: "1713456789012_open_application_and_traverse.png" },
  { type: "output" as const, text: "1713456789012_open_application_and_traverse.txt" },
  { type: "output" as const, text: "1713456790815_click_and_traverse.png" },
  { type: "output" as const, text: "1713456790815_click_and_traverse.txt" },
  { type: "command" as const, text: "head -1 1713456790815_click_and_traverse.txt" },
  { type: "output" as const, text: "# diff: +2 added, -1 removed, ~3 modified" },
  { type: "command" as const, text: "grep '^[+-~]' 1713456790815_click_and_traverse.txt" },
  { type: "output" as const, text: "+ [AXStaticText] \"Sending…\" x:820 y:614 w:70 h:20 visible" },
  { type: "output" as const, text: "+ [AXProgressIndicator] x:902 y:620 w:14 h:14 visible" },
  { type: "output" as const, text: "- [AXButton] \"Send\" x:820 y:612 w:60 h:28" },
  { type: "output" as const, text: "~ [AXTextField] | AXValue: 'Hey are you free Friday' -> ''" },
  { type: "output" as const, text: "~ [AXButton] \"Reactions\" | AXEnabled: 'true' -> 'false'" },
  { type: "output" as const, text: "~ [AXStaticText] \"2 unread\" | AXValue: '2 unread' -> '3 unread'" },
  { type: "success" as const, text: "One transaction. Three checkpoints. Cursor + foreground restored." },
];

const beamFrom = [
  { label: "NSWorkspace.frontmostApplication" },
  { label: "NSEvent.mouseLocation (flipped)" },
  { label: "AX tree (traverseBefore)" },
  { label: "InputGuard.engage()" },
];

const beamTo = [
  { label: "Cursor restore (CGEvent .mouseMoved)" },
  { label: "App reactivate (prevApp.activate)" },
  { label: "Diff written to <ts>_<tool>.txt" },
  { label: "Watchdog releases input tap" },
];

const sequenceActors = [
  "MCP Client",
  "Handler",
  "InputGuard",
  "AX Snapshot",
  "CGEvent",
  "/tmp/macos-use",
];

const sequenceMessages = [
  { from: 0, to: 1, label: "click_and_traverse {pid, element}", type: "request" as const },
  { from: 1, to: 1, label: "save frontmost + cursor (1671-1676)", type: "event" as const },
  { from: 1, to: 2, label: "engage (Esc=cancel, 30s watchdog)", type: "request" as const },
  { from: 1, to: 3, label: "traverseBefore (showDiff=true)", type: "request" as const },
  { from: 3, to: 1, label: "tree snapshot #1", type: "response" as const },
  { from: 1, to: 4, label: "post click event", type: "event" as const },
  { from: 4, to: 1, label: "event delivered", type: "response" as const },
  { from: 1, to: 3, label: "traverseAfter", type: "request" as const },
  { from: 3, to: 1, label: "tree snapshot #2", type: "response" as const },
  { from: 1, to: 1, label: "subtract → diff", type: "event" as const },
  { from: 1, to: 2, label: "disengage (or Esc → throw)", type: "request" as const },
  { from: 1, to: 4, label: "restore cursor mouseMoved", type: "event" as const },
  { from: 1, to: 1, label: "reactivate prev frontmost", type: "event" as const },
  { from: 1, to: 5, label: "write <ts>_<tool>.txt + .png", type: "event" as const },
  { from: 1, to: 0, label: "summary + filepath", type: "response" as const },
];

const checkpointStages = [
  {
    title: "Snapshot foreground app",
    description:
      "savedFrontmostApp captured at main.swift:1671. Used by the restore branch to put focus back where the human left it.",
  },
  {
    title: "Snapshot cursor (flipped)",
    description:
      "main.swift:1672-1676 saves the cursor in CGEvent coordinates (top-left origin), not AppKit coordinates (bottom-left). Skip the flip and restore lands off-screen on multi-monitor.",
  },
  {
    title: "Engage input guard",
    description:
      "CGEventTap blocks human input. Esc keydown sets _cancelled. 30s watchdog at InputGuard.swift:24 is the hard ceiling.",
  },
  {
    title: "Traverse before, act, traverse after",
    description:
      "showDiff = true at main.swift:1600 enables the implicit AX tree snapshot. Two traversals bracket the input event.",
  },
  {
    title: "Restore cursor + foreground",
    description:
      "CGEvent .mouseMoved at main.swift:1767-1772, then prevApp.activate at main.swift:1775-1781. The diff is already on disk.",
  },
];

const comparisonRows = [
  {
    feature: "What gets persisted",
    competitor: "AgentState dict, message history, next node pointer",
    ours: "OS-side: frontmost app PID, cursor CGPoint, AX tree diff",
  },
  {
    feature: "When it fires",
    competitor: "After each LangGraph node, on a configured channel",
    ours: "Around every disruptive MCP tool call (click, type, press, scroll)",
  },
  {
    feature: "Storage backend",
    competitor: "SQLite, Postgres, in-memory checkpointer",
    ours: "Flat .txt + .png pair in /tmp/macos-use/, ms-precision timestamps",
  },
  {
    feature: "Restore semantic",
    competitor: "Resume the agent's reasoning loop from a saved node",
    ours: "Put the human's desktop back: cursor moveTo, app reactivate",
  },
  {
    feature: "Cancellation",
    competitor: "Interrupt API, requires a checkpointed thread_id",
    ours: "Esc keydown, intercepted by CGEventTap, throws InputGuardCancelled",
  },
  {
    feature: "Lockout protection",
    competitor: "Not applicable",
    ours: "30s watchdog at InputGuard.swift:24 auto-releases the input tap",
  },
];

const stepperSteps = [
  {
    title: "Snapshot",
    description: "Frontmost app, cursor (flipped), AX tree before action.",
  },
  {
    title: "Guard",
    description: "Block human input, arm 30s watchdog, accept Esc to cancel.",
  },
  {
    title: "Act",
    description: "Post the CGEvent. Optionally chain type and press in one call.",
  },
  {
    title: "Diff",
    description: "Traverse again, subtract, drop scroll-bar and coord-only noise.",
  },
  {
    title: "Restore",
    description: "Move cursor back, reactivate prev frontmost, write .txt + .png.",
  },
];

const relatedPosts = [
  {
    title: "macOS Accessibility Tree For Agents",
    excerpt:
      "The AX tree is the input. The diff is the signal. How macos-use serves the tree on iteration without re-dumping it.",
    href: "/t/macos-accessibility-tree-agents",
    tag: "AX Trees",
  },
  {
    title: "What Is An MCP Server",
    excerpt:
      "MCP basics: what a server is, what tools are, why it matters for agent loops driving native apps.",
    href: "/t/what-is-a-mcp-server",
    tag: "MCP",
  },
  {
    title: "macos-use overview",
    excerpt:
      "The full set of MCP tools macos-use exposes for driving macOS apps from any MCP-speaking agent.",
    href: "/t/macos-use",
    tag: "Product",
  },
];

export default function AiAgentUiStateCheckpointingPage() {
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
                Per-action OS transactions
              </span>
              <span className="inline-block bg-zinc-100 text-zinc-600 text-xs font-medium px-2 py-1 rounded-full">
                Three snapshots, two restored
              </span>
              <span className="inline-block bg-cyan-50 text-cyan-700 text-xs font-medium px-2 py-1 rounded-full font-mono">
                Esc cancels, 30s watchdog
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 mb-6">
              AI Agent UI State Checkpointing:{" "}
              <GradientText>The Three Snapshots macOS-Use Takes</GradientText>{" "}
              Around Every Click
            </h1>
            <p className="text-lg text-zinc-500 max-w-2xl mb-6">
              Most articles on AI agent state checkpointing point at LangGraph,
              AG-UI, and conversation memory. mcp-server-macos-use checkpoints
              something the agent layer never touches: the operating system.
              Before every <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-xs font-mono text-zinc-800">click</code>,{" "}
              <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-xs font-mono text-zinc-800">type</code>,{" "}
              <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-xs font-mono text-zinc-800">press</code>{" "}
              or{" "}
              <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-xs font-mono text-zinc-800">scroll</code>{" "}
              tool call, the server takes three snapshots: the frontmost app,
              the cursor position, and the AX tree. Two of them are restored
              when the call returns. The third is differenced and written to
              disk as the artifact the agent reads next. There is also a
              30-second watchdog so a hung tool call cannot lock the machine.
            </p>
            <ArticleMeta
              datePublished={DATE_PUBLISHED}
              author="macos-use maintainers"
              readingTime="11 min read"
            />
            <div className="mt-8 flex gap-4 flex-wrap">
              <ShimmerButton href="https://github.com/mediar-ai/mcp-server-macos-use/blob/main/Sources/MCPServer/main.swift#L1669">
                Read the checkpoint block at main.swift:1669
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
            "Three snapshots per disruptive tool call: frontmost app, cursor, AX tree (main.swift:1669-1697)",
            "Two restored on exit: cursor at main.swift:1767-1772, frontmost app at main.swift:1775-1781",
            "30-second InputGuard watchdog at InputGuard.swift:24 prevents lockout if the tool call hangs",
          ]}
        />

        <section className="max-w-4xl mx-auto px-6 py-16">
          <RemotionClip
            title="Per-action checkpointing for agents driving macOS apps"
            subtitle="Three snapshots before. Two restored after. One diff persisted."
            captions={[
              "Save frontmost app and cursor",
              "Engage InputGuard, arm 30s watchdog",
              "Traverse, act, traverse again",
              "Restore cursor + foreground app",
              "Write <ts>_<tool>.txt + .png to disk",
            ]}
            accent="teal"
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            What Other &quot;Agent Checkpointing&quot; Articles Are Talking About,
            And Why It Is Not This
          </h2>
          <p className="text-zinc-600 mb-4">
            If you searched for AI agent UI state checkpointing in 2026, the
            top results are all variations on the same theme. LangGraph
            checkpointers persist <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-xs font-mono">AgentState</code>{" "}
            across nodes so a graph can resume after a crash. AG-UI defines a
            protocol for streaming agent state into a web frontend. Articles
            from Fast.io and the eunomia blog catalog file-based,
            database-backed, and in-memory storage backends. DeepLearning.AI
            forum threads explain how to thread a checkpointer through the
            LangGraph compile step. All useful. None of it tells you what
            should happen to the human&apos;s desktop when an agent clicks
            &quot;Send&quot; in a real running app on a real machine.
          </p>
          <p className="text-zinc-600 mb-4">
            That is the gap. macos-use treats every disruptive tool call as a
            transaction at the OS layer, separate from anything the agent
            framework above it does. The agent can be in LangGraph, in the
            Claude Agent SDK, in a hand-rolled loop. The MCP server below it
            still snapshots the same three pieces of OS state, restores the
            same two pieces, and writes the same diff. Stack the layers; do
            not conflate them.
          </p>
          <p className="text-zinc-600">
            The rest of this page is the specific implementation. Line numbers
            are checkable in{" "}
            <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-xs font-mono">
              Sources/MCPServer/main.swift
            </code>{" "}
            and{" "}
            <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-xs font-mono">
              Sources/MCPServer/InputGuard.swift
            </code>{" "}
            in the repo.
          </p>
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            The Three Snapshots, By The Numbers
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-teal-200 bg-teal-50 p-6 text-center">
              <div className="text-5xl font-bold text-teal-700 mb-2">
                <NumberTicker value={3} />
              </div>
              <div className="text-sm font-medium text-teal-800 mb-1">
                snapshots taken
              </div>
              <div className="text-xs text-teal-700/70">
                frontmost app, cursor, AX tree
              </div>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 text-center">
              <div className="text-5xl font-bold text-zinc-900 mb-2">
                <NumberTicker value={2} />
              </div>
              <div className="text-sm font-medium text-zinc-700 mb-1">
                restored on exit
              </div>
              <div className="text-xs text-zinc-500">
                cursor + frontmost app
              </div>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 text-center">
              <div className="text-5xl font-bold text-zinc-900 mb-2">
                <NumberTicker value={30} suffix="s" />
              </div>
              <div className="text-sm font-medium text-zinc-700 mb-1">
                lockout watchdog
              </div>
              <div className="text-xs text-zinc-500">
                InputGuard.swift:24
              </div>
            </div>
          </div>
          <p className="text-center text-xs text-zinc-500 mt-4 font-mono">
            See main.swift:1669-1781 for the snapshot/restore block.
          </p>
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            The Loop, In Five Stages
          </h2>
          <p className="text-zinc-600 mb-6">
            Every disruptive tool call walks the same path. Refresh-traversal
            is the only call that skips the guard and restore (it does not
            modify state).
          </p>
          <HorizontalStepper steps={stepperSteps} />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            The Snapshot Block, Verbatim
          </h2>
          <p className="text-zinc-600 mb-6">
            Lines 1669 through 1697 of <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-xs font-mono">main.swift</code>.
            This is the &quot;before&quot; half of the transaction. The
            screen-flip on the cursor is the part most macOS automation forgets
            and pays for later on multi-monitor setups.
          </p>
          <AnimatedCodeBlock
            code={checkpointBlockCode}
            language="swift"
            filename="Sources/MCPServer/main.swift"
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            The Restore Block, Verbatim
          </h2>
          <p className="text-zinc-600 mb-6">
            Lines 1766 through 1781. Cursor first, then foreground app, then
            return. Both halves run on success and on cancellation; the catch
            block at main.swift:1847 invokes the same restore code path so
            pressing Esc still leaves the user&apos;s workspace intact.
          </p>
          <AnimatedCodeBlock
            code={restoreBlockCode}
            language="swift"
            filename="Sources/MCPServer/main.swift"
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            The Lockout Watchdog That Stops Hung Tool Calls From Locking The Mac
          </h2>
          <p className="text-zinc-600 mb-6">
            CGEventTap is powerful: when engaged, it can suppress every
            keystroke and mouse click on the machine. If the Swift process
            crashes while the tap is engaged, the user is locked out. The
            watchdog at <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-xs font-mono">InputGuard.swift:24</code>{" "}
            is the safety net.
          </p>
          <AnimatedCodeBlock
            code={watchdogCode}
            language="swift"
            filename="Sources/MCPServer/InputGuard.swift"
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            What The Checkpoint Pipeline Looks Like End To End
          </h2>
          <p className="text-zinc-600 mb-6">
            Inputs on the left are what the server reads from the OS before
            the action. Outputs on the right are what gets written back, both
            to the OS (cursor, foreground app) and to disk (the diff).
          </p>
          <AnimatedBeam
            title="Three reads in. Two writes back to the OS. One diff to disk."
            from={beamFrom}
            hub={{ label: "macos-use handler (main.swift:1474)" }}
            to={beamTo}
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            One Tool Call, On The Wire
          </h2>
          <p className="text-zinc-600 mb-6">
            The MCP client sees a single request and a single response.
            Everything in between is private to the server. This is the same
            pattern any database transaction takes; the difference is that the
            &quot;rows&quot; here are accessibility elements and the
            &quot;commit log&quot; is a flat .txt file.
          </p>
          <SequenceDiagram
            title="click_and_traverse, including snapshot + restore"
            actors={sequenceActors}
            messages={sequenceMessages}
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            What The Persisted Checkpoint Looks Like On Disk
          </h2>
          <p className="text-zinc-600 mb-6">
            One Messages &quot;Send&quot; click, post-filter. Six diff lines.
            The cursor and foreground app have already been restored by the
            time you can read these files.
          </p>
          <TerminalOutput
            title="/tmp/macos-use/"
            lines={onDiskExample}
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <ProofBanner
            quote="The cursor save flips NSEvent.mouseLocation by primaryScreen.frame.height - nsPos.y so the saved CGPoint can be passed directly to CGEvent(mouseEventSource:mouseType:.mouseMoved, mouseCursorPosition:) on restore. Skip that flip and the cursor restores to the wrong y on multi-monitor setups."
            metric="3 lines"
            source="main.swift:1672-1676"
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            How This Is Different From LangGraph And AG-UI Checkpointing
          </h2>
          <p className="text-zinc-600 mb-6">
            Both are useful. They sit at different layers and address
            different failure modes. You can run all three together (a
            LangGraph thread that calls the macos-use MCP from inside an AG-UI
            frontend) without overlap.
          </p>
          <ComparisonTable
            productName="macos-use checkpoints"
            competitorName="LangGraph / AG-UI"
            rows={comparisonRows}
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            Each Stage In One Sentence
          </h2>
          <ol className="space-y-3">
            {checkpointStages.map((stage, i) => (
              <li
                key={stage.title}
                className="flex gap-4 rounded-xl border border-zinc-200 bg-zinc-50 p-5"
              >
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-teal-50 border border-teal-200 text-teal-700 font-mono text-sm font-semibold flex items-center justify-center">
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-base font-semibold text-zinc-900 mb-1">
                    {stage.title}
                  </h3>
                  <p className="text-sm text-zinc-600 leading-relaxed">
                    {stage.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <GlowCard>
            <div className="p-8">
              <h3 className="text-2xl font-bold text-zinc-900 mb-4">
                Why This Pattern Only Shows Up In macOS-Specific Agent Stacks
              </h3>
              <p className="text-zinc-600 mb-3">
                Browser agents do not need it because the browser is already a
                sandbox; closing the tab restores the world. Web-only agents
                do not need it because they never own focus. Container-based
                agents do not need it because there is no human at the
                keyboard whose state to preserve. Native desktop agents that
                run on the user&apos;s actual machine, against the user&apos;s
                actual apps, while the user is still at the keyboard, are the
                only case where checkpoint-and-restore at the OS layer
                matters. macos-use is the macOS half of that pattern;
                Terminator is the Windows half and uses the equivalent
                Windows APIs (GetForegroundWindow, GetCursorPos, UI Automation
                tree) to encode the same contract.
              </p>
              <p className="text-zinc-600">
                If you are building an agent loop where the human watches the
                screen while the agent works, you want this. If you are
                building a headless batch runner, you do not.
              </p>
            </div>
          </GlowCard>
        </section>

        <BookCallCTA
          appearance="footer"
          destination="https://cal.com/team/mediar/macos-use"
          site="macOS MCP"
          heading="Wiring macos-use into a real agent loop?"
          description="Book a 20-minute call with the team. We will walk the checkpoint path with you and help you stack it under whichever agent framework you are using."
        />

        <section className="max-w-4xl mx-auto px-6 py-12">
          <FaqSection items={faqItems} />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <RelatedPostsGrid
            title="Related guides on macos-use internals"
            posts={relatedPosts}
          />
        </section>

        <BookCallCTA
          appearance="sticky"
          destination="https://cal.com/team/mediar/macos-use"
          site="macOS MCP"
          description="See per-action checkpointing live on your own apps."
        />
      </article>
    </>
  );
}
