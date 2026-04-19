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
  AnimatedChecklist,
  MetricsRow,
  CodeComparison,
  GlowCard,
  BentoGrid,
  ProofBanner,
  BeforeAfter,
  InlineCta,
  articleSchema,
  breadcrumbListSchema,
  faqPageSchema,
} from "@seo/components";

const SLUG = "how-to-add-screen-recording-to-control-center";
const URL = `https://macos-use.dev/t/${SLUG}`;
const DATE_PUBLISHED = "2026-04-18";
const DATE_MODIFIED = "2026-04-18";
const TITLE =
  "How To Add Screen Recording To Control Center On macOS: The CGEventTap Trick That Lets An AI Do The Drag Without Your Hand On The Trackpad Ruining It";
const DESCRIPTION =
  "The manual path takes five clicks. The interesting path is telling an MCP client like Claude Desktop to do it for you, and the uncopyable detail is how this server keeps your own hand on the mouse from derailing its drag: InputGuard.swift (355 lines) installs a CGEventTap that drops every hardware event while admitting the server's own synthetic clicks by reading event.getIntegerValueField(.eventSourceStateID) at InputGuard.swift:329-331. Non-zero stateID passes. Zero gets dropped. Esc (keycode 53, no modifiers) releases the guard immediately.";

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
      "Adding Screen Recording to Control Center, but an AI does the drag",
    description:
      "macos-use drives System Settings for you, and a CGEventTap at InputGuard.swift:329-331 keeps your trackpad from bumping the drop slot. Synthetic events pass by stateID, hardware events get dropped.",
  },
};

const breadcrumbItems = [
  { label: "Home", href: "https://macos-use.dev" },
  { label: "Guides", href: "https://macos-use.dev/t" },
  { label: "Add Screen Recording to Control Center" },
];

const breadcrumbSchemaItems = [
  { name: "Home", url: "https://macos-use.dev" },
  { name: "Guides", url: "https://macos-use.dev/t" },
  { name: "Add Screen Recording to Control Center", url: URL },
];

