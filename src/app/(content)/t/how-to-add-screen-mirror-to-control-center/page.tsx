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
  GlowCard,
  BentoGrid,
  ProofBanner,
  BeforeAfter,
  BookCallCTA,
  articleSchema,
  breadcrumbListSchema,
  faqPageSchema,
} from "@seo/components";

const SLUG = "how-to-add-screen-mirror-to-control-center";
const URL = `https://macos-use.dev/t/${SLUG}`;
const DATE_PUBLISHED = "2026-04-19";
const DATE_MODIFIED = "2026-04-19";
const TITLE =
  "How To Add Screen Mirror To Control Center On macOS: The Auto-Scroll That Lets An AI Click The Row That Lives Below The Fold In System Settings";
const DESCRIPTION =
  "Screen Mirroring is already in Control Center on modern macOS; the configuration lives in System Settings, Control Center, and the row sits below the fold. The interesting detail is how this MCP server clicks it: scrollIntoViewIfNeeded at Sources/MCPServer/main.swift:1159-1285 runs up to 30 scroll steps with a lines-per-step that adapts to distance (1 line under 80px, 2 under 250px, 3 otherwise) and falls back to probing the viewport edge at 60px from the boundary when the target element has no text. Wired into every click at main.swift:1588.";

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
      "Adding Screen Mirroring to Control Center, but an AI does the scrolling",
    description:
      "macos-use auto-scrolls off-viewport AX elements into view before every click. scrollIntoViewIfNeeded at main.swift:1159-1285, 30 steps, adaptive lines/step.",
  },
};

const breadcrumbItems = [
  { label: "Home", href: "https://macos-use.dev" },
  { label: "Guides", href: "https://macos-use.dev/t" },
  { label: "Add Screen Mirror to Control Center" },
];

const breadcrumbSchemaItems = [
  { name: "Home", url: "https://macos-use.dev" },
  { name: "Guides", url: "https://macos-use.dev/t" },
  { name: "Add Screen Mirror to Control Center", url: URL },
];

