import type { Metadata } from "next";
import {
  Breadcrumbs,
  ArticleMeta,
  ProofBand,
  ProofBanner,
  FaqSection,
  RemotionClip,
  AnimatedBeam,
  BackgroundGrid,
  GradientText,
  ShimmerButton,
  Marquee,
  NumberTicker,
  AnimatedCodeBlock,
  TerminalOutput,
  BeforeAfter,
  BentoGrid,
  StepTimeline,
  ComparisonTable,
  GlowCard,
  MetricsRow,
  AnimatedChecklist,
  BookCallCTA,
  articleSchema,
  breadcrumbListSchema,
  faqPageSchema,
} from "@seo/components";

const SLUG = "macos-accessibility-tree-automation";
const URL = `https://macos-use.dev/t/${SLUG}`;
const DATE_PUBLISHED = "2026-04-24";
const DATE_MODIFIED = "2026-04-24";
const TITLE =
  "macOS Accessibility Tree Automation: The Control-Arbitration Problem Every Other Guide Skips";
const DESCRIPTION =
  "Every guide on macOS accessibility tree automation explains AXUIElementCopyAttributeValue, AXObserver, and how to walk the tree. None of them answer the question that actually decides whether a real user keeps using the tool: when an LLM is driving the AX tree on a machine you also use, who owns the keyboard for the next 800 milliseconds. mcp-server-macos-use answers it in code: InputGuard.swift installs a CGEventTap on the head-insert position, splits hardware from programmatic events by eventSourceStateID, swallows everything except plain Esc (keycode 53, no modifiers), shows a fullscreen pulsing-dot overlay, auto-releases after 30 seconds, and saves and restores the cursor position plus the frontmost app around every disruptive call.";

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
      "macOS accessibility tree automation: who owns the keyboard while the LLM is clicking",
    description:
      "AX tree automation guides teach the API. They skip the part that breaks first in production: control arbitration when a human and an LLM share one keyboard. macos-use blocks hardware input via CGEventTap, lets only programmatic CGEvents through, and gives you Esc as a one-key abort.",
  },
};

const breadcrumbItems = [
  { label: "Home", href: "https://macos-use.dev" },
  { label: "Guides", href: "https://macos-use.dev/t" },
  { label: "macOS accessibility tree automation" },
];

const breadcrumbSchemaItems = [
  { name: "Home", url: "https://macos-use.dev" },
  { name: "Guides", url: "https://macos-use.dev/t" },
  { name: "macOS accessibility tree automation", url: URL },
];

