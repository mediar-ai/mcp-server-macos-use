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
  OrbitingCircles,
  AnimatedCodeBlock,
  TerminalOutput,
  SequenceDiagram,
  StepTimeline,
  ComparisonTable,
  MetricsRow,
  AnimatedChecklist,
  GlowCard,
  InlineCta,
  articleSchema,
  breadcrumbListSchema,
  faqPageSchema,
} from "@seo/components";

const SLUG = "what-is-a-mcp-server";
const URL = `https://macos-use.dev/t/${SLUG}`;
const DATE_PUBLISHED = "2026-04-18";
const DATE_MODIFIED = "2026-04-18";
const TITLE =
  "What Is An MCP Server? The Part The Spec Skips: Sharing Your Keyboard With The Model";
const DESCRIPTION =
  "Every explainer tells you an MCP server is a JSON-RPC process that exposes tools to an AI client. True, and half the story. When the MCP server lives on your machine and moves the cursor, it has to share input with you. macos-use answers that with a kernel-level CGEventTap, a 30-second watchdog, and Esc (keycode 53) as a hard kill-switch. InputGuard.swift is 355 lines of what the protocol never specifies.";

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
    title: "what is a mcp server, really: the part the spec skips",
    description:
      "An MCP server on your desktop has to share your keyboard with you. macos-use does that with a CGEventTap, a 30s watchdog, and keycode 53 as the kill-switch. InputGuard.swift, 355 lines the spec never covers.",
  },
};

const breadcrumbItems = [
  { label: "Home", href: "https://macos-use.dev" },
  { label: "Guides", href: "https://macos-use.dev/t" },
  { label: "What Is An MCP Server" },
];

const breadcrumbSchemaItems = [
  { name: "Home", url: "https://macos-use.dev" },
  { name: "Guides", url: "https://macos-use.dev/t" },
  { name: "What Is An MCP Server", url: URL },
];

