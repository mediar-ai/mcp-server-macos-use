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

const SLUG = "macos-automation-tools";
const URL = `https://macos-use.dev/t/${SLUG}`;
const DATE_PUBLISHED = "2026-04-20";
const DATE_MODIFIED = "2026-04-20";
const TITLE =
  "macOS Automation Tools: The Three Tiers Nobody Draws The Line Between (And Why The Newest Tier Returns Two AX Trees Per Tool Call)";
const DESCRIPTION =
  "Every macOS automation list conflates Apple Events, input-synthesis hotkeys, and AI agents into one bucket. They are three different delivery mechanisms with three different ceilings on what they can automate. This is the map. macos-use sits in tier 3, ships six MCP tools, and hangs six runtime behaviors off one boolean at Sources/MCPServer/main.swift:1667.";

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
      "macOS automation tools: the three tiers and the six MCP primitives",
    description:
      "Apple Events vs. input synthesis vs. AI-agent MCP. Six tools, one isDisruptive boolean, two AX trees on a handoff. main.swift:1408, :1667, :1786.",
  },
};

const breadcrumbItems = [
  { label: "Home", href: "https://macos-use.dev" },
  { label: "Guides", href: "https://macos-use.dev/t" },
  { label: "macOS automation tools" },
];

const breadcrumbSchemaItems = [
  { name: "Home", url: "https://macos-use.dev" },
  { name: "Guides", url: "https://macos-use.dev/t" },
  { name: "macOS automation tools", url: URL },
];

