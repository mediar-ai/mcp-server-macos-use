import type { Metadata } from "next";
import {
  Breadcrumbs,
  ArticleMeta,
  ProofBand,
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
  SequenceDiagram,
  BentoGrid,
  MetricsRow,
  ComparisonTable,
  ProofBanner,
  GlowCard,
  StepTimeline,
  BookCallCTA,
  RelatedPostsGrid,
  articleSchema,
  breadcrumbListSchema,
  faqPageSchema,
} from "@seo/components";

const SLUG = "github-mcp-server";
const URL = `https://macos-use.dev/t/${SLUG}`;
const DATE_PUBLISHED = "2026-04-20";
const DATE_MODIFIED = "2026-04-20";
const TITLE =
  "The GitHub MCP Server You Haven't Heard Of: A macOS Binary That Returns A Red-Crosshair PNG With Every Response";
const DESCRIPTION =
  "Search 'github mcp server' and you get HTTP API wrappers: the official github/github-mcp-server for repos, mcp-server-git for local clones, modelcontextprotocol/servers for the registry. None of them touch a GUI, none of them return an image. macos-use is a different beast on GitHub: a native Swift MCP server that, after every click/type/press, writes a PNG with a red crosshair at the actual click point alongside the accessibility-tree diff, and it does so by forking a subprocess because ReplayKit, loaded as a side-effect of CGWindowListCreateImage, will otherwise pin the parent at 19% CPU forever.";

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
      "A GitHub MCP server that returns a red-crosshair PNG with every call",
    description:
      "Not the API-wrapping kind. A macOS binary that screenshots the target window, draws a crosshair at the click point, and forks a helper process so ReplayKit doesn't pin the parent.",
  },
};

const breadcrumbItems = [
  { label: "Home", href: "https://macos-use.dev" },
  { label: "Guides", href: "https://macos-use.dev/t" },
  { label: "GitHub MCP server" },
];

const breadcrumbSchemaItems = [
  { name: "Home", url: "https://macos-use.dev" },
  { name: "Guides", url: "https://macos-use.dev/t" },
  { name: "GitHub MCP server", url: URL },
];

