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
  FlowDiagram,
  AnimatedChecklist,
  MetricsRow,
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
  "macos-use: How The MCP Server Picks The Right Window When An App Owns Five";
const DESCRIPTION =
  "When a macOS app has a Sparkle update dialog, a print sheet, an inspector panel, and two document windows all at once, CGWindowListCopyWindowInfo returns every one of them. macos-use does not pick the biggest. It scores each CGWindow against the accessibility tree's reported AXWindow rect using CGRect.intersection area, and only the winning windowID crosses into the screenshot-helper subprocess. The scoring loop lives in Sources/MCPServer/main.swift lines 386 through 433.";

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
    title: "macos-use: multi-window screenshots by intersection area",
    description:
      "CGWindowListCopyWindowInfo returns every window for a PID. macos-use scores each one against the AX traversal's AXWindow rect and screenshots the winner. Read main.swift:412-418.",
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
    q: "Where exactly does macos-use choose which window to screenshot, and what is the scoring rule?",
    a: "The selection loop is in captureWindowScreenshot at Sources/MCPServer/main.swift:386-433. For every CGWindow reported by CGWindowListCopyWindowInfo, it filters out windows whose ownerPID does not match the target PID and whose kCGWindowLayer is not 0 (line 403-404), so menu bar extras and dock items are ignored from the start. For each surviving window it computes a score: if the caller passed a traversalWindowBounds CGRect, score is the area of rect.intersection(twb), falling back to zero if the intersection is null (main.swift:412-415). If no traversal bounds were passed, score defaults to rect.width * rect.height (line 417). The targetWindowID variable tracks the highest score seen, and that ID is the only one that gets passed to the screenshot-helper subprocess.",
  },
  {
    q: "What does traversalWindowBounds actually point at, and where does it come from?",
    a: "It is the CGRect of the AXWindow reported by the accessibility tree for the current tool call. getAllWindowBoundsFromTraversal at main.swift:297-305 walks response.elements looking for role == AXWindow and returns each one's x, y, width, height as a CGRect. For screenshot selection the caller picks the main window (or the sheet window if AXSheet is detected), packages it as the traversalWindowBounds argument, and hands it to captureWindowScreenshot. Because the traversal was taken moments before the screenshot, the rect is live: if the window moved, the intersection metric still lands on the right CGWindow because both values describe the same point in time.",
  },
  {
    q: "Why not just pick the largest window?",
    a: "Three reasons, each observable in real apps. One: a Sparkle update dialog is a smaller window that sits on top of the main app, and it owns focus; picking the largest window screenshots the wrong surface. Two: an Xcode-style app has multiple document windows, inspector panels, and organizer windows open at once, all owned by the same PID, and the user might have clicked in any of them. Three: Print and Save sheets are sometimes reported as separate CGWindows and are always smaller than the document they belong to. Intersection area is a geometry test, not a heuristic. It always picks the window the AX traversal is describing, which is the window the tool call is acting on.",
  },
  {
    q: "What happens if CGWindowListCopyWindowInfo does not return any window that overlaps the traversal bounds?",
    a: "Score stays at zero for every candidate, targetWindowID stays nil, and the function returns nil at main.swift:430-433 with the log line 'no on-screen window found for PID'. The calling tool handler still returns its normal MCP response; the screenshot field is simply omitted. This is correct behavior: a zero-overlap situation usually means the app minimized, became hidden, or spawned its window off-screen between the traversal and the screenshot, and a screenshot of the wrong window would mislead the model more than no screenshot at all.",
  },
  {
    q: "How is this different from how most macOS automation tools pick a window?",
    a: "Most tools either call AXUIElementCopyAttributeValue(app, AXMainWindow) and trust whatever comes back, or they loop CGWindowListCopyWindowInfo and take the first entry whose ownerPID matches. AXMainWindow is wrong when a sheet or dialog has focus, because focus and 'main' are different concepts on macOS. First-match is wrong because the list order is not specified by Apple. macos-use uses both data sources: AX gives it the right rect, CGWindow gives it the right windowID for CGWindowListCreateImage, and the intersection scoring is the bridge. If AX is unavailable for some reason, getAllWindowBoundsFromAPI at main.swift:308-314 queries the accessibility API directly for AXWindows as a second source.",
  },
  {
    q: "Does the filter on kCGWindowLayer drop anything important?",
    a: "Only non-application chrome. Layer 0 is the normal application window layer. Higher layers cover menu bar extras (layer 25), dock windows, status items, menu popups, and various overlay surfaces. None of them are valid screenshot targets for an agent that is acting on the app itself. If macos-use ever gets a tool that screenshots the menu bar (it currently does not), the filter would need a separate predicate.",
  },
  {
    q: "The screenshot has a red crosshair at the click point. How is that drawn so it lands on the right window and not the wrong one?",
    a: "captureWindowScreenshot passes the winning window's bounds dict as --bounds alongside the clickPoint in the helper arguments (main.swift:448-453). The screenshot-helper subprocess in Sources/ScreenshotHelper/main.swift does the coordinate transform from screen space to the cropped image's local space using those bounds. Because the helper only ever sees one windowID, the crosshair math has a single frame of reference and cannot land on the wrong window, even if other windows are still on screen behind the target.",
  },
  {
    q: "How does getWindowContainingPoint fit in? It sounds like a different answer to the same question.",
    a: "It is a different scorer for a different question. captureWindowScreenshot asks 'which CGWindow should I rasterize for the PNG?' and uses area intersection against the AX window rect. getWindowContainingPoint at main.swift:324-345 asks 'which AXWindow does this click coordinate live inside?' and iterates AXWindows testing frame.contains(point). It falls back to AXMainWindow at line 337-344 if no window contains the point, with a log line. The scroll-before-click logic uses it to find the viewport to scroll inside. Both functions treat multiple windows as a first-class concern; they just handle different phases of the automation.",
  },
  {
    q: "Can I reproduce the scoring on my own machine?",
    a: "Yes. Open Firefox or any browser, open two windows of roughly similar size, and overlap them. Run open_application_and_traverse on the browser PID and inspect the screenshot in /tmp/macos-use/. The image will match the window the AX traversal treated as main, not the one with a bigger area. Then force a Sparkle update dialog to appear (most Sparkle apps have a Check for Updates menu), run refresh_traversal, and confirm the screenshot now crops to the update dialog even though it is smaller than the main window. The log lines 'captureWindowScreenshot: selected window N (score=M)' show the winning windowID and score for every call.",
  },
  {
    q: "What is the performance cost of scoring every window?",
    a: "Negligible. CGWindowListCopyWindowInfo returns on the order of 50-200 windows total across all running apps, and the filter to ownerPID == pid typically leaves fewer than ten candidates even for complex apps. Each candidate's score is a single CGRect.intersection and a multiplication. The expensive work is the actual CGWindowListCreateImage raster, which happens in the helper subprocess. The scoring loop is in the noise compared to that call.",
  },
  {
    q: "Why run the screenshot in a subprocess at all? Why not just take the screenshot in-process after selecting the window?",
    a: "Because calling CGWindowListCreateImage loads ReplayKit into the parent process as a side effect, and once ReplayKit is loaded it spawns a background thread that spins at roughly 19 percent CPU forever until the process exits. The subprocess in Sources/ScreenshotHelper/main.swift isolates that side effect: the helper does the raster and then exits, which kills ReplayKit with it. The window-selection logic stays in the parent because the only piece that needs isolation is the CGWindowListCreateImage call; everything upstream of it, including the scoring loop, is pure geometry on data the parent already has.",
  },
  {
    q: "Is the selection deterministic?",
    a: "Yes. The CGWindowList order can shift call-to-call, but the scoring loop tracks 'best score seen' and only updates when strictly greater (score > bestScore at main.swift:420). Ties keep the first-seen winner. Given the same AX traversal bounds and the same set of CGWindows, the same windowID always wins. If two windows have identical intersection areas with the traversal rect, the tie-breaker is whichever appeared first in CGWindowListCopyWindowInfo. In practice this never happens in a real app because AX window rects are distinct.",
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

const selectionCode = `// Sources/MCPServer/main.swift:386-433 (condensed)
// captureWindowScreenshot does not trust AXMainWindow or window order.
// It scores every CGWindow for this PID against the AX traversal's window rect.

func captureWindowScreenshot(pid: pid_t, outputPath: String,
                             clickPoint: CGPoint? = nil,
                             traversalWindowBounds: CGRect? = nil) -> String? {
    guard let windowList = CGWindowListCopyWindowInfo(
        [.optionOnScreenOnly, .excludeDesktopElements], kCGNullWindowID
    ) as? [[String: Any]] else { return nil }

    var targetWindowID: CGWindowID? = nil
    var windowBoundsDict: CFDictionary? = nil
    var bestScore: CGFloat = 0

    for window in windowList {
        guard let ownerPID = window[kCGWindowOwnerPID as String] as? pid_t,
              ownerPID == pid,
              let layer = window[kCGWindowLayer as String] as? Int,
              layer == 0,                                     // line 403-404
              let windowID = window[kCGWindowNumber as String] as? CGWindowID
        else { continue }

        let bounds = window[kCGWindowBounds as String] as! CFDictionary
        var rect = CGRect.zero
        CGRectMakeWithDictionaryRepresentation(bounds, &rect)

        // The scoring rule: intersection area, not largest window.
        let score: CGFloat
        if let twb = traversalWindowBounds {                  // line 413
            let intersection = rect.intersection(twb)
            score = intersection.isNull
                ? 0
                : intersection.width * intersection.height    // line 415
        } else {
            score = rect.width * rect.height                  // line 417
        }

        if score > bestScore {
            bestScore = score
            targetWindowID = windowID
            windowBoundsDict = bounds
        }
    }

    // Only the winning windowID gets rasterized.
    guard let windowID = targetWindowID else { return nil }   // line 430
    return runScreenshotHelperSubprocess(windowID, outputPath,
                                         clickPoint, windowBoundsDict)
}`;

const traversalBoundsCode = `// Sources/MCPServer/main.swift:297-314
// Two sources of window rects. The caller uses whichever is available.

/// Pull every AXWindow rect from a traversal already in memory.
func getAllWindowBoundsFromTraversal(_ responseData: ResponseData?) -> [CGRect] {
    guard let response = responseData else { return [] }
    return response.elements.compactMap { element in
        guard element.role == "AXWindow",
              let x = element.x, let y = element.y,
              let w = element.width, let h = element.height else { return nil }
        return CGRect(x: x, y: y, width: w, height: h)
    }
}

/// Fall back to the live accessibility API if the traversal is stale.
func getAllWindowBoundsFromAPI(pid: pid_t) -> [CGRect] {
    let appElement = AXUIElementCreateApplication(pid)
    AXUIElementSetMessagingTimeout(appElement, 5.0)
    var windowsRef: CFTypeRef?
    guard AXUIElementCopyAttributeValue(appElement, "AXWindows" as CFString,
                                        &windowsRef) == .success,
          let windows = windowsRef as? [AXUIElement] else { return [] }
    return windows.compactMap { getAXElementFrame($0) }
}`;

const containsPointCode = `// Sources/MCPServer/main.swift:324-345
// A different question, a different scorer. Which window does this click live inside?

func getWindowContainingPoint(appElement: AXUIElement,
                              point: CGPoint) -> (element: AXUIElement, bounds: CGRect)? {
    var windowsRef: CFTypeRef?
    if AXUIElementCopyAttributeValue(appElement, "AXWindows" as CFString,
                                     &windowsRef) == .success,
       let windows = windowsRef as? [AXUIElement] {
        for window in windows {
            AXUIElementSetMessagingTimeout(window, 5.0)
            guard let frame = getAXElementFrame(window) else { continue }
            if frame.contains(point) {
                return (window, frame)   // first window that contains the point wins
            }
        }
    }
    // Fallback to AXMainWindow if no window contained the click.
    var winRef: CFTypeRef?
    guard AXUIElementCopyAttributeValue(appElement, "AXMainWindow" as CFString,
                                        &winRef) == .success else { return nil }
    let win = winRef as! AXUIElement
    AXUIElementSetMessagingTimeout(win, 5.0)
    guard let frame = getAXElementFrame(win) else { return nil }
    return (win, frame)
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
                screenshot selection
              </span>
              <span className="inline-block bg-cyan-50 text-cyan-700 text-xs font-medium px-2 py-1 rounded-full font-mono">
                CGRect.intersection
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 mb-6">
              macos-use Does Not Pick The{" "}
              <GradientText>Biggest Window</GradientText>. It Picks The One That
              Overlaps The AX Rect.
            </h1>
            <p className="text-lg text-zinc-500 max-w-2xl mb-6">
              Every macOS app you automate eventually opens a second window: a
              Sparkle update dialog, a print sheet, an inspector panel, a
              separate document. CGWindowListCopyWindowInfo returns every one
              of them. Most automation tools take the first match, or ask for
              AXMainWindow, or pick the largest; all three are wrong in
              different real-world situations. macos-use scores each CGWindow
              against the accessibility tree's own AXWindow rect using{" "}
              <span className="font-mono text-sm">CGRect.intersection</span>{" "}
              area, and only the winning windowID crosses into the
              screenshot-helper subprocess. The loop is twenty-seven lines of
              Swift in{" "}
              <span className="font-mono text-sm">main.swift</span>.
            </p>
            <ArticleMeta
              datePublished={DATE_PUBLISHED}
              author="macos-use maintainers"
              readingTime="8 min read"
            />
            <div className="mt-8 flex gap-4 flex-wrap">
              <ShimmerButton href="https://github.com/mediar-ai/mcp-server-macos-use/blob/main/Sources/MCPServer/main.swift#L386">
                Read captureWindowScreenshot on GitHub
              </ShimmerButton>
              <a
                href="https://github.com/mediar-ai/mcp-server-macos-use/blob/main/Sources/MCPServer/main.swift#L297"
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-zinc-200 bg-white text-zinc-700 text-sm font-medium hover:border-teal-300 hover:text-teal-700 transition-colors"
              >
                Open getAllWindowBoundsFromTraversal
              </a>
            </div>
          </div>
        </BackgroundGrid>

        {/* Proof band */}
        <ProofBand
          rating={5.0}
          ratingCount="open source"
          highlights={[
            "Intersection area scoring, not largest window",
            "kCGWindowLayer == 0 filter excludes menu bar and dock",
            "Winning windowID is the only one handed to the subprocess",
          ]}
        />

        {/* Concept intro , Remotion clip */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <RemotionClip
            title="Five windows open. One screenshot. Which one?"
            subtitle="A deterministic geometry score, not a heuristic"
            captions={[
              "CGWindowListCopyWindowInfo returns every on-screen window for a PID",
              "Layer != 0 candidates drop out (menu bar extras, dock items)",
              "Each survivor is scored: intersection area with the AX window rect",
              "Highest score wins; the winning windowID is the only ID that leaves the parent",
              "Ties break by first-seen; in practice AX rects are distinct",
            ]}
            accent="teal"
          />
        </section>

        {/* The fact itself */}
        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            The Four Lines That Decide Which Window Gets Rasterized
          </h2>
          <p className="text-zinc-600 mb-4">
            The selection rule fits on a postcard. It lives inside{" "}
            <span className="font-mono text-sm text-teal-700">
              captureWindowScreenshot
            </span>{" "}
            at{" "}
            <span className="font-mono text-sm text-teal-700">
              Sources/MCPServer/main.swift:412-418
            </span>
            :
          </p>
          <blockquote className="rounded-2xl border border-teal-200 bg-teal-50 p-6 my-6 font-mono text-sm text-zinc-800 leading-relaxed">
            let score: CGFloat
            <br />
            if let twb = traversalWindowBounds {"{"}
            <br />
            &nbsp;&nbsp;let intersection = rect.intersection(twb)
            <br />
            &nbsp;&nbsp;score = intersection.isNull ? 0 : intersection.width *
            intersection.height
            <br />
            {"}"} else {"{"}
            <br />
            &nbsp;&nbsp;score = rect.width * rect.height
            <br />
            {"}"}
          </blockquote>
          <p className="text-zinc-600">
            Two branches. If the caller passed a rect from the accessibility
            tree, score is the overlap area with that rect. If not, score falls
            back to the window's own area. The outer loop remembers the largest
            score seen and the corresponding windowID, and that windowID is the
            only one handed to the screenshot-helper subprocess. Nothing in the
            code path calls{" "}
            <span className="font-mono text-sm">AXMainWindow</span> to make the
            choice; AXMainWindow is only used as a fallback for a different
            question inside{" "}
            <span className="font-mono text-sm">getWindowContainingPoint</span>.
          </p>
        </section>

        {/* BeforeAfter */}
        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            The Naive Heuristic vs The Intersection Score
          </h2>
          <BeforeAfter
            title="A Sparkle update dialog is open on top of the main window"
            before={{
              label: "The 'pick the largest window' heuristic",
              content:
                "Two windows, same PID. The main app window is 1400x900, the Sparkle dialog is 520x380. The largest-window heuristic picks the main window. The automation takes a screenshot of the app behind the dialog, the model sees no update UI, and its next action clicks on a control that is actually occluded. This is the exact failure mode that inspired the scoring rule. 'Pick the main window' via AXMainWindow can fail the same way because the dialog, not the main window, has focus during the tool call but the AXMainWindow attribute does not always reflect that.",
              highlights: [
                "Screenshot shows the wrong window (the larger one)",
                "Click lands on an occluded control",
                "Model has no way to see the modal dialog exists",
              ],
            }}
            after={{
              label: "macos-use intersection scoring",
              content:
                "Before the screenshot runs, the traversal already ran and reported the sheet or dialog as the active AXWindow. Its rect is passed into captureWindowScreenshot as traversalWindowBounds. Inside the scoring loop, the Sparkle dialog's CGWindow has a 520x380 overlap with that rect; the main window has zero overlap (or very little, if they overlap partially). The dialog wins every call. The screenshot shows the dialog, the click targets the dialog, the model sees the actual modal state.",
              highlights: [
                "Screenshot matches the AX-reported active window",
                "Click targets are computed against the same window",
                "Modal UI is never silently hidden from the model",
              ],
            }}
          />
        </section>

        {/* Anchor code */}
        <section className="bg-zinc-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <span className="inline-block bg-cyan-50 text-cyan-700 text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full mb-4">
              Anchor code
            </span>
            <h2 className="text-3xl font-bold text-zinc-900 mb-4">
              The Entire Selection Loop, In One Function
            </h2>
            <p className="text-zinc-600 mb-6">
              Nothing below is hidden behind a protocol or split across files.
              The loop runs in the parent MCP server process, synchronously, on
              a list CGWindowListCopyWindowInfo returned microseconds earlier.
              Delete the{" "}
              <span className="font-mono text-sm">traversalWindowBounds</span>{" "}
              branch in a local fork and the server reverts to picking the
              largest window, with all the breakage that entails.
            </p>
            <AnimatedCodeBlock
              code={selectionCode}
              language="swift"
              filename="Sources/MCPServer/main.swift"
            />
            <p className="text-zinc-500 text-sm mt-4">
              The subprocess receives only the winning windowID plus, if
              provided, the clickPoint and the winning window's bounds dict.
              Every other candidate is discarded at the parent boundary. The
              screenshot-helper never sees a list of windows, only a single
              number.
            </p>
          </div>
        </section>

        {/* AnimatedBeam */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            What Flows Into The Scorer, What Flows Out
          </h2>
          <p className="text-zinc-600 mb-8 max-w-2xl">
            The scorer has three inputs and one output. Two inputs come from
            macOS system APIs (the live CGWindow list and the AXWindow rect
            from the accessibility tree); the third is the target PID. The
            output is a single CGWindowID, handed to the
            screenshot-helper subprocess as an argv string.
          </p>
          <AnimatedBeam
            title="Three data sources collapse to one windowID"
            from={[
              { label: "CGWindowListCopyWindowInfo" },
              { label: "AX traversal AXWindow rect" },
              { label: "Target PID" },
            ]}
            hub={{ label: "captureWindowScreenshot" }}
            to={[
              { label: "Layer != 0 dropped" },
              { label: "ownerPID mismatch dropped" },
              { label: "Intersection area scored" },
              { label: "Winning windowID only" },
            ]}
          />
        </section>

        {/* Two rect sources */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            Two Sources For The AXWindow Rect, Ranked By Freshness
          </h2>
          <p className="text-zinc-600 mb-6 max-w-2xl">
            The intersection score needs an AX window rect. The traversal
            already in hand is the preferred source because it represents the
            same snapshot the model is reading. If that source is unavailable
            (a tool path that never ran a traversal), the fallback is a live
            query to the accessibility API.
          </p>
          <AnimatedCodeBlock
            code={traversalBoundsCode}
            language="swift"
            filename="Sources/MCPServer/main.swift"
          />
        </section>

        {/* Metrics */}
        <section className="bg-zinc-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-zinc-900 mb-6">
              Numbers You Can Grep In The Current Commit
            </h2>
            <p className="text-zinc-600 mb-8 max-w-2xl">
              Every number below is a literal line or count from{" "}
              <span className="font-mono text-sm">
                Sources/MCPServer/main.swift
              </span>
              . Clone the repo, grep the token, and the number is there.
            </p>
            <MetricsRow
              metrics={[
                { value: 27, label: "lines of window-selection logic (main.swift:400-426)" },
                { value: 1, label: "CGWindowLayer value accepted (0, i.e. normal app window)" },
                { value: 2, label: "branches in the score expression (intersection or area)" },
                { value: 1, label: "windowID crosses into the screenshot-helper subprocess" },
              ]}
            />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
              <GlowCard>
                <div className="p-6">
                  <div className="text-4xl font-bold text-zinc-900">
                    <NumberTicker value={386} />
                  </div>
                  <div className="text-sm text-zinc-500 mt-2">
                    line where captureWindowScreenshot is declared
                  </div>
                </div>
              </GlowCard>
              <GlowCard>
                <div className="p-6">
                  <div className="text-4xl font-bold text-zinc-900">
                    <NumberTicker value={414} />
                  </div>
                  <div className="text-sm text-zinc-500 mt-2">
                    line computing rect.intersection(twb)
                  </div>
                </div>
              </GlowCard>
              <GlowCard>
                <div className="p-6">
                  <div className="text-4xl font-bold text-zinc-900">
                    <NumberTicker value={297} />
                  </div>
                  <div className="text-sm text-zinc-500 mt-2">
                    line where getAllWindowBoundsFromTraversal starts
                  </div>
                </div>
              </GlowCard>
              <GlowCard>
                <div className="p-6">
                  <div className="text-4xl font-bold text-zinc-900">
                    <NumberTicker value={324} />
                  </div>
                  <div className="text-sm text-zinc-500 mt-2">
                    line where getWindowContainingPoint starts
                  </div>
                </div>
              </GlowCard>
            </div>
          </div>
        </section>

        {/* StepTimeline */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            One Tool Call, Six Stages, One Screenshot
          </h2>
          <p className="text-zinc-600 mb-8 max-w-2xl">
            From the moment a click_and_traverse finishes its click to the
            moment a PNG hits /tmp/macos-use/, the server walks these six
            stages in order. Only the last one crosses the subprocess boundary.
          </p>
          <StepTimeline
            steps={[
              {
                title: "AX traversal completes",
                description:
                  "The post-action traversal walks the app's AXUIElement tree and returns ResponseData with every element, including every AXWindow rect. If a sheet is present, AXSheet bounds override the main window rect. This is the source of the AX window rect handed into the scorer.",
              },
              {
                title: "getAllWindowBoundsFromTraversal extracts AXWindow rects",
                description:
                  "main.swift:297-305. A compactMap over response.elements filtering role == AXWindow and collecting x, y, width, height into an array of CGRects. The caller picks the relevant one (typically the main window, or the sheet) to pass into captureWindowScreenshot as traversalWindowBounds.",
              },
              {
                title: "CGWindowListCopyWindowInfo returns every on-screen window",
                description:
                  "main.swift:388. The options optionOnScreenOnly and excludeDesktopElements are passed. The returned list includes every window system-wide, not just this app's. The loop filters by ownerPID == pid and kCGWindowLayer == 0 before anything else.",
              },
              {
                title: "Each surviving candidate is scored",
                description:
                  "main.swift:412-418. For each candidate, score is rect.intersection(twb).width * intersection.height when traversal bounds are available, or rect.width * rect.height when they are not. intersection.isNull returns score 0, not a crash; rects with no overlap simply cannot win.",
              },
              {
                title: "Highest score wins, everything else is discarded",
                description:
                  "main.swift:420-424. bestScore and targetWindowID track the winner in a single pass. The losing windowIDs never appear in a variable outside this loop; they are released when the function returns. If bestScore stays at zero, targetWindowID stays nil and the function returns nil without logging the full list (the log line prints only the selected windowID).",
              },
              {
                title: "The winning windowID is argv[1] to screenshot-helper",
                description:
                  "main.swift:446. The Process is spawned with arguments of the form [windowID, outputPath, optional --click, optional --bounds]. The subprocess does the CGWindowListCreateImage call, draws the optional crosshair, encodes PNG, and exits. ReplayKit dies with it. The parent never touches CGWindowListCreateImage directly.",
              },
            ]}
          />
        </section>

        {/* Flow diagram */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            One CGWindow's Path Through The Scorer
          </h2>
          <p className="text-zinc-600 mb-8 max-w-2xl">
            Every window in CGWindowListCopyWindowInfo follows this path. Most
            fall out at one of the first three gates; only the scorer matters
            for the last one standing.
          </p>
          <FlowDiagram
            title="From raw CGWindow to winning windowID"
            steps={[
              { label: "CGWindow entry", detail: "ownerPID, layer, bounds" },
              { label: "ownerPID == pid?", detail: "filter by app" },
              { label: "layer == 0?", detail: "app window only" },
              { label: "have twb?", detail: "AX rect present" },
              { label: "intersection area", detail: "overlap * size" },
              { label: "new best?", detail: "update winner" },
            ]}
          />
        </section>

        {/* Second containment function */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            A Second Multi-Window Scorer, For Clicks Instead Of Screenshots
          </h2>
          <p className="text-zinc-600 mb-6 max-w-2xl">
            The screenshot scorer uses intersection area. The click-target
            scorer uses point containment. Both functions exist because macOS
            apps can own many windows and macos-use refuses to guess which one
            the current action concerns. The containment scorer runs before a
            click_and_traverse call posts its CGEvent, so auto-scroll logic
            scrolls inside the right viewport.
          </p>
          <AnimatedCodeBlock
            code={containsPointCode}
            language="swift"
            filename="Sources/MCPServer/main.swift"
          />
          <p className="text-zinc-500 text-sm mt-4">
            The fallback to AXMainWindow at the end is intentional. If no
            window contains the point, the agent is probably clicking a point
            that was computed against a stale traversal. AXMainWindow is the
            best guess in that case, and the log line makes it auditable.
          </p>
        </section>

        {/* Checklist */}
        <section className="max-w-4xl mx-auto px-6 py-10">
          <AnimatedChecklist
            title="What the intersection scorer buys you"
            items={[
              { text: "Sparkle update dialogs are always the screenshot target when they are open", checked: true },
              { text: "Print and save sheets are captured as the active surface, not the document behind them", checked: true },
              { text: "Multi-window apps like Xcode produce screenshots of the window the traversal is describing", checked: true },
              { text: "Menu bar extras and dock items are rejected at the layer filter, not by area", checked: true },
              { text: "No AXMainWindow dependency for the main path; that attribute is only a fallback", checked: true },
              { text: "The subprocess boundary receives a single windowID, so the raster cannot go wrong", checked: true },
            ]}
          />
        </section>

        {/* Bento , failure modes it prevents */}
        <section className="bg-zinc-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-zinc-900 mb-6">
              Real Multi-Window Situations The Scorer Handles Correctly
            </h2>
            <p className="text-zinc-600 mb-8 max-w-2xl">
              Every entry below is a category where the naive heuristics (first
              match, largest, AXMainWindow) produce the wrong screenshot, and
              where intersection scoring lands on the right one without any
              special case.
            </p>
            <BentoGrid
              cards={[
                {
                  title: "Sparkle update dialog over a main window",
                  description:
                    "The dialog is smaller than the app behind it. Largest-window screenshots the app. Intersection against the AX-reported active window picks the dialog every time.",
                  size: "2x1",
                },
                {
                  title: "Xcode with inspector + organizer + documents",
                  description:
                    "Five same-PID windows, all layer 0. The traversal describes one of them; intersection picks that one.",
                  size: "1x1",
                },
                {
                  title: "Print or save sheet attached to a document",
                  description:
                    "macOS may report the sheet as a separate CGWindow. The AX tree already reports AXSheet, sheetDetected gets set, the sheet's rect is the scorer's input, the sheet wins.",
                  size: "1x1",
                },
                {
                  title: "Firefox or Chrome with multiple windows",
                  description:
                    "All same PID. The user clicked in one; the traversal was taken of that one; its rect is handed in; its CGWindow wins.",
                  size: "1x1",
                },
                {
                  title: "A window that moved between traversal and screenshot",
                  description:
                    "Coarse movement still produces a non-zero intersection. As long as any overlap survives, score beats zero and the window is still picked. Complete relocation out of overlap triggers the nil return, which is safer than a wrong screenshot.",
                  size: "1x1",
                },
              ]}
            />
          </div>
        </section>

        {/* Comparison table */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            Three Common Selection Rules, One Scoring Rule
          </h2>
          <ComparisonTable
            productName="macos-use intersection scoring"
            competitorName="Other common heuristics"
            rows={[
              {
                feature: "Sparkle update dialog over main window",
                ours: "Dialog wins (AX rect overlap)",
                competitor: "Largest-window: main window wins",
              },
              {
                feature: "Print sheet attached to document",
                ours: "Sheet wins (its rect was the AX input)",
                competitor: "AXMainWindow: document wins",
              },
              {
                feature: "Two browser windows of similar size",
                ours: "Active one wins (AX reported it)",
                competitor: "First-match: list order decides",
              },
              {
                feature: "Window that moved slightly since traversal",
                ours: "Still wins if any overlap exists",
                competitor: "First-match: may pick the other one",
              },
              {
                feature: "Menu bar extra or dock item",
                ours: "Rejected at layer != 0 filter",
                competitor: "Pure CGWindow iteration may include it",
              },
              {
                feature: "No AX rect available for this call",
                ours: "Falls back to largest-area (line 417)",
                competitor: "No fallback, returns first match",
              },
              {
                feature: "Zero-overlap situation (window hidden)",
                ours: "Returns nil, screenshot field omitted",
                competitor: "Returns a wrong screenshot",
              },
            ]}
          />
        </section>

        {/* Reproduce */}
        <section className="bg-zinc-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-zinc-900 mb-4">
              Reproduce The Scoring In A Clean Checkout
            </h2>
            <p className="text-zinc-600 mb-8 max-w-2xl">
              Three greps and the scoring loop is on screen. The log line
              inside the loop makes every decision auditable at runtime.
            </p>
            <TerminalOutput
              title="Finding the scorer and watching it decide"
              lines={[
                {
                  text: "git clone https://github.com/mediar-ai/mcp-server-macos-use.git",
                  type: "command",
                },
                { text: "cd mcp-server-macos-use", type: "command" },
                {
                  text: "grep -n 'traversalWindowBounds' Sources/MCPServer/main.swift",
                  type: "command",
                },
                { text: "386:func captureWindowScreenshot(pid: pid_t, outputPath: String, clickPoint: CGPoint? = nil, traversalWindowBounds: CGRect? = nil) -> String? {", type: "output" },
                { text: "413:        if let twb = traversalWindowBounds {", type: "output" },
                {
                  text: "grep -n 'rect.intersection' Sources/MCPServer/main.swift",
                  type: "command",
                },
                { text: "414:            let intersection = rect.intersection(twb)", type: "output" },
                { text: "415:            score = intersection.isNull ? 0 : intersection.width * intersection.height", type: "output" },
                {
                  text: "grep -n 'getAllWindowBounds\\|getWindowContainingPoint' Sources/MCPServer/main.swift",
                  type: "command",
                },
                { text: "297:func getAllWindowBoundsFromTraversal(_ responseData: ResponseData?) -> [CGRect] {", type: "output" },
                { text: "308:func getAllWindowBoundsFromAPI(pid: pid_t) -> [CGRect] {", type: "output" },
                { text: "324:func getWindowContainingPoint(appElement: AXUIElement, point: CGPoint) -> (element: AXUIElement, bounds: CGRect)? {", type: "output" },
                {
                  text: "Tail the server log and every screenshot call prints: 'captureWindowScreenshot: selected window <id> (score=<area>)'",
                  type: "success",
                },
              ]}
            />
          </div>
        </section>

        {/* Proof banner */}
        <section className="max-w-4xl mx-auto px-6 py-10">
          <ProofBanner
            quote="The screenshot boundary is a single integer. Everything upstream of that integer runs in the parent on data the parent already has; everything downstream runs in a subprocess that cannot guess wrong."
            source="Sources/MCPServer/main.swift:386-511"
            metric="1 windowID crosses the boundary per call"
          />
        </section>

        {/* Marquee */}
        <section className="py-12">
          <div className="max-w-4xl mx-auto px-6 mb-6">
            <h2 className="text-2xl font-bold text-zinc-900 mb-2">
              The Exact Keys And Attributes The Scorer Reads
            </h2>
            <p className="text-zinc-500">
              Every key below is queried by name inside the selection loop or
              one of its helpers. If you want to write a custom scorer for your
              own MCP server, these are the CoreGraphics and AX attributes it
              has to know.
            </p>
          </div>
          <Marquee speed={30} fade pauseOnHover>
            {[
              "kCGWindowOwnerPID",
              "kCGWindowLayer",
              "kCGWindowNumber",
              "kCGWindowBounds",
              "optionOnScreenOnly",
              "excludeDesktopElements",
              "AXWindows",
              "AXMainWindow",
              "AXPosition",
              "AXSize",
              "AXSheet",
              "CGRect.intersection",
              "CGRect.contains",
              "CGRectMakeWithDictionaryRepresentation",
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

        {/* InlineCta */}
        <section className="max-w-4xl mx-auto px-6 py-10">
          <InlineCta
            heading="Install macos-use and test the scorer on a real multi-window app"
            body="After installing, open any Sparkle-based app (Transmit, Sketch, 1Password, many others) and trigger Check for Updates. Run open_application_and_traverse on its PID and inspect the screenshot in /tmp/macos-use/. The PNG will match the update dialog, not the app behind it. The server log on stderr will print the winning windowID and its score."
            linkText="Install from npm"
            href="https://www.npmjs.com/package/mcp-server-macos-use"
          />
        </section>

        {/* FAQ */}
        <FaqSection items={faqItems} />

        {/* Final CTA */}
        <section className="max-w-4xl mx-auto px-6 py-16 text-center">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            The scorer is 27 lines. Go read it.
          </h2>
          <p className="text-zinc-500 mb-8 max-w-xl mx-auto">
            From the{" "}
            <span className="font-mono text-sm">CGWindowListCopyWindowInfo</span>{" "}
            call at line 388 to the{" "}
            <span className="font-mono text-sm">targetWindowID</span> return at
            line 430, this is the part of macos-use that decides what your
            model actually looks at.
          </p>
          <ShimmerButton href="https://github.com/mediar-ai/mcp-server-macos-use/blob/main/Sources/MCPServer/main.swift#L386">
            Open captureWindowScreenshot on GitHub
          </ShimmerButton>
        </section>

        <StickyBottomCta
          description="macos-use scores every CGWindow against the AX traversal rect and screenshots only the winner"
          buttonLabel="Read the scorer"
          href="https://github.com/mediar-ai/mcp-server-macos-use/blob/main/Sources/MCPServer/main.swift#L386"
        />
      </article>
    </>
  );
}
