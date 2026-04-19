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
  AnimatedBeam,
  Marquee,
  AnimatedCodeBlock,
  TerminalOutput,
  SequenceDiagram,
  ComparisonTable,
  MetricsRow,
  BentoGrid,
  BeforeAfter,
  GlowCard,
  StepTimeline,
  InlineCta,
  articleSchema,
  breadcrumbListSchema,
  faqPageSchema,
} from "@seo/components";

const SLUG = "slack-mcp-server";
const URL = `https://macos-use.dev/t/${SLUG}`;
const DATE_PUBLISHED = "2026-04-19";
const DATE_MODIFIED = "2026-04-19";
const TITLE =
  "Slack MCP Server Without An OAuth Token: Driving The Desktop App Instead Of The API";
const DESCRIPTION =
  "Every result on the first page of Google is an API wrapper. macos-use is the one Slack MCP server that never calls chat.postMessage. It drives the macOS Slack desktop app through the accessibility tree, and the server literally ships a Slack-specific usage example baked into main.swift:1424 that gets sent to Claude Desktop on every initialize handshake.";

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
    title: "slack mcp server without an OAuth token",
    description:
      "The one Slack MCP server that never calls Slack's API. It drives the macOS Slack desktop app through the accessibility tree. The Slack example is baked into the server's instructions at main.swift:1424.",
  },
};

const breadcrumbItems = [
  { label: "Home", href: "https://macos-use.dev" },
  { label: "Guides", href: "https://macos-use.dev/t" },
  { label: "Slack MCP Server" },
];

const breadcrumbSchemaItems = [
  { name: "Home", url: "https://macos-use.dev" },
  { name: "Guides", url: "https://macos-use.dev/t" },
  { name: "Slack MCP Server", url: URL },
];