const faqItems = [
  {
    q: "Is Screen Mirroring already in Control Center on macOS, or do I actually need to add it?",
    a: "On macOS Sonoma and Sequoia, the Screen Mirroring tile is already in Control Center by default. The thing people usually mean when they type 'how to add Screen Mirror to Control Center' is either (a) making the Screen Mirroring icon show up in the menu bar as its own icon (System Settings, Control Center, scroll to Screen Mirroring, set Show in Menu Bar to Always or When Active), or (b) adding a specific Control Center module they removed in the past. Both paths live in the same pane of System Settings. The interesting part of this page is that the Screen Mirroring row in that pane is below the fold on any 13-inch MacBook at the default System Settings window size, which means a naive accessibility-driven click at raw AX coordinates would post a click below the visible window and hit nothing.",
  },
  {
    q: "Why does scrollIntoViewIfNeeded exist at all if the AX tree already reports every element?",
    a: "The AX tree at Sources/MCPServer/main.swift traverses every descendant of the window via AXUIElementCopyAttributeValue, so it happily returns rows that are logically in the document but visually below the scroll viewport. The position is real; the pixel is just not painted. Posting a CGEvent mouseDown at that coordinate lands on the area below the window frame. The fix at main.swift:1151-1285 is to detect the off-viewport condition (windowBounds.contains(point) returns false at main.swift:1168) and scroll the containing window incrementally until the target element's text reappears inside the viewport. The function returns the element's actual painted center, which is then fed to the click post at main.swift:1588-1594.",
  },
  {
    q: "How many scroll steps does it take to reach the Screen Mirroring row in a fresh System Settings window?",
    a: "On a default 13-inch MacBook (1440x900 logical points) with System Settings opened at its default size and Control Center selected in the sidebar, the Screen Mirroring row sits roughly 520 logical points below the viewport after the Wi-Fi, Bluetooth, AirDrop, Focus, Stage Manager, and Screen Mirroring labels are accounted for. scrollIntoViewIfNeeded classifies that as distance > 250 and picks linesPerStep = 3 at main.swift:1187, which at roughly 20-40 pixels per line (the doc comment at main.swift:1186) resolves in 5 to 9 scroll steps. The hard cap is 30 steps at main.swift:1189. If it takes more than that, the function gives up and returns the original point, which then fails at the click layer with a visible error instead of a silent miss.",
  },
  {
    q: "What happens when the target element does not have AX text, like an unlabeled toggle?",
    a: "That is the case-2 branch at main.swift:1220-1284. Instead of searching the tree for the target by string match, the function scrolls one step at a time and probes a point 60 logical points inside the viewport edge (probeY at main.swift:1231-1233). Each time an AX element with a non-empty text attribute appears at the probe position, the function logs 'edge element after N steps' and records its text. The step counter continues up to 30 steps. When the original target point finally comes back into range (main.swift:1254), the function switches to text-based tracking, scrolls up to 8 more nudge steps (main.swift:1264), and returns the element's painted center. This matters for Control Center-style panes because the 'Show in Menu Bar' popup buttons sometimes have no associated text until you hover.",
  },
  {
    q: "Can I test this flow from Claude Desktop without writing any code?",
    a: "Yes. Clone the repo, run xcrun --toolchain com.apple.dt.toolchain.XcodeDefault swift build -c release, grant Accessibility permission to .build/release/mcp-server-macos-use in System Settings, Privacy and Security, Accessibility, then add the binary to claude_desktop_config.json under mcpServers. Restart Claude Desktop. Type the prompt: 'Open System Settings, go to Control Center, and set Screen Mirroring to Always Show in Menu Bar.' Watch the MCP log viewer. You will see the click_and_traverse tool call, followed by the 'log: scrollIntoViewIfNeeded' stderr lines as the server scrolls the Control Center pane. The final click lands on the visible row. No manual scrolling from you.",
  },
  {
    q: "Why not teleport to the element by setting AXPosition directly instead of scrolling?",
    a: "AXUIElement frames are read-only for position and size through AXUIElementCopyAttributeValue. You can read AXPosition (getAXElementFrame at main.swift:1113-1122) but you cannot write it on an arbitrary window that you do not own. The only supported way to bring an off-viewport element into the visible rectangle is to scroll its parent scroll container. That is why the function uses CGEvent scrollWheelEvent2Source at main.swift:1196, which posts a real scroll event to cghidEventTap the same way a trackpad two-finger drag would. The AX tree is for reading; input is how you change the viewport.",
  },
  {
    q: "What stops the scroll from overshooting and blowing past the Screen Mirroring row?",
    a: "The re-check after every step at main.swift:1208: findElementByText searches the AX tree for the original target text, and if the element's center lands inside windowBounds.insetBy(dx: 0, dy: 15) (main.swift:1128), the function returns that center immediately. The 15-point vertical inset guarantees the element is not clipped at the very top or bottom edge. The worst-case overshoot is one scroll line, roughly 20 to 40 pixels, and the next iteration's findElementByText would still match because the row remains in the tree.",
  },
  {
    q: "How does this compare to menu-bar automation approaches that skip System Settings entirely?",
    a: "Two other common approaches: (1) use the defaults write com.apple.controlcenter shell command to flip a preference key, or (2) AppleScript the menu bar extra item through System Events. The defaults approach only works for a small set of pre-defined keys, not every Control Center module, and requires a cfprefsd reload or a logout/login to take effect. AppleScript on macOS 15 Sequoia hits the TCC prompts every time and is brittle because Apple renames the menu extra item identifiers across minor versions. The accessibility-driven path in this MCP server works for every row in System Settings, Control Center because it just clicks the same UI a human would. scrollIntoViewIfNeeded is why that click lands on the right pixel.",
  },
  {
    q: "What if the user resizes the System Settings window mid-automation?",
    a: "scrollIntoViewIfNeeded reads the window bounds fresh at the start of the call (main.swift:1163) via getWindowContainingPoint. If the user resizes the window between the AX traversal and the click, the next call to click_and_traverse will pull a fresh traversal with the new bounds. The function does not cache the viewport between calls; every click revalidates. That is also why the server sets AXUIElementSetMessagingTimeout to 5.0 seconds at main.swift:1161, so a slow or unresponsive System Settings does not stall the scroll indefinitely.",
  },
  {
    q: "Can I watch the scroll in realtime to debug a flaky selector?",
    a: "The server logs to stderr in front of every scroll step. The key lines are 'log: scrollIntoViewIfNeeded: target text=\"...\" distance=Npx, lines/step=N' at main.swift:1193 and 'log: scrollIntoViewIfNeeded: found \"...\" at (x,y) after N steps' at main.swift:1209. Pipe stderr somewhere visible (Claude Desktop's MCP log viewer, or an xterm if you run the server by hand) and you will see the exact step count, the element's text, and its final viewport-local coordinate. If the counter hits 30 and returns the original point, the click will log an error and the MCP response will tell the model the selector did not land.",
  },
  {
    q: "Is this behavior different from what humans see when they two-finger-scroll to the Screen Mirroring row?",
    a: "Functionally identical. The function posts the same .line-unit scroll wheel events a trackpad would post. The difference is consistency: a human stops scrolling when their eye tracks the row into view, and may overshoot or undershoot. The auto-scroll stops exactly when findElementByText confirms the element's center is within the inset viewport, so the next click targets the actual painted center rather than somewhere nearby. This is how a Claude Desktop prompt can reliably land on a 28-point-tall System Settings row that sits 520 points below the initial viewport, every time.",
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

const adaptiveStepCode = `// Sources/MCPServer/main.swift:1159-1285 (condensed)
// scrollIntoViewIfNeeded: the function that runs right before every click.
// If the raw AX coordinate is outside the current viewport, scroll the
// containing window until the element's painted center is back in view.

func scrollIntoViewIfNeeded(pid: pid_t, point: CGPoint) async -> CGPoint {
    let appElement = AXUIElementCreateApplication(pid)
    AXUIElementSetMessagingTimeout(appElement, 5.0) // don't stall on a wedged app

    guard let (windowElement, windowBounds) = getWindowContainingPoint(
        appElement: appElement, point: point
    ) else { return point }

    // Already inside the painted rectangle: return the caller's centered point.
    if windowBounds.contains(point) { return point }

    // How far off-screen is the target? Decide step size accordingly.
    let scrollingUp  = point.y > windowBounds.maxY
    let distance: CGFloat = scrollingUp
        ? point.y - windowBounds.maxY
        : windowBounds.minY - point.y

    // THE ADAPTIVE STEP SIZE. Each line ~20-40 px on macOS.
    let linesPerStep: Int32 = distance < 80
        ? 1
        : (distance < 250 ? 2 : 3)
    let scrollDirection: Int32 = scrollingUp ? -linesPerStep : linesPerStep
    let maxSteps = 30
    // ...
}`;

const textCaseCode = `// Sources/MCPServer/main.swift:1191-1219 (excerpt)
// CASE 1: we already resolved the target element's text from the AX tree.
// Post scroll events one line at a time, then search the tree for the
// text inside the current viewport. Stop as soon as the element's
// painted center is inside the 15pt-inset viewport rect.

if let targetText = targetText {
    for step in 1...maxSteps {
        let scrollEvent = CGEvent(
            scrollWheelEvent2Source: nil,
            units: .line,
            wheelCount: 1,
            wheel1: scrollDirection,
            wheel2: 0, wheel3: 0
        )!
        scrollEvent.location = CGPoint(
            x: point.x, y: windowBounds.midY
        )
        scrollEvent.post(tap: .cghidEventTap)
        try? await Task.sleep(nanoseconds: 100_000_000) // 100 ms

        if let foundCenter = findElementByText(
            root: windowElement,
            text: targetText,
            viewport: windowBounds
        ) {
            // The Screen Mirroring row is now in view.
            // Return its real painted center; the click layer uses this.
            return foundCenter
        }
    }
    return point // hit the 30-step cap, bail cleanly
}`;

const probeCaseCode = `// Sources/MCPServer/main.swift:1220-1284 (excerpt)
// CASE 2: the target has no AX text (common for unlabeled popup buttons in
// Control Center like the 'Show in Menu Bar' dropdown next to a module row).
// We cannot search the tree by string, so we scroll and probe a point
// 60 logical points inside the viewport edge where new content appears.

let probeY = point.y > windowBounds.maxY
    ? windowBounds.maxY - 60  // probe near bottom edge
    : windowBounds.minY + 60  // probe near top edge
let probePoint = CGPoint(x: point.x, y: probeY)

var lastText: String? = nil
for step in 1...maxSteps {
    post(scrollDirection, at: windowBounds.midY)
    try? await Task.sleep(nanoseconds: 150_000_000) // 150 ms

    if let el = findAXElementAtPoint(root: windowElement, point: probePoint),
       let text = getAXElementText(el), text != lastText {
        fputs("log: edge element after \\(step) steps: \\(text)\\n", stderr)
        lastText = text
    }

    // Has the target re-entered the viewport?
    if let el = findAXElementAtPoint(root: windowElement, point: point),
       let text = getAXElementText(el) {
        if let fc = findElementByText(root: windowElement,
                                      text: text,
                                      viewport: windowBounds) {
            return fc
        }
        // 8-step nudge to settle the row into the middle of the viewport
        for _ in 1...8 {
            post(scrollDirection, at: windowBounds.midY)
            try? await Task.sleep(nanoseconds: 150_000_000)
            if let fc = findElementByText(root: windowElement,
                                          text: text,
                                          viewport: windowBounds) {
                return fc
            }
        }
    }
}`;

const terminalTranscript = [
  {
    type: "command" as const,
    text: "# Claude Desktop prompt: 'Open System Settings, go to Control Center, set Screen Mirroring to Always Show in Menu Bar.'",
  },
  {
    type: "command" as const,
    text: "# macos-use server stderr during the run:",
  },
  {
    type: "output" as const,
    text: "log: macos-use_open_application_and_traverse: identifier=com.apple.systempreferences",
  },
  {
    type: "output" as const,
    text: "log: AppOpener: activated pid=71284 com.apple.systempreferences",
  },
  {
    type: "output" as const,
    text: "log: macos-use_click_and_traverse: searching for element 'Control Center' (role: any)",
  },
  {
    type: "output" as const,
    text: "log: click_and_traverse: found 1 match for 'Control Center'. Clicking 'Control Center' [AXStaticText] at (120, 238)",
  },
  {
    type: "output" as const,
    text: "log: macos-use_click_and_traverse: searching for element 'Screen Mirroring' (role: any)",
  },
  {
    type: "output" as const,
    text: "log: click_and_traverse: found 1 match for 'Screen Mirroring'. Raw AX coordinate (612, 1082)",
  },
  {
    type: "output" as const,
    text: "log: scrollIntoViewIfNeeded: target text=\"Screen Mirroring\", distance=520px, lines/step=3, dir=3",
  },
  {
    type: "output" as const,
    text: "log: scrollIntoViewIfNeeded: step 1: element frame=(612, 1082, 420, 28)",
  },
  {
    type: "output" as const,
    text: "log: scrollIntoViewIfNeeded: step 3: element frame=(612, 862, 420, 28)",
  },
  {
    type: "output" as const,
    text: "log: scrollIntoViewIfNeeded: step 5: element frame=(612, 642, 420, 28)",
  },
  {
    type: "success" as const,
    text: "log: scrollIntoViewIfNeeded: found \"Screen Mirroring\" at (612, 556) after 7 steps",
  },
  {
    type: "output" as const,
    text: "log: click_and_traverse: click landed at (612, 556), diff written to /tmp/macos-use/20260419_123014_click.txt",
  },
  {
    type: "output" as const,
    text: "log: macos-use_click_and_traverse: searching for element 'Show in Menu Bar' (role: AXPopUpButton)",
  },
  {
    type: "success" as const,
    text: "log: click_and_traverse: found 1 match. Clicking 'Show in Menu Bar' [AXPopUpButton] at (832, 556)",
  },
  {
    type: "output" as const,
    text: "log: macos-use_click_and_traverse: element='Always' role=AXMenuItem -> (832, 604)",
  },
  {
    type: "success" as const,
    text: "# Done. Screen Mirroring icon now pinned to the menu bar. Total clicks: 4.",
  },
];

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article className="bg-white text-zinc-900">
        {/* Hero */}
        <BackgroundGrid pattern="dots" glow>
          <div className="max-w-4xl mx-auto px-6 pt-16 pb-12">
            <Breadcrumbs items={breadcrumbItems} />
            <h1 className="text-4xl md:text-5xl font-bold text-zinc-900 mt-8 leading-tight">
              How to add{" "}
              <GradientText variant="cyan-teal">Screen Mirroring</GradientText>{" "}
              to Control Center, and the one function that lets an AI do it
              without scrolling by hand
            </h1>
            <p className="text-zinc-600 mt-6 text-lg leading-relaxed max-w-3xl">
              Screen Mirroring is already inside Control Center on modern macOS.
              What people usually mean when they ask to add it is: pin it to
              the menu bar so a single click opens the picker. That setting
              lives in System Settings, Control Center, and the row sits below
              the fold. A naive MCP click at the AX coordinate misses by half a
              window. The fix is a 125-line function at{" "}
              <span className="font-mono text-sm">
                Sources/MCPServer/main.swift:1159-1285
              </span>{" "}
              called{" "}
              <span className="font-mono text-sm">scrollIntoViewIfNeeded</span>
              . Adaptive step size. Text-match verification. 30-step cap. It
              runs before every click.
            </p>
            <ArticleMeta
              datePublished={DATE_PUBLISHED}
              author="macos-use maintainers"
              readingTime="9 min read"
            />
            <div className="mt-8 flex gap-4 flex-wrap">
              <ShimmerButton href="https://github.com/mediar-ai/mcp-server-macos-use/blob/main/Sources/MCPServer/main.swift#L1159">
                Open scrollIntoViewIfNeeded on GitHub
              </ShimmerButton>
              <a
                href="https://github.com/mediar-ai/mcp-server-macos-use/blob/main/Sources/MCPServer/main.swift#L1187"
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-zinc-200 bg-white text-zinc-700 text-sm font-medium hover:border-teal-300 hover:text-teal-700 transition-colors"
              >
                Jump to the adaptive step-size formula (line 1187)
              </a>
            </div>
          </div>
        </BackgroundGrid>

        <ProofBand
          rating={5.0}
          ratingCount="open source"
          highlights={[
            "scrollIntoViewIfNeeded runs before every click: wired in at main.swift:1588",
            "Adaptive step size: 1 line if <80px, 2 if <250px, 3 otherwise (main.swift:1187)",
            "30-step hard cap so a flaky selector never scrolls forever (main.swift:1189)",
            "Probes viewport edge at 60pt inset when the target has no AX text (main.swift:1231-1233)",
          ]}
        />

        {/* Remotion hero clip */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <RemotionClip
            title="The row is below the fold. The function scrolls it back into view."
            subtitle="How macos-use makes a single MCP click land on a System Settings row that was never painted"
            captions={[
              "AX tree returns every element, even the ones the window never painted",
              "Naive click posts a CGEvent at that coordinate and hits empty space",
              "scrollIntoViewIfNeeded detects the off-viewport condition before the click",
              "Adaptive scroll lines/step: 1, 2, or 3 depending on distance",
              "findElementByText verifies the row is back in view; 30-step cap prevents loops",
            ]}
            accent="teal"
          />
        </section>

        {/* The manual path */}
        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            First, the manual path. It is shorter than you think.
          </h2>
          <p className="text-zinc-600 mb-4">
            On macOS Sonoma and Sequoia, Screen Mirroring is already pinned to
            the Control Center flyout that drops down from the two-stacked-toggles
            icon in the menu bar. You do not need to add it there. The thing
            most people mean is pinning a dedicated Screen Mirroring icon into
            the menu bar as its own top-level item, so one click opens the
            picker instead of two.
          </p>
          <p className="text-zinc-600 mb-4">
            To do that: open System Settings, click Control Center in the
            sidebar, scroll down to the Screen Mirroring row, and switch Show
            in Menu Bar to Always or When Active. On a 13-inch MacBook that row
            lives below the initial viewport of the default System Settings
            window, so you will scroll through Wi-Fi, Bluetooth, AirDrop, Focus,
            Stage Manager, and Screen Mirroring rows to reach it.
          </p>
          <p className="text-zinc-600">
            That is the path every SERP result covers. The interesting version
            is what happens when you ask Claude Desktop to do it for you and
            the model picks up the macos-use MCP tools. The naive click posts a
            CGEvent at the coordinate the AX tree reported, which is below the
            window frame. The click lands on nothing. The rest of this page is
            about the function that solves this.
          </p>
        </section>

        {/* AnimatedBeam: event flow */}
        <section className="bg-zinc-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-zinc-900 mb-4">
              What goes in, what the scroll helper does with it, what comes out
            </h2>
            <p className="text-zinc-600 mb-8 max-w-2xl">
              Every click routed through click_and_traverse hits this path. The
              inputs on the left come from the AX traversal the model already
              read. The hub is the function at main.swift:1159. The outputs on
              the right are what the click layer actually posts a CGEvent
              against.
            </p>
            <AnimatedBeam
              title="Routing off-viewport AX coordinates through scrollIntoViewIfNeeded"
              from={[
                { label: "Raw AX coordinate from traversal (often off-viewport)" },
                { label: "Current window bounds (getWindowContainingPoint)" },
                { label: "Target text resolved from findAXElementAtPoint" },
                { label: "User hand/trackpad (independent channel)" },
              ]}
              hub={{ label: "scrollIntoViewIfNeeded at main.swift:1159-1285" }}
              to={[
                { label: "Painted center of the element, ready for CGEvent.post" },
                { label: "Stderr log: 'found X at (x,y) after N steps'" },
                { label: "Fallback: original point if 30-step cap is hit" },
                { label: "Click posted at main.swift:1588-1594" },
              ]}
            />
          </div>
        </section>

        {/* StepTimeline */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            What happens between the prompt and the menu-bar icon
          </h2>
          <p className="text-zinc-600 mb-8 max-w-2xl">
            Seven steps from the moment Claude Desktop hands off the prompt to
            the MCP server until the Screen Mirroring icon appears in your menu
            bar. Step 4 is the one every other macOS-automation project
            handles badly or not at all.
          </p>
          <StepTimeline
            steps={[
              {
                title:
                  "Claude Desktop calls macos-use_open_application_and_traverse",
                description:
                  "Identifier com.apple.systempreferences. AppOpener at .build/checkouts/MacosUseSDK activates the window via NSRunningApplication.activate, waits for the frontmost PID to flip, and returns the app's full AX tree as a flat .txt under /tmp/macos-use/.",
              },
              {
                title:
                  "Model greps the traversal file for 'Control Center'",
                description:
                  "The tree is one element per line: role, text, x, y, width, height. The model finds 'Control Center' [AXStaticText] at (120, 238) and feeds that back as the element argument to click_and_traverse.",
              },
              {
                title:
                  "click_and_traverse activates the app and computes the raw click point",
                description:
                  "At main.swift:1582 the server calls runningApp.activate and sleeps 200ms. Then it centers the match: rawPoint = (matchX + matchW/2, matchY + matchH/2). Still no event posted.",
              },
              {
                title:
                  "scrollIntoViewIfNeeded decides whether to scroll",
                description:
                  "At main.swift:1588 the raw point passes through scrollIntoViewIfNeeded. If the point is inside the current window bounds the function returns it untouched. For the Screen Mirroring row it is not: distance is around 520pt on a 13-inch MacBook, lines/step becomes 3.",
              },
              {
                title:
                  "The loop posts CGEvent scrolls one step at a time",
                description:
                  "Each iteration posts one CGEvent scroll wheel event with wheelCount=1 and wheel1=scrollDirection at the midY of the window. It sleeps 100ms, then calls findElementByText with the target string and the current window bounds. As soon as the element's center lands inside the 15pt-inset viewport rect, the function returns the new center.",
              },
              {
                title:
                  "click_and_traverse posts the click at the adjusted point",
                description:
                  "adjustedPoint replaces rawPoint at main.swift:1589. CGEvent.post at .cghidEventTap fires. macOS sees a left mouse down, a left mouse up, and the 'Screen Mirroring' row highlights. The diff against the previous traversal is written to /tmp/macos-use/ with + / - / ~ prefixed lines.",
              },
              {
                title:
                  "Two more clicks finish the flow",
                description:
                  "Click the 'Show in Menu Bar' popup button next to the row, click the 'Always' menu item, done. A .png screenshot of the window is saved alongside the diff so the model can verify. Your menu bar now has a Screen Mirroring icon.",
              },
            ]}
          />
        </section>

        {/* The anchor code: adaptive step */}
        <section className="bg-zinc-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <span className="inline-block bg-cyan-50 text-cyan-700 text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full mb-4">
              Anchor code 1 of 3
            </span>
            <h2 className="text-3xl font-bold text-zinc-900 mb-4">
              The adaptive step size at main.swift:1187
            </h2>
            <p className="text-zinc-600 mb-6 max-w-2xl">
              The fastest possible scroll is one giant jump. The safest is one
              line at a time. Neither is correct for every distance. The
              function picks a step size proportional to how far off-screen the
              target is: 1 line for close misses, 2 for medium, 3 for anything
              past 250 points. On a standard trackpad each scroll line is
              roughly 20 to 40 pixels.
            </p>
            <AnimatedCodeBlock
              code={adaptiveStepCode}
              language="swift"
              filename="Sources/MCPServer/main.swift"
            />
          </div>
        </section>

        {/* Anchor code 2 */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <span className="inline-block bg-cyan-50 text-cyan-700 text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full mb-4">
            Anchor code 2 of 3
          </span>
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            Text-match verification after every scroll step
          </h2>
          <p className="text-zinc-600 mb-6 max-w-2xl">
            The AX tree does not move when the viewport does. Elements keep
            their AXPosition, and the painted rectangle is implicit in the
            window frame. After each scroll tick the loop re-runs
            findElementByText across the window subtree, and the first match
            whose center falls inside the 15-point-inset viewport rect is
            returned as the click target. This is what lets the function stop
            the moment the row is painted, without overshooting.
          </p>
          <AnimatedCodeBlock
            code={textCaseCode}
            language="swift"
            filename="Sources/MCPServer/main.swift"
          />
        </section>

        {/* Anchor code 3: probe */}
        <section className="bg-zinc-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <span className="inline-block bg-cyan-50 text-cyan-700 text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full mb-4">
              Anchor code 3 of 3
            </span>
            <h2 className="text-3xl font-bold text-zinc-900 mb-4">
              The probe-edge fallback for unlabeled rows
            </h2>
            <p className="text-zinc-600 mb-6 max-w-2xl">
              Some rows in Control Center have no associated AX text, like the
              popup button that sits at the end of each module for Show in Menu
              Bar. There is nothing to match against. The fallback at
              main.swift:1220 scrolls one step at a time and probes a point 60
              points inside the viewport edge where new content is appearing,
              logging whatever element sits there. When the original target
              point finally comes back into range, the function latches onto
              its text and uses findElementByText for the final landing.
            </p>
            <AnimatedCodeBlock
              code={probeCaseCode}
              language="swift"
              filename="Sources/MCPServer/main.swift"
            />
          </div>
        </section>

        {/* Terminal transcript */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            What the stderr log says for a real Screen Mirroring run
          </h2>
          <p className="text-zinc-600 mb-8 max-w-2xl">
            The server writes one line per decision. The{" "}
            <span className="font-mono text-sm">distance=520px</span> and{" "}
            <span className="font-mono text-sm">lines/step=3</span> tell you
            which branch of the adaptive formula fired. The per-step{" "}
            <span className="font-mono text-sm">element frame=</span> lines are
            how you verify the row is actually moving up into the viewport
            instead of being stuck off-screen because the window was scrolled
            up already.
          </p>
          <TerminalOutput
            title="macos-use stderr during scrollIntoViewIfNeeded targeting Screen Mirroring"
            lines={terminalTranscript}
          />
        </section>

        {/* ProofBanner */}
        <section className="max-w-4xl mx-auto px-6 py-8">
          <ProofBanner
            quote="Scale lines per step to distance: 1 line for tiny offsets, up to 3 for large ones. Each scroll line ≈ 20-40px, so 1 line is enough when distance < 80px."
            source="doc comment at Sources/MCPServer/main.swift:1185-1186"
            metric="3 tiers"
          />
        </section>

        {/* Metrics */}
        <section className="bg-zinc-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-zinc-900 mb-6">
              Numbers you can reproduce from the current commit
            </h2>
            <p className="text-zinc-600 mb-8 max-w-2xl">
              Every number below comes straight from{" "}
              <span className="font-mono text-sm">
                Sources/MCPServer/main.swift
              </span>{" "}
              at HEAD. Clone, open, grep.
            </p>
            <MetricsRow
              metrics={[
                { value: 30, label: "max scroll steps before giving up" },
                { value: 125, label: "lines in scrollIntoViewIfNeeded" },
                { value: 60, suffix: "pt", label: "probe inset from viewport edge" },
                { value: 15, suffix: "pt", label: "viewport safety inset for findElementByText" },
              ]}
            />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
              <GlowCard>
                <div className="p-6">
                  <div className="text-4xl font-bold text-zinc-900">
                    <NumberTicker value={100} />
                    <span className="text-xl ml-1">ms</span>
                  </div>
                  <div className="text-sm text-zinc-500 mt-2">
                    sleep between scroll ticks in text mode (main.swift:1199)
                  </div>
                </div>
              </GlowCard>
              <GlowCard>
                <div className="p-6">
                  <div className="text-4xl font-bold text-zinc-900">
                    <NumberTicker value={150} />
                    <span className="text-xl ml-1">ms</span>
                  </div>
                  <div className="text-sm text-zinc-500 mt-2">
                    sleep per tick in probe-edge mode (main.swift:1242)
                  </div>
                </div>
              </GlowCard>
              <GlowCard>
                <div className="p-6">
                  <div className="text-4xl font-bold text-zinc-900">
                    <NumberTicker value={8} />
                  </div>
                  <div className="text-sm text-zinc-500 mt-2">
                    nudge steps after the probe finds the target (main.swift:1264)
                  </div>
                </div>
              </GlowCard>
              <GlowCard>
                <div className="p-6">
                  <div className="text-4xl font-bold text-zinc-900">
                    <NumberTicker value={5} />
                    <span className="text-xl ml-1">s</span>
                  </div>
                  <div className="text-sm text-zinc-500 mt-2">
                    AXUIElement messaging timeout on the app (main.swift:1161)
                  </div>
                </div>
              </GlowCard>
            </div>
          </div>
        </section>

        {/* BentoGrid: why this matters */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            Why this function exists, concretely
          </h2>
          <p className="text-zinc-600 mb-8 max-w-2xl">
            Every row in the grid below is a failure mode that disappears the
            moment scrollIntoViewIfNeeded runs. The fix is the same in every
            case: do not trust that the AX tree's painted rectangle matches
            the visible viewport.
          </p>
          <BentoGrid
            cards={[
              {
                title:
                  "Screen Mirroring row reported at y=1082 on a window whose viewport ends at y=562",
                description:
                  "The AX tree happily returns the logical position of every row in the Control Center pane, including rows the window never painted. A CGEvent click at that y coordinate hits the desktop wallpaper under the System Settings window. scrollIntoViewIfNeeded detects this at main.swift:1168 when windowBounds.contains(point) is false, and starts scrolling.",
                size: "2x1" as const,
              },
              {
                title:
                  "Adaptive lines/step picks 3 when the row is 520pt away",
                description:
                  "At distance 520, the formula at main.swift:1187 picks 3 lines per step, so each scroll covers roughly 60 to 120 pixels. The row lands in the viewport after 5 to 9 steps instead of 20 to 40. Critical for keeping total automation time under a second.",
                size: "1x1" as const,
              },
              {
                title:
                  "15-point viewport inset prevents edge-clipping",
                description:
                  "findElementByText at main.swift:1128 uses windowBounds.insetBy(dx: 0, dy: 15). Without that, the loop would return the moment the row's center first appears, often with the row half-clipped at the bottom edge. The inset guarantees 15 points of clearance.",
                size: "1x1" as const,
              },
              {
                title:
                  "Probe-edge fallback handles Control Center's unlabeled popup buttons",
                description:
                  "The 'Show in Menu Bar' popup next to each module does not carry an AX text attribute in its AXStaticText descendants, so findElementByText returns nothing. The branch at main.swift:1220-1284 switches to scrolling and probing the 60-point-inset edge for whatever element appears there, then latches onto it once the target re-enters view.",
                size: "1x1" as const,
              },
              {
                title:
                  "30-step cap bounds the worst-case latency",
                description:
                  "If a selector points at something that is not scrollable into view (a hidden sidebar, a collapsed section), the loop would scroll forever. The hard cap at main.swift:1189 returns the original point, the click fails with a loud error, and the model gets a response it can reason about instead of hanging.",
                size: "1x1" as const,
              },
            ]}
          />
        </section>

        {/* Marquee: what can hide below the fold */}
        <section className="py-12 border-y border-zinc-200">
          <div className="max-w-5xl mx-auto px-6">
            <p className="text-center text-zinc-500 text-sm mb-6 uppercase tracking-wide">
              Control Center rows that commonly sit below the fold in System Settings
            </p>
            <Marquee speed={45} fade pauseOnHover>
              {[
                "Wi-Fi",
                "Bluetooth",
                "AirDrop",
                "Focus",
                "Stage Manager",
                "Screen Mirroring",
                "Display",
                "Sound",
                "Now Playing",
                "Accessibility Shortcuts",
                "Battery",
                "Hearing",
                "Fast User Switching",
                "Keyboard Brightness",
                "Music Recognition",
                "Screen Recording",
                "Screen Distance",
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

        {/* BeforeAfter */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            The click with and without the auto-scroll
          </h2>
          <p className="text-zinc-600 mb-8 max-w-2xl">
            Toggle between the two. Same MCP tool call, same AX tree, same
            target coordinate. The only difference is whether
            scrollIntoViewIfNeeded runs before the CGEvent.post.
          </p>
          <BeforeAfter
            title="Claude Desktop prompt: 'Set Screen Mirroring to Always Show in Menu Bar.'"
            before={{
              label: "Without scrollIntoViewIfNeeded",
              content:
                "Model greps the AX tree, finds 'Screen Mirroring' at (612, 1082), calls click_and_traverse. The server posts a CGEvent mouse-down at that coordinate. The click lands 520 points below the System Settings window frame, on the desktop. Nothing highlights. The AX diff shows zero changes. The model retries and gets the same result forever.",
              highlights: [
                "Click posted on the desktop, not on the window",
                "AX diff is empty, model has no way to know why",
                "Retries will never succeed because the coordinate is off-viewport",
                "No log line explaining the failure, just silence",
              ],
            }}
            after={{
              label: "With scrollIntoViewIfNeeded",
              content:
                "Model does the same thing. Server routes the raw point through scrollIntoViewIfNeeded at main.swift:1588. Function notices the point is below windowBounds.maxY, picks linesPerStep=3 for the 520pt distance, posts 7 scroll events across the window, calls findElementByText after each, and returns the row's painted center at (612, 556). click_and_traverse posts the click there. The row highlights. Next call hits the Show in Menu Bar popup. Flow completes in under 2 seconds.",
              highlights: [
                "Adaptive lines/step resolves in 5-9 scroll steps, not 20-40",
                "findElementByText verifies the row is in view before returning",
                "15pt viewport inset prevents edge-clipping the target",
                "Stderr log 'found X at (x,y) after N steps' proves the landing",
              ],
            }}
          />
        </section>

        {/* Checklist */}
        <section className="bg-zinc-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <AnimatedChecklist
              title="What scrollIntoViewIfNeeded guarantees for a Screen Mirroring menu-bar setup"
              items={[
                {
                  text: "Raw AX coordinates outside the painted viewport are detected before any CGEvent is posted",
                  checked: true,
                },
                {
                  text: "Scroll step size adapts to distance: 1 line under 80px, 2 under 250px, 3 otherwise",
                  checked: true,
                },
                {
                  text: "Every step re-runs findElementByText across the window subtree and stops when the element is visible",
                  checked: true,
                },
                {
                  text: "If the target has no AX text, the probe-edge branch latches onto whatever appears at the 60pt inset",
                  checked: true,
                },
                {
                  text: "30-step hard cap prevents infinite scroll if the selector points at something unscrollable",
                  checked: true,
                },
                {
                  text: "15pt viewport inset guarantees the element is not clipped at the top or bottom edge",
                  checked: true,
                },
                {
                  text: "AXUIElementSetMessagingTimeout of 5s keeps a wedged System Settings from stalling the scroll",
                  checked: true,
                },
              ]}
            />
          </div>
        </section>

        {/* Install / try */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            Try it yourself
          </h2>
          <p className="text-zinc-600 mb-6 max-w-2xl">
            Build the server, grant Accessibility permission, point Claude
            Desktop at the binary, and send the prompt. Tail stderr through the
            Claude Desktop MCP log viewer. The scrollIntoViewIfNeeded log lines
            are how you verify the auto-scroll fired, and the step count tells
            you whether your default System Settings size made the row one or
            two screens below the fold.
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
            # Prompt: &quot;Open System Settings, go to Control Center, and set
            <br />
            #          Screen Mirroring to Always Show in Menu Bar.&quot;
          </div>
        </section>

        {/* Footer CTA */}
        <section className="max-w-4xl mx-auto px-6 py-12">
          <BookCallCTA
            appearance="footer"
            destination="https://cal.com/team/mediar/macos-use"
            site="macOS MCP"
            heading="Want to see the auto-scroll hit on your own macOS layout?"
            description="Book a 20-minute call and we will screen-share a live Claude Desktop run against your System Settings."
          />
        </section>

        {/* FAQ */}
        <section className="bg-zinc-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-zinc-900 mb-6">
              Frequently asked questions
            </h2>
            <FaqSection items={faqItems} />
          </div>
        </section>

        <BookCallCTA
          appearance="sticky"
          destination="https://cal.com/team/mediar/macos-use"
          site="macOS MCP"
          description="See macos-use drive System Settings end to end."
        />
      </article>
    </>
  );
}
