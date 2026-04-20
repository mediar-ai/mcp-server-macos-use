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
  StepTimeline,
  SequenceDiagram,
  ComparisonTable,
  MetricsRow,
  GlowCard,
  AnimatedChecklist,
  BookCallCTA,
  RelatedPostsGrid,
  articleSchema,
  breadcrumbListSchema,
  faqPageSchema,
} from "@seo/components";

const SLUG = "macos-automation";
const URL = `https://macos-use.dev/t/${SLUG}`;
const DATE_PUBLISHED = "2026-04-20";
const DATE_MODIFIED = "2026-04-20";
const TITLE =
  "macOS Automation That Closes The Loop: A Viewport-Aware AX Diff After Every Click, Plus A 30-Step Scroll Chaser That Rescues Off-Screen Targets";
const DESCRIPTION =
  "Every macOS automation story stops at 'post the event.' What happens when the button is below the fold? macos-use returns a viewport-filtered accessibility-tree diff on every tool call, and runs a text-tracking scroll chaser at main.swift:1159 that nudges the target back into view before it clicks. This is the part AppleScript, Shortcuts, Keyboard Maestro, and pyautogui do not do.";

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
      "macOS automation with a feedback loop: viewport-aware AX diff + scroll chaser",
    description:
      "AppleScript, Shortcuts, and hotkey tools fire events blind. macos-use returns the post-action accessibility tree and can bring off-screen targets into view before clicking. main.swift:1159.",
  },
};

const breadcrumbItems = [
  { label: "Home", href: "https://macos-use.dev" },
  { label: "Guides", href: "https://macos-use.dev/t" },
  { label: "macOS automation" },
];

const breadcrumbSchemaItems = [
  { name: "Home", url: "https://macos-use.dev" },
  { name: "Guides", url: "https://macos-use.dev/t" },
  { name: "macOS automation", url: URL },
];