const faqItems = [
  {
    q: "Is this the same thing as Slack's official MCP server?",
    a: "No. Slack's official MCP server, launched in 2026, is a hosted server at slack.dev that calls Slack's REST API on your behalf (search.messages, chat.postMessage, users.list, and so on). It needs an admin to approve the MCP integration in Workspace Settings and issues an OAuth token scoped to that approval. macos-use is the opposite approach: it is a local Swift binary that drives the macOS Slack desktop app through the Accessibility APIs. No token, no admin approval, no REST calls. It works for any workspace you are already signed into on your Mac, including Enterprise Grid and workspaces where the admin has not enabled the official MCP.",
  },
  {
    q: "How does the server know how to send a Slack message?",
    a: "The hint is in the server's own instructions string, sent to the MCP client on every initialize handshake. Look at Sources/MCPServer/main.swift:1424. The exact line reads: `Example: to type into a Slack message box and send it, use ONE click_and_traverse call with element=\"Message to X\", text=\"hello\", pressKey=\"Return\"`. That sentence is the only per-app example in the entire instructions field. Every MCP client (Claude Desktop, Cursor, VS Code, Cline) receives that text when it connects. The model reads it and chains click + type + Return into a single JSON-RPC call instead of three separate ones.",
  },
  {
    q: "What does \"Message to X\" refer to?",
    a: "That is the literal accessibility label Slack's desktop app attaches to the compose input in a channel or DM. Slack renders it as \"Message to #general\" for channels and \"Message to Alice\" for DMs. macos-use's element matcher finds elements whose AX text or AX description contains that substring, reads their x/y/w/h from the accessibility tree, and auto-centers the click at (x+w/2, y+h/2) per main.swift:1574. The model never needs to estimate coordinates from a screenshot, which is explicitly forbidden by the instructions at main.swift:1429.",
  },
  {
    q: "What JSON-RPC arguments actually get sent for a Slack message?",
    a: "Exactly one callTool request. The method name is macos-use_click_and_traverse. The arguments are { pid: <Slack pid>, element: \"Message to general\", text: \"standup in 5\", pressKey: \"Return\" }. The server gets the Slack PID once via NSWorkspace.shared.runningApplications (or a prior open_application_and_traverse call). The composed click → type → press is executed in order on the main run loop at main.swift:1709-1741, with a 100ms sleep between steps and an InputGuard throwIfCancelled check at every boundary. One round trip, three OS-level effects.",
  },
  {
    q: "Does this need Slack's API, admin approval, or a bot user?",
    a: "No. This is the point of the page. The macOS Accessibility framework lets any app with the Accessibility permission read and synthesize events against any other app on the machine. Slack's AXUIElement tree is exposed to the OS the same way Safari's or Mail's is. There is no HTTP, no OAuth, no scopes, no rate limits. If you can click in Slack on your laptop, macos-use can click in Slack on your laptop. The downside: this only works on the one Mac where the MCP client runs, and only while Slack is open and signed in there.",
  },
  {
    q: "What stops the model from typing in the wrong Slack channel?",
    a: "Three things. First, the element parameter is a substring match against the accessibility tree of the target PID, so the model has to name the channel: `element: \"Message to #standups\"` targets that channel, not whatever is open. Second, every disruptive tool call engages InputGuard.swift, which shows a full-screen overlay with a pulsing orange dot and a \"press Esc to cancel\" hint for the duration. Third, plain Esc (keycode 53, no modifiers) is hard-wired as a cancel key at InputGuard.swift:345, cancels anywhere on the OS, and writes /tmp/macos-use/esc_pressed.txt as a ground-truth marker. You can always verify the cancel landed.",
  },
  {
    q: "What does the server return after sending a Slack message?",
    a: "A compact text summary (built at main.swift:731) plus a pair of files on disk under /tmp/macos-use/. The .txt file is the flat accessibility tree of Slack after the Return was pressed; each line is `[AXRole] \"text\" x:N y:N w:W h:H visible`. The .png file is a screenshot of the Slack window, produced by a sibling binary called screenshot-helper so that ReplayKit's persistent ~19% CPU cost dies with the subprocess (Sources/MCPServer/main.swift:435-510). The client uses grep on the .txt to confirm the message now appears in the channel and optionally reads the .png to eyeball the result.",
  },
  {
    q: "How does it pick between two open Slack workspaces?",
    a: "macOS runs each signed-in Slack workspace as a separate window inside one Slack.app process, not as separate processes. macos-use's window matcher at main.swift:393-425 gets every on-screen window owned by the Slack PID, filters to layer 0, and if a traversalWindowBounds was captured (typically from an open_application_and_traverse call that activated the intended workspace), scores each candidate by intersection overlap and picks the highest-scoring window. Practically, the way to disambiguate is to open the target workspace first with Cmd-Option-1/2/3, then call open_application_and_traverse, then send the message. Overlap scoring does the rest.",
  },
  {
    q: "Can it search old Slack messages the way the official MCP can?",
    a: "Only what is visible in the Slack UI. macos-use does not call search.messages. To read past messages, the model scrolls the message list (macos-use_scroll_and_traverse), reads the resulting accessibility tree from /tmp/macos-use/<timestamp>_scroll.txt, and greps for the phrase. This is fast for recent history but becomes slower than the REST API for deep search. For a cross-workspace full-history index, use Slack's official MCP. For single-workspace interactive use where you do not have or want an API token, the desktop approach is more than enough.",
  },
  {
    q: "Does it work on Slack for Enterprise Grid or GovSlack?",
    a: "Yes. Both. macos-use sees Slack.app as a normal macOS accessibility tree. There is no HTTP path that an admin could block. The Enterprise Grid workspace picker, the per-org DM lists, the connected-workspace channels all render through the same AXUIElement hierarchy the OS exposes for any signed-in workspace. The official MCP at docs.slack.dev/ai/slack-mcp-server explicitly requires admin enablement per workspace; macos-use inherits whatever permissions the human user already has in Slack.",
  },
  {
    q: "What happens if Slack is not running when the tool is called?",
    a: "Call macos-use_open_application_and_traverse with bundleId com.tinyspeck.slackmacgap (or name \"Slack\") first. The server activates the app, waits 500ms for it to become frontmost, captures the initial accessibility tree and screenshot, and returns the PID you will use for the following click_and_traverse. If the app is already running, the open call just activates it and re-reads the tree; it is idempotent. After the open, the model has a PID and a baseline, and the next call can do the compose-and-send chain in one request.",
  },
  {
    q: "What about multi-line messages with Shift-Return?",
    a: "Use the `text` parameter for the body, then pressKey. The type path at main.swift posts CGEvent keystrokes with .hidSystemState so InputGuard lets them through (main.swift:1709-1733). Newlines inside `text` are typed as raw newline keystrokes, which Slack interprets as Shift-Enter because Slack's compose field is in rich-text mode and Return is the send key. If you want a truly multi-line draft, pass the body with embedded \\n characters and pressKey=\"Return\" at the end. The composed path waits 100ms between actions so Slack's React input has time to reconcile.",
  },
  {
    q: "Is there anything that distinguishes this repo from a generic macOS AX wrapper?",
    a: "Two things specifically. First, the Slack example literally lives in the server's MCP instructions string at main.swift:1424, so every MCP client that connects is told about Slack by name. Second, the combined click + type + pressKey contract at main.swift:1709-1741 means a Slack send is one JSON-RPC round trip, not three. A naive wrapper would expose separate click, type, and keypress tools and leave the orchestration to the model; macos-use teaches the model to chain them, then enforces the chain on the server side with per-step InputGuard checks and a shared pid_t traversal context.",
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

const instructionsCode = `// Sources/MCPServer/main.swift:1411-1437
// The 'instructions' field on the Server constructor is a string
// that ships to every MCP client (Claude Desktop, Cursor, VS Code)
// on initialize. Slack is the only named app in it.

let server = Server(
    name: "SwiftMacOSServerDirect",
    version: "1.6.0",
    instructions: """
    Every tool call returns a compact text summary. Key fields:
    - file: path to the full accessibility tree (.txt)
    - screenshot: path to a PNG of the target window
    - visible_elements: sample with coordinates

    CRITICAL — Minimize tool calls by chaining actions:
    - click_and_traverse supports \`text\` and \`pressKey\` params to
      click, type, AND press a key — all in ONE call.
    - Example: to type into a Slack message box and send it,
      use ONE click_and_traverse call with
          element=\"Message to X\",
          text=\"hello\",
          pressKey=\"Return\"
      — do NOT split into separate click, type, and press calls.
    - type_and_traverse also supports \`pressKey\` to type and press
      in ONE call.
    - ALWAYS prefer a single combined call over multiple sequential
      calls.

    CRITICAL — Clicking elements:
    - NEVER estimate coordinates visually from screenshots.
      Screenshot pixel positions do NOT match screen coordinates.
    - ALWAYS get coordinates from the accessibility tree (.txt) or
      use the \`element\` param for text-based search.
    - Each line: [Role] \"text\" x:N y:N w:W h:H visible
    - Pass these x, y, w, h values; the tool auto-centers at
      (x+w/2, y+h/2).
    """,
    capabilities: .init(tools: .init(listChanged: true))
)`;

const composedPathCode = `// Sources/MCPServer/main.swift:1709-1741
// The composed click → type → press chain. One JSON-RPC request,
// one InputGuard engage, three OS-level effects, one final tree.

// Step 1: primary click. No traversal after; we'll do one final one.
var primaryOpts = options
primaryOpts.traverseAfter = false
primaryOpts.showDiff = false
let primaryResult = await Task { @MainActor in
    return await performAction(action: primaryAction,
                               optionsInput: primaryOpts)
}.value
if isDisruptive { try InputGuard.shared.throwIfCancelled() }

// Step 2: the extra actions (type "hello", pressKey "Return").
// 100ms between steps gives Slack's React input time to reconcile.
var minOpts = ActionOptions(showAnimation: false)
minOpts.pidForTraversal = options.pidForTraversal
for additionalAction in additionalActions {
    try? await Task.sleep(nanoseconds: 100_000_000)
    if isDisruptive { try InputGuard.shared.throwIfCancelled() }
    _ = await Task { @MainActor in
        return await performAction(
            action: .input(action: additionalAction),
            optionsInput: minOpts)
    }.value
}
if isDisruptive { try InputGuard.shared.throwIfCancelled() }

// Step 3: final traversal captures the "after" tree with the new
// message in the channel. Returned to the client as a file path.
var finalOpts = ActionOptions(traverseAfter: true, showAnimation: false)
finalOpts.pidForTraversal = options.pidForTraversal
let finalResult = await Task { @MainActor in
    return await performAction(action: .traverseOnly,
                               optionsInput: finalOpts)
}.value`;

const jsonRpcCode = `// The single JSON-RPC request the AI client sends to send a Slack
// message. Read over stdio by mcp-server-macos-use as a child
// process of Claude Desktop / Cursor / VS Code. No HTTP, no port.

{
  "jsonrpc": "2.0",
  "id": 17,
  "method": "callTool",
  "params": {
    "name": "macos-use_click_and_traverse",
    "arguments": {
      "pid": 4381,
      "element": "Message to standups",
      "text": "standup in 5 min, room 3A",
      "pressKey": "Return"
    }
  }
}`;

const terminalLines = [
  { type: "command" as const, text: "# One JSON-RPC call from Claude Desktop, three OS-level effects on Slack.app." },
  { type: "command" as const, text: "# stderr log from the mcp-server-macos-use child process:" },
  { type: "output" as const, text: "log: handler(CallTool): received request for tool: macos-use_click_and_traverse" },
  { type: "output" as const, text: "log: handler(CallTool): composed mode — 2 additional action(s) after primary." },
  { type: "output" as const, text: "log: InputGuard: engaging — AI: Clicking in Slack… — press Esc to cancel" },
  { type: "output" as const, text: "log: click_and_traverse: element='Message to standups' matched AXTextArea x:412 y:1034 w:1180 h:40" },
  { type: "output" as const, text: "log: click_and_traverse: centering at (1002, 1054)" },
  { type: "output" as const, text: "log: handler(CallTool): composed — primary action done." },
  { type: "output" as const, text: "log: handler(CallTool): composed — additional action type('standup in 5 min, room 3A') done." },
  { type: "output" as const, text: "log: handler(CallTool): composed — additional action pressKey('Return') done." },
  { type: "output" as const, text: "log: handler(CallTool): composed — final traversal done." },
  { type: "output" as const, text: "log: InputGuard: disengaging" },
  { type: "success" as const, text: "# The compact summary returned to the client over stdio:" },
  { type: "output" as const, text: "status: ok" },
  { type: "output" as const, text: "pid: 4381" },
  { type: "output" as const, text: "app: Slack" },
  { type: "output" as const, text: "file: /tmp/macos-use/1745001842_click_and_traverse.txt" },
  { type: "output" as const, text: "screenshot: /tmp/macos-use/1745001842_click_and_traverse.png" },
  { type: "output" as const, text: "visible_elements: 412 elements (grep the file for specific matches)" },
  { type: "command" as const, text: "# Verify the message actually landed in the channel:" },
  { type: "command" as const, text: "grep -n 'standup in 5 min, room 3A' /tmp/macos-use/1745001842_click_and_traverse.txt" },
  { type: "output" as const, text: "318: [AXStaticText] \"standup in 5 min, room 3A\" x:480 y:612 w:340 h:20 visible" },
  { type: "success" as const, text: "# The line appears in the message list portion of the tree. Sent." },
];

const sendMessageSteps = [
  {
    title: "Client serializes callTool over stdio",
    description:
      "Claude Desktop writes one newline-delimited JSON-RPC frame to the server's stdin. method = callTool, name = macos-use_click_and_traverse, arguments contain pid, element substring, text body, and pressKey.",
  },
  {
    title: "Server engages InputGuard, saves cursor and frontmost app",
    description:
      "main.swift:1672-1682 saves the current NSWorkspace frontmostApplication and CGEvent.mouseCursorPosition. InputGuard.shared.engage() installs a .cghidEventTap (InputGuard.swift:113) that blocks 11 hardware event types from the human until the tool returns.",
  },
  {
    title: "Element matcher walks Slack's accessibility tree",
    description:
      "main.swift:1054 walks the AXUIElement tree of PID 4381. It matches any element whose AX text, description, or label contains \"Message to standups\". Slack renders the compose field as an AXTextArea with that exact label, so one match, one set of (x, y, w, h).",
  },
  {
    title: "CGEvent.post fires a synthetic click at the center",
    description:
      "main.swift:1574 computes (x + w/2, y + h/2) = (1002, 1054). CGEvent.post(tap: .cghidEventTap) sends mouseDown + mouseUp with .hidSystemState source (non-zero sourceStateID), so the tap callback at InputGuard.swift:329 lets it through while still blocking the human.",
  },
  {
    title: "Type path posts keystrokes, then Return",
    description:
      "The composed chain at main.swift:1726-1733 sleeps 100ms, posts each character of \"standup in 5 min, room 3A\" as synthetic keyDown + keyUp pairs, sleeps 100ms, posts Return. Slack's React compose handler sees native key events indistinguishable from a real user typing.",
  },
  {
    title: "Final traversal captures the new message in the tree",
    description:
      "main.swift:1737-1741 runs a fresh traverseAccessibilityTree on Slack's PID. The new AXStaticText line containing the message body now appears in the scrollable message list. The tree is written to /tmp/macos-use/<ts>_click_and_traverse.txt.",
  },
  {
    title: "Screenshot subprocess snaps the Slack window",
    description:
      "main.swift:435-510 spawns the sibling `screenshot-helper` binary with the Slack window bounds and an optional (1002, 1054) crosshair. The helper writes the PNG and exits; ReplayKit dies with the subprocess instead of spinning at 19% CPU in the long-lived server.",
  },
  {
    title: "InputGuard disengages, cursor and frontmost app are restored",
    description:
      "The 11-event tap is torn down at InputGuard.swift:109. The saved cursor position is re-posted via CGEvent mouseMoved. If Slack was not originally frontmost, prevApp.activate([]) returns focus to whatever app the human was in. The compact summary is serialized and written to stdout.",
  },
];

const competitors: { name: string; kind: string }[] = [
  { name: "Slack Official MCP", kind: "hosted REST API wrapper" },
  { name: "korotovsky/slack-mcp-server", kind: "self-hosted REST API wrapper" },
  { name: "Workato Slack MCP", kind: "iPaaS / REST" },
  { name: "PulseMCP Slack", kind: "directory listing of REST wrappers" },
  { name: "apidog guide", kind: "REST tutorial" },
  { name: "mcp.so/server/slack", kind: "REST directory" },
  { name: "macos-use", kind: "accessibility tree, no REST" },
];

export default function SlackMcpServerPage() {
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
                Guide
              </span>
              <span className="inline-block bg-zinc-100 text-zinc-600 text-xs font-medium px-2 py-1 rounded-full">
                Slack &middot; macOS &middot; accessibility
              </span>
              <span className="inline-block bg-cyan-50 text-cyan-700 text-xs font-medium px-2 py-1 rounded-full font-mono">
                main.swift:1424
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 mb-6">
              The Slack MCP Server{" "}
              <GradientText>Without An OAuth Token</GradientText>: Driving The
              Desktop App Instead Of The API
            </h1>
            <p className="text-lg text-zinc-500 max-w-2xl mb-6">
              Every single result on the first page of Google for &quot;slack
              mcp server&quot; is an API wrapper: Slack&apos;s official server,
              korotovsky/slack-mcp-server, Workato, PulseMCP, apidog, mcp.so.
              They all call <span className="font-mono text-sm">search.messages</span> and{" "}
              <span className="font-mono text-sm">chat.postMessage</span> and
              they all need an admin to approve an OAuth app in Workspace
              Settings. macos-use is the one that never touches Slack&apos;s
              API. It drives the macOS Slack desktop app through the
              accessibility tree, and the server literally ships a
              Slack-specific usage example baked into{" "}
              <span className="font-mono text-sm">
                Sources/MCPServer/main.swift:1424
              </span>{" "}
              that gets sent to Claude Desktop on every initialize handshake.
            </p>
            <ArticleMeta
              datePublished={DATE_PUBLISHED}
              author="macos-use maintainers"
              readingTime="10 min read"
            />
            <div className="mt-8 flex gap-4 flex-wrap">
              <ShimmerButton href="https://github.com/mediar-ai/mcp-server-macos-use">
                Clone mcp-server-macos-use
              </ShimmerButton>
              <a
                href="https://github.com/mediar-ai/mcp-server-macos-use/blob/main/Sources/MCPServer/main.swift#L1424"
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-zinc-200 bg-white text-zinc-700 text-sm font-medium hover:border-teal-300 hover:text-teal-700 transition-colors"
              >
                View the line on GitHub
              </a>
            </div>
          </div>
        </BackgroundGrid>

        <ProofBand
          rating={5.0}
          ratingCount="open source"
          highlights={[
            "Zero OAuth tokens, zero REST calls, zero admin approvals",
            "One JSON-RPC request becomes click + type + Return inside Slack.app",
            "Works on Enterprise Grid and GovSlack because there is no HTTP path to block",
          ]}
        />

        <section className="max-w-4xl mx-auto px-6 py-16">
          <RemotionClip
            title="A Slack MCP server that never calls Slack's API"
            subtitle="The SERP is full of REST wrappers. This one drives the desktop app."
            captions={[
              "No OAuth token, no chat.postMessage, no admin approval",
              "Slack.app is just another macOS accessibility tree",
              "The Slack example is baked into main.swift:1424",
              "One JSON-RPC call becomes click + type + Return",
              "Works wherever you are already signed in on your Mac",
            ]}
            accent="teal"
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            The SERP Is Unanimous. It Is Also Only One Half Of The Answer.
          </h2>
          <p className="text-zinc-600 mb-4">
            Search for &quot;slack mcp server&quot; and every result on the
            first page describes the same architecture. A server process holds
            a Slack OAuth token, exposes MCP tools named{" "}
            <span className="font-mono text-sm">slack_search_messages</span> and{" "}
            <span className="font-mono text-sm">slack_post_message</span>, and
            translates those tool calls into HTTPS requests against{" "}
            <span className="font-mono text-sm">slack.com/api/</span>. It is a
            fine architecture. It has one structural cost: the Slack admin has
            to enable MCP for your workspace and approve the app. On
            Enterprise Grid and GovSlack, and on any corporate workspace where
            IT has not gotten around to it yet, that gate is shut.
          </p>
          <p className="text-zinc-600 mb-4">
            There is a second way to build a Slack MCP server that nobody on
            the first page mentions. You can drive the Slack desktop app the
            same way a human driver does. On macOS, every app exposes an
            accessibility tree. Slack&apos;s tree has a searchable element
            labeled <span className="font-mono text-sm">&quot;Message to &lt;channel&gt;&quot;</span>{" "}
            on the compose field. If you can find that element, click it, type
            into it, and press Return, you have sent a message. No token, no
            rate limit, no app review.
          </p>
          <p className="text-zinc-600">
            macos-use is the second way. This guide is about the six-line
            shape of what it actually does when the model sends a Slack
            message, and the one exact line in{" "}
            <span className="font-mono text-sm">main.swift</span> that makes
            the model know to do it that way.
          </p>
        </section>

        <section className="bg-zinc-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-zinc-900 mb-6">
              Two Architectures For The Same Tool Name
            </h2>
            <p className="text-zinc-600 mb-8 max-w-2xl">
              The tool the AI client sees is similar enough that you can swap
              between them. The mechanism underneath is completely different.
              Here is the flip.
            </p>
            <BeforeAfter
              title="Slack MCP server: API-based vs. desktop-driven"
              before={{
                label: "API-based (every top SERP result)",
                content:
                  "A hosted or self-hosted HTTP server holds an OAuth token for your workspace and calls Slack's REST API on the model's behalf. chat.postMessage for sending, search.messages for reading. Everything flows over HTTPS.",
                highlights: [
                  "Admin has to approve the MCP integration in Workspace Settings",
                  "OAuth token with scopes: chat:write, search:read, channels:read",
                  "Rate limits apply (Tier 3 = 50+ req/min)",
                  "Does not work on workspaces where admin has not enabled MCP",
                  "Search covers the full history, not just what is on screen",
                ],
              }}
              after={{
                label: "Desktop-driven (macos-use)",
                content:
                  "A local Swift binary runs as a child process of the AI client. One JSON-RPC call clicks the compose field, types the body, and presses Return inside the running Slack.app. No HTTP leaves your machine.",
                highlights: [
                  "No OAuth token; inherits whatever you can do in Slack manually",
                  "No admin approval; works on Enterprise Grid and GovSlack",
                  "No rate limit; limited only by UI reactivity (about 100ms per step)",
                  "Only works on the Mac where the MCP client runs, while Slack is open",
                  "Reads only what is visible (scroll to load more)",
                ],
              }}
            />
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-6 py-16">
          <span className="inline-block bg-cyan-50 text-cyan-700 text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full mb-4">
            Anchor fact 1 of 2
          </span>
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            The Slack Example Is Inside The Server&apos;s Own Instructions
            String
          </h2>
          <p className="text-zinc-600 mb-6 max-w-2xl">
            On the MCP spec, an <span className="font-mono text-sm">instructions</span>{" "}
            field on the <span className="font-mono text-sm">Server</span>{" "}
            constructor is optional guidance that clients ship to the model.
            macos-use uses it to teach the model one specific thing: how to
            compose actions. The only per-app example in the entire block is
            Slack. Clone the repo,{" "}
            <span className="font-mono text-sm">grep -n &quot;Slack message box&quot; Sources/</span>
            , and you get exactly one hit at main.swift:1424. That sentence is
            the training signal the server hands every MCP client on connect.
          </p>
          <AnimatedCodeBlock
            code={instructionsCode}
            language="swift"
            filename="Sources/MCPServer/main.swift:1411-1437"
          />
        </section>

        <section className="bg-zinc-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-zinc-900 mb-6">
              Other MCP Servers Named &quot;slack&quot;, Grouped By What They
              Actually Do
            </h2>
            <p className="text-zinc-600 mb-4 max-w-2xl">
              Six of the seven results on the first Google page describe the
              same class of server. Here they are in a row.
            </p>
            <Marquee speed={40} fade>
              {competitors.map((c) => (
                <div
                  key={c.name}
                  className="mx-3 inline-flex flex-col items-start justify-center rounded-xl border border-zinc-200 bg-white px-5 py-4 min-w-[220px] shadow-sm"
                >
                  <span className="text-sm font-semibold text-zinc-900">
                    {c.name}
                  </span>
                  <span className="text-xs text-zinc-500 mt-1">{c.kind}</span>
                </div>
              ))}
            </Marquee>
            <p className="text-zinc-500 text-sm mt-4 max-w-2xl">
              Six of seven sit on the REST API. One sits on the accessibility
              tree.
            </p>
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            What One JSON-RPC Request Becomes Inside The Server
          </h2>
          <p className="text-zinc-600 mb-8 max-w-2xl">
            The sequence below is the full client-server-app exchange for
            sending one Slack message. The client sends one{" "}
            <span className="font-mono text-sm">callTool</span>; the server
            turns it into three OS-level effects and one final traversal. The
            AI model never sees the intermediate state, which is why the
            server is responsible for orchestrating the chain, not the client.
          </p>
          <SequenceDiagram
            title="One callTool → click + type + Return in Slack.app"
            actors={["AI Client", "mcp-server-macos-use", "Slack.app", "disk"]}
            messages={[
              { from: 0, to: 1, label: "callTool(click_and_traverse)", type: "request" },
              { from: 1, to: 1, label: "InputGuard.engage() blocks human input", type: "event" },
              { from: 1, to: 2, label: "find AXTextArea 'Message to standups'", type: "request" },
              { from: 2, to: 1, label: "x:412 y:1034 w:1180 h:40", type: "response" },
              { from: 1, to: 2, label: "CGEvent click at (1002, 1054)", type: "event" },
              { from: 1, to: 2, label: "type 'standup in 5 min…' keystrokes", type: "event" },
              { from: 1, to: 2, label: "pressKey Return", type: "event" },
              { from: 1, to: 2, label: "traverse AX tree again", type: "request" },
              { from: 2, to: 1, label: "412 elements incl. new message", type: "response" },
              { from: 1, to: 3, label: "write <ts>_click_and_traverse.txt + .png", type: "event" },
              { from: 1, to: 1, label: "InputGuard.disengage(), cursor restored", type: "event" },
              { from: 1, to: 0, label: "compact summary (file, screenshot, status)", type: "response" },
            ]}
          />
        </section>

        <section className="bg-zinc-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-zinc-900 mb-6">
              Where Each Hop Goes
            </h2>
            <p className="text-zinc-600 mb-8 max-w-2xl">
              AnimatedBeam view of the same exchange. The AI client on the
              left writes one request. macos-use in the middle does the
              orchestration. Slack.app on the right receives three synthetic
              events, exactly as if a human had clicked, typed, and pressed
              Return.
            </p>
            <AnimatedBeam
              title="client → server → Slack.app, one round trip"
              from={[
                { label: "Claude Desktop", sublabel: "callTool" },
                { label: "Cursor", sublabel: "callTool" },
                { label: "VS Code MCP", sublabel: "callTool" },
              ]}
              hub={{
                label: "mcp-server-macos-use",
                sublabel: "main.swift:1424",
              }}
              to={[
                { label: "Slack compose", sublabel: "AXTextArea" },
                { label: "Keystrokes", sublabel: "CGEvent.post" },
                { label: "Return", sublabel: "send" },
                { label: "AX tree + PNG", sublabel: "/tmp/macos-use/" },
              ]}
            />
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            The Numbers You Can Reproduce From The Current Commit
          </h2>
          <p className="text-zinc-600 mb-8 max-w-2xl">
            Clone{" "}
            <span className="font-mono text-sm">
              github.com/mediar-ai/mcp-server-macos-use
            </span>
            , run <span className="font-mono text-sm">wc -l</span> and{" "}
            <span className="font-mono text-sm">grep -c</span> against the
            files, and these numbers fall out. Nothing is tuned at runtime.
          </p>
          <MetricsRow
            metrics={[
              { value: 1, label: "line where the Slack example lives (main.swift:1424)" },
              { value: 6, label: "MCP tools exposed over JSON-RPC" },
              { value: 11, label: "hardware event types blocked during a send" },
              { value: 100, suffix: "ms", label: "sleep between click → type → Return" },
            ]}
          />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mt-8">
            <GlowCard>
              <div className="p-6">
                <div className="text-4xl font-bold text-zinc-900">
                  <NumberTicker value={0} />
                </div>
                <div className="text-sm text-zinc-500 mt-2">
                  OAuth tokens required to send a Slack message
                </div>
              </div>
            </GlowCard>
            <GlowCard>
              <div className="p-6">
                <div className="text-4xl font-bold text-zinc-900">
                  <NumberTicker value={1} />
                </div>
                <div className="text-sm text-zinc-500 mt-2">
                  JSON-RPC callTool request per message sent
                </div>
              </div>
            </GlowCard>
            <GlowCard>
              <div className="p-6">
                <div className="text-4xl font-bold text-zinc-900">
                  <NumberTicker value={3} />
                </div>
                <div className="text-sm text-zinc-500 mt-2">
                  OS-level effects: click, type, Return
                </div>
              </div>
            </GlowCard>
            <GlowCard>
              <div className="p-6">
                <div className="text-4xl font-bold text-zinc-900">
                  <NumberTicker value={53} />
                </div>
                <div className="text-sm text-zinc-500 mt-2">
                  keycode for Esc (the universal cancel)
                </div>
              </div>
            </GlowCard>
            <GlowCard>
              <div className="p-6">
                <div className="text-4xl font-bold text-zinc-900">
                  <NumberTicker value={30} />
                </div>
                <div className="text-sm text-zinc-500 mt-2">
                  seconds before the InputGuard watchdog auto-releases
                </div>
              </div>
            </GlowCard>
            <GlowCard>
              <div className="p-6">
                <div className="text-4xl font-bold text-zinc-900">
                  <NumberTicker value={1917} />
                </div>
                <div className="text-sm text-zinc-500 mt-2">
                  total lines in Sources/MCPServer/main.swift
                </div>
              </div>
            </GlowCard>
          </div>
        </section>

        <section className="bg-zinc-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <span className="inline-block bg-cyan-50 text-cyan-700 text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full mb-4">
              Anchor fact 2 of 2
            </span>
            <h2 className="text-3xl font-bold text-zinc-900 mb-4">
              One Request On The Wire, Three Effects Inside Slack
            </h2>
            <p className="text-zinc-600 mb-6 max-w-2xl">
              The JSON-RPC payload below is the verbatim shape of what the AI
              client sends. The Swift block underneath is the code path at{" "}
              <span className="font-mono text-sm">main.swift:1709-1741</span>{" "}
              that splits it into three OS-level effects with an{" "}
              <span className="font-mono text-sm">InputGuard.throwIfCancelled</span>{" "}
              check at every boundary. If you press Esc between steps, the
              chain aborts cleanly and neither the type nor the Return has
              landed.
            </p>
            <AnimatedCodeBlock
              code={jsonRpcCode}
              language="json"
              filename="client → server, over stdio"
            />
            <div className="h-6" />
            <AnimatedCodeBlock
              code={composedPathCode}
              language="swift"
              filename="Sources/MCPServer/main.swift:1709-1741"
            />
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            Eight Stages From callTool To The Message In The Channel
          </h2>
          <p className="text-zinc-600 mb-8 max-w-2xl">
            Each step below is one line-range in the source. Nothing is
            abstract; everything is grepable.
          </p>
          <StepTimeline steps={sendMessageSteps} />
        </section>

        <section className="bg-zinc-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-zinc-900 mb-4">
              Watch One Send, End To End, In stderr
            </h2>
            <p className="text-zinc-600 mb-6 max-w-2xl">
              The server writes a step-by-step log line for every action. The
              grep at the end verifies the new message is actually in
              Slack&apos;s accessibility tree, not just assumed to be there.
            </p>
            <TerminalOutput
              title="One callTool → standup message lands in #standups"
              lines={terminalLines}
            />
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            Against The API-Based Slack MCP Servers
          </h2>
          <ComparisonTable
            productName="macos-use (desktop-driven)"
            competitorName="API-based Slack MCP servers"
            rows={[
              {
                feature: "Authentication",
                competitor: "OAuth token with scopes (chat:write, search:read, channels:read)",
                ours: "macOS Accessibility permission once, per your user",
              },
              {
                feature: "Needs admin approval",
                competitor: "Yes. Workspace admin enables MCP in Workspace Settings.",
                ours: "No. Inherits whatever you can do in Slack manually.",
              },
              {
                feature: "Works on Enterprise Grid / GovSlack without admin enablement",
                competitor: "No",
                ours: "Yes. There is no HTTP path an admin could block.",
              },
              {
                feature: "Rate limits",
                competitor: "Slack API tier limits (Tier 3 = 50+ req/min)",
                ours: "Only UI reactivity; ~100ms between steps is plenty",
              },
              {
                feature: "Search history depth",
                competitor: "Full indexed history via search.messages",
                ours: "Only what is visible; scroll to load more",
              },
              {
                feature: "Runs where",
                competitor: "Any HTTP host",
                ours: "Only the one Mac where Slack.app is signed in",
              },
              {
                feature: "Slack-specific code in the server",
                competitor: "Dozens of endpoint wrappers",
                ours: "One example line at main.swift:1424",
              },
              {
                feature: "What crosses the network",
                competitor: "Every tool call becomes HTTPS to slack.com/api/",
                ours: "Nothing. All events stay inside the one Mac.",
              },
            ]}
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <ProofBanner
            quote={`Example: to type into a Slack message box and send it, use ONE click_and_traverse call with element="Message to X", text="hello", pressKey="Return". Do NOT split into separate click, type, and press calls.`}
            source="Sources/MCPServer/main.swift:1424, inside the server's MCP instructions string"
            metric="1 line"
          />
        </section>

        <section className="bg-zinc-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-zinc-900 mb-6">
              Five Slack Things You Can Do Without A Token
            </h2>
            <p className="text-zinc-600 mb-6 max-w-2xl">
              Each of these is one MCP tool call against the running Slack
              desktop app. No per-action code. No per-channel config.
            </p>
            <BentoGrid
              cards={[
                {
                  title: "Send a message to a channel",
                  description:
                    "One click_and_traverse with element=\"Message to #channel\", text=body, pressKey=\"Return\". The line that tells the model to compose it this way is main.swift:1424.",
                  size: "2x1",
                  accent: true,
                },
                {
                  title: "Reply in a thread",
                  description:
                    "Click the message to open the thread pane, then click_and_traverse with element=\"Reply to\" and text, pressKey=\"Return\".",
                  size: "1x1",
                },
                {
                  title: "Add an emoji reaction",
                  description:
                    "click_and_traverse the message to hover, then click_and_traverse element=\"Add reaction\", then type the shortcode, Return.",
                  size: "1x1",
                },
                {
                  title: "Read the last 20 messages in a DM",
                  description:
                    "One refresh_traversal call dumps the visible AX tree. grep the /tmp/macos-use/<ts>.txt for AXStaticText lines.",
                  size: "1x1",
                },
                {
                  title: "Jump to a workspace with Cmd-Option-N",
                  description:
                    "press_key_and_traverse with keys=[\"cmd\",\"option\",\"1\"] switches to the first workspace and re-captures the tree.",
                  size: "1x1",
                },
                {
                  title: "Send to a new DM from quick switcher",
                  description:
                    "press Cmd-K, type the name, Return, then click_and_traverse element=\"Message to …\" with your body.",
                  size: "2x1",
                },
              ]}
            />
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            Try It On Your Own Machine
          </h2>
          <div className="rounded-2xl border border-teal-200 bg-white p-6 font-mono text-sm text-zinc-800 leading-relaxed overflow-x-auto whitespace-pre">
{`git clone https://github.com/mediar-ai/mcp-server-macos-use
cd mcp-server-macos-use
xcrun --toolchain com.apple.dt.toolchain.XcodeDefault swift build -c release

# Confirm the Slack-specific example is real, in one line:
grep -n "Slack message box" Sources/MCPServer/main.swift
# → 1424:        - Example: to type into a Slack message box and send it, …

# Point your MCP client at .build/release/mcp-server-macos-use
# Grant macOS Accessibility permission on first run.

# Open Slack. Ask the model: "send 'hi' to #random".
# Watch the compact summary and the tree file:
ls -lt /tmp/macos-use/ | head -3

# Confirm the message actually landed:
grep -n "hi" /tmp/macos-use/*_click_and_traverse.txt | tail -3`}
          </div>
        </section>

        <section className="bg-zinc-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-zinc-900 mb-6">
              Frequently Asked Questions
            </h2>
            <FaqSection items={faqItems} />
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <InlineCta
            heading="Read The One Line That Makes This A Slack Server Instead Of A Generic AX Wrapper"
            body="main.swift:1424 is a single sentence inside the server's MCP instructions. It is what every AI client sees on initialize. Forking that line is how you teach the server about a second app."
            linkText="Open main.swift:1424 on GitHub"
            href="https://github.com/mediar-ai/mcp-server-macos-use/blob/main/Sources/MCPServer/main.swift#L1424"
          />
        </section>
      </article>
    </>
  );
}
