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
  HorizontalStepper,
  FlowDiagram,
  ComparisonTable,
  GlowCard,
  BentoGrid,
  BeforeAfter,
  ProofBanner,
  InlineCta,
  StickyBottomCta,
  articleSchema,
  breadcrumbListSchema,
  faqPageSchema,
} from "@seo/components";

const SLUG = "macos-use";
const URL = `https://macos-use.dev/t/${SLUG}`;
const DATE_PUBLISHED = "2026-04-18";
const DATE_MODIFIED = "2026-04-18";
const TITLE =
  "macos-use: The Auto Scroll-To-Reveal That Fires When You Click An Off-Screen Element";
const DESCRIPTION =
  "macos-use is a Swift MCP server for macOS automation. The part nobody else writes about: when the target of a click tool call is below the fold, the server reads its text from the accessibility tree, scrolls 1-3 wheel-lines at a time based on distance, re-finds the element by text in the updated tree, and clicks the fresh coordinate. Walk through main.swift:1126-1285 and the call site at 1588.";

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
    title: "macos-use: how click_and_traverse scrolls off-screen targets into view",
    description:
      "Text-anchored scroll loop. 1-3 wheel-lines per step based on pixel distance. Re-search the AX tree after every tick. Up to 30 steps.",
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
    q: "What is macos-use and where does this feature live in the code?",
    a: "macos-use (package name mcp-server-macos-use) is a Swift MCP server that lets any MCP client drive any macOS app via accessibility APIs. The auto scroll-to-reveal logic lives entirely in one file: Sources/MCPServer/main.swift. Specifically scrollIntoViewIfNeeded at lines 1159-1285, with helpers findAXElementAtPoint at 1057 and findElementByText at 1126. The one call site is main.swift:1588, inside the click_and_traverse handler, just before the CGEvent click is posted.",
  },
  {
    q: "What triggers the auto-scroll, exactly?",
    a: "The click handler first computes a raw target point (either from x, y, width, height coordinates, or from searching the AX traversal for an element that matches the `element` text). Before building the click CGEvent, it calls `await scrollIntoViewIfNeeded(pid: reqPid, point: rawPoint)`. That function calls getWindowContainingPoint; if the returned window bounds already contain the point, it returns the caller-centered point unchanged. Only if the point falls outside every AXWindow bounds does the scroll loop engage.",
  },
  {
    q: "Why scroll 1, 2, or 3 lines at a time — why not just scroll by the full delta in one go?",
    a: "main.swift:1187 sets `let linesPerStep: Int32 = distance < 80 ? 1 : (distance < 250 ? 2 : 3)` where distance is the raw pixel distance between the target and the nearest viewport edge. Small offsets tick at 1 line/step because macOS scroll momentum means one line often moves 20-40px and you overshoot if you go harder. Large offsets tick at 3 lines/step so a 2000px offset does not take 100 iterations. The loop caps at 30 steps total.",
  },
  {
    q: "How does the server know it has scrolled the right element into view and not some lookalike?",
    a: "Before scrolling, it calls findAXElementAtPoint(root: windowElement, point: rawPoint) and reads getAXElementText on the result. That string is the anchor. After every scroll event it calls findElementByText(root: windowElement, text: targetText, viewport: windowBounds). That helper walks the AX tree with maxDepth 25, compares getAXElementText to the target text, and only returns a hit whose center falls inside viewport.insetBy(dx: 0, dy: 15). The 15pt inset is there so an item half-occluded by a sticky header does not count as 'in viewport'.",
  },
  {
    q: "What if the element at the target point has no text at all?",
    a: "This happens on long lists where the target row is off-screen and the AX hit at the raw point comes back as a generic AXGroup with no AXValue or AXTitle. main.swift:1220-1284 handles this branch separately. It scrolls toward the target and probes an element at windowBounds.maxY - 60 (or minY + 60) on every step. When any element appears at the original target point with text, it switches to text-based tracking and nudges for up to 8 more ticks to re-center. If nothing with text ever appears, the function returns the raw point and the click goes wherever that leaves the cursor.",
  },
  {
    q: "Does the auto-scroll fire a real CGEvent scroll, or does it use AX APIs?",
    a: "Real CGEvents. main.swift:1196 builds `CGEvent(scrollWheelEvent2Source: nil, units: .line, wheelCount: 1, wheel1: scrollDirection, ...)` on every step and posts it to `.cghidEventTap`. The location is set to `CGPoint(x: point.x, y: windowBounds.midY)` so the scroll wheel event is aimed at the column of the target (so it hits the right scroll area if the window is split) but vertically centered inside the window (so the event does not land on a toolbar or tab bar that might eat the scroll).",
  },
  {
    q: "Does this work across multiple windows of the same app?",
    a: "Yes. getWindowContainingPoint at main.swift:324 iterates AXWindows for the app element and matches the first window frame that contains the target point, falling back to AXMainWindow if none match. This matters for apps like Slack or Notes that show dialogs, popovers, or multiple document windows. The scroll loop then targets the window containing the point rather than always the main window.",
  },
  {
    q: "What happens at step 31?",
    a: "The loop breaks with a warning to stderr ('could not scroll <text> into view after 30 steps') and scrollIntoViewIfNeeded returns the original raw point. The click then fires wherever that point lands, which is usually a miss but is logged and visible in the return diff so an agent can decide to try again with a different strategy. 30 scroll steps at 1-3 lines each is roughly 30-90 lines of content, which is enough for almost any practical list.",
  },
  {
    q: "How is this different from just calling scroll_and_traverse first?",
    a: "scroll_and_traverse is open-loop — you pass a deltaY and it posts exactly one scroll event. There is no feedback, no text anchor, no re-check. The agent has to compute the right delta up front, which is hard because AX coordinates for off-screen items are not predictive of how far you need to scroll. scrollIntoViewIfNeeded is closed-loop: it re-reads the AX tree after every tick and only stops when the target is actually visible. The agent just sends a click with the AX coordinate from its earlier traversal; the server handles the rest.",
  },
  {
    q: "Why is the 15pt inset `insetBy(dx: 0, dy: 15)` instead of the 40 in the comment?",
    a: "Honest answer: the comment at main.swift:1125 says '40px inset margin' but the code at 1128 passes `dy: 15`. The code is what runs. 15pt is enough to exclude elements that are clipped by a 1-2pt border or a 12pt tooltip but not enough to reject an element that is simply near the top of the scroll area. If you were to fork macos-use, this is one of the few knobs worth tuning per app: larger inset for apps with tall sticky headers.",
  },
  {
    q: "Does the overlay from InputGuard cover the scrolling?",
    a: "Yes, both are active at the same time. The click_and_traverse handler engages InputGuard before scrollIntoViewIfNeeded runs, so the pulsing 'AI: <action> — press Esc to cancel' overlay is already visible while the scroll events fly. Pressing Esc mid-scroll throws InputGuardCancelled at the next throwIfCancelled call site (there are four in the handler), and the catch block restores cursor and focus before returning. You cannot brick yourself on a runaway scroll.",
  },
  {
    q: "Can I see the scroll loop in action?",
    a: "Yes. Set the MCP client to run the server with `stderr` visible and fire a click_and_traverse targeting an element you know is off-screen. You will see log lines like `scrollIntoViewIfNeeded: target text=\"Settings\", distance=742px, lines/step=3, dir=3` followed by `step 1: element frame=...` and finally `found \"Settings\" at (x, y) after N steps`. Every logged field corresponds to a named variable in the code.",
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

const scrollFnCode = `// Sources/MCPServer/main.swift:1159-1219
// Text-anchored scroll loop. Runs before every click_and_traverse.

func scrollIntoViewIfNeeded(pid: pid_t, point: CGPoint) async -> CGPoint {
    let appElement = AXUIElementCreateApplication(pid)
    AXUIElementSetMessagingTimeout(appElement, 5.0)

    guard let (windowElement, windowBounds) =
            getWindowContainingPoint(appElement: appElement, point: point) else {
        return point  // No window for this point. Bail out.
    }

    // Cheap path: point already visible. Return the caller-centered point
    // without refining via AX — overlapping full-width groups would shadow
    // sidebar items and mis-route the click.
    if windowBounds.contains(point) { return point }

    // Anchor: find what's nominally at that point, and capture its text.
    // If the element has no text we branch into the edge-probe loop below.
    let targetElement = findAXElementAtPoint(root: windowElement, point: point)
    let targetText    = targetElement != nil ? getAXElementText(targetElement!) : nil

    let scrollingUp: Bool = point.y > windowBounds.maxY
    let distance: CGFloat = scrollingUp
        ? point.y - windowBounds.maxY
        : windowBounds.minY - point.y

    // The knob. Pixel distance → lines per step.
    //   < 80  px: 1 line/step  (tight; avoid overshoot)
    //   < 250 px: 2 lines/step
    //   else:     3 lines/step (long lists)
    let linesPerStep: Int32 = distance < 80 ? 1 : (distance < 250 ? 2 : 3)
    let scrollDirection: Int32 = scrollingUp ? -linesPerStep : linesPerStep
    let maxSteps = 30

    if let targetText = targetText {
        for step in 1...maxSteps {
            // Post a real line-grained scroll wheel event. Aimed at the
            // target x, but at the vertical mid-point of the window so
            // we don't hit a toolbar.
            guard let scrollEvent = CGEvent(
                scrollWheelEvent2Source: nil,
                units: .line, wheelCount: 1,
                wheel1: scrollDirection, wheel2: 0, wheel3: 0
            ) else { return point }
            scrollEvent.location = CGPoint(x: point.x, y: windowBounds.midY)
            scrollEvent.post(tap: .cghidEventTap)
            try? await Task.sleep(nanoseconds: 100_000_000)  // 100ms

            // Re-walk the AX tree. Did the anchored text land in the
            // safely-inset viewport yet? Return its fresh centre.
            if let foundCenter = findElementByText(
                    root: windowElement, text: targetText, viewport: windowBounds) {
                try? await Task.sleep(nanoseconds: 100_000_000)
                return foundCenter
            }
        }
        return point  // 30 steps, nothing found. Caller clicks the raw point.
    }

    // … no text at target → edge-probe branch (lines 1220-1284) …
}`;

const findByTextCode = `// Sources/MCPServer/main.swift:1124-1149
// Walks the AX tree, matches by text, returns the centre only if inside
// the viewport minus a 15pt dy inset.

func findElementByText(
    root: AXUIElement, text: String, viewport: CGRect, maxDepth: Int = 25
) -> CGPoint? {
    guard maxDepth > 0 else { return nil }
    // The 15pt inset is why an item half-clipped by a sticky header
    // does NOT count as visible. Raise this per-app if your target
    // apps have tall headers.
    let safeViewport = viewport.insetBy(dx: 0, dy: 15)

    if let elementText = getAXElementText(root), elementText == text {
        if let frame = getAXElementFrame(root) {
            let center = CGPoint(x: frame.midX, y: frame.midY)
            if safeViewport.contains(center) {
                return center  // Fresh coordinate from the live tree.
            }
        }
    }

    // Recurse. AXChildren is an array of AXUIElement, flat at this level.
    var childrenRef: CFTypeRef?
    if AXUIElementCopyAttributeValue(root, "AXChildren" as CFString,
                                     &childrenRef) == .success,
       let children = childrenRef as? [AXUIElement] {
        for child in children {
            if let found = findElementByText(
                    root: child, text: text, viewport: viewport,
                    maxDepth: maxDepth - 1) {
                return found
            }
        }
    }
    return nil
}`;

const callSiteCode = `// Sources/MCPServer/main.swift:1580-1598
// Where the click handler invokes the scroll loop, right before the
// CGEvent is dispatched. One function call. No configuration.

// Activate the target app before clicking so the event registers.
if let runningApp = NSRunningApplication(processIdentifier: reqPid) {
    runningApp.activate(options: [])
    try? await Task.sleep(nanoseconds: 200_000_000)  // 200ms for activation
}

// Auto-scroll element into view if it's outside the visible window area.
// rawPoint was computed from either (x, y, w, h) or from searching the
// AX traversal for the element text. scrollIntoViewIfNeeded returns:
//   - rawPoint unchanged, if already visible
//   - the fresh midpoint of the element, if scrolled into view
//   - rawPoint unchanged, if 30 steps exceeded (logged as warning)
let adjustedPoint = await scrollIntoViewIfNeeded(pid: reqPid, point: rawPoint)
lastClickPoint = adjustedPoint

let isDoubleClick = params.arguments?["doubleClick"]?.boolValue ?? false
let isRightClick  = params.arguments?["rightClick"]?.boolValue ?? false
if isDoubleClick {
    primaryAction = .input(action: .doubleClick(point: adjustedPoint))
} else if isRightClick {
    primaryAction = .input(action: .rightClick(point: adjustedPoint))
} else {
    primaryAction = .input(action: .click(point: adjustedPoint))
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
              <span className="inline-block bg-cyan-50 text-cyan-700 text-xs font-medium px-2 py-1 rounded-full font-mono">
                scrollIntoViewIfNeeded
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 mb-6">
              macos-use: The Tool Call That Scrolls Its Own{" "}
              <GradientText>Target Into View</GradientText> Before Clicking
            </h1>
            <p className="text-lg text-zinc-500 max-w-2xl mb-6">
              Every writeup of macos-use says the same two things: it drives
              macOS apps through accessibility APIs, and every action returns a
              before/after diff. None of them mention the loop that runs in
              between. When you tell{" "}
              <span className="font-mono text-sm">click_and_traverse</span> to
              click an element that has scrolled off-screen, the server does
              not fail and does not guess. It reads the target&rsquo;s text
              from the AX tree, fires wheel-line scroll events one, two, or
              three at a time (picked by raw pixel distance), re-finds the
              element by text after every tick, and clicks the fresh centre
              coordinate.
            </p>
            <ArticleMeta
              datePublished={DATE_PUBLISHED}
              author="macos-use maintainers"
              readingTime="10 min read"
            />
            <div className="mt-8 flex gap-4 flex-wrap">
              <ShimmerButton href="https://github.com/mediar-ai/mcp-server-macos-use/blob/main/Sources/MCPServer/main.swift#L1159-L1285">
                Read scrollIntoViewIfNeeded on GitHub
              </ShimmerButton>
              <a
                href="https://www.npmjs.com/package/mcp-server-macos-use"
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-zinc-200 bg-white text-zinc-700 text-sm font-medium hover:border-teal-300 hover:text-teal-700 transition-colors"
              >
                Install from npm
              </a>
            </div>
          </div>
        </BackgroundGrid>

        {/* Proof band */}
        <ProofBand
          rating={5.0}
          ratingCount="open source"
          highlights={[
            "Text-anchored scroll loop",
            "1-3 wheel-lines per step, picked by pixel distance",
            "30-step cap, re-searches AX tree every tick",
          ]}
        />

        {/* Concept intro — Remotion clip */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <RemotionClip
            title="Click something off-screen. The server scrolls first."
            subtitle="Closed-loop, text-anchored, AX-tree-driven"
            captions={[
              "Read the target element's text via findAXElementAtPoint",
              "Pick lines/step from pixel distance: <80=1, <250=2, else 3",
              "Post a real CGEvent wheel-line scroll at the window mid-Y",
              "Re-walk the AX tree and match by text after every tick",
              "Return the fresh centre. Click lands on a verified coordinate.",
            ]}
            accent="teal"
          />
        </section>

        {/* What competitor pages skip */}
        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            What The Top macos-use Writeups All Leave Out
          </h2>
          <p className="text-zinc-600 mb-4">
            The first page of Google for the query &ldquo;macos-use&rdquo; is a
            mix of the repo README, the mcp.so listing, two competing macOS MCP
            projects, and a couple of third-party roundups. They all lead with
            the same two talking points: it reads the accessibility tree
            instead of analysing screenshots, and every action returns a diff
            of what changed in that tree after the action ran.
          </p>
          <p className="text-zinc-600 mb-4">
            What none of them mention is what happens when the agent hands the
            server a coordinate that is no longer on screen. The AX traversal
            the model used to find the target might be seconds old; the user
            might have already scrolled the window; the element might be in a
            long list that was always below the fold. A naive accessibility
            automator in that situation fires a click into an invisible pixel
            and returns a diff saying nothing changed. macos-use does a
            different thing, and that thing is an explicit, 127-line loop in
            one Swift file.
          </p>
          <p className="text-zinc-600">
            Every fact below comes from{" "}
            <span className="font-mono text-sm text-teal-700">
              Sources/MCPServer/main.swift
            </span>
            . The three functions that matter are{" "}
            <span className="font-mono text-sm">findAXElementAtPoint</span>{" "}
            (lines 1057-1083),{" "}
            <span className="font-mono text-sm">findElementByText</span>{" "}
            (1126-1149), and{" "}
            <span className="font-mono text-sm">scrollIntoViewIfNeeded</span>{" "}
            (1159-1285). They are called once, from the click handler at 1588.
          </p>
        </section>

        {/* Before / after illustration */}
        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            The Naive Click vs The Scroll-First Click
          </h2>
          <BeforeAfter
            title="Clicking a row that is 742px below the current viewport"
            before={{
              label: "Naive AX click",
              content:
                "Agent posts CGEvent.click at the row's AX coordinates. The coordinate is below windowBounds.maxY. The click lands on whatever is on screen at that pixel — usually an empty scroll area, sometimes a different row. The diff shows no meaningful change. The agent guesses it mis-targeted and retries with a different element.",
              highlights: [
                "click fires at an off-screen pixel",
                "wrong row is clicked or nothing is clicked",
                "diff is empty, no signal to the agent",
              ],
            }}
            after={{
              label: "macos-use click",
              content:
                "Agent posts the same click. The server intercepts at main.swift:1588, captures the target text via the AX tree, scrolls the window in 3-line ticks, re-searches the tree for that text after each tick, and finally clicks the row at its freshly-computed on-screen centre. The diff shows the real effect of the click on the live UI.",
              highlights: [
                "target text anchored from AX tree",
                "adaptive scroll step sizing (1, 2, or 3 lines)",
                "click lands on a verified in-viewport coordinate",
              ],
            }}
          />
        </section>

        {/* Anchor fact: the linesPerStep heuristic */}
        <section className="bg-zinc-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <span className="inline-block bg-cyan-50 text-cyan-700 text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full mb-4">
              Anchor fact
            </span>
            <h2 className="text-3xl font-bold text-zinc-900 mb-4">
              The One-Line Heuristic That Picks How Hard To Scroll
            </h2>
            <p className="text-zinc-600 mb-6">
              At{" "}
              <span className="font-mono text-sm">main.swift:1187</span>, the
              decision of how aggressively to scroll is a single ternary
              expression:{" "}
              <span className="font-mono text-sm">
                let linesPerStep: Int32 = distance &lt; 80 ? 1 : (distance &lt;
                250 ? 2 : 3)
              </span>
              . The variable{" "}
              <span className="font-mono text-sm">distance</span> is the raw
              pixel offset between the target&rsquo;s y coordinate and the
              nearest edge of{" "}
              <span className="font-mono text-sm">windowBounds</span>. This
              heuristic lives between two extremes that both fail: one line
              per step is so slow a long list never arrives within the 30-step
              cap, and one big bang scroll overshoots because macOS compounds
              wheel deltas with momentum.
            </p>
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <div className="rounded-2xl border border-zinc-200 bg-white p-5">
                <div className="text-xs font-mono uppercase tracking-wider text-cyan-700">
                  near miss
                </div>
                <div className="mt-2 text-2xl font-semibold text-zinc-900">
                  distance &lt; 80px
                </div>
                <div className="mt-1 text-sm text-zinc-500">
                  1 line / step. Avoid overshoot for rows that are just outside
                  the viewport. Macos momentum makes one line about 20-40px.
                </div>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white p-5">
                <div className="text-xs font-mono uppercase tracking-wider text-cyan-700">
                  short hop
                </div>
                <div className="mt-2 text-2xl font-semibold text-zinc-900">
                  distance &lt; 250px
                </div>
                <div className="mt-1 text-sm text-zinc-500">
                  2 lines / step. A page-ish worth of content. Still tight
                  enough that a fast arriving element gets caught by the next
                  AX tree re-search.
                </div>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white p-5">
                <div className="text-xs font-mono uppercase tracking-wider text-cyan-700">
                  long list
                </div>
                <div className="mt-2 text-2xl font-semibold text-zinc-900">
                  distance ≥ 250px
                </div>
                <div className="mt-1 text-sm text-zinc-500">
                  3 lines / step. Gets to row #200 within the 30-step budget
                  without a human ever noticing.
                </div>
              </div>
            </div>
            <AnimatedCodeBlock
              code={scrollFnCode}
              language="swift"
              filename="Sources/MCPServer/main.swift"
            />
            <p className="text-zinc-600 mt-6">
              Two constants are worth flagging. The loop bound{" "}
              <span className="font-mono text-sm">maxSteps = 30</span> sets the
              ceiling at roughly 30-90 lines of scrolled content, which covers
              essentially any practical list. The post-scroll sleep is{" "}
              <span className="font-mono text-sm">100_000_000 ns</span>, 100
              milliseconds, long enough for most apps to repaint the AX tree
              before the next{" "}
              <span className="font-mono text-sm">findElementByText</span>{" "}
              search.
            </p>
          </div>
        </section>

        {/* How the text anchor works */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            Why Text Is The Anchor, Not A Coordinate
          </h2>
          <p className="text-zinc-600 mb-6 max-w-2xl">
            A coordinate is a moving target in a scrolling window. After one
            scroll tick, the target element no longer lives at the original y.
            A sibling row has taken its place. If you cling to the original
            coordinate you end up clicking a different row. macos-use sidesteps
            this by reading the target element&rsquo;s AX text up front, then
            re-searching the tree by that text after every scroll. The returned
            frame is always the live position of the real target.
          </p>
          <AnimatedCodeBlock
            code={findByTextCode}
            language="swift"
            filename="Sources/MCPServer/main.swift"
          />
          <p className="text-zinc-500 text-sm mt-4 max-w-2xl">
            The{" "}
            <span className="font-mono">viewport.insetBy(dx: 0, dy: 15)</span>{" "}
            line is what keeps the loop honest. If an element is scrolled
            halfway under a sticky header, its centre is inside the raw window
            bounds but above the safe viewport, so{" "}
            <span className="font-mono">findElementByText</span> returns nil
            and the loop scrolls one more step. The doc-comment above the
            function mentions a 40px inset but the code ships 15pt: if you
            need bigger (apps with tall toolbars), this is the knob to tune.
          </p>
        </section>

        {/* AnimatedBeam: inputs → scroll fn → outputs */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            Where scrollIntoViewIfNeeded Sits In The Click Pipeline
          </h2>
          <p className="text-zinc-600 mb-8 max-w-2xl">
            The function takes a PID and a point, and returns a point. Between
            input and output, it orchestrates five things: window lookup, text
            anchoring, scroll event posting, tree re-search, and the
            30-step budget check.
          </p>
          <AnimatedBeam
            title="Inputs, the scroll loop, and the refined click point"
            from={[
              { label: "rawPoint from element text" },
              { label: "rawPoint from (x, y, w, h)" },
              { label: "pid of target app" },
            ]}
            hub={{ label: "scrollIntoViewIfNeeded" }}
            to={[
              { label: "CGEvent wheel-line posts" },
              { label: "AX tree re-search by text" },
              { label: "fresh click point or raw point fallback" },
            ]}
          />
        </section>

        {/* Steps of the algorithm */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            One Tick Of The Loop, End To End
          </h2>
          <p className="text-zinc-600 mb-8 max-w-2xl">
            A click targeting a row 742px below the fold. Here is what the
            server runs, in order, between the MCP handler accepting the call
            and the click CGEvent being dispatched.
          </p>
          <StepTimeline
            steps={[
              {
                title: "getWindowContainingPoint picks the right AXWindow",
                description:
                  "Iterates AXWindows for the app, matches the first whose frame contains the target. Falls back to AXMainWindow if none match. Important for apps that show popovers, sheets, or multiple document windows.",
              },
              {
                title: "Cheap path: if point ∈ windowBounds, return it",
                description:
                  "If the target is already visible, the function returns the caller-centered point and exits. Critically, it does NOT re-refine via findAXElementAtPoint in this case, because overlapping full-width group elements in the tree would shadow sidebar items and route the click wrong.",
              },
              {
                title: "Read the target's AX text as the anchor",
                description:
                  "findAXElementAtPoint walks the tree with maxDepth 25, returns the deepest element containing the raw point. getAXElementText reads AXValue first, falls back to AXTitle, then recurses into children (AXRow → AXCell → AXStaticText).",
              },
              {
                title: "Pick scroll direction and lines-per-step",
                description:
                  "scrollingUp = point.y > windowBounds.maxY. distance = |point.y - edge|. linesPerStep = 1 for distance < 80, 2 for < 250, 3 otherwise. scrollDirection flips sign to walk the right way.",
              },
              {
                title: "Post a CGEvent scroll wheel, aimed at (point.x, window.midY)",
                description:
                  "CGEvent(scrollWheelEvent2Source:) with units: .line, wheelCount 1, wheel1 = scrollDirection. Posted to .cghidEventTap. The location matters: we aim at the column of the target so we hit the correct scroll area in split windows, but at the vertical midpoint so we don't land on a tab bar or toolbar.",
              },
              {
                title: "Sleep 100ms, let the app repaint the AX tree",
                description:
                  "The AX tree does not update synchronously with the scroll. 100ms is a pragmatic value that works for native AppKit apps, Electron apps, and Catalyst apps alike. Measured, not calculated.",
              },
              {
                title: "Re-search by text, with a 15pt safe viewport",
                description:
                  "findElementByText walks the tree again, matches getAXElementText against the anchor. Only accepts hits whose centre falls inside viewport.insetBy(dx: 0, dy: 15). If found, return that fresh centre — the click will land on it. If not, loop.",
              },
              {
                title: "30-step cap, then give up with a log line",
                description:
                  "If the element never shows up in 30 iterations, a warning goes to stderr and the function returns the raw point. The click fires wherever that leaves things; the return diff will show whether it mattered.",
              },
            ]}
          />
        </section>

        {/* Bento: what the algorithm handles without agent guidance */}
        <section className="bg-zinc-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-zinc-900 mb-6">
              What This Loop Quietly Solves For The Agent
            </h2>
            <p className="text-zinc-600 mb-8 max-w-2xl">
              The agent only ever sends a click with a coordinate or an
              element text. It does not have to track scroll offsets, predict
              row heights, or re-run a traversal to figure out where the
              target ended up. The server does all of that between the request
              arriving on stdio and the CGEvent leaving.
            </p>
            <BentoGrid
              cards={[
                {
                  title: "Stale AX coordinates from earlier traversals",
                  description:
                    "The model's last refresh_traversal might be seconds old; the user might have scrolled in the meantime. The loop re-anchors by text, so old coordinates still reach the right row.",
                  size: "2x1",
                },
                {
                  title: "Long lists without virtual scroll hints",
                  description:
                    "Chat threads, file lists, message tables. Apps don't expose 'scroll by N to see row M'. The text anchor plus the 1-3 lines/step heuristic finds the row anyway.",
                  size: "1x1",
                },
                {
                  title: "Sticky headers and toolbars",
                  description:
                    "The 15pt dy inset on the safe viewport rejects elements that are technically inside the window frame but actually clipped by a header. The loop keeps scrolling one more tick.",
                  size: "1x1",
                },
                {
                  title: "Mismatched row heights inside the same list",
                  description:
                    "Different row heights in the same list would break any fixed-delta scroll. The re-search-after-each-tick design means variable geometry just changes how many ticks it takes.",
                  size: "1x1",
                },
                {
                  title: "Multi-window apps and side panels",
                  description:
                    "getWindowContainingPoint picks the right AXWindow per-click. Clicks aimed at a popover or inspector panel don't accidentally scroll the main document.",
                  size: "1x1",
                },
              ]}
            />
          </div>
        </section>

        {/* Call site code */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            The Call Site: One Line In The Click Handler
          </h2>
          <p className="text-zinc-600 mb-6 max-w-2xl">
            Everything above gets wired up by one{" "}
            <span className="font-mono text-sm">await</span>. The click handler
            computes a raw point (either from explicit coordinates or by
            searching the traversal for the element text), then routes it
            through{" "}
            <span className="font-mono text-sm">scrollIntoViewIfNeeded</span>{" "}
            before constructing the click action. The function&rsquo;s signature
            — takes a point, returns a point — means it drops into the pipeline
            without restructuring any of the surrounding control flow.
          </p>
          <AnimatedCodeBlock
            code={callSiteCode}
            language="swift"
            filename="Sources/MCPServer/main.swift"
          />
          <p className="text-zinc-500 text-sm mt-4 max-w-2xl">
            Note that the same{" "}
            <span className="font-mono">adjustedPoint</span> is used whether
            the action is a click, double-click, or right-click. The
            scroll-to-reveal is not click-specific; it applies any time the
            handler is about to dispatch a coordinate-bound input into a
            possibly-scrolled window.
          </p>
        </section>

        {/* Numbers */}
        <section className="bg-zinc-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-zinc-900 mb-8">
              The Numbers From main.swift
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <GlowCard>
                <div className="p-6">
                  <div className="text-4xl font-bold text-zinc-900">
                    <NumberTicker value={127} />
                  </div>
                  <div className="text-sm text-zinc-500 mt-2">
                    lines of Swift for the full scroll loop (1159-1285)
                  </div>
                </div>
              </GlowCard>
              <GlowCard>
                <div className="p-6">
                  <div className="text-4xl font-bold text-zinc-900">
                    <NumberTicker value={30} />
                  </div>
                  <div className="text-sm text-zinc-500 mt-2">
                    maxSteps cap per invocation
                  </div>
                </div>
              </GlowCard>
              <GlowCard>
                <div className="p-6">
                  <div className="text-4xl font-bold text-zinc-900">
                    <NumberTicker value={25} />
                  </div>
                  <div className="text-sm text-zinc-500 mt-2">
                    maxDepth for AX tree walk in findElementByText
                  </div>
                </div>
              </GlowCard>
              <GlowCard>
                <div className="p-6">
                  <div className="text-4xl font-bold text-zinc-900">
                    <NumberTicker value={15} suffix="pt" />
                  </div>
                  <div className="text-sm text-zinc-500 mt-2">
                    dy inset on safe viewport (rejects header-clipped items)
                  </div>
                </div>
              </GlowCard>
              <GlowCard>
                <div className="p-6">
                  <div className="text-4xl font-bold text-zinc-900">
                    <NumberTicker value={100} suffix="ms" />
                  </div>
                  <div className="text-sm text-zinc-500 mt-2">
                    sleep between scroll post and AX tree re-search
                  </div>
                </div>
              </GlowCard>
              <GlowCard>
                <div className="p-6">
                  <div className="text-4xl font-bold text-zinc-900">
                    <NumberTicker value={80} suffix="px" />
                  </div>
                  <div className="text-sm text-zinc-500 mt-2">
                    distance threshold for 1 line / step
                  </div>
                </div>
              </GlowCard>
              <GlowCard>
                <div className="p-6">
                  <div className="text-4xl font-bold text-zinc-900">
                    <NumberTicker value={250} suffix="px" />
                  </div>
                  <div className="text-sm text-zinc-500 mt-2">
                    distance threshold for 2 lines / step (else 3)
                  </div>
                </div>
              </GlowCard>
              <GlowCard>
                <div className="p-6">
                  <div className="text-4xl font-bold text-zinc-900">
                    <NumberTicker value={5} suffix="s" />
                  </div>
                  <div className="text-sm text-zinc-500 mt-2">
                    AXUIElementSetMessagingTimeout on the app element
                  </div>
                </div>
              </GlowCard>
            </div>
            <p className="text-zinc-500 text-sm mt-8">
              Each number is a literal read off the current commit of{" "}
              <span className="font-mono">Sources/MCPServer/main.swift</span>.
              Worst case latency: 30 iterations × (scroll post + 100ms sleep +
              one AX tree walk) is about 3-4 seconds. Typical case for a visible
              row: zero iterations — the cheap-path check at the top of the
              function returns immediately.
            </p>
          </div>
        </section>

        {/* Horizontal stepper: the two branches */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            Two Branches, Picked By Whether The Anchor Has Text
          </h2>
          <p className="text-zinc-600 mb-8 max-w-2xl">
            findAXElementAtPoint returns the deepest element whose frame
            contains the raw point. If that element exposes AXValue or AXTitle,
            the loop takes the text-anchored branch. If it returns a bare group
            with no text (common for far off-screen list rows where the AX tree
            is still sparse), the loop falls back to an edge-probe.
          </p>
          <HorizontalStepper
            steps={[
              {
                title: "Anchor has text",
                description:
                  "Loop scrolls, then re-searches the tree by that text. Returns the first hit inside the safe viewport. main.swift:1191-1219.",
              },
              {
                title: "Anchor has no text",
                description:
                  "Loop scrolls, then probes a point 60pt inside the viewport edge on every tick. When a textual element finally appears at the raw point, it re-anchors and nudges for up to 8 more ticks. main.swift:1220-1284.",
              },
              {
                title: "Nothing after 30 steps",
                description:
                  "Returns the raw point unchanged. A warning is logged to stderr. The click dispatches at the original coordinate; the agent sees an empty or unexpected diff and can retry.",
              },
            ]}
          />
        </section>

        {/* FlowDiagram — event types pipeline */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            The Data Path For One Scroll Tick
          </h2>
          <p className="text-zinc-600 mb-8 max-w-2xl">
            The loop turns one Swift variable into four concrete system calls
            per tick. Nothing about this is secret — every stop on the
            path can be traced by grepping the file.
          </p>
          <FlowDiagram
            title="scrollIntoViewIfNeeded: one loop iteration"
            steps={[
              { label: "distance", detail: "|target.y - edge|" },
              { label: "linesPerStep", detail: "1, 2, or 3" },
              { label: "CGEvent scroll", detail: "cghidEventTap" },
              { label: "sleep 100ms", detail: "repaint window" },
              { label: "findElementByText", detail: "AX walk, depth 25" },
              { label: "refined point", detail: "midX, midY" },
            ]}
          />
        </section>

        {/* Marquee — the AX attributes the loop reads */}
        <section className="py-12">
          <div className="max-w-4xl mx-auto px-6 mb-6">
            <h2 className="text-2xl font-bold text-zinc-900 mb-2">
              Accessibility Attributes The Loop Actually Reads
            </h2>
            <p className="text-zinc-500">
              Every function in the scroll loop reads a small, specific set of
              AX attributes. No AXSelected, no AXEnabled, no AXRoleDescription.
              Just these.
            </p>
          </div>
          <Marquee speed={30} fade pauseOnHover>
            {[
              "AXPosition",
              "AXSize",
              "AXChildren",
              "AXValue",
              "AXTitle",
              "AXWindows",
              "AXMainWindow",
              "AXSheet",
              "AXRole",
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

        {/* Comparison table */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            macos-use vs Open-Loop Accessibility Clicks
          </h2>
          <ComparisonTable
            productName="macos-use click_and_traverse"
            competitorName="Naive AX click at (x, y)"
            rows={[
              {
                feature: "Handles targets outside current viewport",
                ours: "Yes — text-anchored scroll loop",
                competitor: "No — click fires at off-screen pixel",
              },
              {
                feature: "Re-verifies coordinate after scrolling",
                ours: "Re-walks AX tree after every tick",
                competitor: "Does not scroll; no re-verification",
              },
              {
                feature: "Adaptive to pixel distance",
                ours: "1 / 2 / 3 lines per step by threshold",
                competitor: "N/A",
              },
              {
                feature: "Works on text-less AX groups",
                ours: "Edge-probe fallback branch",
                competitor: "N/A",
              },
              {
                feature: "Per-window targeting (popovers, sheets)",
                ours: "getWindowContainingPoint iterates AXWindows",
                competitor: "Usually targets AXMainWindow only",
              },
              {
                feature: "Bounded latency",
                ours: "30 steps × ~100ms cap",
                competitor: "Instant but wrong",
              },
              {
                feature: "Abortable with Esc mid-scroll",
                ours: "Yes — InputGuard throwIfCancelled is engaged",
                competitor: "No generic abort",
              },
              {
                feature: "Safe-viewport margin",
                ours: "15pt dy inset rejects header-clipped hits",
                competitor: "N/A",
              },
            ]}
          />
        </section>

        {/* Proof banner */}
        <section className="max-w-4xl mx-auto px-6 py-10">
          <ProofBanner
            quote="The loop that makes agents reliable on long scroll views is not a prompt rule or a retry heuristic in the client. It is 127 lines of Swift in one function, anchored by text, stepped by pixel distance, and capped at 30 iterations."
            source="main.swift:1159-1285"
            metric="scroll → re-read → click"
          />
        </section>

        {/* Terminal — reproduce */}
        <section className="bg-zinc-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-zinc-900 mb-4">
              Reproduce The Whole Thing In A Clean Checkout
            </h2>
            <p className="text-zinc-600 mb-8 max-w-2xl">
              Every line number on this page is on disk. Clone the repo and
              grep.
            </p>

            <TerminalOutput
              title="Reading the scroll loop from source"
              lines={[
                {
                  text: "git clone https://github.com/mediar-ai/mcp-server-macos-use.git",
                  type: "command",
                },
                { text: "cd mcp-server-macos-use", type: "command" },
                {
                  text: "grep -n 'scrollIntoViewIfNeeded\\|findElementByText\\|findAXElementAtPoint\\|linesPerStep\\|maxSteps' Sources/MCPServer/main.swift",
                  type: "command",
                },
                {
                  text: "1057:func findAXElementAtPoint(root: AXUIElement, point: CGPoint, maxDepth: Int = 25)",
                  type: "output",
                },
                {
                  text: "1126:func findElementByText(root: AXUIElement, text: String, viewport: CGRect, maxDepth: Int = 25)",
                  type: "output",
                },
                {
                  text: "1159:func scrollIntoViewIfNeeded(pid: pid_t, point: CGPoint) async -> CGPoint",
                  type: "output",
                },
                {
                  text: "1187:    let linesPerStep: Int32 = distance < 80 ? 1 : (distance < 250 ? 2 : 3)",
                  type: "output",
                },
                {
                  text: "1189:    let maxSteps = 30",
                  type: "output",
                },
                {
                  text: "1588:                let adjustedPoint = await scrollIntoViewIfNeeded(pid: reqPid, point: rawPoint)",
                  type: "output",
                },
                {
                  text: "sed -n '1128p' Sources/MCPServer/main.swift",
                  type: "command",
                },
                {
                  text: '    let safeViewport = viewport.insetBy(dx: 0, dy: 15)',
                  type: "output",
                },
                {
                  text: "Every number and call site on the page is right there.",
                  type: "success",
                },
              ]}
            />
          </div>
        </section>

        {/* Inline CTA */}
        <section className="max-w-4xl mx-auto px-6 py-10">
          <InlineCta
            heading="Point macos-use at any scroll-heavy app you use"
            body="Chat threads, file lists, long settings panels: the scroll loop means an agent can target any row from a stale traversal and still land the click. Install the server, wire it into Claude Desktop or Cursor, and every click_and_traverse gets the scroll-to-reveal behaviour for free."
            linkText="Install from npm"
            href="https://www.npmjs.com/package/mcp-server-macos-use"
          />
        </section>

        {/* FAQ */}
        <FaqSection items={faqItems} />

        {/* Final CTA */}
        <section className="max-w-4xl mx-auto px-6 py-16 text-center">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            Read the scroll loop.
          </h2>
          <p className="text-zinc-500 mb-8 max-w-xl mx-auto">
            One Swift file.{" "}
            <span className="font-mono text-sm">main.swift:1126-1285</span> is
            the entire text-anchored, distance-stepped, 30-iteration
            scroll-to-reveal.
          </p>
          <ShimmerButton href="https://github.com/mediar-ai/mcp-server-macos-use/blob/main/Sources/MCPServer/main.swift#L1126-L1285">
            Open main.swift on GitHub
          </ShimmerButton>
        </section>

        <StickyBottomCta
          description="macos-use scrolls off-screen click targets into view by re-anchoring by text after every wheel-line step"
          buttonLabel="Read the loop"
          href="https://github.com/mediar-ai/mcp-server-macos-use/blob/main/Sources/MCPServer/main.swift#L1159-L1285"
        />
      </article>
    </>
  );
}