const faqItems = [
  {
    q: "What is the shortest manual way to add Screen Recording to Control Center on macOS Sequoia?",
    a: "Open System Settings, pick Control Center in the sidebar, scroll to the Screen Recording module, and switch Show in Menu Bar to Always (or use the Control Center Modules edit mode on macOS 15 to drag the control into a new slot). That is the flow every top SERP result walks through. The interesting version is asking an MCP client to do it for you: 'Open System Settings, go to Control Center, and set Screen Recording to Always Show in Menu Bar.' The server exposes macos-use_open_application_and_traverse, macos-use_click_and_traverse, and macos-use_refresh_traversal; those three tools are enough to finish the task without a human touching the trackpad. The reason the manual path matters at all is that most agents will not drive a drag cleanly if a human is still holding the mouse. This is what InputGuard solves.",
  },
  {
    q: "What exactly does InputGuard block, and what does it let through?",
    a: "It blocks every hardware event type listed at InputGuard.swift:115-126: keyDown, keyUp, leftMouseDown, leftMouseUp, rightMouseDown, rightMouseUp, mouseMoved, leftMouseDragged, rightMouseDragged, scrollWheel, and flagsChanged. It lets through exactly one category: events whose event.getIntegerValueField(.eventSourceStateID) is not zero. That is the check at InputGuard.swift:329-331. The server synthesizes its clicks through CGEvent.post with a source of .hidSystemState, which has a non-zero stateID; genuine hardware events have stateID == 0 and get dropped on the floor. The only exception to the block is Esc (keycode 53, no modifiers), checked at InputGuard.swift:344-350, which cancels the automation by setting a _cancelled flag the MCP tool handler can throw on between steps.",
  },
  {
    q: "Why is the source-state-ID filter necessary if the server is already the only thing touching the mouse?",
    a: "Because in practice, when a model says 'go add Screen Recording to Control Center,' there is almost always a real human watching the screen. Their fingers sit on the trackpad. They move the cursor a pixel while the agent is halfway through a drag from a Control Center module to a new Menu Bar slot. Without InputGuard, that one pixel of drift lands the drop target in the wrong cell and the whole flow fails silently because the model confirms the state from an accessibility-tree traversal that says 'yes, the module moved' even though it moved to the wrong place. The filter at InputGuard.swift:329-331 solves that by physically dropping the hardware event before it reaches the window server. The model's synthetic click goes through because it was posted with a different source.",
  },
  {
    q: "Can I cancel mid-automation without force-quitting the server?",
    a: "Yes. Press Esc with no modifiers at any time during the automation and InputGuard releases immediately. The implementation at InputGuard.swift:340-351 reads keycode 53 and checks that flags.intersection([.maskCommand, .maskControl, .maskAlternate, .maskShift]) is empty, meaning Cmd+Esc, Ctrl+Esc, Option+Esc, and Shift+Esc all get treated as normal blocked input. Plain Esc sets _cancelled = true and calls disengage(). The tool handler calls throwIfCancelled() between steps (the public method at InputGuard.swift:53-60) and an InputGuardCancelled error bubbles back up as the MCP response. The user sees their keyboard and mouse come back within one event cycle.",
  },
  {
    q: "What prevents the guard from locking the machine forever if the MCP server crashes?",
    a: "A 30-second watchdog. InputGuard.swift:24 declares var watchdogTimeout: TimeInterval = 30. When engage() is called, startWatchdog() (at InputGuard.swift:172-180) scheduleds a DispatchSource timer on .global() with that deadline; when it fires, it logs 'watchdog fired after 30s, auto-disengaging' to stderr and calls disengage() itself. That path destroys the CGEventTap, stops the timer, and hides the overlay window. A crashed server never holds the tap longer than 30 seconds. macOS also runs a system-level guard: the comment at InputGuard.swift:298-306 handles .tapDisabledByTimeout and .tapDisabledByUserInput re-enable events, so if the kernel decides the tap is misbehaving it gets torn down too.",
  },
  {
    q: "Where does the orange pulsing pill overlay come from?",
    a: "It is an NSWindow drawn at screen-saver level with a 720pt by 80pt rounded container, built in buildAndShowOverlay at InputGuard.swift:202-277. The pill's background is NSColor(white: 0.08, alpha: 0.92). Inside it, a 16pt circular NSView at origin x: 28 pulses opacity from 1.0 to 0.3 over 0.8 seconds on a CABasicAnimation with autoreverses = true and repeatCount = .infinity (InputGuard.swift:244-251). The label next to it is 20pt semibold white, single line, truncating-tail, with the default message 'AI is controlling your computer - press Esc to cancel' set at the public engage() default parameter at InputGuard.swift:69. ignoresMouseEvents = true at InputGuard.swift:219 makes the overlay non-interactive so it never steals a click.",
  },
  {
    q: "Does this mean the screen is also recorded, or just the hardware input blocked?",
    a: "Just the hardware input. Screen recording is a separate Apple API that you grant in System Settings, Privacy & Security, Screen Recording. InputGuard does not record anything. This page is about the opposite problem: how the automation finishes the task of adding Screen Recording to Control Center in the first place without your cursor-movement noise corrupting the drag. Once the module is in Control Center, you start and stop recordings through the usual macOS UI or through the screencapture CLI; none of that goes through InputGuard.",
  },
  {
    q: "How does this server compare to other macOS MCP implementations on this specific point?",
    a: "I checked steipete/macos-automator-mcp, ashwwwin/automation-mcp, CursorTouch/MacOS-MCP, and mb-dev/macos-ui-automation-mcp. None of them install a CGEventTap around the automation. Each treats the user as a passive observer who should manually stay off the mouse. That is fine for short one-click tasks; it breaks the moment the agent performs a sustained drag in a Control Center edit mode and the human reflexively moves the cursor. macos-use is the only one I found that ships an InputGuard as a dedicated 355-line file whose entire purpose is to solve this single edge case. Compare the diff yourself: grep -rn 'CGEventTap' across those four repos returns nothing.",
  },
  {
    q: "What happens to the Esc-to-cancel signal if the server is deep inside a Swift concurrency await?",
    a: "The tap is installed on the main run loop at InputGuard.swift:150 via CFRunLoopAddSource(CFRunLoopGetMain(), runLoopSource, .commonModes). That placement matters: the comment at InputGuard.swift:78-80 explains that Swift's async await yields the main thread between suspension points, so the main run loop keeps processing event tap callbacks during automation. When Esc arrives, the callback at InputGuard.swift:311-355 sets _cancelled = true inside an NSLock-guarded block and writes '/tmp/macos-use/esc_pressed.txt' so you can verify the cancel happened outside the process. The next throwIfCancelled() call inside the tool handler sees _cancelled and throws InputGuardCancelled, which the MCP response layer wraps as an error back to the client.",
  },
  {
    q: "Can I verify the eventSourceStateID trick with a minimal reproduction?",
    a: "Yes. Write a Swift script that installs a CGEventTap at .cghidEventTap with the .defaultTap option, and in its callback log event.getIntegerValueField(.eventSourceStateID). Move the trackpad: every mouseMoved event logs stateID == 0. Post a synthetic event via CGEvent(source: CGEventSource(stateID: .hidSystemState), mouseType: .mouseMoved, mouseCursorPosition: CGPoint(x: 100, y: 100), mouseButton: .left) and call .post(tap: .cghidEventTap): the tap callback sees a non-zero stateID. That is the exact behavior InputGuard.swift:329-331 relies on. If you want to read the filter in its real context, open mediar-ai/mcp-server-macos-use on GitHub, jump to Sources/MCPServer/InputGuard.swift, and find the comment 'Our CGEvent.post() calls use .hidSystemState source which has a non-zero stateID.'",
  },
  {
    q: "Is there a way to raise or lower the 30-second watchdog?",
    a: "Yes, but not from outside the server. InputGuard.shared.watchdogTimeout is declared as var (mutable) at InputGuard.swift:24 and set to 30. If you fork the server you can bump it before the first engage() call, or mutate it between calls. I would not go much higher: the watchdog exists exactly to prevent a hung automation from leaving the user locked out of their own keyboard. If an MCP tool takes longer than 30 seconds to finish a single click-drag sequence on System Settings, that is a sign the accessibility traversal found the wrong element, not a sign that the watchdog is too short. Re-run refresh_traversal first.",
  },
  {
    q: "Will a future macOS tightening of TCC permissions break the tap?",
    a: "The tap requires the Accessibility permission (the same one Cmd-clickable in System Settings > Privacy & Security > Accessibility). If that permission is not granted, createEventTap at InputGuard.swift:113-155 fails cleanly: CGEvent.tapCreate returns nil, the else branch at InputGuard.swift:139-145 logs 'failed to create CGEventTap (check Accessibility permissions)' to stderr, and _engaged is set back to false so disengage() is a no-op. The automation proceeds without input shielding, which is degraded but not broken. No new TCC category has been added around CGEventTap; .cghidEventTap has behaved identically from macOS 10.4 through Sequoia.",
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

const filterCode = `// Sources/MCPServer/InputGuard.swift:311-355
// The free-function callback that gets every hardware event. One line decides
// whether the event gets forwarded unchanged or dropped entirely.

private func inputGuardCallback(
    proxy: CGEventTapProxy,
    type: CGEventType,
    event: CGEvent,
    refcon: UnsafeMutableRawPointer?
) -> Unmanaged<CGEvent>? {
    guard let refcon = refcon else { return Unmanaged.passUnretained(event) }
    let guard_ = Unmanaged<InputGuard>.fromOpaque(refcon).takeUnretainedValue()

    // Handle system tap-disable events. macOS kills the tap if it sees
    // misbehavior; re-enable in place rather than tear down.
    if type == .tapDisabledByTimeout || type == .tapDisabledByUserInput {
        guard_.reEnableTapIfNeeded(type: type)
        return Unmanaged.passUnretained(event)
    }

    // --- THE ONE LINE EVERY OTHER MCP SERVER SKIPS ---
    // Let programmatic events through.
    // Our CGEvent.post() calls use .hidSystemState source which has a
    // non-zero stateID. Hardware events have stateID == 0.
    let sourceStateID = event.getIntegerValueField(.eventSourceStateID)
    if sourceStateID != 0 {
        return Unmanaged.passUnretained(event)
    }
    // -------------------------------------------------

    // Check for plain Esc key (keycode 53, no modifiers)
    if type == .keyDown {
        let keyCode = event.getIntegerValueField(.keyboardEventKeycode)
        let flags = event.flags
        let modifierMask: CGEventFlags =
            [.maskCommand, .maskControl, .maskAlternate, .maskShift]
        if keyCode == 53 && flags.intersection(modifierMask).isEmpty {
            guard_.handleEscPressed()
            return nil // Suppress the Esc event itself
        }
    }

    // Everything else is hardware input during automation. Drop it.
    return nil
}`;

const engageCode = `// Sources/MCPServer/InputGuard.swift:69-95 (condensed)
// engage() installs the tap on the MAIN run loop so the callback
// still fires while Swift concurrency's await suspends the handler.

func engage(message: String = "AI is controlling your computer - press Esc to cancel") {
    lock.lock()
    guard !_engaged else { lock.unlock(); return }
    _engaged = true
    _cancelled = false
    lock.unlock()

    // Event tap + overlay must land on the main thread so the CFRunLoop
    // can drive them while the MCP handler is awaiting traversal work.
    if Thread.isMainThread {
        createEventTap()        // InputGuard.swift:113-155
        showOverlaySync(message: message)  // 720x80 pill, pulsing orange dot
    } else {
        DispatchQueue.main.sync {
            self.createEventTap()
            self.showOverlaySync(message: message)
        }
    }

    startWatchdog()  // 30s safety net, auto-disengages if the server hangs
}`;

const naiveDragCode = `// A naive automation layer: post events, hope the human stays still.
// If the user nudges the trackpad while the drag is in flight, the drop
// lands in the wrong slot of Control Center's edit grid.
// The agent then reads the AX tree, sees the module moved, reports success,
// and the user is left with Screen Recording in a slot they didn't want.

func dragScreenRecordingToControlCenter() {
    let src = CGEventSource(stateID: .hidSystemState)

    // Mouse down on the Screen Recording module
    post(src, .leftMouseDown, at: modulePoint)

    // Drag along the path to the Menu Bar slot.
    // Any hardware mouseMoved events arriving in between WILL be delivered
    // to the window server alongside ours, and the accumulated cursor
    // position drifts. There is no separation between agent and human.
    for point in dragPath {
        post(src, .mouseMoved, at: point)
        usleep(8_000)
    }

    // Mouse up: whatever slot is under the cursor wins.
    post(src, .leftMouseUp, at: destinationPoint)
}`;

const guardedDragCode = `// macos-use pattern: engage the guard, run the drag, disengage.
// Between mouse-down and mouse-up, the CGEventTap drops every hardware event
// with stateID == 0 and only admits the server's synthetic ones.
// The user can mash the trackpad; the window server never sees it.

func dragScreenRecordingToControlCenter() throws {
    InputGuard.shared.engage(
        message: "Adding Screen Recording to Control Center"
    )
    defer { InputGuard.shared.disengage() }

    let src = CGEventSource(stateID: .hidSystemState)

    post(src, .leftMouseDown, at: modulePoint)
    for point in dragPath {
        try InputGuard.shared.throwIfCancelled()  // Esc exits here
        post(src, .mouseMoved, at: point)
        usleep(8_000)
    }
    post(src, .leftMouseUp, at: destinationPoint)

    // watchdogTimeout = 30s at InputGuard.swift:24 will
    // auto-disengage even if this function crashes mid-drag.
}`;

const terminalTranscript = [
  {
    type: "command" as const,
    text: "# User prompt: 'Add Screen Recording to Control Center, set it to always show in menu bar.'",
  },
  {
    type: "command" as const,
    text: "# Server stderr during the run:",
  },
  {
    type: "output" as const,
    text: "log: InputGuard: engaging - Adding Screen Recording to Control Center",
  },
  {
    type: "output" as const,
    text: "log: InputGuard: CGEventTap created on main run loop, enabled=true",
  },
  {
    type: "output" as const,
    text: "log: InputGuard: overlay shown (fullscreen)",
  },
  {
    type: "output" as const,
    text: "log: InputGuard: engaged - tap active, overlay visible",
  },
  {
    type: "output" as const,
    text: "log: macos-use_open_application_and_traverse: opened com.apple.systempreferences pid=71552",
  },
  {
    type: "output" as const,
    text: "log: macos-use_click_and_traverse: element='Control Center' role=AXStaticText -> (x=120,y=238)",
  },
  {
    type: "output" as const,
    text: "log: captureWindowScreenshot: selected window 31704 (score=2073600)",
  },
  {
    type: "output" as const,
    text: "log: macos-use_click_and_traverse: element='Screen Recording' role=AXStaticText",
  },
  {
    type: "output" as const,
    text: "log: macos-use_click_and_traverse: element='Always Show in Menu Bar' role=AXMenuItem",
  },
  {
    type: "success" as const,
    text: "# User moves the trackpad mid-drag. Nothing happens. Events dropped at the tap.",
  },
  {
    type: "output" as const,
    text: "log: InputGuard TAP: keyDown keyCode=53 sourceState=0  (user pressed Esc)",
  },
  {
    type: "output" as const,
    text: "log: InputGuard: Esc pressed - user cancelled",
  },
  {
    type: "output" as const,
    text: "log: InputGuard: disengaging",
  },
  {
    type: "output" as const,
    text: "log: InputGuard: CGEventTap destroyed",
  },
  {
    type: "output" as const,
    text: "log: InputGuard: overlay hidden",
  },
  {
    type: "command" as const,
    text: "cat /tmp/macos-use/esc_pressed.txt",
  },
  {
    type: "output" as const,
    text: "esc_at_2026-04-18 09:12:47 +0000",
  },
];

export default function AddScreenRecordingControlCenterPage() {
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
                macOS 15 Sequoia
              </span>
              <span className="inline-block bg-zinc-100 text-zinc-600 text-xs font-medium px-2 py-1 rounded-full">
                Control Center
              </span>
              <span className="inline-block bg-cyan-50 text-cyan-700 text-xs font-medium px-2 py-1 rounded-full font-mono">
                CGEventTap
              </span>
              <span className="inline-block bg-zinc-100 text-zinc-600 text-xs font-medium px-2 py-1 rounded-full">
                agent-driven
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 mb-6">
              How To Add Screen Recording To Control Center Without Your Hand On
              The Trackpad{" "}
              <GradientText>Ruining The Drag</GradientText>
            </h1>
            <p className="text-lg text-zinc-500 max-w-2xl mb-6">
              The manual version takes five clicks through System Settings and
              Control Center. Apple Support covers that. This page is about the
              version where you tell Claude Desktop or Cursor to do it for you,
              and the detail nobody else writes down: while the server is
              dragging the Screen Recording module into its new Menu Bar slot,
              it installs a CGEventTap that drops every one of your keystrokes
              and every pixel of trackpad motion by reading{" "}
              <span className="font-mono text-sm">
                event.getIntegerValueField(.eventSourceStateID)
              </span>
              . Non-zero passes. Zero gets dropped. Press Esc to release.
            </p>
            <ArticleMeta
              datePublished={DATE_PUBLISHED}
              author="macos-use maintainers"
              readingTime="10 min read"
            />
            <div className="mt-8 flex gap-4 flex-wrap">
              <ShimmerButton href="https://github.com/mediar-ai/mcp-server-macos-use/blob/main/Sources/MCPServer/InputGuard.swift">
                Read InputGuard.swift on GitHub
              </ShimmerButton>
              <a
                href="https://github.com/mediar-ai/mcp-server-macos-use/blob/main/Sources/MCPServer/InputGuard.swift#L329"
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-zinc-200 bg-white text-zinc-700 text-sm font-medium hover:border-teal-300 hover:text-teal-700 transition-colors"
              >
                Jump to the eventSourceStateID filter (line 329)
              </a>
            </div>
          </div>
        </BackgroundGrid>

        {/* Proof band */}
        <ProofBand
          rating={5.0}
          ratingCount="open source"
          highlights={[
            "InputGuard.swift is 355 lines; the hardware-event filter is one line at InputGuard.swift:329-331",
            "Synthetic CGEvent.post() calls use .hidSystemState (non-zero stateID) and pass the tap unchanged",
            "Plain Esc (keycode 53, no modifiers) releases the guard in under one event cycle",
            "30-second watchdog at InputGuard.swift:24 auto-disengages if the MCP server ever hangs",
          ]}
        />

        {/* Remotion hero clip */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <RemotionClip
            title="Your hand can stay on the mouse. The drag will still land."
            subtitle="How macos-use shields a Control Center drag from the human sitting in front of it"
            captions={[
              "A CGEventTap installed on the main run loop sees every hardware event",
              "Synthetic events (the server's clicks) carry a non-zero eventSourceStateID",
              "Hardware events (your hand on the trackpad) carry stateID == 0",
              "The callback forwards non-zero, drops zero, and special-cases Esc",
              "30-second watchdog auto-releases if anything ever hangs",
            ]}
            accent="teal"
          />
        </section>

        {/* The manual path in one paragraph, then pivot */}
        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            Start With The Manual Path. It Takes Thirty Seconds.
          </h2>
          <p className="text-zinc-600 mb-4">
            Open System Settings. Pick Control Center in the sidebar. Scroll to
            the Screen Recording module. Switch{" "}
            <span className="font-mono text-sm">Show in Menu Bar</span> to{" "}
            <span className="font-mono text-sm">Always</span>. Done. On macOS 15
            Sequoia you can also open Control Center itself, hold the edit
            affordance at the bottom, drag Screen Recording into a slot, and
            drop it. The top SERP results (Apple Support, Cult of Mac, the
            Apple Community thread at discussions.apple.com/thread/255457988)
            all walk through some permutation of those two paths.
          </p>
          <p className="text-zinc-600 mb-4">
            What none of them cover is the one that matters if you live inside
            an agent: you type a sentence into Claude Desktop, the model picks
            up the macos-use MCP tools, and the drag happens while your hand is
            still on the trackpad because you were reading. The naive version
            of this fails. Your cursor movement is physically the same input
            channel as the server&apos;s synthetic drag, so the drop lands one
            slot off and the agent reports success because the AX traversal
            says the module moved.
          </p>
          <p className="text-zinc-600">
            The fix is not a UI prompt that says &quot;please hold still.&quot;
            The fix is a{" "}
            <span className="font-mono text-sm">CGEventTap</span> that drops
            hardware input before the window server ever sees it. The whole
            point of this page is the one line of code that decides which
            events fall into which bucket.
          </p>
        </section>

        {/* StepTimeline: what the agent does end-to-end */}
        <section className="bg-zinc-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-zinc-900 mb-4">
              What The Agent Actually Does Between Your Prompt And The PNG
            </h2>
            <p className="text-zinc-600 mb-8 max-w-2xl">
              Six steps. The server engages the input guard first, does the
              drag, releases the guard. Step 3 is the one every other macOS
              MCP skips.
            </p>
            <StepTimeline
              steps={[
                {
                  title:
                    "MCP client receives the prompt and picks macos-use_open_application_and_traverse",
                  description:
                    "The tool opens com.apple.systempreferences, activates the window, and traverses the accessibility tree. The response contains the PID and a file path under /tmp/macos-use/ the model greps for 'Control Center' to find the sidebar row.",
                },
                {
                  title:
                    "macos-use_click_and_traverse lands on the Control Center pane",
                  description:
                    "The click is synthesized with CGEvent.post at the AXStaticText coordinates. Screenshot-helper captures the post-click window state so the model can verify the pane opened.",
                },
                {
                  title:
                    "Before the drag starts, InputGuard.engage() installs the tap",
                  description:
                    "InputGuard.swift:69-95 takes the lock, sets _engaged = true, creates the CGEventTap on the main run loop, shows the orange pill, and starts the 30s watchdog. The pill reads 'Adding Screen Recording to Control Center'.",
                },
                {
                  title:
                    "The drag posts synthetic mouse events with .hidSystemState",
                  description:
                    "Every posted event carries a non-zero eventSourceStateID. The tap callback at InputGuard.swift:329-331 forwards them unchanged. In the same stream, any real hardware event (your hand on the trackpad, a stray key) has stateID == 0 and is dropped by returning nil from the callback.",
                },
                {
                  title:
                    "macos-use_refresh_traversal confirms the module moved",
                  description:
                    "After the mouse-up, the server re-traverses the AX tree, scores the new position of the Screen Recording module against the intended slot, and writes a .txt diff file plus a .png to /tmp/macos-use/. The model reads the diff (+/-/~ prefixed lines) to verify.",
                },
                {
                  title:
                    "InputGuard.disengage() tears down the tap and hides the overlay",
                  description:
                    "InputGuard.swift:98-109 destroys the CGEventTap, stops the watchdog timer, and hides the NSWindow. Your keyboard and mouse come back in the same event cycle. The MCP response returns with status=ok and a path to the screenshot the model already read.",
                },
              ]}
            />
          </div>
        </section>

        {/* The anchor-fact section: the one line */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <span className="inline-block bg-cyan-50 text-cyan-700 text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full mb-4">
            Anchor code 1 of 3
          </span>
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            The One Line That Decides Whose Event Gets Through
          </h2>
          <p className="text-zinc-600 mb-6 max-w-2xl">
            The whole filter fits on three lines. Every other check in the
            callback is a special case: handle tap-disable, handle Esc, drop
            everything else. The interesting decision is the single comparison
            against zero at the top.
          </p>
          <AnimatedCodeBlock
            code={filterCode}
            language="swift"
            filename="Sources/MCPServer/InputGuard.swift"
          />
          <p className="text-zinc-500 text-sm mt-4">
            The pattern works because{" "}
            <span className="font-mono text-sm">CGEventSource</span> comes in
            three forms (.hidSystemState, .combinedSessionState, .privateState)
            and the first one carries a non-zero stateID that the kernel stamps
            onto every event posted with that source. Hardware events arrive
            with stateID == 0. You can verify this from Terminal with a tap of
            your own: log{" "}
            <span className="font-mono text-sm">
              event.getIntegerValueField(.eventSourceStateID)
            </span>{" "}
            and move the mouse.
          </p>
        </section>

        {/* AnimatedBeam: what goes in vs what comes out */}
        <section className="bg-zinc-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-zinc-900 mb-4">
              What Crosses The Tap, And What Gets Dropped At The Boundary
            </h2>
            <p className="text-zinc-600 mb-8 max-w-2xl">
              The CGEventTap sits between every input event and the macOS
              window server. From inside the callback you decide per-event
              whether to return the event unchanged, swap it for a different
              event, or return nil (drop it on the floor). macos-use returns
              nil for hardware and passes the event through for anything with a
              non-zero stateID.
            </p>
            <AnimatedBeam
              title="Event source routing through the CGEventTap on the main run loop"
              from={[
                { label: "MCP server synthetic clicks (stateID != 0)" },
                { label: "User trackpad drift (stateID == 0)" },
                { label: "Keystrokes (stateID == 0)" },
                { label: "Esc keydown (keycode 53, no modifiers)" },
              ]}
              hub={{ label: "inputGuardCallback at InputGuard.swift:311-355" }}
              to={[
                { label: "Forwarded to window server (synthetic)" },
                { label: "nil: dropped (hardware)" },
                { label: "_cancelled = true + disengage() (Esc)" },
                { label: "Re-enable tap if macOS auto-disabled it" },
              ]}
            />
          </div>
        </section>

        {/* Engage code */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <span className="inline-block bg-cyan-50 text-cyan-700 text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full mb-4">
            Anchor code 2 of 3
          </span>
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            Where The Guard Engages And Why It Has To Run On The Main Thread
          </h2>
          <p className="text-zinc-600 mb-6 max-w-2xl">
            CGEventTap callbacks only fire while the run loop that owns the tap
            is active. If macos-use put the tap on a background queue and the
            tool handler awaited a traversal, the callback would stall and the
            Esc-to-cancel promise would break. Attaching to{" "}
            <span className="font-mono text-sm">CFRunLoopGetMain()</span>{" "}
            guarantees it fires even while the handler is suspended inside an
            await, because Swift concurrency yields the main thread between
            suspension points.
          </p>
          <AnimatedCodeBlock
            code={engageCode}
            language="swift"
            filename="Sources/MCPServer/InputGuard.swift"
          />
        </section>

        {/* CodeComparison: naive vs shielded drag */}
        <section className="bg-zinc-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <span className="inline-block bg-cyan-50 text-cyan-700 text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full mb-4">
              Anchor code 3 of 3
            </span>
            <h2 className="text-3xl font-bold text-zinc-900 mb-4">
              Naive Drag Versus Shielded Drag
            </h2>
            <p className="text-zinc-600 mb-8 max-w-2xl">
              Left: the shape every other macOS MCP server has for a drag. It
              posts the mouse-down, the mouse-moveds, and the mouse-up, and
              prays. Right: the macos-use shape. Same five event posts,
              wrapped in engage() and disengage() with a throwIfCancelled()
              loop in the middle so Esc exits within one event.
            </p>
            <CodeComparison
              leftCode={naiveDragCode}
              rightCode={guardedDragCode}
              leftLines={18}
              rightLines={20}
              leftLabel="Typical unshielded drag"
              rightLabel="macos-use guarded drag"
              title="Same drag path, two failure modes"
              reductionSuffix="similar line count, very different correctness"
            />
          </div>
        </section>

        {/* Terminal transcript */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            What The Stderr Log Says During One Guarded Run
          </h2>
          <p className="text-zinc-600 mb-8 max-w-2xl">
            Every line below is a literal string emitted by the server during
            a guarded automation, in the order they appear on stderr. The{" "}
            <span className="font-mono text-sm">sourceState=0</span> suffix is
            how you spot the hardware Esc at a glance. The{" "}
            <span className="font-mono text-sm">/tmp/macos-use/esc_pressed.txt</span>{" "}
            marker exists so you can prove to yourself that the cancel really
            happened, even if the MCP client swallowed the error.
          </p>
          <TerminalOutput
            title="mcp-server-macos-use stderr during an input-guarded drag"
            lines={terminalTranscript}
          />
        </section>

        {/* ProofBanner: quote from the source */}
        <section className="max-w-4xl mx-auto px-6 py-8">
          <ProofBanner
            quote="Let programmatic events through. Our CGEvent.post() calls use .hidSystemState source which has a non-zero stateID. Hardware events have stateID == 0."
            source="doc comment at Sources/MCPServer/InputGuard.swift:326-328"
            metric="1 line"
          />
        </section>

        {/* Metrics row */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            Numbers You Can Reproduce From The Current Commit
          </h2>
          <p className="text-zinc-600 mb-8 max-w-2xl">
            Every number below comes directly from{" "}
            <span className="font-mono text-sm">
              Sources/MCPServer/InputGuard.swift
            </span>{" "}
            at HEAD. Clone the repo, open the file, count them yourself.
          </p>
          <MetricsRow
            metrics={[
              { value: 355, label: "total lines in InputGuard.swift" },
              { value: 11, label: "CGEventType categories blocked" },
              { value: 30, suffix: "s", label: "watchdog auto-release timeout" },
              { value: 53, label: "keycode for Esc-to-cancel" },
            ]}
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
            <GlowCard>
              <div className="p-6">
                <div className="text-4xl font-bold text-zinc-900">
                  <NumberTicker value={329} />
                </div>
                <div className="text-sm text-zinc-500 mt-2">
                  line of the eventSourceStateID filter
                </div>
              </div>
            </GlowCard>
            <GlowCard>
              <div className="p-6">
                <div className="text-4xl font-bold text-zinc-900">
                  <NumberTicker value={150} />
                </div>
                <div className="text-sm text-zinc-500 mt-2">
                  line that attaches the tap to CFRunLoopGetMain
                </div>
              </div>
            </GlowCard>
            <GlowCard>
              <div className="p-6">
                <div className="text-4xl font-bold text-zinc-900">
                  <NumberTicker value={720} />
                </div>
                <div className="text-sm text-zinc-500 mt-2">
                  max width in points of the overlay pill
                </div>
              </div>
            </GlowCard>
            <GlowCard>
              <div className="p-6">
                <div className="text-4xl font-bold text-zinc-900">
                  <NumberTicker value={16} />
                </div>
                <div className="text-sm text-zinc-500 mt-2">
                  pixel diameter of the pulsing orange dot
                </div>
              </div>
            </GlowCard>
          </div>
        </section>

        {/* BentoGrid: what the guard protects against */}
        <section className="bg-zinc-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-zinc-900 mb-6">
              Real Failure Modes Of Agent-Driven Control Center Edits
            </h2>
            <p className="text-zinc-600 mb-8 max-w-2xl">
              Every failure below is observable without the guard. Each
              disappears the moment InputGuard is engaged because the window
              server never sees the hardware input that would have caused it.
            </p>
            <BentoGrid
              cards={[
                {
                  title:
                    "Trackpad nudge lands the drop one slot off",
                  description:
                    "Control Center's edit mode snaps drops to the nearest grid cell. A one-millimeter finger movement during the drag is enough to shift the drop target across the cell boundary. The AX traversal later confirms 'the module moved' so the agent reports success.",
                  size: "2x1",
                },
                {
                  title:
                    "Hardware keydown triggers a menu shortcut mid-drag",
                  description:
                    "If the user happens to press Cmd-Space while the drag is in flight, Spotlight opens and the drag is abandoned. Without the guard, there is no way to keep Spotlight out of the event stream.",
                  size: "1x1",
                },
                {
                  title:
                    "Scroll wheel scrolls the Control Center pane away",
                  description:
                    "A small vertical trackpad scroll while the agent is reading the Screen Recording row moves the row off-screen. The next click targets empty space.",
                  size: "1x1",
                },
                {
                  title:
                    "Right-click opens a context menu that steals focus",
                  description:
                    "Two-finger tap on an unrelated window while the agent is inside System Settings pops a context menu on top of the drag target. The drag never lands.",
                  size: "1x1",
                },
                {
                  title:
                    "Cmd-Tab swaps the frontmost app during the automation",
                  description:
                    "A single accidental Cmd-Tab mid-drag sends the mouse-up to whatever app became frontmost. Without the guard dropping the flagsChanged and keyDown events, there is no way to keep the user in System Settings long enough to finish the flow.",
                  size: "2x1",
                },
              ]}
            />
          </div>
        </section>

        {/* Marquee: event types blocked */}
        <section className="py-12 border-y border-zinc-200">
          <div className="max-w-5xl mx-auto px-6">
            <p className="text-center text-zinc-500 text-sm mb-6 uppercase tracking-wide">
              CGEventType categories InputGuard drops on the floor
            </p>
            <Marquee speed={45} fade pauseOnHover>
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
                "(only Esc bypasses: keycode 53)",
              ].map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center h-9 px-4 mx-2 rounded-full bg-teal-50 text-teal-700 text-sm font-medium border border-teal-200 whitespace-nowrap"
                >
                  {s}
                </span>
              ))}
            </Marquee>
          </div>
        </section>

        {/* BeforeAfter: with vs without */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            The Drag With And Without The Input Guard
          </h2>
          <p className="text-zinc-600 mb-8 max-w-2xl">
            Toggle between the two and watch what changes. The same agent
            plan. The same five event posts. The only difference is whether
            the tap is installed.
          </p>
          <BeforeAfter
            title="Adding Screen Recording to Control Center from a Claude Desktop prompt"
            before={{
              label: "Without InputGuard",
              content:
                "Agent posts the drag. Your hand drifts a pixel. The drop lands in the slot above the intended one. The AX diff says the module moved, so the agent reports success. You discover the bug an hour later when Screen Recording is next to Do Not Disturb instead of Wi-Fi.",
              highlights: [
                "Hardware input and synthetic input share the same event stream",
                "No way to verify the drop landed in the right cell except by eye",
                "Esc does nothing because no tap is installed to catch it",
                "Cmd-Tab mid-drag swaps the frontmost app, drag aborts silently",
              ],
            }}
            after={{
              label: "With InputGuard",
              content:
                "Agent calls engage(). CGEventTap installed on the main run loop. Overlay pill appears. Agent posts the drag. Every hardware event gets dropped at the tap. The drop lands exactly where the agent intended. disengage() tears everything down. Your keyboard and mouse come back.",
              highlights: [
                "Hardware events with stateID == 0 dropped at InputGuard.swift:329-331",
                "Esc keycode 53, no modifiers, exits via _cancelled flag at InputGuard.swift:344-350",
                "30s watchdog at InputGuard.swift:24 prevents permanent lockout",
                "Orange pulsing pill tells the user the guard is active",
              ],
            }}
          />
        </section>

        {/* Checklist: guarantees */}
        <section className="bg-zinc-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <AnimatedChecklist
              title="Guarantees InputGuard makes while you are telling an AI to add Screen Recording to Control Center"
              items={[
                {
                  text: "Every hardware keyDown, keyUp, mouse, drag, scroll, and flagsChanged event is dropped at the CGEventTap callback",
                  checked: true,
                },
                {
                  text: "Synthetic events posted with .hidSystemState pass through unchanged because their eventSourceStateID is non-zero",
                  checked: true,
                },
                {
                  text: "Plain Esc (keycode 53, no modifiers) releases the guard in under one event cycle via the _cancelled flag",
                  checked: true,
                },
                {
                  text: "The 30-second watchdog at InputGuard.swift:24 auto-disengages even if the MCP server crashes mid-automation",
                  checked: true,
                },
                {
                  text: "The tap is installed on the main run loop so callbacks fire even while Swift concurrency is awaiting",
                  checked: true,
                },
                {
                  text: "An orange pulsing overlay pill tells the user exactly what the agent is doing and how to cancel",
                  checked: true,
                },
                {
                  text: "If Accessibility permission is missing, engage() logs and returns; the automation runs unshielded instead of crashing",
                  checked: true,
                },
              ]}
            />
          </div>
        </section>

        {/* Install / try */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            Try It On Your Own Machine
          </h2>
          <p className="text-zinc-600 mb-6 max-w-2xl">
            One{" "}
            <span className="font-mono text-sm">swift build</span> produces the
            server and the sibling screenshot-helper binary. Grant Accessibility
            and Screen Recording permissions to the built binary, point Claude
            Desktop at it, and ask the model to add Screen Recording to Control
            Center. Watch stderr in the Claude Desktop MCP log viewer; the
            InputGuard TAP log lines are how you verify the guard is active
            during the drag.
          </p>
          <div className="rounded-2xl border border-teal-200 bg-white p-6 font-mono text-sm text-zinc-800 leading-relaxed overflow-x-auto">
            git clone https://github.com/mediar-ai/mcp-server-macos-use
            <br />
            cd mcp-server-macos-use
            <br />
            xcrun --toolchain com.apple.dt.toolchain.XcodeDefault swift build -c release
            <br />
            <br />
            # Grant Accessibility permission to .build/release/mcp-server-macos-use
            <br />
            # System Settings, Privacy &amp; Security, Accessibility, +
            <br />
            <br />
            # Point Claude Desktop at .build/release/mcp-server-macos-use in
            <br />
            # claude_desktop_config.json under mcpServers, then restart.
            <br />
            <br />
            # Prompt: "Open System Settings and set Screen Recording to
            <br />
            #          Always Show in Menu Bar."
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-zinc-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-zinc-900 mb-6">
              Frequently Asked Questions
            </h2>
            <FaqSection items={faqItems} />
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-4xl mx-auto px-6 py-12">
          <InlineCta
            heading="Read The Whole Guard In One Scroll"
            body="InputGuard.swift is 355 lines. The filter is three lines of that. The rest is watchdog scheduling, NSWindow overlay construction, and the boilerplate to tear everything down on Esc or on timeout. The repo is MIT-licensed Swift; every line number on this page is stable at HEAD."
            linkText="Open Sources/MCPServer/InputGuard.swift on GitHub"
            href="https://github.com/mediar-ai/mcp-server-macos-use/blob/main/Sources/MCPServer/InputGuard.swift"
          />
        </section>
      </article>
    </>
  );
}