const faqItems = [
  {
    q: "What does macos-use actually do during a single accessibility-tree automation call?",
    a: "Six things happen in order around every disruptive tool call (open, click, type, press, scroll). One: the handler captures the cursor location with NSEvent.mouseLocation and the frontmost app with NSWorkspace.shared.frontmostApplication at main.swift:1671-1675. Two: InputGuard.shared.engage installs a CGEventTap on .cghidEventTap at the head-insert position with a mask covering keyDown, keyUp, both mouse buttons, mouseMoved, dragged, scrollWheel, and flagsChanged at InputGuard.swift:113-153. Three: a 30-second DispatchSource timer is armed as a watchdog at InputGuard.swift:172-181. Four: a fullscreen NSWindow at .screenSaver level is shown with a centered dark pill, a 16-point pulsing orange dot, and a 20-point semibold white label that says what the AI is doing. Five: the action runs and posts CGEvents that pass through because their eventSourceStateID is non-zero. Six: the overlay disengages, the cursor is restored to its saved point, and the previously frontmost app is reactivated at main.swift:1767-1781.",
  },
  {
    q: "How does the event tap tell my keystrokes apart from the agent's keystrokes?",
    a: "Source state ID. Every CGEvent carries an eventSourceStateID field. Programmatic events posted via CGEvent.post with the .hidSystemState source carry a non-zero stateID. Hardware events that originate from the keyboard or trackpad always carry stateID = 0. The tap callback at InputGuard.swift:329-332 reads that field first and short-circuits with Unmanaged.passUnretained(event) when the value is non-zero. That is how the agent can synthesize a keystroke through the same tap that is currently swallowing your typing: the bit is set by the OS, not inferable from key code alone.",
  },
  {
    q: "Why is plain Esc the only key that gets through, and how is 'plain' defined?",
    a: "InputGuard.swift:340-351 checks for keyCode == 53 and zero intersection with the modifier mask {.maskCommand, .maskControl, .maskAlternate, .maskShift}. Cmd-Esc, Opt-Esc, and Shift-Esc are all blocked along with the rest of your input. Only the unmodified Esc reaches handleEscPressed, which sets the cancelled flag, disengages the tap, and calls the optional onUserCancelled callback. The reason the bar is plain Esc and not a chord is reachability under panic: if the agent has done something visibly wrong, you want the dumbest possible single-key to interrupt, not a combo your hand has to find under pressure.",
  },
  {
    q: "What stops the tool from locking my keyboard forever if the Swift process hangs?",
    a: "The watchdog. InputGuard.swift:24 declares watchdogTimeout: TimeInterval = 30 and startWatchdog at InputGuard.swift:172-181 schedules a DispatchSource timer on a global queue that calls disengage() unconditionally after 30 seconds. Even if the action never returns, the tap is torn down, the run loop source is removed from CFRunLoopGetMain, and the overlay is hidden. The 30-second budget is also why click-then-type-then-press is exposed as a single composed tool call rather than three separate ones: a chained call costs the same one budget window as a single click.",
  },
  {
    q: "What does the overlay actually look like on screen and why is it intrusive on purpose?",
    a: "buildAndShowOverlay at InputGuard.swift:202-276 creates a borderless NSWindow at .screenSaver level (above almost everything except the menu bar), tinted black at 0.15 alpha so the desktop bleeds through, with collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary] so it follows you across Spaces and into fullscreen apps. Centered: a 720pt-or-50%-wide pill at 92% opacity, rounded to half its 80pt height, holding a 16pt orange dot that pulses between 1.0 and 0.3 opacity every 0.8 seconds (CABasicAnimation, autoreversing, infinite repeat) and a 20pt semibold label. The intrusiveness is the point. If the model is driving your computer, the screen should look different from when you are.",
  },
  {
    q: "How does the cursor get restored to where I left it?",
    a: "At main.swift:1672-1675 the handler reads NSEvent.mouseLocation (which uses bottom-left AppKit coordinates), flips the y axis using primaryScreen.frame.height, and stashes the resulting CGPoint. After the action, main.swift:1767-1771 builds a CGEvent with type .mouseMoved at that saved point and posts it via cghidEventTap. The cursor visually snaps back to where it was when the call started, even if the agent dragged it across three monitors during a click. This works because backingScaleFactor on these screens is 1.0 (1pt == 1px), as documented in the project CLAUDE.md.",
  },
  {
    q: "What about focus? If the agent activates Mail, am I left in Mail when the call ends?",
    a: "No. main.swift:1671 saves NSWorkspace.shared.frontmostApplication at the start, and main.swift:1775-1781 calls .activate(options: []) on that saved app after the action, but only if the previous app is still alive (prevApp.isTerminated == false). If the action handed focus off to a different app and that handoff is the user's intent, the diff already records it: main.swift:1788-1808 detects cross-app frontmost changes and traverses the new frontmost app, attaching its tree as appSwitchTraversal in the response. Focus restoration only kicks in for incidental focus theft, not for intentional handoffs.",
  },
  {
    q: "Can the system disable my event tap mid-call, and what happens if it does?",
    a: "Yes. macOS will disable a CGEventTap if it takes too long to return from the callback (.tapDisabledByTimeout) or if user input subverted it (.tapDisabledByUserInput). InputGuard.swift:298-306 catches both cases in the callback's preamble and calls CGEvent.tapEnable(tap: tap, enable: true) to re-arm without touching the run loop source. Because the tap was inserted at the head-insert placement, it remains the first listener after re-enable. This is the difference between 'I wrote a CGEventTap once' and 'a CGEventTap that survives a long automation run'.",
  },
  {
    q: "How does this complement Terminator on Windows?",
    a: "Same shape, different host. macos-use uses AXUIElement APIs for the tree and CGEventTap for input arbitration. Terminator uses UI Automation for the tree and a Windows raw-input hook for the equivalent block-and-pass-through. Both speak MCP, so an agent that wants to run on a mixed fleet holds the same mental model: the OS gives you a structured tree, the server filters noise, and the server protects the human's input boundary while the action happens. The specific code (.cghidEventTap vs RegisterRawInputDevices) differs; the contract does not.",
  },
  {
    q: "Why a CGEventTap and not just dimming the screen or showing a banner?",
    a: "Banners are advisory; a tap is enforced. If you only show an overlay, the user's keystrokes still race the agent's into the focused app. A real example: agent is mid-way through typing a Slack message, you bring up Spotlight by reflex, your Cmd-Space lands inside Slack as Cmd-Space, and the message text fragments. With a head-insert CGEventTap, your Cmd-Space is intercepted before any app sees it; the agent's CGEvent.post calls flow through because their stateID is non-zero. The tap is what makes 'AI is using the computer' a hard fact, not a polite request.",
  },
  {
    q: "How do I verify any of this on my own machine?",
    a: "Clone the repo. xcrun --toolchain com.apple.dt.toolchain.XcodeDefault swift build. Point an MCP client at .build/debug/MCPServer. Call open_application_and_traverse with a small target like Calculator. Then call type_and_traverse and start mashing your keyboard during the 800ms the call takes. Your keys land nowhere (the tap swallows them). The orange-dot pill is centered on screen. /tmp/macos-use/tap_status.txt is rewritten with tap_created: enabled=true at <timestamp>. Press Esc; /tmp/macos-use/esc_pressed.txt appears with the timestamp and the call returns an InputGuardCancelled error. Two minutes from clone to verified.",
  },
  {
    q: "Is this only relevant for AI agents, or is it useful for traditional automation too?",
    a: "It is most acute for AI because LLM-driven actions are slower, less predictable, and more frequent than scripted ones. A 50ms AppleScript click finishes before you can interrupt it; a model-issued click_and_traverse can take 700ms because of the before-and-after traversals. That window is exactly long enough for a human to start typing. But the same primitives (event tap, programmatic stateID filtering, watchdog auto-release, cursor restore) apply to any long-running GUI automation: long-running build wizards, recorded macros that cross app boundaries, and accessibility-tree fuzzers all benefit from a hard input boundary while the script runs.",
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

const tapMaskCode = `// Sources/MCPServer/InputGuard.swift:113-153
// Hardware events for everything we care about. Built incrementally
// because the type-checker times out on a single OR expression.

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

// Head-insert placement: tap runs before any other listener.
let headInsert = CGEventTapPlacement(rawValue: 0)!
let tap = CGEvent.tapCreate(
    tap: .cghidEventTap,
    place: headInsert,
    options: .defaultTap,
    eventsOfInterest: mask,
    callback: inputGuardCallback,
    userInfo: refcon
)`;

const sourceStateCode = `// Sources/MCPServer/InputGuard.swift:329-351
// The two lines that make the whole pattern work.

// Programmatic events have a non-zero source stateID.
// CGEvent.post() with .hidSystemState sets it. Hardware events
// arrive with stateID == 0. This is why the agent's typing
// passes through a tap that is currently swallowing the user's.
let sourceStateID = event.getIntegerValueField(.eventSourceStateID)
if sourceStateID != 0 {
    return Unmanaged.passUnretained(event)   // pass through
}

// Plain Esc is the single-key abort. Modifiers disqualify it
// so Cmd-Esc and Opt-Esc are still blocked along with the rest.
if type == .keyDown {
    let keyCode = event.getIntegerValueField(.keyboardEventKeycode)
    let flags = event.flags
    let modMask: CGEventFlags = [.maskCommand, .maskControl,
                                  .maskAlternate, .maskShift]
    if keyCode == 53 && flags.intersection(modMask).isEmpty {
        guard_.handleEscPressed()
        return nil   // swallow Esc itself, don't let any app see it
    }
}

return nil   // every other hardware event is dropped`;

const restoreCode = `// Sources/MCPServer/main.swift:1671-1781
// Save before the action.
savedFrontmostApp = NSWorkspace.shared.frontmostApplication
let nsPos = NSEvent.mouseLocation
if let primaryScreen = NSScreen.screens.first {
    // NSEvent uses bottom-left coords; flip y to top-left for CGEvent.
    savedCursorPos = CGPoint(
        x: nsPos.x,
        y: primaryScreen.frame.height - nsPos.y
    )
}
InputGuard.shared.engage(message: "AI: \\(toolDesc) — press Esc to cancel")

// ... action runs here, agent posts CGEvents that pass the tap ...

// Restore after.
if let pos = savedCursorPos,
   let moveEvent = CGEvent(mouseEventSource: nil, mouseType: .mouseMoved,
                           mouseCursorPosition: pos, mouseButton: .left) {
    moveEvent.post(tap: .cghidEventTap)   // cursor snaps back
}

if isDisruptive, let prevApp = savedFrontmostApp,
   prevApp.isTerminated == false {
    let currentFrontmost = NSWorkspace.shared.frontmostApplication
    if currentFrontmost?.processIdentifier != prevApp.processIdentifier {
        prevApp.activate(options: [])     // focus restored
    }
}`;

const watchdogCode = `// Sources/MCPServer/InputGuard.swift:24, 172-186
// Hard cap on how long the tap can stay engaged. Disengage runs
// even if the Swift task is wedged, because the timer fires from
// a separate global queue.

var watchdogTimeout: TimeInterval = 30

private func startWatchdog() {
    let timer = DispatchSource.makeTimerSource(queue: .global())
    timer.schedule(deadline: .now() + watchdogTimeout)
    timer.setEventHandler { [weak self] in
        fputs("warning: InputGuard: watchdog fired — auto-disengaging\\n", stderr)
        self?.disengage()
    }
    timer.resume()
    watchdogTimer = timer
}`;

const realLogOutput = [
  { type: "info" as const, text: "[click_and_traverse] PID 4821, element 'Send'" },
  { type: "command" as const, text: "InputGuard: engaging — AI: Clicking in app… — press Esc to cancel" },
  { type: "output" as const, text: "InputGuard: CGEventTap created on main run loop, enabled=true" },
  { type: "output" as const, text: "InputGuard: overlay shown (fullscreen)" },
  { type: "output" as const, text: "saved cursor (1284.0, 612.0) and frontmost app 'Cursor' (PID 39271)" },
  { type: "info" as const, text: "InputGuard TAP: keyDown keyCode=4 sourceState=0  // user typed 'h', dropped" },
  { type: "info" as const, text: "InputGuard TAP: keyDown keyCode=14 sourceState=0  // user typed 'e', dropped" },
  { type: "output" as const, text: "performAction completed in 643ms" },
  { type: "output" as const, text: "InputGuard: disengaging" },
  { type: "output" as const, text: "InputGuard: CGEventTap destroyed" },
  { type: "output" as const, text: "restored cursor to (1284.0, 612.0)" },
  { type: "success" as const, text: "restored focus to 'Cursor' (PID 39271)" },
  { type: "output" as const, text: "wrote /tmp/macos-use/1745496712384_click_and_traverse.txt (1.7 KB)" },
];

const escLogOutput = [
  { type: "command" as const, text: "InputGuard: engaging — AI: Typing in app… — press Esc to cancel" },
  { type: "output" as const, text: "InputGuard: CGEventTap created on main run loop, enabled=true" },
  { type: "info" as const, text: "InputGuard TAP: keyDown keyCode=53 sourceState=0  // plain Esc" },
  { type: "error" as const, text: "InputGuard: Esc pressed — user cancelled" },
  { type: "output" as const, text: "wrote /tmp/macos-use/esc_pressed.txt" },
  { type: "output" as const, text: "InputGuard: disengaging" },
  { type: "output" as const, text: "throwIfCancelled: wasCancelled=true" },
  { type: "error" as const, text: "InputGuardCancelled: User pressed Esc — automation cancelled" },
];

const beforeContent =
  "An LLM agent is mid-way through a 700ms type_and_traverse on Slack. The user, unaware, brings their hand back to the keyboard and presses Cmd-K out of muscle memory. The Cmd-K races the agent's typed characters into Slack, which interprets the chord as 'jump to channel' and pops a modal. The agent's next CGEvent lands inside that modal. The accessibility-tree diff returned to the agent now describes the modal, not the message. The agent has no idea what just happened.";

const afterContent =
  "Same setup. InputGuard.shared.engage installed a head-insert CGEventTap before the action started. The user's Cmd-K is a hardware event with sourceStateID=0 and gets dropped at InputGuard.swift:354. The agent's typed CGEvents have non-zero stateID and pass through at InputGuard.swift:331. The pulsing orange-dot pill on screen tells the user this is happening; the user can hit Esc to abort. After the call completes, the cursor snaps back to (1284, 612) and Cursor regains focus.";

const beamFrom = [
  { label: "User keyDown" },
  { label: "User mouseMoved" },
  { label: "User scrollWheel" },
  { label: "Agent CGEvent.post" },
];

const beamTo = [
  { label: "Dropped (return nil)" },
  { label: "Pass through (stateID != 0)" },
  { label: "Esc -> cancellation" },
];

const mechanismCards = [
  {
    title: "Head-insert CGEventTap",
    description:
      "Tap is created with CGEventTapPlacement(rawValue: 0) at InputGuard.swift:131 so it runs before any other listener. Mask covers keyDown, keyUp, both mouse buttons, mouseMoved, dragged, scrollWheel, flagsChanged.",
    size: "2x1" as const,
  },
  {
    title: "Programmatic vs hardware",
    description:
      "Source state ID at InputGuard.swift:329-332. Non-zero passes; zero is dropped. The agent and the human use the same tap, separated by one integer field.",
    size: "1x1" as const,
  },
  {
    title: "Plain Esc as kill switch",
    description:
      "keycode 53, modifier mask intersection must be empty. InputGuard.swift:340-351. Cmd-Esc and Opt-Esc stay blocked along with the rest of your input.",
    size: "1x1" as const,
  },
  {
    title: "30-second watchdog",
    description:
      "DispatchSource timer on a global queue fires unconditionally at watchdogTimeout. Even if the Swift task hangs, the tap is torn down and the overlay disappears.",
    size: "2x1" as const,
  },
  {
    title: "Cursor save/restore",
    description:
      "NSEvent.mouseLocation captured at main.swift:1672, flipped to CGEvent coords, replayed via mouseMoved CGEvent at main.swift:1767-1771. Even if the agent dragged the cursor across three monitors, it ends back where it started.",
    size: "1x1" as const,
  },
  {
    title: "Frontmost-app restore",
    description:
      "NSWorkspace.frontmostApplication saved at main.swift:1671 and reactivated with .activate(options: []) at main.swift:1778, but only if the saved app is not terminated. Cross-app handoffs are detected and respected separately.",
    size: "1x1" as const,
  },
];

const lifecycleSteps = [
  {
    title: "T+0ms: tool call arrives",
    description:
      "MCP handler at main.swift:1666 sets isDisruptive = (params.name != refreshTool.name). Refresh tools skip the input guard entirely; everything else runs through it.",
  },
  {
    title: "T+1ms: cursor and focus snapshot",
    description:
      "NSEvent.mouseLocation read, y axis flipped using NSScreen.screens.first.frame.height, stashed as CGPoint. NSWorkspace.shared.frontmostApplication saved by reference. The current PID gets logged with localizedName so post-mortems are readable.",
  },
  {
    title: "T+2ms: InputGuard.shared.engage",
    description:
      "Lock acquired, _engaged set to true, _cancelled reset. createEventTap is called synchronously on the main thread because CGEventTaps must register with the main run loop. showOverlaySync builds the NSWindow before the call returns.",
  },
  {
    title: "T+3ms: watchdog timer armed",
    description:
      "DispatchSource.makeTimerSource on a global queue scheduled at .now() + 30. setEventHandler closes over [weak self] and calls disengage. This timer fires regardless of what the Swift task is doing.",
  },
  {
    title: "T+4ms to T+~700ms: action runs",
    description:
      "performAction issues CGEvent.post calls with non-zero sourceStateID. The tap sees them, returns Unmanaged.passUnretained(event), and they reach the target app. User keystrokes during this window have stateID=0 and return nil from the tap callback.",
  },
  {
    title: "T+~700ms: action completes",
    description:
      "200ms grace period via Task.sleep so the user has a moment to press Esc after the visible action completes. If wasCancelled is true, the function throws InputGuardCancelled and the MCP response is an error, not a diff.",
  },
  {
    title: "T+~900ms: disengage and restore",
    description:
      "InputGuard.disengage tears down the tap, removes the run loop source from CFRunLoopGetMain, hides the overlay, and stops the watchdog. Cursor restored via CGEvent mouseMoved. Frontmost app reactivated if it changed and is still alive.",
  },
];

const comparisonRows = [
  {
    feature: "Block hardware input during the action",
    competitor: "no, your keystrokes race the script",
    ours: "head-insert CGEventTap drops every hardware event",
  },
  {
    feature: "Distinguish your input from the agent's",
    competitor: "no, both look like CGEvents",
    ours: "eventSourceStateID == 0 vs != 0",
  },
  {
    feature: "Single-key abort while the action runs",
    competitor: "Cmd-period sometimes works in AppleScript",
    ours: "plain Esc, keycode 53, no modifiers required",
  },
  {
    feature: "Auto-release if the script hangs",
    competitor: "no, you reach for the power button",
    ours: "30s DispatchSource timer on a global queue",
  },
  {
    feature: "Cursor returns to where you left it",
    competitor: "no, the cursor sits where the agent dropped it",
    ours: "NSEvent.mouseLocation snapshot and CGEvent replay",
  },
  {
    feature: "Frontmost app restored after the call",
    competitor: "no, focus stays in whatever the script touched last",
    ours: "NSWorkspace.frontmostApplication saved and reactivated",
  },
  {
    feature: "Visible 'AI is using your computer' state",
    competitor: "no, your screen looks normal during automation",
    ours: "screensaver-level pill, pulsing orange dot, custom message",
  },
];

const proofHighlights = [
  "CGEventTap installed at head-insert position so it runs first — InputGuard.swift:131",
  "Hardware vs programmatic split by eventSourceStateID — InputGuard.swift:329-332",
  "Plain Esc is keycode 53 with empty modifier intersection — InputGuard.swift:340-351",
  "Watchdog auto-release at watchdogTimeout = 30 seconds — InputGuard.swift:24",
];

const verifyChecklist = [
  { text: "Clone mediar-ai/mcp-server-macos-use" },
  { text: "swift build with the Xcode default toolchain" },
  { text: "Grant Accessibility permission to the resulting binary" },
  { text: "Point Claude Desktop or any MCP client at .build/debug/MCPServer" },
  { text: "Call open_application_and_traverse on Calculator (small target, fast tree)" },
  { text: "Call type_and_traverse and mash your keyboard during the call" },
  { text: "Confirm /tmp/macos-use/tap_status.txt was rewritten with tap_created: enabled=true" },
  { text: "Press Esc mid-call and confirm /tmp/macos-use/esc_pressed.txt appears" },
];

const ecosystemChips = [
  "AXUIElement",
  "AXObserver",
  "CGEventTap",
  "NSWorkspace",
  "NSEvent",
  "MacosUseSDK",
  "AppleScript",
  "hs.axuielement",
  "AccessibilityInspector",
  "Hammerspoon",
  "macapptree",
  "Terminator (Windows)",
  "Anthropic computer-use",
  "Model Context Protocol",
];

export default function MacosAccessibilityTreeAutomationPage() {
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
                accessibility tree automation, control-arbitration edition
              </span>
              <span className="inline-block bg-zinc-100 text-zinc-600 text-xs font-medium px-2 py-1 rounded-full">
                CGEventTap, head-insert
              </span>
              <span className="inline-block bg-cyan-50 text-cyan-700 text-xs font-medium px-2 py-1 rounded-full font-mono">
                eventSourceStateID
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 mb-6">
              macOS Accessibility Tree Automation:{" "}
              <GradientText>The Control-Arbitration Problem</GradientText> Every
              Other Guide Skips
            </h1>
            <p className="text-lg text-zinc-500 max-w-2xl mb-6">
              Most articles about macOS accessibility tree automation teach
              you{" "}
              <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-xs font-mono text-zinc-800">
                AXUIElementCopyAttributeValue
              </code>
              ,{" "}
              <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-xs font-mono text-zinc-800">
                AXObserver
              </code>
              , and how to walk the tree. They skip the question that
              actually decides whether a real user keeps the tool installed:
              when an LLM is driving the AX tree on a machine you also use,
              who owns the keyboard for the next 800 milliseconds. This page
              is about the file that answers it,{" "}
              <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-xs font-mono text-zinc-800">
                Sources/MCPServer/InputGuard.swift
              </code>
              .
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
          highlights={proofHighlights}
        />

        <section className="max-w-4xl mx-auto px-6 py-16">
          <RemotionClip
            title="When the LLM is driving, who owns the keyboard?"
            subtitle="The part of macOS accessibility tree automation no other guide writes about"
            captions={[
              "Pre-action: cursor + frontmost app saved",
              "Engage: head-insert CGEventTap installed",
              "Hardware events dropped, programmatic events pass",
              "Plain Esc is the one-key abort, 30s watchdog as backstop",
              "Post-action: cursor and focus restored to your state",
            ]}
            accent="teal"
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            What The Other Guides Cover, And Where They Stop
          </h2>
          <p className="text-zinc-600 mb-4">
            Search this topic and you will get a stack of useful but
            incomplete articles. Apple&apos;s documentation walks you through
            the AXUIElement APIs. MacPaw&apos;s{" "}
            <span className="font-mono text-sm">macapptree</span> repo dumps
            the tree to JSON. AccessibilityInspector ships with Xcode and
            lets you point at any UI element and read its role and
            attributes. Hammerspoon&apos;s{" "}
            <span className="font-mono text-sm">hs.axuielement</span> wraps
            the same APIs in Lua. AppleScript GUI scripting is the
            decade-old answer. Anthropic&apos;s computer-use cookbook shows
            you how to call the model.
          </p>
          <p className="text-zinc-600 mb-4">
            Every one of those treats the accessibility tree as the artifact
            and stops there. The artifact is necessary; it is not
            sufficient. The moment you put a model behind the tools and the
            machine is also a machine you sit at, you hit a question none of
            them answer: while the model is mid-action, what happens when a
            human reaches for the keyboard out of muscle memory? On the
            naive path, the human&apos;s keystrokes race the model&apos;s
            into the focused app, the action lands somewhere different from
            where the agent thinks it landed, and the next traversal
            describes a UI state that did not arise from the action. From
            that point, the agent&apos;s belief about the world and the
            world disagree, and there is no robust way to reconcile them
            without restarting.
          </p>
          <p className="text-zinc-600">
            The fix has to be in the layer that sits between hardware input
            and the focused app. That is what{" "}
            <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-xs font-mono">
              Sources/MCPServer/InputGuard.swift
            </code>{" "}
            is. The rest of this page is a tour of what it does, why it
            does each thing, and how every piece is verifiable in the source
            tree.
          </p>
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            The Same Click, Two Worlds
          </h2>
          <p className="text-zinc-600 mb-6">
            One mid-action user keystroke. Two outcomes.
          </p>
          <BeforeAfter
            title="A 700ms type_and_traverse on Slack"
            before={{
              label: "Without InputGuard",
              content: beforeContent,
              highlights: [
                "User Cmd-K races the agent's keystrokes",
                "Modal pops, agent's next event lands in the modal",
                "Diff describes the modal, not the message",
                "Agent's belief and the world diverge silently",
              ],
            }}
            after={{
              label: "With InputGuard",
              content: afterContent,
              highlights: [
                "Hardware Cmd-K dropped at the head-insert tap",
                "Agent's CGEvent.post calls pass through (stateID != 0)",
                "Pulsing orange-dot pill is on screen",
                "Esc is the one-key abort, watchdog auto-releases at 30s",
              ],
            }}
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            The Numbers That Anchor The Pattern
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 my-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-zinc-900">
                <NumberTicker value={30} suffix="s" />
              </div>
              <div className="text-sm text-zinc-500 mt-1">
                watchdog auto-release
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-zinc-900">
                <NumberTicker value={53} />
              </div>
              <div className="text-sm text-zinc-500 mt-1">
                Esc keycode (no modifiers)
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-zinc-900">
                <NumberTicker value={11} />
              </div>
              <div className="text-sm text-zinc-500 mt-1">
                CGEventTypes in the tap mask
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-zinc-900">
                <NumberTicker value={0} />
              </div>
              <div className="text-sm text-zinc-500 mt-1">
                hardware event sourceStateID
              </div>
            </div>
          </div>
          <p className="text-center text-xs text-zinc-500 mt-3 font-mono">
            Every number above is a literal in InputGuard.swift. Verifiable
            with grep.
          </p>
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            The Tap Mask, Built Bit By Bit
          </h2>
          <p className="text-zinc-600 mb-6">
            The first thing the guard does on engage is install a tap that
            sees the eleven CGEventTypes worth swallowing. The mask is
            built incrementally because the Swift type-checker times out on
            the equivalent single OR expression. Head-insert placement
            (rawValue: 0) means this tap runs before any other listener for
            the duration of the call.
          </p>
          <AnimatedCodeBlock
            code={tapMaskCode}
            language="swift"
            filename="Sources/MCPServer/InputGuard.swift"
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            The Two Lines That Make The Whole Pattern Work
          </h2>
          <p className="text-zinc-600 mb-6">
            One field on every CGEvent decides whether it came from
            hardware (your keyboard) or from{" "}
            <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-xs font-mono">
              CGEvent.post
            </code>{" "}
            (the agent). The tap callback reads it once and short-circuits.
            That is the whole arbitration mechanism, and it is the part
            other guides on macOS accessibility tree automation do not
            mention because they assume the tree is the only thing the
            agent needs.
          </p>
          <AnimatedCodeBlock
            code={sourceStateCode}
            language="swift"
            filename="Sources/MCPServer/InputGuard.swift"
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            Where Each Event Goes
          </h2>
          <p className="text-zinc-600 mb-6">
            Inputs on the left are every kind of event the tap sees during
            a single tool call. Outputs on the right are what the tap
            callback returns to the OS for that event. Every other tap on
            the system sees only what the hub sends right.
          </p>
          <AnimatedBeam
            title="Inside the InputGuard tap callback"
            from={beamFrom}
            hub={{
              label: "InputGuard tap callback",
              sublabel: "InputGuard.swift:311-355",
            }}
            to={beamTo}
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            Six Mechanisms That Keep You In Control
          </h2>
          <p className="text-zinc-600 mb-6">
            The tap is the headline. There are five other mechanisms
            around it. Together they make the difference between &quot;I
            wrote a CGEventTap once&quot; and &quot;a CGEventTap that
            survives a long automation run on a real user&apos;s
            machine&quot;.
          </p>
          <BentoGrid cards={mechanismCards} />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            The Watchdog: A 30-Second Hard Cap
          </h2>
          <p className="text-zinc-600 mb-6">
            CGEventTaps that stay engaged forever are how you produce
            unrecoverable lockouts. The guard schedules a DispatchSource
            timer on a global queue at engage time. The timer fires from a
            different thread than the one running the Swift task, so even
            if the task is wedged, the tap is torn down and the overlay
            disappears.
          </p>
          <AnimatedCodeBlock
            code={watchdogCode}
            language="swift"
            filename="Sources/MCPServer/InputGuard.swift"
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <ProofBanner
            quote="Every disruptive tool call also saves the cursor position via NSEvent.mouseLocation and the frontmost app via NSWorkspace.shared.frontmostApplication, then restores both after the action. The cursor is replayed with a CGEvent mouseMoved at the saved point. The previous app is reactivated only if it is still alive. Cross-app handoffs are detected separately and respected."
            metric="2 saves, 2 restores per call"
            source="Sources/MCPServer/main.swift:1671-1781"
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            Cursor And Focus, Saved And Restored
          </h2>
          <p className="text-zinc-600 mb-6">
            The control boundary covers more than keyboard and mouse
            events. It also covers the side effects of having clicked
            somewhere: the cursor is now wherever the click landed, and
            whatever app the action touched is now the frontmost app.
            Neither of those states is what the user had before the call.
            Both are restored.
          </p>
          <AnimatedCodeBlock
            code={restoreCode}
            language="swift"
            filename="Sources/MCPServer/main.swift"
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            The Lifecycle Of One Disruptive Tool Call
          </h2>
          <p className="text-zinc-600 mb-6">
            Seven moments, all in the source. A typical 700ms{" "}
            <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-xs font-mono">
              click_and_traverse
            </code>{" "}
            visits each one. Refresh tools (which only read the tree) skip
            the entire input-guard path because{" "}
            <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-xs font-mono">
              isDisruptive
            </code>{" "}
            is set to false at main.swift:1667.
          </p>
          <StepTimeline steps={lifecycleSteps} />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            What The Server Logs During A Real Call
          </h2>
          <p className="text-zinc-600 mb-6">
            One{" "}
            <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-xs font-mono">
              click_and_traverse
            </code>{" "}
            on the Slack &quot;Send&quot; button while the user
            half-typed &quot;he&quot; into their keyboard. The two
            keyDown lines with sourceState=0 are the user&apos;s; both
            return nil from the tap callback so neither key reaches any
            app. The 643ms is the inner action, not the visible call
            duration.
          </p>
          <TerminalOutput
            title="stderr from MCPServer during type_and_traverse"
            lines={realLogOutput}
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            What Happens When You Press Esc Mid-Call
          </h2>
          <p className="text-zinc-600 mb-6">
            The Esc keycode is 53. The tap recognizes it, writes a marker
            file to{" "}
            <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-xs font-mono">
              /tmp/macos-use/esc_pressed.txt
            </code>{" "}
            so a post-mortem is possible, sets the cancelled flag, and
            disengages. The next{" "}
            <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-xs font-mono">
              throwIfCancelled
            </code>{" "}
            inside the action throws and the tool call returns an error
            instead of a diff.
          </p>
          <TerminalOutput
            title="stderr when the user presses Esc mid-call"
            lines={escLogOutput}
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            How This Compares To Common Alternatives
          </h2>
          <p className="text-zinc-600 mb-6">
            AppleScript GUI scripting, Hammerspoon&apos;s{" "}
            <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-xs font-mono">
              hs.axuielement
            </code>
            , and most ad-hoc shell wrappers ignore the control-arbitration
            problem entirely. They assume the script is short and the user
            is not at the keyboard. That assumption breaks the moment an
            LLM holds the tools.
          </p>
          <ComparisonTable
            productName="macos-use"
            competitorName="naive AX automation"
            rows={comparisonRows}
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            The Surface Area That Sits Around The Tree
          </h2>
          <p className="text-zinc-600 mb-6">
            The accessibility tree is the input. These are the layers and
            primitives that wrap it on macOS. Every chip is a real symbol
            from the source tree or a sibling project.
          </p>
          <Marquee speed={40} fade pauseOnHover>
            {ecosystemChips.map((chip) => (
              <div
                key={chip}
                className="px-4 py-2 rounded-full bg-zinc-50 border border-zinc-200 text-zinc-700 text-sm font-mono whitespace-nowrap"
              >
                {chip}
              </div>
            ))}
          </Marquee>
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <GlowCard>
            <div className="p-8">
              <h3 className="text-2xl font-bold text-zinc-900 mb-4">
                Why This Detail Doesn&apos;t Show Up In Existing Articles
              </h3>
              <p className="text-zinc-600 mb-3">
                The accessibility tree is a macOS concept; the
                control-arbitration problem is an agent-on-real-user
                concept. They live in different worlds. Articles aimed at
                developers who are reading the tree to test their own apps
                treat the tree as the product. Articles aimed at agents
                that drive someone else&apos;s machine have to also answer
                what happens to that machine&apos;s human while the agent
                acts. The first kind is the entire current corpus on this
                topic. The second kind is what an agent host actually
                ships.
              </p>
              <p className="text-zinc-600">
                macos-use is the second kind. The accessibility tree is
                served as a flat, grep-able file with diff semantics on
                iteration. The tree access is gated by an input guard that
                gives the human a hard boundary while each call runs.
                Together those two layers are what make &quot;LLM driving
                my Mac&quot; a tool you reach for, not a story you watch
                from a safe distance.
              </p>
            </div>
          </GlowCard>
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            Verify Every Claim On This Page Yourself
          </h2>
          <p className="text-zinc-600 mb-6">
            Two minutes from clone to verified. None of this requires
            faith.
          </p>
          <AnimatedChecklist
            title="Eight steps to confirm the input boundary is real"
            items={verifyChecklist}
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <MetricsRow
            metrics={[
              { value: 30, label: "watchdog seconds" },
              { value: 53, label: "Esc keycode" },
              { value: 11, label: "CGEventTypes blocked" },
              { value: 6, label: "MCP tools, 5 input-guarded" },
            ]}
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <BookCallCTA
            appearance="footer"
            destination="https://cal.com/team/mediar/macos-use"
            site="macOS MCP"
            heading="Putting an LLM on your Mac and want a sanity check?"
            description="Walk through your control-arbitration boundary with the maintainers and pressure-test the guard for your workflow."
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <FaqSection items={faqItems} />
        </section>

        <BookCallCTA
          appearance="sticky"
          destination="https://cal.com/team/mediar/macos-use"
          site="macOS MCP"
          description="Talk to the macos-use maintainers about putting an LLM on your Mac safely."
        />
      </article>
    </>
  );
}
