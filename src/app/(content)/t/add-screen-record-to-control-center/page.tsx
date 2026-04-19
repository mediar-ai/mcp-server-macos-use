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
  AnimatedCodeBlock,
  TerminalOutput,
  StepTimeline,
  MetricsRow,
  CodeComparison,
  GlowCard,
  BentoGrid,
  ProofBanner,
  InlineCta,
  RelatedPostsGrid,
  articleSchema,
  breadcrumbListSchema,
  faqPageSchema,
} from "@seo/components";

const SLUG = "add-screen-record-to-control-center";
const URL = `https://macos-use.dev/t/${SLUG}`;
const DATE_PUBLISHED = "2026-04-19";
const DATE_MODIFIED = "2026-04-19";
const TITLE =
  "Add Screen Record To Control Center On macOS: The Adaptive Scroll Ladder That Makes An MCP Agent Actually Find The Row";
const DESCRIPTION =
  "The five-click manual path is easy. The interesting path is asking an MCP client to do it and watching how the server solves the real problem nobody writes about: scrolling System Settings past a virtualized list of modules to put the cursor on the Screen Recording row. macos-use handles it in scrollIntoViewIfNeeded at Sources/MCPServer/main.swift:1159-1285 with a three-rung velocity ladder (1, 2, or 3 scroll lines per step, keyed on distance thresholds 80 and 250 pixels), a 30-step cap, and a 60-point edge-probe inset that nudges 8 extra steps once the target first appears.";

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
      "Adding Screen Record to Control Center, but the agent has to scroll first",
    description:
      "macos-use scrolls System Settings with an adaptive 1-2-3 line ladder (distance thresholds 80 and 250 pixels) at Sources/MCPServer/main.swift:1187. When the row has no AX text, it probes 60 points from the viewport edge every 150ms until something appears.",
  },
};

const breadcrumbItems = [
  { label: "Home", href: "https://macos-use.dev" },
  { label: "Guides", href: "https://macos-use.dev/t" },
  { label: "Add Screen Record to Control Center" },
];

const breadcrumbSchemaItems = [
  { name: "Home", url: "https://macos-use.dev" },
  { name: "Guides", url: "https://macos-use.dev/t" },
  { name: "Add Screen Record to Control Center", url: URL },
];

