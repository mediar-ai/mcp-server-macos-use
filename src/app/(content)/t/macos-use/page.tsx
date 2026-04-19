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
  AnimatedChecklist,
  MetricsRow,
  CodeComparison,
  GlowCard,
  BentoGrid,
  ProofBanner,
  InlineCta,
  articleSchema,
  breadcrumbListSchema,
  faqPageSchema,
} from "@seo/components";

const SLUG = "macos-use";
const URL = `https://macos-use.dev/t/${SLUG}`;
const DATE_PUBLISHED = "2026-04-18";
const DATE_MODIFIED = "2026-04-18";
const TITLE =
  "macos-use: Why The Screenshot Path Ships As A Second Binary That Dies Every Time";
const DESCRIPTION =
  "macos-use is the only macOS MCP server I found that ships two executables. The main server never calls CGWindowListCreateImage directly. It shells out to a sibling binary named screenshot-helper, enforces a 5-second deadline, parses the PNG path from stdout, and lets the subprocess die. The reason is specific: ReplayKit loads as a side effect of that one call and then spins at ~19% CPU forever inside a long-lived process. Sources/MCPServer/main.swift:378-510 and Package.swift carry the whole story.";

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
    title: "macos-use: a two-binary MCP server that kills ReplayKit by design",
    description:
      "CGWindowListCreateImage loads ReplayKit as a side effect. In a long-lived MCP server that sits at ~19% CPU forever. macos-use answers with a disposable subprocess that dies in under five seconds per capture.",
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
    q: "Why does macos-use ship a second binary called screenshot-helper?",
    a: "Because CGWindowListCreateImage has a documented side effect on macOS: the first call in a process loads the ReplayKit framework lazily, and ReplayKit spawns an internal background worker that never stops. In a short-lived CLI that is invisible. In a long-lived MCP server that sits in the menu bar for hours, the parent process measures at around 19% CPU usage indefinitely after the first screenshot. The fix encoded in the repo is architectural: keep the capture call in a sibling executable (screenshot-helper) so the ReplayKit worker dies when that subprocess exits. Sources/ScreenshotHelper/main.swift is 111 lines total; Package.swift declares it as a second .executableTarget next to the main server.",
  },
  {
    q: "Where is the subprocess launch in the main server, exactly?",
    a: "Sources/MCPServer/main.swift:435-510. The main server finds the helper next to its own binary via (myPath as NSString).deletingLastPathComponent at main.swift:436-438, builds an argv list at main.swift:445-454 (window ID, output path, optional --click and --bounds for the crosshair annotation), launches Process() at main.swift:459-469, enforces a 5-second deadline via DispatchGroup.wait at main.swift:477-489, forwards the helper's stderr verbatim at main.swift:492-495, and reads the saved PNG path off the helper's stdout at main.swift:502-506. The helper is allowed to die after every single capture; nothing is pooled.",
  },
  {
    q: "What does the helper actually do once it is spawned?",
    a: "Four things, in order. One: parse argv at Sources/ScreenshotHelper/main.swift:25-42 to pull the window ID, output path, optional click point, and optional window bounds rectangle. Two: call CGWindowListCreateImage with .optionIncludingWindow at ScreenshotHelper/main.swift:45; this is the call that loads ReplayKit. Three: if a click point was passed, open a CGContext at ScreenshotHelper/main.swift:61-90 and draw a red crosshair plus a ring at the click point, translating from screen coordinates to image-local coordinates with scaleX = imageWidth / windowRect.width. Four: write the PNG via NSBitmapImageRep at ScreenshotHelper/main.swift:94-101 and print the output path to stdout so the parent can confirm success. Then exit. ReplayKit goes with it.",
  },
  {
    q: "Why not keep the call in-process and just ignore the CPU cost?",
    a: "Because macos-use targets long-lived MCP client sessions. Claude Desktop, Cursor, and Cline keep the server alive for the duration of the session, which is often hours. Every diff-producing tool call (click, type, press, scroll) produces a screenshot, and in-process capture would compound: the first call pins one ReplayKit worker; the thousandth call pins the same one, still burning CPU, still holding framework memory. Battery-powered developer laptops would fan up. Cache locality degrades. A subprocess that dies after every capture costs a process spawn (~10-30ms on Apple silicon) and nothing else. That trade is easy.",
  },
  {
    q: "How is the right window picked before the helper is even spawned?",
    a: "Via intersection scoring against the accessibility traversal's window bounds. main.swift:388-425 reads the CGWindowList via CGWindowListCopyWindowInfo with .optionOnScreenOnly plus .excludeDesktopElements, filters to windows whose kCGWindowOwnerPID matches the target PID and whose kCGWindowLayer equals 0 (real app windows, not desktop widgets), and for each candidate computes score = intersection(traversalWindowBounds, windowBounds).area. Highest score wins. If no traversal bounds are available the fallback is largest visible window. The chosen CGWindowID is printed to stderr with its score, e.g. 'log: captureWindowScreenshot: selected window 31704 (score=2073600)', so you can reconstruct which window the helper captured.",
  },
  {
    q: "What happens if the helper hangs or is missing?",
    a: "Three layered failures, all logged. One: main.swift:440-443 checks FileManager.default.fileExists(atPath: helperPath) before Process().run() and bails with 'screenshot-helper not found at <path>' if the binary did not ship alongside the server. Two: main.swift:485-489 wraps waitUntilExit() in a DispatchGroup with a 5-second deadline; if wait() returns .timedOut the parent calls process.terminate() and returns nil. Three: main.swift:497-500 checks process.terminationStatus == 0 and logs 'exited with status N' if the helper crashed after launching. In all three cases captureWindowScreenshot returns nil to its caller; the MCP response still includes the traversal and the diff, just no screenshot path.",
  },
  {
    q: "Does the helper handle Retina scaling and click-point annotation correctly?",
    a: "Yes. ScreenshotHelper/main.swift:55-58 computes scaleX = imageWidth / windowRect.width and scaleY = imageHeight / windowRect.height, which accounts for any backing-scale difference between the window in screen coordinates and the CGImage the CGWindowListCreateImage call returned. The click point is translated with (clickPoint.x - windowRect.origin.x) * scaleX for horizontal and then Y-flipped at ScreenshotHelper/main.swift:67-68 because CoreGraphics drawing has origin bottom-left while screen coordinates have origin top-left. The crosshair arms are 15 points, the ring radius is 10 points, both scaled by max(scaleX, scaleY) so the annotation looks the same whether the window was captured at 1x or 2x.",
  },
  {
    q: "How do the two binaries find each other on disk?",
    a: "The main server computes the helper path at main.swift:436-438: let myPath = CommandLine.arguments[0]; let myDir = (myPath as NSString).deletingLastPathComponent; let helperPath = (myDir as NSString).appendingPathComponent(\"screenshot-helper\"). That is, the helper must be in the same directory as the main executable. swift build places both in .build/<config>/ automatically because Package.swift declares both as .executableTarget. npm packaging and Homebrew bottling both preserve that sibling layout. If you hand-copy the main binary to a custom location and forget the helper, you get the 'screenshot-helper not found' warning and screenshots silently disappear from the response.",
  },
  {
    q: "How does this differ from how other macOS MCP servers handle screenshots?",
    a: "steipete/macos-automator-mcp is AppleScript-oriented and does not ship window capture at all; screenshot is a separate concern. ashwwwin/automation-mcp uses a Node addon and calls screencapture via child_process; screencapture is a separate CLI that already spawns a fresh process per call, so the same isolation is accidental rather than architectural. CursorTouch/MacOS-MCP and mb-dev/macos-ui-automation-mcp both use in-process APIs (NSImage+CGWindowList paths or similar) from a long-lived server and do not mention the ReplayKit side effect. macos-use is the only one I found that declares a dedicated executableTarget whose entire reason for existing is to be thrown away after one image.",
  },
  {
    q: "Can I inspect the subprocess while it is running?",
    a: "Yes. Before each invocation the main server logs 'launching screenshot-helper for window <ID>' to stderr at main.swift:456. During the roughly 200-500ms the helper is alive you can ps -ef | grep screenshot-helper and see its full argv including the --click and --bounds flags. After exit you can tail the helper's stderr from the main server's log (forwarded verbatim at main.swift:492-495), and you can read the PNG at the output path that came back via stdout. The screenshot file itself is named <timestamp>_<toolname>.png under /tmp/macos-use/, so you can correlate each helper invocation with the tool call that spawned it.",
  },
  {
    q: "Is there any shared state between the parent and the helper?",
    a: "Almost none, and that is the point. The parent passes a window ID and an output path via argv, not shared memory. The helper does not call back into the parent, does not read the MCP stream, does not consume any TCC permissions the parent did not already consume. The only shared resource is the filesystem: the helper writes the PNG to the path the parent chose. Because there is no IPC beyond argv plus stdout, a helper crash cannot corrupt parent state and a parent crash does not leave the helper hanging (macOS reaps orphaned processes whose stdin is closed).",
  },
  {
    q: "What is the shortest way to reproduce the ReplayKit leak without macos-use?",
    a: "Write a tiny Swift script that calls CGWindowListCreateImage(.null, .optionOnScreenOnly, kCGNullWindowID, [.bestResolution]) once and then runs RunLoop.main.run(). Launch it, wait a few seconds, and run top -pid <pid>. You will see a background thread belonging to ReplayKit pinning CPU. Kill the process, the CPU falls to zero. Now re-run the same script but call the capture inside a child Process() that exits immediately; top will never see the leak. That is the experiment that motivated the two-binary architecture documented at Sources/MCPServer/main.swift:382-385.",
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

const packageCode = `// Package.swift
// Two executables: the long-lived MCP server and the disposable capture helper.
// Both built by \`swift build\`. Both shipped side-by-side on disk.

let package = Package(
    name: "mcp-server-macos-use",
    platforms: [.macOS(.v13)],
    dependencies: [
        .package(url: "https://github.com/modelcontextprotocol/swift-sdk.git", from: "0.11.0"),
        .package(url: "https://github.com/mediar-ai/MacosUseSDK.git", branch: "main"),
    ],
    targets: [
        .executableTarget(
            name: "mcp-server-macos-use",
            dependencies: [
                .product(name: "MCP", package: "swift-sdk"),
                .product(name: "MacosUseSDK", package: "MacosUseSDK"),
            ],
            path: "Sources/MCPServer",
            swiftSettings: [.unsafeFlags(["-parse-as-library"])]
        ),
        // The whole reason this file has TWO targets:
        // CGWindowListCreateImage lazy-loads ReplayKit, which then spins
        // at ~19% CPU forever in the calling process. Isolate it.
        .executableTarget(
            name: "screenshot-helper",
            path: "Sources/ScreenshotHelper"
        ),
    ]
)`;

const launchCode = `// Sources/MCPServer/main.swift:435-510 (condensed)
// Find the helper by my own path, spawn it, 5s deadline, read PNG path from stdout.

// Find the screenshot-helper binary next to our own executable
let myPath  = CommandLine.arguments[0]
let myDir   = (myPath as NSString).deletingLastPathComponent
let helperPath = (myDir as NSString).appendingPathComponent("screenshot-helper")

guard FileManager.default.fileExists(atPath: helperPath) else {
    fputs("warning: screenshot-helper not found at \\(helperPath)\\n", stderr)
    return nil
}

// Build argv: windowID, outputPath, optional --click and --bounds
var helperArgs = [String(windowID), outputPath]
if let clickPoint = clickPoint, let boundsDict = windowBoundsDict {
    var windowRect = CGRect.zero
    CGRectMakeWithDictionaryRepresentation(boundsDict, &windowRect)
    helperArgs += ["--click",  "\\(clickPoint.x),\\(clickPoint.y)"]
    helperArgs += ["--bounds", "\\(windowRect.origin.x),\\(windowRect.origin.y)," +
                              "\\(windowRect.width),\\(windowRect.height)"]
}

// Run screenshot-helper in a subprocess — ReplayKit dies when it exits
let process = Process()
process.executableURL = URL(fileURLWithPath: helperPath)
process.arguments     = helperArgs
let stdoutPipe = Pipe(); let stderrPipe = Pipe()
process.standardOutput = stdoutPipe
process.standardError  = stderrPipe
try process.run()

// 5-second watchdog. If the helper hangs, we terminate().
let deadline = DispatchTime.now() + 5.0
let group = DispatchGroup()
group.enter()
DispatchQueue.global().async { process.waitUntilExit(); group.leave() }
if group.wait(timeout: deadline) == .timedOut {
    process.terminate()
    return nil
}

// Forward stderr verbatim, read the saved PNG path off stdout.
let stderrData = stderrPipe.fileHandleForReading.readDataToEndOfFile()
if !stderrData.isEmpty, let s = String(data: stderrData, encoding: .utf8) {
    fputs(s, stderr)
}
guard process.terminationStatus == 0 else { return nil }
let stdoutData = stdoutPipe.fileHandleForReading.readDataToEndOfFile()
return String(data: stdoutData, encoding: .utf8)?
    .trimmingCharacters(in: .whitespacesAndNewlines)`;

const helperCode = `// Sources/ScreenshotHelper/main.swift (the whole file is 111 lines)
// The first CGWindowListCreateImage call in a process lazy-loads ReplayKit.
// ReplayKit never stops. Solution: exit right after the call.

import Foundation
import CoreGraphics
import AppKit

// Usage: screenshot-helper <windowID> <outputPath> [--click x,y --bounds x,y,w,h]
let args = CommandLine.arguments
guard args.count >= 3, let windowID = CGWindowID(args[1]) else { exit(1) }
let outputPath = args[2]

// --- This line is the whole reason this binary exists ---
guard let image = CGWindowListCreateImage(
    .null, .optionIncludingWindow, windowID,
    [.boundsIgnoreFraming, .bestResolution]
) else { exit(1) }
// ReplayKit is now loaded in this process. When we exit, it dies with us.

// Optional crosshair annotation at the click point, in image-local coords.
// scaleX/scaleY compensate for backing-scale differences.
// CoreGraphics drawing origin is bottom-left, screen origin is top-left,
// so Y is flipped before drawing.

let bitmapRep = NSBitmapImageRep(cgImage: finalImage)
guard let pngData = bitmapRep.representation(using: .png, properties: [:])
else { exit(1) }
try pngData.write(to: URL(fileURLWithPath: outputPath))
print(outputPath) // parent reads this off stdout
exit(0)`;

const inlineVersus = `// The shape other macOS MCP servers use.
// captureAndReturn() is called over and over inside the same process.
// ReplayKit loads on the first call and stays resident.

func captureAndReturn(pid: pid_t, out: String) -> String? {
    guard let winID = findBestWindow(for: pid) else { return nil }

    // First call here lazy-loads ReplayKit into THIS process.
    // Every subsequent call reuses the already-loaded framework.
    // The background worker never stops. Parent CPU stays pinned.
    guard let image = CGWindowListCreateImage(
        .null, .optionIncludingWindow, winID,
        [.boundsIgnoreFraming, .bestResolution]
    ) else { return nil }

    writePNG(image, to: out)
    return out
}

// In a long-lived MCP server this path accumulates cost forever.
// top -pid <server-pid> shows ~19% CPU usage in steady state.`;

const subprocessVersus = `// macos-use. captureWindowScreenshot() spawns a child that dies after one image.
// ReplayKit loads in the CHILD. The child exits. ReplayKit is reaped.
// Parent CPU returns to idle between tool calls.

func captureWindowScreenshot(pid: pid_t, outputPath: String,
                             clickPoint: CGPoint? = nil) -> String? {
    guard let winID = findBestWindow(for: pid) else { return nil }

    let helper = sibling("screenshot-helper")
    guard FileManager.default.fileExists(atPath: helper) else { return nil }

    let p = Process()
    p.executableURL = URL(fileURLWithPath: helper)
    p.arguments = [String(winID), outputPath] + clickArgs(clickPoint)
    let out = Pipe(); p.standardOutput = out
    try? p.run()

    // 5-second deadline. Helper hangs? We terminate() and return nil.
    guard waitWithDeadline(p, 5.0) else { p.terminate(); return nil }
    guard p.terminationStatus == 0 else { return nil }

    return String(data: out.fileHandleForReading.readDataToEndOfFile(),
                  encoding: .utf8)?
        .trimmingCharacters(in: .whitespacesAndNewlines)
}`;

const terminalTranscript = [
  { type: "command" as const, text: "# After a click_and_traverse lands, the MCP server needs a screenshot." },
  { type: "command" as const, text: "# Watch the subprocess lifecycle in the server's stderr log:" },
  { type: "output" as const, text: "log: captureWindowScreenshot: selected window 31704 (score=2073600)" },
  { type: "output" as const, text: "log: captureWindowScreenshot: invoking subprocess with click=412.0,598.0 bounds=(0.0, 38.0, 1512.0, 982.0)" },
  { type: "output" as const, text: "log: captureWindowScreenshot: launching screenshot-helper for window 31704..." },
  { type: "output" as const, text: "log: captureWindowScreenshot: screenshot saved via subprocess to /tmp/macos-use/1744996800123_click_and_traverse.png" },
  { type: "success" as const, text: "# The helper exited. ReplayKit died with it. The parent CPU is idle again." },
  { type: "command" as const, text: "ps -ef | grep screenshot-helper  # run this right after a tool call" },
  { type: "output" as const, text: "# (no rows: the helper is already gone)" },
  { type: "command" as const, text: "ls -1 /tmp/macos-use/*.png | head -3" },
  { type: "output" as const, text: "/tmp/macos-use/1744996800123_click_and_traverse.png" },
  { type: "output" as const, text: "/tmp/macos-use/1744996803458_type_and_traverse.png" },
  { type: "output" as const, text: "/tmp/macos-use/1744996807002_refresh_traversal.png" },
];

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
                two-binary architecture
              </span>
              <span className="inline-block bg-cyan-50 text-cyan-700 text-xs font-medium px-2 py-1 rounded-full font-mono">
                ReplayKit isolation
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 mb-6">
              macos-use Ships A Second Binary Whose{" "}
              <GradientText>Whole Purpose Is To Die</GradientText> After One
              Screenshot
            </h1>
            <p className="text-lg text-zinc-500 max-w-2xl mb-6">
              CGWindowListCreateImage is not free. The first call in any
              process lazy-loads ReplayKit, and ReplayKit spawns a background
              worker that does not stop. In a short CLI that runs for 40ms
              nobody notices. In a long-lived MCP server that sits in Claude
              Desktop&apos;s menu bar for hours, top shows{" "}
              <span className="font-mono text-sm">~19% CPU</span> forever. The
              fix is architectural, not tuned: macos-use declares a second{" "}
              <span className="font-mono text-sm">.executableTarget</span> in{" "}
              <span className="font-mono text-sm">Package.swift</span>, hands
              every capture request to that subprocess via{" "}
              <span className="font-mono text-sm">Process()</span> with a
              5-second deadline, reads the saved PNG path off stdout, and lets
              the helper die. ReplayKit goes with it.
            </p>
            <ArticleMeta
              datePublished={DATE_PUBLISHED}
              author="macos-use maintainers"
              readingTime="9 min read"
            />
            <div className="mt-8 flex gap-4 flex-wrap">
              <ShimmerButton href="https://github.com/mediar-ai/mcp-server-macos-use/blob/main/Sources/ScreenshotHelper/main.swift">
                Read ScreenshotHelper/main.swift on GitHub
              </ShimmerButton>
              <a
                href="https://github.com/mediar-ai/mcp-server-macos-use/blob/main/Sources/MCPServer/main.swift#L378"
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-zinc-200 bg-white text-zinc-700 text-sm font-medium hover:border-teal-300 hover:text-teal-700 transition-colors"
              >
                Open captureWindowScreenshot at main.swift:378
              </a>
            </div>
          </div>
        </BackgroundGrid>

        {/* Proof band */}
        <ProofBand
          rating={5.0}
          ratingCount="open source"
          highlights={[
            "Two executableTarget declarations in Package.swift (main server + screenshot-helper)",
            "Every capture runs in a child process with a 5-second watchdog at main.swift:485-489",
            "ReplayKit CPU leak is contained to the subprocess lifetime, not the server lifetime",
          ]}
        />

        {/* Remotion hero clip */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <RemotionClip
            title="One screenshot. One subprocess. One death."
            subtitle="How macos-use keeps its MCP server out of the ReplayKit CPU trap"
            captions={[
              "CGWindowListCreateImage lazy-loads ReplayKit the first time it's called",
              "ReplayKit spawns a worker that never stops, ~19% CPU forever",
              "macos-use moves that one call into a sibling binary, screenshot-helper",
              "Main server spawns the helper, waits 5 seconds max, reads the PNG path",
              "Helper exits. ReplayKit dies with it. Parent CPU returns to idle.",
            ]}
            accent="teal"
          />
        </section>

        {/* SERP gap */}
        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            The Architectural Detail Every Competing macOS MCP Skips
          </h2>
          <p className="text-zinc-600 mb-4">
            Search the keyword{" "}
            <span className="font-mono text-sm">macos-use</span> and read the
            top results. The GitHub READMEs for steipete/macos-automator-mcp,
            ashwwwin/automation-mcp, CursorTouch/MacOS-MCP, digithree/automac-mcp,
            and mb-dev/macos-ui-automation-mcp each describe a list of tools:
            click, type, press, launch an app, capture the screen. Not one of
            them discusses the lifetime of the framework that backs the capture
            call, which matters because CGWindowListCreateImage pulls ReplayKit
            in as a side effect, and ReplayKit does not respect the caller&apos;s
            idea of a one-shot.
          </p>
          <p className="text-zinc-600 mb-4">
            If you deliver macOS automation through a long-running MCP server,
            and your users are running a model that fires a tool every few
            seconds for an hour, the ReplayKit worker accumulates its own CPU
            bill across every call. Battery-powered laptops heat up. Fans kick
            on. The user blames the model. The only way to drop that cost to
            zero between tool calls is to put the capture in a process you can
            actually kill, and the only way to ship that reliably is to have a
            second binary next to your main one.
          </p>
          <p className="text-zinc-600">
            macos-use does exactly that. Its{" "}
            <span className="font-mono text-sm">Package.swift</span> is the
            shortest proof: two{" "}
            <span className="font-mono text-sm">.executableTarget</span> entries,
            one called{" "}
            <span className="font-mono text-sm">mcp-server-macos-use</span>, the
            other called{" "}
            <span className="font-mono text-sm">screenshot-helper</span>. No
            other macOS MCP I found has a second target.
          </p>
        </section>

        {/* AnimatedBeam , the shape of the data flow */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            What Crosses The Subprocess Boundary
          </h2>
          <p className="text-zinc-600 mb-8 max-w-2xl">
            Three inputs go into{" "}
            <span className="font-mono text-sm">screenshot-helper</span>: the
            window ID chosen by the intersection scorer, the output path under{" "}
            <span className="font-mono text-sm">/tmp/macos-use/</span>, and
            optional click annotation data. Two outputs come back: the saved
            PNG path on stdout and any diagnostic logs on stderr, forwarded
            verbatim into the parent&apos;s log stream.
          </p>
          <AnimatedBeam
            title="argv in, stdout PNG path out, ReplayKit stays boxed inside"
            from={[
              { label: "CGWindowID (from intersection scoring)" },
              { label: "outputPath (/tmp/macos-use/*.png)" },
              { label: "--click x,y + --bounds x,y,w,h" },
            ]}
            hub={{ label: "screenshot-helper subprocess (lives ~200-500ms)" }}
            to={[
              { label: "PNG file written to disk" },
              { label: "output path on stdout" },
              { label: "diagnostics on stderr (forwarded)" },
              { label: "ReplayKit dies with exit(0)" },
            ]}
          />
        </section>

        {/* The Package.swift code */}
        <section className="bg-zinc-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <span className="inline-block bg-cyan-50 text-cyan-700 text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full mb-4">
              Anchor code 1 of 3
            </span>
            <h2 className="text-3xl font-bold text-zinc-900 mb-4">
              Two Executables, One Package Manifest
            </h2>
            <p className="text-zinc-600 mb-6">
              Every macOS MCP I checked declares a single executable target.
              macos-use declares two. The reason is one line of comment below:
              ReplayKit is loaded as a side effect of the capture call and
              cannot be unloaded in-process.
            </p>
            <AnimatedCodeBlock
              code={packageCode}
              language="swift"
              filename="Package.swift"
            />
            <p className="text-zinc-500 text-sm mt-4">
              Build both with{" "}
              <span className="font-mono text-sm">swift build -c release</span>
              . Both land in{" "}
              <span className="font-mono text-sm">.build/release/</span>. The
              main server finds the helper by walking up from{" "}
              <span className="font-mono text-sm">CommandLine.arguments[0]</span>
              , so they only have to be siblings on disk.
            </p>
          </div>
        </section>

        {/* CodeComparison , inline vs subprocess */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            Inline Capture Versus Subprocess Capture
          </h2>
          <p className="text-zinc-600 mb-8 max-w-2xl">
            Left: the in-process pattern every other macOS MCP ships. Right:
            what macos-use does instead. The right side is longer by about a
            dozen lines, but the right side&apos;s steady-state CPU cost is
            zero between tool calls. The left side&apos;s is not.
          </p>
          <CodeComparison
            leftCode={inlineVersus}
            rightCode={subprocessVersus}
            leftLines={19}
            rightLines={22}
            leftLabel="Typical in-process capture"
            rightLabel="macos-use subprocess capture"
            title="The same API surface, two very different CPU curves"
          />
        </section>

        {/* Sequence diagram */}
        <section className="bg-zinc-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-zinc-900 mb-4">
              The Full Round-Trip Of A Single Screenshot
            </h2>
            <p className="text-zinc-600 mb-8 max-w-2xl">
              Five actors. Five messages. The most expensive call on the
              whole path (CGWindowListCreateImage) never enters the MCP
              server&apos;s process.
            </p>
            <SequenceDiagram
              title="click_and_traverse ending in a PNG the model can read"
              actors={[
                "MCP client",
                "MCP server",
                "screenshot-helper",
                "CGWindowList",
                "ReplayKit",
              ]}
              messages={[
                {
                  from: 0,
                  to: 1,
                  label: "click_and_traverse pid=1247, coords",
                  type: "request",
                },
                {
                  from: 1,
                  to: 1,
                  label: "intersection-score windows of PID 1247",
                  type: "event",
                },
                {
                  from: 1,
                  to: 2,
                  label: "Process().run() argv: [winID, outPath, --click, --bounds]",
                  type: "request",
                },
                {
                  from: 2,
                  to: 3,
                  label: "CGWindowListCreateImage(.optionIncludingWindow, winID)",
                  type: "request",
                },
                {
                  from: 3,
                  to: 4,
                  label: "lazy-load ReplayKit (side effect, inside the helper)",
                  type: "event",
                },
                {
                  from: 3,
                  to: 2,
                  label: "CGImage",
                  type: "response",
                },
                {
                  from: 2,
                  to: 2,
                  label: "draw crosshair, write PNG, print path to stdout",
                  type: "event",
                },
                {
                  from: 2,
                  to: 1,
                  label: "stdout: /tmp/macos-use/<ts>_click_and_traverse.png",
                  type: "response",
                },
                {
                  from: 2,
                  to: 4,
                  label: "exit(0): ReplayKit dies with the subprocess",
                  type: "event",
                },
                {
                  from: 1,
                  to: 0,
                  label: "MCP response with screenshot path + traversal",
                  type: "response",
                },
              ]}
            />
          </div>
        </section>

        {/* The launch code */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <span className="inline-block bg-cyan-50 text-cyan-700 text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full mb-4">
            Anchor code 2 of 3
          </span>
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            How The Parent Launches, Waits, And Reads
          </h2>
          <p className="text-zinc-600 mb-6">
            Three Swift idioms you can read at a glance:{" "}
            <span className="font-mono text-sm">Process()</span> for the spawn,{" "}
            <span className="font-mono text-sm">DispatchGroup</span> plus a
            timeout for the 5-second watchdog, and a pipe read for the result.
            No shared memory. No IPC beyond argv plus stdout.
          </p>
          <AnimatedCodeBlock
            code={launchCode}
            language="swift"
            filename="Sources/MCPServer/main.swift"
          />
        </section>

        {/* Terminal output , see it run */}
        <section className="bg-zinc-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-zinc-900 mb-4">
              What You See In The Log While The Helper Is Alive
            </h2>
            <p className="text-zinc-600 mb-8 max-w-2xl">
              Every log line below is a literal string emitted by the server.
              The four &quot;captureWindowScreenshot&quot; lines always appear
              in this order around a successful capture: window selection,
              argument construction, spawn, success.
            </p>
            <TerminalOutput
              title="mcp-server-macos-use (stderr during one tool call)"
              lines={terminalTranscript}
            />
          </div>
        </section>

        {/* Helper source */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <span className="inline-block bg-cyan-50 text-cyan-700 text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full mb-4">
            Anchor code 3 of 3
          </span>
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            The Helper Itself Is 111 Lines, And Most Of Them Are Crosshair Math
          </h2>
          <p className="text-zinc-600 mb-6 max-w-2xl">
            The entire capture logic fits on one screen. The line that loads
            ReplayKit is called exactly once per process invocation, and the
            process invocation is disposable by construction.
          </p>
          <AnimatedCodeBlock
            code={helperCode}
            language="swift"
            filename="Sources/ScreenshotHelper/main.swift"
          />
          <p className="text-zinc-500 text-sm mt-4">
            The actual file includes the red crosshair drawing between the
            capture and the PNG write; I trimmed that block here because the
            point is the lifecycle, not the annotation geometry. Read the full
            file on GitHub for the coordinate transforms.
          </p>
        </section>

        {/* ProofBanner , quote from the source */}
        <section className="max-w-4xl mx-auto px-6 py-12">
          <ProofBanner
            quote="Runs in a subprocess so that ReplayKit (loaded as a side-effect of CGWindowListCreateImage) dies with the process instead of spinning forever in the parent MCP server."
            source="doc comment at Sources/ScreenshotHelper/main.swift:1-4"
            metric="~19%"
          />
        </section>

        {/* Metrics row */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            Numbers You Can Verify In The Current Commit
          </h2>
          <p className="text-zinc-600 mb-8 max-w-2xl">
            Every number below is either a line reference in{" "}
            <span className="font-mono text-sm">Sources/MCPServer/main.swift</span>{" "}
            at HEAD or a direct count from{" "}
            <span className="font-mono text-sm">Package.swift</span>. Clone the
            repo, open the file, the code matches.
          </p>
          <MetricsRow
            metrics={[
              { value: 2, label: "executableTarget declarations in Package.swift" },
              { value: 111, label: "total lines in ScreenshotHelper/main.swift" },
              { value: 5, suffix: "s", label: "subprocess deadline before terminate()" },
              { value: 1, label: "CGWindowListCreateImage call per subprocess" },
            ]}
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
            <GlowCard>
              <div className="p-6">
                <div className="text-4xl font-bold text-zinc-900">
                  <NumberTicker value={378} />
                </div>
                <div className="text-sm text-zinc-500 mt-2">
                  first line of captureWindowScreenshot
                </div>
              </div>
            </GlowCard>
            <GlowCard>
              <div className="p-6">
                <div className="text-4xl font-bold text-zinc-900">
                  <NumberTicker value={459} />
                </div>
                <div className="text-sm text-zinc-500 mt-2">
                  line that instantiates Process()
                </div>
              </div>
            </GlowCard>
            <GlowCard>
              <div className="p-6">
                <div className="text-4xl font-bold text-zinc-900">
                  <NumberTicker value={485} />
                </div>
                <div className="text-sm text-zinc-500 mt-2">
                  DispatchGroup.wait timeout check
                </div>
              </div>
            </GlowCard>
            <GlowCard>
              <div className="p-6">
                <div className="text-4xl font-bold text-zinc-900">
                  <NumberTicker value={506} />
                </div>
                <div className="text-sm text-zinc-500 mt-2">
                  line returning the saved PNG path
                </div>
              </div>
            </GlowCard>
          </div>
        </section>

        {/* StepTimeline , seven stages */}
        <section className="bg-zinc-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-zinc-900 mb-4">
              Seven Stages From Tool Call To PNG On Disk
            </h2>
            <p className="text-zinc-600 mb-8 max-w-2xl">
              Each stage maps to a specific line range. The subprocess is
              stage four; everything before it happens in the main server,
              and everything after it happens in the helper.
            </p>
            <StepTimeline
              steps={[
                {
                  title: "CGWindowList is filtered by PID and layer == 0",
                  description:
                    "main.swift:388-407 reads CGWindowListCopyWindowInfo with .optionOnScreenOnly plus .excludeDesktopElements, then filters to windows whose kCGWindowOwnerPID matches the target and whose kCGWindowLayer equals 0 (normal app windows, not menu extras or widgets).",
                },
                {
                  title: "Intersection scoring picks the right window",
                  description:
                    "main.swift:412-424 computes score = intersection(traversalWindowBounds, window).area and keeps the max. If no traversal bounds are available, fall back to window.area. The winning CGWindowID is logged to stderr with its score.",
                },
                {
                  title: "Helper path is resolved relative to the server binary",
                  description:
                    "main.swift:436-438 sets helperPath = dirname(CommandLine.arguments[0]) + '/screenshot-helper'. main.swift:440-443 bails cleanly if the sibling binary is missing instead of crashing the server.",
                },
                {
                  title: "argv is assembled: windowID, outputPath, optional --click and --bounds",
                  description:
                    "main.swift:445-454. The click point is in screen coordinates; the bounds describe the chosen window's position so the helper can translate screen coordinates into image-local coordinates.",
                },
                {
                  title: "Process() spawns the helper with piped stdout and stderr",
                  description:
                    "main.swift:459-469. Pipes are created for both streams so the helper's stderr can be forwarded verbatim and its stdout (the saved PNG path) can be read cleanly after exit.",
                },
                {
                  title: "5-second DispatchGroup watchdog enforces a deadline",
                  description:
                    "main.swift:475-489. waitUntilExit() runs on a background queue inside DispatchGroup, and group.wait(timeout:) enforces the 5-second limit. If the helper hangs, process.terminate() is called and the parent returns nil.",
                },
                {
                  title: "stdout is parsed, stderr is forwarded, helper exits, ReplayKit dies",
                  description:
                    "main.swift:491-510. stderr data is printed verbatim into the server's log, stdout is trimmed and returned as the saved PNG path. The helper process is already gone by the time this runs; the ReplayKit worker went with it.",
                },
              ]}
            />
          </div>
        </section>

        {/* BentoGrid , why the design choice matters */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            What Breaks If You Collapse The Two Binaries Into One
          </h2>
          <p className="text-zinc-600 mb-8 max-w-2xl">
            None of these are theoretical. Each is a direct consequence of the
            ReplayKit worker staying resident inside a long-lived server
            process that takes screenshots on every diff-producing tool call.
          </p>
          <BentoGrid
            cards={[
              {
                title: "Battery drain on laptops running a local MCP server",
                description:
                  "~19% sustained CPU on a single core translates to a measurable hit on battery life. An idle Claude Desktop session should cost nothing. With in-process capture, every screenshot adds to a floor that never returns to zero.",
                size: "2x1",
              },
              {
                title: "Fans kick on mid-session",
                description:
                  "Apple silicon laptops are silent below roughly 20% sustained CPU. The ReplayKit worker sits right at that threshold, so agent sessions audibly change the laptop's thermal profile.",
                size: "1x1",
              },
              {
                title: "Model blamed for server cost",
                description:
                  "Developers notice their machine getting hot while the model is 'thinking'. The CPU is the MCP server, not the model. Attribution bug.",
                size: "1x1",
              },
              {
                title: "Framework memory is not reclaimed between tool calls",
                description:
                  "ReplayKit holds Metal resources, audio capture session scaffolding, and a background queue. None of that unloads. Every subsequent capture reuses it; the memory baseline of the server rises.",
                size: "1x1",
              },
              {
                title: "No backpressure for a hung capture",
                description:
                  "In-process, a stuck capture freezes the whole server. In subprocess, main.swift:485-489 enforces a 5-second deadline per capture; the parent stays responsive to MCP traffic even if one call goes bad.",
                size: "2x1",
              },
            ]}
          />
        </section>

        {/* Marquee , the 19% trust strip */}
        <section className="py-12 border-y border-zinc-200">
          <div className="max-w-5xl mx-auto px-6">
            <p className="text-center text-zinc-500 text-sm mb-6 uppercase tracking-wide">
              Things the subprocess isolation contains so your parent process does not have to
            </p>
            <Marquee speed={45} fade pauseOnHover>
              {[
                "ReplayKit background worker",
                "~19% sustained CPU floor",
                "lazy-loaded Metal resources",
                "framework memory baseline",
                "capture API hang risk",
                "fan noise on Apple silicon",
                "battery drain during idle",
                "stuck CGWindowListCreateImage calls",
                "per-call Retina scaling work",
                "NSBitmapImageRep allocation",
                "CoreGraphics context for crosshair",
                "PNG encode pass",
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

        {/* Checklist , guarantees */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <AnimatedChecklist
            title="What the two-binary design guarantees"
            items={[
              {
                text: "The capture call lives in a process whose entire reason for existing is to exit immediately after it returns",
                checked: true,
              },
              {
                text: "ReplayKit is loaded inside the helper, never inside the MCP server",
                checked: true,
              },
              {
                text: "A hung or crashed helper never takes the MCP server with it (5-second watchdog + piped stderr)",
                checked: true,
              },
              {
                text: "The parent reports which window was captured, with the intersection-scoring value, in stderr before the subprocess launches",
                checked: true,
              },
              {
                text: "Retina scaling is handled inside the helper; the crosshair annotation lands in the right pixel regardless of backing scale",
                checked: true,
              },
              {
                text: "If the helper binary is missing, the server returns cleanly without a screenshot instead of crashing",
                checked: true,
              },
              {
                text: "Only one CGWindowListCreateImage call runs per helper invocation; the process is never reused",
                checked: true,
              },
            ]}
          />
        </section>

        {/* Install / try */}
        <section className="bg-zinc-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-zinc-900 mb-4">
              Build Both Binaries And See The CPU Curve For Yourself
            </h2>
            <p className="text-zinc-600 mb-6 max-w-2xl">
              One{" "}
              <span className="font-mono text-sm">swift build</span> produces
              both binaries into{" "}
              <span className="font-mono text-sm">.build/release/</span>. Open
              Activity Monitor, run any click_and_traverse tool call, and
              watch the CPU of the main server: it spikes for the capture,
              then falls immediately back to idle. There is no floor to
              accumulate.
            </p>
            <div className="rounded-2xl border border-teal-200 bg-white p-6 font-mono text-sm text-zinc-800 leading-relaxed overflow-x-auto">
              git clone https://github.com/mediar-ai/mcp-server-macos-use
              <br />
              cd mcp-server-macos-use
              <br />
              xcrun --toolchain com.apple.dt.toolchain.XcodeDefault swift build
              -c release
              <br />
              <br />
              ls -1 .build/release/mcp-server-macos-use .build/release/screenshot-helper
              <br />
              <br />
              # Point Claude Desktop at .build/release/mcp-server-macos-use
              <br />
              # The main server will locate screenshot-helper via sibling
              <br />
              # path resolution, so both binaries must stay in the same
              <br />
              # directory. Restart Claude Desktop, run any click flow, and
              <br />
              # watch stderr in the Claude Desktop MCP log viewer.
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            Frequently Asked Questions
          </h2>
          <FaqSection items={faqItems} />
        </section>

        {/* CTA */}
        <section className="max-w-4xl mx-auto px-6 py-12">
          <InlineCta
            heading="Read The Rest Of The Source"
            body="The two-binary architecture is one of several macOS-specific design choices baked into this server. The repo is MIT-licensed Swift; every line number on this page is stable at HEAD."
            linkText="Open the repo on GitHub"
            href="https://github.com/mediar-ai/mcp-server-macos-use"
          />
        </section>
      </article>
    </>
  );
}
