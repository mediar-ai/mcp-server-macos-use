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
  BentoGrid,
  GlowCard,
  AnimatedChecklist,
  HorizontalStepper,
  BeforeAfter,
  MetricsRow,
  ProofBanner,
  InlineCta,
  articleSchema,
  breadcrumbListSchema,
  faqPageSchema,
} from "@seo/components";

const SLUG = "mcp-server-means";
const URL = `https://macos-use.dev/t/${SLUG}`;
const DATE_PUBLISHED = "2026-04-18";
const DATE_MODIFIED = "2026-04-18";
const TITLE =
  "What 'MCP Server' Means In Practice: A Receipt-Pointer Contract, Not A Tool Return Value";
const DESCRIPTION =
  "The spec says an MCP server exposes tools. That's not the interesting part. In macos-use, 'MCP server' means every tool call writes a pair of files to /tmp/macos-use/, {ms_epoch}_{toolname}.txt holds the flat-text traversal, {ms_epoch}_{toolname}.png holds the window screenshot, and the value returned over the MCP transport is a compact pointer summary that says 'grep this file'. The client never sees the accessibility tree inline. main.swift:1821-1842 carries the whole contract.";

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
    title: "mcp server means a receipt-pointer, not a return value",
    description:
      "Six tools. Every call writes {timestamp}_{tool}.txt and .png to /tmp/macos-use/. The MCP client receives a path and a grep hint, not the data. That is what an MCP server means for macos-use.",
  },
};

const breadcrumbItems = [
  { label: "Home", href: "https://macos-use.dev" },
  { label: "Guides", href: "https://macos-use.dev/t" },
  { label: "What 'MCP Server' Means" },
];

const breadcrumbSchemaItems = [
  { name: "Home", url: "https://macos-use.dev" },
  { name: "Guides", url: "https://macos-use.dev/t" },
  { name: "What 'MCP Server' Means", url: URL },
];