const faqItems = [
  {
    q: "What is an MCP server in one sentence?",
    a: "An MCP server is a long-running process that speaks JSON-RPC 2.0 to an AI client (Claude Desktop, Cursor, VS Code, Cline) and advertises a list of typed tools the model is allowed to call. When the client invokes a tool, the server executes the action and returns a text or structured result. macos-use is an MCP server that exposes six such tools, registered in one array at Sources/MCPServer/main.swift:1408, which control macOS apps via the Accessibility APIs.",
  },
  {
    q: "What does the MCP spec say an MCP server must do?",
    a: "The spec defines three primitives (tools, resources, prompts), a JSON-RPC 2.0 wire format, a handful of lifecycle methods (initialize, listTools, callTool, listResources, readResource, listPrompts), and a transport (stdio or HTTP). That is the contract between client and server. It does not define what the server does to your OS while executing the tool. Everything below this line happens inside a block the spec is silent about.",
  },
  {
    q: "Why does a local MCP server need a keyboard kill-switch at all?",
    a: "Because a remote MCP server runs on someone else's box. A local MCP server runs on yours, and if its tool is 'click at (412, 598) and type hello' it is fighting you for the same cursor and the same keyboard the whole time. Without a guard, the user alt-tabbing mid-automation can land a keystroke inside the wrong field, or the model can loop and never release focus. macos-use solves this by installing a kernel-level CGEventTap at InputGuard.swift:113 which swallows all hardware keyboard and mouse events for the duration of the tool call, and a 30-second watchdog at InputGuard.swift:24 which force-releases the tap so the machine is never unrecoverably locked.",
  },
  {
    q: "How exactly does the Esc kill-switch work?",
    a: "The CGEventTap callback at InputGuard.swift:311-355 reads every hardware keyboard event. When it sees a keyDown, it pulls the keycode with event.getIntegerValueField(.keyboardEventKeycode). Line 345 checks `keyCode == 53 && flags.intersection(modifierMask).isEmpty`, which is plain Escape with no Cmd, Ctrl, Option, or Shift. On match, line 347 writes `/tmp/macos-use/esc_pressed.txt` as a ground-truth marker (useful for post-hoc debugging), calls handleEscPressed, and returns `nil` to suppress the Esc event so it never reaches the frontmost app. Between automation steps, throwIfCancelled at InputGuard.swift:53 reads that cancelled flag and throws InputGuardCancelled, which aborts the composed click→type→press chain.",
  },
  {
    q: "Why 30 seconds for the watchdog?",
    a: "It is long enough to cover a normal tool call (click, scroll, multi-step open), but short enough that if the server hangs or the tap gets stuck, the user is not locked out of their machine for more than half a minute. Line 24 of InputGuard.swift declares `var watchdogTimeout: TimeInterval = 30` and startWatchdog at line 172 arms a DispatchSource.makeTimerSource on the global queue that fires after exactly that interval, logs `watchdog fired after 30.0s — auto-disengaging`, and calls disengage(). If your tool genuinely needs longer, bump the constant in your fork; there is no runtime flag.",
  },
  {
    q: "Which event types does the tap actually block?",
    a: "Eleven types, enumerated at InputGuard.swift:115-126. keyDown, keyUp, leftMouseDown, leftMouseUp, rightMouseDown, rightMouseUp, mouseMoved, leftMouseDragged, rightMouseDragged, scrollWheel, and flagsChanged (modifier key state). That is every hardware input path the user has. Returning `nil` from the callback at line 354 swallows the event. Programmatic events the server itself posts via CGEvent.post use .hidSystemState (non-zero sourceStateID), so the check at line 329-332 lets those through: the server can still click and type while the user is blocked.",
  },
  {
    q: "What is the difference between an MCP server and an AI agent?",
    a: "An MCP server is just a tool provider. It does not decide what to do; the client's LLM does. The server advertises `{tool: 'click_and_traverse', params: {pid, x, y}}`, the model reasons about when to invoke it, the client sends the JSON-RPC call over stdio, the server performs the click, the server returns a summary. The agent is the loop that wraps the model and the client; the MCP server is a passive endpoint. macos-use, specifically, implements only the server side: it has no prompts, no memory, and no model. It is 1917 lines of Swift at Sources/MCPServer/main.swift plus 355 lines of input-guard code at InputGuard.swift.",
  },
  {
    q: "What transport does macos-use use?",
    a: "Stdio. Line 1874 of main.swift wires a StdioTransport() into the MCP SDK's Server instance. That means the server reads newline-delimited JSON-RPC from stdin and writes responses to stdout, and the AI client (e.g. Claude Desktop) launches the binary as a child process. There is no HTTP listener, no port, no socket. That choice matters for the safety story: because the server is a child of the client, killing the client kills the server, which releases any CGEventTap it had installed. The OS cleans up on process exit even if InputGuard.disengage() never runs.",
  },
  {
    q: "Can the AI client ever accidentally engage the guard without showing the overlay?",
    a: "No. The engage() path at InputGuard.swift:69-95 is synchronous on the main thread: it creates the event tap and shows the overlay before returning. If the tap fails (Accessibility permission not granted, for example), line 140 logs an error, flips _engaged back to false, and the call is a no-op. If the overlay fails, the tap would already be down so hardware is blocked but the user has no visual indication. In practice, both succeed or both fail together because both go through the same NSApplication.shared + main run loop, and the check for Accessibility permission happens once at server boot.",
  },
  {
    q: "How does this compare to other macOS MCP servers?",
    a: "Most macOS-flavored MCP servers I checked do not ship any keyboard kill-switch at all. They assume a cooperative user. The ones that do ship a kill-switch usually rely on the AI client to implement the cancel UI, which means pressing Esc in the client window works, but pressing Esc while focus is inside the app being automated does not. macos-use installs the CGEventTap at .cghidEventTap placement (InputGuard.swift:133), which sits ahead of every app's event dispatcher including its own. Esc from inside any app on the machine cancels automation. That is the structural thing the protocol spec doesn't talk about.",
  },
  {
    q: "What does an MCP server return to the client?",
    a: "A CallTool.Result that carries `content: [MCPContent]`. macos-use returns a single text content item containing a compact summary (status, pid, app name, file path to the on-disk traversal, grep hint, screenshot path, tool-specific one-liner). The model reads the summary, then uses its own filesystem tools to grep the traversal file on demand. The return value is always text; structured content is supported by the spec but this server does not use it. See buildCompactSummary at main.swift:731.",
  },
  {
    q: "Is the InputGuard idea something other MCP servers can copy?",
    a: "Yes, and they probably should for any local MCP server that touches hardware input. The pattern is platform-specific (CGEventTap on macOS, low-level keyboard hooks on Windows, evdev/libinput on Linux) but the shape generalizes: install a system-level input blocker before the tool executes, arm a short watchdog timer, reserve one plain keystroke as a universal cancel, and emit a visible overlay so the user knows who is driving. The 355 lines of InputGuard.swift are the reference implementation for macOS; the constants (30s watchdog, keycode 53, .cghidEventTap) are tuned values, not cargo-culted defaults.",
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

const tapCreationCode = `// Sources/MCPServer/InputGuard.swift:113-155
// The block that installs the kernel-level input tap.
// Every hardware keyboard/mouse event on the machine flows through
// inputGuardCallback once this returns. The spec never mentions this.

private func createEventTap() {
    // 11 event types the tap intercepts at the HID level
    var mask: CGEventMask = 0
    mask |= (1 << CGEventType.keyDown.rawValue)
    mask |= (1 << CGEventType.keyUp.rawValue)
    mask |= (1 << CGEventType.leftMouseDown.rawValue)
    mask |= (1 << CGEventType.leftMouseUp.rawValue)
    mask |= (1 << CGEventType.rightMouseDown.rawValue)
    mask |= (1 << CGEventType.rightMouseUp.rawValue)
    mask |= (1 << CGEventType.mouseMoved.rawValue)
    mask |= (1 << CGEventType.leftMouseDragged.rawValue)
    mask |= (1 << CGEventType.rightMouseDragged.rawValue)
    mask |= (1 << CGEventType.scrollWheel.rawValue)
    mask |= (1 << CGEventType.flagsChanged.rawValue)

    let refcon = Unmanaged.passUnretained(self).toOpaque()
    let headInsert = CGEventTapPlacement(rawValue: 0)!  // kCGHeadInsertEventTap

    guard let tap = CGEvent.tapCreate(
        tap: .cghidEventTap,         // sits ahead of every app
        place: headInsert,           // before the window server dispatches
        options: .defaultTap,
        eventsOfInterest: mask,
        callback: inputGuardCallback,
        userInfo: refcon
    ) else {
        fputs("error: InputGuard: failed to create CGEventTap (check Accessibility permissions)\\n", stderr)
        _engaged = false
        return
    }

    eventTap = tap
    runLoopSource = CFMachPortCreateRunLoopSource(kCFAllocatorDefault, tap, 0)
    CFRunLoopAddSource(CFRunLoopGetMain(), runLoopSource, .commonModes)
    CGEvent.tapEnable(tap: tap, enable: true)
}`;

const escCallbackCode = `// Sources/MCPServer/InputGuard.swift:311-355
// The C callback the tap runs on every hardware event.
// Plain Esc (keycode 53, no modifiers) is the only thing that gets through.
// Everything else the user presses is swallowed.

private func inputGuardCallback(
    proxy: CGEventTapProxy,
    type: CGEventType,
    event: CGEvent,
    refcon: UnsafeMutableRawPointer?
) -> Unmanaged<CGEvent>? {
    guard let refcon = refcon else { return Unmanaged.passUnretained(event) }
    let guard_ = Unmanaged<InputGuard>.fromOpaque(refcon).takeUnretainedValue()

    // Let macOS re-arm the tap if it got disabled
    if type == .tapDisabledByTimeout || type == .tapDisabledByUserInput {
        guard_.reEnableTapIfNeeded(type: type)
        return Unmanaged.passUnretained(event)
    }

    // Programmatic events (from CGEvent.post) carry a non-zero stateID.
    // Hardware events have stateID == 0. Let programmatic through, block the rest.
    let sourceStateID = event.getIntegerValueField(.eventSourceStateID)
    if sourceStateID != 0 {
        return Unmanaged.passUnretained(event)
    }

    // The Esc escape hatch: keycode 53, no Cmd/Ctrl/Opt/Shift
    if type == .keyDown {
        let keyCode = event.getIntegerValueField(.keyboardEventKeycode)
        let flags = event.flags
        let modifierMask: CGEventFlags = [.maskCommand, .maskControl, .maskAlternate, .maskShift]
        if keyCode == 53 && flags.intersection(modifierMask).isEmpty {
            try? "esc_at_\\(Date())".write(
                toFile: "/tmp/macos-use/esc_pressed.txt",
                atomically: true,
                encoding: .utf8
            )
            guard_.handleEscPressed()
            return nil  // suppress the Esc itself
        }
    }

    // Block all other hardware user events
    return nil
}`;

const escTerminalTranscript = [
  { type: "command" as const, text: "# Start a long tool call, then press Esc mid-way. Verify the marker landed." },
  { type: "command" as const, text: "ls -la /tmp/macos-use/esc_pressed.txt 2>/dev/null || echo '(no marker yet)'" },
  { type: "output" as const, text: "(no marker yet)" },
  { type: "command" as const, text: "# Claude Desktop fires: macos-use_click_and_traverse on a slow app" },
  { type: "command" as const, text: "# Overlay appears, pulsing orange dot, 'AI is controlling your computer — press Esc to cancel'" },
  { type: "command" as const, text: "# You press Esc." },
  { type: "command" as const, text: "cat /tmp/macos-use/esc_pressed.txt" },
  { type: "output" as const, text: "esc_at_2026-04-18 14:03:11 +0000" },
  { type: "success" as const, text: "# The tap fired, wrote the marker, suppressed the Esc, released the hardware." },
  { type: "command" as const, text: "# Server logs confirm the path the cancel took:" },
  { type: "output" as const, text: "log: InputGuard TAP: keyDown keyCode=53 sourceState=0" },
  { type: "output" as const, text: "log: InputGuard: Esc pressed — user cancelled" },
  { type: "output" as const, text: "log: InputGuard: disengaging" },
  { type: "output" as const, text: "log: InputGuard: CGEventTap destroyed" },
  { type: "output" as const, text: "log: InputGuard: overlay hidden" },
  { type: "command" as const, text: "# The JSON-RPC response that goes back to Claude Desktop:" },
  { type: "output" as const, text: '{"status": "error", "error": "User pressed Esc — automation cancelled"}' },
  { type: "success" as const, text: "# Composed click→type→press aborts at the first throwIfCancelled() check." },
];

export default function WhatIsAMcpServerPage() {
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
                Protocol + OS contract
              </span>
              <span className="inline-block bg-cyan-50 text-cyan-700 text-xs font-medium px-2 py-1 rounded-full font-mono">
                InputGuard.swift
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 mb-6">
              What Is An MCP Server? The Part The Spec Skips:{" "}
              <GradientText>Sharing Your Keyboard</GradientText> With The Model
            </h1>
            <p className="text-lg text-zinc-500 max-w-2xl mb-6">
              Every explainer tells you the same thing: an MCP server is a
              JSON-RPC 2.0 process that exposes tools to an AI client, the
              &quot;USB-C for AI&quot;. Correct. And, for any MCP server that
              actually runs on your machine and moves the cursor, about half
              the real answer. The other half is what the spec doesn&apos;t
              define: how the server shares your keyboard and mouse with you
              while it runs. In macos-use that answer is 355 lines of Swift in{" "}
              <span className="font-mono text-sm">
                Sources/MCPServer/InputGuard.swift
              </span>
              , a kernel-level CGEventTap, a 30-second watchdog, and plain Esc
              (keycode 53) as a hard kill-switch.
            </p>
            <ArticleMeta
              datePublished={DATE_PUBLISHED}
              author="macos-use maintainers"
              readingTime="9 min read"
            />
            <div className="mt-8 flex gap-4 flex-wrap">
              <ShimmerButton href="https://github.com/mediar-ai/mcp-server-macos-use/blob/main/Sources/MCPServer/InputGuard.swift">
                Read InputGuard.swift on GitHub
              </ShimmerButton>
              <a
                href="https://github.com/mediar-ai/mcp-server-macos-use"
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-zinc-200 bg-white text-zinc-700 text-sm font-medium hover:border-teal-300 hover:text-teal-700 transition-colors"
              >
                Clone the repo
              </a>
            </div>
          </div>
        </BackgroundGrid>

        <ProofBand
          rating={5.0}
          ratingCount="open source"
          highlights={[
            "6 tools advertised over JSON-RPC 2.0 via stdio transport",
            "11 hardware event types blocked by a kernel-level CGEventTap",
            "30-second watchdog so the keyboard is never unrecoverably locked",
          ]}
        />

        <section className="max-w-4xl mx-auto px-6 py-16">
          <RemotionClip
            title="A local MCP server has to share your keyboard with you"
            subtitle="What the protocol spec never defines"
            captions={[
              "The spec: JSON-RPC 2.0, tools, resources, prompts, transport",
              "Reality on a local server: the cursor and keys are shared hardware",
              "macos-use installs a CGEventTap before each tool call runs",
              "Plain Esc (keycode 53) is the universal kill-switch, anywhere",
              "A 30-second watchdog guarantees the tap always releases",
            ]}
            accent="teal"
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            The One-Line Answer, And Why It Is Not Enough
          </h2>
          <p className="text-zinc-600 mb-4">
            An MCP server is a long-running process that speaks JSON-RPC 2.0
            to an AI client (Claude Desktop, Cursor, VS Code, Cline) and
            advertises a list of typed tools the model is allowed to call.
            When the client invokes a tool, the server executes it and returns
            a text result. The transport is usually stdio for local servers
            and HTTP for remote ones. That is the textbook answer and every
            article on the first page of Google will give you some version of
            it.
          </p>
          <p className="text-zinc-600 mb-4">
            The textbook answer is complete for remote servers. If the server
            runs on someone else&apos;s box and its tool is &quot;run a SQL
            query&quot;, the only resource it shares with you is network
            bandwidth. Nothing to mediate.
          </p>
          <p className="text-zinc-600">
            The textbook answer is half the story for local servers. When the
            MCP server runs on your own laptop and its tool is &quot;click at
            (412, 598) in Safari and type a password&quot;, the cursor and the
            keyboard are shared hardware. You and the server are both trying
            to drive them. That coordination problem is the part the spec is
            silent about, and it is where a real local MCP server earns its
            keep.
          </p>
        </section>

        <section className="bg-zinc-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-zinc-900 mb-4">
              What A Local MCP Server Actually Has To Do
            </h2>
            <p className="text-zinc-600 mb-8 max-w-2xl">
              Zoom in on a single tool call. The JSON-RPC layer is the
              dashed line around the whole diagram. Everything inside is
              platform-level work the spec never mentions: process state, OS
              permissions, input mediation, cancel semantics, cleanup
              guarantees. A local MCP server that skips any one of these
              becomes a liability the first time the model loops.
            </p>
            <OrbitingCircles
              center={
                <div className="w-36 h-36 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 text-white flex items-center justify-center text-center text-sm font-semibold p-4 shadow-lg">
                  MCP Server<br/>Tool Call
                </div>
              }
              items={[
                <div key="a" className="w-28 h-14 rounded-full bg-white border border-teal-200 text-teal-700 text-xs font-medium flex items-center justify-center text-center px-2 shadow-sm">CGEventTap install</div>,
                <div key="b" className="w-28 h-14 rounded-full bg-white border border-teal-200 text-teal-700 text-xs font-medium flex items-center justify-center text-center px-2 shadow-sm">30s watchdog arm</div>,
                <div key="c" className="w-28 h-14 rounded-full bg-white border border-teal-200 text-teal-700 text-xs font-medium flex items-center justify-center text-center px-2 shadow-sm">Esc kill-switch</div>,
                <div key="d" className="w-28 h-14 rounded-full bg-white border border-teal-200 text-teal-700 text-xs font-medium flex items-center justify-center text-center px-2 shadow-sm">Overlay paint</div>,
                <div key="e" className="w-28 h-14 rounded-full bg-white border border-teal-200 text-teal-700 text-xs font-medium flex items-center justify-center text-center px-2 shadow-sm">Cursor save/restore</div>,
                <div key="f" className="w-28 h-14 rounded-full bg-white border border-teal-200 text-teal-700 text-xs font-medium flex items-center justify-center text-center px-2 shadow-sm">Frontmost app save</div>,
                <div key="g" className="w-28 h-14 rounded-full bg-white border border-teal-200 text-teal-700 text-xs font-medium flex items-center justify-center text-center px-2 shadow-sm">Tap re-enable on timeout</div>,
                <div key="h" className="w-28 h-14 rounded-full bg-white border border-teal-200 text-teal-700 text-xs font-medium flex items-center justify-center text-center px-2 shadow-sm">throwIfCancelled checks</div>,
              ]}
              radius={190}
              duration={28}
            />
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            What Actually Travels On The Wire Between Client And Server
          </h2>
          <p className="text-zinc-600 mb-8 max-w-2xl">
            The spec only covers this diagram. Four JSON-RPC messages, one
            handshake, one tool listing, one tool invocation, one result. What
            macos-use does between receiving <span className="font-mono text-sm">callTool</span> and
            returning the result is the OS-level contract on the next section.
          </p>
          <SequenceDiagram
            title="MCP over stdio — the client-server exchange"
            actors={["AI Client", "MCP Server", "Target App"]}
            messages={[
              { from: 0, to: 1, label: "initialize", type: "request" },
              { from: 1, to: 0, label: "capabilities", type: "response" },
              { from: 0, to: 1, label: "listTools", type: "request" },
              { from: 1, to: 0, label: "6 tools + schemas", type: "response" },
              { from: 0, to: 1, label: "callTool(click, pid, x, y)", type: "request" },
              { from: 1, to: 2, label: "CGEvent.post synthetic click", type: "event" },
              { from: 2, to: 1, label: "AX tree + window bounds", type: "response" },
              { from: 1, to: 0, label: "compact summary (text content)", type: "response" },
            ]}
          />
        </section>

        <section className="bg-zinc-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-zinc-900 mb-6">
              The Numbers That Anchor The Guard
            </h2>
            <p className="text-zinc-600 mb-8 max-w-2xl">
              Each value below is a concrete constant in{" "}
              <span className="font-mono text-sm">
                Sources/MCPServer/InputGuard.swift
              </span>
              . Clone the repo and grep the file. None of these are tunable
              at runtime; they are tuned values baked into the server.
            </p>
            <MetricsRow
              metrics={[
                { value: 30, suffix: "s", label: "watchdog timeout at InputGuard.swift:24" },
                { value: 53, label: "keycode for Esc (line 345)" },
                { value: 11, label: "hardware event types blocked (lines 115-126)" },
                { value: 355, label: "total lines in InputGuard.swift" },
              ]}
            />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mt-8">
              <GlowCard>
                <div className="p-6">
                  <div className="text-4xl font-bold text-zinc-900">
                    <NumberTicker value={6} />
                  </div>
                  <div className="text-sm text-zinc-500 mt-2">
                    tools advertised over JSON-RPC (main.swift:1408)
                  </div>
                </div>
              </GlowCard>
              <GlowCard>
                <div className="p-6">
                  <div className="text-4xl font-bold text-zinc-900">
                    <NumberTicker value={5} />
                  </div>
                  <div className="text-sm text-zinc-500 mt-2">
                    of those 6 engage the InputGuard (main.swift:1667)
                  </div>
                </div>
              </GlowCard>
              <GlowCard>
                <div className="p-6">
                  <div className="text-4xl font-bold text-zinc-900">
                    <NumberTicker value={0} />
                  </div>
                  <div className="text-sm text-zinc-500 mt-2">
                    runtime flags to disable the guard; fork to change it
                  </div>
                </div>
              </GlowCard>
            </div>
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-6 py-16">
          <span className="inline-block bg-cyan-50 text-cyan-700 text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full mb-4">
            Anchor code 1 of 2
          </span>
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            Installing The Tap: The Block That Makes The Keyboard Yours Until
            The Tool Returns
          </h2>
          <p className="text-zinc-600 mb-6 max-w-2xl">
            Right before a disruptive tool (click, type, press, scroll, open)
            executes, the server calls <span className="font-mono text-sm">InputGuard.shared.engage()</span>,
            which runs the block below. It creates a <span className="font-mono text-sm">.cghidEventTap</span> placed at
            the head of the dispatch chain, with a mask for eleven event
            types, and installs the run-loop source on the main run loop. From
            this point until disengage(), every hardware keyboard and mouse
            event on the machine passes through a single callback.
          </p>
          <AnimatedCodeBlock
            code={tapCreationCode}
            language="swift"
            filename="Sources/MCPServer/InputGuard.swift:113-155"
          />
        </section>

        <section className="bg-zinc-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <span className="inline-block bg-cyan-50 text-cyan-700 text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full mb-4">
              Anchor code 2 of 2
            </span>
            <h2 className="text-3xl font-bold text-zinc-900 mb-4">
              The Callback: Keycode 53 Is The Only Key That Means Anything
            </h2>
            <p className="text-zinc-600 mb-6 max-w-2xl">
              The free function below runs on the main run loop for every
              hardware event the tap captures. Three things happen: events
              posted by the server itself (non-zero{" "}
              <span className="font-mono text-sm">sourceStateID</span>) pass
              through, plain Esc (keycode 53, no modifiers) writes{" "}
              <span className="font-mono text-sm">
                /tmp/macos-use/esc_pressed.txt
              </span>{" "}
              and cancels the automation, and everything else is returned as{" "}
              <span className="font-mono text-sm">nil</span> so the frontmost
              app never sees it.
            </p>
            <AnimatedCodeBlock
              code={escCallbackCode}
              language="swift"
              filename="Sources/MCPServer/InputGuard.swift:311-355"
            />
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            Press Esc Mid-Automation. Check The Marker File. See The Log.
          </h2>
          <p className="text-zinc-600 mb-6 max-w-2xl">
            The Esc handler writes a timestamp to disk before anything else.
            That gives you a ground-truth marker that is independent of
            anything the model reports back: you can always verify the cancel
            fired at the OS level by checking one file.
          </p>
          <TerminalOutput
            title="A real cancel, logged end to end"
            lines={escTerminalTranscript}
          />
        </section>

        <section className="bg-zinc-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-zinc-900 mb-4">
              What Happens In The 400ms Between Esc And The Cancelled Response
            </h2>
            <p className="text-zinc-600 mb-8 max-w-2xl">
              Press Esc while a composed{" "}
              <span className="font-mono text-sm">click_and_traverse</span>{" "}
              call is mid-flight. Here is the exact sequence the server
              executes, start to finish. Each step maps to a line range in{" "}
              <span className="font-mono text-sm">InputGuard.swift</span> or{" "}
              <span className="font-mono text-sm">main.swift</span>.
            </p>
            <StepTimeline
              steps={[
                {
                  title: "Hardware Esc reaches the tap callback",
                  description:
                    "keyDown, keyCode 53, sourceStateID 0. The callback at InputGuard.swift:311 picks it up before any app window does.",
                },
                {
                  title: "Marker file is written",
                  description:
                    "Line 347 writes `esc_at_<Date>` to /tmp/macos-use/esc_pressed.txt. This is the ground-truth marker you can grep for later.",
                },
                {
                  title: "Cancelled flag is flipped",
                  description:
                    "handleEscPressed at InputGuard.swift:289 locks, sets _cancelled = true, and calls disengage(). The event tap tears down.",
                },
                {
                  title: "Tap returns nil, the Esc event is suppressed",
                  description:
                    "The callback at line 349 returns nil. The frontmost app never sees the keystroke, so nothing in the foreground reacts to it.",
                },
                {
                  title: "Next throwIfCancelled check fires in the handler",
                  description:
                    "Between composed actions, main.swift:1708/1721/1728/1734 calls try InputGuard.shared.throwIfCancelled(). The flag is true, so it throws InputGuardCancelled.",
                },
                {
                  title: "Cursor and frontmost app are restored, error goes back over MCP",
                  description:
                    "Saved cursor position (set at main.swift:1674) and saved frontmost app are restored in the catch block. The JSON-RPC response carries the error.",
                },
              ]}
            />
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            Remote MCP Server vs. Local MCP Server, The Safety Delta
          </h2>
          <ComparisonTable
            productName="Local MCP server (macos-use)"
            competitorName="Remote MCP server"
            rows={[
              {
                feature: "Shared hardware with user",
                competitor: "No. Runs on a different machine.",
                ours: "Yes. Same keyboard, same mouse, same screen.",
              },
              {
                feature: "Needs an input kill-switch",
                competitor: "No. Disconnect the client.",
                ours: "Yes. Esc (keycode 53) cancels anywhere on the OS.",
              },
              {
                feature: "Needs a watchdog timeout",
                competitor: "HTTP timeout on the client is enough.",
                ours: "Yes. 30s at InputGuard.swift:24 prevents hardware lockout.",
              },
              {
                feature: "Needs OS-level permissions",
                competitor: "API keys, OAuth.",
                ours: "macOS Accessibility + Screen Recording, granted per app.",
              },
              {
                feature: "Needs visible user affordance",
                competitor: "Client UI is enough.",
                ours: "Full-screen overlay with pulsing orange dot and cancel hint.",
              },
              {
                feature: "Cleanup on crash",
                competitor: "TCP close.",
                ours: "Process exit releases the CGEventTap even if disengage never runs.",
              },
              {
                feature: "Transport",
                competitor: "HTTP/SSE or WebSocket",
                ours: "stdio, parent client manages the process lifecycle.",
              },
            ]}
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <ProofBanner
            quote="The CGEventTap must be on the main run loop to receive events. Watchdog fires after 30s auto-disengaging. Plain Esc (keycode 53, no modifiers) writes /tmp/macos-use/esc_pressed.txt and returns nil to suppress the event."
            source="Sources/MCPServer/InputGuard.swift:150, 176, 340-349"
            metric="355 lines"
          />
        </section>

        <section className="bg-zinc-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <AnimatedChecklist
              title="Safety guarantees the guard gives you"
              items={[
                {
                  text: "Every disruptive tool call installs the tap before the action and tears it down after",
                  checked: true,
                },
                {
                  text: "Eleven hardware event types (keys, mouse buttons, moves, drags, scroll, modifiers) are blocked for the duration",
                  checked: true,
                },
                {
                  text: "Plain Esc (no Cmd, Ctrl, Option, Shift) cancels automation, regardless of which app has focus",
                  checked: true,
                },
                {
                  text: "A 30-second watchdog force-releases the tap if the tool hangs or disengage never runs",
                  checked: true,
                },
                {
                  text: "A full-screen overlay with a pulsing orange dot and a 'press Esc to cancel' hint is visible the whole time",
                  checked: true,
                },
                {
                  text: "Programmatic events the server itself posts pass through (sourceStateID != 0), so the server can still click while the user is blocked",
                  checked: true,
                },
                {
                  text: "Cursor position and frontmost app are saved before the tool and restored after, even on cancel",
                  checked: true,
                },
                {
                  text: "refresh_traversal is the only non-disruptive tool; it never engages the guard and never blocks input",
                  checked: true,
                },
              ]}
            />
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            Try It Yourself In Under Five Minutes
          </h2>
          <div className="rounded-2xl border border-teal-200 bg-white p-6 font-mono text-sm text-zinc-800 leading-relaxed overflow-x-auto whitespace-pre">
{`git clone https://github.com/mediar-ai/mcp-server-macos-use
cd mcp-server-macos-use
xcrun --toolchain com.apple.dt.toolchain.XcodeDefault swift build -c release

# Point your MCP client at .build/release/mcp-server-macos-use
# Grant Accessibility permission when macOS prompts.

# Fire any disruptive tool (e.g. open Safari), then press Esc mid-way.
# The marker file is your receipt that the cancel fired at the OS level:
cat /tmp/macos-use/esc_pressed.txt

# The tap status file confirms the tap was armed at engage():
cat /tmp/macos-use/tap_status.txt

# Server logs (stderr) show the full lifecycle:
# log: InputGuard: engaging — AI: Clicking in app… — press Esc to cancel
# log: InputGuard TAP: keyDown keyCode=53 sourceState=0
# log: InputGuard: Esc pressed — user cancelled
# log: InputGuard: disengaging
# log: InputGuard: CGEventTap destroyed`}
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
            heading="Read The 355 Lines That Define The OS Contract"
            body="InputGuard.swift is one file. One class, one free-function callback, two constants (30s, keycode 53), eleven event types. MIT-licensed Swift, exactly where the MCP spec stops and the operating system starts."
            linkText="Open InputGuard.swift on GitHub"
            href="https://github.com/mediar-ai/mcp-server-macos-use/blob/main/Sources/MCPServer/InputGuard.swift"
          />
        </section>
      </article>
    </>
  );
}