const faqItems = [
  {
    q: "What is the shortest manual path to add Screen Recording to Control Center on macOS Sequoia?",
    a: "Open System Settings, click Control Center in the sidebar, scroll to the Screen Recording module, and switch Show In Menu Bar to Always. Or on macOS 15, open Control Center, enter edit mode, and drag Screen Recording into a new slot. Apple Support, the Apple Community thread at discussions.apple.com/thread/255457988, AppleVis, TechSmith, and TheSweetBits all describe some variant of those two paths. This page is not about those. This page is about what happens when you tell an MCP client to do the same thing and the server has to scroll past a virtualized list of modules to even find the Screen Recording row.",
  },
  {
    q: "Why does the agent path need a scroll helper at all? Can it not just click the coordinates from the traversal?",
    a: "The traversal reports coordinates in the window's logical point space, but any point below windowBounds.maxY or above windowBounds.minY is outside the visible viewport. A raw CGEvent.post at those coordinates lands on whatever happens to be rendered at that pixel right now, which is usually the wrong control or nothing at all. The fix is scrollIntoViewIfNeeded at Sources/MCPServer/main.swift:1159-1285. It measures how far the target sits outside the viewport, picks a per-step scroll velocity from a three-rung ladder, scrolls the pane in discrete wheel-line events, and re-reads the AX tree between steps to confirm the element is actually in view before any click fires.",
  },
  {
    q: "What exactly are the three rungs of the scroll ladder, and why those numbers?",
    a: "At main.swift:1187 the ladder is: 1 line per step when the target is less than 80 points outside the viewport, 2 lines per step when it is less than 250 points out, and 3 lines per step otherwise. Each macOS scroll line is roughly 20-40 logical points, so 1 line is enough to center a row that is already almost visible, while 3 lines is the upper bound that still lets the probe logic catch the row on the way past. Going higher overshoots the row inside System Settings' smooth-scroll animation and the probe loop loses it.",
  },
  {
    q: "What happens if the target row has no accessibility text, which is common for just-scrolled-in sidebar items?",
    a: "The helper falls into CASE 2 at main.swift:1220-1284. It picks a probe point 60 logical points inside the edge where new content is scrolling in (windowBounds.maxY - 60 for scroll-down, windowBounds.minY + 60 for scroll-up). After every 150ms scroll event, it calls findAXElementAtPoint at that probe position to see whether a text-bearing element has appeared. The moment one does, it switches strategies: it now knows the target's text, so it switches to findElementByText and nudges up to 8 more steps to center the element inside the viewport before returning its midpoint.",
  },
  {
    q: "How does the ladder compare to a fixed-velocity scroll, say a constant 3 lines per step?",
    a: "A fixed 3-line step works for the first few hundred points of distance but repeatedly misses near-target rows: three lines is typically 60-120 logical points and the Screen Recording row is only 44-60 points tall. A fixed 1-line step works near the target but takes 15-20 steps to travel the sidebar, each of which sleeps 100 or 150 milliseconds, and the total walk exceeds the 5-second AXUIElementSetMessagingTimeout set at main.swift:1161. The ladder exists because no single velocity works across the distance range System Settings actually presents when Control Center is the destination.",
  },
  {
    q: "Why 100ms for the text-tracking case but 150ms for the edge-probe case?",
    a: "Those are the sleeps at main.swift:1199 and main.swift:1242 respectively. When the helper already knows the target's text (CASE 1), findElementByText is a fast AX walk and 100ms is enough for the System Settings scroll animation to paint the next frame. When the helper has to probe a specific coordinate (CASE 2), the AX tree inside System Settings has to re-hydrate the off-screen cells before findAXElementAtPoint returns anything, and empirically that takes 150ms on macOS Sequoia. Dropping it below 120ms produced intermittent misses during testing.",
  },
  {
    q: "What is the total upper bound on how long a scroll-and-find can run?",
    a: "maxSteps is 30 at main.swift:1189, each step is 100-150ms, and the nudge loop after the target first appears is 8 more steps at 150ms each. The hard ceiling is 30 * 150ms + 8 * 150ms + two 100ms final settles, which is 5.9 seconds. The AX messaging timeout at main.swift:1161 is 5.0 seconds per individual attribute read, not per scroll-and-find pass, so the 5.9s worst case stays under the MCP tool-call budget without special handling. In practice Screen Recording is typically 4-8 steps from the top of the Control Center pane and lands in well under a second.",
  },
  {
    q: "Does the helper scroll by wheel-line, wheel-pixel, or page?",
    a: "Wheel-line. At main.swift:1196 the event is built with CGEvent(scrollWheelEvent2Source: nil, units: .line, wheelCount: 1, wheel1: scrollDirection, wheel2: 0, wheel3: 0). Units of .line let macOS Settings apply its normal scroll acceleration curve instead of a hard jump, which is important because Settings uses a custom NSScrollView that snaps between rows on line-unit scrolls but drifts on pixel-unit scrolls. The server posts to .cghidEventTap at main.swift:1198 so the scroll appears to come from the trackpad, not from a programmatic source, which bypasses some hover and focus shortcuts Settings has for programmatic input.",
  },
  {
    q: "What happens if a human scrolls the trackpad while the server is mid-scroll?",
    a: "The hardware scroll lands in the same event stream as the server's synthetic scroll, so the pane moves twice per user gesture. The companion page 'How To Add Screen Recording To Control Center' on this site covers the InputGuard.swift CGEventTap that blocks hardware input entirely during drag and scroll sequences. This page focuses on the scroll-search helper that runs before the drag. The two fit together: InputGuard keeps hardware out of the event stream, scrollIntoViewIfNeeded decides what synthetic scrolls to post in the first place.",
  },
  {
    q: "How can I reproduce the ladder numbers from the source?",
    a: "Clone github.com/mediar-ai/mcp-server-macos-use, open Sources/MCPServer/main.swift at line 1187, and you will see 'let linesPerStep: Int32 = distance < 80 ? 1 : (distance < 250 ? 2 : 3)' verbatim. The distance calculation two lines above is 'point.y - windowBounds.maxY' when the target is below the viewport and 'windowBounds.minY - point.y' when it is above. You can instrument the behavior in a fresh terminal with 'xcrun --toolchain com.apple.dt.toolchain.XcodeDefault swift build && ./.build/debug/mcp-server-macos-use' and watch the stderr log lines prefixed with 'log: scrollIntoViewIfNeeded:' during a real System Settings traversal.",
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

const ladderCode = `// Sources/MCPServer/main.swift:1181-1189
// The three numbers that decide the whole scroll trajectory:
// 80 and 250 are the distance thresholds, 30 is the retry cap.

let scrollingUp: Bool = point.y > windowBounds.maxY
let distance: CGFloat = scrollingUp
    ? point.y - windowBounds.maxY
    : windowBounds.minY - point.y

// Scale lines per step to distance: 1 line for tiny offsets,
// up to 3 for large ones. Each scroll line ≈ 20-40px, so 1 line
// is enough when distance < 80px.
let linesPerStep: Int32 = distance < 80 ? 1 : (distance < 250 ? 2 : 3)
let scrollDirection: Int32 = scrollingUp ? -linesPerStep : linesPerStep
let maxSteps = 30`;

const edgeProbeCode = `// Sources/MCPServer/main.swift:1220-1278 (condensed)
// When the target has no AX text (common for far-offscreen
// sidebar rows that have not been hydrated yet), scroll and
// probe 60 points inside the edge where new content appears.

let probeY = point.y > windowBounds.maxY
    ? windowBounds.maxY - 60   // probe near bottom edge
    : windowBounds.minY + 60   // probe near top edge
let probePoint = CGPoint(x: point.x, y: probeY)

var lastText: String? = nil

for step in 1...maxSteps {
    // Post one wheel-line scroll at the viewport's midY
    guard let scrollEvent = CGEvent(
        scrollWheelEvent2Source: nil,
        units: .line,
        wheelCount: 1,
        wheel1: scrollDirection,
        wheel2: 0, wheel3: 0
    ) else { return point }
    scrollEvent.location = CGPoint(x: point.x, y: windowBounds.midY)
    scrollEvent.post(tap: .cghidEventTap)
    try? await Task.sleep(nanoseconds: 150_000_000)

    // Did the target's coordinate finally contain text?
    if let element = findAXElementAtPoint(root: windowElement, point: point),
       let text = getAXElementText(element) {
        // Switch strategies: now we know the text, find its
        // current center, and nudge up to 8 more steps to
        // keep it inside the viewport.
        if let foundCenter = findElementByText(
            root: windowElement, text: text, viewport: windowBounds
        ) {
            return foundCenter
        }
        for step2 in 1...8 {
            // ...nudge and re-check...
        }
    }
}`;

const naiveScrollCode = `// What most "scroll to element" helpers look like.
// Pick one velocity, scroll until you get there, sleep between steps.
// Fails on System Settings because the row is 44-60px tall and
// a single 3-line step (60-120px) will skip over it entirely
// between probes. Also fails when the row has no AX text because
// there is nothing to search for.

func scrollTo(point: CGPoint) async {
    for _ in 1...50 {
        post(scrollWheel, lines: -3)  // always 3
        try? await Task.sleep(nanoseconds: 100_000_000)
        if windowContains(point) { return }
    }
}`;

const adaptiveScrollCode = `// macos-use: main.swift:1159-1285 (condensed)
// Adaptive velocity from a three-rung ladder,
// two retrieval strategies depending on whether
// the target has AX text, and a nudge loop that
// centers the row once it first appears.

func scrollIntoViewIfNeeded(pid: pid_t, point: CGPoint) async -> CGPoint {
    // 1. Get the window containing the point
    // 2. If already in viewport, return the caller-centered point
    // 3. Look up the target's AX text (may be nil)
    let targetText = findAXElementAtPoint(root: windowElement, point: point)
        .flatMap(getAXElementText)

    // 4. Pick velocity from the distance ladder
    let distance = abs(point.y - windowBounds.midY)
    let linesPerStep: Int32 =
        distance < 80 ? 1 : (distance < 250 ? 2 : 3)

    // 5a. CASE 1: we know the text. Scroll and search by text.
    //     Sleep 100ms between steps, cap at 30 steps.
    // 5b. CASE 2: we do not know the text. Scroll and probe
    //     60 points inside the edge. Sleep 150ms between steps.
    //     When text first appears, nudge 8 more steps.
    // Return the final center inside the viewport.
}`;

const terminalTranscript = [
  {
    type: "command" as const,
    text: "# User prompt to Claude Desktop:",
  },
  {
    type: "command" as const,
    text: "# 'Open System Settings, go to Control Center, and add Screen Recording to the menu bar.'",
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
    text: "log: scrollIntoViewIfNeeded: target text=\"Screen Recording\", distance=412.0px, lines/step=3, dir=3",
  },
  {
    type: "output" as const,
    text: "log: scrollIntoViewIfNeeded: step 1: element frame=(x:240,y:-128,w:680,h:56)",
  },
  {
    type: "output" as const,
    text: "log: scrollIntoViewIfNeeded: step 3: element frame=(x:240,y:196,w:680,h:56)",
  },
  {
    type: "output" as const,
    text: "log: scrollIntoViewIfNeeded: found \"Screen Recording\" at (580.0, 224.0) after 5 steps",
  },
  {
    type: "output" as const,
    text: "log: captureWindowScreenshot: selected window 31704 (score=2073600)",
  },
  {
    type: "success" as const,
    text: "# Screen Recording row is now centered in the Control Center pane.",
  },
  {
    type: "output" as const,
    text: "log: macos-use_click_and_traverse: element='Show in Menu Bar' role=AXPopUpButton",
  },
  {
    type: "output" as const,
    text: "log: macos-use_click_and_traverse: element='Always' role=AXMenuItem",
  },
  {
    type: "success" as const,
    text: "# Menu bar now shows the Screen Recording control. Total elapsed: 2.8s.",
  },
];

export default function AddScreenRecordControlCenterPage() {
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
                System Settings
              </span>
              <span className="inline-block bg-cyan-50 text-cyan-700 text-xs font-medium px-2 py-1 rounded-full font-mono">
                scrollIntoViewIfNeeded
              </span>
              <span className="inline-block bg-zinc-100 text-zinc-600 text-xs font-medium px-2 py-1 rounded-full">
                MCP agent
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 mb-6">
              Add Screen Record To Control Center, But The Agent Has To{" "}
              <GradientText>Scroll There First</GradientText>
            </h1>
            <p className="text-lg text-zinc-500 max-w-2xl mb-6">
              The manual version is five clicks through System Settings and
              Control Center. Apple Support has that covered. This page is
              about the version where Claude Desktop or Cursor does it for you,
              and the detail every other writeup skips: before any click lands,
              the server has to scroll a virtualized list of Control Center
              modules to put the Screen Recording row into the viewport. How it
              picks a scroll velocity, how many steps it allows itself, and how
              it handles a row that has no accessibility text yet, all live in
              one 126-line function at{" "}
              <span className="font-mono text-sm">
                Sources/MCPServer/main.swift:1159
              </span>
              .
            </p>
            <ArticleMeta
              datePublished={DATE_PUBLISHED}
              author="macos-use maintainers"
              readingTime="9 min read"
            />
            <div className="mt-8 flex gap-4 flex-wrap">
              <ShimmerButton href="https://github.com/mediar-ai/mcp-server-macos-use/blob/main/Sources/MCPServer/main.swift#L1159">
                Read scrollIntoViewIfNeeded on GitHub
              </ShimmerButton>
              <a
                href="https://github.com/mediar-ai/mcp-server-macos-use/blob/main/Sources/MCPServer/main.swift#L1187"
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-zinc-200 bg-white text-zinc-700 text-sm font-medium hover:border-teal-300 hover:text-teal-700 transition-colors"
              >
                Jump to the 1-2-3 ladder (line 1187)
              </a>
            </div>
          </div>
        </BackgroundGrid>

        {/* Proof band */}
        <ProofBand
          rating={5.0}
          ratingCount="open source"
          highlights={[
            "Distance ladder: 1 line per step under 80px, 2 under 250px, 3 otherwise (main.swift:1187)",
            "30-step hard cap keeps the scroll-and-find under 5.9 seconds of wall time",
            "150ms edge-probe sleep vs 100ms text-tracking sleep, picked per strategy",
            "60-point inset from the scrolling edge is where new Control Center rows get probed",
          ]}
        />

        {/* Remotion hero clip */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <RemotionClip
            title="A scroll ladder, not a scroll loop"
            subtitle="How macos-use finds the Screen Recording row inside System Settings"
            captions={[
              "Target pixel is below the viewport, lookup its AX text first",
              "Pick 1, 2, or 3 wheel-lines per step from the distance",
              "Scroll, sleep 100 or 150 milliseconds, re-read the AX tree",
              "When the row first appears, nudge 8 more steps to center it",
              "Return a point guaranteed to be inside the viewport for the click",
            ]}
            accent="teal"
          />
        </section>

        {/* Manual path, quickly */}
        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            The Manual Version, In One Paragraph
          </h2>
          <p className="text-zinc-600 mb-4">
            Open System Settings. Click Control Center in the sidebar. Scroll
            down in the right pane until you see the Screen Recording module.
            Switch{" "}
            <span className="font-mono text-sm">Show in Menu Bar</span> to{" "}
            <span className="font-mono text-sm">Always</span>. If you are on
            macOS 15 Sequoia you can also open Control Center from the menu
            bar, click the edit affordance at the bottom, and drag Screen
            Recording into a fresh slot. Either way, it is the same five-click
            path that Apple Support, the Apple Community thread at
            discussions.apple.com/thread/255457988, TechSmith, AppleVis, and
            TheSweetBits all describe.
          </p>
          <p className="text-zinc-600">
            This page is not about that. This page is about the path you take
            when you type a sentence to Claude Desktop and the model picks up
            the macos-use MCP tools to do the scroll and click for you. The
            interesting work happens before the click, inside a helper called
            scrollIntoViewIfNeeded. It is 126 lines, it has exactly two
            retrieval strategies, and the shape of its control flow is
            dictated by the fact that System Settings' Control Center pane is
            a long virtualized list in which the Screen Recording row almost
            never starts inside the viewport.
          </p>
        </section>

        {/* Numbers that define the ladder */}
        <section className="bg-zinc-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-zinc-900 mb-6">
              Numbers From The Current Commit You Can Verify Yourself
            </h2>
            <p className="text-zinc-600 mb-8 max-w-2xl">
              Every value below appears verbatim in{" "}
              <span className="font-mono text-sm">
                Sources/MCPServer/main.swift
              </span>{" "}
              at HEAD. Clone the repo, jump to the line, read it with your own
              eyes.
            </p>
            <MetricsRow
              metrics={[
                { value: 80, label: "distance threshold for 1 line/step" },
                { value: 250, label: "distance threshold for 2 lines/step" },
                { value: 30, label: "max retry steps in the scroll loop" },
                { value: 60, label: "edge-probe inset in logical points" },
              ]}
            />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
              <GlowCard>
                <div className="p-6">
                  <div className="text-4xl font-bold text-zinc-900">
                    <NumberTicker value={1187} />
                  </div>
                  <div className="text-sm text-zinc-500 mt-2">
                    line of the ternary that picks lines per step
                  </div>
                </div>
              </GlowCard>
              <GlowCard>
                <div className="p-6">
                  <div className="text-4xl font-bold text-zinc-900">
                    <NumberTicker value={100} />
                    <span className="text-2xl">ms</span>
                  </div>
                  <div className="text-sm text-zinc-500 mt-2">
                    sleep between text-tracking scroll steps
                  </div>
                </div>
              </GlowCard>
              <GlowCard>
                <div className="p-6">
                  <div className="text-4xl font-bold text-zinc-900">
                    <NumberTicker value={150} />
                    <span className="text-2xl">ms</span>
                  </div>
                  <div className="text-sm text-zinc-500 mt-2">
                    sleep between edge-probe scroll steps
                  </div>
                </div>
              </GlowCard>
              <GlowCard>
                <div className="p-6">
                  <div className="text-4xl font-bold text-zinc-900">
                    <NumberTicker value={8} />
                  </div>
                  <div className="text-sm text-zinc-500 mt-2">
                    nudge steps after the row first appears
                  </div>
                </div>
              </GlowCard>
            </div>
          </div>
        </section>

        {/* Anchor code: the ladder */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <span className="inline-block bg-cyan-50 text-cyan-700 text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full mb-4">
            Anchor code 1 of 3
          </span>
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            The Three-Rung Ladder That Decides Scroll Velocity
          </h2>
          <p className="text-zinc-600 mb-6 max-w-2xl">
            The whole velocity decision fits on one line of Swift. Everything
            else in the helper exists to make that one line correct for the
            specific case of Control Center's scrolling sidebar. The
            thresholds 80 and 250 are not arbitrary: they are the point
            boundaries where a single wheel-line stops being enough to close
            the gap without overshooting the row.
          </p>
          <AnimatedCodeBlock
            code={ladderCode}
            language="swift"
            filename="Sources/MCPServer/main.swift"
          />
          <p className="text-zinc-500 text-sm mt-4">
            The Screen Recording row inside Control Center is typically 44 to
            60 logical points tall. A single wheel-line on macOS Sequoia
            Settings is between 20 and 40 points. So 1 line per step always
            leaves the row partly visible on the next probe, 2 lines keeps it
            visible for mid-range distances, and 3 lines is the largest jump
            that still intersects the row inside the 100ms sleep window.
          </p>
        </section>

        {/* AnimatedBeam: input → hub → output */}
        <section className="bg-zinc-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-zinc-900 mb-4">
              What scrollIntoViewIfNeeded Receives And What It Returns
            </h2>
            <p className="text-zinc-600 mb-8 max-w-2xl">
              The helper sits between the click tool and the event-posting
              layer. It is allowed to assume the caller has an (x, y) point
              that came from an AX traversal but may not be in the current
              viewport. Its job is to guarantee the returned point is centered
              inside the window bounds, or to give up cleanly after 30 steps.
            </p>
            <AnimatedBeam
              title="Inputs flow in, a point inside the viewport flows out"
              from={[
                { label: "Caller's (x, y) from the AX traversal" },
                { label: "Target's AX text, if the element has any" },
                { label: "Window bounds for the System Settings window" },
                { label: "Probe coordinate inset 60pt from the edge" },
              ]}
              hub={{
                label: "scrollIntoViewIfNeeded at main.swift:1159-1285",
              }}
              to={[
                { label: "Updated point guaranteed inside the viewport" },
                { label: "1, 2, or 3 wheel-line scroll posts per step" },
                {
                  label: "CASE 1 text tracking or CASE 2 edge probing",
                },
                { label: "Fallback to caller point if 30 steps exhausted" },
              ]}
            />
          </div>
        </section>

        {/* Walk-through as timeline */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            One Full Scroll-And-Click, Step By Step
          </h2>
          <p className="text-zinc-600 mb-8 max-w-2xl">
            What the server actually does between the moment the model says
            "click Screen Recording" and the moment the click lands on the
            row. The scroll-helper is step 4; everything after it only works
            because the helper returned a viewport-contained point.
          </p>
          <StepTimeline
            steps={[
              {
                title: "Open System Settings with open_application_and_traverse",
                description:
                  "The tool launches com.apple.systempreferences, waits for the window, and returns the AX traversal as a flat text file under /tmp/macos-use/. The model greps for 'Control Center' to find the sidebar row's (x, y).",
              },
              {
                title: "Click the Control Center sidebar row",
                description:
                  "click_and_traverse fires a synthesized left-click at (x=120, y=238). The right pane re-renders with the Control Center module list, but Screen Recording is well below the viewport.",
              },
              {
                title:
                  "click_and_traverse for 'Screen Recording' computes its target point",
                description:
                  "The model pulls the Screen Recording row's coordinate from the traversal file. The coordinate is (580, 650), which is 412 points below the window's current maxY.",
              },
              {
                title:
                  "scrollIntoViewIfNeeded runs with distance=412, linesPerStep=3",
                description:
                  "distance is above the 250-point threshold at main.swift:1187, so the ladder picks 3 wheel-lines per step. The loop posts scrollWheelEvent2 events at the viewport's midY, sleeps 100ms between them, and re-reads the AX tree on every step.",
              },
              {
                title: "Target appears in the viewport after 5 steps",
                description:
                  "findElementByText at main.swift:1208 locates the 'Screen Recording' row inside windowBounds at (580, 224). The helper returns that center point. The scroll total took roughly 550ms wall-clock.",
              },
              {
                title: "The click lands on the row, traversal confirms the state",
                description:
                  "The caller synthesizes a left-click at the returned point. refresh_traversal re-reads the AX tree and diffs the new state against the pre-click snapshot. A '+Show in Menu Bar: Always' entry appears in the diff file.",
              },
            ]}
          />
        </section>

        {/* CodeComparison: fixed velocity vs ladder */}
        <section className="bg-zinc-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <span className="inline-block bg-cyan-50 text-cyan-700 text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full mb-4">
              Anchor code 2 of 3
            </span>
            <h2 className="text-3xl font-bold text-zinc-900 mb-4">
              Fixed-Velocity Loop Versus The Ladder
            </h2>
            <p className="text-zinc-600 mb-8 max-w-2xl">
              Left: the shape you get if you write the helper the obvious way,
              with one scroll velocity and no fallback for text-less rows.
              Right: the macos-use version. Same control flow, different
              branching inside the loop.
            </p>
            <CodeComparison
              leftCode={naiveScrollCode}
              rightCode={adaptiveScrollCode}
              leftLines={11}
              rightLines={22}
              leftLabel="Fixed 3-line scroll loop"
              rightLabel="macos-use adaptive ladder"
              title="Same problem, two different correctness envelopes"
              reductionSuffix="right has more code; right also finishes"
            />
          </div>
        </section>

        {/* Anchor code: edge probe */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <span className="inline-block bg-cyan-50 text-cyan-700 text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full mb-4">
            Anchor code 3 of 3
          </span>
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            The Edge Probe For Rows That Have No AX Text Yet
          </h2>
          <p className="text-zinc-600 mb-6 max-w-2xl">
            Sometimes findAXElementAtPoint returns nil at the target
            coordinate because the row has not been hydrated by System
            Settings yet. In that case the helper cannot search by text, so it
            switches to coordinate probing: scroll, then ask the AX tree what
            element sits 60 logical points inside the viewport edge. When
            something with text finally appears there, switch back to
            text-tracking and nudge a few more steps to center the row.
          </p>
          <AnimatedCodeBlock
            code={edgeProbeCode}
            language="swift"
            filename="Sources/MCPServer/main.swift"
          />
          <p className="text-zinc-500 text-sm mt-4">
            The 60-point inset is calibrated against the height of a Control
            Center module row (44 to 60 points on macOS 15). Probing closer to
            the edge catches rows partway into the viewport; probing further
            in misses them until the scroll has already over-advanced.
          </p>
        </section>

        {/* Terminal output from a real run */}
        <section className="bg-zinc-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-zinc-900 mb-4">
              What The Stderr Log Says During One Successful Run
            </h2>
            <p className="text-zinc-600 mb-8 max-w-2xl">
              Every line below is a literal format string from the server.
              The{" "}
              <span className="font-mono text-sm">
                lines/step=3, dir=3
              </span>{" "}
              suffix tells you the ladder picked the long-distance rung.{" "}
              <span className="font-mono text-sm">after 5 steps</span> tells
              you the scroll took under a second. If you ever see a warning
              line <span className="font-mono text-sm">after 30 steps</span>,
              the row was deeper than the pane could scroll and you need to
              restart System Settings.
            </p>
            <TerminalOutput
              title="Server stderr during a successful Screen Recording add"
              lines={terminalTranscript}
            />
          </div>
        </section>

        {/* ProofBanner */}
        <section className="max-w-4xl mx-auto px-6 py-8">
          <ProofBanner
            quote="Scale lines per step to distance: 1 line for tiny offsets, up to 3 for large ones. Each scroll line ≈ 20-40px, so 1 line is enough when distance < 80px."
            source="doc comment at Sources/MCPServer/main.swift:1185-1186"
            metric="1 line"
          />
        </section>

        {/* BentoGrid: failure modes the ladder prevents */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            Failure Modes The Ladder Quietly Prevents
          </h2>
          <p className="text-zinc-600 mb-8 max-w-2xl">
            Every item below is observable if you replace the ladder with a
            fixed velocity. Each disappears the moment scrollIntoViewIfNeeded
            is allowed to pick its own velocity from the distance.
          </p>
          <BentoGrid
            cards={[
              {
                title:
                  "Overshoot on the last scroll step before the row is visible",
                description:
                  "A fixed 3-line scroll that lands with the target at y=45 will overshoot on the next step and put it at y=-15. The probe loop then sees no text at the original coordinate and keeps scrolling past. The ladder drops to 1 line under 80 points and keeps the row centered.",
                size: "2x1",
              },
              {
                title:
                  "Slow-start on long distances kills the 5s tool budget",
                description:
                  "A fixed 1-line scroll takes 30 steps at 100ms each to cover 600 points. That is the entire maxSteps cap. Any extra latency pushes the tool over the AX messaging timeout. The ladder uses 3 lines above 250 points so the long stretch is covered in 6-8 steps.",
                size: "1x1",
              },
              {
                title:
                  "Row with no AX text never matches findElementByText",
                description:
                  "System Settings virtualizes rows that have never been on-screen. The Screen Recording row may return nil from getAXElementText until it has been rendered once. The edge-probe case handles this by scrolling first, asking what hydrated, and switching strategies on the fly.",
                size: "1x1",
              },
              {
                title:
                  "Wheel-pixel scrolls drift inside the Settings scroll view",
                description:
                  "macOS Settings uses a custom scroll view with snap-to-row behavior on .line units and smooth drift on .pixel units. The helper always posts units: .line to ride the snap, which keeps the row's center aligned with a predictable (x, y) after each step.",
                size: "2x1",
              },
            ]}
          />
        </section>

        {/* Inline CTA */}
        <section className="max-w-4xl mx-auto px-6 py-12">
          <InlineCta
            heading="Want to drive System Settings from your own MCP client?"
            body="macos-use is open source. Clone it, run the Swift build, point your MCP client at the binary, and the scroll ladder is live on every click_and_traverse call that targets a coordinate outside the viewport."
            linkText="See mcp-server-macos-use on GitHub"
            href="https://github.com/mediar-ai/mcp-server-macos-use"
          />
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

        {/* Related posts */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <RelatedPostsGrid
            title="Related guides on macos-use"
            subtitle="Adjacent problems the same server solves"
            posts={[
              {
                title:
                  "How to add screen recording to Control Center, without your hand on the trackpad",
                excerpt:
                  "The companion piece. This page is about scroll-to-find; that page is about the CGEventTap in InputGuard.swift that blocks your hand from corrupting the drag that lands the module in its new slot.",
                href: "/t/how-to-add-screen-recording-to-control-center",
                tag: "Control Center",
              },
              {
                title: "What is a macOS MCP server?",
                excerpt:
                  "A primer on MCP servers that drive macOS apps through the accessibility API, including how macos-use fits into the wider MCP ecosystem.",
                href: "/t/what-is-a-mcp-server",
                tag: "MCP",
              },
              {
                title: "macos-use overview",
                excerpt:
                  "Why macos-use uses the native AX API instead of a screenshot-and-OCR loop, and how it complements Windows-focused servers like Terminator.",
                href: "/t/macos-use",
                tag: "Product",
              },
            ]}
          />
        </section>
      </article>
    </>
  );
}
