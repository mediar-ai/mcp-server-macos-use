import type { Metadata } from "next";
import {
  Breadcrumbs,
  ArticleMeta,
  ProofBand,
  FaqSection,
  RemotionClip,
  AnimatedBeam,
  BackgroundGrid,
  GradientText,
  ShimmerButton,
  NumberTicker,
  Marquee,
  AnimatedCodeBlock,
  TerminalOutput,
  StepTimeline,
  ComparisonTable,
  GlowCard,
  BentoGrid,
  AnimatedChecklist,
  ProofBanner,
  InlineCta,
  StickyBottomCta,
  SequenceDiagram,
  articleSchema,
  breadcrumbListSchema,
  faqPageSchema,
} from "@seo/components";

const SLUG = "macos-use";
const URL = `https://macos-use.dev/t/${SLUG}`;
const DATE_PUBLISHED = "2026-04-18";
const DATE_MODIFIED = "2026-04-18";
const TITLE =
  "macos-use: The CGEventTap Kill-Switch That Lets You Press Esc To Stop The AI Mid-Click";
const DESCRIPTION =
  "macos-use is a Swift MCP server that drives macOS apps through accessibility APIs. The part nobody else writes about: every disruptive tool call engages a CGEventTap that blocks your keyboard and mouse, shows a pulsing 'press Esc to cancel' overlay, and distinguishes the server's own CGEvent.post calls from your keystrokes using a single integer field. Walk through InputGuard.swift and the call sites at main.swift:1667-1764.";

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
    title: "macos-use: the Esc-to-cancel kill-switch, explained from source",
    description:
      "CGEventTap at head-insert, 30-second watchdog, stateID-based hardware filter. One Swift file, 355 lines.",
  },
};

const breadcrumbItems = [
  { label: "Home", href: "https://macos-use.dev" },
  { label: "Guides", href: "https://macos-use.dev/t" },
  { label: "macos-use" },
];

const breadcrumbSchemaItems = [
  { name: "Home", url: "https://macos-use.dev" },
  { name: "Guides", url: "https://macos-use.dev/t" },
  { name: "macos-use", url: URL },
];

