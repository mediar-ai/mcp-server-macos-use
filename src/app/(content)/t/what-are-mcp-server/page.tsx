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
  ShimmerButton,
  NumberTicker,
  AnimatedBeam,
  Marquee,
  AnimatedCodeBlock,
  TerminalOutput,
  BeforeAfter,
  BentoGrid,
  ComparisonTable,
  HorizontalStepper,
  AnimatedChecklist,
  ShineBorder,
  InlineCta,
  articleSchema,
  breadcrumbListSchema,
  faqPageSchema,
} from "@seo/components";

const SLUG = "what-are-mcp-server";
const URL = `https://macos-use.dev/t/${SLUG}`;
const DATE_PUBLISHED = "2026-04-19";
const DATE_MODIFIED = "2026-04-19";
const TITLE =
  "What Are MCP Servers? The Part Everyone Skips: What A Tool Return Actually Looks Like On Disk";
const DESCRIPTION =
  "Every 'what are MCP servers' page stops at 'the server returns a text result to the client'. On macOS, a single accessibility traversal of one app is typically 25 to 100 KB. macOS MCP writes each response to /tmp/macos-use/<ms>_<tool>.txt with a paired .png screenshot and returns a ~12-line summary with the file path and a grep hint, so the model greps instead of loading 27 KB into context.";

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
    title: "what are mcp servers, really: what the response looks like on disk",
    description:
      "macOS MCP writes every response to /tmp/macos-use/ as <ms>_<tool>.txt plus a same-basename .png and returns a ~12-line summary with a grep hint. The model greps, never loads the full 27 KB tree.",
  },
};

const breadcrumbItems = [
  { label: "Home", href: "https://macos-use.dev" },
  { label: "Guides", href: "https://macos-use.dev/t" },
  { label: "What Are MCP Servers" },
];

const breadcrumbSchemaItems = [
  { name: "Home", url: "https://macos-use.dev" },
  { name: "Guides", url: "https://macos-use.dev/t" },
  { name: "What Are MCP Servers", url: URL },
];