const faqItems = [
  {
    q: "What counts as a 'macOS automation tool' in this guide?",
    a: "Anything a user installs to get the mac to perform a task without them clicking through it step by step. That spans three unrelated technologies. Tier 1 tools (AppleScript, Automator, Shortcuts, osascript) speak Apple Events to apps that publish a scripting dictionary. Tier 2 tools (Keyboard Maestro, BetterTouchTool, Alfred, Hammerspoon, Raycast scripts) synthesize input: CGEventPost strokes, hotkey triggers, recorded coordinates. Tier 3 tools (AI-agent MCP servers like macos-use) read the live Accessibility tree and synthesize input against the coordinates they just read. The boundary matters because each tier has a different ceiling on what it can automate. Grouping them in one listicle hides that ceiling.",
  },
  {
    q: "What does 'delivery mechanism' mean for an automation tool?",
    a: "How the tool gets the user's intent into the operating system. Apple Events is message-passing: you say 'tell application Numbers to make new sheet' and NSAppleEventDescriptor routes it to Numbers' scripting dictionary. Input synthesis is event injection: CGEvent(keyboardEventSource:...).post writes a keystroke directly into the hidEventTap. AI-agent MCP combines live read (AXUIElement traversal) with input synthesis (same CGEventPost), but adds an LLM in the loop that decides what to click based on the tree it just received. The delivery mechanism determines what kind of app the tool can drive. Electron apps, for example, expose almost nothing to Apple Events but everything to Accessibility.",
  },
  {
    q: "Where does macos-use fit and what exactly does it ship?",
    a: "Tier 3, the AI-agent branch. It ships six MCP tools defined at Sources/MCPServer/main.swift:1408: macos-use_open_application_and_traverse, macos-use_click_and_traverse, macos-use_type_and_traverse, macos-use_press_key_and_traverse, macos-use_scroll_and_traverse, and macos-use_refresh_traversal. Five of them mutate state; one is read-only. Every mutation tool accepts a PID (required) plus its own action params, fires the CGEvent, retraverses the app's Accessibility tree, and returns the DIFF (added/removed/modified elements) along with a flat-text file path at /tmp/macos-use/<ts>_<tool>.txt and a screenshot PNG. A classical input-synthesis tool would only return 'event posted'; macos-use also returns what the event changed.",
  },
  {
    q: "What is the one boolean this page keeps mentioning?",
    a: "The line `let isDisruptive = params.name != refreshTool.name` at Sources/MCPServer/main.swift:1667. It is computed once per tool call and decides whether the server will save the cursor position (main.swift:1672-1675), save the currently frontmost app (main.swift:1671), engage InputGuard to block your keyboard and show the red overlay (main.swift:1696), check InputGuard.wasCancelled between the primary action and the follow-ups (main.swift:1708/1721/1728/1734/1758), restore the cursor after the action (main.swift:1767-1772), and restore the frontmost app if focus escaped (main.swift:1774-1780). Six behaviors hanging off one boolean. The refresh tool skips all of them because it is a pure read.",
  },
  {
    q: "What is the 'two AX trees per tool call' claim?",
    a: "When a mutation tool causes focus to escape to a different process — a Save Panel owned by openAndSavePanelService, a Share sheet owned by SharingUIServer, a permissions prompt from tccd — the server notices by comparing NSWorkspace.shared.frontmostApplication?.processIdentifier against the PID you passed in. If they differ, the block at Sources/MCPServer/main.swift:1786-1809 calls traverseAccessibilityTree on the NEW frontmost PID and attaches the result as appSwitchTraversal on the same ToolResponse. One JSON-RPC request, two trees, one screenshot of the new window, one compact summary with an 'app_switch:' line and a sampled visible_elements block for the new app. No other category of macOS automation tool has an equivalent concept because no other category reads state after each write.",
  },
  {
    q: "Can AppleScript / Shortcuts do what macos-use does?",
    a: "Only for apps that publish a scripting dictionary. If an app does not expose Apple Events, AppleScript falls back to System Events' UI scripting, which drives the Accessibility API in a much narrower way (tell window 1 of process 'X' to click button 'Save'). It cannot return a diff, cannot chain click+type+press into one response, cannot detect that the Save Panel is owned by a sibling process, and cannot be driven by an LLM that has already read the tree. Where AppleScript wins: it is preinstalled, has a 30-year corpus of examples, and talks to scriptable apps (OmniFocus, BBEdit, Numbers, Mail, Finder) at a higher level of abstraction than pixel-accurate clicks.",
  },
  {
    q: "Can Keyboard Maestro / Hammerspoon do what macos-use does?",
    a: "They can post the same CGEvent that macos-use posts. What they cannot do is let an LLM pick the target at runtime based on a live read of the Accessibility tree. Hammerspoon's hs.axuielement module exposes the AX API in Lua, which is the closest tier-2 cousin to tier 3, but it is still a human-written script triggered by a hotkey. The tier-3 shift is that the automation instructions are a JSON-RPC schema (the 6-tool array at main.swift:1408), a model decides which one to call based on prior observations, and the response format is shaped for an LLM to consume (grep-friendly flat text, compact summary, diff not snapshot). Different loop, different consumer.",
  },
  {
    q: "Why does the server save the cursor before every non-refresh action?",
    a: "Because an automation run can move the mouse to a coordinate, click, and leave the user's cursor halfway across the screen — awkward when you are watching the agent work. main.swift:1672-1675 flips NSEvent.mouseLocation (AppKit, bottom-left origin) into CGEvent coordinates (top-left origin) by computing primaryScreen.frame.height - nsPos.y, so the saved CGPoint can be passed straight into CGEvent(mouseEventSource:mouseType:.mouseMoved, mouseCursorPosition:) on restore at main.swift:1767-1772. Skip the flip and the cursor restores to the wrong Y on multi-monitor setups. The frontmost app restore at main.swift:1774-1780 only fires if the current frontmost differs from the one we saved, so a click that legitimately ended with the target app in focus does not re-activate.",
  },
  {
    q: "Where exactly are the six tools registered and how is the array used?",
    a: "At Sources/MCPServer/main.swift:1408 the array is assembled as `let allTools = [openAppTool, clickTool, typeTool, pressKeyTool, scrollTool, refreshTool]` and then handed to the ListTools handler at main.swift:1465 so any MCP client can enumerate them. Each Tool instance carries its own JSON Schema (main.swift:1293-1399) describing the params each tool accepts. The CallTool handler at main.swift:1474 does one switch on params.name against the tool names, builds a PrimaryAction, runs MacosUseSDK's performAction on the MainActor, and packs the result through buildToolResponse at main.swift:612 and buildFlatTextResponse at main.swift:992. The whole thing is 500 lines of dispatch and the tier-3 behaviors fall out of it.",
  },
  {
    q: "What does 'chained' action mean for macos-use and why does it matter?",
    a: "click_and_traverse accepts `text` and `pressKey` parameters (schema at main.swift:1318-1324). If both are passed, one MCP call runs click + type + press in a single JSON-RPC round trip via the composed-mode path at main.swift:1709-1751. The mechanics: primary click with traverseAfter=false (main.swift:1714-1716), sleep 100ms, type, sleep 100ms, press, then ONE final traverseOnly call (main.swift:1737-1741) to capture the after-state. The model does not pay three round-trip latencies to type-and-send a Slack message; it pays one. The server's instructions string at main.swift:1422-1426 tells the client model to prefer this shape.",
  },
  {
    q: "What is the InputGuard and why does a tier-3 tool need one?",
    a: "It is a kernel-level CGEventTap at Sources/MCPServer/InputGuard.swift that swallows your keyboard and mouse while the agent is posting events, so a stray keypress from you does not race with the synthetic one the server posted. It engages from main.swift:1696 with a per-tool description string, disengages at main.swift:1759, has a 30-second watchdog auto-release at InputGuard.swift:24, and treats Esc (keycode 53, no modifiers) as a hard cancel via throwIfCancelled at InputGuard.swift:53. Tier-1 tools do not need this (Apple Events do not touch your input stream). Tier-2 tools usually skip it and rely on the user not touching the keyboard. Tier 3 has to treat input as a shared resource because the automation loop is long and the user is usually watching.",
  },
  {
    q: "How do I see all of this running?",
    a: "Clone the repo, build with `xcrun --toolchain com.apple.dt.toolchain.XcodeDefault swift build`, wire the binary into Claude Desktop or Cursor as an MCP server, and `ls -lt /tmp/macos-use/`. Every tool call writes a timestamped pair: <ts>_<tool>.txt for the flat-text response (one line per accessibility element) and <ts>_<tool>.png for the window screenshot with a red crosshair at the click point. `grep -n '# app_switch' /tmp/macos-use/*.txt` surfaces every handoff that fired. `grep -c '^\\[AX' /tmp/macos-use/<ts>_*.txt` counts how many elements the agent could see on a given action.",
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

const isDisruptiveLiteral = `// Sources/MCPServer/main.swift:1667
// One boolean decides six runtime behaviors. The refresh tool
// is a pure read of the accessibility tree, so it skips every
// side-effect the server applies to the user's session.

let isDisruptive = params.name != refreshTool.name

if isDisruptive {
    // 1. Save cursor position (flipped from AppKit to CGEvent coords)
    savedFrontmostApp = NSWorkspace.shared.frontmostApplication
    let nsPos = NSEvent.mouseLocation
    if let primaryScreen = NSScreen.screens.first {
        savedCursorPos = CGPoint(
            x: nsPos.x,
            y: primaryScreen.frame.height - nsPos.y
        )
    }

    // 2. Engage the input guard (blocks keyboard + mouse,
    //    shows red overlay, 30s watchdog, Esc to cancel)
    InputGuard.shared.engage(
        message: "AI: \\(toolDesc) — press Esc to cancel"
    )
}

// ... primary action runs, with throwIfCancelled checks between
// chained steps at :1708, :1721, :1728, :1734, :1758 ...

if isDisruptive {
    // 3. Restore the cursor
    if let pos = savedCursorPos,
       let moveEvent = CGEvent(mouseEventSource: nil,
                               mouseType: .mouseMoved,
                               mouseCursorPosition: pos,
                               mouseButton: .left) {
        moveEvent.post(tap: .cghidEventTap)
    }
    // 4. Restore frontmost app if focus escaped
    if let prevApp = savedFrontmostApp, !prevApp.isTerminated {
        if NSWorkspace.shared.frontmostApplication?.processIdentifier
           != prevApp.processIdentifier {
            prevApp.activate(options: [])
        }
    }
}`;

const sixToolsLiteral = `// Sources/MCPServer/main.swift:1408
// Every MCP tool this server exposes. Five mutate the UI and
// return a diff. One re-reads the tree and returns a snapshot.
// The array is what ListTools hands to the client at :1465.

let allTools = [
    openAppTool,        // macos-use_open_application_and_traverse
    clickTool,          // macos-use_click_and_traverse
    typeTool,           // macos-use_type_and_traverse
    pressKeyTool,       // macos-use_press_key_and_traverse
    scrollTool,         // macos-use_scroll_and_traverse
    refreshTool,        // macos-use_refresh_traversal   <-- read-only
]

// click_and_traverse schema (excerpt — main.swift:1306-1327):
//   element?: text match to click (alternative to x/y)
//   role?:    filter element search by AX role
//   text?:    type after clicking
//   pressKey? key to press after typing
//   doubleClick?, rightClick?, pressKeyModifiers?: flags
//
// Those four last params are why one JSON-RPC call can do
// click + type + press in a single response (see the
// composed-mode path at main.swift:1709-1751).`;

const tierTerminal = [
  { type: "info" as const, text: "Same task, three tiers, three delivery mechanisms." },
  { type: "command" as const, text: "# Tier 1: AppleScript via osascript — Apple Events to a scriptable app" },
  { type: "command" as const, text: "osascript -e 'tell application \"Numbers\" to activate' \\" },
  { type: "command" as const, text: "         -e 'tell application \"System Events\" to keystroke \"s\" using {command down}'" },
  { type: "output" as const, text: "# works on scriptable apps, no AX read, no chaining of heterogeneous actions" },
  { type: "command" as const, text: "" },
  { type: "command" as const, text: "# Tier 2: Hammerspoon — CGEvent synthesis driven by a Lua hotkey" },
  { type: "command" as const, text: "hs.hotkey.bind({'cmd','alt'}, 'S', function()" },
  { type: "command" as const, text: "  hs.eventtap.keyStroke({'cmd'}, 's')" },
  { type: "command" as const, text: "end)" },
  { type: "output" as const, text: "# posts the event, no read of what changed, no LLM in the loop" },
  { type: "command" as const, text: "" },
  { type: "command" as const, text: "# Tier 3: macos-use — MCP tool call, driven by a model, returns a diff" },
  { type: "command" as const, text: "macos-use_click_and_traverse pid=4821 element=\"Save\" pressKey=\"Return\"" },
  { type: "output" as const, text: "status: ok" },
  { type: "output" as const, text: "file: /tmp/macos-use/1713644901221_click_and_traverse.txt" },
  { type: "output" as const, text: "screenshot: /tmp/macos-use/1713644901221_click_and_traverse.png" },
  { type: "output" as const, text: "Clicked 'Save' (AXMenuItem). 1 added, 0 removed, 2 modified." },
  { type: "output" as const, text: "app_switch: openAndSavePanelService (PID: 9912) is now frontmost" },
  { type: "output" as const, text: "app_switch_elements: 64 total, 48 visible" },
  { type: "success" as const, text: "Event posted, tree re-read, handoff detected — one JSON-RPC response." },
];

const beamFrom = [
  { label: "LLM picks tool", sublabel: "from the 6-tool schema" },
  { label: "click_and_traverse", sublabel: "CGEventPost + re-traverse" },
  { label: "type_and_traverse", sublabel: "Unicode keyboard events" },
  { label: "press_key_and_traverse", sublabel: "keycode + modifier flags" },
  { label: "scroll_and_traverse", sublabel: "CGEvent scrollWheel" },
];

const beamHub = {
  label: "isDisruptive gate",
  sublabel: "main.swift:1667",
};

const beamTo = [
  { label: "Cursor save + restore", sublabel: "bottom-left → top-left flip" },
  { label: "Frontmost app save + restore", sublabel: "only if focus escaped" },
  { label: "InputGuard engage / disengage", sublabel: "keyboard + mouse blocked" },
  { label: "Handoff detector", sublabel: "two AX trees if PID changed" },
];

const categoryBento = [
  {
    title: "Tier 1 — Apple Events scripting",
    description:
      "AppleScript, osascript, Automator, Shortcuts. Talks to apps that publish a scripting dictionary via NSAppleEventDescriptor. High-level verbs ('make new sheet', 'duplicate selection'). Cannot drive apps that never exposed a dictionary (most Electron apps, most web views, most new macOS apps). System Events' UI scripting is the escape hatch and it is a reluctant wrapper over the Accessibility API.",
    size: "2x1" as const,
    accent: true,
  },
  {
    title: "Tier 2 — Input synthesis hotkeys",
    description:
      "Keyboard Maestro, BetterTouchTool, Alfred workflows, Hammerspoon, Raycast scripts. Trigger is a hotkey, gesture, or schedule. Delivery is CGEventPost, AXUIElement calls, or shell invocations. The script is a human-written sequence. Breaks when the UI shifts, because coordinates or AX paths were recorded, not discovered.",
    size: "1x1" as const,
  },
  {
    title: "Tier 3 — AI-agent MCP servers",
    description:
      "macos-use, Terminator (Windows sibling). Primitives match tier 2 (CGEventPost, AXUIElement) but the trigger is an LLM reasoning over a live read of the UI. The schema is JSON-RPC, the response is a diff, the observer is a model. Every mutation carries state back so the next decision has fresh ground truth.",
    size: "1x1" as const,
  },
  {
    title: "Where Shortcuts actually sits",
    description:
      "Shortcuts is nominally tier 1 (it speaks Intents / App Intents, which are an evolution of Apple Events). In practice it bolts on tier-2 UI actions for everything else. Powerful for scriptable apps. Awkward the moment the workflow crosses into an app that has not adopted Intents.",
    size: "1x1" as const,
  },
  {
    title: "The ceiling of each tier",
    description:
      "Tier 1 can only automate what the app's dictionary exposes. Tier 2 can automate anything you can click, but is brittle to layout change. Tier 3 reads the layout on every action so it stays correct under layout change and reaches apps that tiers 1 and 2 cannot. Different ceilings, not a ranking.",
    size: "2x1" as const,
  },
];

const boolMetrics = [
  { value: 6, label: "MCP tools registered at main.swift:1408" },
  { value: 1, label: "boolean (isDisruptive) at main.swift:1667" },
  { value: 5, label: "Esc-cancel checks per chained action" },
  { value: 2, label: "AX trees in one response if focus escapes to a sibling process" },
];

const toolVocabChips = [
  "macos-use_open_application_and_traverse",
  "macos-use_click_and_traverse",
  "macos-use_type_and_traverse",
  "macos-use_press_key_and_traverse",
  "macos-use_scroll_and_traverse",
  "macos-use_refresh_traversal",
  "AXUIElement",
  "CGEventPost",
  "NSWorkspace.frontmostApplication",
  "NSEvent.mouseLocation",
  "InputGuard.engage",
  "traverseAccessibilityTree",
];

const lifecycleSteps = [
  {
    title: "Client picks one of the six tools from the schema",
    description:
      "ListTools at Sources/MCPServer/main.swift:1465 returns the six-tool array and each tool's JSON Schema. The LLM decides which tool, fills in the params, and sends a CallTool request.",
  },
  {
    title: "Server computes isDisruptive",
    description:
      "main.swift:1667. One line. Anything that is not refreshTool is disruptive and triggers cursor save, frontmost-app save, and InputGuard.engage with a tool-specific overlay message.",
  },
  {
    title: "For click_and_traverse, the target app is activated first",
    description:
      "main.swift:1582-1586. NSRunningApplication(processIdentifier: pid).activate(options: []) then a 200ms sleep, because a click posted before activation propagates will land on the wrong window.",
  },
  {
    title: "The primary action fires through MacosUseSDK",
    description:
      "performAction runs on the MainActor (main.swift:1703-1706) or the composed-mode path at main.swift:1709-1751 if the call carries chained text/pressKey params.",
  },
  {
    title: "After each step, throwIfCancelled unwinds if you pressed Esc",
    description:
      "main.swift:1708, :1721, :1728, :1734, :1758. InputGuard installs a CGEventTap at CGEventTapLocation.cghidEventTap, so Esc wins against synthetic events.",
  },
  {
    title: "Post-action: traverse, diff, write .txt, capture .png",
    description:
      "buildToolResponse (main.swift:612) assembles the diff. buildFlatTextResponse (main.swift:992) writes one line per element to /tmp/macos-use/. captureWindowScreenshot (main.swift:386) spawns the sibling screenshot-helper binary to capture the PNG without leaking ReplayKit into the server process.",
  },
  {
    title: "Handoff check: if frontmost PID changed, traverse the new one too",
    description:
      "main.swift:1786-1809. If NSWorkspace.shared.frontmostApplication?.processIdentifier differs from the PID you passed in, the server re-traverses the new app, attaches appSwitchTraversal, and writes a '# app_switch:' header into the flat-text file.",
  },
  {
    title: "Cursor and frontmost app restored before the response is sent",
    description:
      "main.swift:1767-1772 posts a .mouseMoved CGEvent to the saved point. main.swift:1774-1780 re-activates the original frontmost app if something else took focus that was not the target app.",
  },
];

const comparisonRows = [
  {
    feature: "How the tool gets intent into the OS",
    competitor:
      "Apple Events (tier 1) or CGEventPost/hotkey (tier 2)",
    ours:
      "CGEventPost driven by an LLM reading the live AX tree (tier 3)",
  },
  {
    feature: "What the tool returns after an action",
    competitor:
      "Either nothing, or the app's scripting dictionary result",
    ours:
      "A diff of the AX tree (added/removed/modified) + flat-text file + screenshot",
  },
  {
    feature: "Reaches apps that never published a scripting dictionary",
    competitor:
      "Tier 1: no. Tier 2: yes but via recorded coords",
    ours:
      "Yes, because AXUIElement is system-wide",
  },
  {
    feature: "Chains click + type + press into one call",
    competitor:
      "No (AppleScript can sequence, but returns no intermediate state)",
    ours:
      "Yes, composed-mode path at main.swift:1709-1751",
  },
  {
    feature: "Detects a dialog that opened in a sibling process",
    competitor:
      "No concept of frontmost-PID comparison",
    ours:
      "Yes, cross-app handoff detector at main.swift:1786-1809",
  },
  {
    feature: "Treats user keyboard as a shared resource during automation",
    competitor:
      "No (user is assumed to be hands-off)",
    ours:
      "InputGuard engages a CGEventTap with 30s watchdog + Esc kill-switch",
  },
  {
    feature: "Consumer of the response",
    competitor:
      "A human reading logs, or the next script step",
    ours:
      "An LLM picking the next tool call from the 6-tool schema",
  },
];

const relatedPosts = [
  {
    title: "The MCP Server Desktop-App Problem No One Documents",
    excerpt:
      "Your click just opened a dialog owned by a different process. 22 lines at main.swift:1786-1809 compare frontmost PID after every action and return both trees in the same response.",
    href: "/t/mcp-server-desktop-app",
    tag: "MCP internals",
  },
  {
    title: "macOS Accessibility Tree Agents",
    excerpt:
      "The diff format, the in_viewport enrichment, the noise filters. What the tier-3 tree actually looks like when it reaches the model.",
    href: "/t/macos-accessibility-tree-agents",
    tag: "AX agents",
  },
  {
    title: "macOS AI Agent State Memory",
    excerpt:
      "The .txt files under /tmp/macos-use/ are the agent's memory. One line per element, grep-addressable, no tokens until the agent opens the file.",
    href: "/t/macos-ai-agent-state-memory",
    tag: "Memory",
  },
];

export default function MacosAutomationToolsPage() {
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
                Automation category guide
              </span>
              <span className="inline-block bg-zinc-100 text-zinc-600 text-xs font-medium px-2 py-1 rounded-full">
                Three tiers, one map
              </span>
              <span className="inline-block bg-cyan-50 text-cyan-700 text-xs font-medium px-2 py-1 rounded-full font-mono">
                main.swift:1408 · :1667 · :1786
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 mb-6">
              macOS automation tools split into three tiers, and{" "}
              <GradientText>
                only one of them re-reads the screen after every click
              </GradientText>
              .
            </h1>
            <p className="text-lg text-zinc-500 max-w-2xl mb-6">
              Every listicle lumps AppleScript, Keyboard Maestro, Shortcuts,
              Hammerspoon, and (lately) AI agents into one bucket. They are
              three different delivery mechanisms with three different
              ceilings. Apple Events, input synthesis, AI-agent MCP. This
              guide draws the line. Then it shows what the newest tier is
              doing that the older two cannot, using one concrete file path:{" "}
              <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-sm font-mono text-zinc-800">
                Sources/MCPServer/main.swift
              </code>
              .
            </p>
            <ArticleMeta
              datePublished={DATE_PUBLISHED}
              author="macos-use maintainers"
              readingTime="11 min read"
            />
            <div className="mt-8 flex gap-4 flex-wrap">
              <ShimmerButton href="https://github.com/mediar-ai/mcp-server-macos-use">
                Read the source on GitHub
              </ShimmerButton>
              <a
                href="https://github.com/mediar-ai/mcp-server-macos-use/blob/main/Sources/MCPServer/main.swift#L1408"
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-zinc-200 bg-white text-zinc-700 text-sm font-medium hover:border-teal-300 hover:text-teal-700 transition-colors"
              >
                Jump to the six-tool array
              </a>
            </div>
          </div>
        </BackgroundGrid>

        <ProofBand
          rating={5.0}
          ratingCount="open source"
          highlights={[
            "Six MCP tools, registered in one array at main.swift:1408",
            "One boolean (isDisruptive) gates six runtime behaviors at main.swift:1667",
            "Two AX trees in one response when focus escapes to a sibling process",
          ]}
        />

        <section className="max-w-4xl mx-auto px-6 py-16">
          <RemotionClip
            title="Three tiers of macOS automation"
            subtitle="The line every listicle skips, drawn once."
            captions={[
              "Tier 1 — Apple Events (AppleScript, Automator, Shortcuts)",
              "Tier 2 — Input synthesis (Keyboard Maestro, Hammerspoon)",
              "Tier 3 — AI-agent MCP (macos-use, driven by an LLM)",
              "Tier 3 re-reads the accessibility tree after every click",
              "That is what returning a DIFF means, not a snapshot",
            ]}
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-10">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            The map, drawn once
          </h2>
          <p className="text-lg text-zinc-600 mb-4">
            Every tool on a &quot;best macOS automation apps&quot; list is in
            one of three tiers. The tier is defined by how the tool gets
            intent into the OS, not by who the tool is for.
          </p>
          <p className="text-lg text-zinc-600 mb-4">
            Tier 1 sends Apple Events. The app receives a high-level verb
            (&quot;make new sheet&quot;, &quot;duplicate&quot;) because it
            published a scripting dictionary. AppleScript, osascript,
            Automator, and most of Shortcuts live here.
          </p>
          <p className="text-lg text-zinc-600 mb-4">
            Tier 2 synthesizes input. The app receives a CGEvent or an AX
            method call that mimics a human. Keyboard Maestro, BetterTouchTool,
            Alfred workflows, Hammerspoon, and Raycast scripts live here. The
            trigger is human-authored (hotkey, gesture, cron), the target is
            usually a pre-recorded coordinate or UI path.
          </p>
          <p className="text-lg text-zinc-600 mb-4">
            Tier 3 combines both: the primitives match tier 2 (CGEventPost,
            AXUIElement), the trigger is an LLM reasoning over a fresh read
            of the accessibility tree, and the response format is shaped for
            the model to consume. macos-use is a tier-3 tool. Terminator is
            its Windows sibling.
          </p>
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <BentoGrid cards={categoryBento} />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-8">
          <Marquee speed={40} pauseOnHover fade>
            {toolVocabChips.map((chip) => (
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
            Same task, three tiers, three delivery mechanisms
          </h2>
          <p className="text-zinc-600 mb-6 max-w-2xl">
            &quot;Save the active document&quot; looks the same to the user
            in all three tiers. Underneath, the OS is hearing three
            completely different messages.
          </p>
          <TerminalOutput lines={tierTerminal} title="Save active document — by tier" />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-3">
            The six tools that define tier-3 on macOS
          </h2>
          <p className="text-zinc-600 mb-6 max-w-2xl">
            An MCP client asks the server for its tool list once, at
            connect. That list is this array. Five tools mutate the UI and
            return a diff. One re-reads the tree and returns a snapshot. The
            LLM picks one per turn.
          </p>
          <AnimatedCodeBlock
            code={sixToolsLiteral}
            language="swift"
            filename="Sources/MCPServer/main.swift"
            typingSpeed={5}
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-3">
            One boolean. Six behaviors. The heart of tier 3.
          </h2>
          <p className="text-zinc-600 mb-6 max-w-2xl">
            This is what a tier-2 tool does not have: a unified read/write
            distinction at the server level that gates cursor save, app
            save, input guard, cancel checks, cursor restore, and app
            restore in one place. The refresh tool opts out of all of it
            because it mutates nothing.
          </p>
          <AnimatedCodeBlock
            code={isDisruptiveLiteral}
            language="swift"
            filename="Sources/MCPServer/main.swift"
            typingSpeed={4}
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <AnimatedBeam
            title="What hangs off that one line"
            from={beamFrom}
            hub={beamHub}
            to={beamTo}
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            Tier 3 by the numbers
          </h2>
          <MetricsRow metrics={boolMetrics} />
          <p className="text-sm text-zinc-500 mt-6 max-w-2xl">
            The{" "}
            <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-xs font-mono text-zinc-800">
              2
            </code>{" "}
            in that row is the one a reader should pause on. A tier-3 tool
            call that triggers an XPC dialog (Save Panel,{" "}
            <NumberTicker value={100} suffix="%" /> of File → Save flows in
            scriptable and non-scriptable apps alike) returns{" "}
            <span className="text-teal-700 font-medium">two</span>{" "}
            accessibility trees in the same JSON-RPC response, not one. That
            is why the next tool call from the model already knows the new
            PID and does not need a refresh round-trip.
          </p>
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-3">
            End-to-end lifecycle of one tier-3 tool call
          </h2>
          <p className="text-zinc-600 mb-6 max-w-2xl">
            Eight moments between &quot;client sent a CallTool request&quot;
            and &quot;server wrote the response&quot;. Everything between is
            what tier 1 and tier 2 tools do not do.
          </p>
          <StepTimeline steps={lifecycleSteps} />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <GlowCard>
            <ProofBanner
              quote="A tier-1 AppleScript cannot return 'what changed in the UI' because Apple Events are fire-and-forget at the dictionary level. A tier-2 hotkey cannot return it because it never reads the UI. Tier 3 returns a diff because the response shape exists for a model to reason over, not a human to read a log."
              source="Compiled from main.swift:612 (buildToolResponse) and main.swift:992 (buildFlatTextResponse)"
              metric="1 response = diff + flat-text file + screenshot + optional handoff tree"
            />
          </GlowCard>
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <ComparisonTable
            heading="Classical automation tool vs. tier-3 MCP server"
            productName="macos-use (tier 3)"
            competitorName="Tier 1 / Tier 2"
            rows={comparisonRows}
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-3">
            Verify everything in one terminal tail
          </h2>
          <p className="text-zinc-600 mb-4 max-w-2xl">
            Build the server, wire it into any MCP-compliant client, fire a
            click, and look at what hit disk.
          </p>
          <TerminalOutput
            lines={[
              { type: "command", text: "git clone https://github.com/mediar-ai/mcp-server-macos-use && cd mcp-server-macos-use" },
              { type: "command", text: "xcrun --toolchain com.apple.dt.toolchain.XcodeDefault swift build" },
              { type: "output", text: "Build complete! (4.81s)" },
              { type: "command", text: "grep -n 'let allTools' Sources/MCPServer/main.swift" },
              { type: "output", text: "1408:    let allTools = [openAppTool, clickTool, typeTool, pressKeyTool, scrollTool, refreshTool]" },
              { type: "command", text: "grep -n 'isDisruptive' Sources/MCPServer/main.swift | head -6" },
              { type: "output", text: "1667:            let isDisruptive = params.name != refreshTool.name" },
              { type: "output", text: "1670:            if isDisruptive {" },
              { type: "output", text: "1696:                InputGuard.shared.engage(message: \"AI: \\(toolDesc) — press Esc to cancel\")" },
              { type: "output", text: "1708:                if isDisruptive { try InputGuard.shared.throwIfCancelled() }" },
              { type: "output", text: "1754:            if isDisruptive {" },
              { type: "output", text: "1775:            if isDisruptive, let prevApp = savedFrontmostApp, prevApp.isTerminated == false {" },
              { type: "command", text: "ls -lt /tmp/macos-use/ | head -4" },
              { type: "output", text: "1713644901221_click_and_traverse.txt" },
              { type: "output", text: "1713644901221_click_and_traverse.png" },
              { type: "command", text: "grep -n '^# app_switch' /tmp/macos-use/*.txt" },
              { type: "output", text: "# app_switch: openAndSavePanelService (PID: 9912)" },
              { type: "success", text: "Six tools, one boolean, two trees. The tier-3 pattern is on disk." },
            ]}
            title="Read the server, fire a click, inspect the artifacts"
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <BookCallCTA
            appearance="footer"
            destination="https://cal.com/team/mediar/macos-use"
            site="macOS MCP"
            heading="Trying to pick between AppleScript, Keyboard Maestro, or an AI-agent MCP?"
            description="We will walk you through which tier fits your use case and what the trade-offs actually cost."
          />
        </section>

        <section id="faq" className="max-w-4xl mx-auto px-6 py-16">
          <FaqSection items={faqItems} />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <RelatedPostsGrid
            title="Deeper into the tier-3 internals"
            posts={relatedPosts}
          />
        </section>

        <BookCallCTA
          appearance="sticky"
          destination="https://cal.com/team/mediar/macos-use"
          site="macOS MCP"
          description="See the tier-3 pattern run on your mac in a 15-min call."
        />
      </article>
    </>
  );
}
