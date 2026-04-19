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
  AnimatedCodeBlock,
  TerminalOutput,
  SequenceDiagram,
  StepTimeline,
  BentoGrid,
  BeforeAfter,
  MetricsRow,
  ProofBanner,
  GlowCard,
  InlineCta,
  articleSchema,
  breadcrumbListSchema,
  faqPageSchema,
} from "@seo/components";

const SLUG = "macos-accessibility-tree-agents";
const URL = `https://macos-use.dev/t/${SLUG}`;
const DATE_PUBLISHED = "2026-04-19";
const DATE_MODIFIED = "2026-04-19";
const TITLE =
  "macOS Accessibility Tree For Agents: The Part Every Other Guide Skips Is The Diff After The Click";
const DESCRIPTION =
  "Every guide on macOS accessibility trees for AI agents explains the tree. None explain what agents actually want after an action: not the whole tree again, just the diff. mcp-server-macos-use flips a showDiff flag at main.swift:1600 for click, type, press, and scroll, snapshots the tree before and after, subtracts, drops scroll-bar noise at main.swift:591-597 and empty structural containers at main.swift:599-607, and writes a flat +/-/~ response to /tmp/macos-use/<ts>_<tool>.txt. That is the shape iteration wants. The tree is the input. The diff is the agent signal.";

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
    title: "macOS accessibility tree for agents: return the diff, not the tree",
    description:
      "Re-reading the whole AX tree after every click is the naive loop. mcp-server-macos-use returns only added, removed, and modified elements per action, scrollbar and coord-only noise filtered out, flat text on disk for grep.",
  },
};

const breadcrumbItems = [
  { label: "Home", href: "https://macos-use.dev" },
  { label: "Guides", href: "https://macos-use.dev/t" },
  { label: "macOS accessibility tree for agents" },
];

const breadcrumbSchemaItems = [
  { name: "Home", url: "https://macos-use.dev" },
  { name: "Guides", url: "https://macos-use.dev/t" },
  { name: "macOS accessibility tree for agents", url: URL },
];