const faqItems = [
  {
    q: "What are MCP servers in one sentence?",
    a: "MCP servers are long-running processes that speak JSON-RPC 2.0 to an AI client (Claude Desktop, Cursor, VS Code, Cline) and advertise a list of typed tools the model can call. When the model invokes a tool, the server executes it and returns a result. macos-use is an MCP server that advertises 6 tools over stdio, registered in the allTools array at Sources/MCPServer/main.swift:1408, and drives macOS apps through the Accessibility APIs.",
  },
  {
    q: "What does an MCP server actually return when a tool is called?",
    a: "The spec says a CallTool.Result with a content array of text or image blocks. In practice, most generic explainers stop there. The question nobody answers is what happens when the output is large. A traversal of Safari with a few tabs open is easily 60 to 150 KB of structured text. Returning that inline would blow a big chunk of the model's context on a single call. macos-use returns, instead, a ~12-line text summary with a pointer to a file on disk and a grep hint. See buildCompactSummary at main.swift:731.",
  },
  {
    q: "Where does the file live and what does its name look like?",
    a: "main.swift:1822 sets outputDir to /tmp/macos-use. Line 1825 makes a millisecond-precision timestamp. Line 1827 builds the filename as <timestamp>_<tool>.txt, stripping the macos-use_ prefix from the tool name. So a click call writes /tmp/macos-use/1776457217931_click_and_traverse.txt and a paired 1776457217931_click_and_traverse.png next to it. The timestamp is the join key between the two files: grep the .txt for coordinates, Read the .png for visual confirmation.",
  },
  {
    q: "What does the 12-line summary actually contain?",
    a: "status (success or error), pid, app name, file path, file size in bytes and element count, a grep hint (literally `grep -n 'AXButton' <filepath>`), screenshot path, a tool-specific one-liner (e.g. `Clicked element 'Open'. 2 added, 0 removed, 1 modified.`), up to 3 notable text diffs, and a compact `visible_elements:` section with the interactive elements in the viewport. The line ordering is fixed in buildCompactSummary at main.swift:735 through 884. Every line is the same format across every tool call, so the model can parse the output deterministically.",
  },
  {
    q: "Why not just return the full tree every time?",
    a: "A real accessibility tree on this machine right now measures 27,343 bytes and 451 lines for a moderate-sized dev app window. Returned as a JSON-RPC text block it is roughly 8,000 tokens. Multiply by even 5 tool calls in a task and you have burned 40,000 tokens of the model's context budget on raw element dumps before any reasoning happens. Writing the tree to disk and handing back a path is a form of paging: the model loads the 12-line summary for free and pays for the full tree only on the grep or Read the call actually needs.",
  },
  {
    q: "Is the grep hint just documentation, or does the server expect the client to use it?",
    a: "It is a real instruction. The server emits the exact command `grep -n 'AXButton' <filepath>  # search by role or text` at main.swift:761. The repo's own CLAUDE.md section 'MCP Response Files' tells clients explicitly: `Don't read entire files into context — use targeted grep searches.` The accessibility tree format at main.swift:916-919 uses role prefixes (AXButton, AXLink, AXTextField, AXTextArea, AXCheckBox, AXRadioButton, AXPopUpButton, AXComboBox, AXSlider, AXMenuItem, AXMenuButton, AXTab) precisely because each line starts with its role and can be grepped by role or by text.",
  },
  {
    q: "What is the format of a single element line in the tree file?",
    a: "`[Role (subrole)] \"text\" x:N y:N w:W h:H visible`. For example: `[AXButton (button)] \"Open\" x:680 y:520 w:80 h:30 visible`. Role is the accessibility role, subrole is the human-readable variant, text is the element's label or value, x/y are the top-left point in screen coordinates, w/h are the size, and `visible` is present only if the element is on screen. The click_and_traverse tool accepts exactly these four numbers (x, y, w, h) and centers the click automatically, which is why grep on the tree gives the model everything it needs to click without guessing pixels from a screenshot.",
  },
  {
    q: "Why pair every .txt with a .png?",
    a: "Two different signals for the same moment. The tree tells you what is semantically on screen; the screenshot tells you what is visually on screen. They can disagree. A stale tree from a frame before redraw, an element clipped by a sheet, a modal that has no AX role — any of those will mislead a model that trusts only the tree. The server instructions at main.swift:1417-1420 explicitly say: `Always check the screenshot after interactions (click, type, press) to confirm the action had the intended visual effect.` The PNG is captured in-process by a subprocess helper (captureWindowScreenshot, main.swift:378) that loads ReplayKit in a short-lived child so the parent server doesn't leak framework state.",
  },
  {
    q: "Do remote MCP servers have this problem?",
    a: "Mostly no. A SQL MCP server can paginate. A GitHub MCP server returns a JSON blob that is already small. The problem is specific to local MCP servers whose tool output is a live view of some large application state: a DOM snapshot, an accessibility tree, a file system diff, a database schema dump. For those, you either paginate, write to disk and return a path, or compress. macos-use picked write-to-disk because the model's own filesystem tools (Read, Grep) are the most natural way for an LLM client like Claude Desktop or Cursor to consume the output.",
  },
  {
    q: "Does this mean the MCP server is stateful?",
    a: "Barely. The server does not persist per-client state; it just writes a file under /tmp/macos-use with a unique millisecond timestamp and forgets it. The AI client is what holds state: the previous tool's file path lives in the conversation log, and the model can grep it again later if it wants. /tmp cleanup is the OS's job. The server itself is as stateless as any tool-call-then-return MCP server; only the response transport is different.",
  },
  {
    q: "What stops a tool call from ballooning past context anyway?",
    a: "The summary has a hard ceiling. buildCompactSummary caps visible_elements at 30 interactive and 10 static text entries (main.swift:863-868 via buildVisibleElementsSection) and caps notable text changes at 3 (main.swift:841-857). Single text values in diffs are truncated to 60 characters (main.swift:844-845) and the 'typed' text line to 40 (main.swift:804). The entire summary returned inline is bounded. The full data is still on disk if the model wants it.",
  },
  {
    q: "Can I see this with my own eyes?",
    a: "Yes. Clone the repo, `swift build -c release`, point Claude Desktop or another MCP client at the resulting binary, fire a tool call. Then `ls -la /tmp/macos-use/` and you will see the `<ms>_<tool>.txt` and `<ms>_<tool>.png` pair. `wc -c` on the txt gives real bytes. `head -20` on it shows the element format. On this machine, one refresh_traversal of a dev app produced /tmp/macos-use/1776457209163_refresh_traversal.txt at exactly 27,343 bytes and 451 lines, plus a same-basename PNG.",
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

const summaryCode = `# What the MCP client receives (text content block, ~12 lines)
status: success
pid: 30247
app: Fazm Dev
file: /tmp/macos-use/1776457209163_refresh_traversal.txt
file_size: 27343 bytes (451 elements)
hint: grep -n 'AXButton' /tmp/macos-use/1776457209163_refresh_traversal.txt  # search by role or text
screenshot: /tmp/macos-use/1776457209163_refresh_traversal.png
summary: Refreshed PID 30247 (Fazm Dev). 451 elements, 84 visible.
visible_elements:
  [AXButton (close button)] "" x:6007 y:-2122 w:16 h:16
  [AXButton (button)] "fazm /Users/matthewdi/fazm" x:6016 y:-2082 w:49 h:18
  [AXMenuButton (menu button)] "Scary" x:6437 y:-2080 w:31 h:14
  [AXButton (button)] "Copy" x:6546 y:-2080 w:11 h:14
  ... (26 more interactive elements)`;

const buildSummaryCode = `// Sources/MCPServer/main.swift:731-884 (excerpted)
// The server writes the full tree to disk, then builds a 12-line summary.
// The summary contains just the keys the model needs to decide what to grep.

func buildCompactSummary(
    toolName: String,
    params: CallTool.Parameters,
    toolResponse: ToolResponse,
    filepath: String,          // main.swift:1828
    fileSize: Int,
    screenshotPath: String? = nil
) -> String {
    var lines: [String] = []

    // Status + identification
    let status = (toolResponse.primaryActionError != nil ||
                  toolResponse.traversalError != nil) ? "error" : "success"
    lines.append("status: \\(status)")
    if let pid = toolResponse.traversalPid {
        lines.append("pid: \\(pid)")
    }

    // File path + metadata — the handoff to the client's own grep/Read tools
    lines.append("file: \\(filepath)")
    lines.append("file_size: \\(fileSize) bytes (\\(elementCount) elements)")
    lines.append("hint: grep -n 'AXButton' \\(filepath)  # search by role or text")
    if let screenshotPath = screenshotPath {
        lines.append("screenshot: \\(screenshotPath)")
    }

    // Tool-specific one-liner (click/type/press/scroll/open/refresh)
    lines.append("summary: \\(summaryLine)")

    // Up to 30 interactive elements, 10 static text entries, 3 text diffs.
    // Everything else lives in the file on disk.
    return lines.joined(separator: "\\n")
}`;

const writeCode = `// Sources/MCPServer/main.swift:1822-1842
// What the server does between executing the tool and returning to the client.
// 1. Write the full flat-text tree to /tmp/macos-use/<ms>_<tool>.txt
// 2. Capture a PNG of the window at the same basename
// 3. Build the 12-line summary and return that as the text content block

let outputDir = "/tmp/macos-use"
try? FileManager.default.createDirectory(atPath: outputDir,
                                         withIntermediateDirectories: true)

let timestamp = Int(Date().timeIntervalSince1970 * 1000) // ms precision
let safeName = params.name.replacingOccurrences(of: "macos-use_", with: "")
let filename = "\\(timestamp)_\\(safeName).txt"
let filepath = "\\(outputDir)/\\(filename)"
try? resultTextString.write(toFile: filepath,
                            atomically: true, encoding: .utf8)

// Paired screenshot, same basename, .png extension
var screenshotPath: String? = nil
let screenshotFilename = "\\(timestamp)_\\(safeName).png"
let screenshotFilepath = "\\(outputDir)/\\(screenshotFilename)"
let screenshotPid = toolResponse.appSwitchPid ??
                    toolResponse.traversalPid ??
                    options.pidForTraversal
if let pid = screenshotPid {
    screenshotPath = captureWindowScreenshot(pid: pid,
                                             outputPath: screenshotFilepath,
                                             clickPoint: lastClickPoint,
                                             traversalWindowBounds:
                                                 toolResponse.windowBounds)
}

let summary = buildCompactSummary(toolName: params.name,
                                  params: params,
                                  toolResponse: toolResponse,
                                  filepath: filepath,
                                  fileSize: resultTextString.count,
                                  screenshotPath: screenshotPath)

return .init(content: [.text(summary)], isError: isError)`;

const realDiskTranscript = [
  { type: "command" as const, text: "# Fire one tool call at an app that has a moderate amount of UI." },
  { type: "command" as const, text: "# (Done via Claude Desktop or scripts/test_mcp.py; output lands on disk.)" },
  { type: "command" as const, text: "ls -la /tmp/macos-use/ | tail -4" },
  { type: "output" as const, text: "-rw-r--r--  1 matthewdi  wheel  158842  Apr 19 13:20  1776457209163_refresh_traversal.png" },
  { type: "output" as const, text: "-rw-r--r--  1 matthewdi  wheel   27343  Apr 19 13:20  1776457209163_refresh_traversal.txt" },
  { type: "output" as const, text: "-rw-r--r--  1 matthewdi  wheel  187014  Apr 19 13:20  1776457217931_click_and_traverse.png" },
  { type: "output" as const, text: "-rw-r--r--  1 matthewdi  wheel   27407  Apr 19 13:20  1776457217931_click_and_traverse.txt" },
  { type: "success" as const, text: "# 27 KB tree + 180 KB screenshot per call. The summary the model sees is ~0.8 KB." },
  { type: "command" as const, text: "wc -l /tmp/macos-use/1776457209163_refresh_traversal.txt" },
  { type: "output" as const, text: "     451 /tmp/macos-use/1776457209163_refresh_traversal.txt" },
  { type: "command" as const, text: "# Every line is one accessibility element. Grep by role to find a button:" },
  { type: "command" as const, text: "grep -n 'AXButton' /tmp/macos-use/1776457209163_refresh_traversal.txt | head -4" },
  { type: "output" as const, text: "11: [AXButton (close button)] x:6007 y:-2122 w:16 h:16 visible" },
  { type: "output" as const, text: "12: [AXButton (minimize button)] x:6030 y:-2122 w:16 h:16 visible" },
  { type: "output" as const, text: "15: [AXButton (button)] \"fazm /Users/matthewdi/fazm\" x:6016 y:-2082 w:49 h:18 visible" },
  { type: "output" as const, text: "17: [AXButton (button)] \"Copy\" x:6546 y:-2080 w:11 h:14 visible" },
  { type: "success" as const, text: "# Model greps exactly what it needs. It never ingests the 27 KB tree in full." },
];

const inlineExample =
  "The old-school way: return the entire accessibility tree in the JSON-RPC content block. A 27 KB dump becomes roughly 8,000 tokens the model has to read before thinking. With five tool calls in a task, that is ~40,000 tokens burned on raw DOM before any decision. Long tasks slow to a crawl, and the model runs out of room for actual reasoning, not to mention the visual layer (screenshots) never reaches the conversation because there is no budget left for it.";

const pagedExample =
  "The macos-use way: write the 27 KB tree to /tmp/macos-use/<ms>_<tool>.txt and a same-basename .png alongside. Return a 12-line summary with the path and a grep hint. Now the model pays roughly 200 tokens for the summary, and 0 tokens until it actually needs to grep the file. A five-tool task costs ~1 KB of context instead of 40 KB. The model can afford to read the screenshot too.";

const responseFieldCards = [
  {
    title: "status",
    description:
      "One of success or error. Derived from primaryActionError and traversalError at main.swift:735. The model branches on this before anything else.",
  },
  {
    title: "pid",
    description:
      "The AX PID of the target app. Needed for every follow-up click, type, press, or scroll — those tools all require pid as a parameter.",
  },
  {
    title: "app",
    description:
      "Human-readable app name from the AX traversal. Useful when the tool call caused a cross-app switch; appSwitchPid is also surfaced when present.",
  },
  {
    title: "file",
    description:
      "Absolute path to the flat-text tree, e.g. /tmp/macos-use/1776457209163_refresh_traversal.txt. The model uses Grep / Read on this, not on the summary.",
  },
  {
    title: "file_size",
    description:
      "Bytes and element count. A quick sanity check that the traversal actually captured something. Real values seen in practice: 27,343 bytes / 451 elements.",
  },
  {
    title: "hint",
    description:
      "Literal shell command: `grep -n 'AXButton' <filepath>  # search by role or text`. Tells an LLM client exactly how to consume the paged file.",
  },
  {
    title: "screenshot",
    description:
      "Path to a .png with the same basename as the .txt. Captured by captureWindowScreenshot at main.swift:378. Read the PNG to visually verify the tree.",
  },
  {
    title: "summary",
    description:
      "One-line result, tool-specific. For click_and_traverse: `Clicked element 'Open' [AXButton]. 2 added, 0 removed, 1 modified.` Built in the switch at main.swift:776.",
  },
  {
    title: "visible_elements",
    description:
      "Capped inline preview: up to 30 interactive + 10 static text entries from the viewport, emitted by buildVisibleElementsSection. Everything else lives in the file.",
  },
];

const sixToolsChecklist = [
  {
    text: "macos-use_open_application_and_traverse — opens an app by name, path, or bundle ID; returns a full traversal in the paired file. Starts most sessions.",
  },
  {
    text: "macos-use_click_and_traverse — clicks at (x, y) or by `element` text match; optionally types text and presses a key in the SAME call; returns a diff of what changed.",
  },
  {
    text: "macos-use_type_and_traverse — types into the frontmost field, with an optional pressKey afterwards. Returns a diff paired with a post-type screenshot.",
  },
  {
    text: "macos-use_press_key_and_traverse — sends a key with optional modifiers (Command, Shift, etc.). Useful for shortcuts (cmd+R, cmd+,) and navigation (Return, Escape, Tab).",
  },
  {
    text: "macos-use_scroll_and_traverse — posts a scroll wheel event at (x, y). Delta is in lines, not pixels. Needed when target elements are below the fold.",
  },
  {
    text: "macos-use_refresh_traversal — re-traverses the app without any action. Emits a full tree + screenshot. No diff; useful to re-anchor when the model is confused.",
  },
];

const comparisonRows = [
  {
    feature: "Where the tool response lives",
    competitor: "Inline in the JSON-RPC text content block",
    ours: "/tmp/macos-use/<ms>_<tool>.txt (plus .png), path returned inline",
  },
  {
    feature: "Summary the model reads first",
    competitor: "None, or a free-form blurb",
    ours: "~12-line fixed-format summary with status, file, hint, screenshot",
  },
  {
    feature: "How the model consumes large trees",
    competitor: "Full payload enters the conversation",
    ours: "Model greps the file; only the matching lines enter context",
  },
  {
    feature: "Visual ground truth",
    competitor: "Optional, usually absent",
    ours: "Same-basename PNG next to every .txt, captured via ReplayKit subprocess",
  },
  {
    feature: "Inline element cap",
    competitor: "Unbounded; real trees run 20-100 KB",
    ours: "30 interactive + 10 static text entries (main.swift:863-868)",
  },
  {
    feature: "Line format in the on-disk tree",
    competitor: "Usually verbose JSON",
    ours: "[Role] \"text\" x y w h visible — one line per element, greppable",
  },
];

const roleChips = [
  "AXButton",
  "AXLink",
  "AXTextField",
  "AXTextArea",
  "AXCheckBox",
  "AXRadioButton",
  "AXPopUpButton",
  "AXComboBox",
  "AXSlider",
  "AXMenuItem",
  "AXMenuButton",
  "AXTab",
  "AXStaticText",
  "AXImage",
  "AXGroup",
  "AXCell",
  "AXRow",
  "AXWindow",
  "AXScrollBar",
  "AXValueIndicator",
];

export default function WhatAreMcpServerPage() {
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
                Guide
              </span>
              <span className="inline-block bg-zinc-100 text-zinc-600 text-xs font-medium px-2 py-1 rounded-full">
                Protocol + response shape
              </span>
              <span className="inline-block bg-cyan-50 text-cyan-700 text-xs font-medium px-2 py-1 rounded-full font-mono">
                buildCompactSummary
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 mb-6">
              What Are MCP Servers? The Part Everyone Skips:{" "}
              <GradientText>What The Response Looks Like On Disk</GradientText>
            </h1>
            <p className="text-lg text-zinc-500 max-w-2xl mb-6">
              Every article on page one of Google tells you an MCP server is a
              JSON-RPC 2.0 process that exposes tools to an AI client and
              returns a text result. Correct, and maybe 80% of the answer for a
              remote SQL server. For an MCP server that traverses a live macOS
              app, the remaining 20% is the only interesting part: what do you
              do when the tool output is 27 KB of structured text and the
              client has a context budget? macos-use answers that by writing
              every response to{" "}
              <span className="font-mono text-sm">
                /tmp/macos-use/&lt;ms&gt;_&lt;tool&gt;.txt
              </span>{" "}
              with a same-basename{" "}
              <span className="font-mono text-sm">.png</span>, and returning a
              ~12-line summary with a <span className="font-mono text-sm">grep</span>{" "}
              hint.
            </p>
            <ArticleMeta
              datePublished={DATE_PUBLISHED}
              author="macos-use maintainers"
              readingTime="10 min read"
            />
            <div className="mt-8 flex gap-4 flex-wrap">
              <ShimmerButton href="https://github.com/mediar-ai/mcp-server-macos-use/blob/main/Sources/MCPServer/main.swift#L1822">
                Read main.swift:1822 on GitHub
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
          highlights={[
            "Response shape defined in Sources/MCPServer/main.swift:731 and 1822",
            "27,343-byte tree on disk, ~800-byte summary returned to the model",
            "Paired .txt and .png at the same millisecond timestamp, every call",
          ]}
        />

        <section className="max-w-4xl mx-auto px-6 py-16">
          <RemotionClip
            title="What an MCP server really returns"
            subtitle="The on-disk response pattern the spec never names"
            captions={[
              "A tool on macOS can produce a 27 KB accessibility tree",
              "Inline JSON-RPC would cost ~8,000 tokens per call",
              "macos-use writes the tree to /tmp/macos-use/<ms>_<tool>.txt",
              "The client gets a 12-line summary with a grep hint",
              "The model pays tokens only for the lines it actually greps",
            ]}
            accent="teal"
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            The Textbook Answer, And Why It Is Not Enough
          </h2>
          <p className="text-zinc-600 mb-4">
            MCP servers are long-running processes that speak JSON-RPC 2.0 over
            stdio or HTTP. They advertise three kinds of primitives to an AI
            client: tools (callable actions with typed arguments), resources
            (documents the server can read out), and prompts (templated
            instructions). The client picks which tools to call; the server
            executes them and returns a{" "}
            <span className="font-mono text-sm">CallTool.Result</span> with a
            content array.
          </p>
          <p className="text-zinc-600 mb-4">
            That is the answer every generic explainer gives. It is complete for
            a remote SQL server whose tool output is a paginated row count. It
            is half the answer for a server whose tool output is a live view of
            a desktop app.
          </p>
          <p className="text-zinc-600">
            On macOS, a single accessibility traversal of a moderate-sized app
            window runs 20 to 100 KB of structured text. Returning that inline
            would exhaust a meaningful slice of the client&apos;s context
            budget on every call. The design question nobody writes about is:
            how do you get 27 KB of tree data into a conversation without
            actually putting 27 KB of tree data into the conversation? macos-use
            answers that question with a specific on-disk pattern, and
            everything below is an audit of the exact bytes involved.
          </p>
        </section>

        <section className="bg-zinc-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-zinc-900 mb-4">
              What A Single Tool Call Actually Produces
            </h2>
            <p className="text-zinc-600 mb-8 max-w-2xl">
              Zoom in on one callTool. The server receives JSON-RPC on stdin,
              drives the target app through the Accessibility APIs, and fans
              its result into three artifacts: a large flat-text tree on disk,
              a paired screenshot on disk, and a compact summary returned over
              stdout. The client only reads the summary directly.
            </p>
            <AnimatedBeam
              title="One callTool, three artifacts, one summary on the wire"
              from={[
                { label: "callTool JSON-RPC in" },
                { label: "AX APIs read window tree" },
                { label: "CGEvent.post click/type/scroll" },
              ]}
              hub={{ label: "macOS MCP server" }}
              to={[
                { label: "Tree .txt on disk" },
                { label: "Screenshot .png on disk" },
                { label: "12-line summary to client" },
              ]}
              accentColor="#14b8a6"
            />
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            The Numbers That Anchor The Pattern
          </h2>
          <p className="text-zinc-600 mb-8 max-w-2xl">
            Every number below is an empirical value I measured on this repo
            today. Clone the repo, run one tool call against an app, and{" "}
            <span className="font-mono text-sm">ls -la /tmp/macos-use/</span>{" "}
            yourself. The ratios are what make the file-paging pattern worth
            the disk I/O.
          </p>
          <ShineBorder color={["#14b8a6", "#06b6d4"]} borderWidth={1.5}>
            <div className="grid grid-cols-2 md:grid-cols-4 bg-white rounded-2xl divide-x divide-y md:divide-y-0 divide-zinc-200">
              <div className="p-6">
                <div className="text-4xl font-bold text-zinc-900">
                  <NumberTicker value={27343} />
                </div>
                <div className="text-sm text-zinc-500 mt-2">
                  bytes in one real refresh_traversal.txt on my machine
                </div>
              </div>
              <div className="p-6">
                <div className="text-4xl font-bold text-zinc-900">
                  <NumberTicker value={451} />
                </div>
                <div className="text-sm text-zinc-500 mt-2">
                  accessibility elements in that single file
                </div>
              </div>
              <div className="p-6">
                <div className="text-4xl font-bold text-zinc-900">
                  <NumberTicker value={12} />
                </div>
                <div className="text-sm text-zinc-500 mt-2">
                  lines in the summary returned to the client
                </div>
              </div>
              <div className="p-6">
                <div className="text-4xl font-bold text-zinc-900">
                  <NumberTicker value={6} />
                </div>
                <div className="text-sm text-zinc-500 mt-2">
                  tools registered at main.swift:1408, every one uses this shape
                </div>
              </div>
            </div>
          </ShineBorder>
        </section>

        <section className="bg-zinc-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-zinc-900 mb-4">
              The Two Shapes A Tool Call Can Take
            </h2>
            <p className="text-zinc-600 mb-6 max-w-2xl">
              Flip the toggle to see the same tool call shaped two ways. The
              left is the shape most &quot;what is an MCP server&quot; articles
              imply. The right is what macos-use actually returns, and the only
              reason long-running agent loops stay affordable.
            </p>
            <BeforeAfter
              title="Inline payload vs. on-disk paged response"
              before={{
                label: "Inline payload (common)",
                content: inlineExample,
                highlights: [
                  "27 KB of tree text lands in the JSON-RPC content block",
                  "Roughly 8,000 tokens per tool call, before reasoning",
                  "Five calls ≈ 40,000 tokens spent on raw DOM dumps",
                  "No budget left for the paired screenshot",
                ],
              }}
              after={{
                label: "Paged response (macos-use)",
                content: pagedExample,
                highlights: [
                  "27 KB tree written to /tmp/macos-use/<ms>_<tool>.txt",
                  "PNG of the window saved at same basename, .png extension",
                  "12-line summary returned inline (~200 tokens)",
                  "Model greps only the lines it needs, pays only for those",
                ],
              }}
            />
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-6 py-16">
          <span className="inline-block bg-cyan-50 text-cyan-700 text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full mb-4">
            Anchor fact · what lands on stdout
          </span>
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            The Exact ~12 Lines The Client Reads
          </h2>
          <p className="text-zinc-600 mb-6 max-w-2xl">
            This is a real summary, emitted by macos-use for a refresh_traversal
            call against a dev app window. Line-for-line the format is
            deterministic: status, pid, app, file, file_size, hint, screenshot,
            summary, visible_elements. Everything the model needs to know
            either answers the tool call directly or points to where on disk
            the full answer lives.
          </p>
          <AnimatedCodeBlock
            code={summaryCode}
            language="bash"
            filename="stdout — CallTool.Result content[0].text"
          />
        </section>

        <ProofBanner
          quote="Don't read entire files into context — use targeted grep searches."
          source="mcp-server-macos-use/CLAUDE.md (repo root, 'MCP Response Files' section)"
          metric="27 KB → ~200 tokens"
        />

        <section className="bg-zinc-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-zinc-900 mb-4">
              What Each Field In The Summary Is For
            </h2>
            <p className="text-zinc-600 mb-6 max-w-2xl">
              Nine fixed fields, one tool-specific line, a capped
              visible_elements block. Every field earns its place, most of them
              point outward to files or subsequent tool calls.
            </p>
            <BentoGrid cards={responseFieldCards} />
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-6 py-16">
          <span className="inline-block bg-cyan-50 text-cyan-700 text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full mb-4">
            Anchor code 1 of 2 · main.swift:1822
          </span>
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            Where The File Gets Written
          </h2>
          <p className="text-zinc-600 mb-6 max-w-2xl">
            Here is the actual block, between the point where the tool
            finishes executing and the point where{" "}
            <span className="font-mono text-sm">CallTool.Result</span> returns
            over stdio. Directory creation is best-effort, the timestamp is
            millisecond-precision so concurrent calls never collide, and the
            screenshot helper is a subprocess because ReplayKit leaks framework
            state into its host.
          </p>
          <AnimatedCodeBlock
            code={writeCode}
            language="swift"
            filename="Sources/MCPServer/main.swift:1822-1842"
          />
        </section>

        <section className="bg-zinc-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <span className="inline-block bg-cyan-50 text-cyan-700 text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full mb-4">
              Anchor code 2 of 2 · main.swift:731
            </span>
            <h2 className="text-3xl font-bold text-zinc-900 mb-4">
              How The Summary Is Built
            </h2>
            <p className="text-zinc-600 mb-6 max-w-2xl">
              The function that turns the full tool response into the 12-line
              text block the client reads. It never serializes the tree; it
              only appends the fields the client needs to either act directly
              or know where to grep. Caps at 30 interactive + 10 text
              visible_elements, 3 text diffs, 60 chars per diff value.
            </p>
            <AnimatedCodeBlock
              code={buildSummaryCode}
              language="swift"
              filename="Sources/MCPServer/main.swift:731-884 (excerpted)"
            />
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            See The Files On Disk For Yourself
          </h2>
          <p className="text-zinc-600 mb-6 max-w-2xl">
            Run the MCP server, point an AI client at it, fire one tool call.
            This is the exact shell session you will see. The numbers below
            are ground truth from{" "}
            <span className="font-mono text-sm">/tmp/macos-use/</span> on my
            machine today.
          </p>
          <TerminalOutput
            title="Real bytes, real paths"
            lines={realDiskTranscript}
          />
        </section>

        <section className="bg-zinc-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-zinc-900 mb-4">
              The Path A Tool Call Takes, End To End
            </h2>
            <p className="text-zinc-600 mb-6 max-w-2xl">
              Not a list of abstract protocol phases. This is the actual
              order the macos-use handler runs, from the moment a callTool
              JSON-RPC frame arrives on stdin to the moment the summary
              returns on stdout.
            </p>
            <HorizontalStepper
              title="One callTool, six steps"
              steps={[
                {
                  title: "callTool arrives",
                  description:
                    "AI client (Claude Desktop, Cursor) sends JSON-RPC over stdio with tool name and params.",
                },
                {
                  title: "Primary action executes",
                  description:
                    "click_and_traverse posts a synthetic CGEvent; open_application launches; all guarded by InputGuard.",
                },
                {
                  title: "Accessibility tree is traversed",
                  description:
                    "AX APIs walk the target PID's windows; each element becomes one flat-text line: [Role] \"text\" x y w h visible.",
                },
                {
                  title: "Tree + screenshot written to disk",
                  description:
                    "main.swift:1822-1842 writes <ms>_<tool>.txt and shell-outs a subprocess to capture the paired .png.",
                },
                {
                  title: "Summary assembled",
                  description:
                    "buildCompactSummary at main.swift:731 appends the nine fixed fields plus a capped visible_elements block.",
                },
                {
                  title: "Text content returned",
                  description:
                    "CallTool.Result with content: [.text(summary)]. The model greps the file on demand.",
                },
              ]}
            />
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            The Six Tools, Each One Writing The Same Shape
          </h2>
          <p className="text-zinc-600 mb-6 max-w-2xl">
            The server advertises six tools via{" "}
            <span className="font-mono text-sm">ListTools</span>. Each one
            executes different input synthesis (click, type, scroll, keypress,
            app launch, or just a re-traversal), but all six funnel through the
            same response path: write the tree, capture the screenshot, build
            the summary, return it.
          </p>
          <AnimatedChecklist
            title="Every one of these returns the same ~12-line summary shape"
            items={sixToolsChecklist}
          />
        </section>

        <section className="bg-zinc-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-zinc-900 mb-6">
              Greppable Role Prefixes The Format Was Designed For
            </h2>
            <p className="text-zinc-600 mb-6 max-w-2xl">
              Every line in the on-disk tree starts with its AX role so the
              model can{" "}
              <span className="font-mono text-sm">
                grep -n &apos;AXButton&apos;
              </span>{" "}
              and get every clickable button without loading the rest. The
              prefixes worth grepping by, ordered by how often they show up in
              real apps:
            </p>
            <Marquee speed={40} pauseOnHover>
              {roleChips.map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-teal-200 text-teal-700 text-sm font-mono shadow-sm"
                >
                  {c}
                </span>
              ))}
            </Marquee>
            <p className="text-zinc-500 text-sm mt-4 max-w-2xl">
              The canonical list is defined at{" "}
              <span className="font-mono text-xs">main.swift:916-919</span> for
              the inline visible_elements cap, which is also the order the
              server biases toward when there are more than 30 interactive
              elements in one viewport.
            </p>
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-6 py-16">
          <ComparisonTable
            heading="Typical MCP server response vs. macos-use response"
            intro="Most 'what is an MCP server' guides describe the column on the left. macos-use is the column on the right. The delta is the entire point of this page."
            productName="macOS MCP"
            competitorName="Typical MCP server"
            rows={comparisonRows}
          />
        </section>

        <section className="bg-zinc-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <FaqSection items={faqItems} />
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-6 py-16">
          <InlineCta
            heading="See one file pair with your own eyes"
            body="Clone the repo, build with `swift build -c release`, point Claude Desktop at the binary, fire one tool call, then `ls -la /tmp/macos-use/`. You'll see the <ms>_<tool>.txt and <ms>_<tool>.png pair, millisecond timestamp and all."
            linkText="Open mcp-server-macos-use on GitHub"
            href="https://github.com/mediar-ai/mcp-server-macos-use"
          />
        </section>
      </article>
    </>
  );
}
