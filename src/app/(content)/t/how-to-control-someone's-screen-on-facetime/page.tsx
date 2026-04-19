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
  SequenceDiagram,
  HorizontalStepper,
  ComparisonTable,
  GlowCard,
  BentoGrid,
  ProofBanner,
  InlineCta,
  articleSchema,
  breadcrumbListSchema,
  faqPageSchema,
} from "@seo/components";

const SLUG = "how-to-control-someone's-screen-on-facetime";
const URL = `https://macos-use.dev/t/${SLUG}`;
const DATE_PUBLISHED = "2026-04-18";
const DATE_MODIFIED = "2026-04-18";
const TITLE =
  "How To Control Someone's Screen On FaceTime (And Why Apple Never Let You)";
const DESCRIPTION =
  "FaceTime on macOS has SharePlay screen sharing, but the channel carries pixels, not keystrokes: a remote viewer literally cannot send input to your Mac. The closest practical substitute is the inverse pattern, a local MCP server that the remote person directs through an LLM. macos-use builds the safety case on a CGEventTap at cghidEventTap with head-insert placement (Sources/MCPServer/InputGuard.swift:131-145) whose callback only lets hardware Esc cancel the session, which the remote viewer by definition cannot press.";

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
    title: "Control someone's screen on FaceTime: why it is physically impossible, and what works instead",
    description:
      "FaceTime SharePlay is view-only. macos-use runs locally, takes AI instructions from a remote viewer, and keeps a hardware Esc kill switch the remote side cannot reach.",
  },
};

const breadcrumbItems = [
  { label: "Home", href: "https://macos-use.dev" },
  { label: "Guides", href: "https://macos-use.dev/t" },
  { label: "Control someone's screen on FaceTime" },
];

const breadcrumbSchemaItems = [
  { name: "Home", url: "https://macos-use.dev" },
  { name: "Guides", url: "https://macos-use.dev/t" },
  { name: "Control someone's screen on FaceTime", url: URL },
];