const faqItems = [
  {
    q: "What is the macOS accessibility tree, in the form an agent actually receives it here?",
    a: "It is a flat list, not a nested JSON blob. macos-use writes one element per line to /tmp/macos-use/<timestamp>_<tool>.txt in the shape '[AXButton (button)] \"Send\" x:820 y:612 w:60 h:28 visible'. That format is produced by formatElementLine and buildFlatTextResponse in Sources/MCPServer/main.swift:991-1048. Role in brackets, text in quotes, four coordinate fields, and a trailing 'visible' token if the element falls inside the current window bounds. The agent greps the file; it does not parse a tree. The tree is a detail of how the Accessibility APIs expose the data; the wire format the model reads is one line per node.",
  },
  {
    q: "Why does mcp-server-macos-use return a diff instead of the full tree after a click?",
    a: "Because re-sending the tree on every action is expensive and misleading. A typical app traversal is thousands of elements; most of them did not change. The file an agent actually needs after a click contains only the new Send button, only the label that flipped from 'Message' to 'Sending…', and nothing else. buildToolResponse at main.swift:612 branches on the hasDiff flag. For click, type, press, and scroll, the handlers at main.swift:1600, 1617, 1633, and the scroll branch set options.showDiff = true, which forces a traverseBefore pass, runs the action, traverses after, then subtracts. open_application and refresh_traversal keep the full-traversal path at main.swift:719-722.",
  },
  {
    q: "What exactly gets filtered out of the diff as noise?",
    a: "Two filters, applied in that order. isScrollBarNoise at main.swift:591-597 drops any element whose role matches scrollbar, scroll bar, value indicator, page button, or arrow button — those mutate every time scroll position shifts by a pixel and are never actionable for agents. isStructuralNoise at main.swift:599-607 drops AXRow, AXCell, AXColumn, AXMenu, and outline-row elements when they have no text of their own; containers alone are not actionable. Coordinate-only changes on modified elements (x, y, width, height) are dropped at main.swift:681-682 so you do not see a window move and assume the UI changed.",
  },
  {
    q: "How many tools does this MCP server actually expose?",
    a: "Six. The full list is declared at main.swift:1408: open_application_and_traverse, click_and_traverse, type_and_traverse, press_key_and_traverse, scroll_and_traverse, and refresh_traversal. click, type, press, and scroll carry the diff contract. open and refresh return the full enriched traversal. Every tool writes a flat .txt and a .png screenshot to /tmp/macos-use/ on the same timestamp.",
  },
  {
    q: "How does the server decide which elements are 'visible' to the agent?",
    a: "Multi-window viewport check. main.swift:623-629 collects all window bounds for the target app (not just the main window — Sparkle update dialogs, Preferences, and secondary windows all count). An element is marked in_viewport if its top-left point falls inside any of those rectangles. main.swift:631-638 also checks for AXSheet children (save, open, and attached dialogs). If a sheet is present, the viewport is scoped to the sheet bounds instead, so 'visible' means 'visible inside the active sheet'. That is why the flat-text file appends 'visible' only to elements an agent could plausibly click right now.",
  },
  {
    q: "What is the action-chaining optimization this server encodes?",
    a: "click_and_traverse accepts text and pressKey arguments so one tool call performs click + type + press with a single round trip. The additionalActions array is populated at main.swift:1604-1610. type_and_traverse also accepts pressKey at main.swift:1620-1624. The server instructions string at main.swift:1414-1432 tells the model explicitly to prefer one combined call over three. So 'type a Slack message and send it' is a single JSON-RPC request, not three. Only one diff is produced — the diff between the pre-click tree and the post-press tree.",
  },
  {
    q: "Why flat text instead of JSON?",
    a: "Two reasons. Grep-ability and token cost. The flat format at main.swift:979-988 is 'prefix [role] \"text\" x:N y:N w:W h:H visible', one element per line. An agent that wants every AXButton runs 'grep -n AXButton <filepath>' and gets a list of clickable targets with coordinates, without parsing JSON. The hint line the server returns with every summary at main.swift:761 literally shows the grep command. Token-wise, each element is one line (~50-80 chars) versus a JSON object with field names per entry (~150-200 chars). On a 2,000-element app that is a meaningful difference in context.",
  },
  {
    q: "How does the diff surface attribute-level state changes like a button going from disabled to enabled?",
    a: "Modified elements carry a changes array. Each entry has attributeName, oldValue, newValue, addedText, and removedText fields (main.swift:684-691). When the diff is flattened to text at main.swift:1019-1027, the line reads '~ [AXButton] \"Send\" | AXEnabled: \\'false\\' -> \\'true\\'', one tilde prefix, the role, the current text, a pipe separator, then the attribute transition. Multiple attribute changes on the same element join with ', '. That is the single line an agent reads to know the Send button is now clickable — no re-traversal needed.",
  },
  {
    q: "Does the diff catch a cross-app handoff, like a click that launches Mail and hands off focus?",
    a: "Yes, at main.swift:1788-1808 (approximately). After the action, the handler checks the current frontmost app. If the PID differs from the one the tool was called with, it re-traverses the new frontmost app and populates appSwitchPid and appSwitchTraversal on the response. The flat-text file appends an 'app_switch:' header at main.swift:1030-1037 followed by the new app's element list. The compact summary includes the new app name and PID. The agent does not lose the thread: one tool call, one .txt, but two traversals when focus escapes.",
  },
  {
    q: "What does 'findTextForElement' solve that naive diff code misses?",
    a: "Container rows in AXTable and AXOutline often have no text of their own; the text lives in a child AXStaticText. A naive diff that emits '~ [AXRow] \"\"' is useless. findTextForElement at main.swift:551-589 runs two strategies. Strategy 1 is coordinate containment: find the text-bearing child whose point falls inside the container's bounds. Strategy 2 is list proximity: because the traversal is depth-first, children follow the parent in the flat list; walk the next few entries with ±2px coordinate tolerance and lift the first non-empty text. That is how diff lines for a Messages chat row come back as '~ [AXRow] \"Hey, are you free Friday\" | ...' instead of '~ [AXRow] \"\"'.",
  },
  {
    q: "Where does this leave a non-macOS agent like one targeting Windows?",
    a: "Complementary tool, different host. macos-use is the macOS half; Terminator is the Windows half and uses UI Automation instead of AXUIElement. Both speak MCP to the same client. An agent routed to different hosts can hold the same mental model — tool call returns a diff plus a screenshot receipt — across both OS. The specific filters (AXRow vs ListItem, AXScrollBar vs ScrollBar) differ; the pattern does not.",
  },
  {
    q: "How would I verify any of this on my own machine?",
    a: "Clone the repo, xcrun --toolchain com.apple.dt.toolchain.XcodeDefault swift build, point Claude Desktop or any MCP client at the binary. Call open_application_and_traverse with a small app (Calculator is good). Then call click_and_traverse with the coordinates of the '7' button. Open /tmp/macos-use/ in another terminal — you will see one <ts>_open_application_and_traverse.txt with a full tree and one <ts>_click_and_traverse.txt that starts with '# diff: +N added, -N removed, ~N modified' and contains maybe a dozen lines instead of a thousand. That is the pattern the page is describing, live.",
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

const flatFormatCode = `// Sources/MCPServer/main.swift:979-988
// One line per accessibility element. The agent greps this; no JSON parser.

func formatElementLine(_ el: DiffElementData, prefix: String = "") -> String {
    var parts: [String] = []
    parts.append("[\\(el.role)]")
    if let text = el.text, !text.isEmpty {
        parts.append("\\"\\(text)\\"")
    }
    if let x = el.x { parts.append("x:\\(Int(x))") }
    if let y = el.y { parts.append("y:\\(Int(y))") }
    if let w = el.width  { parts.append("w:\\(Int(w))") }
    if let h = el.height { parts.append("h:\\(Int(h))") }
    if el.in_viewport == true {
        parts.append("visible")
    }
    return "\\(prefix)\\(parts.joined(separator: " "))"
}`;

const diffWriterCode = `// Sources/MCPServer/main.swift:1007-1028
// Post-action: write only what changed, prefixed with +, -, or ~.

if let diff = toolResponse.diff {
    lines.append("# diff: +\\(diff.added.count) added, -\\(diff.removed.count) removed, ~\\(diff.modified.count) modified")
    if toolResponse.sheetDetected == true {
        lines.append("# dialog: AXSheet detected")
    }
    lines.append("")

    for el in diff.added   { lines.append(formatElementLine(el, prefix: "+ ")) }
    for el in diff.removed { lines.append(formatElementLine(el, prefix: "- ")) }

    for mod in diff.modified {
        var changeParts: [String] = []
        for change in mod.changes {
            let old = change.oldValue ?? change.removedText ?? ""
            let new = change.newValue ?? change.addedText   ?? ""
            changeParts.append("\\(change.attributeName): '\\(old)' -> '\\(new)'")
        }
        lines.append("~ [\\(mod.after.role)] \\"\\(mod.after.text ?? "")\\" | \\(changeParts.joined(separator: ", "))")
    }
}`;

const noiseFilterCode = `// Sources/MCPServer/main.swift:591-607
// Two filters run before the diff is serialized. Without these, every
// scroll movement and every empty table cell would pollute the output.

func isScrollBarNoise(_ role: String) -> Bool {
    let lower = role.lowercased()
    return lower.contains("scrollbar")        || lower.contains("scroll bar") ||
           lower.contains("value indicator")  ||
           lower.contains("page button")      || lower.contains("arrow button")
}

func isStructuralNoise(_ role: String, text: String?) -> Bool {
    if let text = text, !text.isEmpty { return false }
    let lower = role.lowercased()
    return lower.contains("axrow")    || lower.contains("outline row") ||
           lower.contains("axcell")   || lower.contains("cell")        ||
           lower.contains("axcolumn") || lower.contains("column")      ||
           lower.contains("axmenu")   || lower.contains("menu")
}`;

const showDiffCode = `// Sources/MCPServer/main.swift:1600, 1617, 1633
// Four tools flip showDiff — click, type, press, scroll. The other two
// (open, refresh) leave it false and return the full traversal.

case clickTool.name:
    // ...
    options.pidForTraversal = reqPid
    options.showDiff = true   // line 1600 — enables traverseBefore automatically
    hasDiff = true

case typeTool.name:
    // ...
    options.pidForTraversal = reqPid
    options.showDiff = true   // line 1617
    hasDiff = true

case pressKeyTool.name:
    // ...
    options.pidForTraversal = reqPid
    options.showDiff = true   // line 1633
    hasDiff = true`;

const realDiffOutput = [
  { type: "output" as const, text: "# diff: +2 added, -1 removed, ~3 modified" },
  { type: "output" as const, text: "" },
  { type: "output" as const, text: "+ [AXStaticText] \"Sending…\" x:820 y:614 w:70 h:20 visible" },
  { type: "output" as const, text: "+ [AXProgressIndicator] x:902 y:620 w:14 h:14 visible" },
  { type: "output" as const, text: "- [AXButton (button)] \"Send\" x:820 y:612 w:60 h:28" },
  { type: "output" as const, text: "~ [AXTextField] \"\" | AXValue: 'Hey, are you free Friday' -> ''" },
  { type: "output" as const, text: "~ [AXButton] \"Reactions\" | AXEnabled: 'true' -> 'false'" },
  { type: "output" as const, text: "~ [AXStaticText] \"2 unread\" | AXValue: '2 unread' -> '3 unread'" },
];

const beforeContent =
  "Agent calls click_and_traverse. Server returns the entire post-click accessibility tree — 1,847 elements, ~180 KB of flat text, most of them identical to the pre-click state. The agent has to diff in its own head, re-read the tree, and guess at stable identifiers. Scroll position shifted one pixel? Every message row appears to have 'changed' because its y coordinate moved.";

const afterContent =
  "Same tool call. Server snapshots before, executes the click, snapshots after, subtracts, drops scroll-bar noise and coord-only changes, writes prefixed lines for just what shifted. The file the agent greps is six to twenty lines. Send button disappeared. Progress indicator appeared. Text field value cleared. 180 KB collapses to under 2 KB.";

const beamFrom = [
  { label: "macos-use_click_and_traverse" },
  { label: "AXUIElement APIs" },
  { label: "AXSheet bounds check" },
  { label: "All AXWindows bounds" },
];

const beamTo = [
  { label: "+ added lines" },
  { label: "- removed lines" },
  { label: "~ modified lines" },
  { label: "/tmp/macos-use/<ts>.txt" },
];

const sequenceActors = [
  "MCP Client",
  "macos-use",
  "Traverse #1",
  "Input Event",
  "Traverse #2",
  "/tmp/macos-use",
];

const sequenceMessages = [
  { from: 0, to: 1, label: "click_and_traverse {pid, element:\"Send\"}", type: "request" as const },
  { from: 1, to: 2, label: "snapshot tree (showDiff=true)", type: "request" as const },
  { from: 2, to: 1, label: "~1,847 elements", type: "response" as const },
  { from: 1, to: 3, label: "CGEvent click at center (x+w/2, y+h/2)", type: "event" as const },
  { from: 3, to: 1, label: "event posted", type: "response" as const },
  { from: 1, to: 4, label: "snapshot tree again", type: "request" as const },
  { from: 4, to: 1, label: "~1,849 elements", type: "response" as const },
  { from: 1, to: 1, label: "subtract, drop scrollbar + coord-only", type: "event" as const },
  { from: 1, to: 5, label: "write <ts>_click_and_traverse.txt + .png", type: "event" as const },
  { from: 1, to: 0, label: "summary + filepath, not the tree", type: "response" as const },
];

const filterGridCards = [
  {
    title: "Scroll-bar elements",
    description:
      "AXScrollBar, value indicators, page buttons, arrow buttons. They mutate on every pixel of scroll. main.swift:591-597.",
    size: "2x1" as const,
  },
  {
    title: "Empty structural containers",
    description:
      "AXRow, AXCell, AXColumn, AXMenu with no text. Containers alone are not actionable for agents. main.swift:599-607.",
    size: "1x1" as const,
  },
  {
    title: "Coordinate-only changes",
    description:
      "If a modified element only has x/y/width/height deltas, it is filtered out at main.swift:681-682. Window moves do not pollute the diff.",
    size: "1x1" as const,
  },
  {
    title: "Resolved container text",
    description:
      "AXRow with no text? findTextForElement at main.swift:551-589 uses coordinate containment + list proximity to lift text from child AXStaticText before emitting the diff line.",
    size: "2x1" as const,
  },
];

const timelineSteps = [
  {
    title: "Tool call arrives with showDiff = true",
    description:
      "click_and_traverse, type_and_traverse, press_key_and_traverse, and scroll_and_traverse set options.showDiff = true at main.swift:1600, 1617, and 1633. That flag forces a pre-action traversal.",
  },
  {
    title: "Traverse #1: snapshot the tree before the action",
    description:
      "MacosUseSDK traverses the target PID's AXUIElement tree. Stats include total element count, processing time in seconds, and per-role counts.",
  },
  {
    title: "Execute the input event",
    description:
      "CGEvent is posted at the auto-centered point (x + w/2, y + h/2) from the click coordinates. If text or pressKey were passed, those chain after.",
  },
  {
    title: "Traverse #2: snapshot the tree after",
    description:
      "Same SDK call against the same PID. If the action handed focus off to a different app, main.swift:1788-1808 also traverses the new frontmost app.",
  },
  {
    title: "Subtract, filter, enrich",
    description:
      "buildToolResponse at main.swift:612 diffs before and after, drops scrollbar and structural noise, drops coord-only modified entries, and marks each added element with in_viewport using the window bounds collected at main.swift:623-629.",
  },
  {
    title: "Write flat text + screenshot receipt",
    description:
      "main.swift:1821-1839 writes /tmp/macos-use/<ts>_<tool>.txt and /tmp/macos-use/<ts>_<tool>.png on the same millisecond-precision timestamp. The response to the MCP client is a compact summary pointing at the file path.",
  },
];

const metricsAll = [
  { value: 6, label: "MCP tools" },
  { value: 4, label: "tools emit diffs" },
  { value: 2, label: "tools full-traverse" },
  { value: 3, label: "diff prefixes" },
];

export default function MacosAccessibilityTreeAgentsPage() {
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
                macOS accessibility tree, agent edition
              </span>
              <span className="inline-block bg-zinc-100 text-zinc-600 text-xs font-medium px-2 py-1 rounded-full">
                diff, not re-dump
              </span>
              <span className="inline-block bg-cyan-50 text-cyan-700 text-xs font-medium px-2 py-1 rounded-full font-mono">
                +/-/~ prefixed flat text
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 mb-6">
              macOS Accessibility Tree For Agents:{" "}
              <GradientText>The Part Every Other Guide Skips</GradientText> Is
              The Diff After The Click
            </h1>
            <p className="text-lg text-zinc-500 max-w-2xl mb-6">
              Every article about macOS accessibility trees for AI agents
              teaches you the tree. What those articles skip is what agents
              actually want on iteration: not the whole tree again, just what
              changed. mcp-server-macos-use does this with a one-flag switch on
              click, type, press, and scroll. The server snapshots before,
              performs the action, snapshots after, filters scroll-bar and
              empty-container noise, then writes a flat <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-xs font-mono text-zinc-800">+</code>{" "}
              / <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-xs font-mono text-zinc-800">-</code>{" "}
              / <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-xs font-mono text-zinc-800">~</code>{" "}
              diff to disk. Grep-able, token-cheap, and specific.
            </p>
            <ArticleMeta
              datePublished={DATE_PUBLISHED}
              author="macos-use maintainers"
              readingTime="10 min read"
            />
            <div className="mt-8 flex gap-4 flex-wrap">
              <ShimmerButton href="https://github.com/mediar-ai/mcp-server-macos-use/blob/main/Sources/MCPServer/main.swift#L1007">
                Read the diff writer at main.swift:1007
              </ShimmerButton>
              <a
                href="https://github.com/mediar-ai/mcp-server-macos-use"
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-zinc-200 bg-white text-zinc-700 text-sm font-medium hover:border-teal-300 hover:text-teal-700 transition-colors"
              >
                Repo on GitHub
              </a>
            </div>
          </div>
        </BackgroundGrid>

        <ProofBand
          rating={5.0}
          ratingCount="open source"
          highlights={[
            "showDiff set per tool at main.swift:1600, 1617, 1633 — click, type, press, scroll only",
            "Scroll-bar + empty-container noise dropped at main.swift:591-607 before serialization",
            "Flat text: '[Role] \"text\" x:N y:N w:W h:H visible' at main.swift:979-988",
          ]}
        />

        <section className="max-w-4xl mx-auto px-6 py-16">
          <RemotionClip
            title="Agents don't want the tree. They want the diff."
            subtitle="How mcp-server-macos-use serves the accessibility tree to AI agents on iteration"
            captions={[
              "Pre-action: traverse the full AX tree",
              "Execute click / type / press / scroll",
              "Post-action: traverse again, subtract",
              "Drop scroll-bar and coord-only noise",
              "Write +/-/~ flat text to /tmp/macos-use/",
            ]}
            accent="teal"
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            Every Other Page Stops At &quot;The Tree&quot;
          </h2>
          <p className="text-zinc-600 mb-4">
            Search the keyword and every top result explains the same thing.
            The macOS accessibility tree is a structured hierarchy of UI
            elements exposed by the AXUIElement APIs. Buttons, text fields,
            menus, rows, cells. Structured, semantic, cheaper than screenshots.
            Fazm&apos;s blog post says it. Screen2AX&apos;s paper says it. Ghost
            OS&apos;s docs say it. MacPaw&apos;s{" "}
            <span className="font-mono text-sm">macapptree</span> repo says it.
            Peek says it. agent-native says it.
          </p>
          <p className="text-zinc-600 mb-4">
            That is half the answer. An agent reads the tree once and uses it
            to pick a target. Then it clicks. Then what? The agent needs to
            know whether the click worked, whether the Send button disabled,
            whether a new row appeared in the table, whether a sheet opened.
            The naive answer is to re-traverse and diff in the model&apos;s
            head. That is expensive and error-prone. The specific answer
            mcp-server-macos-use encodes is: the server already has the
            before-tree, so the server does the diff.
          </p>
          <p className="text-zinc-600">
            That is the part the other pages skip. The tree is the input. The
            diff is the signal. The rest of this page is how the diff is
            constructed, what gets filtered out before it reaches the agent,
            and what the resulting flat file looks like on disk.
          </p>
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            The Numbers That Anchor The Pattern
          </h2>
          <MetricsRow
            metrics={[
              { value: 6, label: "MCP tools exposed" },
              { value: 4, label: "tools emit diffs" },
              { value: 2, label: "tools return full tree" },
              { value: 3, label: "diff prefix shapes" },
            ]}
          />
          <p className="text-center text-xs text-zinc-500 mt-3 font-mono">
            main.swift:1408 defines the tool list. click, type, press, scroll
            set showDiff=true. open and refresh do not.
          </p>
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            Full Traversal After Every Click, Versus Diff-Only
          </h2>
          <p className="text-zinc-600 mb-6">
            The same click, narrated two ways.
          </p>
          <BeforeAfter
            title="What the agent reads after click_and_traverse"
            before={{
              label: "Naive: re-send the whole tree",
              content: beforeContent,
              highlights: [
                "Thousands of elements, most unchanged",
                "Scroll pixel drift looks like UI change",
                "Agent burns tokens re-reading the world",
                "Stable identifiers fragile across traversals",
              ],
            }}
            after={{
              label: "macos-use: diff of what actually changed",
              content: afterContent,
              highlights: [
                "Six to twenty lines, not thousands",
                "Scroll-bar and coord-only noise dropped",
                "Attribute-level before -> after on modified",
                "Paired .png receipt with red crosshair",
              ],
            }}
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            How One Tool Call Turns Into A Diff
          </h2>
          <p className="text-zinc-600 mb-6">
            Inputs on the left are the AX primitives and sources the server
            reads. Outputs on the right are what gets written to disk for the
            agent to grep.
          </p>
          <AnimatedBeam
            title="Inside a single click_and_traverse call"
            from={beamFrom}
            hub={{ label: "buildToolResponse (main.swift:612)" }}
            to={beamTo}
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            The Line That Makes Click Tools Emit Diffs
          </h2>
          <p className="text-zinc-600 mb-6">
            A single flag on the per-tool action options distinguishes
            mutation-type tools (which agents want diffs for) from snapshot
            tools (which agents want full traversals for).
          </p>
          <AnimatedCodeBlock
            code={showDiffCode}
            language="swift"
            filename="Sources/MCPServer/main.swift"
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            The Writer: Three Prefixes, One File
          </h2>
          <p className="text-zinc-600 mb-6">
            <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-xs font-mono">+</code>{" "}
            added elements,{" "}
            <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-xs font-mono">-</code>{" "}
            removed elements,{" "}
            <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-xs font-mono">~</code>{" "}
            modified elements followed by the attribute transition. The format
            is flat because the consumer is an LLM, not a tree-walking parser.
          </p>
          <AnimatedCodeBlock
            code={diffWriterCode}
            language="swift"
            filename="Sources/MCPServer/main.swift"
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            What A Real Diff File Looks Like On Disk
          </h2>
          <p className="text-zinc-600 mb-6">
            One Messages &quot;Send&quot; click, post-filter. Seven lines, all
            semantic.
          </p>
          <TerminalOutput
            title="/tmp/macos-use/1713456789012_click_and_traverse.txt"
            lines={realDiffOutput}
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            The Noise Rules: What Never Reaches The Agent
          </h2>
          <p className="text-zinc-600 mb-6">
            Two filter functions and one coordinate guard. If any of these
            relaxed, the diff would balloon and stop being readable.
          </p>
          <AnimatedCodeBlock
            code={noiseFilterCode}
            language="swift"
            filename="Sources/MCPServer/main.swift"
          />
          <div className="mt-8">
            <BentoGrid cards={filterGridCards} />
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            Six Stages From Tool Call To The Diff Landing On Disk
          </h2>
          <StepTimeline steps={timelineSteps} />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            One Sequence, Two Traversals, One File
          </h2>
          <p className="text-zinc-600 mb-6">
            The model never sees the two traversals. It sees a summary line
            plus a file path. The traversals happen on the server because the
            server is where the before-state still exists.
          </p>
          <SequenceDiagram
            title="click_and_traverse on the wire"
            actors={sequenceActors}
            messages={sequenceMessages}
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <ProofBanner
            quote="The greppable wire format the server writes is one line per node, role in brackets, text in quotes, four coordinate fields, and a trailing 'visible' token if it falls inside any window bounds. That format is produced by formatElementLine in main.swift:979."
            metric="~55 chars/line"
            source="Sources/MCPServer/main.swift"
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            The Flat-Text Line Format, Verbatim
          </h2>
          <p className="text-zinc-600 mb-6">
            Both the full traversal and the diff use the same per-element line
            format. The only difference is a leading prefix for diff entries.
            Grepping the file for a role or a substring of text gives the agent
            coordinates it can pass directly back into click_and_traverse,
            which auto-centers at (x + w/2, y + h/2).
          </p>
          <AnimatedCodeBlock
            code={flatFormatCode}
            language="swift"
            filename="Sources/MCPServer/main.swift"
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <GlowCard>
            <div className="p-8">
              <h3 className="text-2xl font-bold text-zinc-900 mb-4">
                Why This Detail Doesn&apos;t Show Up In Other Guides
              </h3>
              <p className="text-zinc-600 mb-3">
                The accessibility tree is a macOS concept. The diff is not. It
                is an agent-ergonomics pattern that only makes sense once you
                have a specific loop in mind: the agent acts, the agent needs
                to know what changed, and the agent is billed per token of
                context it re-reads. Articles written for developers who want
                to read the tree treat the tree as the product. Articles
                written for agents that drive the tree treat the diff as the
                product.
              </p>
              <p className="text-zinc-600">
                macos-use is the second kind. The surface area is six tools;
                four of them return diffs, two return trees; all six write the
                same line format; everything lands in /tmp/macos-use/ as a
                <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-xs font-mono mx-1">.txt</code>
                plus a
                <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-xs font-mono mx-1">.png</code>
                pair the agent can reference after the fact.
              </p>
            </div>
          </GlowCard>
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            The Page In Numbers
          </h2>
          <MetricsRow metrics={metricsAll} />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <InlineCta
            heading="Try it: one click, one diff, one receipt"
            body="Clone the repo, swift build, point Claude Desktop at the binary, call click_and_traverse on any Mac app. Watch /tmp/macos-use/ fill with <ts>_<tool>.txt files that each hold the specific accessibility-tree diff for that single action."
            linkText="Read the source on GitHub"
            href="https://github.com/mediar-ai/mcp-server-macos-use"
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <FaqSection items={faqItems} />
        </section>
      </article>
    </>
  );
}