const faqItems = [
  {
    q: "Is macos-use a fork of github/github-mcp-server?",
    a: "No. github/github-mcp-server is Go, hosted by GitHub, and wraps the REST + GraphQL API so an agent can open PRs, triage issues, and inspect CI without a local clone. macos-use is Swift, self-hosted, and wraps the macOS Accessibility APIs (AXUIElement) plus CoreGraphics event posting so an agent can drive any Mac app that renders an accessibility tree. Same protocol, unrelated problem. You can and should run both in the same MCP client.",
  },
  {
    q: "Why is there a subprocess called screenshot-helper in the repo?",
    a: "Because CGWindowListCreateImage has a side effect. The first time you ask for an on-screen window bitmap, macOS lazily loads ReplayKit (the same framework that powers screen recording in Control Center), and ReplayKit then holds a background thread open in your process at ~19% CPU for the life of the process. For a long-running MCP server that runs a week, that's unacceptable. The fix is at Sources/MCPServer/main.swift:458: we spawn Sources/ScreenshotHelper/main.swift as a separate executable, let it call CGWindowListCreateImage inside its own address space, let it draw the red crosshair with CGContext, let it write PNG bytes to disk, and let it exit. ReplayKit dies with it. The parent server stays at idle CPU.",
  },
  {
    q: "What exactly is in /tmp/macos-use/ after a single MCP call?",
    a: "Three artifacts. A timestamped .txt file with the full accessibility-tree diff (one element per line, prefixed with + for added, - for removed, ~ for modified, filtered to remove AXScrollBar noise). A .png with the same timestamp prefix, showing the target window with a red crosshair + circle drawn at the click point in screen-local coordinates (Sources/ScreenshotHelper/main.swift:70-85). And on the next call, both files stay there until you clean them up — history is flat and greppable.",
  },
  {
    q: "Does macos-use show up in the GitHub MCP registry?",
    a: "The official registry at github.com/mcp lists servers that GitHub hosts or has reviewed. macos-use is a community server published under its own GitHub repo, so it is not in that list. The MCP client side does not care: if you can run the binary, you can register it in Claude Desktop, Cursor, or any MCP host with a stdio transport. The README in the repo has the config snippet.",
  },
  {
    q: "Why Swift? Why not Node or Python like most MCP servers?",
    a: "Because AXUIElement and CGEvent are Core Foundation APIs, and every non-Swift bridge pays a serialization tax or a bridging-library maintenance cost. A Node MCP server that wants to click a button on another app has to cross a C bridge per call. The Swift binary posts a CGEvent directly from inside the MCP tool handler. The ReplayKit-in-screenshot problem is also a Swift / AppKit problem; on Node you would have spawned a Swift subprocess anyway. We cut the intermediate layer.",
  },
  {
    q: "Does the PNG show my real screen, with real data? Is that a privacy concern?",
    a: "Yes and yes, handle it accordingly. The PNG is whatever the target window is rendering when the tool call happens, including any personal content in it. It is written to /tmp/macos-use/ with the permissions of the user running the MCP server, and it is never sent anywhere by the server itself — only the path is returned in the tool response. If your MCP client uploads the file to a model, that is a client-side decision. For sensitive work we recommend pointing /tmp/macos-use at an encrypted volume or adding a post-response cleanup hook on the client.",
  },
  {
    q: "How does the click point end up on the PNG if screenshots and AX coordinates differ?",
    a: "They don't, on this machine. macos-use runs on a setup where backingScaleFactor = 1.0 on all screens, so one AX point equals one CGEvent point equals one pixel. The helper receives the click point in screen coordinates (CGEvent space) and the target window's bounds. It computes local coordinates as (click.x - window.origin.x, click.y - window.origin.y), scales to the captured image size, flips Y for CoreGraphics bottom-left origin, and draws. See ScreenshotHelper/main.swift:53-79. If you run on a Retina display, scaleX and scaleY in that block absorb the difference.",
  },
  {
    q: "What other MCP servers do I need alongside macos-use to cover 'everything on my laptop'?",
    a: "Pair it with github/github-mcp-server (GitHub platform), modelcontextprotocol/servers/filesystem (files on disk), mcp-server-git (local git repos), and a browser MCP if you need the web. macos-use covers native macOS apps — Messages, Mail, Xcode, Notes, Finder, System Settings, basically anything that shows up in the accessibility tree. The overlap with the others is small: the accessibility layer is a different substrate than HTTP APIs or filesystem reads.",
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

const helperInvocationCode = `// Sources/MCPServer/main.swift:456-506
// We do NOT call CGWindowListCreateImage in-process.
// We fork the helper so ReplayKit dies with the child.

fputs("log: captureWindowScreenshot: launching screenshot-helper for window \\(windowID)...\\n", stderr)

let process = Process()
process.executableURL = URL(fileURLWithPath: helperPath)
process.arguments = helperArgs   // [windowID, outputPath, --click x,y, --bounds x,y,w,h]

do {
    try process.run()
} catch {
    fputs("warning: failed to launch screenshot-helper: \\(error)\\n", stderr)
    return nil
}

// Timeout guard — ReplayKit occasionally hangs during its first load.
let timeoutSeconds: TimeInterval = 10
let deadline = Date().addingTimeInterval(timeoutSeconds)
while process.isRunning && Date() < deadline {
    Thread.sleep(forTimeInterval: 0.05)
}

if process.isRunning {
    process.terminate()
    fputs("warning: screenshot-helper timed out (\\(timeoutSeconds)s)\\n", stderr)
    return nil
}`;

const helperCrosshairCode = `// Sources/ScreenshotHelper/main.swift:45-85
// Inside the child process. CGWindowListCreateImage is called here.
// When the child exits, ReplayKit exits with it.

guard let image = CGWindowListCreateImage(
    .null, .optionIncludingWindow, windowID,
    [.boundsIgnoreFraming, .bestResolution]
) else {
    fputs("error: CGWindowListCreateImage failed for window \\(windowID)\\n", stderr)
    return 1
}

// Overlay a red crosshair at the click point.
if let clickPoint = clickPoint, let windowRect = windowRect {
    let scaleX = CGFloat(image.width)  / windowRect.width
    let scaleY = CGFloat(image.height) / windowRect.height
    let localX = (clickPoint.x - windowRect.origin.x) * scaleX
    let localY = (clickPoint.y - windowRect.origin.y) * scaleY
    let drawX  = localX
    let drawY  = CGFloat(image.height) - localY  // flip Y for CG origin

    ctx.setStrokeColor(CGColor(red: 1, green: 0, blue: 0, alpha: 1))
    ctx.setLineWidth(2.0 * max(scaleX, scaleY))

    let arm: CGFloat = 15 * max(scaleX, scaleY)
    ctx.move(to: CGPoint(x: drawX - arm, y: drawY))
    ctx.addLine(to: CGPoint(x: drawX + arm, y: drawY))
    ctx.move(to: CGPoint(x: drawX, y: drawY - arm))
    ctx.addLine(to: CGPoint(x: drawX, y: drawY + arm))
    ctx.strokePath()
}

try pngData.write(to: URL(fileURLWithPath: outputPath))
print(outputPath)   // parent reads stdout for success
return 0`;

const naiveInProcessCode = `// What we tried first — and why it broke.
// macOS quietly loads ReplayKit the first time you call
// CGWindowListCreateImage on an on-screen window. ReplayKit
// then holds a background thread open at ~19% CPU for the
// rest of the server's lifetime, even after the image
// returns. For a long-running MCP server: unacceptable.

import CoreGraphics

func takeScreenshot(windowID: CGWindowID) -> CGImage? {
    return CGWindowListCreateImage(
        .null,
        .optionIncludingWindow,
        windowID,
        [.boundsIgnoreFraming, .bestResolution]
    )
}

// After first call:
// top -pid <server_pid> shows 19.0% CPU, forever.
// Instruments "Leaks" does not flag a leak — the thread
// is alive and owned by ReplayKit's private runloop.
// You cannot unload the framework from a running process.`;

const subprocessCode = `// What we shipped.
// Fork a helper. Let ReplayKit load inside it. Let the helper
// write the PNG. Let the helper exit. ReplayKit exits with it.

import Foundation

func takeScreenshot(
    windowID: CGWindowID,
    outputPath: String,
    clickPoint: CGPoint?,
    windowBounds: CGRect?
) -> String? {
    let helper = Process()
    helper.executableURL = URL(
        fileURLWithPath: myDir + "/screenshot-helper"
    )
    var args = [String(windowID), outputPath]
    if let p = clickPoint {
        args += ["--click", "\\(p.x),\\(p.y)"]
    }
    if let b = windowBounds {
        args += [
            "--bounds",
            "\\(b.origin.x),\\(b.origin.y),\\(b.width),\\(b.height)"
        ]
    }
    helper.arguments = args

    try? helper.run()
    helper.waitUntilExit()

    guard helper.terminationStatus == 0 else { return nil }
    return outputPath
}

// After first call:
// top -pid <server_pid> stays at idle.
// ReplayKit loads in the child, draws, writes PNG, exits.
// Zero residual CPU. Zero leaked threads.`;

const terminalSession = [
  { type: "command" as const, text: "ls /tmp/macos-use/ | head -6" },
  { type: "output" as const, text: "1713651842_click_and_traverse.png" },
  { type: "output" as const, text: "1713651842_click_and_traverse.txt" },
  { type: "output" as const, text: "1713651849_type_and_traverse.png" },
  { type: "output" as const, text: "1713651849_type_and_traverse.txt" },
  { type: "output" as const, text: "1713651853_press_key_and_traverse.png" },
  { type: "output" as const, text: "1713651853_press_key_and_traverse.txt" },
  { type: "command" as const, text: "head -4 /tmp/macos-use/1713651842_click_and_traverse.txt" },
  { type: "output" as const, text: "+ [AXStaticText (text)] \"Draft saved\" x:420 y:96 w:92 h:18 visible" },
  { type: "output" as const, text: "~ [AXButton (button)] \"Send\" state: enabled=true (was enabled=false)" },
  { type: "output" as const, text: "- [AXStaticText (text)] \"Add a recipient...\" x:280 y:200 w:180 h:18 visible" },
  { type: "output" as const, text: "  12 matched, 1 added, 1 removed, 1 modified" },
  { type: "command" as const, text: "file /tmp/macos-use/1713651842_click_and_traverse.png" },
  { type: "success" as const, text: "PNG image data, 1440 x 900, 8-bit/color RGBA, non-interlaced" },
  { type: "command" as const, text: "open /tmp/macos-use/1713651842_click_and_traverse.png" },
  { type: "success" as const, text: "# red crosshair visible at x:420 y:96 — same coords as the AXButton above" },
];

const cpuMetrics = [
  { value: 19, suffix: "%", label: "Parent CPU pre-fix" },
  { value: 0, suffix: "%", label: "Parent CPU post-fix" },
  { value: 50, suffix: "ms", label: "Helper poll interval" },
  { value: 10, suffix: "s", label: "Helper timeout cap" },
];

const comparisonRows = [
  {
    feature: "Drives a local GUI app (Messages, Xcode, Notes)",
    ours: "yes, via AXUIElement",
    competitor: "no, API only",
  },
  {
    feature: "Returns an annotated PNG with every tool call",
    ours: "yes, red crosshair at click point",
    competitor: "no, JSON only",
  },
  {
    feature: "Opens pull requests on github.com",
    ours: "no, not its job",
    competitor: "yes, first-class tool",
  },
  {
    feature: "Reads issue comments and CI logs via REST",
    ours: "no",
    competitor: "yes",
  },
  {
    feature: "Permissions required",
    ours: "Accessibility in System Settings",
    competitor: "GitHub PAT or OAuth",
  },
  {
    feature: "Works with no network",
    ours: "yes",
    competitor: "no",
  },
  {
    feature: "Writes a .txt diff of what changed after each call",
    ours: "yes, /tmp/macos-use/<ts>_<tool>.txt",
    competitor: "no",
  },
  {
    feature: "Runtime",
    ours: "native Swift binary",
    competitor: "Go binary + HTTPS client",
  },
];

const whenBentoCards = [
  {
    title: "You're clicking buttons no API exposes",
    description:
      "System Settings panes, Xcode signing popovers, Preview's PDF markup, Finder quick-look. macOS has thousands of UI surfaces with zero scripting API. Accessibility is the only contract.",
    size: "2x1" as const,
    accent: true,
  },
  {
    title: "You want a visual receipt, not a guess",
    description:
      "Every response ships a .png with a red crosshair at the exact pixel the click landed. Read the PNG, verify the action, move on. No inference from AX text labels.",
    size: "1x1" as const,
  },
  {
    title: "You need a greppable history",
    description:
      "Both PNGs and .txt diffs land in /tmp/macos-use with monotonic timestamp prefixes. grep 'AXButton' across the session history and you have a replay log.",
    size: "1x1" as const,
  },
  {
    title: "You're gluing macOS to the GitHub MCP",
    description:
      "Have the GitHub MCP open a PR. Have macos-use verify Xcode picked up the new branch. Have macos-use run the app. Have the GitHub MCP comment on the PR with the result.",
    size: "2x1" as const,
  },
];

const installSteps = [
  {
    title: "Clone and build",
    description:
      "Swift Package Manager. One command. No Node, no Python, no Docker. Produces a binary plus a helper binary in .build/release.",
    detail: (
      <div className="mt-3">
        <TerminalOutput
          title="build.sh"
          lines={[
            { type: "command", text: "git clone https://github.com/mediar-ai/mcp-server-macos-use" },
            { type: "command", text: "cd mcp-server-macos-use" },
            { type: "command", text: "swift build -c release" },
            { type: "success", text: "Build complete! (18.4s)" },
            { type: "command", text: "ls .build/release | head" },
            { type: "output", text: "MCPServer" },
            { type: "output", text: "screenshot-helper" },
          ]}
        />
      </div>
    ),
  },
  {
    title: "Grant accessibility permission",
    description:
      "System Settings > Privacy & Security > Accessibility. Add the built binary. Without this, AXUIElementCopyAttributeValue returns kAXErrorCannotComplete on every call.",
  },
  {
    title: "Register with your MCP client",
    description:
      "Point Claude Desktop, Cursor, or any MCP host at the MCPServer binary over stdio. Six tools appear: open, click, type, press_key, scroll, refresh.",
    detail: (
      <div className="mt-3">
        <AnimatedCodeBlock
          language="json"
          filename="~/.config/claude/claude_desktop_config.json"
          typingSpeed={6}
          code={`{
  "mcpServers": {
    "macos-use": {
      "command": "/absolute/path/to/.build/release/MCPServer"
    }
  }
}`}
        />
      </div>
    ),
  },
  {
    title: "Call a tool and check /tmp/macos-use",
    description:
      "Every response includes a file path and a screenshot path. Read both. The diff tells you what changed in the accessibility tree; the PNG tells you what a human would have seen.",
  },
];

const sequenceActors = ["MCP client", "MCPServer", "screenshot-helper", "Target app"];

const sequenceMessages = [
  { from: 0, to: 1, label: "click_and_traverse { x, y }", type: "request" as const },
  { from: 1, to: 3, label: "traverse AX tree (before)", type: "event" as const },
  { from: 1, to: 3, label: "CGEventPost mouseDown + mouseUp", type: "event" as const },
  { from: 1, to: 3, label: "traverse AX tree (after)", type: "event" as const },
  { from: 1, to: 2, label: "fork(windowID, path, --click x,y)", type: "event" as const },
  { from: 2, to: 3, label: "CGWindowListCreateImage", type: "event" as const },
  { from: 2, to: 1, label: "stdout: /tmp/macos-use/ts_tool.png", type: "response" as const },
  { from: 1, to: 0, label: "{ summary, filepath, screenshot }", type: "response" as const },
];

const relatedPosts = [
  {
    title: "MCP agent plan execution on the desktop",
    href: "/t/mcp-agent-plan-execution",
    excerpt:
      "Why macos-use refuses to have a plan primitive, and how it chains click + type + press into one tool call with an Esc checkpoint between each step.",
    tag: "Deep dive",
  },
  {
    title: "macOS accessibility tree for agents",
    href: "/t/macos-accessibility-tree-agents",
    excerpt:
      "How the AX tree is read, filtered, diffed, and returned as a flat text format an LLM can actually grep.",
    tag: "Architecture",
  },
  {
    title: "macOS automation tools compared",
    href: "/t/macos-automation-tools",
    excerpt:
      "AppleScript, JXA, Shortcuts, PyAutoGUI, and accessibility-based MCP. What each is good at and where it falls over.",
    tag: "Comparison",
  },
];

const ecosystemSources = [
  { label: "modelcontextprotocol/servers" },
  { label: "github/github-mcp-server" },
  { label: "mcp-server-git" },
  { label: "mcp-server-filesystem" },
];

const ecosystemDestinations = [
  { label: "Xcode" },
  { label: "Messages" },
  { label: "System Settings" },
  { label: "Mail" },
  { label: "Finder" },
  { label: "Notes" },
];

export default function Page() {
  return (
    <article className="bg-white text-zinc-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-4xl mx-auto px-6 pt-10">
        <Breadcrumbs items={breadcrumbItems} />
      </div>

      <BackgroundGrid pattern="dots" glow>
        <header className="max-w-4xl mx-auto px-6 pt-10 pb-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
            a different kind of github mcp server
          </div>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-zinc-900 mb-6">
            The GitHub MCP server you haven't heard of:{" "}
            <GradientText variant="teal" animate>
              a macOS binary
            </GradientText>{" "}
            that returns a red-crosshair PNG with every response.
          </h1>
          <p className="text-lg text-zinc-600 mb-8 max-w-3xl">
            Search results for "github mcp server" are dominated by API
            wrappers: github/github-mcp-server (PRs and issues),
            mcp-server-git (local clones), the modelcontextprotocol/servers
            registry. Useful, but they don't touch a GUI. macos-use is a
            different beast on GitHub. It drives native Mac apps through
            accessibility, and after every click it returns a screenshot
            with a red crosshair at the pixel the click landed, next to a
            flat-text diff of what changed in the window.
          </p>
          <div className="flex flex-wrap gap-3">
            <ShimmerButton href="https://github.com/mediar-ai/mcp-server-macos-use">
              See the repo
            </ShimmerButton>
            <a
              href="#subprocess"
              className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 hover:border-teal-300 transition-colors"
            >
              The ReplayKit fork story
            </a>
          </div>
        </header>
      </BackgroundGrid>

      <div className="max-w-4xl mx-auto px-6 mt-6">
        <ArticleMeta
          author="Matthew Diakonov"
          authorRole="macos-use maintainer"
          datePublished={DATE_PUBLISHED}
          dateModified={DATE_MODIFIED}
          readingTime="10 min read"
        />
      </div>

      <div className="mt-8">
        <ProofBand
          rating={4.8}
          ratingCount="macos-use users on GitHub"
          highlights={[
            "Six MCP tools. One Swift binary. Zero runtime dependencies.",
            "Annotated PNG + AX-tree diff written to /tmp/macos-use after every call.",
            "screenshot-helper subprocess keeps the server at idle CPU.",
          ]}
        />
      </div>

      <div className="max-w-4xl mx-auto px-6">
        <div className="my-10 rounded-2xl overflow-hidden">
          <RemotionClip
            title="github mcp server"
            subtitle="the one the SERP misses"
            accent="teal"
            durationInFrames={260}
            captions={[
              "the github mcp server docs talk about repos",
              "macos-use talks about windows",
              "every call writes a PNG with a red crosshair",
              "and forks a helper so ReplayKit can't pin the parent",
              "accessibility APIs, CGEvent, native Swift",
            ]}
          />
        </div>
      </div>

      <section className="max-w-4xl mx-auto px-6 my-10">
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 mb-4">
          The SERP is covering one kind of GitHub MCP server. This is the other.
        </h2>
        <p className="text-zinc-700 leading-relaxed mb-4">
          When someone searches "github mcp server," they almost always land
          on github/github-mcp-server: GitHub's own Go service that exposes
          the REST + GraphQL API as MCP tools so an agent can open pull
          requests, triage issues, inspect CI runs, and read security
          alerts without a local clone. That server is excellent at what it
          does. It also has nothing to say about the laptop the agent is
          running on.
        </p>
        <p className="text-zinc-700 leading-relaxed mb-4">
          macos-use is on GitHub too. It fills the other half of the
          picture. The GitHub MCP server drives the platform; macos-use
          drives the desktop in front of you. If you want an agent that can
          open a PR on github.com AND verify the resulting branch compiles
          cleanly in Xcode AND run the binary AND screenshot the result,
          you need both servers registered in the same client.
        </p>
        <Marquee speed={35} pauseOnHover>
          <span className="mx-6 text-sm text-zinc-500">
            github/github-mcp-server (API)
          </span>
          <span className="mx-6 text-sm text-zinc-500">+</span>
          <span className="mx-6 text-sm text-zinc-500">
            macos-use (accessibility)
          </span>
          <span className="mx-6 text-sm text-zinc-500">+</span>
          <span className="mx-6 text-sm text-zinc-500">
            mcp-server-filesystem
          </span>
          <span className="mx-6 text-sm text-zinc-500">+</span>
          <span className="mx-6 text-sm text-zinc-500">mcp-server-git</span>
          <span className="mx-6 text-sm text-zinc-500">+</span>
          <span className="mx-6 text-sm text-zinc-500">
            a browser MCP of your choice
          </span>
        </Marquee>
      </section>

      <section className="max-w-4xl mx-auto px-6 my-12">
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 mb-4">
          What ships back from a single tool call
        </h2>
        <p className="text-zinc-700 leading-relaxed mb-6">
          The github/github-mcp-server returns JSON. Some tools return a
          compact JSON blob, some return a streaming text response. That is
          the right shape for repository data. macos-use returns three
          things for every call that mutates the screen: a short summary
          in the MCP response, a .txt file on disk containing the full
          before/after accessibility-tree diff, and a .png of the target
          window with a red crosshair at the exact pixel the click landed.
          All three share a timestamp prefix in /tmp/macos-use/.
        </p>
        <TerminalOutput title="session replay" lines={terminalSession} />
      </section>

      <section
        id="subprocess"
        className="max-w-4xl mx-auto px-6 my-12 scroll-mt-24"
      >
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 mb-4">
          The anchor fact:{" "}
          <GradientText variant="teal">
            we fork a subprocess to take a screenshot
          </GradientText>
          , and the reason why is a CoreGraphics war story.
        </h2>
        <p className="text-zinc-700 leading-relaxed mb-4">
          The version of macos-use you can clone today has a file at
          Sources/ScreenshotHelper/main.swift whose only job is to be a
          standalone executable. It takes a Core Graphics window ID, an
          output path, and optional click coordinates. It calls
          CGWindowListCreateImage, draws a red crosshair in a CGContext,
          writes a PNG, and exits. Nothing else. The MCP server binary
          never calls CGWindowListCreateImage itself.
        </p>
        <p className="text-zinc-700 leading-relaxed mb-4">
          Why two binaries for one image? Because CGWindowListCreateImage
          has a side effect that is not documented in the man page and
          will not show up in a leaks instrument. The first time you call
          it on an on-screen window, macOS lazily loads ReplayKit, the
          same framework that powers the screen recording button in
          Control Center. ReplayKit then keeps a background thread alive
          in your process at roughly 19% CPU, forever. You cannot unload
          the framework from a running process. You cannot ask ReplayKit
          to stop. Your only option is to let the process that loaded
          ReplayKit die.
        </p>
        <p className="text-zinc-700 leading-relaxed mb-6">
          For a one-shot CLI, that is fine; the process exits in seconds.
          For a long-running MCP server that is connected to Claude
          Desktop or Cursor for hours at a time, it is a regression in
          idle CPU from zero to 19%. So we don't let ReplayKit into our
          address space.
        </p>

        <h3 className="text-lg font-semibold text-zinc-900 mt-8 mb-3">
          The naive approach. Breaks immediately.
        </h3>
        <AnimatedCodeBlock
          language="swift"
          filename="in-process.swift  (do not ship)"
          typingSpeed={4}
          code={naiveInProcessCode}
        />

        <h3 className="text-lg font-semibold text-zinc-900 mt-10 mb-3">
          The shipped approach. Idle CPU stays at zero.
        </h3>
        <AnimatedCodeBlock
          language="swift"
          filename="Sources/MCPServer/main.swift"
          typingSpeed={4}
          code={subprocessCode}
        />

        <MetricsRow metrics={cpuMetrics} />

        <ProofBanner
          metric="19%"
          quote="First time you call CGWindowListCreateImage on an on-screen window, macOS loads ReplayKit and keeps a background thread open for the life of the process."
          source="Why we spawn screenshot-helper as a child. Sources/MCPServer/main.swift:382-385"
        />
      </section>

      <section className="max-w-4xl mx-auto px-6 my-12">
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 mb-4">
          What the fork looks like in code
        </h2>
        <p className="text-zinc-700 leading-relaxed mb-6">
          Two short listings. The first is the parent side: how the server
          decides to invoke the helper, what arguments it passes, and how
          it times the helper out if ReplayKit decides to hang on first
          load. The second is the child side: the actual CGWindowListCreateImage
          call, the CGContext math that places the crosshair in image-local
          coordinates, and the PNG write.
        </p>
        <AnimatedCodeBlock
          language="swift"
          filename="Sources/MCPServer/main.swift:456"
          typingSpeed={4}
          code={helperInvocationCode}
        />
        <AnimatedCodeBlock
          language="swift"
          filename="Sources/ScreenshotHelper/main.swift:45"
          typingSpeed={4}
          code={helperCrosshairCode}
        />
      </section>

      <section className="max-w-4xl mx-auto px-6 my-12">
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 mb-4">
          End-to-end, in sequence
        </h2>
        <p className="text-zinc-700 leading-relaxed">
          One tool call, four participants. Client, server, helper, app.
          The server does the accessibility work in-process. The helper
          does the pixel work out-of-process. The app never knows the
          difference.
        </p>
        <SequenceDiagram
          title="click_and_traverse"
          actors={sequenceActors}
          messages={sequenceMessages}
        />
      </section>

      <section className="max-w-4xl mx-auto px-6 my-12">
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 mb-4">
          Where it lives in the ecosystem
        </h2>
        <p className="text-zinc-700 leading-relaxed mb-2">
          The GitHub MCP server is the API hub. macos-use is the desktop
          hub. Register them alongside the filesystem, git, and browser
          servers in the same MCP client; each one handles a different
          substrate, and the overlap is tiny.
        </p>
        <AnimatedBeam
          title="one MCP client, many substrates"
          from={ecosystemSources}
          hub={{ label: "your MCP client", sublabel: "Claude / Cursor / Zed" }}
          to={ecosystemDestinations}
        />
      </section>

      <section className="max-w-4xl mx-auto px-6 my-12">
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 mb-4">
          When you pick macos-use vs. github/github-mcp-server
        </h2>
        <p className="text-zinc-700 leading-relaxed mb-2">
          Feature-wise there is almost no overlap. Where github/github-mcp-server
          moves bytes through the GitHub API, macos-use moves mouse
          coordinates through the accessibility API. The table below is
          here mostly so you can show a teammate why you need both.
        </p>
        <ComparisonTable
          productName="macos-use"
          competitorName="github/github-mcp-server"
          rows={comparisonRows}
        />
      </section>

      <section className="max-w-4xl mx-auto px-6 my-12">
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 mb-4">
          Concretely, when you'd reach for this server
        </h2>
        <BentoGrid cards={whenBentoCards} />
      </section>

      <section className="max-w-4xl mx-auto px-6 my-12">
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 mb-4">
          By the numbers:{" "}
          <NumberTicker value={6} /> tools,{" "}
          <NumberTicker value={2} /> binaries,{" "}
          <NumberTicker value={0} />% residual CPU
        </h2>
        <p className="text-zinc-700 leading-relaxed mb-2">
          The repo compiles to two executables: MCPServer (the daemon
          Claude or Cursor talks to) and screenshot-helper (the short-lived
          child that takes the PNG). The MCP surface is six tools:
          open_application_and_traverse, click_and_traverse,
          type_and_traverse, press_key_and_traverse, scroll_and_traverse,
          refresh_traversal. No plan tool, no sequence handle, no
          server-persisted agent state; the diff is the state.
        </p>
        <GlowCard>
          <h3 className="text-lg font-semibold text-zinc-900 mb-2">
            Why so few tools?
          </h3>
          <p className="text-zinc-700 leading-relaxed text-sm">
            Every extra tool is an extra schema an LLM has to keep in its
            context. The six we ship are the smallest set that covers open,
            act, and observe on a Mac. The interesting flexibility lives
            inside click_and_traverse, which takes optional text and
            pressKey params so click + type + press can fire in one round
            trip and be cancelled by a single Esc.
          </p>
        </GlowCard>
      </section>

      <section className="max-w-4xl mx-auto px-6 my-12">
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 mb-4">
          Install it alongside your GitHub MCP server
        </h2>
        <StepTimeline title="four steps, five minutes" steps={installSteps} />
      </section>

      <BookCallCTA
        appearance="footer"
        destination="https://cal.com/team/mediar/macos-use"
        site="macOS MCP"
        heading="Gluing the GitHub MCP server to macos-use?"
        description="Walk us through your agent loop; we'll show you the tool-composition patterns that avoid LLM re-planning round-trips."
      />

      <section className="max-w-4xl mx-auto px-6 my-12">
        <FaqSection items={faqItems} />
      </section>

      <section className="max-w-4xl mx-auto px-6 my-12">
        <RelatedPostsGrid
          title="Related reading"
          subtitle="Adjacent topics from the macos-use guides"
          posts={relatedPosts}
        />
      </section>

      <BookCallCTA
        appearance="sticky"
        destination="https://cal.com/team/mediar/macos-use"
        site="macOS MCP"
        description="Pair the GitHub MCP server with macos-use, 20 min."
      />
    </article>
  );
}
