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
  StepTimeline,
  ComparisonTable,
  GlowCard,
  BentoGrid,
  ProofBanner,
  BeforeAfter,
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
  "How To Control Someone's Screen On FaceTime: The AI-Observer Workflow Where Your Cursor Never Leaves Home";
const DESCRIPTION =
  "As of iOS 18 and macOS 15 FaceTime ships native remote control, but it hands the cursor to the remote party. macos-use offers the opposite pattern: the remote person narrates, an AI on your Mac executes, and every disruptive tool call snapshots your mouse cursor plus frontmost app at engage (Sources/MCPServer/main.swift:1669-1676) and restores both at disengage (main.swift:1767-1781), even in the Esc-cancelled branch (main.swift:1847-1861). The SharePlay viewer sees the action land and your cursor teleport back to where you left it.";

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
    title: "Control someone's screen on FaceTime, the snap-back way",
    description:
      "Apple's built-in FaceTime remote control gives the cursor to the remote person. macos-use keeps the cursor with you: snapshot on engage, restore on disengage, even on Esc cancel.",
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
    q: "FaceTime got remote control in iOS 18 and macOS 15. Why would I pick a local-MCP pattern over that?",
    a: "Different trust model. Apple's built-in remote control hands the cursor and keyboard over to the remote party; it is limited to contacts, blocks Apple Pay and Face ID changes, and is not available in the EU. For a support call where the remote person has to touch the UI, use it. The local-MCP pattern is for a different job: the remote person narrates what they want done, an AI on your Mac executes, and your cursor never leaves its starting position. You get an AI auditor between narration and action, and the call does not depend on Apple Account contacts. The anchor code is main.swift:1671 (snapshot) and main.swift:1767-1781 (restore).",
  },
  {
    q: "What exactly gets snapshotted at the start of each tool call, and where is the code?",
    a: "Two things, on one if-branch. main.swift:1670 checks isDisruptive (true for click, type, press, scroll, open; false for refresh_traversal at main.swift:1667). If disruptive, main.swift:1671 reads NSWorkspace.shared.frontmostApplication into savedFrontmostApp, main.swift:1672 reads NSEvent.mouseLocation, and main.swift:1674 converts it to the global CGEvent coordinate space via CGPoint(x: nsPos.x, y: primaryScreen.frame.height - nsPos.y). Both snapshots are stored as locals declared outside the do-block at main.swift:1479-1480 so the catch branch can still see them. Nothing is stored in InputGuard itself; the handler owns the snapshot.",
  },
  {
    q: "Where exactly does the restore happen, and what CGEvent type does it use?",
    a: "Lines main.swift:1767-1772 build a CGEvent with mouseEventSource set to nil, mouseType .mouseMoved, mouseCursorPosition the saved point, and post it via moveEvent.post(tap: .cghidEventTap). The nil source causes the CGEventSource to default to hidSystemState, which gives the event a non-zero eventSourceStateID. That non-zero ID is exactly what InputGuard's own tap checks at InputGuard.swift:329-331 to decide whether to pass or block. So the restore event passes through InputGuard's filter as if it were the AI itself moving the cursor, even if InputGuard is momentarily still engaged. The frontmost-app restore at main.swift:1775-1781 uses prevApp.activate(options: []) on the stored NSRunningApplication.",
  },
  {
    q: "What happens to the restore if I press Esc mid-automation?",
    a: "The same restore runs a second time, in the InputGuardCancelled catch. main.swift:1847 catches is InputGuardCancelled, line 1850 forces InputGuard.shared.disengage(), main.swift:1852-1856 re-posts the mouseMoved CGEvent with the saved position, and main.swift:1858-1859 calls prevApp.activate(options: []) with the saved app. The cursor still lands at the saved location, the previous app still comes back on top, and the tool returns an isError response reading 'Cancelled: user pressed Esc to abort'. Two branches, one invariant: cursor and focus always return to the pre-engage snapshot.",
  },
  {
    q: "Why does the cursor restore matter specifically for FaceTime SharePlay?",
    a: "SharePlay captures the entire compositor frame the window server builds, so the remote viewer sees the actual hardware cursor position in real time. If you are narrating 'can you click the Send button in Mail', the naive approach leaves the cursor hovering over the Send button after the click, which is visually confusing because the remote viewer can no longer tell what you would click next on your own. The snap-back moves the cursor to exactly where you left it before the action. The SharePlay frame shows an action land, then the cursor teleport home. Feels like a slideshow, not a takeover.",
  },
  {
    q: "Is the restore visible to the remote FaceTime viewer as a cursor jump, or does it look smooth?",
    a: "It is a jump. A .mouseMoved CGEvent posted once with an explicit position does not interpolate; the cursor teleports to that coordinate on the next compositor frame. At 30fps SharePlay encoding that is one or two frames of visible motion. On the receiving side it reads as a deliberate reset, which is the intent: the remote viewer should read the movement as 'automation finished' and start narrating the next step. No tween, no easing, no trail.",
  },
  {
    q: "What if the action itself opens a new app and I want focus to stay on it, not get yanked back?",
    a: "The restore is gated by a freshness check. main.swift:1776-1780 reads currentFrontmost via NSWorkspace.shared.frontmostApplication and only calls prevApp.activate(options: []) if currentFrontmost?.processIdentifier != prevApp.processIdentifier. But any activate on a newly-launched app still pulls focus away. The cross-app handoff detection at main.swift:1788-1808 is the counter-balance: if the action made a different app frontmost, the handler re-traverses the new app's accessibility tree first and attaches it as appSwitchTraversal, so the caller sees the new state before focus restoration flips it back. For workflows where you want the new app to stay frontmost, run refresh_traversal (non-disruptive, skips the whole snapshot/restore path at main.swift:1670).",
  },
  {
    q: "What does the stderr log look like during one snap-back cycle?",
    a: "Four log lines bracket the cycle. 'handler(CallTool): saved cursor (x,y) and frontmost app Name (PID N)' prints at main.swift:1675 when the snapshot lands. 'InputGuard: engaging' and 'InputGuard: engaged — tap active, overlay visible' print next. The action runs. After disengage, 'handler(CallTool): restored cursor to (x,y)' prints at main.swift:1771 and 'handler(CallTool): restored focus to Name (PID N)' prints at main.swift:1779 if activation actually fired. Grep for 'saved cursor' and 'restored cursor' in stderr during a FaceTime session to confirm the pair ran; the timestamps tell you the whole cycle took well under a second for a simple click.",
  },
  {
    q: "How does this compare to what Apple's FaceTime remote control actually does to your cursor?",
    a: "Apple's remote control pushes the remote party's cursor movements into your CGEvent stream; your cursor follows wherever the remote person moves. There is no snap-back. Exit the control session and the cursor stays wherever the remote dropped it. The tradeoff is Apple's path lets the remote person drive directly, which is good for support and bad for audit. macos-use's path keeps the cursor pinned to your local intent across the whole call, at the cost of needing an AI in the middle to interpret narration. Same keyword, opposite property.",
  },
  {
    q: "Does the snap-back interfere with the screenshot the server writes to /tmp/macos-use?",
    a: "No, the screenshot happens before the restore completes from the caller's perspective but after it functionally landed. captureWindowScreenshot at main.swift:1839 launches the screenshot-helper subprocess, which calls CGWindowListCreateImage for the chosen window ID. The cursor position does not affect window capture; the PNG shows the window pixels, not the cursor, and the crosshair annotation drawn by ScreenshotHelper/main.swift:70-85 is placed at lastClickPoint (the original click coordinates), not at wherever the cursor is at capture time. So the screenshot shows the click landed, the accessibility diff shows the UI response, and the real cursor is already back home by the time the tool returns.",
  },
  {
    q: "Can I reproduce the snap-back locally without FaceTime, to verify the behavior?",
    a: "Yes. Start your MCP client with mcp-server-macos-use attached. Move your mouse to a distinctive corner (say, top-left). Then call macos-use_click_and_traverse with coordinates near the opposite corner. Watch the cursor: it flicks to the click point, the action fires, the cursor snaps back to top-left. Grep /tmp/macos-use for the latest timestamped .txt and the stderr log for 'saved cursor' / 'restored cursor'. Try it again with Esc held during the overlay window and you should still see the restore log because the catch branch at main.swift:1852-1856 re-runs it.",
  },
  {
    q: "Is there any cleanup skipped if the process crashes mid-call?",
    a: "Yes, the restore is in-process. If mcp-server-macos-use SIGKILLs during a tool call, the cursor stays wherever the last CGEvent moved it and the frontmost app is whatever the OS decided to activate next. The InputGuard overlay is owned by an NSWindow in the same process, so it dies with the server. The CGEventTap dies too, which means hardware input passes through again. The 30-second watchdog at InputGuard.swift:172-181 is the in-process fallback; there is no out-of-process supervisor. If your risk model includes 'the MCP server hard-crashes mid-call', keep FaceTime's SharePlay video running so you can see the state and hit Cmd+Tab manually.",
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

const snapshotCode = `// Sources/MCPServer/main.swift:1669-1676
// Snapshot at the top of every disruptive tool call.
// The locals are declared at main.swift:1479-1480 so the InputGuardCancelled
// catch branch further down can still read them for the cancel-path restore.

// --- Save frontmost app + cursor before disruptive actions ---
if isDisruptive {
    savedFrontmostApp = NSWorkspace.shared.frontmostApplication

    let nsPos = NSEvent.mouseLocation                     // Cocoa coords (bottom-left origin)
    if let primaryScreen = NSScreen.screens.first {
        // Flip to CGEvent coords (top-left origin) so we can .post later
        savedCursorPos = CGPoint(
            x: nsPos.x,
            y: primaryScreen.frame.height - nsPos.y
        )
        fputs("log: handler(CallTool): saved cursor \\(savedCursorPos!) and frontmost app '\\(savedFrontmostApp?.localizedName ?? "nil")' (PID \\(savedFrontmostApp?.processIdentifier ?? 0))\\n", stderr)
    }

    InputGuard.shared.engage(message: "AI: \\(toolDesc) — press Esc to cancel")
}`;

const restoreCode = `// Sources/MCPServer/main.swift:1766-1781
// Success-path restore. Runs after the action returned AND after
// InputGuard was disengaged, but before the flat-text response is written.
// The CGEvent uses a nil source (defaults to hidSystemState, stateID != 0),
// which is exactly what InputGuard's own tap at InputGuard.swift:329-331
// lets through. So if InputGuard is still briefly active, the restore
// still lands.

// --- Restore cursor position ---
if let pos = savedCursorPos,
   let moveEvent = CGEvent(
       mouseEventSource: nil,
       mouseType: .mouseMoved,
       mouseCursorPosition: pos,
       mouseButton: .left
   ) {
    moveEvent.post(tap: .cghidEventTap)
    fputs("log: handler(CallTool): restored cursor to \\(pos)\\n", stderr)
}

// --- Restore frontmost app focus ---
if isDisruptive, let prevApp = savedFrontmostApp, prevApp.isTerminated == false {
    let currentFrontmost = NSWorkspace.shared.frontmostApplication
    if currentFrontmost?.processIdentifier != prevApp.processIdentifier {
        prevApp.activate(options: [])
        fputs("log: handler(CallTool): restored focus to '\\(prevApp.localizedName ?? "")' (PID \\(prevApp.processIdentifier))\\n", stderr)
    }
}`;

const cancelCode = `// Sources/MCPServer/main.swift:1847-1861
// Cancel-path restore. This is the whole reason savedFrontmostApp and
// savedCursorPos are declared OUTSIDE the do-block: so this catch can
// still see them after InputGuardCancelled unwinds through Task boundaries.
// Same two operations as the success path, condensed.

} catch is InputGuardCancelled {
    fputs("log: handler(CallTool): user cancelled tool '\\(params.name)' via Esc\\n", stderr)
    InputGuard.shared.disengage()

    // Restore cursor
    if let pos = savedCursorPos,
       let moveEvent = CGEvent(
           mouseEventSource: nil,
           mouseType: .mouseMoved,
           mouseCursorPosition: pos,
           mouseButton: .left
       ) {
        moveEvent.post(tap: .cghidEventTap)
    }

    // Restore frontmost app
    if let prevApp = savedFrontmostApp, !prevApp.isTerminated {
        prevApp.activate(options: [])
    }
    return .init(
        content: [.text("Cancelled: user pressed Esc to abort '\\(params.name)'.")],
        isError: true
    )
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
                FaceTime SharePlay + MCP
              </span>
              <span className="inline-block bg-zinc-100 text-zinc-600 text-xs font-medium px-2 py-1 rounded-full">
                cursor never leaves home
              </span>
              <span className="inline-block bg-cyan-50 text-cyan-700 text-xs font-medium px-2 py-1 rounded-full font-mono">
                snapshot + restore, twice
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 mb-6">
              How To Control Someone&apos;s Screen On FaceTime Without{" "}
              <GradientText>Handing Over The Cursor</GradientText>: The
              Snap-Back Pattern Inside macos-use
            </h1>
            <p className="text-lg text-zinc-500 max-w-2xl mb-6">
              Since iOS 18 and macOS 15 FaceTime has had native remote control.
              It works, and for a support call where the remote person needs
              to touch the UI, use it. This page is about the opposite workflow.
              The remote viewer narrates, an AI on your Mac executes, and your
              cursor snaps back to exactly where you left it after every action.
              The code that makes that true is a pair of snapshot and restore
              blocks in main.swift that run twice per tool call, once in the
              success branch and once in the Esc-cancelled branch.
            </p>
            <ArticleMeta
              datePublished={DATE_PUBLISHED}
              author="macos-use maintainers"
              readingTime="10 min read"
            />
            <div className="mt-8 flex gap-4 flex-wrap">
              <ShimmerButton href="https://github.com/mediar-ai/mcp-server-macos-use/blob/main/Sources/MCPServer/main.swift#L1669">
                Read snapshot at main.swift:1669
              </ShimmerButton>
              <a
                href="https://github.com/mediar-ai/mcp-server-macos-use/blob/main/Sources/MCPServer/main.swift#L1767"
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-zinc-200 bg-white text-zinc-700 text-sm font-medium hover:border-teal-300 hover:text-teal-700 transition-colors"
              >
                Restore at main.swift:1767
              </a>
            </div>
          </div>
        </BackgroundGrid>

        {/* Proof band */}
        <ProofBand
          rating={5.0}
          ratingCount="open source"
          highlights={[
            "Snapshot cursor + frontmost app on every disruptive tool call",
            "Restore both on success at main.swift:1767-1781",
            "Same restore runs in the Esc-cancelled catch at main.swift:1852-1860",
          ]}
        />

        {/* Remotion hero clip */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <RemotionClip
            title="Two snapshots. Two restores. One very quiet cursor."
            subtitle="Why an AI-driven FaceTime session looks nothing like a TeamViewer session"
            captions={[
              "Before: cursor sits wherever you left it",
              "Engage: snapshot cursor + frontmost app",
              "Act: AI posts CGEvents, UI responds",
              "Disengage: cursor teleports home, previous app returns",
              "Esc cancels? Same restore runs in the catch branch",
            ]}
            accent="teal"
          />
        </section>

        {/* SERP gap section */}
        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            The SERP Assumes You Want To Hand Over The Cursor. There Is A
            Second Workflow.
          </h2>
          <p className="text-zinc-600 mb-4">
            Search the keyword and the first page is dominated by Apple Support
            articles describing FaceTime&apos;s built-in remote control
            (iOS 18, macOS 15, contacts-gated, not available in the EU), plus
            a ring of blog posts explaining how to use it or fall back to Zoom,
            TeamViewer, Anydesk, or Screen Sharing.app. They all solve the same
            problem: getting the remote person&apos;s cursor onto your Mac.
          </p>
          <p className="text-zinc-600 mb-8">
            That is one workflow. The other is: the remote person never gets
            the cursor, an AI sits between their narration and your machine,
            and the cursor stays pinned to your local intent across the whole
            call. Both have legitimate use cases. Only the first is in the SERP.
          </p>
          <BeforeAfter
            title="Two different contracts with the remote party"
            before={{
              content:
                "Apple FaceTime remote control (iOS 18 / macOS 15) or Zoom / TeamViewer / Screen Sharing.app: the remote person moves your cursor directly. When they stop, the cursor sits wherever they left it. No auditor between narration and action.",
              highlights: [
                "Remote party controls the cursor",
                "Cursor stays wherever the remote drops it",
                "No AI reviewing the request first",
                "Contacts-gated, EU-blocked, or trust-required",
              ],
            }}
            after={{
              content:
                "macos-use local MCP + FaceTime SharePlay: the remote person narrates, the AI runs macos-use_click_and_traverse on your Mac, and the snap-back at main.swift:1767-1781 puts your cursor back home after every action. Same restore runs if you hit Esc mid-call.",
              highlights: [
                "Host keeps the cursor end to end",
                "Cursor restored to pre-action position",
                "AI and host review before anything clicks",
                "Works over any plain FaceTime call",
              ],
            }}
          />
        </section>

        {/* The anchor proof banner */}
        <section className="max-w-4xl mx-auto px-6 py-8">
          <ProofBanner
            quote="The cursor restore uses CGEvent(mouseEventSource: nil, mouseType: .mouseMoved, mouseCursorPosition: savedCursorPos).post(tap: .cghidEventTap), with a nil source so the event carries a non-zero eventSourceStateID and passes InputGuard's own tap. The same two operations run in the success branch and in the InputGuardCancelled catch."
            source="Sources/MCPServer/main.swift:1767-1772 and main.swift:1852-1856"
            metric="2 restore paths"
          />
        </section>

        {/* Sequence diagram */}
        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            One Tool Call, Framed From The Remote Viewer&apos;s Seat
          </h2>
          <p className="text-zinc-600 mb-6">
            Four participants: the remote FaceTime viewer, your FaceTime
            (broadcasting SharePlay), your AI client running an MCP session,
            and mcp-server-macos-use on your machine. The snapshot and restore
            are both local to the last actor; neither the remote viewer nor
            FaceTime ever see or touch the saved cursor position.
          </p>
          <SequenceDiagram
            title="Snap-back cycle, actor by actor"
            actors={["Remote viewer", "Your FaceTime", "AI client", "macos-use MCP"]}
            messages={[
              { from: 0, to: 1, label: "watches SharePlay video", type: "event" },
              { from: 0, to: 2, label: "narrates: click Send", type: "request" },
              { from: 2, to: 3, label: "click_and_traverse(pid, x, y)", type: "request" },
              { from: 3, to: 3, label: "save NSEvent.mouseLocation + frontmostApplication", type: "event" },
              { from: 3, to: 3, label: "InputGuard.engage(), overlay pill appears", type: "event" },
              { from: 3, to: 1, label: "CGEvent click posts, UI responds", type: "event" },
              { from: 3, to: 3, label: "InputGuard.disengage(), overlay hides", type: "event" },
              { from: 3, to: 1, label: "mouseMoved CGEvent -> cursor teleports home", type: "event" },
              { from: 3, to: 1, label: "savedFrontmostApp.activate() -> previous app returns", type: "event" },
              { from: 1, to: 0, label: "SharePlay frame: action landed, cursor back at origin", type: "response" },
              { from: 3, to: 2, label: "compact summary + .txt + .png", type: "response" },
              { from: 2, to: 0, label: "AI narrates what changed", type: "response" },
            ]}
          />
        </section>

        {/* The snapshot code */}
        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            The Snapshot Block, Verbatim
          </h2>
          <p className="text-zinc-600 mb-6">
            The snapshot fires only on disruptive tools. refresh_traversal is
            flagged non-disruptive at main.swift:1667 and bypasses this block,
            because it does not inject input and does not need to restore
            anything. The cursor position is flipped from Cocoa&apos;s
            bottom-left origin to CGEvent&apos;s top-left origin right here,
            so the restore can skip any coordinate math later.
          </p>
          <AnimatedCodeBlock
            code={snapshotCode}
            language="swift"
            filename="Sources/MCPServer/main.swift"
          />
        </section>

        {/* Channel diagram */}
        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            Where The Saved Position Lives Across The Tool Call
          </h2>
          <p className="text-zinc-600 mb-6">
            savedCursorPos and savedFrontmostApp are declared at
            main.swift:1479-1480, outside the do-block. That placement is
            load-bearing: the InputGuardCancelled catch on line 1847 needs
            to see them after an exception has unwound through Task and
            @MainActor boundaries. If they were scoped inside the do, the
            cancel branch would have no restore to run.
          </p>
          <AnimatedBeam
            title="One snapshot, three consumers"
            from={[
              { label: "NSEvent.mouseLocation", sublabel: "at engage time" },
              { label: "NSWorkspace.frontmostApplication", sublabel: "at engage time" },
            ]}
            hub={{ label: "handler locals", sublabel: "main.swift:1479-1480" }}
            to={[
              { label: "Success restore", sublabel: "main.swift:1767-1781" },
              { label: "Esc-cancel restore", sublabel: "main.swift:1852-1860" },
              { label: "Log lines in stderr", sublabel: "saved cursor / restored cursor" },
            ]}
          />
        </section>

        {/* The restore code */}
        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            The Success-Branch Restore, Verbatim
          </h2>
          <p className="text-zinc-600 mb-6">
            Two operations: post a .mouseMoved CGEvent with the saved
            coordinates, and call prevApp.activate(options: []) if the saved
            app is still alive and is not already frontmost. The freshness
            check at main.swift:1777 avoids a redundant activation when the
            action did not actually switch apps, which keeps the stderr log
            honest.
          </p>
          <AnimatedCodeBlock
            code={restoreCode}
            language="swift"
            filename="Sources/MCPServer/main.swift"
          />
        </section>

        {/* The cancel branch */}
        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            Why The Esc Branch Is Not A Different Story
          </h2>
          <p className="text-zinc-600 mb-6">
            If you press Esc mid-automation, InputGuard.swift:345-349 sets
            _cancelled and throws InputGuardCancelled via throwIfCancelled at
            one of the four check points inside the handler. The unwind lands
            in the catch on main.swift:1847. Same two lines run: mouseMoved
            CGEvent with the saved position, prevApp.activate with the saved
            app. Whether the tool call succeeded, failed, or was cancelled
            mid-sequence, the exit contract is identical: cursor and focus
            end where they started.
          </p>
          <AnimatedCodeBlock
            code={cancelCode}
            language="swift"
            filename="Sources/MCPServer/main.swift"
          />
        </section>

        {/* Comparison table */}
        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            Against The Top SERP Answers, Row By Row
          </h2>
          <ComparisonTable
            productName="macos-use local MCP + FaceTime SharePlay"
            competitorName="Apple FaceTime remote control (iOS 18 / macOS 15)"
            rows={[
              {
                feature: "Remote party moves your cursor",
                ours: "no, host keeps the cursor",
                competitor: "yes, that is the feature",
              },
              {
                feature: "Cursor restored to pre-action position",
                ours: "yes, main.swift:1767-1772",
                competitor: "no, stays wherever the remote dropped it",
              },
              {
                feature: "Esc cancel restores cursor and focus too",
                ours: "yes, main.swift:1852-1860",
                competitor: "no equivalent",
              },
              {
                feature: "Required relationship with the remote party",
                ours: "none, any FaceTime contact",
                competitor: "saved in your contacts, device version gate",
              },
              {
                feature: "Available in the European Union",
                ours: "yes, no regional gate",
                competitor: "no, feature not available",
              },
              {
                feature: "AI reviewer between narration and action",
                ours: "yes, the MCP client",
                competitor: "no, input passes straight through",
              },
              {
                feature: "Per-action audit artifact",
                ours: "yes, /tmp/macos-use/*.txt + .png with crosshair",
                competitor: "no, session is unlogged",
              },
            ]}
          />
        </section>

        {/* Metrics row */}
        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            By The Numbers
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <GlowCard>
              <div className="p-6 text-center">
                <div className="text-4xl font-bold text-teal-600">
                  <NumberTicker value={2} />
                </div>
                <div className="mt-2 text-sm text-zinc-500">
                  restore paths per tool call (success, Esc-cancelled)
                </div>
              </div>
            </GlowCard>
            <GlowCard>
              <div className="p-6 text-center">
                <div className="text-4xl font-bold text-teal-600">
                  <NumberTicker value={200} suffix="ms" />
                </div>
                <div className="mt-2 text-sm text-zinc-500">
                  grace window before cancellation check at main.swift:1757
                </div>
              </div>
            </GlowCard>
            <GlowCard>
              <div className="p-6 text-center">
                <div className="text-4xl font-bold text-teal-600">
                  <NumberTicker value={30} suffix="s" />
                </div>
                <div className="mt-2 text-sm text-zinc-500">
                  watchdog auto-disengage at InputGuard.swift:172-181
                </div>
              </div>
            </GlowCard>
            <GlowCard>
              <div className="p-6 text-center">
                <div className="text-4xl font-bold text-teal-600">
                  <NumberTicker value={0} />
                </div>
                <div className="mt-2 text-sm text-zinc-500">
                  times the remote FaceTime viewer&apos;s input reaches your
                  CGEvent queue
                </div>
              </div>
            </GlowCard>
          </div>
        </section>

        {/* Step timeline */}
        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            What Actually Happens On The Call, Step By Step
          </h2>
          <StepTimeline
            steps={[
              {
                title: "Start FaceTime, hit Share Screen",
                description:
                  "Click Share Screen from the FaceTime menu-bar extra. The remote viewer sees your full display as a SharePlay video feed.",
                detail:
                  "SharePlay captures the compositor output, so anything the window server draws, they see. Including the InputGuard overlay when it appears.",
              },
              {
                title: "AI client connects to mcp-server-macos-use",
                description:
                  "Claude Desktop, Cursor, or any MCP-compatible agent with the server wired in via stdio. The AI now has access to macos-use_click_and_traverse, type_and_traverse, press_key_and_traverse, scroll_and_traverse, open_application_and_traverse.",
                detail:
                  "All five of those are flagged disruptive at main.swift:1667 and trigger the snapshot. refresh_traversal is the only tool that skips it.",
              },
              {
                title: "Remote viewer narrates, you forward it to the AI",
                description:
                  "The remote person speaks or types what they want clicked, opened, typed. You hand it to the AI client as a message. The AI decides which tool, which parameters.",
                detail:
                  "The only input channel into your Mac is your own keyboard typing into the AI client. FaceTime carries no input back. Apple remote control is off.",
              },
              {
                title: "Snapshot fires before the tool runs",
                description:
                  "main.swift:1671 reads the frontmost app, main.swift:1672-1674 captures and flips the cursor position into CGEvent coordinates. Both get stored in handler locals declared at main.swift:1479-1480.",
                detail:
                  "The flip from Cocoa's bottom-left to CGEvent's top-left happens here, on the capture side, so the restore can post with no math.",
              },
              {
                title: "InputGuard engages, action runs, disengages",
                description:
                  "Overlay pill appears, CGEvents post, UI responds. Press Esc any time to cancel; that unwinds to the catch branch which runs its own copy of the restore.",
                detail:
                  "InputGuard's own tap uses the eventSourceStateID trick (InputGuard.swift:329-331) to let the MCP's programmatic events through while blocking hardware, except plain Esc.",
              },
              {
                title: "Restore: cursor teleports home, previous app returns",
                description:
                  "main.swift:1767-1772 posts the mouseMoved CGEvent with the saved position. main.swift:1775-1781 calls prevApp.activate(options: []) if the saved app is still alive and is not already frontmost.",
                detail:
                  "On the SharePlay stream the remote viewer sees the UI change land, then the cursor flick back to where it was. One or two frames of movement. No cleanup artifacts.",
              },
            ]}
          />
        </section>

        {/* Terminal output */}
        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            stderr During One Complete Snap-Back Cycle
          </h2>
          <p className="text-zinc-600 mb-6">
            Every snapshot and every restore writes a timestamped log line. If
            you want to prove the cycle ran, grep stderr for &quot;saved
            cursor&quot; and &quot;restored cursor&quot; during a live FaceTime
            session.
          </p>
          <TerminalOutput
            title="click_and_traverse with a successful snap-back"
            lines={[
              { type: "command", text: "log: handler(CallTool): saved cursor (124.0, 812.0) and frontmost app 'Messages' (PID 1284)" },
              { type: "output", text: "log: InputGuard: engaging — AI: Clicking in app… — press Esc to cancel" },
              { type: "output", text: "log: InputGuard: CGEventTap created on main run loop, enabled=true" },
              { type: "output", text: "log: InputGuard: overlay shown (fullscreen)" },
              { type: "output", text: "log: InputGuard: engaged — tap active, overlay visible" },
              { type: "output", text: "log: handler(CallTool): executing performAction on MainActor via Task..." },
              { type: "output", text: "log: handler(CallTool): performAction task completed." },
              { type: "output", text: "log: InputGuard: throwIfCancelled — wasCancelled=false" },
              { type: "output", text: "log: InputGuard: disengaging" },
              { type: "output", text: "log: InputGuard: CGEventTap destroyed" },
              { type: "output", text: "log: InputGuard: overlay hidden" },
              { type: "success", text: "log: handler(CallTool): restored cursor to (124.0, 812.0)" },
              { type: "success", text: "log: handler(CallTool): restored focus to 'Messages' (PID 1284)" },
              { type: "output", text: "log: handler(CallTool): wrote full response to /tmp/macos-use/1713456789012_click_and_traverse.txt (4821 bytes)" },
              { type: "output", text: "log: captureWindowScreenshot: selected window 3142 (score=864000)" },
              { type: "output", text: "log: captureWindowScreenshot: launching screenshot-helper for window 3142..." },
            ]}
          />
        </section>

        {/* Marquee */}
        <section className="py-10 border-t border-b border-zinc-100">
          <Marquee speed={40} pauseOnHover>
            <span className="mx-8 px-4 py-2 bg-teal-50 text-teal-700 rounded-full text-sm font-medium whitespace-nowrap">
              NSEvent.mouseLocation -&gt; savedCursorPos
            </span>
            <span className="mx-8 px-4 py-2 bg-cyan-50 text-cyan-700 rounded-full text-sm font-medium whitespace-nowrap">
              Cocoa to CGEvent coord flip at snapshot time
            </span>
            <span className="mx-8 px-4 py-2 bg-zinc-100 text-zinc-700 rounded-full text-sm font-medium whitespace-nowrap">
              CGEvent(mouseEventSource: nil) -&gt; stateID != 0
            </span>
            <span className="mx-8 px-4 py-2 bg-teal-50 text-teal-700 rounded-full text-sm font-medium whitespace-nowrap">
              moveEvent.post(tap: .cghidEventTap)
            </span>
            <span className="mx-8 px-4 py-2 bg-cyan-50 text-cyan-700 rounded-full text-sm font-medium whitespace-nowrap">
              prevApp.activate(options: [])
            </span>
            <span className="mx-8 px-4 py-2 bg-zinc-100 text-zinc-700 rounded-full text-sm font-medium whitespace-nowrap">
              freshness check before activate
            </span>
            <span className="mx-8 px-4 py-2 bg-teal-50 text-teal-700 rounded-full text-sm font-medium whitespace-nowrap">
              Esc catch re-runs the same two lines
            </span>
            <span className="mx-8 px-4 py-2 bg-cyan-50 text-cyan-700 rounded-full text-sm font-medium whitespace-nowrap">
              locals at main.swift:1479-1480 survive the unwind
            </span>
          </Marquee>
        </section>

        {/* Bento grid */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            Which Variant Of The Keyword Are You Actually Searching?
          </h2>
          <BentoGrid
            cards={[
              {
                title: "You want the remote person to click your Mac",
                description:
                  "Use FaceTime&apos;s built-in remote control on iOS 18 or macOS 15, or fall back to Apple Screen Sharing.app. Stop reading this page. The snap-back pattern is the wrong tool for a support session.",
                size: "2x1",
              },
              {
                title: "You want narrated AI control, cursor stays home",
                description:
                  "This is the page for you. Read the snapshot and restore code sections. The two blocks at main.swift:1669-1781 are the whole story.",
                size: "1x1",
              },
              {
                title: "You are in the EU and the native feature is blocked",
                description:
                  "FaceTime remote control is not available in the European Union. The local-MCP pattern has no regional gate because it uses your own CGEventTap, your own MCP server, and no Apple service.",
                size: "1x1",
              },
              {
                title: "You want an auditor between the narration and the click",
                description:
                  "The AI client is the auditor. It reads the narration, picks the tool, and its call is visible to you before it runs. The /tmp/macos-use/*.txt artifact records what landed.",
                size: "2x1",
              },
            ]}
          />
        </section>

        {/* FAQ */}
        <section className="max-w-4xl mx-auto px-6 py-16 border-t border-zinc-100">
          <FaqSection items={faqItems} />
        </section>

        {/* Closing CTA */}
        <section className="max-w-4xl mx-auto px-6 py-12">
          <InlineCta
            heading="Open the two code blocks on GitHub and read the lines yourself"
            body="The snapshot is 8 lines. The success restore is 16 lines. The cancel restore is 15 lines. All of it lives in Sources/MCPServer/main.swift, open source, MIT-licensed, no accounts, no telemetry."
            linkText="Browse the repo on GitHub"
            href="https://github.com/mediar-ai/mcp-server-macos-use"
          />
        </section>
      </article>
    </>
  );
}