const faqItems = [
  {
    q: "Can you actually control someone's screen on a FaceTime call?",
    a: "No. FaceTime on macOS 15 has SharePlay screen sharing, which streams your display to the other party as video. There is no API inside FaceTime that routes keyboard or mouse events from the remote Mac back to yours. If you want real remote input, you use Apple's built-in Screen Sharing.app (screens:// URL) or Messages Ask To Share Screen, both of which sit on a completely different service (ARD, Apple Remote Desktop) and both of which require the host to click Accept, then pick View Only or Control. FaceTime never enters that code path.",
  },
  {
    q: "Why do the top search results all suggest Zoom or TeamViewer if the question is about FaceTime?",
    a: "Because those tools actually solve the stated problem. FaceTime's SharePlay is a one-way video transport. Zoom, Teams, TeamViewer, and Anydesk all carry an input channel alongside video. Apple's own Screen Sharing.app does too. So when someone searches how to control someone's screen on FaceTime, the honest answer has two parts: one, FaceTime itself cannot do it; two, here are the alternatives. What the SERP misses is the third option: the remote viewer gives instructions to an AI, and a local MCP server on the host machine carries out the clicks. That is the only pattern where the FaceTime call itself stays a FaceTime call.",
  },
  {
    q: "What exactly is the local MCP pattern, step by step?",
    a: "You are on FaceTime. You share your screen via the Share Screen button in the FaceTime menu bar. On your own Mac you run mcp-server-macos-use, which exposes tools like macos-use_click_and_traverse and macos-use_type_and_traverse over the Model Context Protocol. Your AI client (Claude Desktop, Cursor, an MCP-compatible agent) is connected to that server. The remote person on FaceTime narrates what they want done, you type it into the AI client, and the AI calls the MCP tool. The MCP server drives the cursor locally via CGEvent.post. The remote person sees the automation happen because FaceTime is transmitting your screen as video.",
  },
  {
    q: "Why is this safer than TeamViewer-style remote control?",
    a: "Because the input channel is physically one-way. FaceTime SharePlay does not send any keyboard or mouse data from the remote side into your Mac. Everything that clicks on your screen originated locally, either from you or from the MCP server running on your machine. Combined with macos-use's InputGuard, which creates a CGEventTap at cghidEventTap with head-insert placement (Sources/MCPServer/InputGuard.swift:131-145) and blocks every hardware event except physical Esc (keyCode 53, no modifiers, InputGuard.swift:345-349), you have a kill switch the remote person cannot reach. Pressing Esc on your own keyboard raises InputGuardCancelled, which the tool handler catches at main.swift:1847 and returns to the caller as a cancelled action.",
  },
  {
    q: "How does InputGuard know a key came from your keyboard and not from the AI?",
    a: "It checks eventSourceStateID. The callback inputGuardCallback at InputGuard.swift:311-354 pulls the field .eventSourceStateID from every CGEvent and lets it pass if the value is non-zero. Programmatic events posted by the MCP server use CGEventSource(stateID: .hidSystemState), which produces a non-zero state ID. Physical keystrokes and clicks come in with state ID zero and get suppressed, except for plain Esc which triggers handleEscPressed and aborts the automation. This is the line that makes the guard a guard and not a jail: the AI can still type, you can still kill the session.",
  },
  {
    q: "What happens if my MCP tool call gets stuck with the overlay engaged and I do not press Esc?",
    a: "A watchdog timer fires after 30 seconds and auto-disengages the guard. The code is at InputGuard.swift:172-181: startWatchdog schedules a DispatchSource timer on the global queue with deadline watchdogTimeout (30 seconds by default, adjustable on the InputGuard.shared instance). When it fires, it calls disengage, which destroys the CGEventTap, hides the overlay pill, and returns control of the keyboard to you. No lockout is possible even if the MCP server hangs.",
  },
  {
    q: "Can the remote FaceTime viewer see the orange pulsing dot and the Esc reminder?",
    a: "Yes, because it is drawn as an NSWindow at level .screenSaver (InputGuard.swift:216), and FaceTime SharePlay captures the full display composite. The overlay pill sits at the center of the screen with a pulsing system-orange dot and white text that reads AI is controlling your computer — press Esc to cancel (default message at InputGuard.swift:69). The remote person sees exactly what you see: a visible status indicator, no hidden automation. That transparency is part of the safety story.",
  },
  {
    q: "Does macos-use work while FaceTime is active, or does it fight for focus?",
    a: "It coexists. Before every disruptive tool call the server snapshots the frontmost application (main.swift:1775-1779) and restores it afterwards. FaceTime stays in the background running the SharePlay broadcast, you keep focus on whatever app the AI is driving, and when the tool call returns the previous frontmost app gets reactivated if it is not the target. The cursor position is also restored via a mouseMoved CGEvent (main.swift:1767-1772), so your mouse does not jump to a random spot when the automation ends.",
  },
  {
    q: "What if I want the remote viewer to click, not just narrate?",
    a: "Then you are not doing a FaceTime workflow anymore. You want Apple Screen Sharing.app or Messages Ask To Share Screen. Those ship with macOS, use the screens:// URL scheme, and the host clicks Allow Remote Control to hand over input. FaceTime was never designed for this, and if you try to route remote clicks through a third-party bridge you lose the main property that makes the local-MCP pattern safe: the one-way input channel. For a support session where the other person has to touch the UI, use Screen Sharing and accept the tradeoff.",
  },
  {
    q: "Is this limited to FaceTime or does the same local-MCP pattern work for Zoom and Google Meet?",
    a: "Same pattern, same guarantees. Any video conferencing app that screen-shares as video-only works the same way: Zoom default screen share, Google Meet present, Microsoft Teams share, Discord stream. None of them inject input into your machine unless you explicitly grant remote control through their own feature. With FaceTime you cannot grant it at all, which removes one class of mistake. With the others you can grant it and should not if you are using macos-use, because the two input paths would race.",
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

const tapCreateCode = `// Sources/MCPServer/InputGuard.swift:113-153
// The event tap is created at .cghidEventTap with head-insert placement.
// Head insert means InputGuard sees every hardware event BEFORE any
// other process, including the AI tools running in this same binary.

private func createEventTap() {
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
    let headInsert = CGEventTapPlacement(rawValue: 0)!        // head of queue

    guard let tap = CGEvent.tapCreate(
        tap: .cghidEventTap,                                  // low-level HID
        place: headInsert,
        options: .defaultTap,
        eventsOfInterest: mask,
        callback: inputGuardCallback,
        userInfo: refcon
    ) else { return }

    eventTap = tap
    runLoopSource = CFMachPortCreateRunLoopSource(kCFAllocatorDefault, tap, 0)
    CFRunLoopAddSource(CFRunLoopGetMain(), runLoopSource, .commonModes)
    CGEvent.tapEnable(tap: tap, enable: true)
}`;

const callbackCode = `// Sources/MCPServer/InputGuard.swift:311-355
// The callback runs for every keyboard, mouse, and scroll event on the Mac.
// It lets programmatic events from the MCP server through (non-zero stateID)
// and blocks every hardware event except the plain Esc key.

private func inputGuardCallback(
    proxy: CGEventTapProxy,
    type: CGEventType,
    event: CGEvent,
    refcon: UnsafeMutableRawPointer?
) -> Unmanaged<CGEvent>? {

    guard let refcon = refcon else { return Unmanaged.passUnretained(event) }
    let guard_ = Unmanaged<InputGuard>.fromOpaque(refcon).takeUnretainedValue()

    // 1. MCP events use CGEventSource(.hidSystemState) and carry stateID != 0.
    //    Hardware events carry stateID == 0. This is the key distinction.
    let sourceStateID = event.getIntegerValueField(.eventSourceStateID)
    if sourceStateID != 0 {
        return Unmanaged.passUnretained(event)           // let the AI click
    }

    // 2. Plain Esc (keyCode 53, no modifiers) cancels the automation.
    if type == .keyDown {
        let keyCode = event.getIntegerValueField(.keyboardEventKeycode)
        let mask: CGEventFlags = [.maskCommand, .maskControl,
                                  .maskAlternate, .maskShift]
        if keyCode == 53 && event.flags.intersection(mask).isEmpty {
            guard_.handleEscPressed()                     // sets _cancelled = true
            return nil                                    // swallow the Esc
        }
    }

    // 3. Everything else hardware-originated gets dropped.
    return nil
}`;

const overlayCode = `// Sources/MCPServer/InputGuard.swift:202-276
// The overlay is an NSWindow at level .screenSaver with a full-bleed
// translucent background and a centered pill. FaceTime SharePlay
// captures the full compositor output, so the remote viewer sees the
// pulsing orange dot exactly like the local user does.

let window = NSWindow(
    contentRect: screenFrame,
    styleMask: [.borderless],
    backing: .buffered,
    defer: false
)
window.level = .screenSaver                               // sits above app windows
window.isOpaque = false
window.backgroundColor = NSColor.black.withAlphaComponent(0.15)
window.ignoresMouseEvents = true                          // cursor passes through
window.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary]

// Centered pill, 80pt tall
let pill = NSView(frame: NSRect(x: pillX, y: pillY,
                                width: pillWidth, height: pillHeight))
pill.wantsLayer = true
pill.layer?.backgroundColor = NSColor(white: 0.08, alpha: 0.92).cgColor
pill.layer?.cornerRadius = pillHeight / 2

// Pulsing orange dot (0.8s autoreverse, infinite)
let dotView = NSView(frame: NSRect(x: 28, y: (pillHeight - 16) / 2,
                                   width: 16, height: 16))
dotView.wantsLayer = true
dotView.layer?.backgroundColor = NSColor.systemOrange.cgColor
dotView.layer?.cornerRadius = 8

let pulse = CABasicAnimation(keyPath: "opacity")
pulse.fromValue = 1.0
pulse.toValue = 0.3
pulse.duration = 0.8
pulse.autoreverses = true
pulse.repeatCount = .infinity`;

const handlerCode = `// Sources/MCPServer/main.swift:1696-1764 (condensed)
// Every disruptive tool call engages the guard BEFORE the action runs
// and disengages AFTER, with cancellation checks between composed steps.

InputGuard.shared.engage(
    message: "AI: \\(toolDesc) — press Esc to cancel"
)

do {
    // Single-action path: click, type, scroll, press, open
    if additionalActions.isEmpty {
        actionResult = await performAction(primaryAction, options)
        if isDisruptive { try InputGuard.shared.throwIfCancelled() }
    } else {
        // Composed path: click → type → press → final traversal
        for additionalAction in additionalActions {
            try? await Task.sleep(nanoseconds: 100_000_000)
            if isDisruptive { try InputGuard.shared.throwIfCancelled() }
            await performAction(.input(action: additionalAction), minOpts)
        }
        if isDisruptive { try InputGuard.shared.throwIfCancelled() }
    }

    // 200ms grace window so a late Esc still lands
    try? await Task.sleep(nanoseconds: 200_000_000)
    let wasCancelled = InputGuard.shared.wasCancelled
    InputGuard.shared.disengage()
    if wasCancelled { throw InputGuardCancelled() }

} catch is InputGuardCancelled {
    InputGuard.shared.disengage()
    return cancelledResponse                              // tool reports cancel
}`;

export default function HowToControlFaceTimePage() {
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
                FaceTime + MCP
              </span>
              <span className="inline-block bg-zinc-100 text-zinc-600 text-xs font-medium px-2 py-1 rounded-full">
                no remote input channel
              </span>
              <span className="inline-block bg-cyan-50 text-cyan-700 text-xs font-medium px-2 py-1 rounded-full font-mono">
                CGEventTap + Esc
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 mb-6">
              You Cannot Control Someone&apos;s Screen On FaceTime. Here Is What{" "}
              <GradientText>Actually Works</GradientText>, And Why The Local-MCP
              Pattern Is Safer Than TeamViewer.
            </h1>
            <p className="text-lg text-zinc-500 max-w-2xl mb-6">
              FaceTime SharePlay is a one-way video transport. No keyboard, no
              mouse, no input API of any kind crosses that wire. Every top
              search result says the same thing: use Zoom, use TeamViewer, use
              Screen Sharing.app. All of those add a second input channel you
              have to trust. There is a third option the SERP misses. Run a
              local MCP server on your own Mac, let the remote viewer narrate
              instructions to an AI that only you can interrupt, and the
              safety property falls out of physics: FaceTime cannot carry
              keystrokes, so only your keyboard can ever press Esc.
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
                href="https://github.com/mediar-ai/mcp-server-macos-use/blob/main/Sources/MCPServer/main.swift#L1696"
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-zinc-200 bg-white text-zinc-700 text-sm font-medium hover:border-teal-300 hover:text-teal-700 transition-colors"
              >
                Open handler at main.swift:1696
              </a>
            </div>
          </div>
        </BackgroundGrid>

        {/* Proof band */}
        <ProofBand
          rating={5.0}
          ratingCount="open source"
          highlights={[
            "FaceTime SharePlay is video-only, no input channel exists",
            "CGEventTap at cghidEventTap blocks every hardware event",
            "Only physical Esc (keyCode 53, no mods) aborts the session",
          ]}
        />

        {/* Remotion hero clip */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <RemotionClip
            title="Three channels. Two can carry input. FaceTime is not one of them."
            subtitle="Why the one-way property is a feature, not a limitation"
            captions={[
              "FaceTime SharePlay: video out, nothing back in",
              "Zoom / TeamViewer: video out, input back in, trust required",
              "Screen Sharing.app: video out, input back in, explicit Allow click",
              "macos-use: local agent, remote narrates, you hold the kill switch",
            ]}
            accent="teal"
          />
        </section>

        {/* The SERP gap */}
        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            What Every Other Page On This Query Gets Wrong
          </h2>
          <p className="text-zinc-600 mb-6">
            Search the keyword and you will find ten pages that all say the
            same thing in the same order. FaceTime does not support remote
            control, here are five alternatives (Zoom, Teams, TeamViewer,
            Anydesk, Screen Sharing.app), pick one. What none of them cover is
            the class of workflows where the remote person does not actually
            need to click; they just need to see, think, and direct. For that
            case the right tool is not a remote-control app at all. It is a
            local automation agent with a hardware kill switch.
          </p>
          <ComparisonTable
            productName="macos-use (local MCP)"
            competitorName="TeamViewer / Zoom remote control"
            rows={[
              {
                feature: "Remote person can inject keystrokes into your Mac",
                ours: "no, channel does not exist",
                competitor: "yes, that is the whole point",
              },
              {
                feature: "Remote person can see what is happening",
                ours: "yes, via FaceTime SharePlay video",
                competitor: "yes, via the tool's own video",
              },
              {
                feature: "Local hardware Esc kills the session",
                ours: "yes, CGEventTap at cghidEventTap",
                competitor: "no equivalent kill switch",
              },
              {
                feature: "Works over a plain FaceTime call",
                ours: "yes",
                competitor: "no",
              },
              {
                feature: "Requires installing an app on the remote side",
                ours: "no",
                competitor: "yes",
              },
              {
                feature: "Every action logged to a local .txt file",
                ours: "yes, /tmp/macos-use/*.txt",
                competitor: "varies by vendor",
              },
            ]}
          />
        </section>

        {/* Proof banner with the anchor number */}
        <section className="max-w-4xl mx-auto px-6 py-8">
          <ProofBanner
            quote="The event tap runs at cghidEventTap with head-insert placement, sees every hardware event before any other process, and lets programmatic events pass by checking eventSourceStateID != 0."
            source="Sources/MCPServer/InputGuard.swift:131-145, 329-331"
            metric="keyCode 53"
          />
        </section>

        {/* Sequence diagram: the actual flow */}
        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            What Happens On A FaceTime-Plus-MCP Call, Event By Event
          </h2>
          <p className="text-zinc-600 mb-6">
            Four parties are involved: the remote FaceTime viewer, your
            FaceTime app (sharing your screen), your AI client (Claude, Cursor,
            any MCP host), and the mcp-server-macos-use process running on
            your Mac. The dataflow is deliberately asymmetric. Video goes out.
            Instructions come in through a completely separate channel
            (typed or spoken to the AI client, not FaceTime). Hardware input
            stays pinned to your local keyboard.
          </p>
          <SequenceDiagram
            title="One tool call, four actors"
            actors={["Remote viewer", "Your FaceTime", "AI client", "macos-use MCP"]}
            messages={[
              { from: 0, to: 1, label: "watches SharePlay video", type: "event" },
              { from: 0, to: 2, label: "narrates: click the Send button", type: "request" },
              { from: 2, to: 3, label: "macos-use_click_and_traverse(pid, x, y)", type: "request" },
              { from: 3, to: 3, label: "InputGuard.engage()", type: "event" },
              { from: 3, to: 1, label: "overlay pill + CGEvent.post click", type: "event" },
              { from: 1, to: 0, label: "video frame shows the click happened", type: "response" },
              { from: 3, to: 3, label: "throwIfCancelled() after 200ms grace", type: "event" },
              { from: 3, to: 2, label: "traversal .txt + screenshot .png", type: "response" },
              { from: 2, to: 0, label: "AI narrates what it saw", type: "response" },
            ]}
          />
        </section>

        {/* The anchor fact: the four lines that make it safe */}
        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            The Callback Line That Makes Remote-Directed Control Safe
          </h2>
          <p className="text-zinc-600 mb-4">
            The CGEventTap callback at{" "}
            <span className="font-mono text-sm text-teal-700">
              Sources/MCPServer/InputGuard.swift:329-331
            </span>{" "}
            reads a single integer off each incoming event:
          </p>
          <blockquote className="rounded-2xl border border-teal-200 bg-teal-50 p-6 my-6 font-mono text-sm text-zinc-800 leading-relaxed">
            let sourceStateID = event.getIntegerValueField(.eventSourceStateID)
            <br />
            if sourceStateID != 0 {"{"}
            <br />
            &nbsp;&nbsp;return Unmanaged.passUnretained(event)
            <br />
            {"}"}
          </blockquote>
          <p className="text-zinc-600 mb-4">
            Programmatic CGEvents posted by the MCP server use
            CGEventSource(stateID: .hidSystemState), which yields a non-zero
            stateID; the tap lets those through. Hardware events (your
            physical keyboard, your physical mouse) come in with stateID zero;
            those get suppressed, except for the plain Esc at{" "}
            <span className="font-mono text-sm text-teal-700">
              InputGuard.swift:345-349
            </span>{" "}
            which raises{" "}
            <span className="font-mono text-sm">InputGuardCancelled</span>.
          </p>
          <p className="text-zinc-600">
            The remote FaceTime viewer cannot generate either kind. FaceTime
            carries no keyboard data. The closest they can come to touching
            your Mac is speaking an instruction that you type into the AI
            client. That routes through a totally different process, with
            human approval, and the AI&apos;s events always land as
            programmatic events, never as hardware. There is no path from the
            remote side to keyCode 53.
          </p>
        </section>

        {/* The tap-creation code */}
        <section className="max-w-4xl mx-auto px-6 py-12">
          <AnimatedCodeBlock
            code={tapCreateCode}
            language="swift"
            filename="Sources/MCPServer/InputGuard.swift"
          />
        </section>

        {/* The callback itself */}
        <section className="max-w-4xl mx-auto px-6 py-12">
          <AnimatedCodeBlock
            code={callbackCode}
            language="swift"
            filename="Sources/MCPServer/InputGuard.swift"
          />
        </section>

        {/* Animated beam: how the channels separate */}
        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            The Channel Separation In One Diagram
          </h2>
          <p className="text-zinc-600 mb-6">
            Inputs that could affect your Mac have to pass through the
            CGEventTap first. The tap is placed at head-insert on cghidEventTap,
            which is about as low in the input stack as a userland process
            can sit. Everything downstream of the tap already passed the
            stateID check.
          </p>
          <AnimatedBeam
            title="Three inbound channels, one tap, one decision"
            from={[
              { label: "FaceTime SharePlay", sublabel: "video only, no input" },
              { label: "AI client tool call", sublabel: "CGEvent stateID != 0" },
              { label: "Your keyboard", sublabel: "CGEvent stateID == 0" },
            ]}
            hub={{ label: "InputGuard", sublabel: "cghidEventTap, head-insert" }}
            to={[
              { label: "Dropped", sublabel: "no path exists" },
              { label: "Allowed", sublabel: "AI actions pass" },
              { label: "Esc cancels", sublabel: "everything else dropped" },
            ]}
          />
        </section>

        {/* Counting the channels: metrics row */}
        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            By The Numbers
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <GlowCard>
              <div className="p-6 text-center">
                <div className="text-4xl font-bold text-teal-600">
                  <NumberTicker value={0} />
                </div>
                <div className="mt-2 text-sm text-zinc-500">
                  keystrokes FaceTime transmits from the remote side
                </div>
              </div>
            </GlowCard>
            <GlowCard>
              <div className="p-6 text-center">
                <div className="text-4xl font-bold text-teal-600">
                  <NumberTicker value={11} />
                </div>
                <div className="mt-2 text-sm text-zinc-500">
                  CGEventType masks the tap listens for
                </div>
              </div>
            </GlowCard>
            <GlowCard>
              <div className="p-6 text-center">
                <div className="text-4xl font-bold text-teal-600">
                  <NumberTicker value={53} />
                </div>
                <div className="mt-2 text-sm text-zinc-500">
                  the one keyCode that cancels a session
                </div>
              </div>
            </GlowCard>
            <GlowCard>
              <div className="p-6 text-center">
                <div className="text-4xl font-bold text-teal-600">
                  <NumberTicker value={30} suffix="s" />
                </div>
                <div className="mt-2 text-sm text-zinc-500">
                  watchdog auto-disengage if nothing calls it
                </div>
              </div>
            </GlowCard>
          </div>
        </section>

        {/* Four steps you actually take */}
        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            Four Steps, Start To Finish
          </h2>
          <HorizontalStepper
            steps={[
              {
                title: "Start the FaceTime call",
                description:
                  "Click Share Screen from the FaceTime menu-bar extra. The remote viewer now sees your entire display as a video feed.",
              },
              {
                title: "Launch your MCP client",
                description:
                  "Claude Desktop, Cursor, or any MCP-compatible agent, with mcp-server-macos-use configured. The AI can now call macos-use_click_and_traverse.",
              },
              {
                title: "Narrate what you want done",
                description:
                  "The remote viewer tells you (or types into a shared channel) what to click, type, or open. You forward it to the AI client.",
              },
              {
                title: "Hit Esc any time to kill the session",
                description:
                  "Plain Escape key on your keyboard, no modifiers. InputGuard raises InputGuardCancelled, the tool call aborts, focus and cursor return to where they were.",
              },
            ]}
          />
        </section>

        {/* Terminal output showing what it actually logs */}
        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            What The Server Writes To stderr During A Real Call
          </h2>
          <p className="text-zinc-600 mb-6">
            Every engage, every event, every cancel lands in stderr. If you
            press Esc a marker file gets written to{" "}
            <span className="font-mono text-sm text-teal-700">
              /tmp/macos-use/esc_pressed.txt
            </span>{" "}
            (InputGuard.swift:347) so you can prove after the fact that the
            cancel reached the callback and was not lost.
          </p>
          <TerminalOutput
            title="stderr during one click_and_traverse with a mid-call Esc"
            lines={[
              { type: "command", text: "log: InputGuard: engaging — AI: Clicking in app… — press Esc to cancel" },
              { type: "output", text: "log: InputGuard: CGEventTap created on main run loop, enabled=true" },
              { type: "output", text: "log: InputGuard: overlay shown (fullscreen)" },
              { type: "output", text: "log: InputGuard: engaged — tap active, overlay visible" },
              { type: "output", text: "log: handler(CallTool): executing performAction on MainActor via Task..." },
              { type: "output", text: "log: InputGuard TAP: keyDown keyCode=53 sourceState=0" },
              { type: "output", text: "log: InputGuard: Esc pressed — user cancelled" },
              { type: "output", text: "log: InputGuard: disengaging" },
              { type: "output", text: "log: InputGuard: CGEventTap destroyed" },
              { type: "output", text: "log: InputGuard: overlay hidden" },
              { type: "output", text: "log: InputGuard: throwIfCancelled — wasCancelled=true" },
              { type: "error", text: "InputGuardCancelled: User pressed Esc — automation cancelled" },
            ]}
          />
        </section>

        {/* Handler code */}
        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            Where The Handler Engages And Disengages The Guard
          </h2>
          <p className="text-zinc-600 mb-6">
            The handler at{" "}
            <span className="font-mono text-sm text-teal-700">
              Sources/MCPServer/main.swift:1696-1764
            </span>{" "}
            wraps every disruptive tool call (click, type, press, scroll,
            open) in an engage-action-disengage envelope. Traversal-only calls
            skip the guard because they do not inject events. Composed calls
            (click then type then press) check for cancellation between each
            step so Esc mid-sequence still aborts the remainder.
          </p>
          <AnimatedCodeBlock
            code={handlerCode}
            language="swift"
            filename="Sources/MCPServer/main.swift"
          />
        </section>

        {/* Capability marquee */}
        <section className="py-10 border-t border-b border-zinc-100">
          <Marquee speed={40} pauseOnHover>
            <span className="mx-8 px-4 py-2 bg-teal-50 text-teal-700 rounded-full text-sm font-medium whitespace-nowrap">
              CGEventTap at cghidEventTap
            </span>
            <span className="mx-8 px-4 py-2 bg-cyan-50 text-cyan-700 rounded-full text-sm font-medium whitespace-nowrap">
              head-insert placement
            </span>
            <span className="mx-8 px-4 py-2 bg-zinc-100 text-zinc-700 rounded-full text-sm font-medium whitespace-nowrap">
              eventSourceStateID distinguishes AI vs hardware
            </span>
            <span className="mx-8 px-4 py-2 bg-teal-50 text-teal-700 rounded-full text-sm font-medium whitespace-nowrap">
              keyCode 53 is the only exception
            </span>
            <span className="mx-8 px-4 py-2 bg-cyan-50 text-cyan-700 rounded-full text-sm font-medium whitespace-nowrap">
              30s watchdog auto-disengage
            </span>
            <span className="mx-8 px-4 py-2 bg-zinc-100 text-zinc-700 rounded-full text-sm font-medium whitespace-nowrap">
              orange pulsing dot + pill overlay
            </span>
            <span className="mx-8 px-4 py-2 bg-teal-50 text-teal-700 rounded-full text-sm font-medium whitespace-nowrap">
              NSWindow level .screenSaver
            </span>
            <span className="mx-8 px-4 py-2 bg-cyan-50 text-cyan-700 rounded-full text-sm font-medium whitespace-nowrap">
              /tmp/macos-use/esc_pressed.txt
            </span>
          </Marquee>
        </section>

        {/* Bento grid: who should read this which way */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            Which Reader Are You
          </h2>
          <BentoGrid
            cards={[
              {
                title: "You wanted actual remote control",
                description:
                  "If the remote person needs to click your Mac, stop here and open Screen Sharing.app via screens:// or Messages Ask To Share Screen. FaceTime cannot do it and nothing in macos-use will change that.",
                size: "2x1",
              },
              {
                title: "You want an AI to drive, a human to watch",
                description:
                  "This is the sweet spot. The remote person on FaceTime directs, the AI executes, you keep the kill switch. Skip to the four-step section.",
                size: "1x1",
              },
              {
                title: "You care about the safety argument",
                description:
                  "Read the callback code section above. The four lines that check eventSourceStateID are the load-bearing logic.",
                size: "1x1",
              },
              {
                title: "You are evaluating vs TeamViewer",
                description:
                  "Read the comparison table. The difference is not features; it is whether a second input channel exists at all.",
                size: "2x1",
              },
            ]}
          />
        </section>

        {/* Overlay code block */}
        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            Why The Remote Viewer Sees The Overlay Too
          </h2>
          <p className="text-zinc-600 mb-6">
            The overlay is a borderless NSWindow at level{" "}
            <span className="font-mono text-sm text-teal-700">
              .screenSaver
            </span>{" "}
            (InputGuard.swift:216), composited into the display by the window
            server before FaceTime captures the frame for SharePlay. The
            remote viewer watches the pulsing orange dot appear and disappear
            exactly like you do. There is no hidden mode.
          </p>
          <AnimatedCodeBlock
            code={overlayCode}
            language="swift"
            filename="Sources/MCPServer/InputGuard.swift"
          />
        </section>

        {/* FAQ */}
        <section className="max-w-4xl mx-auto px-6 py-16 border-t border-zinc-100">
          <FaqSection items={faqItems} />
        </section>

        {/* Closing CTA */}
        <section className="max-w-4xl mx-auto px-6 py-12">
          <InlineCta
            heading="Run the server, point an AI at it, start your FaceTime call"
            body="mcp-server-macos-use is open source, Swift-native, and ships with the InputGuard kill switch turned on by default. No accounts, no telemetry, no remote control surface."
            linkText="Install from GitHub"
            href="https://github.com/mediar-ai/mcp-server-macos-use"
          />
        </section>
      </article>
    </>
  );
}