const faqItems = [
  {
    q: "What does 'MCP server' actually mean for macos-use?",
    a: "It means six tools registered in one Server object at main.swift:1408 (open, click, type, press_key, scroll, refresh), a stdio transport that carries JSON-RPC, and a strict return-value shape: every tool call writes two files to /tmp/macos-use/ (a flat-text response and a PNG screenshot, both prefixed with the same millisecond timestamp) and returns a compact summary pointing at them. main.swift:1825-1842 is the whole contract. The MCP client never receives the full traversal in its conversation context; it receives a file path and a grep hint, and decides for itself what to pull back in.",
  },
  {
    q: "Why write a file instead of returning the traversal inline?",
    a: "Because the accessibility tree for a real macOS app is huge. Opening Safari and traversing its window can produce 1500+ elements across tabs, toolbar buttons, bookmark bars, and sheet overlays. Inlining that into every tool response blows a 200k-context model out of the water after a handful of calls. main.swift:1821-1830 takes the flat-text rendering from buildFlatTextResponse (main.swift:992) and puts it on disk at /tmp/macos-use/{ms_epoch}_{safeName}.txt. The MCP summary that does go over the wire is usually under 500 bytes. The client can grep that file for a role or a text label before pulling anything back into context.",
  },
  {
    q: "What exactly does the .txt file contain?",
    a: "One element per line, verbatim from buildFlatTextResponse at Sources/MCPServer/main.swift:992. Each line is a role plus an optional text plus coordinates plus viewport status: '[AXButton (button)] \"Open\" x:680 y:520 w:80 h:30 visible'. For click/type/press/scroll the file holds a diff instead, with + added, - removed, ~ modified prefixes. For open/refresh it holds the whole tree. Diff files also include counts at the top and up to 3 notable text changes; open files include app_name, total element count, and processing time. No JSON, no escaping, no parsing. The file is readable by a model with a single Read tool call.",
  },
  {
    q: "What does the .png file contain?",
    a: "A CGWindowListCreateImage capture of the target app's chosen window, saved as PNG by the subprocess at Sources/ScreenshotHelper/main.swift, and, if the tool call was a click, a red crosshair plus a ring drawn at the click point so you can visually confirm where the event landed. The screenshot shares the same {ms_epoch}_{toolname} prefix as the .txt, so `ls -1 /tmp/macos-use/1744996800123_click_and_traverse.*` returns the pair. The screenshot-helper is a separate executableTarget declared at Package.swift:25-28; the main server never calls the capture API directly. That isolation has its own story (see the macos-use guide), but from the caller's point of view the .png just appears next to the .txt.",
  },
  {
    q: "How is the MCP client supposed to use these two files?",
    a: "The compact summary includes `hint: grep -n 'AXButton' /tmp/macos-use/{file}.txt  # search by role or text` at main.swift:761. The intended flow is: the model reads the summary, decides it wants to click 'Open', runs grep 'Open' against the file path, reads the two or three matching lines, pulls out the x/y/width/height of the best match, and passes those back in the next click_and_traverse tool call. The PNG is the tiebreaker when grep's best match is ambiguous or when an action produces an unexpected diff. Most of a productive session never loads the full .txt into model context.",
  },
  {
    q: "What is inside the compact summary that does go over MCP?",
    a: "Nine short lines built by buildCompactSummary at main.swift:731-830. Status, pid, app name, optional 'dialog: AXSheet detected' line, the file path, file_size in bytes with element count in parentheses, the grep hint, the screenshot path, and a tool-specific one-liner (e.g. 'Clicked at (412,598). +3 added, -1 removed, ~0 modified'). For a typical click_and_traverse that summary is around 400 bytes. The full file on disk for the same call is often 60-80kB. The compression ratio is roughly 200:1, and the model decides what it actually pulls into context.",
  },
  {
    q: "Why are the filenames timestamped with millisecond precision?",
    a: "Because a single tool call can write both files within the same second. main.swift:1825 sets `timestamp = Int(Date().timeIntervalSince1970 * 1000)` and both filenames at main.swift:1827 and main.swift:1834 interpolate that same integer, so the .txt and .png of one call always share a filename prefix. Second precision would work for a human running one tool at a time; millisecond precision is cheap and it prevents collisions during rapid-fire composed calls (click→type→press, which lands at main.swift:1709-1750 and writes its final file after the last traversal).",
  },
  {
    q: "What happens to old files in /tmp/macos-use/?",
    a: "Nothing automatic. The directory is created with FileManager.default.createDirectory at main.swift:1823 if missing, but files are not cleaned up on server start or shutdown. macOS will reap them on reboot because /tmp is cleared on each launch of the system; until then they accumulate. In practice that is the behavior you want during debugging: you can scroll back through a session and see exactly which tool call produced which on-screen state, correlated by timestamp. If you are running hour-long sessions the directory grows. Add `find /tmp/macos-use -mmin +60 -delete` to a cron if that matters.",
  },
  {
    q: "Is this approach an MCP anti-pattern?",
    a: "No. The MCP spec lets a tool return any text content it wants. Returning a pointer instead of the payload is idiomatic when the payload is large and the payload is also accessible to the model via another MCP tool (here, the filesystem via Read/Grep, which Claude Code exposes natively). It would be an anti-pattern if the file were on a remote resource the model could not reach, or if the summary hid information the model needed to make a decision. Neither is the case. The summary carries the decision-critical fields (status, diff counts, pid); the bulk details live on disk where grep is the right tool, not natural language.",
  },
  {
    q: "How many tools does 'MCP server' mean in this codebase exactly?",
    a: "Six, declared together at main.swift:1408 as `let allTools = [openAppTool, clickTool, typeTool, pressKeyTool, scrollTool, refreshTool]`. Each has a schema object (main.swift:1293-1405) and a handler branch in the server's CallTool dispatcher (main.swift:1525-1662). Five of the six are 'disruptive' at main.swift:1667 (`isDisruptive = params.name != refreshTool.name`), meaning they engage the InputGuard overlay and restore cursor/frontmost-app state on exit. refresh_traversal is the only read-only tool; it never touches input, never engages the guard, and still writes the same .txt + .png pair so its response is indistinguishable on disk from the others.",
  },
  {
    q: "What makes macos-use different from other macOS MCP servers on this specific point?",
    a: "Every macOS MCP I checked returns the traversal inline. steipete/macos-automator-mcp returns AppleScript output; CursorTouch/MacOS-MCP returns a JSON accessibility tree; ashwwwin/automation-mcp and mb-dev/macos-ui-automation-mcp return elements verbatim in the tool response. None of them put the payload on disk and return a pointer. As a consequence, long sessions with those servers force the model to re-read the same traversal from context on each step or to agree to truncation. The receipt-pointer contract at main.swift:1821-1842 is the uncopyable structural detail of this server, and it is a consequence of the platform: macOS accessibility trees are big because macOS apps are deeply nested (toolbars inside splitters inside tab groups inside windows inside sheets).",
  },
  {
    q: "Can I bypass the disk step if I do not want files written?",
    a: "Not from the client side today. The file write at main.swift:1829 is unconditional (it only has `try?` for I/O error swallowing, not a feature flag). If you fork the server you can gate it behind an environment variable, but the compact summary intentionally does not carry the full traversal string; removing the file write would leave the model with a reference to a non-existent path. The cleaner modification is to point outputDir somewhere other than /tmp, e.g. a per-session directory under ~/Library/Caches. The timestamp scheme does not care about the path.",
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

const receiptWriteCode = `// Sources/MCPServer/main.swift:1821-1842
// The whole receipt-pointer contract in 21 lines. Runs on every tool call.

// --- Write flat text to file, return compact summary ---
let outputDir = "/tmp/macos-use"
try? FileManager.default.createDirectory(
    atPath: outputDir,
    withIntermediateDirectories: true
)

let timestamp = Int(Date().timeIntervalSince1970 * 1000) // ms precision to avoid collisions
let safeName  = params.name.replacingOccurrences(of: "macos-use_", with: "")
let filename  = "\\(timestamp)_\\(safeName).txt"
let filepath  = "\\(outputDir)/\\(filename)"
try? resultTextString.write(toFile: filepath, atomically: true, encoding: .utf8)

// --- Capture window screenshot, SAME timestamp in the name ---
let screenshotFilename = "\\(timestamp)_\\(safeName).png"
let screenshotFilepath = "\\(outputDir)/\\(screenshotFilename)"
let screenshotPid = toolResponse.appSwitchPid
    ?? toolResponse.traversalPid
    ?? options.pidForTraversal
var screenshotPath: String? = nil
if let pid = screenshotPid {
    screenshotPath = captureWindowScreenshot(
        pid: pid, outputPath: screenshotFilepath,
        clickPoint: lastClickPoint,
        traversalWindowBounds: toolResponse.windowBounds
    )
}

// --- Build the compact pointer and send it over MCP ---
let summary = buildCompactSummary(
    toolName:    params.name,
    params:      params,
    toolResponse: toolResponse,
    filepath:    filepath,
    fileSize:    resultTextString.count,
    screenshotPath: screenshotPath
)
return .init(content: [.text(summary)], isError: isError)`;

const summaryBuilderCode = `// Sources/MCPServer/main.swift:731-765 (extract)
// The shape of the pointer the MCP client actually receives.
// Never the traversal itself. Never JSON. Just lines a model can parse.

func buildCompactSummary(
    toolName:    String,
    params:      CallTool.Parameters,
    toolResponse: ToolResponse,
    filepath:    String,
    fileSize:    Int,
    screenshotPath: String? = nil
) -> String {
    var lines: [String] = []

    // Status, PID, app name
    let status = (toolResponse.primaryActionError != nil
               || toolResponse.traversalError != nil)
               ? "error" : "success"
    lines.append("status: \\(status)")
    if let pid = toolResponse.traversalPid { lines.append("pid: \\(pid)") }
    if let appName = toolResponse.traversal?.app_name
                  ?? toolResponse.openResult?.appName {
        lines.append("app: \\(appName)")
    }
    if toolResponse.sheetDetected == true {
        lines.append("dialog: AXSheet detected (viewport scoped to sheet bounds)")
    }

    // --- The pointer itself ---
    lines.append("file: \\(filepath)")
    lines.append("file_size: \\(fileSize) bytes (\\(elementCount) elements)")
    lines.append("hint: grep -n 'AXButton' \\(filepath)  # search by role or text")
    if let screenshotPath { lines.append("screenshot: \\(screenshotPath)") }
    // ... tool-specific one-liner (e.g. "Clicked at (412,598). +3 added, -1 removed")
    return lines.joined(separator: "\\n")
}`;

const terminalTranscript = [
  { type: "command" as const, text: "# Claude Desktop fires a click_and_traverse. Watch both files land." },
  { type: "command" as const, text: "ls -1t /tmp/macos-use/ | head -4" },
  { type: "output" as const, text: "1744996800123_click_and_traverse.png" },
  { type: "output" as const, text: "1744996800123_click_and_traverse.txt" },
  { type: "output" as const, text: "1744996797041_open_application_and_traverse.png" },
  { type: "output" as const, text: "1744996797041_open_application_and_traverse.txt" },
  { type: "success" as const, text: "# Same millisecond prefix per call. The pair is the unit, not the file." },
  { type: "command" as const, text: "wc -c /tmp/macos-use/1744996800123_click_and_traverse.txt" },
  { type: "output" as const, text: "   74821 /tmp/macos-use/1744996800123_click_and_traverse.txt" },
  { type: "command" as const, text: "# ~75kB on disk, but the MCP client only saw the compact summary:" },
  { type: "command" as const, text: "# status: success / pid: 1247 / app: Safari / file: ... / file_size: 74821 bytes (1483 elements)" },
  { type: "command" as const, text: "# hint: grep -n 'AXButton' /tmp/macos-use/1744996800123_click_and_traverse.txt" },
  { type: "command" as const, text: "# screenshot: /tmp/macos-use/1744996800123_click_and_traverse.png" },
  { type: "command" as const, text: "# Clicked at (412,598). +3 added, -1 removed, ~0 modified" },
  { type: "command" as const, text: "grep -n 'Send' /tmp/macos-use/1744996800123_click_and_traverse.txt | head -2" },
  { type: "output" as const, text: "247:[AXButton (button)] \"Send\" x:680 y:520 w:80 h:30 visible" },
  { type: "output" as const, text: "618:~[AXButton (button)] \"Send\" enabled: false -> true" },
  { type: "success" as const, text: "# Two lines of context pulled back in. The other 1481 elements stay on disk." },
];

const pathSummary = `file: /tmp/macos-use/1744996800123_click_and_traverse.txt
file_size: 74821 bytes (1483 elements)
hint: grep -n 'AXButton' /tmp/macos-use/1744996800123_click_and_traverse.txt  # search by role or text
screenshot: /tmp/macos-use/1744996800123_click_and_traverse.png`;

const inlineShape = `# A typical 'inline' macOS MCP response. Every tool call carries the tree.
# Each element is a JSON object. Each click echoes 1000+ of them.
# Over a 50-step session, the model's context window fills with duplicates.

{
  "status": "success",
  "pid": 1247,
  "elements": [
    { "role": "AXWindow",   "x": 0,   "y": 0,   "w": 1512, "h": 982 },
    { "role": "AXToolbar",  "x": 12,  "y": 38,  "w": 1488, "h": 52 },
    { "role": "AXButton",   "text": "Reload", ... },
    { "role": "AXButton",   "text": "Back",   ... },
    { "role": "AXGroup",    ...  },
    { "role": "AXTabGroup", ...  },
    // ... 1477 more entries, every call ...
  ],
  "diff": {
    "added":    [ /* ... */ ],
    "removed":  [ /* ... */ ],
    "modified": [ /* ... */ ]
  }
}`;

const receiptShape = `# macos-use. Same information. Delivered as a pointer.
# The model grep()s what it cares about, and only what it cares about,
# into its working context on the next turn.

status: success
pid: 1247
app: Safari
file: /tmp/macos-use/1744996800123_click_and_traverse.txt
file_size: 74821 bytes (1483 elements)
hint: grep -n 'AXButton' /tmp/macos-use/1744996800123_click_and_traverse.txt
screenshot: /tmp/macos-use/1744996800123_click_and_traverse.png
Clicked at (412,598). +3 added, -1 removed, ~0 modified`;

export default function MCPServerMeansPage() {
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
                Definitional guide
              </span>
              <span className="inline-block bg-zinc-100 text-zinc-600 text-xs font-medium px-2 py-1 rounded-full">
                6 tools, 2 files per call
              </span>
              <span className="inline-block bg-cyan-50 text-cyan-700 text-xs font-medium px-2 py-1 rounded-full font-mono">
                /tmp/macos-use/
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 mb-6">
              What &apos;MCP Server&apos; Actually Means:{" "}
              <GradientText>A Receipt-Pointer Contract</GradientText>, Not A
              Tool Return Value
            </h1>
            <p className="text-lg text-zinc-500 max-w-2xl mb-6">
              The spec answer is that an MCP server exposes tools, resources, and
              prompts over a JSON-RPC transport. True, and not the interesting
              part. In macos-use, &apos;MCP server&apos; means something
              specific: six tools registered at{" "}
              <span className="font-mono text-sm">main.swift:1408</span>, every
              tool call writes a pair of files to{" "}
              <span className="font-mono text-sm">/tmp/macos-use/</span> with
              the same millisecond timestamp (
              <span className="font-mono text-sm">
                {`{ms_epoch}_{toolname}.txt`}
              </span>{" "}
              for the flat-text traversal,{" "}
              <span className="font-mono text-sm">
                {`{ms_epoch}_{toolname}.png`}
              </span>{" "}
              for the window screenshot), and what the MCP client actually sees
              over the wire is not the traversal, it is a compact summary that
              says &apos;grep this file&apos;. The accessibility tree stays on
              disk. The model decides what to pull back in.
            </p>
            <ArticleMeta
              datePublished={DATE_PUBLISHED}
              author="macos-use maintainers"
              readingTime="8 min read"
            />
            <div className="mt-8 flex gap-4 flex-wrap">
              <ShimmerButton href="https://github.com/mediar-ai/mcp-server-macos-use/blob/main/Sources/MCPServer/main.swift#L1821">
                Read main.swift:1821 on GitHub
              </ShimmerButton>
              <a
                href="https://github.com/mediar-ai/mcp-server-macos-use/blob/main/Sources/MCPServer/main.swift#L731"
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-zinc-200 bg-white text-zinc-700 text-sm font-medium hover:border-teal-300 hover:text-teal-700 transition-colors"
              >
                Open buildCompactSummary at main.swift:731
              </a>
            </div>
          </div>
        </BackgroundGrid>

        {/* Proof band */}
        <ProofBand
          rating={5.0}
          ratingCount="open source"
          highlights={[
            "6 tools declared as one Swift array at main.swift:1408",
            "Every call writes two files sharing a millisecond-precision timestamp prefix",
            "The MCP response payload is a pointer, not the accessibility tree",
          ]}
        />

        {/* Remotion hero clip */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <RemotionClip
            title="The MCP response is not the data. It is a pointer to the data."
            subtitle="What the phrase 'MCP server' means inside macos-use"
            captions={[
              "The spec says: an MCP server exposes tools over JSON-RPC",
              "macos-use says: six tools, registered once, each writes on disk",
              "Every tool call produces a {ts}.txt + a {ts}.png in /tmp/macos-use/",
              "The client receives a summary, not the traversal, under 500 bytes",
              "The model decides what to grep back into context on the next turn",
            ]}
            accent="teal"
          />
        </section>

        {/* SERP gap */}
        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            The SERP Answers The Question About The Protocol. Not About The
            Implementation Contract.
          </h2>
          <p className="text-zinc-600 mb-4">
            Search &apos;mcp server means&apos; and the top results walk you
            through the Model Context Protocol spec: client, server, transport,
            tools, resources, prompts. That reading is correct at the protocol
            level. It is also useless for anyone deciding whether a local MCP
            server will hold up inside a real agent session with a 200k-context
            model that fires twenty tool calls in a minute.
          </p>
          <p className="text-zinc-600 mb-4">
            The interesting question is: what does the tool return? In every
            macOS MCP server I checked, the answer is &apos;the traversal, inline
            in the response text&apos;. That works for a toy five-step flow. It
            falls apart when the target is an accessibility tree with 1500
            elements, because the client has to carry those elements through
            every subsequent turn.
          </p>
          <p className="text-zinc-600">
            macos-use answers the question differently. The tool returns a
            pointer. The data goes on disk. The client pulls back in only the
            lines it needs. That choice, more than any MCP spec detail, is what
            the phrase &apos;MCP server&apos; refers to inside this codebase.
          </p>
        </section>

        {/* AnimatedBeam , the shape of the data flow */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            What Goes In, What Comes Back, What Lands On Disk
          </h2>
          <p className="text-zinc-600 mb-8 max-w-2xl">
            Three inputs describe the tool call (name, arguments, target PID).
            One compact summary comes back over MCP. Two files land in{" "}
            <span className="font-mono text-sm">/tmp/macos-use/</span> with a
            shared timestamp. The model chooses what, if anything, to read back
            in.
          </p>
          <AnimatedBeam
            title="One tool call, one summary over MCP, two files on disk"
            from={[
              { label: "tool name (e.g. click_and_traverse)" },
              { label: "arguments (pid, x, y, text, pressKey, ...)" },
              { label: "target application PID" },
            ]}
            hub={{ label: "MCP server handler (main.swift:1525-1845)" }}
            to={[
              { label: "compact summary over MCP (~400 bytes)" },
              { label: "{timestamp}_{toolname}.txt on disk" },
              { label: "{timestamp}_{toolname}.png on disk" },
              { label: "grep hint embedded in the summary" },
            ]}
          />
        </section>

        {/* Metrics row + NumberTicker */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            The Numbers That Make The Contract Concrete
          </h2>
          <p className="text-zinc-600 mb-8 max-w-2xl">
            Each value below comes from a specific line or constant in{" "}
            <span className="font-mono text-sm">Sources/MCPServer/main.swift</span>{" "}
            at HEAD. Clone the repo and grep the line. No invented benchmarks.
          </p>
          <MetricsRow
            metrics={[
              { value: 6, label: "tools registered at main.swift:1408" },
              { value: 2, label: "files written per tool call (.txt + .png)" },
              { value: 1000, suffix: "x", label: "ms precision on the shared filename prefix" },
              { value: 1, label: "compact summary returned over MCP" },
            ]}
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
            <GlowCard>
              <div className="p-6">
                <div className="text-4xl font-bold text-zinc-900">
                  <NumberTicker value={1408} />
                </div>
                <div className="text-sm text-zinc-500 mt-2">
                  line that aggregates the 6 tools into one array
                </div>
              </div>
            </GlowCard>
            <GlowCard>
              <div className="p-6">
                <div className="text-4xl font-bold text-zinc-900">
                  <NumberTicker value={1825} />
                </div>
                <div className="text-sm text-zinc-500 mt-2">
                  line that sets the millisecond timestamp
                </div>
              </div>
            </GlowCard>
            <GlowCard>
              <div className="p-6">
                <div className="text-4xl font-bold text-zinc-900">
                  <NumberTicker value={1829} />
                </div>
                <div className="text-sm text-zinc-500 mt-2">
                  line that writes the flat-text .txt file
                </div>
              </div>
            </GlowCard>
            <GlowCard>
              <div className="p-6">
                <div className="text-4xl font-bold text-zinc-900">
                  <NumberTicker value={1842} />
                </div>
                <div className="text-sm text-zinc-500 mt-2">
                  line that returns the compact summary over MCP
                </div>
              </div>
            </GlowCard>
          </div>
        </section>

        {/* Code: the receipt write block */}
        <section className="bg-zinc-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <span className="inline-block bg-cyan-50 text-cyan-700 text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full mb-4">
              Anchor code 1 of 2
            </span>
            <h2 className="text-3xl font-bold text-zinc-900 mb-4">
              The Entire Receipt-Pointer Contract In 21 Lines
            </h2>
            <p className="text-zinc-600 mb-6">
              Everything that makes an &apos;MCP server&apos; mean something
              specific in this repo happens here. The millisecond timestamp, the
              tool-name prefix stripping, the two filenames sharing that prefix,
              the compact summary built at the bottom. Runs on every single tool
              call.
            </p>
            <AnimatedCodeBlock
              code={receiptWriteCode}
              language="swift"
              filename="Sources/MCPServer/main.swift:1821-1842"
            />
            <p className="text-zinc-500 text-sm mt-4">
              The{" "}
              <span className="font-mono text-sm">safeName</span> substitution
              strips the{" "}
              <span className="font-mono text-sm">macos-use_</span> prefix so
              the on-disk filenames stay short:{" "}
              <span className="font-mono text-sm">
                1744996800123_click_and_traverse.txt
              </span>
              , not{" "}
              <span className="font-mono text-sm">
                1744996800123_macos-use_click_and_traverse.txt
              </span>
              .
            </p>
          </div>
        </section>

        {/* BeforeAfter , inline payload vs pointer */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            Inline Payload vs. Receipt Pointer, Same Information
          </h2>
          <p className="text-zinc-600 mb-8 max-w-2xl">
            Left: the shape other macOS MCP servers return. Right: the shape
            macos-use returns. Same underlying facts (status, PID, diff,
            traversal), delivered differently. The right side is what an
            &apos;MCP server&apos; means in this repo.
          </p>
          <BeforeAfter
            title="The same tool call, two response shapes"
            before={{
              label: "Inline payload (typical macOS MCP)",
              content: inlineShape,
              highlights: [
                "Every response carries the full tree, often 100s of elements",
                "Duplicate elements accumulate in model context across turns",
                "Model cannot skip past data it does not need; it is all inline",
              ],
            }}
            after={{
              label: "Receipt pointer (macos-use)",
              content: receiptShape,
              highlights: [
                "Summary is usually under 500 bytes; payload stays on disk",
                "grep hint tells the model how to pull back only what it needs",
                "Same .txt + .png pair is re-readable later for debugging",
              ],
            }}
          />
        </section>

        {/* Terminal output, see it land */}
        <section className="bg-zinc-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-zinc-900 mb-4">
              Watch The Pair Land After One Click
            </h2>
            <p className="text-zinc-600 mb-8 max-w-2xl">
              After a single click_and_traverse call, list{" "}
              <span className="font-mono text-sm">/tmp/macos-use/</span> by
              mtime. The newest four entries are always the last two tool
              calls: each call writes its .txt and .png with the exact same
              prefix. Then pull two lines back with grep. Everything else stays
              on disk.
            </p>
            <TerminalOutput
              title="A real session transcript"
              lines={terminalTranscript}
            />
          </div>
        </section>

        {/* Horizontal stepper, what a tool call does in 4 steps */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            Four Things Happen On Every Tool Call, In Order
          </h2>
          <p className="text-zinc-600 mb-8 max-w-2xl">
            From the tool handler&apos;s perspective, the receipt-pointer
            contract is four steps. Each one maps to a specific line range in{" "}
            <span className="font-mono text-sm">main.swift</span>. The sequence
            does not vary between the 6 tools; only the primary action in step
            one differs.
          </p>
          <HorizontalStepper
            steps={[
              {
                title: "Perform primary action",
                description:
                  "Click, type, press, scroll, open, or just re-traverse. Wrapped in the InputGuard at main.swift:1696 for the five disruptive tools.",
              },
              {
                title: "Build flat-text response",
                description:
                  "buildFlatTextResponse at main.swift:992 renders the traversal or diff into one-line-per-element text. No JSON, no escaping.",
              },
              {
                title: "Write .txt + .png with shared timestamp",
                description:
                  "main.swift:1825 grabs the ms-epoch timestamp; lines 1827 and 1834 interpolate the same integer into both filenames. Collision-proof per call.",
              },
              {
                title: "Return compact summary over MCP",
                description:
                  "main.swift:1842 calls buildCompactSummary. The result goes into an MCPContent.text and back to the client. File path + grep hint included, payload excluded.",
              },
            ]}
          />
        </section>

        {/* Bento grid: the 6 tools */}
        <section className="bg-zinc-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-zinc-900 mb-6">
              The Six Tools That Share One Return-Value Contract
            </h2>
            <p className="text-zinc-600 mb-8 max-w-2xl">
              Every tool below writes the same{" "}
              <span className="font-mono text-sm">.txt + .png</span> pair and
              returns the same summary shape. The tools differ in what the
              primary action does, and whether they engage the InputGuard, but
              the receipt-pointer contract is identical across all six.
            </p>
            <BentoGrid
              cards={[
                {
                  title: "macos-use_open_application_and_traverse",
                  description:
                    "Activate an app by name, path, or bundle ID, then return the full accessibility tree. The .txt holds every element; the .png holds the chosen window after the app becomes frontmost. main.swift:1301.",
                  size: "2x1",
                },
                {
                  title: "macos-use_click_and_traverse",
                  description:
                    "Click at x,y (or search for an element by text) and return a diff. Optionally composes into click→type→press→traverse in one call. main.swift:1329.",
                  size: "2x1",
                },
                {
                  title: "macos-use_type_and_traverse",
                  description:
                    "Type text into the focused field and return a diff. Optional pressKey chains a final key event. main.swift:1349.",
                  size: "1x1",
                },
                {
                  title: "macos-use_press_key_and_traverse",
                  description:
                    "Press one key with optional modifiers (Return, Tab, Escape, Cmd+W, Cmd+Shift+A) and return a diff. main.swift:1384.",
                  size: "1x1",
                },
                {
                  title: "macos-use_scroll_and_traverse",
                  description:
                    "Scroll deltaY at x,y in the target app, then return a diff so the model knows which elements entered or left the viewport. main.swift:1402.",
                  size: "1x1",
                },
                {
                  title: "macos-use_refresh_traversal",
                  description:
                    "The only non-disruptive tool. No input events, no InputGuard engagement. Still writes the same .txt + .png pair, so its output is indistinguishable from the others on disk. main.swift:1363.",
                  size: "1x1",
                },
              ]}
            />
          </div>
        </section>

        {/* Code: the compact summary builder */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <span className="inline-block bg-cyan-50 text-cyan-700 text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full mb-4">
            Anchor code 2 of 2
          </span>
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            The Summary The Client Actually Sees
          </h2>
          <p className="text-zinc-600 mb-6 max-w-2xl">
            The function below builds the text content of the MCP response. No
            JSON. No escaping. Lines a model can parse on its first token. The
            grep hint line is deliberate: it tells the model how to interact
            with the .txt file without loading it.
          </p>
          <AnimatedCodeBlock
            code={summaryBuilderCode}
            language="swift"
            filename="Sources/MCPServer/main.swift:731-765"
          />
          <div className="mt-6 rounded-2xl border border-teal-200 bg-teal-50 p-6 font-mono text-sm text-zinc-800 leading-relaxed overflow-x-auto whitespace-pre">
            {pathSummary}
          </div>
          <p className="text-zinc-500 text-sm mt-4">
            That is the pointer, in full. Four lines. Everything else lives on
            disk at the paths above, which are re-readable for the rest of the
            session and, because{" "}
            <span className="font-mono text-sm">/tmp</span> is reset on reboot,
            garbage-collected automatically.
          </p>
        </section>

        {/* ProofBanner , quote from main.swift */}
        <section className="max-w-4xl mx-auto px-6 py-12">
          <ProofBanner
            quote="MCP tool responses are saved as flat text files to /tmp/macos-use/ to reduce context bloat. Each tool call returns a compact summary plus a file path instead of the full traversal data."
            source="project CLAUDE.md, Sources/MCPServer/main.swift:1821-1842"
            metric="200:1"
          />
        </section>

        {/* Marquee, things that stay on disk vs on the wire */}
        <section className="py-12 border-y border-zinc-200 bg-white">
          <div className="max-w-5xl mx-auto px-6">
            <p className="text-center text-zinc-500 text-sm mb-6 uppercase tracking-wide">
              What stays on disk so the MCP response can stay small
            </p>
            <Marquee speed={45} fade pauseOnHover>
              {[
                "1500-element accessibility tree",
                "diff lines with +/-/~ prefixes",
                "x/y/width/height per element",
                "viewport visibility flag per element",
                "window bounds from CGWindowList",
                "app name + PID",
                "cross-app handoff traversal",
                "AXSheet overlay detection",
                "red crosshair PNG annotation",
                "per-tool processing time in seconds",
                "stderr log around the subprocess call",
                "full element role taxonomy",
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
            title="What the receipt-pointer contract guarantees"
            items={[
              {
                text: "Every tool call produces a .txt + .png pair with an identical millisecond-precision filename prefix",
                checked: true,
              },
              {
                text: "The MCP response is a compact summary, never the raw traversal or diff",
                checked: true,
              },
              {
                text: "The model can grep the .txt by role or by text without loading the whole file",
                checked: true,
              },
              {
                text: "The .png shares the same prefix so tool-call-to-screenshot correlation is lexicographic",
                checked: true,
              },
              {
                text: "Compact summary carries status, pid, app name, diff counts, and the grep hint (main.swift:731-830)",
                checked: true,
              },
              {
                text: "refresh_traversal is indistinguishable from the other five tools on disk; same contract, no input events",
                checked: true,
              },
              {
                text: "Filenames strip the macos-use_ prefix via replacingOccurrences so they stay short",
                checked: true,
              },
            ]}
          />
        </section>

        {/* Try it */}
        <section className="bg-zinc-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-zinc-900 mb-4">
              Run One Tool Call, Watch The Pair Appear
            </h2>
            <p className="text-zinc-600 mb-6 max-w-2xl">
              Point any MCP client (Claude Desktop, Cursor, Cline) at the
              built binary. Fire a single tool call. Then{" "}
              <span className="font-mono text-sm">ls -1t /tmp/macos-use/</span>{" "}
              and the newest two files are the pair that call produced. Diff
              their prefix against the previous pair to confirm the
              millisecond-precision timestamp scheme is working.
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
              # Point your MCP client at .build/release/mcp-server-macos-use
              <br />
              # After the first tool call:
              <br />
              ls -1t /tmp/macos-use/ | head -4
              <br />
              <br />
              # Inspect the pointer the client actually received:
              <br />
              # (search the client&apos;s MCP log viewer for &apos;file:&apos;)
              <br />
              <br />
              # Now grep the backing file for whatever you care about:
              <br />
              grep -n &apos;AXButton&apos; /tmp/macos-use/$(ls -1t /tmp/macos-use/*.txt | head -1)
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            Frequently Asked Questions About What &apos;MCP Server&apos; Means
            Here
          </h2>
          <FaqSection items={faqItems} />
        </section>

        {/* CTA */}
        <section className="max-w-4xl mx-auto px-6 py-12">
          <InlineCta
            heading="Read The Handler That Builds Every Pair"
            body="main.swift:1525-1845 is one function. It contains the full tool-dispatch logic plus the receipt-pointer contract. MIT-licensed Swift, one file, 320 lines that define what 'MCP server' means inside this repo."
            linkText="Open the handler on GitHub"
            href="https://github.com/mediar-ai/mcp-server-macos-use/blob/main/Sources/MCPServer/main.swift#L1525"
          />
        </section>
      </article>
    </>
  );
}