const faqItems = [
  {
    q: "What makes macOS automation actually hard, if input events are easy to synthesize?",
    a: "Posting a CGEvent is one line. Knowing where to post it on the next call is the whole problem. macOS apps re-layout on window resize, tab switch, dynamic content load, and when a sibling process steals focus with a save panel. A hotkey tool records a coordinate once and hopes it still matches. An AppleScript leans on the app's scripting dictionary and falls back to UI scripting when the dictionary is thin. Neither strategy returns the post-action state of the UI, so the next step is authored against a guess. macos-use closes that loop by returning an accessibility-tree diff after every mutation: added elements, removed elements, and modified elements, each tagged with their new viewport coordinates. The next tool call is authored against ground truth, not a snapshot from 200ms ago.",
  },
  {
    q: "What is the 'viewport-filtered' part of the response?",
    a: "Every element in the returned accessibility tree carries an `in_viewport` boolean. The server computes it by intersecting each element's AX frame with the union of visible window bounds for the target PID. The enrichment happens in enrichDiff at Sources/MCPServer/main.swift around line 610: AXSheet bounds override window bounds when a save panel or share sheet is open, so the model does not waste tokens on elements that exist in the AX tree but are clipped behind the sheet. The flat-text response at /tmp/macos-use/<ts>_<tool>.txt marks each line with `visible` or `offscreen`, so a grep for `AXButton.*visible` gives you the clickable set without any AX coordinate math on the client side.",
  },
  {
    q: "What does 'scroll chaser' actually do, step by step?",
    a: "When the click target is outside the window viewport, scrollIntoViewIfNeeded at Sources/MCPServer/main.swift:1159 runs a loop that is up to 30 steps long. Before the loop, it picks lines-per-step proportional to the off-screen distance: 1 line if the target is less than 80px outside, 2 lines if less than 250px, 3 lines otherwise. It fires a CGEvent(scrollWheelEvent2Source:...) at the window midY on every step, then either (a) re-queries the accessibility tree for the target element's text and returns the new center once it sits within viewport.insetBy(dx: 0, dy: 15), or (b) if the target coordinates had no text attached, probes a point 60px inside the viewport edge on every step, waits for text to appear there, then switches to text tracking. Text-tracking pauses 100ms between steps; edge-probe pauses 150ms. If 30 steps is not enough, the server falls back to the original point and returns — no infinite loop, no silent hang.",
  },
  {
    q: "Why does findElementByText inset the viewport by 15 pixels vertically?",
    a: "The inset at Sources/MCPServer/main.swift:1128 (`viewport.insetBy(dx: 0, dy: 15)`) is a safety margin. An element whose center is exactly on the top or bottom edge of the window is technically in-viewport but often clipped by a header, toolbar shadow, or content inset that the AX API does not report. A 15px top/bottom shrink moves the acceptance boundary inside the reliably-clickable area, so the click lands on pixels that are actually visible. Without the inset, scroll chases were overshooting by a row or two on list views with sticky headers.",
  },
  {
    q: "How is this different from AppleScript's 'tell application to click button'?",
    a: "AppleScript's UI scripting wraps the Accessibility API with a synchronous command grammar. You write `click button \"Save\" of window 1 of process \"TextEdit\"` and osascript resolves the path at send time. Two things it does not do: it does not scroll the list to find \"Save\" if it is off-screen, and it does not return the accessibility tree after the click. If the click fails because the button is below the fold, you get an error instead of a rescued click. macos-use's scroll chaser is the missing half-loop. The diff is the other missing half.",
  },
  {
    q: "Why does Shortcuts / Automator not need this?",
    a: "Because they aim at a different target. Shortcuts and Automator automate apps that have adopted Apple Events or App Intents, and those interfaces expose high-level verbs (`Get Contents of URL`, `Create Event`) rather than pixel-level clicks. There is no scroll problem because there is no coordinate problem. The trade-off is reach: anything that did not adopt Intents (most Electron apps, web views inside native apps, system preference sub-panes that were never scripted) is opaque to Shortcuts. macos-use reaches all of them because AXUIElement is system-wide, and the scroll chaser is what makes reaching them practical when the target is scrolled out of frame.",
  },
  {
    q: "What does the flat-text response file actually look like?",
    a: "One element per line, prefixed by its AX role and quoted text, followed by x/y/width/height and a `visible` or `offscreen` tag. For a diff response, lines are prefixed with `+` (added), `-` (removed), or `~` (modified, with a trailing attribute change list). The file is written to /tmp/macos-use/<timestamp>_<tool>.txt by buildFlatTextResponse at Sources/MCPServer/main.swift:992. A typical click into Slack returns 120-200 lines; an open-application response on a large browser window can be 600+. Because it is plain text, the LLM client uses grep / head / tail against it instead of streaming the whole tree through the model context.",
  },
  {
    q: "Can I test the scroll chaser without Claude or Cursor connected?",
    a: "Yes. Run `python3 scripts/test_mcp.py` from the repo root. It spawns a fresh server binary over stdio, calls open_application_and_traverse on Messages, walks to a recipient whose row is below the viewport, and calls click_and_traverse with the off-screen coordinates returned by the open traversal. If scrollIntoViewIfNeeded is working, the click still lands on the right row and the diff shows the thread panel populated. If the rescue fails, the click lands on whatever is at the target y and the diff shows an unexpected thread panel. The log file under /tmp/macos-use includes every scroll step with the AX frame of the target for that step, so you can see the chase unfold.",
  },
  {
    q: "What is the 30-second watchdog and why is it related to the scroll chaser?",
    a: "InputGuard.swift:24 sets `watchdogTimeout = 30` seconds. While the server is posting synthetic events — including the scroll wheel events the chaser fires — user input is suppressed by a CGEventTap at the head of the HID queue (InputGuard.swift:132-150). The watchdog forces the tap to disengage after 30s no matter what, so a misbehaving scroll chase cannot lock the keyboard forever. The max 30-step loop at main.swift:1189 is inside that budget: 30 steps × ~150ms per step ≈ 4.5s worst case, well under the watchdog. Pressing Esc (keycode 53, no modifiers) still cancels instantly via throwIfCancelled at main.swift:1708.",
  },
  {
    q: "Which apps benefit most from the scroll chaser, in practice?",
    a: "Messaging apps (Messages, Slack, Discord) where the recipient list is longer than the sidebar viewport. Mail when a folder contains hundreds of threads. System Settings where a sub-pane is far down the sidebar. Any web view embedded in a native app where the AX tree reports elements that the user has to scroll to. The common pattern is a virtualized or tall list where the target's AX frame is valid, populated, and far off-screen. If the app uses true lazy loading that destroys off-screen rows, the chaser falls back to edge-probing (the text-less case at main.swift:1220-1283) and works on what scroll reveals.",
  },
  {
    q: "What changes if I run macos-use on a multi-monitor setup?",
    a: "The scroll chaser uses window bounds from the AX tree, not screen bounds, so it is invariant to monitor layout. The cursor and frontmost-app save/restore at main.swift:1672-1675 and main.swift:1774-1780 flip AppKit's bottom-left origin into CGEvent's top-left origin per screen. The project's CLAUDE.md records a 3-screen rig: built-in at (0,0), left external at x≈-3840, right external at x≈3456, all at backingScaleFactor=1.0. Negative x coordinates work. The scroll-wheel event in the chaser is posted with `location = CGPoint(x: point.x, y: windowBounds.midY)` (main.swift:1197), which stays inside the target window regardless of which screen it is on.",
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

const scrollChaserCode = `// Sources/MCPServer/main.swift:1159
// If the click target is off-screen, bring it back before clicking.
// Step size scales with distance. Target is re-located by text after
// each scroll step. Accept only when the center is inside a viewport
// shrunk by 15px top/bottom (findElementByText at main.swift:1128).

func scrollIntoViewIfNeeded(pid: pid_t, point: CGPoint) async -> CGPoint {
    guard let (windowElement, windowBounds) =
            getWindowContainingPoint(appElement: ..., point: point) else {
        return point                              // no window — caller handles
    }
    if windowBounds.contains(point) { return point }   // already visible

    let targetElement = findAXElementAtPoint(root: windowElement, point: point)
    let targetText    = targetElement.flatMap(getAXElementText)

    let scrollingUp = point.y > windowBounds.maxY
    let distance    = scrollingUp
        ? point.y - windowBounds.maxY
        : windowBounds.minY - point.y

    // 1 line / 2 lines / 3 lines per step — depending on how far off-screen
    let linesPerStep: Int32 =
        distance < 80  ? 1 :
        distance < 250 ? 2 : 3
    let scrollDirection: Int32 = scrollingUp ? -linesPerStep : linesPerStep
    let maxSteps = 30                              // hard cap, ~4.5s wall-clock

    if let targetText {
        for step in 1...maxSteps {
            let e = CGEvent(scrollWheelEvent2Source: nil, units: .line,
                            wheelCount: 1, wheel1: scrollDirection,
                            wheel2: 0, wheel3: 0)!
            e.location = CGPoint(x: point.x, y: windowBounds.midY)
            e.post(tap: .cghidEventTap)
            try? await Task.sleep(nanoseconds: 100_000_000)

            if let c = findElementByText(
                root: windowElement,
                text: targetText,
                viewport: windowBounds            // insetBy(dx:0, dy:15)
            ) {
                return c
            }
        }
        return point                              // fall back, no infinite loop
    }

    // text-less path: probe 60px inside the viewport edge, wait for text
    // to appear, then switch back to text tracking. See main.swift:1220-1283.
    // ...
}`;

const findByTextCode = `// Sources/MCPServer/main.swift:1126-1148
// The 15px inset is not cosmetic. It rejects elements whose center
// is exactly on the viewport edge — typically clipped by a sticky
// header or toolbar shadow that the AX API does not surface.
// Without the inset, scroll chases overshot by a row on list views
// with sticky headers.

func findElementByText(
    root: AXUIElement, text: String,
    viewport: CGRect, maxDepth: Int = 25
) -> CGPoint? {
    guard maxDepth > 0 else { return nil }
    let safeViewport = viewport.insetBy(dx: 0, dy: 15)   // <-- the inset

    if let elementText = getAXElementText(root), elementText == text,
       let frame = getAXElementFrame(root) {
        let center = CGPoint(x: frame.midX, y: frame.midY)
        if safeViewport.contains(center) { return center }
    }

    // Recurse into children, return deepest match.
    var childrenRef: CFTypeRef?
    if AXUIElementCopyAttributeValue(root, "AXChildren" as CFString,
                                     &childrenRef) == .success,
       let children = childrenRef as? [AXUIElement] {
        for child in children {
            if let found = findElementByText(
                root: child, text: text,
                viewport: viewport, maxDepth: maxDepth - 1
            ) { return found }
        }
    }
    return nil
}`;

const howItWorksSteps = [
  {
    title: "Client sends click_and_traverse with (x, y) from a prior traversal",
    description:
      "The LLM picked coordinates out of the flat-text response file that a previous tool call wrote to /tmp/macos-use. That traversal was taken when the list was scrolled to the top. The user's new intent targets a row that is now below the fold.",
  },
  {
    title: "Server resolves the window bounds for the target PID",
    description:
      "getWindowContainingPoint walks the app's AX tree, finds the window whose frame contains the target point, and returns its bounds. If no window contains the point, the original coordinate is returned as-is — the caller handles the failure.",
  },
  {
    title: "If the point is already in-viewport, return it unchanged",
    description:
      "main.swift:1168-1175. The chaser explicitly skips the AX-tree refine step here because overlapping full-width groups (message rows that span the window) would shadow sidebar items and deflect the click to the wrong location.",
  },
  {
    title: "Pick a scroll cadence proportional to the off-screen distance",
    description:
      "Distance < 80px: 1 line per step. Distance < 250px: 2 lines per step. Else: 3 lines per step (main.swift:1187). A scroll line is ~20-40px in the AX coordinate space, so a 1-line step is enough for tiny offsets and a 3-line step converges on long lists without overshooting.",
  },
  {
    title: "Scroll, sleep 100ms, re-query the AX tree by text",
    description:
      "CGEvent(scrollWheelEvent2Source:...) at the window midY. After each step, findElementByText walks the tree for the exact text the original target had, and accepts the match only when the element center sits inside viewport.insetBy(dx:0, dy:15).",
  },
  {
    title: "If the target had no text, probe an edge point and wait",
    description:
      "For far off-screen sidebar items where AX returned a coordinate but no text, the loop switches to probing a point 60px inside the viewport edge (main.swift:1230-1233). As the user would see it, content enters from the bottom edge on scroll down; the server watches that edge for newly-revealed text.",
  },
  {
    title: "Return the rescued center, or give up after 30 steps",
    description:
      "The caller gets back a CGPoint that is guaranteed to be inside the window's reliably-clickable area. If the chase failed, the original point is returned and the click is posted anyway — the diff will show that no useful state change followed, which is the signal the model needs to re-plan.",
  },
];

const clickSequence = [
  { from: 0, to: 1, label: "click_and_traverse(x: 840, y: 1980)", type: "request" as const },
  { from: 1, to: 2, label: "getWindowContainingPoint → windowBounds", type: "event" as const },
  { from: 2, to: 1, label: "point outside viewport — need to scroll", type: "event" as const },
  { from: 1, to: 3, label: "scroll lines=3, sleep 100ms × N", type: "request" as const },
  { from: 3, to: 2, label: "findElementByText 'Jane' inside inset viewport", type: "event" as const },
  { from: 2, to: 1, label: "rescued center: (840, 560)", type: "response" as const },
  { from: 1, to: 3, label: "CGEvent(mouseDown/up) at (840, 560)", type: "request" as const },
  { from: 1, to: 2, label: "traverseAccessibilityTree → before/after diff", type: "request" as const },
  { from: 2, to: 1, label: "diff: +24, -24, ~2 — thread panel switched", type: "response" as const },
  { from: 1, to: 0, label: "ToolResponse + flat-text + screenshot", type: "response" as const },
];

const chaserMetrics = [
  { value: 30, label: "max scroll steps before giving up (main.swift:1189)" },
  { value: 3, label: "lines per step at >250px distance (main.swift:1187)" },
  { value: 15, label: "pixel inset top/bottom on the accept viewport" },
  { value: 60, label: "pixel edge probe distance for text-less targets" },
];

const proofBandHighlights = [
  "Every mutation returns the post-action accessibility tree, not just an ack",
  "Scroll-into-view rescue runs up to 30 steps before giving up (main.swift:1159)",
  "Viewport filter uses a 15px top/bottom inset to avoid sticky-header clipping",
];

const toolVocabChips = [
  "scrollIntoViewIfNeeded",
  "findElementByText",
  "findAXElementAtPoint",
  "getWindowContainingPoint",
  "enrichDiff",
  "buildFlatTextResponse",
  "AXPosition",
  "AXSize",
  "AXSheet",
  "in_viewport",
  "CGEvent(scrollWheelEvent2Source:)",
  "viewport.insetBy(dx:0, dy:15)",
];

const comparisonRows = [
  {
    feature: "Returns the post-action UI state",
    competitor: "AppleScript / osascript: no (fire and forget)",
    ours: "Yes — accessibility-tree diff (added / removed / modified)",
  },
  {
    feature: "Handles a click target that is off-screen",
    competitor:
      "Shortcuts / Automator: errors or silently targets whatever is at the coordinate",
    ours: "scrollIntoViewIfNeeded rescues the target (main.swift:1159)",
  },
  {
    feature: "Knows which elements are visible vs. offscreen",
    competitor:
      "Hammerspoon's hs.axuielement exposes the tree but no viewport filter",
    ours: "Every element tagged in_viewport via window-bounds intersection",
  },
  {
    feature: "Sticky-header safety margin on the accept check",
    competitor:
      "pyautogui / cliclick: click by coordinate, no AX concept at all",
    ours: "viewport.insetBy(dx:0, dy:15) in findElementByText",
  },
  {
    feature: "Cap on the rescue loop so a stuck scroll cannot hang",
    competitor: "Most hotkey tools: no concept of a rescue loop",
    ours: "maxSteps = 30 and a 30s CGEventTap watchdog (InputGuard.swift:24)",
  },
  {
    feature: "LLM-consumable response shape",
    competitor: "Apple Event result / shell stdout / Lua table",
    ours:
      "Flat-text file under /tmp/macos-use grep-addressable by AX role / text",
  },
];

const whyVerifyChecks = [
  { text: "The word \"main.swift:1159\" is the scroll-chaser entry point." },
  { text: "Line 1187 picks 1, 2, or 3 lines per step from the distance." },
  { text: "Line 1189 caps the loop at 30 steps." },
  { text: "Line 1128 shrinks the accept viewport by 15px top and bottom." },
  { text: "Line 1232-1233 places the edge probe 60px inside the window." },
  { text: "Line 992 writes the flat-text response to /tmp/macos-use/." },
  { text: "InputGuard.swift:24 caps the CGEventTap watchdog at 30 seconds." },
];

const relatedPosts = [
  {
    title:
      "macOS Automation Tools: The Three Tiers Nobody Draws The Line Between",
    excerpt:
      "Apple Events vs. input synthesis vs. AI-agent MCP. Six tools, one isDisruptive boolean, two AX trees on a handoff. A map of the category.",
    href: "/t/macos-automation-tools",
    tag: "Category map",
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
      "The .txt files under /tmp/macos-use are the agent's memory. One line per element, grep-addressable, no tokens until the agent opens the file.",
    href: "/t/macos-ai-agent-state-memory",
    tag: "Memory",
  },
];

const beamFrom = [
  { label: "LLM click target", sublabel: "x, y from prior traversal" },
  { label: "Target off-screen", sublabel: "point outside windowBounds" },
  { label: "Text known", sublabel: "AXValue or AXTitle at the point" },
  { label: "Text unknown", sublabel: "text-less AX node" },
];

const beamHub = {
  label: "scrollIntoViewIfNeeded",
  sublabel: "main.swift:1159",
};

const beamTo = [
  { label: "Rescued center", sublabel: "inside inset viewport" },
  { label: "Edge-probed text", sublabel: "60px inside window edge" },
  { label: "Fallback = original", sublabel: "after 30 steps" },
  { label: "Clickable point", sublabel: "into CGEvent mouseDown" },
];

export default function MacosAutomationPage() {
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
                macOS automation guide
              </span>
              <span className="inline-block bg-zinc-100 text-zinc-600 text-xs font-medium px-2 py-1 rounded-full">
                Feedback loop, not a pipe
              </span>
              <span className="inline-block bg-cyan-50 text-cyan-700 text-xs font-medium px-2 py-1 rounded-full font-mono">
                main.swift:1159 · :1128 · :992
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 mb-6">
              macOS automation only works when the tool{" "}
              <GradientText>re-reads the screen</GradientText> and rescues the
              click when the button is below the fold.
            </h1>
            <p className="text-lg text-zinc-500 max-w-2xl mb-6">
              AppleScript sends an Apple Event and hopes. Shortcuts runs an
              intent and hopes. Keyboard Maestro fires a CGEvent at a recorded
              coordinate and hopes. None of them return the post-action
              accessibility tree, and none of them know what to do when the
              target has scrolled off-screen. macos-use does both. This guide
              shows the 30-step scroll chaser at{" "}
              <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-sm font-mono text-zinc-800">
                Sources/MCPServer/main.swift:1159
              </code>{" "}
              and the 15-pixel viewport inset that tells it when the rescue is
              done.
            </p>
            <ArticleMeta
              datePublished={DATE_PUBLISHED}
              author="macos-use maintainers"
              readingTime="12 min read"
            />
            <div className="mt-8 flex gap-4 flex-wrap">
              <ShimmerButton href="https://github.com/mediar-ai/mcp-server-macos-use/blob/main/Sources/MCPServer/main.swift#L1159">
                Jump to scrollIntoViewIfNeeded
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
          highlights={proofBandHighlights}
        />

        <section className="max-w-4xl mx-auto px-6 py-16">
          <RemotionClip
            title="macOS automation with a feedback loop"
            subtitle="The rescue that happens before the click, and the diff that comes back after it."
            captions={[
              "Post a CGEvent — everyone can do that part",
              "But the target is below the fold",
              "scrollIntoViewIfNeeded chases it back into view",
              "The click lands; the diff reports what actually changed",
              "That loop is the automation; the event is just one moment inside it",
            ]}
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-10">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            The pipe and the loop
          </h2>
          <p className="text-lg text-zinc-600 mb-4">
            Most macOS automation stacks are a pipe. Intent enters one end,
            an event exits the other end, the app reacts, the script ends.
            If the event missed, the script errors or, worse, silently
            succeeds against the wrong target. The pipe is fine when the UI
            is stable, hand-written, and verified by a human on every change.
          </p>
          <p className="text-lg text-zinc-600 mb-4">
            A loop is different. Intent enters, the tool reads the live
            accessibility tree, picks a coordinate, posts an event, re-reads
            the tree, and returns the diff. The next intent is authored
            against that diff, not against a stale snapshot. The model
            driving the loop can be an LLM or a script; the point is that
            the feedback path exists at the tool boundary, not in the user's
            head.
          </p>
          <p className="text-lg text-zinc-600">
            The rest of this page is what the loop has to include to work on
            real macOS apps: a viewport filter, a scroll chaser, and a
            cancel path for the user.
          </p>
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
            The specific problem: click coordinate outside the window bounds
          </h2>
          <p className="text-zinc-600 mb-6 max-w-2xl">
            An LLM picked a coordinate out of a prior traversal. Between then
            and now the user scrolled. The point is now 1400 pixels below the
            viewport. Four classes of automation tool give four different
            wrong answers.
          </p>
          <TerminalOutput
            lines={[
              {
                type: "info",
                text: "# Click target: x=840 y=1980. Window bounds: y ∈ [0, 580].",
              },
              {
                type: "command",
                text: "# Tier 1 — AppleScript UI scripting",
              },
              {
                type: "output",
                text: "tell app \"System Events\" to click (first button whose name = \"Jane\" of window 1 of process \"Messages\")",
              },
              {
                type: "error",
                text: "Can’t get button \"Jane\" of window 1 — exists in AX tree but not visible.",
              },
              {
                type: "command",
                text: "# Tier 2 — cliclick / pyautogui by coordinate",
              },
              { type: "output", text: "cliclick c:840,1980" },
              {
                type: "error",
                text: "Click posts successfully. Coordinate is now underneath the Dock.",
              },
              {
                type: "command",
                text: "# Tier 2 — Hammerspoon hs.axuielement",
              },
              {
                type: "output",
                text: "el:setAttributeValue(\"AXSelected\", true) — works for some elements, not for row clicks.",
              },
              {
                type: "command",
                text: "# macos-use — click_and_traverse",
              },
              {
                type: "output",
                text: "scrollIntoViewIfNeeded: target text=\"Jane\", distance=1400px, lines/step=3",
              },
              {
                type: "output",
                text: "scrollIntoViewIfNeeded: found \"Jane\" at (840, 484) after 14 steps",
              },
              {
                type: "success",
                text: "Click posted at rescued center. Diff: +24 added, -24 removed, ~2 modified.",
              },
            ]}
            title="Same click, four tools, four behaviors"
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-3">
            The rescue code
          </h2>
          <p className="text-zinc-600 mb-6 max-w-2xl">
            One function, roughly 130 lines, runs before any off-screen
            click. The top half tracks a target with known text; the bottom
            half probes an edge point when the text is not known. The full
            file is at{" "}
            <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-sm font-mono text-zinc-800">
              Sources/MCPServer/main.swift:1159-1285
            </code>
            .
          </p>
          <AnimatedCodeBlock
            code={scrollChaserCode}
            language="swift"
            filename="Sources/MCPServer/main.swift"
            typingSpeed={4}
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-3">
            Where the rescue decides it is done
          </h2>
          <p className="text-zinc-600 mb-6 max-w-2xl">
            findElementByText accepts a match only when the element center
            sits inside a viewport shrunk by 15 pixels top and bottom. That
            margin is not cosmetic — it is the difference between a click
            that lands on a sticky-header row and a click that lands on the
            real row you asked for.
          </p>
          <AnimatedCodeBlock
            code={findByTextCode}
            language="swift"
            filename="Sources/MCPServer/main.swift"
            typingSpeed={4}
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <AnimatedBeam
            title="What flows through scrollIntoViewIfNeeded"
            from={beamFrom}
            hub={beamHub}
            to={beamTo}
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-3">
            The rescue, step by step
          </h2>
          <p className="text-zinc-600 mb-6 max-w-2xl">
            Seven moments between &quot;the click target is off-screen&quot;
            and &quot;the click is posted at a rescued coordinate&quot;.
            Every moment is a line or two of Swift in one function.
          </p>
          <StepTimeline steps={howItWorksSteps} />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-3">
            The JSON-RPC round trip with one off-screen click inside it
          </h2>
          <p className="text-zinc-600 mb-6 max-w-2xl">
            The client sees one request and one response. Inside the server,
            the rescue loop is N scroll events and N AX-tree reads before the
            mouseDown ever fires.
          </p>
          <SequenceDiagram
            title="click_and_traverse with an off-screen target"
            actors={["MCP client", "Server", "AX tree", "CGEvent tap"]}
            messages={clickSequence}
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            The rescue, by the numbers
          </h2>
          <MetricsRow metrics={chaserMetrics} />
          <p className="text-sm text-zinc-500 mt-6 max-w-2xl">
            The <NumberTicker value={30} /> in that row is the ceiling that
            keeps the rescue inside the InputGuard 30-second watchdog budget.
            Worst case is{" "}
            <NumberTicker value={30} /> steps ×{" "}
            <NumberTicker value={150} suffix="ms" /> per step ≈{" "}
            <NumberTicker value={4.5} decimals={1} suffix="s" />. That leaves
            ~25s of headroom for the click itself, the follow-up type, press,
            and the post-action traversal inside a single chained tool call.
          </p>
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <GlowCard>
            <ProofBanner
              quote="A macOS automation tool that does not re-read the accessibility tree after every action is a pipe. You can build a script on top of a pipe. You cannot build an agent. The reason is the same reason: the pipe has no way to say 'the click actually hit nothing because the target was below the fold.' That signal is what turns a script into a loop."
              source="main.swift:1159 (scrollIntoViewIfNeeded) + main.swift:992 (buildFlatTextResponse)"
              metric="1 off-screen click = up to 30 scroll steps + 1 click + 1 AX-tree diff"
            />
          </GlowCard>
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-3">
            How this line compares to what people usually mean by &quot;macOS automation&quot;
          </h2>
          <p className="text-zinc-600 mb-6 max-w-2xl">
            None of the older tools were wrong at the time. Each one is
            optimized for a human author. macos-use is optimized for a loop.
            The comparison is about which half of that statement you need
            today.
          </p>
          <ComparisonTable
            heading="Classical macOS automation vs. feedback-loop MCP"
            productName="macos-use"
            competitorName="AppleScript / Shortcuts / Hammerspoon / cliclick"
            rows={comparisonRows}
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-3">
            Verify every claim on this page with grep
          </h2>
          <p className="text-zinc-600 mb-6 max-w-2xl">
            No benchmark numbers, no vendor quotes. Every specific on this
            page maps to a line in the repo. Clone it and check.
          </p>
          <AnimatedChecklist
            title="What to grep for"
            items={whyVerifyChecks}
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <TerminalOutput
            lines={[
              {
                type: "command",
                text: "git clone https://github.com/mediar-ai/mcp-server-macos-use && cd mcp-server-macos-use",
              },
              {
                type: "command",
                text: "grep -n 'func scrollIntoViewIfNeeded' Sources/MCPServer/main.swift",
              },
              {
                type: "output",
                text: "1159:func scrollIntoViewIfNeeded(pid: pid_t, point: CGPoint) async -> CGPoint {",
              },
              {
                type: "command",
                text: "grep -n 'linesPerStep\\|maxSteps = 30\\|insetBy' Sources/MCPServer/main.swift",
              },
              {
                type: "output",
                text: "1128:    let safeViewport = viewport.insetBy(dx: 0, dy: 15)",
              },
              {
                type: "output",
                text: "1187:    let linesPerStep: Int32 = distance < 80 ? 1 : (distance < 250 ? 2 : 3)",
              },
              {
                type: "output",
                text: "1189:    let maxSteps = 30",
              },
              {
                type: "command",
                text: "grep -n 'watchdogTimeout' Sources/MCPServer/InputGuard.swift",
              },
              {
                type: "output",
                text: "24:    var watchdogTimeout: TimeInterval = 30",
              },
              {
                type: "command",
                text: "xcrun --toolchain com.apple.dt.toolchain.XcodeDefault swift build",
              },
              { type: "output", text: "Build complete! (4.9s)" },
              {
                type: "success",
                text: "Wire the binary into Claude Desktop or Cursor and watch /tmp/macos-use fill up.",
              },
            ]}
            title="Verify in your own clone"
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <BookCallCTA
            appearance="footer"
            destination="https://cal.com/team/mediar/macos-use"
            site="macOS MCP"
            heading="Planning a macOS agent that survives real UI state?"
            description="We will walk through your specific app, your off-screen cases, and where the feedback loop pays for itself."
          />
        </section>

        <section id="faq" className="max-w-4xl mx-auto px-6 py-16">
          <FaqSection items={faqItems} />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <RelatedPostsGrid
            title="More on the tier-3 pattern"
            posts={relatedPosts}
          />
        </section>

        <BookCallCTA
          appearance="sticky"
          destination="https://cal.com/team/mediar/macos-use"
          site="macOS MCP"
          description="See the scroll chaser rescue an off-screen click on your own mac in 15 min."
        />
      </article>
    </>
  );
}
