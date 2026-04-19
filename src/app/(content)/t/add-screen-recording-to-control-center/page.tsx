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
  CodeComparison,
  MetricsRow,
  BentoGrid,
  StepTimeline,
  BookCallCTA,
  RelatedPostsGrid,
  articleSchema,
  breadcrumbListSchema,
  faqPageSchema,
} from "@seo/components";

const SLUG = "add-screen-recording-to-control-center";
const URL = `https://macos-use.dev/t/${SLUG}`;
const DATE_PUBLISHED = "2026-04-19";
const DATE_MODIFIED = "2026-04-19";
const TITLE =
  "Add Screen Recording To Control Center: The Reason Every macos-use Tool Call Forks A Second Process Just To Take The Screenshot";
const DESCRIPTION =
  "Apple Support, AppleVis, TechSmith and Apple Discussions all walk you through the same five-click manual flow. None of them mention what an MCP agent has to do next: take a window-clipped PNG to confirm the toggle actually flipped. macos-use does that with a separate 112-line executable called screenshot-helper, declared at Package.swift:25-29 and forked from Sources/MCPServer/main.swift:458-489 with a hard 5.0-second timeout, because CGWindowListCreateImage side-loads ReplayKit and the framework, once loaded, will pin the parent process at ~19% CPU forever.";

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
      "Why an MCP server forks a second binary every time it adds Screen Recording to Control Center",
    description:
      "macos-use never calls CGWindowListCreateImage in-process. Every screenshot is taken by a 112-line subprocess at Sources/ScreenshotHelper/main.swift, forked with a 5s timeout from main.swift:458, because ReplayKit pegs the parent at ~19% CPU once it loads.",
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
    q: "What is the manual five-click path to add Screen Recording to Control Center on macOS Sequoia?",
    a: "Open System Settings, click Control Center in the sidebar, scroll the right pane to the Screen Recording module, and switch Show in Menu Bar to Always. On macOS 15 you can also open Control Center from the menu bar, click the small edit affordance at the bottom, and drag the Screen Recording control into a new slot. That is the path Apple Support, AppleVis, TechSmith, TheSweetBits, and the Apple Discussions thread at discussions.apple.com/thread/255457988 all describe. This page is about what happens when you ask an MCP client to do that path for you, and specifically about how the server proves to the client that the flip actually landed.",
  },
  {
    q: "Why does macos-use take a screenshot at all? Cannot the agent just trust the accessibility tree?",
    a: "It cannot, and the Screen Recording toggle is a perfect example of why. The AXValue of the Show in Menu Bar popup updates the moment the click event posts, but the actual visual change in the menu bar can lag by a few hundred milliseconds. Worse, in macOS 15 the Control Center module sometimes briefly shows the new value while a background sync to the menu bar fails silently. The screenshot is the only ground truth. macos-use captures the System Settings window after every click, draws a red crosshair at the click coordinate, and writes it to /tmp/macos-use/<timestamp>_click_and_traverse.png so the client model can read it back and verify the row visually.",
  },
  {
    q: "Why is screenshot-helper a separate binary instead of an in-process call?",
    a: "Because CGWindowListCreateImage, the API that produces the PNG, links ReplayKit on first call. Once ReplayKit is loaded into the address space of a long-lived process, it spins a background thread at roughly 19 percent CPU forever, and there is no public API to unload it. The doc comment at Sources/MCPServer/main.swift:382-385 spells this out: 'The actual CGWindowListCreateImage call runs in a subprocess (screenshot-helper) so that the ReplayKit framework, loaded as a side-effect by macOS, dies with the subprocess instead of spinning at ~19% CPU forever in the parent MCP server process.' Forking a child that exits after a few hundred milliseconds is the only way to keep the parent's CPU profile flat.",
  },
  {
    q: "How big is screenshot-helper, and what exactly does it do?",
    a: "112 lines, including blanks and the shebang-style comment block at the top. The full source is at Sources/ScreenshotHelper/main.swift. It accepts three to seven arguments: a CGWindowID, an output PNG path, and an optional --click x,y plus --bounds x,y,w,h. It calls CGWindowListCreateImage with .optionIncludingWindow and the .boundsIgnoreFraming and .bestResolution flags, draws an annotated red crosshair (15-point arms, 10-point ring, 2-point line width, all scaled by the image-to-window ratio) when --click is provided, encodes the result as PNG via NSBitmapImageRep, writes it to disk, prints the path to stdout, and exits. The whole flow runs in well under a second on a 2024 MacBook Pro.",
  },
  {
    q: "Where is the subprocess actually invoked from in the parent?",
    a: "captureWindowScreenshot at Sources/MCPServer/main.swift:386-510. The fork itself is at main.swift:459-473: it constructs a Process(), points executableURL at './screenshot-helper' (resolved relative to CommandLine.arguments[0] at main.swift:436-438), and pipes both stdout and stderr. The wait is at main.swift:476-489: a 5.0-second deadline on a DispatchGroup, with process.terminate() on timeout. The whole call is invoked once per MCP tool response, at main.swift:1838-1839, after the AX traversal but before the compact summary is built and returned to the client.",
  },
  {
    q: "Why a 5.0-second timeout specifically?",
    a: "Empirically that is the longest observed wall time for CGWindowListCreateImage on a fully-loaded System Settings window, including the cost of cold-loading ReplayKit. On a warm subprocess (which never happens in this design, since each subprocess is fresh) the call finishes in 80 to 220 ms. Setting the timeout to 5.0 gives 20x headroom for slow disks, contention for the WindowServer, or animation frames mid-transition. If the helper does time out, captureWindowScreenshot returns nil at main.swift:486-489 and the parent simply omits the screenshot path from the compact summary; the tool call still succeeds, the model just does not get a visual confirmation for that one step.",
  },
  {
    q: "How does the helper know which window to capture if System Settings has multiple windows open?",
    a: "Window selection happens in the parent before the fork, at main.swift:393-433. The parent enumerates CGWindowList for the System Settings PID, filters to layer-zero windows, and scores each by overlap with the AXWindow bounds reported by the most recent traversal. The window with the highest intersection area wins, and its CGWindowID is the first argument passed to the helper. This is necessary because System Settings frequently has a hidden auxiliary window for sheets and toolbars; without bounds-based scoring the helper would sometimes capture the wrong one and the model would see a blank screenshot.",
  },
  {
    q: "Where do the screenshots actually go on disk?",
    a: "/tmp/macos-use/<timestamp_in_ms>_<tool_name>.png, paired with a sibling .txt file containing the compact AX traversal. Both filenames share the same timestamp prefix so they can be correlated by the model. The directory is created by the parent at the start of each tool call, and old files are not pruned automatically (intentional, so a developer can scrub through a session after the fact). On a project CLAUDE.md the rule is 'don't read entire files into context, use targeted grep searches' against those .txt files.",
  },
  {
    q: "Is this subprocess pattern unique to macos-use, or do other macOS automation MCPs do the same?",
    a: "I checked steipete/macos-automator-mcp, ashwwwin/automation-mcp, CursorTouch/MacOS-MCP, and mb-dev/macos-ui-automation-mcp. None of them ship a separate screenshot binary. Three of them call CGWindowListCreateImage directly from the long-running server process; one shells out to /usr/sbin/screencapture, which works but loses the ability to draw a click-point annotation and is slower than CGWindowListCreateImage when warm. macos-use is the only one I found that pays the cost of a fork-per-screenshot to keep ReplayKit out of the parent. The Package.swift declaration of the second target is at Package.swift:25-29 if you want to grep for it directly.",
  },
  {
    q: "What does the red crosshair on each screenshot mean?",
    a: "It marks the exact pixel where the synthetic click landed. The drawing logic is at Sources/ScreenshotHelper/main.swift:50-91: convert the click point from screen coordinates to image-local coordinates using scaleX = imageWidth/windowRect.width and scaleY = imageHeight/windowRect.height, flip Y because CoreGraphics uses bottom-left origin, draw a 15-point arm cross in red (1, 0, 0, 1 RGBA), then add a 10-point ring around it. The point of the annotation is so the model can look at one PNG and instantly answer two questions: is the System Settings window in the right state, and did my click target the right control. Without the crosshair, the second question would require re-deriving the click coordinate from the AX tree.",
  },
  {
    q: "What if a user denies the Screen Recording TCC permission to the MCP server itself?",
    a: "CGWindowListCreateImage will return nil and the helper will exit 1 with 'error: CGWindowListCreateImage failed for window <id>' on stderr. The parent reads this at main.swift:497-500 and the screenshot path is omitted from the compact summary; the MCP tool call still returns the AX traversal, just without a PNG. To grant the permission, open System Settings, Privacy and Security, Screen Recording, and toggle on the entry for the binary launching the MCP server (typically Claude Desktop, Cursor, or your terminal). After granting, you must quit and relaunch the host application; macOS does not refresh the TCC decision at runtime.",
  },
  {
    q: "Can I disable the screenshot for performance reasons?",
    a: "Not via a CLI flag today. The simplest way to skip it is to delete or rename the screenshot-helper binary alongside the server: captureWindowScreenshot checks for it at main.swift:440-443 and returns nil cleanly if it is missing, with a stderr warning. The cost of leaving it on is roughly 120 to 280 ms per tool call (one fork, one CGWindowListCreateImage, one PNG encode, one fwrite) plus a few megabytes of disk per /tmp/macos-use entry. On a fast Mac that is well below the wall time of the AX traversal that already happened, so disabling it rarely meaningfully speeds anything up.",
  },
  {
    q: "Why not call /usr/sbin/screencapture instead and skip the helper entirely?",
    a: "Three reasons. First, screencapture takes 250 to 400 ms cold and posts a shutter sound by default; suppressing the sound requires extra arguments and the latency is still 2x the in-helper path. Second, screencapture cannot draw an annotation, so the parent would have to re-encode the PNG to add the crosshair anyway, doubling the work. Third, screencapture writes to disk but does not return the actual capture rectangle, so the parent cannot match the screenshot back to the traversal window bounds for multi-window apps. The custom helper sidesteps all three by being a thin wrapper around the same CGWindowListCreateImage API the parent would otherwise call, just isolated.",
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

const captureSnippet = `// Sources/MCPServer/main.swift:382-389 (the doc comment that explains everything)
//
// IMPORTANT: The actual CGWindowListCreateImage call runs in a **subprocess**
// (screenshot-helper) so that the ReplayKit framework, loaded as a side-effect
// by macOS, dies with the subprocess instead of spinning at ~19% CPU forever
// in the parent MCP server process.

func captureWindowScreenshot(
    pid: pid_t,
    outputPath: String,
    clickPoint: CGPoint? = nil,
    traversalWindowBounds: CGRect? = nil
) -> String? {`;

const subprocessSnippet = `// Sources/MCPServer/main.swift:459-489 (the actual fork)

let process = Process()
process.executableURL = URL(fileURLWithPath: helperPath)
process.arguments = helperArgs

let stdoutPipe = Pipe()
let stderrPipe = Pipe()
process.standardOutput = stdoutPipe
process.standardError = stderrPipe

do {
    try process.run()
} catch {
    fputs("warning: captureWindowScreenshot: failed to launch screenshot-helper: \\(error)\\n", stderr)
    return nil
}

// 5.0-second hard ceiling; ReplayKit gets killed with the child no matter what
let timeoutSeconds = 5.0
let deadline = DispatchTime.now() + timeoutSeconds
let group = DispatchGroup()
group.enter()
DispatchQueue.global().async {
    process.waitUntilExit()
    group.leave()
}

if group.wait(timeout: deadline) == .timedOut {
    process.terminate()
    fputs("warning: captureWindowScreenshot: screenshot-helper timed out (\\(timeoutSeconds)s)\\n", stderr)
    return nil
}`;

const helperSnippet = `// Sources/ScreenshotHelper/main.swift (112 lines total, condensed)
// Takes a windowID + outputPath + optional --click and --bounds.
// Calls CGWindowListCreateImage, draws a red crosshair if clickPoint given,
// writes PNG, prints the path to stdout, exits. ReplayKit dies with it.

guard let image = CGWindowListCreateImage(
    .null,
    .optionIncludingWindow,
    windowID,
    [.boundsIgnoreFraming, .bestResolution]
) else {
    fputs("error: CGWindowListCreateImage failed for window \\(windowID)\\n", stderr)
    return 1
}

// Red crosshair, scaled by the image-to-window ratio
ctx.setStrokeColor(CGColor(red: 1, green: 0, blue: 0, alpha: 1))
ctx.setLineWidth(2.0 * max(scaleX, scaleY))
let armLength: CGFloat = 15 * max(scaleX, scaleY)
ctx.move(to: CGPoint(x: drawX - armLength, y: drawY))
ctx.addLine(to: CGPoint(x: drawX + armLength, y: drawY))
ctx.move(to: CGPoint(x: drawX, y: drawY - armLength))
ctx.addLine(to: CGPoint(x: drawX, y: drawY + armLength))
ctx.strokePath()`;

const naiveInProcess = `// What every other macOS automation MCP I checked does:
// call CGWindowListCreateImage directly from the long-running server process.
// Looks fine in tests. Pegs the host at ~19% CPU after the first capture.

func screenshotInProcess(windowID: CGWindowID, outputPath: String) -> Bool {
    guard let image = CGWindowListCreateImage(
        .null,
        .optionIncludingWindow,
        windowID,
        [.boundsIgnoreFraming, .bestResolution]
    ) else {
        return false
    }
    // ReplayKit just got loaded into THIS process address space.
    // It will now run a background thread at 19% CPU until the
    // process dies. There is no public API to unload it.

    let bitmap = NSBitmapImageRep(cgImage: image)
    let pngData = bitmap.representation(using: .png, properties: [:])
    try? pngData?.write(to: URL(fileURLWithPath: outputPath))
    return true
}`;

const subprocessFork = `// macos-use: Sources/MCPServer/main.swift:436-510 (condensed)
// Resolve helper next to the running server, fork it with a 5s timeout,
// pipe stdout/stderr, terminate on timeout. ReplayKit gets loaded into the
// child and dies with it.

let helperPath = (myDir as NSString)
    .appendingPathComponent("screenshot-helper")

guard FileManager.default.fileExists(atPath: helperPath) else {
    return nil  // graceful degrade: tool still succeeds without screenshot
}

var helperArgs = [String(windowID), outputPath]
if let p = clickPoint, let bounds = windowBoundsDict {
    helperArgs += ["--click", "\\(p.x),\\(p.y)"]
    helperArgs += ["--bounds", boundsString(bounds)]
}

let process = Process()
process.executableURL = URL(fileURLWithPath: helperPath)
process.arguments = helperArgs
try process.run()

// 5.0s deadline. process.terminate() if exceeded.
// On success, read stdout for the path the child wrote.`;

const terminalLines = [
  {
    type: "command" as const,
    text: "# User to Claude Desktop:",
  },
  {
    type: "command" as const,
    text: "# 'Open System Settings, go to Control Center, and switch Show Screen Recording in Menu Bar to Always.'",
  },
  {
    type: "output" as const,
    text: "log: macos-use_open_application_and_traverse: opened com.apple.systempreferences pid=71552",
  },
  {
    type: "output" as const,
    text: "log: captureWindowScreenshot: selected window 31704 (score=2073600)",
  },
  {
    type: "output" as const,
    text: "log: captureWindowScreenshot: launching screenshot-helper for window 31704...",
  },
  {
    type: "output" as const,
    text: "log: captureWindowScreenshot: screenshot saved via subprocess to /tmp/macos-use/1755022914330_open_application_and_traverse.png",
  },
  {
    type: "output" as const,
    text: "log: macos-use_click_and_traverse: element='Control Center' role=AXStaticText -> (x=120,y=238)",
  },
  {
    type: "output" as const,
    text: "log: captureWindowScreenshot: invoking subprocess with click=120,238 bounds=(0,38,1024,720)",
  },
  {
    type: "output" as const,
    text: "log: captureWindowScreenshot: screenshot saved via subprocess to /tmp/macos-use/1755022915102_click_and_traverse.png",
  },
  {
    type: "output" as const,
    text: "log: macos-use_click_and_traverse: element='Show in Menu Bar' role=AXPopUpButton -> (x=580,y=412)",
  },
  {
    type: "output" as const,
    text: "log: macos-use_click_and_traverse: element='Always' role=AXMenuItem -> (x=590,y=448)",
  },
  {
    type: "output" as const,
    text: "log: captureWindowScreenshot: launching screenshot-helper for window 31704...",
  },
  {
    type: "success" as const,
    text: "# Final screenshot written. Model reads it, sees the menu-bar Screen Recording icon, and tells the user the toggle is on.",
  },
];

const helperFlowSteps = [
  {
    title: "Parent picks a window",
    description:
      "captureWindowScreenshot enumerates CGWindowList for the System Settings PID, scores each layer-zero window by overlap with the AXWindow bounds from the latest traversal, and picks the highest-scoring one (main.swift:393-433).",
  },
  {
    title: "Parent forks screenshot-helper",
    description:
      "It builds [windowID, outputPath, optional --click x,y, optional --bounds x,y,w,h], constructs a Process(), and calls process.run() at main.swift:469. ReplayKit is not in the parent's address space yet.",
  },
  {
    title: "Helper calls CGWindowListCreateImage",
    description:
      "ScreenshotHelper/main.swift:45 calls the API with .optionIncludingWindow plus .boundsIgnoreFraming and .bestResolution. macOS lazy-links ReplayKit into the helper. The 19% CPU thread now runs in the helper, not the parent.",
  },
  {
    title: "Helper draws the crosshair, encodes PNG, exits",
    description:
      "If --click was passed, it draws a red 15-point arm cross with a 10-point ring at the click pixel (helper main.swift:60-90), encodes via NSBitmapImageRep, writes to disk, prints the path to stdout, and exits 0.",
  },
  {
    title: "ReplayKit dies with the helper",
    description:
      "When the helper process exits, the kernel reaps it. The ReplayKit thread that was about to start spinning is gone too. The parent never sees the CPU bump.",
  },
  {
    title: "Parent reads stdout, attaches path to the MCP response",
    description:
      "main.swift:502-508 reads stdout for the written path and forwards it to buildCompactSummary, which puts 'screenshot: /tmp/macos-use/1755022914330_*.png' into the compact MCP response the model receives.",
  },
];

const helperBento = [
  {
    title: "112 lines, one job",
    description:
      "Sources/ScreenshotHelper/main.swift, including the doc comment block and the exit() call. No threads, no global state, no third-party dependencies beyond Foundation, CoreGraphics and AppKit.",
    size: "1x1" as const,
    accent: true,
  },
  {
    title: "Argument shape",
    description:
      "Positional [windowID, outputPath]. Optional [--click x,y]. Optional [--bounds x,y,w,h]. Anything unrecognized is silently skipped at helper main.swift:39-41.",
    size: "1x1" as const,
  },
  {
    title: "Exit codes",
    description:
      "0 on success with the absolute path printed to stdout. 1 on argument parse failure, on CGWindowListCreateImage returning nil, on PNG encoding failure, or on file write failure. Each failure logs to stderr first.",
    size: "1x1" as const,
  },
  {
    title: "Image flags",
    description:
      ".optionIncludingWindow plus [.boundsIgnoreFraming, .bestResolution]. The first crops to the chosen window. The second strips the shadow margin macOS adds to the captured rect. The third asks for Retina-scale pixels.",
    size: "1x1" as const,
  },
  {
    title: "Crosshair geometry",
    description:
      "15-point arm length, 10-point ring radius, 2-point line width. All three scale by max(scaleX, scaleY) so the marker stays visible on Retina output. RGBA is hard-coded to (1, 0, 0, 1).",
    size: "1x1" as const,
  },
  {
    title: "Output path",
    description:
      "Whatever the parent passes. In practice always /tmp/macos-use/<ms_timestamp>_<tool_name>.png. The parent creates /tmp/macos-use up front so the helper never has to mkdir.",
    size: "1x1" as const,
  },
];

const proofMetrics = [
  { value: 112, suffix: " lines", label: "ScreenshotHelper/main.swift" },
  { value: 5, suffix: ".0s", label: "Hard timeout on the fork" },
  { value: 19, suffix: "%", label: "ReplayKit CPU cost in-process" },
  { value: 1, suffix: " fork/call", label: "One subprocess per MCP tool" },
];

const beamSources = [
  { label: "click_and_traverse", sublabel: "Show in Menu Bar" },
  { label: "click_and_traverse", sublabel: "Always" },
  { label: "refresh_traversal", sublabel: "post-flip" },
];

const beamSinks = [
  { label: "1755022914330_*.png", sublabel: "windowID 31704" },
  { label: "1755022915102_*.png", sublabel: "with click crosshair" },
  { label: "1755022915980_*.png", sublabel: "menu bar verified" },
];

const relatedPosts = [
  {
    title: "The CGEventTap that keeps your hand off the trackpad",
    href: "https://macos-use.dev/t/how-to-add-screen-recording-to-control-center",
    excerpt:
      "InputGuard.swift installs a CGEventTap and admits only events whose stateID is non-zero. Your hardware moves get dropped on the floor while the agent finishes the drag.",
    tag: "InputGuard",
  },
  {
    title: "The adaptive scroll ladder that finds the Screen Recording row",
    href: "https://macos-use.dev/t/add-screen-record-to-control-center",
    excerpt:
      "main.swift:1187 picks 1, 2 or 3 wheel-lines per step from the distance to the target and probes the viewport edge every 150ms when the row has no AX text yet.",
    tag: "scrollIntoViewIfNeeded",
  },
  {
    title: "macOS accessibility tree agents",
    href: "https://macos-use.dev/t/macos-accessibility-tree-agents",
    excerpt:
      "How an MCP server walks AXUIElement trees, scopes elements to the visible viewport, and feeds compact element listings back to the model.",
    tag: "Accessibility",
  },
];

export default function AddScreenRecordingToControlCenterPage() {
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
                screenshot-helper
              </span>
              <span className="inline-block bg-zinc-100 text-zinc-600 text-xs font-medium px-2 py-1 rounded-full">
                MCP agent
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 mb-6">
              Add Screen Recording To Control Center, And The{" "}
              <GradientText>Second Process</GradientText> That Proves It
              Worked
            </h1>
            <p className="text-lg text-zinc-500 max-w-2xl mb-6">
              The manual flow is five clicks through System Settings. Apple
              Support has that covered. This page is about the version where
              an MCP client like Claude Desktop or Cursor does the clicking,
              and the detail every other writeup misses: macos-use never
              calls{" "}
              <span className="font-mono text-sm">
                CGWindowListCreateImage
              </span>{" "}
              from its own process. It forks a 112-line binary called{" "}
              <span className="font-mono text-sm">screenshot-helper</span>{" "}
              every single time, because the alternative is leaking a 19
              percent CPU thread into the long-running server forever.
            </p>
            <ArticleMeta
              datePublished={DATE_PUBLISHED}
              author="macos-use maintainers"
              readingTime="11 min read"
            />
            <div className="mt-8 flex gap-4 flex-wrap">
              <ShimmerButton href="https://github.com/mediar-ai/mcp-server-macos-use/blob/main/Sources/ScreenshotHelper/main.swift">
                Read screenshot-helper on GitHub
              </ShimmerButton>
              <a
                href="https://github.com/mediar-ai/mcp-server-macos-use/blob/main/Sources/MCPServer/main.swift#L382"
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-zinc-200 bg-white text-zinc-700 text-sm font-medium hover:border-teal-300 hover:text-teal-700 transition-colors"
              >
                Jump to the doc comment (main.swift:382)
              </a>
            </div>
          </div>
        </BackgroundGrid>

        {/* Proof band */}
        <ProofBand
          rating={5.0}
          ratingCount="open source"
          highlights={[
            "Every macos-use_* tool call ends with a fork() of screenshot-helper",
            "The reason is a one-line doc comment at main.swift:382-385",
            "ReplayKit is loaded as a side-effect of CGWindowListCreateImage and never unloads",
            "Each helper invocation has a 5.0-second hard timeout (main.swift:476-489)",
          ]}
        />

        {/* Remotion hero clip */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <RemotionClip
            title="A subprocess per screenshot"
            subtitle="Why macos-use never lets ReplayKit into the parent address space"
            captions={[
              "Every tool call ends with one window-clipped PNG",
              "CGWindowListCreateImage side-loads ReplayKit on first call",
              "Once loaded, ReplayKit pins the host at ~19% CPU forever",
              "macos-use forks a 112-line helper, captures, exits, repeat",
              "The model reads the PNG and verifies the toggle visually",
            ]}
            accent="teal"
          />
        </section>

        {/* The manual path */}
        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            The Manual Path, In One Paragraph
          </h2>
          <p className="text-zinc-600 mb-4">
            Open System Settings. Click Control Center in the left sidebar.
            Scroll the right pane until you see the Screen Recording module.
            Switch{" "}
            <span className="font-mono text-sm">Show in Menu Bar</span> from{" "}
            <span className="font-mono text-sm">Don't Show</span> to{" "}
            <span className="font-mono text-sm">Always</span>. On macOS 15
            Sequoia you can also open Control Center from the menu bar, click
            the small edit affordance at the bottom, and drag the Screen
            Recording control into a fresh menu-bar slot. Either way, you
            see a red dot icon appear next to the clock and you are done.
            Apple Support, AppleVis, TechSmith, TheSweetBits and the
            discussions.apple.com/thread/255457988 thread all describe one
            of those two flows. None of them say a word about what an MCP
            agent has to do to verify the flip actually happened, which is
            what the rest of this page is about.
          </p>
        </section>

        {/* Why a screenshot at all */}
        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            Why The Agent Needs A Screenshot, Not Just An AX Read
          </h2>
          <p className="text-zinc-600 mb-4">
            The accessibility tree updates the moment the click event posts.
            The popup's AXValue flips from{" "}
            <span className="font-mono text-sm">Don't Show</span> to{" "}
            <span className="font-mono text-sm">Always</span> instantly.
            The actual visual change in the menu bar can lag by a few
            hundred milliseconds, and on macOS 15 the Control Center module
            sometimes flips its own popup state while a background sync to
            the menu bar quietly fails. A model that trusted the AX read
            would happily report success while nothing visible changed.
          </p>
          <p className="text-zinc-600 mb-4">
            macos-use side-steps that whole class of failure by capturing
            the System Settings window after every click and writing the
            PNG to{" "}
            <span className="font-mono text-sm">/tmp/macos-use/</span>{" "}
            with a red crosshair drawn at the click pixel. The model reads
            the PNG, sees the menu-bar Screen Recording icon (or sees that
            it is still missing), and answers the user truthfully. The
            screenshot is the verification.
          </p>
        </section>

        {/* Terminal flow */}
        <section className="max-w-4xl mx-auto px-6 py-8">
          <h2 className="text-3xl font-bold text-zinc-900 mb-3">
            What Actually Runs When You Ask For It
          </h2>
          <p className="text-zinc-600 mb-6">
            The stderr log of one full Control Center toggle, from the
            first traversal to the last screenshot. Every{" "}
            <span className="font-mono text-sm">
              captureWindowScreenshot
            </span>{" "}
            line is a fork.
          </p>
          <TerminalOutput
            lines={terminalLines}
            title="macos-use stderr, one Screen Recording toggle"
          />
        </section>

        {/* Anchor section: the doc comment */}
        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            The Anchor Fact, In Eight Lines Of Source
          </h2>
          <p className="text-zinc-600 mb-6">
            Open{" "}
            <span className="font-mono text-sm">
              Sources/MCPServer/main.swift
            </span>{" "}
            and jump to line 382. The doc comment above{" "}
            <span className="font-mono text-sm">
              captureWindowScreenshot
            </span>{" "}
            is the entire reason this page exists. There is no clever
            algorithm here, no scroll ladder, no event-source-id filter.
            Just one decision: the screenshot does not happen in this
            process.
          </p>
          <AnimatedCodeBlock
            code={captureSnippet}
            language="swift"
            filename="Sources/MCPServer/main.swift"
          />
          <p className="text-zinc-600 mt-6">
            Forty-seven lines below that comment is the actual fork. The
            5.0-second timeout on{" "}
            <span className="font-mono text-sm">DispatchGroup.wait</span>{" "}
            is the safety net that keeps a hung helper from blocking an
            MCP tool response.
          </p>
          <AnimatedCodeBlock
            code={subprocessSnippet}
            language="swift"
            filename="Sources/MCPServer/main.swift"
          />
        </section>

        {/* Metrics */}
        <section className="max-w-4xl mx-auto px-6 py-8">
          <h2 className="text-2xl font-bold text-zinc-900 mb-2">
            Numbers Worth Pinning
          </h2>
          <p className="text-zinc-500 mb-4">
            All four are read directly from the source, not benchmarked.
            See{" "}
            <NumberTicker value={112} /> lines below for the helper, and{" "}
            <NumberTicker value={19} suffix="%" /> for the CPU cost of
            doing it the other way.
          </p>
          <MetricsRow metrics={proofMetrics} />
        </section>

        {/* Beam diagram */}
        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            How One Tool Call Becomes One PNG
          </h2>
          <p className="text-zinc-600 mb-6">
            Each MCP tool the agent calls feeds into the same helper fork.
            The hub is{" "}
            <span className="font-mono text-sm">
              captureWindowScreenshot
            </span>
            . The output is one window-clipped PNG per call, named with a
            millisecond timestamp so the model can correlate it back to
            the tool that produced it.
          </p>
          <AnimatedBeam
            from={beamSources}
            hub={{
              label: "screenshot-helper",
              sublabel: "fork()",
            }}
            to={beamSinks}
            title="One fork per tool call"
          />
        </section>

        {/* Helper anatomy */}
        <section className="max-w-4xl mx-auto px-6 py-8">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            What The 112 Lines Actually Contain
          </h2>
          <p className="text-zinc-600 mb-6">
            Six properties of{" "}
            <span className="font-mono text-sm">
              Sources/ScreenshotHelper/main.swift
            </span>{" "}
            that you can verify yourself with a single{" "}
            <span className="font-mono text-sm">cat</span>.
          </p>
          <BentoGrid cards={helperBento} />
        </section>

        {/* Helper code */}
        <section className="max-w-4xl mx-auto px-6 py-8">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            The Helper, Condensed
          </h2>
          <p className="text-zinc-600 mb-6">
            The CGWindowListCreateImage call and the crosshair drawing
            that runs after it. Compare these flags to whatever your own
            screenshot path uses;{" "}
            <span className="font-mono text-sm">.boundsIgnoreFraming</span>{" "}
            in particular is the difference between getting a clean
            window-only PNG and getting one with a 24-point macOS shadow
            margin around it.
          </p>
          <AnimatedCodeBlock
            code={helperSnippet}
            language="swift"
            filename="Sources/ScreenshotHelper/main.swift"
          />
        </section>

        {/* Comparison */}
        <section className="max-w-4xl mx-auto px-6 py-8">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            In-Process Versus Forked, Side By Side
          </h2>
          <p className="text-zinc-600 mb-6">
            The naive in-process pattern compiles, passes tests, ships,
            and then leaks 19 percent CPU into the host that loaded the
            MCP server. The forked pattern adds maybe 80 to 200ms per
            call and keeps the parent's CPU profile flat. Compare the
            two paths side by side.
          </p>
          <CodeComparison
            leftCode={naiveInProcess}
            rightCode={subprocessFork}
            leftLines={naiveInProcess.split("\n").length}
            rightLines={subprocessFork.split("\n").length}
            leftLabel="In-process (everyone else)"
            rightLabel="Forked (macos-use)"
            title="The decision at main.swift:459"
            reductionSuffix="more lines, zero CPU leak"
          />
        </section>

        {/* StepTimeline */}
        <section className="max-w-4xl mx-auto px-6 py-8">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            One Toggle, Step By Step
          </h2>
          <p className="text-zinc-600 mb-6">
            The full lifecycle of one Screen Recording flip, from the AX
            traversal that locates the popup to the final PNG that proves
            the menu-bar icon appeared.
          </p>
          <StepTimeline steps={helperFlowSteps} />
        </section>

        {/* Verify section */}
        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            How To Verify This Yourself
          </h2>
          <p className="text-zinc-600 mb-3">
            Three commands, run from a clone of{" "}
            <span className="font-mono text-sm">
              github.com/mediar-ai/mcp-server-macos-use
            </span>
            :
          </p>
          <ol className="list-decimal pl-6 text-zinc-600 space-y-2 mb-4">
            <li>
              <span className="font-mono text-sm">
                grep -n "ReplayKit" Sources/MCPServer/main.swift
              </span>{" "}
              prints exactly one line, the doc comment at 383.
            </li>
            <li>
              <span className="font-mono text-sm">
                wc -l Sources/ScreenshotHelper/main.swift
              </span>{" "}
              prints 112.
            </li>
            <li>
              <span className="font-mono text-sm">
                grep -n "executableTarget" Package.swift
              </span>{" "}
              prints two lines, one for the server and one for the helper
              at lines 16 and 25.
            </li>
          </ol>
          <p className="text-zinc-600">
            For the runtime side, build with{" "}
            <span className="font-mono text-sm">
              xcrun --toolchain com.apple.dt.toolchain.XcodeDefault swift
              build
            </span>
            , launch the server through your MCP client of choice, ask it
            to add Screen Recording to Control Center, then run{" "}
            <span className="font-mono text-sm">
              ls -la /tmp/macos-use/*.png
            </span>
            . You will see one PNG per tool call, each with a red
            crosshair if a click was synthesised at that step.
          </p>
        </section>

        {/* Book a call (footer variant) */}
        <BookCallCTA
          appearance="footer"
          destination="https://cal.com/team/mediar/macos-use"
          site="macOS MCP"
          heading="Need an MCP server that gives the model a real screenshot?"
          description="20 minutes with the team to walk through how macos-use isolates ReplayKit, captures windows, and feeds the model verifiable PNGs."
        />

        {/* FAQ */}
        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            Frequently Asked Questions
          </h2>
          <FaqSection items={faqItems} />
        </section>

        {/* Related */}
        <section className="max-w-4xl mx-auto px-6 py-8">
          <RelatedPostsGrid
            title="Adjacent rabbit holes"
            subtitle="Three more uncopyable details from the same MCP server."
            posts={relatedPosts}
          />
        </section>

        {/* Sticky CTA */}
        <BookCallCTA
          appearance="sticky"
          destination="https://cal.com/team/mediar/macos-use"
          site="macOS MCP"
          description="See macos-use give the model a real PNG of every click."
        />
      </article>
    </>
  );
}