const faqItems = [
  {
    q: "What is macos-use?",
    a: "macos-use (package name mcp-server-macos-use) is an open source Swift MCP server that lets any MCP client (Claude Desktop, Claude Code, Cursor, VS Code) drive any macOS app. It reads the accessibility tree via AXUIElement and posts input through CGEvent, and every disruptive tool call runs behind a CGEventTap kill-switch so you can abort mid-action with Esc. Repo: github.com/mediar-ai/mcp-server-macos-use. Homepage: macos-use.dev. It exposes six tools: open_application_and_traverse, click_and_traverse, type_and_traverse, press_key_and_traverse, scroll_and_traverse, and refresh_traversal.",
  },
  {
    q: "What does InputGuard actually do?",
    a: "InputGuard is a singleton defined in Sources/MCPServer/InputGuard.swift. When a disruptive tool call starts, it creates a CGEventTap at the .cghidEventTap location with head-insert placement, registers interest in key, mouse, scroll, drag, and modifier-change events, and throws away every hardware event that reaches it. At the same time it opens an NSWindow at .screenSaver level with a dark centered pill, a pulsing orange dot, and a message describing what the AI is doing. The tap and the overlay are torn down when the tool returns.",
  },
  {
    q: "How does it tell my keystrokes apart from the server's own CGEvent.post calls?",
    a: "One integer. At InputGuard.swift:329 the callback reads event.getIntegerValueField(.eventSourceStateID). The server's CGEvent.post calls use the .hidSystemState source, which carries a non-zero stateID. Real hardware events carry stateID == 0. The callback returns Unmanaged.passUnretained(event) when stateID is non-zero (programmatic, let through) and returns nil when stateID is zero (hardware, dropped). That is the whole mechanism; no per-event timestamp tracking, no sequence number matching.",
  },
  {
    q: "How does Esc-to-cancel actually work?",
    a: "The callback checks three things on every hardware keyDown: event type equals .keyDown, keycode equals 53 (plain Esc on US layout), and the event flags intersected with [.maskCommand, .maskControl, .maskAlternate, .maskShift] is empty. When all three are true it writes /tmp/macos-use/esc_pressed.txt as a verification marker, calls handleEscPressed() which flips the internal _cancelled flag and tears down the tap and the overlay, then returns nil to suppress the Esc event itself so it does not leak into whatever app has focus.",
  },
  {
    q: "What happens if the automation is mid-sequence when I hit Esc?",
    a: "Between every step of a composed action (primary click → additional type → additional press → final traversal), main.swift calls try InputGuard.shared.throwIfCancelled(). If _cancelled is true, throwIfCancelled throws InputGuardCancelled and the handler drops into a catch block that disengages the guard, restores the cursor to savedCursorPos, reactivates the previously frontmost NSRunningApplication, and returns an MCP error message reading 'Cancelled: user pressed Esc to abort <tool_name>'. The abort is checked at main.swift:1708, 1721, 1728, 1734, plus a final check at 1758 after a 200ms grace period.",
  },
  {
    q: "Why is there a 30-second watchdog?",
    a: "If something goes wrong upstream and the tool handler never calls disengage(), a stuck CGEventTap would lock the user out of their own machine. watchdogTimeout defaults to 30 on InputGuard.swift:24 and is wired up in startWatchdog(): a DispatchSource timer on a global queue fires once after 30 seconds and unconditionally calls disengage(). The log line 'InputGuard: watchdog fired after 30s — auto-disengaging' shows up in stderr when it trips. The watchdog is the reason you cannot permanently brick your machine with a misbehaving agent.",
  },
  {
    q: "Is refresh_traversal disruptive?",
    a: "No. main.swift:1667 sets `let isDisruptive = params.name != refreshTool.name`. Every other tool engages the guard and shows the overlay; refresh_traversal does not. This matches the semantics of the tool: refresh_traversal only reads the accessibility tree, it never posts a CGEvent, so there is nothing for the guard to protect against. Agents that want to plan a click without taking over the screen should use refresh_traversal first.",
  },
  {
    q: "What does the overlay look like?",
    a: "A borderless NSWindow the size of the main screen, at level .screenSaver, with a 15% black wash. Centered on screen is a dark pill min(720, screenWidth/2) wide and 80 tall, with corner radius 40. Inside the pill: a 16x16 orange dot at the left that pulses 1.0 → 0.3 opacity every 0.8s (autoreverses, infinite), and a single-line white semibold 20pt system-font label that reads 'AI: <action description> — press Esc to cancel'. collectionBehavior is [.canJoinAllSpaces, .fullScreenAuxiliary] so it follows you across Spaces and sits on top of fullscreen apps. ignoresMouseEvents is true so the overlay itself is passive.",
  },
  {
    q: "What if macOS auto-disables the tap?",
    a: "CGEventTaps can be auto-disabled by macOS when they run too long or when the user presses Secure Input-triggering keys. The callback handles two synthetic events: .tapDisabledByTimeout and .tapDisabledByUserInput. When either arrives, reEnableTapIfNeeded calls CGEvent.tapEnable(tap: tap, enable: true) and logs 're-enabled CGEventTap after system disabled it'. The kill-switch self-heals without the tool handler needing to know.",
  },
  {
    q: "How does the guard save and restore cursor + focus?",
    a: "Before engaging, main.swift:1671-1676 captures NSWorkspace.shared.frontmostApplication and the current NSEvent.mouseLocation (flipped to CG coordinates by subtracting from the primary screen height). After the tool returns, main.swift:1767 reposts a .mouseMoved CGEvent at savedCursorPos, and main.swift:1775-1781 compares the current frontmost PID to savedFrontmostApp.processIdentifier and calls prevApp.activate if they differ. On the Esc cancellation path the same restoration runs in the catch block at main.swift:1847-1860.",
  },
  {
    q: "Can I verify the Esc handler fired?",
    a: "Yes. When the callback suppresses an Esc keypress it writes /tmp/macos-use/esc_pressed.txt with contents like 'esc_at_2026-04-18 12:34:56 +0000'. throwIfCancelled also writes /tmp/macos-use/cancel_check.txt on every call. You can tail those files while driving the agent to prove the kill-switch is live. The same directory is where flat-text tool responses and PNG screenshots land, so nothing new to set up.",
  },
  {
    q: "How is this different from other macOS automation tools?",
    a: "AppleScript has no kill-switch — once you start an osascript command, your only option is to kill the process. Automator and Shortcuts can be stopped by clicking the stop button, which requires the mouse you may not have. Competing macOS MCP servers (mcp-remote-macos-use, CursorTouch/MacOS-MCP) also post CGEvents but do not engage a hardware-event blocking tap, do not show an overlay, and do not wire up a single-key abort. macos-use is the only one where pressing Esc mid-automation raises an error inside the server and unwinds cursor + focus cleanly.",
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

const tapCreateCode = `// Sources/MCPServer/InputGuard.swift:113-155
// The CGEventTap that blocks your keyboard and mouse during automation.

private func createEventTap() {
    // Build mask incrementally to avoid Swift type-checker timeout.
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

    // kCGHeadInsertEventTap = 0: first in the system event chain, before any app.
    let headInsert = CGEventTapPlacement(rawValue: 0)!
    guard let tap = CGEvent.tapCreate(
        tap: .cghidEventTap,          // HID stream, pre-delivery
        place: headInsert,
        options: .defaultTap,          // active: we can modify / drop events
        eventsOfInterest: mask,
        callback: inputGuardCallback,
        userInfo: refcon
    ) else {
        fputs("error: InputGuard: failed to create CGEventTap (check Accessibility permissions)\\n", stderr)
        // … mark not engaged and bail out …
        return
    }

    eventTap = tap
    runLoopSource = CFMachPortCreateRunLoopSource(kCFAllocatorDefault, tap, 0)
    CFRunLoopAddSource(CFRunLoopGetMain(), runLoopSource, .commonModes)
    CGEvent.tapEnable(tap: tap, enable: true)
}`;

const callbackCode = `// Sources/MCPServer/InputGuard.swift:311-355
// The whole filter. Three branches. Under 45 lines.

private func inputGuardCallback(
    proxy: CGEventTapProxy,
    type: CGEventType,
    event: CGEvent,
    refcon: UnsafeMutableRawPointer?
) -> Unmanaged<CGEvent>? {
    guard let refcon = refcon else { return Unmanaged.passUnretained(event) }
    let guard_ = Unmanaged<InputGuard>.fromOpaque(refcon).takeUnretainedValue()

    // Branch 1: macOS auto-disabled the tap — re-enable and pass through.
    if type == .tapDisabledByTimeout || type == .tapDisabledByUserInput {
        guard_.reEnableTapIfNeeded(type: type)
        return Unmanaged.passUnretained(event)
    }

    // Branch 2: programmatic events from our own CGEvent.post calls pass through.
    // .hidSystemState source has a non-zero stateID; hardware events have stateID == 0.
    let sourceStateID = event.getIntegerValueField(.eventSourceStateID)
    if sourceStateID != 0 {
        return Unmanaged.passUnretained(event)
    }

    // Branch 3: hardware event. Check for the abort key before dropping it.
    if type == .keyDown {
        let keyCode = event.getIntegerValueField(.keyboardEventKeycode)
        let flags = event.flags
        let modifierMask: CGEventFlags = [.maskCommand, .maskControl, .maskAlternate, .maskShift]
        if keyCode == 53 && flags.intersection(modifierMask).isEmpty {
            // Plain Esc, no modifiers. Abort.
            try? "esc_at_\\(Date())".write(toFile: "/tmp/macos-use/esc_pressed.txt",
                                          atomically: true, encoding: .utf8)
            guard_.handleEscPressed()
            return nil  // Swallow the Esc so it does not hit the focused app.
        }
    }

    // Every other hardware event is dropped on the floor.
    return nil
}`;

const callSiteCode = `// Sources/MCPServer/main.swift:1666-1763
// How the handler engages, polls, and disengages the guard around every tool call.

// Disruptive = anything except refresh_traversal.
let isDisruptive = params.name != refreshTool.name

if isDisruptive {
    // Snapshot what we need to restore on the way out.
    savedFrontmostApp = NSWorkspace.shared.frontmostApplication
    let nsPos = NSEvent.mouseLocation
    if let primaryScreen = NSScreen.screens.first {
        savedCursorPos = CGPoint(x: nsPos.x,
                                 y: primaryScreen.frame.height - nsPos.y)
    }

    // Engage: block input + show overlay.
    InputGuard.shared.engage(
        message: "AI: \\(toolDesc) — press Esc to cancel"
    )
}

// … perform primary action on @MainActor …
if isDisruptive { try InputGuard.shared.throwIfCancelled() }

// For composed actions (click → type → press → final traversal),
// throwIfCancelled is called *between every step* so a late Esc still aborts.
for additionalAction in additionalActions {
    try? await Task.sleep(nanoseconds: 100_000_000)   // 100ms spacing
    if isDisruptive { try InputGuard.shared.throwIfCancelled() }
    // … perform additional action …
}

if isDisruptive {
    // 200ms grace window: user might press Esc right as the action finishes.
    try? await Task.sleep(nanoseconds: 200_000_000)
    let wasCancelled = InputGuard.shared.wasCancelled
    InputGuard.shared.disengage()
    if wasCancelled { throw InputGuardCancelled() }
}`;

const overlayCode = `// Sources/MCPServer/InputGuard.swift:202-277
// The visible half of the kill-switch.

private func buildAndShowOverlay(message: String) {
    let app = NSApplication.shared
    app.setActivationPolicy(.accessory) // No dock icon, no Cmd+Tab entry.

    let screenFrame = NSScreen.main?.frame
        ?? NSRect(x: 0, y: 0, width: 1920, height: 1080)

    let window = NSWindow(
        contentRect: screenFrame,
        styleMask: [.borderless],
        backing: .buffered,
        defer: false
    )
    window.level = .screenSaver            // above fullscreen apps
    window.isOpaque = false
    window.backgroundColor = NSColor.black.withAlphaComponent(0.15)
    window.ignoresMouseEvents = true       // overlay is passive
    window.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary]

    // Centered dark pill, min(720, half-screen) wide, 80pt tall, radius 40.
    let pill = /* … NSView with layer.backgroundColor = rgba(0.08, 0.92) … */

    // Pulsing orange dot, 16x16, 0.8s opacity 1.0 ↔ 0.3, autoreverses forever.
    let pulse = CABasicAnimation(keyPath: "opacity")
    pulse.fromValue = 1.0
    pulse.toValue = 0.3
    pulse.duration = 0.8
    pulse.autoreverses = true
    pulse.repeatCount = .infinity

    // White 20pt semibold label on the right of the pill, single-line, truncates.
    window.orderFrontRegardless()
    self.overlayWindow = window
}`;

export default function MacosUsePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="bg-white min-h-screen">
        {/* Hero */}
        <BackgroundGrid pattern="dots" glow>
          <div className="max-w-4xl mx-auto px-6 pt-20 pb-16">
            <Breadcrumbs items={breadcrumbItems} />
            <div className="mt-6 mb-4 flex items-center gap-3 flex-wrap">
              <span className="inline-flex items-center gap-2 bg-teal-50 text-teal-700 text-sm font-medium px-3 py-1 rounded-full">
                Swift MCP server
              </span>
              <span className="inline-block bg-zinc-100 text-zinc-600 text-xs font-medium px-2 py-1 rounded-full">
                v0.1.17
              </span>
              <span className="inline-block bg-orange-50 text-orange-700 text-xs font-medium px-2 py-1 rounded-full font-mono">
                CGEventTap + Esc
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 mb-6">
              macos-use: The{" "}
              <GradientText>Esc-to-Cancel Kill-Switch</GradientText> That Sits
              Between You and Every Tool Call
            </h1>
            <p className="text-lg text-zinc-500 max-w-2xl mb-6">
              Search &ldquo;macos-use&rdquo; and every result tells you the
              same three things: it uses accessibility APIs, it exposes six MCP
              tools, and you install it from npm. None of them mention that
              before any of those six tools moves your mouse or presses a key,
              the server installs a{" "}
              <span className="font-mono text-sm">CGEventTap</span> at
              head-insert, covers the screen with a pulsing overlay, and listens
              for a single keycode that unwinds the whole automation cleanly.
              This page walks the kill-switch from the callback up.
            </p>
            <ArticleMeta
              datePublished={DATE_PUBLISHED}
              author="macos-use maintainers"
              readingTime="11 min read"
            />
            <div className="mt-8 flex gap-4 flex-wrap">
              <ShimmerButton href="https://github.com/mediar-ai/mcp-server-macos-use/blob/main/Sources/MCPServer/InputGuard.swift">
                Read InputGuard.swift on GitHub
              </ShimmerButton>
              <a
                href="https://github.com/mediar-ai/mcp-server-macos-use/blob/main/Sources/MCPServer/main.swift#L1666-L1764"
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-zinc-200 bg-white text-zinc-700 text-sm font-medium hover:border-teal-300 hover:text-teal-700 transition-colors"
              >
                Jump to main.swift:1666-1764
              </a>
            </div>
          </div>
        </BackgroundGrid>

        {/* Proof band */}
        <ProofBand
          rating={5.0}
          ratingCount="open source"
          highlights={[
            "CGEventTap at head-insert",
            "stateID check separates hardware from posts",
            "30-second watchdog auto-release",
          ]}
        />

        {/* Concept intro — Remotion clip */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <RemotionClip
            title="Press Esc. The AI stops."
            subtitle="The part of macos-use nobody writes about"
            captions={[
              "Every disruptive tool call engages a CGEventTap at head-insert",
              "Hardware events: dropped. Server's CGEvent.post: passes through",
              "The difference is one integer: eventSourceStateID",
              "Keycode 53 with no modifiers tears the tap down and aborts the action",
              "A 30-second watchdog makes sure you never stay locked out",
            ]}
            accent="teal"
          />
        </section>

        {/* What competitor pages skip */}
        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            What Other macos-use Writeups Miss
          </h2>
          <p className="text-zinc-600 mb-4">
            The first page of Google for &ldquo;macos use&rdquo; is made up of
            the GitHub README, the mcp.so listing, two competing macOS MCP
            servers, and a few third-party roundups. They all agree on the same
            three bullet points: it drives macOS apps, it reads the
            accessibility tree instead of taking screenshots, and you wire it
            into your MCP client with one JSON config block.
          </p>
          <p className="text-zinc-600 mb-4">
            None of them mention that macos-use ships a safety layer. Before
            any tool call that posts a{" "}
            <span className="font-mono text-sm">CGEvent</span>, the server
            creates a{" "}
            <span className="font-mono text-sm">CGEventTap</span> that blocks
            every hardware event the machine produces, draws a full-screen
            overlay with a pulsing orange dot, and watches for a single key.
            When you press it, the tap tears down, the tool throws{" "}
            <span className="font-mono text-sm">InputGuardCancelled</span>, and
            the handler restores cursor position and window focus before
            returning an MCP error.
          </p>
          <p className="text-zinc-600">
            Every fact below comes from two files in this repo:{" "}
            <span className="font-mono text-sm text-teal-700">
              Sources/MCPServer/InputGuard.swift
            </span>{" "}
            (355 lines) and the handler call sites at{" "}
            <span className="font-mono text-sm text-teal-700">
              Sources/MCPServer/main.swift:1666-1864
            </span>
            .
          </p>
        </section>

        {/* Anchor fact */}
        <section className="bg-zinc-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <span className="inline-block bg-orange-50 text-orange-700 text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full mb-4">
              Anchor fact
            </span>
            <h2 className="text-3xl font-bold text-zinc-900 mb-4">
              The One Integer That Separates Your Keystrokes From The AI&rsquo;s
            </h2>
            <p className="text-zinc-600 mb-6">
              At{" "}
              <span className="font-mono text-sm">InputGuard.swift:329</span>,
              the event-tap callback reads a field called{" "}
              <span className="font-mono text-sm">eventSourceStateID</span> from
              every CGEvent it sees. Events whose stateID is not zero came from
              the server&rsquo;s own{" "}
              <span className="font-mono text-sm">CGEvent.post</span> calls
              (which use the{" "}
              <span className="font-mono text-sm">.hidSystemState</span> source,
              so they carry a non-zero stateID). Events with stateID == 0 came
              from a physical keyboard, mouse, or trackpad. The callback
              returns them down two different paths: non-zero passes through
              with{" "}
              <span className="font-mono text-sm">
                Unmanaged.passUnretained(event)
              </span>
              , zero returns{" "}
              <span className="font-mono text-sm">nil</span> and is dropped on
              the floor.
            </p>
            <AnimatedCodeBlock
              code={callbackCode}
              language="swift"
              filename="Sources/MCPServer/InputGuard.swift"
            />
            <p className="text-zinc-600 mt-6">
              That one integer is why the AI can type full sentences into a
              text field at full speed while your keyboard is completely frozen
              behind the overlay. No per-event timestamp tracking, no sequence
              numbers, no shared mutable state. Post events have a signature
              the tap recognises.
            </p>
          </div>
        </section>

        {/* Animated beam: tool call → guard engage → dispatch */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            What Happens Between MCP Call and CGEvent.post
          </h2>
          <p className="text-zinc-600 mb-8 max-w-2xl">
            A click, type, press, scroll, or open tool arrives on stdio. Before
            any actual input reaches the system, the handler pipes through the
            guard. Refresh traversal is the only tool that skips this path,
            because it never posts an event.
          </p>
          <AnimatedBeam
            title="How a disruptive tool call engages InputGuard"
            from={[
              { label: "click_and_traverse" },
              { label: "type_and_traverse" },
              { label: "press_key_and_traverse" },
              { label: "scroll_and_traverse" },
              { label: "open_application_and_traverse" },
            ]}
            hub={{ label: "InputGuard.shared.engage()" }}
            to={[
              { label: "CGEventTap at head-insert" },
              { label: "Full-screen NSWindow overlay" },
              { label: "30s watchdog timer" },
            ]}
          />
          <p className="text-zinc-500 text-sm mt-6 max-w-2xl">
            <span className="font-mono">refresh_traversal</span> is treated as
            non-disruptive at{" "}
            <span className="font-mono">main.swift:1667</span> and bypasses
            this whole chain, because it only reads the AX tree and never posts
            a CGEvent.
          </p>
        </section>

        {/* The callback: 3 branches, one file */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            The Event-Tap Callback: Three Branches, Thirty Lines
          </h2>
          <p className="text-zinc-600 mb-6 max-w-2xl">
            The entire filter lives in a single C-compatible free function at{" "}
            <span className="font-mono text-sm">
              Sources/MCPServer/InputGuard.swift:311-355
            </span>
            . It has to be a free function because{" "}
            <span className="font-mono text-sm">CGEvent.tapCreate</span> takes
            a C callback pointer. Swift closures with captured state would not
            bridge, so the guard instance is passed through the{" "}
            <span className="font-mono text-sm">refcon</span> pointer and
            unwrapped at the top of the callback.
          </p>

          <AnimatedChecklist
            title="What the callback returns, per branch"
            items={[
              {
                text: "tapDisabledByTimeout / tapDisabledByUserInput: re-enable the tap, pass the event through. The tap self-heals if macOS disables it.",
                checked: true,
              },
              {
                text: "eventSourceStateID != 0: the server's own post. Pass through unchanged so click/type actually land.",
                checked: true,
              },
              {
                text: "Hardware keyDown with keycode 53 and empty modifier mask: plain Esc. Write marker file, flip _cancelled, tear down tap, swallow the event.",
                checked: true,
              },
              {
                text: "Every other hardware event (keys, mouse, scroll, drag, flagsChanged): return nil. The event never reaches any app.",
                checked: true,
              },
            ]}
          />
        </section>

        {/* BentoGrid: what the guard protects */}
        <section className="bg-zinc-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-zinc-900 mb-6">
              The Concrete Failure Modes This Prevents
            </h2>
            <p className="text-zinc-600 mb-8 max-w-2xl">
              The kill-switch is not decorative. Each of these failure modes
              used to be trivial to reproduce with any accessibility-driven
              automation; the guard closes them.
            </p>
            <BentoGrid
              cards={[
                {
                  title: "Your keystrokes colliding with the agent",
                  description:
                    "Without the tap, typing at the same moment the agent is typing would interleave characters into whatever app has focus. The stateID filter lets the agent's events through and drops yours, so the target field gets a clean sequence from the AI alone.",
                  size: "2x1",
                },
                {
                  title: "Mouse nudging mid-click",
                  description:
                    "mouseMoved, leftMouseDragged, and rightMouseDragged are all in the event mask. A bumped trackpad during a click_and_traverse call cannot shift the cursor off-target.",
                  size: "1x1",
                },
                {
                  title: "Scroll wheel wobble",
                  description:
                    "scrollWheel is masked. Scrolling while the agent is scrolling cannot turn a one-step pan into a ten-step leap.",
                  size: "1x1",
                },
                {
                  title: "Accidental modifier-change",
                  description:
                    "flagsChanged is in the mask. Holding Shift mid-type cannot suddenly uppercase the AI's output.",
                  size: "1x1",
                },
                {
                  title: "No off-ramp",
                  description:
                    "Other macOS automation paths (AppleScript, Shortcuts) give you no mid-flight abort. Here, a single Esc returns control and the handler restores cursor + focus before the MCP error returns.",
                  size: "1x1",
                },
              ]}
            />
          </div>
        </section>

        {/* The call site in main.swift */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            Where The Guard Gets Engaged, Polled, And Released
          </h2>
          <p className="text-zinc-600 mb-6 max-w-2xl">
            The handler is one big switch that constructs an{" "}
            <span className="font-mono text-sm">ActionResult</span> per tool.
            Everything around{" "}
            <span className="font-mono text-sm">performAction</span> is where
            the guard lives: snapshot cursor + focus, engage, call{" "}
            <span className="font-mono text-sm">throwIfCancelled</span> between
            steps, disengage, restore. Note that the cancel check is called{" "}
            <em>four times</em> in the composed-action path alone, because a
            user can press Esc at any point.
          </p>
          <AnimatedCodeBlock
            code={callSiteCode}
            language="swift"
            filename="Sources/MCPServer/main.swift"
          />
          <p className="text-zinc-500 text-sm mt-4 max-w-2xl">
            The 200ms grace window at{" "}
            <span className="font-mono">main.swift:1757</span> exists because
            the action frequently finishes faster than a human can finish a key
            press; without the grace, a late Esc would be lost.
          </p>
        </section>

        {/* Sequence diagram: the life of one click, from tool call to restoration */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            The Life Of One{" "}
            <span className="font-mono text-2xl">click_and_traverse</span>
          </h2>
          <p className="text-zinc-600 mb-8 max-w-2xl">
            An agent sends a click tool call over stdio. This is every line of
            ownership the cursor crosses between the MCP handler accepting the
            call and your cursor being put back where it was.
          </p>
          <SequenceDiagram
            title="click_and_traverse, start to finish, with guard engaged"
            actors={[
              "MCP client",
              "CallTool handler",
              "InputGuard",
              "CGEventTap",
              "MacosUseSDK",
            ]}
            messages={[
              { from: 0, to: 1, label: "click_and_traverse(element, pid)", type: "request" },
              { from: 1, to: 1, label: "save cursor + frontmost app" },
              { from: 1, to: 2, label: "engage(message: 'AI: Clicking in app…')", type: "request" },
              { from: 2, to: 3, label: "CGEvent.tapCreate + enable", type: "request" },
              { from: 2, to: 2, label: "show NSWindow overlay" },
              { from: 1, to: 4, label: "performAction(.click …)", type: "request" },
              { from: 4, to: 3, label: "CGEvent.post (stateID != 0) passes through", type: "event" },
              { from: 1, to: 2, label: "throwIfCancelled() no throw", type: "request" },
              { from: 1, to: 2, label: "disengage()", type: "request" },
              { from: 2, to: 3, label: "destroy tap + hide overlay", type: "response" },
              { from: 1, to: 1, label: "restore cursor + focus" },
              { from: 1, to: 0, label: "return enriched traversal + diff", type: "response" },
            ]}
          />
        </section>

        {/* Overlay code */}
        <section className="bg-zinc-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-zinc-900 mb-4">
              The Overlay You See On Screen
            </h2>
            <p className="text-zinc-600 mb-6 max-w-2xl">
              The kill-switch has two halves. The CGEventTap is the mechanical
              half; the overlay is the contract with the user. Without the
              overlay, you would not know your input was being blocked or that
              Esc was bound. It is a single borderless NSWindow at{" "}
              <span className="font-mono text-sm">.screenSaver</span> level
              with a dark pill, a CABasicAnimation pulse on the dot, and one
              label.
            </p>

            <AnimatedCodeBlock
              code={overlayCode}
              language="swift"
              filename="Sources/MCPServer/InputGuard.swift"
            />

            <p className="text-zinc-500 text-sm mt-4 max-w-2xl">
              <span className="font-mono">ignoresMouseEvents = true</span>{" "}
              matters a lot: if the overlay swallowed mouse events, the server
              could not post its own clicks through to the app behind it. The
              overlay is passive; the tap does all the blocking.
            </p>
          </div>
        </section>

        {/* StepTimeline: Esc flow */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            What Pressing Esc Actually Runs, In Order
          </h2>
          <p className="text-zinc-600 mb-10 max-w-2xl">
            The user presses Escape mid-click. Six things happen, in this
            order, before the MCP client sees the cancellation error. Every
            step is a real line in{" "}
            <span className="font-mono text-sm">InputGuard.swift</span> or{" "}
            <span className="font-mono text-sm">main.swift</span>.
          </p>

          <StepTimeline
            steps={[
              {
                title: "The HID stream delivers the keyDown to the tap",
                description:
                  "The CGEventTap was installed at head-insert, so it sees the Esc keyDown before any app does. The callback runs synchronously on the main run loop.",
              },
              {
                title: "Three checks: event type, keycode, modifier mask",
                description:
                  "type == .keyDown, keycode == 53, and flags intersected with {Cmd, Control, Option, Shift} is empty. If any of those fails the event is dropped but no cancel fires. Ctrl+Esc does not abort. Shift+Esc does not abort.",
              },
              {
                title: "Write the verification marker file",
                description:
                  "Before anything else, the callback writes /tmp/macos-use/esc_pressed.txt with a timestamp. This exists so you can prove the Esc was seen even if the downstream cancellation path failed somehow.",
              },
              {
                title: "handleEscPressed flips _cancelled and tears the tap down",
                description:
                  "_cancelled = true under a lock. disengage() is called inline: CGEvent.tapEnable(false), CFRunLoopRemoveSource, CFMachPortInvalidate, stop watchdog, orderOut the overlay window. The onUserCancelled callback fires on an arbitrary thread.",
              },
              {
                title: "Swallow the Esc so the focused app never sees it",
                description:
                  "The callback returns nil, which suppresses the event from delivery. This matters because the focused app might have its own Esc handler (close modal, cancel search) that you do not want firing.",
              },
              {
                title: "The next throwIfCancelled throws; handler's catch block restores state",
                description:
                  "The next step of the composed action hits try InputGuard.shared.throwIfCancelled(), which throws InputGuardCancelled. The catch block at main.swift:1847 disengages again (idempotent), reposts a mouseMoved at savedCursorPos, reactivates savedFrontmostApp, and returns 'Cancelled: user pressed Esc to abort <tool>' as an isError response.",
              },
            ]}
          />
        </section>

        {/* Metrics row */}
        <section className="bg-zinc-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-zinc-900 mb-8">
              The Numbers From InputGuard.swift
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <GlowCard>
                <div className="p-6">
                  <div className="text-4xl font-bold text-zinc-900">
                    <NumberTicker value={355} />
                  </div>
                  <div className="text-sm text-zinc-500 mt-2">
                    lines in InputGuard.swift end to end
                  </div>
                </div>
              </GlowCard>
              <GlowCard>
                <div className="p-6">
                  <div className="text-4xl font-bold text-zinc-900">
                    <NumberTicker value={11} />
                  </div>
                  <div className="text-sm text-zinc-500 mt-2">
                    CGEventTypes registered in the event mask
                  </div>
                </div>
              </GlowCard>
              <GlowCard>
                <div className="p-6">
                  <div className="text-4xl font-bold text-zinc-900">
                    <NumberTicker value={53} />
                  </div>
                  <div className="text-sm text-zinc-500 mt-2">
                    keycode that aborts (plain Esc, US layout)
                  </div>
                </div>
              </GlowCard>
              <GlowCard>
                <div className="p-6">
                  <div className="text-4xl font-bold text-zinc-900">
                    <NumberTicker value={30} suffix="s" />
                  </div>
                  <div className="text-sm text-zinc-500 mt-2">
                    watchdog auto-release timeout
                  </div>
                </div>
              </GlowCard>
              <GlowCard>
                <div className="p-6">
                  <div className="text-4xl font-bold text-zinc-900">
                    <NumberTicker value={4} />
                  </div>
                  <div className="text-sm text-zinc-500 mt-2">
                    throwIfCancelled call sites in a composed action
                  </div>
                </div>
              </GlowCard>
              <GlowCard>
                <div className="p-6">
                  <div className="text-4xl font-bold text-zinc-900">
                    <NumberTicker value={200} suffix="ms" />
                  </div>
                  <div className="text-sm text-zinc-500 mt-2">
                    grace window for late-Esc after the action completes
                  </div>
                </div>
              </GlowCard>
              <GlowCard>
                <div className="p-6">
                  <div className="text-4xl font-bold text-zinc-900">
                    <NumberTicker value={5} />
                  </div>
                  <div className="text-sm text-zinc-500 mt-2">
                    tools that engage the guard (all except refresh_traversal)
                  </div>
                </div>
              </GlowCard>
              <GlowCard>
                <div className="p-6">
                  <div className="text-4xl font-bold text-zinc-900">
                    <NumberTicker value={0.8} decimals={1} suffix="s" />
                  </div>
                  <div className="text-sm text-zinc-500 mt-2">
                    overlay dot pulse period (1.0 → 0.3 opacity, autoreverses)
                  </div>
                </div>
              </GlowCard>
            </div>
            <p className="text-zinc-500 text-sm mt-8">
              Every number above is a direct read off{" "}
              <span className="font-mono">Sources/MCPServer/InputGuard.swift</span>{" "}
              and <span className="font-mono">main.swift</span> as of the
              current commit. The 11 event types in the mask: keyDown, keyUp,
              leftMouseDown, leftMouseUp, rightMouseDown, rightMouseUp,
              mouseMoved, leftMouseDragged, rightMouseDragged, scrollWheel,
              flagsChanged.
            </p>
          </div>
        </section>

        {/* The createEventTap code, shown after the numbers so the mask count lands */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            The Mask, Written Out
          </h2>
          <p className="text-zinc-600 mb-6 max-w-2xl">
            The mask is built one bitwise-OR at a time because Swift&rsquo;s
            type checker times out when you give it a single big expression.
            Practical detail that only shows up when you actually read the
            file.
          </p>
          <AnimatedCodeBlock
            code={tapCreateCode}
            language="swift"
            filename="Sources/MCPServer/InputGuard.swift"
          />
          <p className="text-zinc-500 text-sm mt-4 max-w-2xl">
            <span className="font-mono">place: headInsert</span> (value 0) is
            the important choice. A tail-inserted tap would sit after every
            app&rsquo;s own event handlers and wouldn&rsquo;t be able to
            suppress the Esc before something else consumed it.
          </p>
        </section>

        {/* Terminal reproduction */}
        <section className="bg-zinc-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-zinc-900 mb-4">
              Verify The Kill-Switch In A Clean Checkout
            </h2>
            <p className="text-zinc-600 mb-8 max-w-2xl">
              Nothing on this page is inferred. Clone the repo, grep, read the
              call sites, and the entire kill-switch is on disk in two files.
            </p>

            <TerminalOutput
              title="Reading the kill-switch from source"
              lines={[
                {
                  text: "git clone https://github.com/mediar-ai/mcp-server-macos-use.git",
                  type: "command",
                },
                {
                  text: "cd mcp-server-macos-use",
                  type: "command",
                },
                {
                  text: "wc -l Sources/MCPServer/InputGuard.swift",
                  type: "command",
                },
                {
                  text: "     355 Sources/MCPServer/InputGuard.swift",
                  type: "output",
                },
                {
                  text: "grep -n 'eventSourceStateID\\|keyCode == 53\\|watchdogTimeout\\|throwIfCancelled' Sources/MCPServer/InputGuard.swift",
                  type: "command",
                },
                {
                  text: "24:    var watchdogTimeout: TimeInterval = 30",
                  type: "output",
                },
                {
                  text: "53:    func throwIfCancelled() throws {",
                  type: "output",
                },
                {
                  text: "329:    let sourceStateID = event.getIntegerValueField(.eventSourceStateID)",
                  type: "output",
                },
                {
                  text: "345:        if keyCode == 53 && flags.intersection(modifierMask).isEmpty {",
                  type: "output",
                },
                {
                  text: "grep -n 'InputGuard' Sources/MCPServer/main.swift | head -10",
                  type: "command",
                },
                {
                  text: "1696:                InputGuard.shared.engage(message: \"AI: \\(toolDesc) — press Esc to cancel\")",
                  type: "output",
                },
                {
                  text: "1708:                if isDisruptive { try InputGuard.shared.throwIfCancelled() }",
                  type: "output",
                },
                {
                  text: "1721:                if isDisruptive { try InputGuard.shared.throwIfCancelled() }",
                  type: "output",
                },
                {
                  text: "1728:                    if isDisruptive { try InputGuard.shared.throwIfCancelled() }",
                  type: "output",
                },
                {
                  text: "1734:                if isDisruptive { try InputGuard.shared.throwIfCancelled() }",
                  type: "output",
                },
                {
                  text: "1758:                let wasCancelled = InputGuard.shared.wasCancelled",
                  type: "output",
                },
                {
                  text: "All four throwIfCancelled sites + engage + wasCancelled check are right there.",
                  type: "success",
                },
              ]}
            />
          </div>
        </section>

        {/* Comparison */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            macos-use vs Every Other Way To Automate macOS
          </h2>
          <ComparisonTable
            productName="macos-use"
            competitorName="AppleScript / Shortcuts / other macOS MCPs"
            rows={[
              {
                feature: "Hardware input blocked during automation",
                ours: "Yes (CGEventTap, .cghidEventTap, head-insert)",
                competitor: "No",
              },
              {
                feature: "User can abort mid-sequence with one key",
                ours: "Yes (plain Esc, keycode 53)",
                competitor: "No",
              },
              {
                feature: "Distinguishes user input from tool's own posts",
                ours: "Yes (eventSourceStateID != 0 passes through)",
                competitor: "N/A",
              },
              {
                feature: "Visible on-screen indicator while active",
                ours: "Yes (NSWindow at .screenSaver level, pulsing dot)",
                competitor: "Varies / none",
              },
              {
                feature: "Auto-release if the tool handler hangs",
                ours: "Yes (30-second DispatchSource watchdog)",
                competitor: "No",
              },
              {
                feature: "Self-heals if macOS auto-disables the tap",
                ours: "Yes (tapDisabledByTimeout / ByUserInput re-enable)",
                competitor: "N/A",
              },
              {
                feature: "Restores cursor + frontmost app on abort",
                ours: "Yes (savedCursorPos + savedFrontmostApp)",
                competitor: "No",
              },
              {
                feature: "Marker file so you can verify Esc was detected",
                ours: "/tmp/macos-use/esc_pressed.txt",
                competitor: "N/A",
              },
            ]}
          />
        </section>

        {/* Marquee: concrete events the tap masks */}
        <section className="py-12">
          <div className="max-w-4xl mx-auto px-6 mb-6">
            <h2 className="text-2xl font-bold text-zinc-900 mb-2">
              Every Hardware Event Type The Tap Drops
            </h2>
            <p className="text-zinc-500">
              Registered in the event mask at{" "}
              <span className="font-mono text-sm">InputGuard.swift:113-127</span>
              . Every one of these, from a physical device, is returned as{" "}
              <span className="font-mono text-sm">nil</span> (suppressed) for
              the entire duration of a disruptive tool call.
            </p>
          </div>
          <Marquee speed={30} fade pauseOnHover>
            {[
              "keyDown",
              "keyUp",
              "leftMouseDown",
              "leftMouseUp",
              "rightMouseDown",
              "rightMouseUp",
              "mouseMoved",
              "leftMouseDragged",
              "rightMouseDragged",
              "scrollWheel",
              "flagsChanged",
            ].map((name) => (
              <div
                key={name}
                className="mx-3 px-5 py-2 rounded-full border border-zinc-200 bg-white text-zinc-700 text-sm whitespace-nowrap font-mono"
              >
                {name}
              </div>
            ))}
          </Marquee>
        </section>

        {/* Proof banner */}
        <section className="max-w-4xl mx-auto px-6 py-10">
          <ProofBanner
            quote="The part that makes macos-use safe to run on the same machine you use to live is not a prompt rule or a permission dialog; it is 355 lines of Swift that put a CGEventTap and a pulsing overlay in between every tool call and your keyboard."
            source="InputGuard.swift + main.swift:1666-1864"
            metric="Esc = abort"
          />
        </section>

        {/* Inline CTA */}
        <section className="max-w-4xl mx-auto px-6 py-4">
          <InlineCta
            heading="Wire macos-use into your MCP client"
            body="The server runs wherever Claude Code, Cursor, or any MCP client can spawn a binary. Every disruptive tool call will bring up the overlay, and Esc will always get you out."
            linkText="Install from npm"
            href="https://www.npmjs.com/package/mcp-server-macos-use"
          />
        </section>

        {/* FAQ */}
        <FaqSection items={faqItems} />

        {/* Final CTA */}
        <section className="max-w-4xl mx-auto px-6 py-16 text-center">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            Read the kill-switch.
          </h2>
          <p className="text-zinc-500 mb-8 max-w-xl mx-auto">
            355 lines, one file, reproduces cleanly.{" "}
            <span className="font-mono text-sm">InputGuard.swift</span> plus the
            call sites at{" "}
            <span className="font-mono text-sm">main.swift:1666-1864</span>{" "}
            are the entire story.
          </p>
          <ShimmerButton href="https://github.com/mediar-ai/mcp-server-macos-use/blob/main/Sources/MCPServer/InputGuard.swift">
            Open InputGuard.swift on GitHub
          </ShimmerButton>
        </section>

        <StickyBottomCta
          description="macos-use engages a CGEventTap before every tool call — press Esc to cancel"
          buttonLabel="Read InputGuard.swift"
          href="https://github.com/mediar-ai/mcp-server-macos-use/blob/main/Sources/MCPServer/InputGuard.swift"
        />
      </article>
    </>
  );
}
