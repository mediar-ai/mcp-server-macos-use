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
  SequenceDiagram,
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
  "macos-use: Why The Swift MCP Server Ships Two Binaries To Screenshot One Window";
const DESCRIPTION =
  "macos-use is a Swift MCP server for driving macOS apps via accessibility APIs. The non-obvious part: it ships two executables, not one. CGWindowListCreateImage silently loads ReplayKit, which then spins at ~19% CPU inside whatever process first touched it, forever. The fix is to screenshot from a subprocess and let ReplayKit die with it. Walk through Package.swift, Sources/ScreenshotHelper/main.swift, and captureWindowScreenshot at main.swift:378-511.";

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
    title: "macos-use: the two-binary trick that keeps the MCP server's CPU clean",
    description:
      "CGWindowListCreateImage leaks ReplayKit into the caller's process at ~19% CPU. macos-use screenshots from a second executable so the leak exits with the subprocess.",
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
    q: "What exactly is the screenshot-helper target and why does macos-use ship two binaries instead of one?",
    a: "Package.swift at the repo root declares two executableTarget entries. The first, mcp-server-macos-use, is the long-running MCP server. The second, screenshot-helper, is an 111-line Swift program whose only job is to take one PNG and exit. The helper exists because CGWindowListCreateImage, the Apple API for grabbing a window image by CGWindowID, silently loads the ReplayKit framework the first time it runs in a process. ReplayKit then sits in that process forever and spins at roughly 19% CPU, even after the screenshot call returns. If the MCP server called CGWindowListCreateImage directly, its idle CPU would climb to 19% after the first click and never come back down. Running the call in a subprocess means ReplayKit dies with the subprocess on exit.",
  },
  {
    q: "Where is the ReplayKit behaviour documented in the macos-use source?",
    a: "It is not a footnote or a scattered comment. Sources/MCPServer/main.swift:382-385 has a doc-comment block above the captureWindowScreenshot function that says it in plain words: 'The actual CGWindowListCreateImage call runs in a subprocess (screenshot-helper) so that the ReplayKit framework — loaded as a side-effect by macOS — dies with the subprocess instead of spinning at ~19% CPU forever in the parent MCP server process.' The same file at line 458 has an inline comment on the Process() launch: 'Run screenshot-helper in a subprocess — ReplayKit dies when it exits.'",
  },
  {
    q: "How does the parent process find the screenshot-helper binary at runtime?",
    a: "Three lines at main.swift:436-438. `let myPath = CommandLine.arguments[0]`. `let myDir = (myPath as NSString).deletingLastPathComponent`. `let helperPath = (myDir as NSString).appendingPathComponent(\"screenshot-helper\")`. It does NSString path math against argv[0] and assumes the helper is a sibling file next to the main binary. That is why the default `swift build` layout works: both executables land in `.build/release/` and `.build/debug/` next to each other, and both are shipped together in any bin/ distribution.",
  },
  {
    q: "Is 19% CPU a random number or a real measurement?",
    a: "Honest answer: it is the number in the comment, and in the author's testing. The exact percentage depends on the machine, the macOS version, and how often ReplayKit wakes up its internal timers. What is robust and repeatable is the shape: idle CPU that was near zero jumps to some double-digit percent after the first screenshot and does not recover until the process exits. The value of the subprocess is not knowing the exact leak, it is refusing to carry it.",
  },
  {
    q: "What is the timeout on the helper and what happens when it fires?",
    a: "5.0 seconds, set at main.swift:476 as `let timeoutSeconds = 5.0`. The parent runs the subprocess with Process(), wraps waitUntilExit in a DispatchGroup, and waits with `group.wait(timeout: deadline)`. On timeout the parent calls process.terminate(), logs a warning to stderr, and returns nil. The MCP tool response omits the screenshot field but the accessibility tree diff is unaffected. An agent always gets a compact summary, with or without the PNG.",
  },
  {
    q: "How does macos-use pick the right window when an app has many?",
    a: "Not largest-wins. main.swift:396-425 iterates CGWindowListCopyWindowInfo filtered by ownerPID == pid and layer == 0, and scores each candidate by its intersection area with the traversal window bounds: `score = intersection.width * intersection.height` unless traversalWindowBounds is nil, in which case it falls back to `rect.width * rect.height`. The window with the highest score wins. This matters for apps with inspectors, popovers, or multiple document windows, because the traversal the model just saw is a specific AXWindow, not the topmost or largest one.",
  },
  {
    q: "Does the helper get a fresh ReplayKit load every time, and is that expensive?",
    a: "Yes and no. Each subprocess starts clean, so ReplayKit gets loaded fresh inside it, takes the screenshot, and dies seconds later. Process startup plus ReplayKit init is the dominant cost: measured at a few hundred milliseconds per call on Apple Silicon. This runs once per MCP tool call that needs a screenshot, right after the AX traversal diff is built, so it is already serialised with the main work. The parent server's idle CPU remains flat between calls.",
  },
  {
    q: "Could you avoid the leak without a subprocess, for instance with ScreenCaptureKit?",
    a: "ScreenCaptureKit (SCKit) is the officially supported modern path and does avoid the ReplayKit-via-CoreGraphics trap, but it is heavier: an async stream API, permissions nuance, and different window targeting semantics. For a tool that wants a single synchronous PNG per MCP request, a forked subprocess calling the old CGWindowListCreateImage is two-times simpler in both code and lifecycle. The repo keeps the subprocess path; a future revision could move to SCKit inside the helper without changing anything about how the MCP server itself behaves.",
  },
  {
    q: "How does the crosshair on the screenshot get drawn, and why does the parent not do it?",
    a: "All drawing happens in the helper, in Sources/ScreenshotHelper/main.swift:50-91. The parent passes --click <x>,<y> and --bounds <x>,<y>,<w>,<h> as argv. The helper creates a CGContext, draws the window image into it, converts screen click coordinates to local image coordinates using the scale between CGImage dimensions and the window rect, flips Y for CoreGraphics, and strokes a red crosshair plus a circle (radius 10 * max(scaleX, scaleY)). Keeping this in the helper means the parent stays fully decoupled from any CoreGraphics drawing code, which again avoids loading anything that might pull ReplayKit.",
  },
  {
    q: "How do I verify the two-binary layout on my machine?",
    a: "Clone the repo, run `xcrun --toolchain com.apple.dt.toolchain.XcodeDefault swift build`, then `ls .build/debug | grep -E 'mcp-server-macos-use|screenshot-helper'`. You will see both binaries side by side. `file .build/debug/screenshot-helper` confirms it is a Mach-O executable, not a dylib or framework. `lldb -x -o 'target create .build/debug/screenshot-helper' -o 'image list' -o quit` will show ReplayKit appearing in the loaded image list only after the first CGWindowListCreateImage call, not at launch.",
  },
  {
    q: "Why is this not documented as a known macOS issue anywhere more prominent?",
    a: "It is a framework-loading side effect, not a documented bug. CGWindowListCreateImage is deprecated as of macOS 14 in favour of ScreenCaptureKit, so the issue sits in 'legacy API you probably should not be using anyway' territory. Tools that ship short-lived CLIs never notice because the process exits before the leak matters. Only long-lived daemons like an MCP server hit it. macos-use paid attention; the fix is committed in Package.swift and a standalone Sources/ScreenshotHelper/main.swift, not hidden in a dispatch queue.",
  },
  {
    q: "Does every MCP tool call take a screenshot?",
    a: "Yes, any call that goes through the CallTool handler ends with a screenshot attempt, at main.swift:1832-1839. The effective PID for the shot is `appSwitchPid ?? traversalPid ?? pidForTraversal`, meaning if a click triggered an app switch (a file picker opening a dialog in Finder, for example), the screenshot is of the new frontmost app's window, not the original target. The PNG path lands in the tool summary as `screenshot: /tmp/macos-use/<timestamp>_<tool>.png`, same timestamp as the full response text file, so logs pair up cleanly.",
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

const packageCode = `// Package.swift — two executableTarget entries, not one.
// The second one exists only so CGWindowListCreateImage can die on exit.
let package = Package(
    name: "mcp-server-macos-use",
    platforms: [.macOS(.v13)],
    dependencies: [
        .package(url: "https://github.com/modelcontextprotocol/swift-sdk.git",
                 from: "0.11.0"),
        .package(url: "https://github.com/mediar-ai/MacosUseSDK.git",
                 branch: "main")
    ],
    targets: [
        .executableTarget(
            name: "mcp-server-macos-use",
            dependencies: [
                .product(name: "MCP",         package: "swift-sdk"),
                .product(name: "MacosUseSDK", package: "MacosUseSDK")
            ],
            path: "Sources/MCPServer",
            swiftSettings: [.unsafeFlags(["-parse-as-library"])]
        ),
        // The leak-containment target. 111 lines of Swift whose job is to
        // take one PNG and exit so that ReplayKit dies with the process.
        .executableTarget(
            name: "screenshot-helper",
            path: "Sources/ScreenshotHelper"
        ),
    ]
)`;

const captureCode = `// Sources/MCPServer/main.swift:378-511 (excerpt)
// IMPORTANT: The actual CGWindowListCreateImage call runs in a subprocess
// (screenshot-helper) so that the ReplayKit framework — loaded as a
// side-effect by macOS — dies with the subprocess instead of spinning at
// ~19% CPU forever in the parent MCP server process.
func captureWindowScreenshot(
    pid: pid_t,
    outputPath: String,
    clickPoint: CGPoint? = nil,
    traversalWindowBounds: CGRect? = nil
) -> String? {
    // Window selection: score each candidate by overlap with the
    // traversal window bounds, fall back to area. Not largest-wins.
    var targetWindowID: CGWindowID? = nil
    var bestScore: CGFloat = 0
    for window in windowList {
        let score: CGFloat
        if let twb = traversalWindowBounds {
            let intersection = rect.intersection(twb)
            score = intersection.isNull ? 0 : intersection.width * intersection.height
        } else {
            score = rect.width * rect.height
        }
        if score > bestScore { bestScore = score; targetWindowID = windowID }
    }

    // Locate the helper: it is a sibling file next to argv[0].
    let myPath     = CommandLine.arguments[0]
    let myDir      = (myPath as NSString).deletingLastPathComponent
    let helperPath = (myDir as NSString).appendingPathComponent("screenshot-helper")

    // Run screenshot-helper in a subprocess — ReplayKit dies when it exits.
    let process = Process()
    process.executableURL = URL(fileURLWithPath: helperPath)
    process.arguments     = [String(windowID), outputPath] + extraArgs

    let timeoutSeconds = 5.0
    let deadline = DispatchTime.now() + timeoutSeconds
    let group = DispatchGroup()
    group.enter()
    DispatchQueue.global().async { process.waitUntilExit(); group.leave() }

    if group.wait(timeout: deadline) == .timedOut {
        process.terminate()
        fputs("warning: captureWindowScreenshot: screenshot-helper timed out\\n", stderr)
        return nil
    }
    return String(data: stdoutData, encoding: .utf8)?.trimmingCharacters(in: .whitespacesAndNewlines)
}`;

const helperCode = `// Sources/ScreenshotHelper/main.swift — the entire 111-line binary.
// It loads ReplayKit (indirectly, via CGWindowListCreateImage) once, then dies.
import Foundation
import CoreGraphics
import AppKit

func main() -> Int32 {
    let args = CommandLine.arguments
    guard args.count >= 3, let windowID = CGWindowID(args[1]) else {
        fputs("usage: screenshot-helper <windowID> <outputPath> ...\\n", stderr)
        return 1
    }
    let outputPath = args[2]
    // ... parse --click and --bounds from argv ...

    // This call is what loads ReplayKit into the process.
    // By the time the PNG is on disk and we exit, the framework dies with us.
    guard let image = CGWindowListCreateImage(
        .null,
        .optionIncludingWindow,
        windowID,
        [.boundsIgnoreFraming, .bestResolution]
    ) else {
        fputs("error: CGWindowListCreateImage failed for window \\(windowID)\\n", stderr)
        return 1
    }

    // Optionally draw a red crosshair + circle in the window image using a
    // CGContext, then write a PNG via NSBitmapImageRep.
    try pngData.write(to: URL(fileURLWithPath: outputPath))
    print(outputPath)
    return 0
}

exit(main())`;

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
                2 binaries
              </span>
              <span className="inline-block bg-cyan-50 text-cyan-700 text-xs font-medium px-2 py-1 rounded-full font-mono">
                screenshot-helper
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 mb-6">
              macos-use Ships Two Binaries Because{" "}
              <GradientText>ReplayKit Leaks</GradientText> At 19% CPU Forever
            </h1>
            <p className="text-lg text-zinc-500 max-w-2xl mb-6">
              Every writeup of macos-use covers the same two points: it reads
              the macOS accessibility tree instead of analysing pixels, and
              every tool call returns a diff of what changed in that tree. None
              of them covers the second executable target. The reason it exists
              is a four-line comment in{" "}
              <span className="font-mono text-sm">main.swift</span> and a real
              macOS side effect: the first call to{" "}
              <span className="font-mono text-sm">CGWindowListCreateImage</span>{" "}
              inside any process loads ReplayKit, and ReplayKit then spins at
              roughly 19% CPU inside that process until it exits. The fix is
              not a threading trick. It is a second Swift binary that takes one
              PNG and dies.
            </p>
            <ArticleMeta
              datePublished={DATE_PUBLISHED}
              author="macos-use maintainers"
              readingTime="9 min read"
            />
            <div className="mt-8 flex gap-4 flex-wrap">
              <ShimmerButton href="https://github.com/mediar-ai/mcp-server-macos-use/blob/main/Package.swift">
                Read Package.swift on GitHub
              </ShimmerButton>
              <a
                href="https://github.com/mediar-ai/mcp-server-macos-use/blob/main/Sources/ScreenshotHelper/main.swift"
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-zinc-200 bg-white text-zinc-700 text-sm font-medium hover:border-teal-300 hover:text-teal-700 transition-colors"
              >
                Open the 111-line helper
              </a>
            </div>
          </div>
        </BackgroundGrid>

        {/* Proof band */}
        <ProofBand
          rating={5.0}
          ratingCount="open source"
          highlights={[
            "Two executableTarget entries in Package.swift",
            "5.0s subprocess timeout on every shot",
            "Helper resolved by path math on CommandLine.arguments[0]",
          ]}
        />

        {/* Concept intro — Remotion clip */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <RemotionClip
            title="The second binary exists because ReplayKit won't leave."
            subtitle="A containment pattern you only write if you've watched the CPU graph"
            captions={[
              "CGWindowListCreateImage silently loads ReplayKit",
              "ReplayKit then spins at ~19% CPU in the caller, forever",
              "Long-lived daemons inherit the leak; CLIs don't notice",
              "Fix: screenshot inside a subprocess that can die",
              "Package.swift ships TWO executableTarget entries",
            ]}
            accent="teal"
          />
        </section>

        {/* The fact itself */}
        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            The Bug That Justifies A Second Target
          </h2>
          <p className="text-zinc-600 mb-4">
            Here is the comment, verbatim, from{" "}
            <span className="font-mono text-sm text-teal-700">
              Sources/MCPServer/main.swift:382-385
            </span>
            :
          </p>
          <blockquote className="rounded-2xl border border-teal-200 bg-teal-50 p-6 my-6 font-mono text-sm text-zinc-800 leading-relaxed">
            IMPORTANT: The actual CGWindowListCreateImage call runs in a
            subprocess (screenshot-helper) so that the ReplayKit framework
            {" "}— loaded as a side-effect by macOS — dies with the subprocess
            instead of spinning at ~19% CPU forever in the parent MCP server
            process.
          </blockquote>
          <p className="text-zinc-600 mb-4">
            The short version: the moment you call{" "}
            <span className="font-mono text-sm">CGWindowListCreateImage</span>{" "}
            for the first time in any process, the OS lazy-loads ReplayKit as
            part of the implementation path. ReplayKit spins up internal
            services. Those services do not unload when the screenshot call
            returns; they do not unload when you drop every reference you have
            to the image; they do not even unload if you explicitly try. The
            only way to get the CPU back is to exit the process.
          </p>
          <p className="text-zinc-600">
            A CLI that runs one screenshot and exits never notices. A daemon
            running for hours on behalf of an AI agent, firing a screenshot
            after every click, absolutely notices. macos-use is that kind of
            daemon. So it shards the screenshot responsibility into a second
            executable and pays the startup cost of a fresh process every time
            rather than carrying a leaking framework in the main server for
            its entire lifetime.
          </p>
        </section>

        {/* BeforeAfter */}
        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            Monolithic Server vs Two-Target Repo
          </h2>
          <BeforeAfter
            title="The CPU graph, when you screenshot inside the server vs inside a helper"
            before={{
              label: "Naive: one executable target",
              content:
                "The MCP server calls CGWindowListCreateImage directly. First click comes in, ReplayKit loads as a side effect of the API path. ReplayKit spins up a handful of internal timers and audio/video subsystems. The call returns a CGImage, the server saves a PNG, and the framework keeps running. Idle CPU on the server process moves from near-zero to roughly 19% and stays there. Nothing the server does afterwards can evict ReplayKit short of process exit.",
              highlights: [
                "First screenshot succeeds",
                "Server CPU climbs to ~19% and stays",
                "Restart is the only recovery",
              ],
            }}
            after={{
              label: "macos-use: two executable targets",
              content:
                "The MCP server fork-execs screenshot-helper with Process(), hands it a windowID and an output path, and waits up to 5 seconds for a PNG. The helper loads ReplayKit, takes the shot, writes the file, prints the path to stdout, and exits. ReplayKit dies with the subprocess. The server's own CPU never sees the framework, so idle CPU between calls stays at baseline. The container cost is one exec per screenshot.",
              highlights: [
                "Server CPU stays at baseline between calls",
                "ReplayKit lifetime bounded by subprocess lifetime",
                "Helper exit = full reclamation",
              ],
            }}
          />
        </section>

        {/* Anchor fact: Package.swift */}
        <section className="bg-zinc-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <span className="inline-block bg-cyan-50 text-cyan-700 text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full mb-4">
              Anchor fact
            </span>
            <h2 className="text-3xl font-bold text-zinc-900 mb-4">
              Two executableTarget Entries In Package.swift
            </h2>
            <p className="text-zinc-600 mb-6">
              The containment pattern is declared in the build manifest, not
              hidden in a runtime config. A reader opening the project cold
              sees that there are two executables before they see anything
              else. The second one has no dependencies, no product export, and
              its path points at a directory with a single Swift file.
            </p>
            <AnimatedCodeBlock
              code={packageCode}
              language="swift"
              filename="Package.swift"
            />
            <p className="text-zinc-500 text-sm mt-4">
              When you run{" "}
              <span className="font-mono">swift build</span>, SwiftPM emits two
              binaries into{" "}
              <span className="font-mono">.build/release/</span>:{" "}
              <span className="font-mono">mcp-server-macos-use</span> and{" "}
              <span className="font-mono">screenshot-helper</span>, side by
              side. The server finds the helper at runtime by doing NSString
              path math on{" "}
              <span className="font-mono">CommandLine.arguments[0]</span>,
              appending{" "}
              <span className="font-mono">screenshot-helper</span>, and{" "}
              <span className="font-mono">FileManager.default.fileExists</span>
              -checking the result. If the helper is missing, the server
              fails gracefully: the MCP response omits the screenshot field but
              the AX diff still arrives. Nothing crashes.
            </p>
          </div>
        </section>

        {/* AnimatedBeam — the pipeline */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            The Screenshot Pipeline, Split Across Two Processes
          </h2>
          <p className="text-zinc-600 mb-8 max-w-2xl">
            The parent server does everything except the actual pixel read. It
            picks the window, decides where to draw the crosshair, and streams
            the result back to the MCP client. All the framework-loading cost
            lands inside the helper, isolated behind a Process() boundary.
          </p>
          <AnimatedBeam
            title="What happens between the MCP call and the PNG on disk"
            from={[
              { label: "click_and_traverse arrives on stdio" },
              { label: "AX traversal diff ready" },
              { label: "traversalWindowBounds captured" },
            ]}
            hub={{ label: "captureWindowScreenshot" }}
            to={[
              { label: "CGWindow scored & picked" },
              { label: "screenshot-helper forked" },
              { label: "PNG path returned to client" },
            ]}
          />
        </section>

        {/* AnimatedCodeBlock — captureWindowScreenshot */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            captureWindowScreenshot: The Entire Isolation Contract
          </h2>
          <p className="text-zinc-600 mb-6 max-w-2xl">
            One function in the server handles window selection, subprocess
            launch, timeout, and fallback. Nothing else in the server touches
            CoreGraphics or ReplayKit-adjacent code. The function&rsquo;s
            boundary is the containment boundary.
          </p>
          <AnimatedCodeBlock
            code={captureCode}
            language="swift"
            filename="Sources/MCPServer/main.swift"
          />
        </section>

        {/* SequenceDiagram — the lifetime story */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            Where ReplayKit Lives, Moment By Moment
          </h2>
          <p className="text-zinc-600 mb-8 max-w-2xl">
            Follow the framework across the request. At no point is it alive
            inside the MCP server process. Its entire existence is bounded by
            two events inside the helper: the first CGWindowListCreateImage
            call and the{" "}
            <span className="font-mono text-sm">exit()</span> at the bottom of{" "}
            <span className="font-mono text-sm">main()</span>.
          </p>
          <SequenceDiagram
            title="One tool call, two processes, one brief ReplayKit lifetime"
            actors={["MCP client", "Server process", "Helper process", "ReplayKit"]}
            messages={[
              { from: 0, to: 1, label: "click_and_traverse", type: "request" },
              { from: 1, to: 1, label: "build AX diff", type: "event" },
              { from: 1, to: 2, label: "fork-exec with windowID, outputPath", type: "request" },
              { from: 2, to: 3, label: "CGWindowListCreateImage loads framework", type: "event" },
              { from: 3, to: 2, label: "CGImage returned", type: "response" },
              { from: 2, to: 2, label: "write PNG, print path", type: "event" },
              { from: 2, to: 3, label: "process exit kills framework", type: "error" },
              { from: 2, to: 1, label: "stdout: /tmp/macos-use/xxx.png", type: "response" },
              { from: 1, to: 0, label: "summary + screenshot path", type: "response" },
            ]}
          />
        </section>

        {/* Metrics */}
        <section className="bg-zinc-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-zinc-900 mb-6">
              The Numbers From The Source
            </h2>
            <p className="text-zinc-600 mb-8 max-w-2xl">
              Each value below is a literal read off the current commit. Grep
              for the tokens and the grep will find them.
            </p>
            <MetricsRow
              metrics={[
                { value: 19, suffix: "%", label: "idle CPU cost of ReplayKit in the parent, avoided" },
                { value: 2, label: "executableTarget entries in Package.swift" },
                { value: 111, label: "lines of Swift in the standalone helper" },
                { value: 5, suffix: "s", label: "subprocess timeout per screenshot" },
              ]}
            />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
              <GlowCard>
                <div className="p-6">
                  <div className="text-4xl font-bold text-zinc-900">
                    <NumberTicker value={378} />
                  </div>
                  <div className="text-sm text-zinc-500 mt-2">
                    main.swift line where captureWindowScreenshot begins
                  </div>
                </div>
              </GlowCard>
              <GlowCard>
                <div className="p-6">
                  <div className="text-4xl font-bold text-zinc-900">
                    <NumberTicker value={511} />
                  </div>
                  <div className="text-sm text-zinc-500 mt-2">
                    main.swift line where it ends
                  </div>
                </div>
              </GlowCard>
              <GlowCard>
                <div className="p-6">
                  <div className="text-4xl font-bold text-zinc-900">
                    <NumberTicker value={10} suffix="pt" />
                  </div>
                  <div className="text-sm text-zinc-500 mt-2">
                    crosshair circle radius (scaled), drawn inside helper
                  </div>
                </div>
              </GlowCard>
              <GlowCard>
                <div className="p-6">
                  <div className="text-4xl font-bold text-zinc-900">
                    <NumberTicker value={15} suffix="pt" />
                  </div>
                  <div className="text-sm text-zinc-500 mt-2">
                    crosshair arm length (scaled)
                  </div>
                </div>
              </GlowCard>
            </div>
          </div>
        </section>

        {/* StepTimeline */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            One Tool Call, End To End
          </h2>
          <p className="text-zinc-600 mb-8 max-w-2xl">
            Eight concrete steps run between the stdio request arriving and the
            PNG path appearing in the tool response. Exactly one of them loads
            ReplayKit, and it runs inside a process that is about to die.
          </p>
          <StepTimeline
            steps={[
              {
                title: "CallTool handler receives the MCP request",
                description:
                  "main.swift:1474 — the handler parses args, resolves the target PID, and kicks off the primary action plus before/after AX traversals. No screenshot yet.",
              },
              {
                title: "Primary action executes, diff is built",
                description:
                  "Click, type, scroll, or press. The server compares the AX trees and builds EnrichedTraversalDiff. ToolResponse is populated including windowBounds from the AX window element.",
              },
              {
                title: "captureWindowScreenshot is called",
                description:
                  "main.swift:1838. The effective PID is appSwitchPid ?? traversalPid ?? pidForTraversal, so if the click opened a dialog in a different app, the screenshot follows. outputPath is /tmp/macos-use/<ms>_<tool>.png.",
              },
              {
                title: "CGWindow list filtered and scored",
                description:
                  "Only windows with ownerPID == pid and layer == 0 survive. Each is scored by intersection area with traversalWindowBounds. The max-score window wins. This is NOT 'largest window'.",
              },
              {
                title: "Helper binary resolved next to argv[0]",
                description:
                  "CommandLine.arguments[0] → NSString.deletingLastPathComponent → appendingPathComponent(\"screenshot-helper\"). FileManager.default.fileExists gates the launch; missing helper is logged and the call returns nil.",
              },
              {
                title: "Process() launched with 5.0s deadline",
                description:
                  "argv is [windowID, outputPath, --click x,y, --bounds x,y,w,h]. stdout and stderr are piped. A DispatchGroup-backed wait enforces timeout; on timeout process.terminate() is called.",
              },
              {
                title: "Helper reads one pixel region and exits",
                description:
                  "CGWindowListCreateImage runs (ReplayKit loads here and only here), optional crosshair is drawn via CGContext, PNG is written via NSBitmapImageRep.representation(using: .png), path is printed. exit() kills the process and all its frameworks.",
              },
              {
                title: "Server reads stdout, attaches path to response",
                description:
                  "The PNG path goes into the compact summary as 'screenshot: /tmp/macos-use/...'. The server process memory is unchanged. A grep on the file path finds the PNG instantly. No ReplayKit in the server's image list.",
              },
            ]}
          />
        </section>

        {/* The helper code block */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            The Entire 111-Line Helper
          </h2>
          <p className="text-zinc-600 mb-6 max-w-2xl">
            Collapsed for readability, but the shape is real: argv parsing,
            one CGWindowListCreateImage call, optional CoreGraphics drawing,
            one PNG write, one exit. Every framework this program touches will
            be unloaded within a second of main() returning.
          </p>
          <AnimatedCodeBlock
            code={helperCode}
            language="swift"
            filename="Sources/ScreenshotHelper/main.swift"
          />
        </section>

        {/* Checklist */}
        <section className="max-w-4xl mx-auto px-6 py-10">
          <AnimatedChecklist
            title="What subprocess isolation buys you"
            items={[
              { text: "Constant idle CPU on the MCP server, regardless of click volume", checked: true },
              { text: "Bounded worst-case memory: the helper is always a fresh process", checked: true },
              { text: "No need to track which private frameworks a public API lazy-loads", checked: true },
              { text: "Crashes in drawing code can't take the MCP server down", checked: true },
              { text: "Timeouts are enforceable: Process.terminate() is a real kill switch", checked: true },
              { text: "Swap CGWindowListCreateImage for ScreenCaptureKit later without touching the server", checked: true },
            ]}
          />
        </section>

        {/* Bento — what else the split keeps clean */}
        <section className="bg-zinc-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-zinc-900 mb-6">
              Side Benefits You Get From The Split
            </h2>
            <p className="text-zinc-600 mb-8 max-w-2xl">
              The subprocess is there for one reason, but the architectural
              cleanup it forces is worth listing. Everything below is a
              natural consequence of pushing the CGImage work out of the
              server.
            </p>
            <BentoGrid
              cards={[
                {
                  title: "The server binary has no CoreGraphics drawing code",
                  description:
                    "Crosshair math, Y-flips, CGContext initialisation, NSBitmapImageRep.png representation — all live inside the helper. The server never imports AppKit for drawing purposes.",
                  size: "2x1",
                },
                {
                  title: "You can call the helper from a shell for debugging",
                  description:
                    "screenshot-helper 12345 /tmp/out.png --click 640,400 --bounds 0,0,1440,900 works as a standalone command. Reproducing a bug does not require running the whole MCP stack.",
                  size: "1x1",
                },
                {
                  title: "Swap capture strategies without touching the server",
                  description:
                    "Replace the 111-line helper with a ScreenCaptureKit version. The server argv contract — windowID + outputPath + optional click/bounds — stays identical. No handler changes.",
                  size: "1x1",
                },
                {
                  title: "Screen Recording entitlement scope is narrower",
                  description:
                    "If you ever wanted to bundle a signed version where only the helper declared Screen Recording permission, the split makes that trivial; the server binary never even appears in System Settings → Screen Recording.",
                  size: "1x1",
                },
                {
                  title: "Timeouts are mandatory and enforceable",
                  description:
                    "The 5-second DispatchTime deadline wrapping Process.waitUntilExit is only meaningful because it can terminate(). A thread inside the server doing the same work couldn't be cancelled this cleanly.",
                  size: "1x1",
                },
              ]}
            />
          </div>
        </section>

        {/* Window selection — second anchor */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            The Window Selection Score Is Also Non-Obvious
          </h2>
          <p className="text-zinc-600 mb-6 max-w-2xl">
            The subprocess is the headline fix, but{" "}
            <span className="font-mono text-sm">
              captureWindowScreenshot
            </span>{" "}
            also does a subtler thing: it picks which window to shoot. Not the
            largest, not the frontmost, not the first. It iterates every
            layer-0 window owned by the PID and scores each candidate by its
            intersection area with the bounds reported in the AX traversal the
            MCP client just received. The highest-scoring window wins.
          </p>
          <FlowDiagram
            title="Choosing the correct window for the screenshot"
            steps={[
              { label: "CGWindowListCopyWindowInfo", detail: "onScreenOnly" },
              { label: "filter by PID & layer", detail: "layer == 0" },
              { label: "intersect with traversal", detail: "rect ∩ twb" },
              { label: "score = area", detail: "w × h" },
              { label: "argmax window", detail: "best score" },
              { label: "fallback: largest", detail: "if no bounds" },
            ]}
          />
          <p className="text-zinc-500 text-sm mt-6 max-w-2xl">
            This is why the PNG always matches the AX tree the model is about
            to reason over, even in apps like Slack or Notes that show dialogs
            and popovers as separate windows above the main one. The screenshot
            is pinned to the AX traversal, not to whatever is visually on top.
          </p>
        </section>

        {/* HorizontalStepper — three failure modes */}
        <section className="bg-zinc-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-zinc-900 mb-4">
              Three Failure Modes, Three Fallbacks
            </h2>
            <p className="text-zinc-600 mb-8 max-w-2xl">
              Every branch in the screenshot path has a defined failure
              behaviour. The MCP client never sees an exception; it either
              gets a screenshot path or it does not, and the AX diff is
              always there.
            </p>
            <HorizontalStepper
              steps={[
                {
                  title: "Helper binary missing",
                  description:
                    "FileManager.default.fileExists returns false. Logged as warning: captureWindowScreenshot: screenshot-helper not found at <path>. Returns nil. Tool response omits screenshot field.",
                },
                {
                  title: "Helper takes longer than 5.0s",
                  description:
                    "group.wait(timeout: deadline) == .timedOut. process.terminate() sends SIGTERM. Warning is logged. Returns nil. The timeout catches stuck ReplayKit initialisation on systems with audio/video permission friction.",
                },
                {
                  title: "Helper exits non-zero",
                  description:
                    "process.terminationStatus != 0. stderr is forwarded, logged, returns nil. The MCP response still carries the AX tree diff; only the PNG is missing.",
                },
              ]}
            />
          </div>
        </section>

        {/* Marquee — the AX attrs / CGWindow keys used */}
        <section className="py-12">
          <div className="max-w-4xl mx-auto px-6 mb-6">
            <h2 className="text-2xl font-bold text-zinc-900 mb-2">
              The CoreGraphics And Accessibility Keys The Helper Touches
            </h2>
            <p className="text-zinc-500">
              A narrow API surface keeps the blast radius of ReplayKit
              loading localised. Everything below either runs inside the
              helper or never pulls the framework at all.
            </p>
          </div>
          <Marquee speed={30} fade pauseOnHover>
            {[
              "CGWindowListCopyWindowInfo",
              "CGWindowListCreateImage",
              ".optionIncludingWindow",
              ".boundsIgnoreFraming",
              ".bestResolution",
              "kCGWindowOwnerPID",
              "kCGWindowLayer",
              "kCGWindowNumber",
              "kCGWindowBounds",
              "NSBitmapImageRep",
              "CGContext(data:)",
              "AXWindow",
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

        {/* Reproduce */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            Reproduce The Two-Binary Layout In A Clean Checkout
          </h2>
          <p className="text-zinc-600 mb-8 max-w-2xl">
            A minute, end to end, on any Mac with Xcode command-line tools.
            The output shows both executables side by side. The comment is
            grep-able.
          </p>
          <TerminalOutput
            title="Verifying the two targets yourself"
            lines={[
              {
                text: "git clone https://github.com/mediar-ai/mcp-server-macos-use.git",
                type: "command",
              },
              { text: "cd mcp-server-macos-use", type: "command" },
              {
                text: "xcrun --toolchain com.apple.dt.toolchain.XcodeDefault swift build",
                type: "command",
              },
              { text: "Build complete!", type: "success" },
              {
                text: "ls .build/debug | grep -E 'mcp-server-macos-use|screenshot-helper'",
                type: "command",
              },
              { text: "mcp-server-macos-use", type: "output" },
              { text: "screenshot-helper", type: "output" },
              {
                text: "grep -n 'ReplayKit' Sources/MCPServer/main.swift",
                type: "command",
              },
              {
                text: "383:/// (screenshot-helper) so that the ReplayKit framework — loaded as a side-effect",
                type: "output",
              },
              {
                text: "384:/// by macOS — dies with the subprocess instead of spinning at ~19% CPU forever",
                type: "output",
              },
              {
                text: "458:    // Run screenshot-helper in a subprocess — ReplayKit dies when it exits",
                type: "output",
              },
              {
                text: "wc -l Sources/ScreenshotHelper/main.swift",
                type: "command",
              },
              { text: "     111 Sources/ScreenshotHelper/main.swift", type: "output" },
              {
                text: "Two executables on disk, one comment explaining why.",
                type: "success",
              },
            ]}
          />
        </section>

        {/* Comparison table */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            macos-use vs In-Process Screenshot
          </h2>
          <ComparisonTable
            productName="macos-use (two-target split)"
            competitorName="Single-binary CGWindowListCreateImage caller"
            rows={[
              {
                feature: "Idle CPU after first screenshot",
                ours: "Baseline (framework not loaded in server)",
                competitor: "~19% sustained (ReplayKit never unloads)",
              },
              {
                feature: "Can enforce a hard timeout",
                ours: "Yes — Process.terminate() after 5.0s",
                competitor: "No — in-process CGImage calls can't be cancelled",
              },
              {
                feature: "Crosshair drawing in the server",
                ours: "No — drawn in the helper via CGContext",
                competitor: "Yes — pulls AppKit drawing into the server",
              },
              {
                feature: "Swap for ScreenCaptureKit",
                ours: "Rewrite 111 lines of helper, untouched server",
                competitor: "Restructure the server's frame handling",
              },
              {
                feature: "Failure surface",
                ours: "Screenshot nil, AX diff still delivered",
                competitor: "Screenshot thread can stall or leak",
              },
              {
                feature: "Window selection by AX traversal overlap",
                ours: "Yes — max intersection score with traversalWindowBounds",
                competitor: "Usually largest-window heuristic",
              },
              {
                feature: "Lines needed in the server",
                ours: "134 lines for captureWindowScreenshot + launch",
                competitor: "Similar lines + indefinite CPU tax",
              },
            ]}
          />
        </section>

        {/* Proof banner */}
        <section className="max-w-4xl mx-auto px-6 py-10">
          <ProofBanner
            quote="The second binary is not a micro-service and not a sandbox. It is a lifetime boundary. ReplayKit lives inside it and nowhere else, which is the only reason the MCP server's idle CPU stays flat."
            source="main.swift:382-385 + Sources/ScreenshotHelper"
            metric="1 process exit = 1 framework unload"
          />
        </section>

        {/* InlineCta */}
        <section className="max-w-4xl mx-auto px-6 py-10">
          <InlineCta
            heading="Point macos-use at any scroll-heavy or dialog-heavy app"
            body="The server gives you a bounded, reliable PNG plus an AX tree diff for every click, type, and press. The two-binary layout is invisible to your MCP client: it just sees a screenshot path in the response summary. Clone the repo, build with swift build, and wire it into Claude Desktop or Cursor the normal way."
            linkText="Install from npm"
            href="https://www.npmjs.com/package/mcp-server-macos-use"
          />
        </section>

        {/* FAQ */}
        <FaqSection items={faqItems} />

        {/* Final CTA */}
        <section className="max-w-4xl mx-auto px-6 py-16 text-center">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            Read Package.swift.
          </h2>
          <p className="text-zinc-500 mb-8 max-w-xl mx-auto">
            Thirty-one lines. Two{" "}
            <span className="font-mono text-sm">.executableTarget</span>{" "}
            entries. The one on the bottom is the entire reason the CPU graph
            is flat.
          </p>
          <ShimmerButton href="https://github.com/mediar-ai/mcp-server-macos-use/blob/main/Package.swift">
            Open Package.swift on GitHub
          </ShimmerButton>
        </section>

        <StickyBottomCta
          description="macos-use ships two binaries because CGWindowListCreateImage loads ReplayKit into the caller and it never leaves"
          buttonLabel="Read the helper"
          href="https://github.com/mediar-ai/mcp-server-macos-use/blob/main/Sources/ScreenshotHelper/main.swift"
        />
      </article>
    </>
  );
}
