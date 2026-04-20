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
  BentoGrid,
  BeforeAfter,
  StepTimeline,
  MetricsRow,
  ComparisonTable,
  ProofBanner,
  GlowCard,
  BookCallCTA,
  RelatedPostsGrid,
  articleSchema,
  breadcrumbListSchema,
  faqPageSchema,
} from "@seo/components";

const SLUG = "macos-ai-agent-state-memory";
const URL = `https://macos-use.dev/t/${SLUG}`;
const DATE_PUBLISHED = "2026-04-20";
const DATE_MODIFIED = "2026-04-20";
const TITLE =
  "macOS AI Agent State Memory: Why macos-use Hands The LLM A File Path, Not The AX Tree";
const DESCRIPTION =
  "Most \"agent memory\" articles talk about LangGraph checkpointers, Mem0, LangMem, and vector stores. mcp-server-macos-use solves a different layer: the agent's memory of the screen. Every tool call writes the AX tree to /tmp/macos-use/<ms_timestamp>_<tool>.txt as one grep-friendly line per element, returns only a ~15-line summary plus the file path to the LLM, and ships instructions on the MCP initialize handshake that literally tell the model to Grep/Read the file instead of loading it into context. The screen lives on disk. The agent recalls it by grepping.";

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
      "macOS AI agent state memory: the filesystem is the agent's memory of the screen",
    description:
      "The LLM never sees the full AX tree. It sees a file path, a 15-line summary, and a screenshot path. macos-use writes the tree to disk as one element per line and instructs the agent to recall it with grep, not by loading it.",
  },
};

const breadcrumbItems = [
  { label: "Home", href: "https://macos-use.dev" },
  { label: "Guides", href: "https://macos-use.dev/t" },
  { label: "macOS AI agent state memory" },
];

const breadcrumbSchemaItems = [
  { name: "Home", url: "https://macos-use.dev" },
  { name: "Guides", url: "https://macos-use.dev/t" },
  { name: "macOS AI agent state memory", url: URL },
];

const faqItems = [
  {
    q: "What does macos-use mean by 'agent state memory'? Is this another LangGraph checkpointer?",
    a: "No. It is orthogonal to LangGraph, Mem0, LangMem, and vector-DB memory. Those store the agent's reasoning: message history, the AgentState dict, tool-call traces, long-term facts. macos-use stores the agent's view of the screen. After every click, type, press, scroll, open, or refresh, the MCP server writes the current accessibility tree (or a diff of it) to /tmp/macos-use/<ms_timestamp>_<tool>.txt as line-per-element flat text, captures a PNG of the target window at the same timestamp, and returns a ~15-line summary plus both file paths to the model. The LLM's short-term memory of 'what is on screen right now' is therefore a file path, not a tokenized tree. The LLM's long-term memory of 'what the screen looked like earlier' is `ls /tmp/macos-use/ | grep -i slack | tail -5`. This is the memory layer; LangGraph is a layer above it.",
  },
  {
    q: "Where exactly is this memory policy baked into the product?",
    a: "It is baked into the MCP handshake itself. main.swift:1411-1437 constructs `Server(name: \"SwiftMacOSServerDirect\", version: \"1.6.0\", instructions: ...)` and the instructions literal contains the sentence `Use Grep/Read on the file to find specific elements.` That string is sent to every MCP client during the initialize request and becomes part of the model's system context for this server. You do not need to tell the LLM how to recall UI state; the server tells it on connect. Most MCP servers either omit the instructions field or use it for ad-hoc tips. macos-use uses it to define the agent's memory-recall strategy.",
  },
  {
    q: "What is the on-disk format, and why is it one element per line?",
    a: "formatElementLine at main.swift:972-989 emits one AX element as one line: `[AXButton (button)] \"Send\" x:820 y:612 w:60 h:28 visible`. Role in brackets, truncated text in quotes, integer coordinates prefixed by x:, y:, w:, h:, then `visible` when the element is inside the window viewport. buildFlatTextResponse at main.swift:992-1048 concatenates those lines and prepends headers like `# Slack — 471 elements (0.42s)` and `# diff: +2 added, -1 removed, ~3 modified`. The shape is a deliberate grep target. `grep -n 'AXButton' <file>.txt` returns every button with its coordinates. `grep '^+' <file>.txt` returns only the added elements from the last action. The agent never reads the whole file into its context; it greps for the subsection it needs.",
  },
  {
    q: "How big is the summary the LLM actually sees per tool call?",
    a: "Small enough to fit a dozen of them in a single context window. The MCP response text contains: one status line, the PID, the app name, the full file path, the screenshot path, a visible_elements sample (up to 20 interactive plus 10 static-text lines on full traversals, up to 30 on diffs), and a one-line diff summary when applicable. Compare that against a full traversal, which for a busy app like Slack or Gmail can easily be 40 to 80 KB of text, sometimes more. The delta matters because the LLM's attention is a scarce resource. Keeping the on-wire summary short lets the model stay on the task it is actually doing and pull specific elements on demand via a second tool call (Read or Grep on the file path the summary already named).",
  },
  {
    q: "What are the + / - / ~ prefixes on diff lines?",
    a: "They map to added, removed, and modified AX elements since the last traversal. buildFlatTextResponse at main.swift:1012-1027 writes them exactly once per element. `+ [AXStaticText] \"Sending…\"` means the element appeared after the action. `- [AXButton] \"Send\"` means it disappeared. `~ [AXTextField] | AXValue: 'Hey are you free Friday' -> ''` means the value transitioned from the old string to the new one, with the attribute name and both values inline. The agent recalls 'what changed' by running `grep '^[+-~]' <latest>.txt`. It never has to reason from two full trees subtracted in-context.",
  },
  {
    q: "Is the memory persisted across agent restarts, or is it throwaway?",
    a: "It persists for the life of /tmp/macos-use/, which macOS clears on reboot and sometimes earlier. Each file is named <millisecond_timestamp>_<tool_name>.txt so the directory is an append-only chronological log of every tool call the agent made, sorted lexically by name. Equivalent to a flat-file commit log. A thousand tool calls produces a thousand .txt + .png pairs, timestamped to the millisecond. The agent can walk back in time with `ls /tmp/macos-use/ | tail -N`. For durable memory across reboots, pair it with a checkpointer on top (LangGraph, Postgres, whatever) that records file paths alongside conversation state — the filesystem holds the snapshot, the checkpointer holds the pointer.",
  },
  {
    q: "Why does the MCP response include both a .txt path and a .png path?",
    a: "Because the accessibility tree lies sometimes. An agent reading only the .txt can be fooled by a stale label, a misidentified role, or a sheet whose AXSheet ancestor was not walked. The .png is captured at the same millisecond timestamp from the same window (with a red crosshair drawn at the click point when relevant) so the agent can visually confirm the state. The convention is reinforced in the server instructions at main.swift:1417-1420: `IMPORTANT: Use the Read tool on this .png file to visually verify the screen state — the accessibility tree alone can be misleading`. Two views, same moment, same filename stem. The agent's memory of the screen is text + image, not text alone.",
  },
  {
    q: "How does this differ from naive 'dump the tree into the prompt' approaches?",
    a: "Naive approach: every turn, the agent receives the full AX tree as a tool result, fills its context with thousands of AX lines, pays the token cost, and usually re-reads elements it has already seen. macos-use approach: every turn, the agent receives a summary + path. It pulls specific elements with Grep when it needs them and leaves the rest on disk. If the user says 'click the second send button' the agent runs `grep -n 'Send' <file>.txt | head -5`, picks the row with the matching coordinates, and passes them to click_and_traverse. The tree stays on disk. The model's working memory holds only the decision, not the input to the decision.",
  },
  {
    q: "Can I inspect this manually without running the MCP loop?",
    a: "Yes. Build the binary with `xcrun --toolchain com.apple.dt.toolchain.XcodeDefault swift build`, run it with an MCP-capable client like Claude Desktop, and open a Terminal window tailing `ls -lt /tmp/macos-use/ | head`. Trigger any tool call and watch the .txt + .png pair appear within milliseconds. Run `head -1 <file>.txt` for the tree header (app name, element count, processing time), `grep '^# diff' <file>.txt` for the diff summary, and `grep -E '\\[AX(Button|TextField|Link)\\]' <file>.txt` for interactive elements. This is the same path the agent's own Grep tool follows; you are just running it by hand.",
  },
  {
    q: "Does the agent ever load the full .txt file into its context?",
    a: "Only if it decides to, and only for tiny apps. The server never inlines the full tree in the tool response. If the agent chooses to Read the file, that is a deliberate tool call with its own cost. In practice Claude and similar agents default to Grep first (`grep -n 'keyword' <file>.txt`) and only Read as a fallback, which the server instructions reinforce. For common interactive apps (Slack, Gmail, Notion, Xcode) the full .txt is larger than most models would prefer to hold in scratchpad memory, so grep-first is the sustainable pattern.",
  },
  {
    q: "Is there a risk that the agent loses track because the memory is external?",
    a: "The opposite: because memory is external and addressable by timestamp, the agent can always re-derive state by rereading the latest file. There is no drift between the agent's internal model and the true state of the machine, because the agent's model is the file, plus what the last tool call added to its summary. If the agent's context gets compressed or evicted, the screen memory does not evaporate — it is still on disk at the same paths. The loop can resume from any tool-call boundary by pointing at the newest file in /tmp/macos-use/.",
  },
  {
    q: "How does this stack with framework-level agent memory like LangGraph or Mem0?",
    a: "Stack them. LangGraph checkpoints the graph state (which node is next, what messages have been exchanged) into SQLite or Postgres. Mem0 or LangMem store long-term semantic memory (facts about the user, preferences, summaries). macos-use stores the per-action OS state. A full deployment looks like: Postgres holds conversation history, Mem0 holds learned facts about the user, /tmp/macos-use/ holds the physical screen snapshots. Each layer solves a different problem and does not contend for the same bytes. The macos-use layer is the one nobody else is solving because nobody else is driving the macOS UI at the AX level.",
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

const instructionsLiteral = `// Sources/MCPServer/main.swift:1411-1437
// The memory-recall policy is part of the MCP handshake itself.
// Every client that initializes with this server receives this
// string in its tool-listing context. The LLM learns HOW to
// remember the screen before the first tool call ever runs.

let server = Server(
    name: "SwiftMacOSServerDirect",
    version: "1.6.0",
    instructions: """
    Every tool call returns a compact text summary. Key fields:
    - file: path to the full accessibility tree (.txt).
      Use Grep/Read on the file to find specific elements.
    - screenshot: path to a PNG screenshot of the target window.
      IMPORTANT: Use the Read tool on this .png file to visually
      verify the screen state — the accessibility tree alone
      can be misleading (wrong element matches, stale data, etc.).
    - visible_elements: a sample of on-screen elements with
      coordinates.

    CRITICAL — Clicking elements:
    - NEVER estimate coordinates visually from screenshots.
    - ALWAYS get coordinates from the .txt file or pass \`element\`.
    - Each line has the format:
      [Role] "text" x:N y:N w:W h:H visible
    - Pass these x, y, w, h values directly to click_and_traverse.
    """,
    capabilities: .init(tools: .init(listChanged: true))
)`;

const flatTextFormatLiteral = `// Sources/MCPServer/main.swift:972-989
// One AX element = one line. Role bracketed, text in quotes,
// coordinates inlined. This is the grep target the agent
// navigates its memory of the screen through.

func formatElementLine(_ el: VisibleElement, prefix: String = " ") -> String {
    var parts: [String] = []
    parts.append("[\\(el.role)]")
    if let text = el.text, !text.isEmpty {
        let truncated = text.count > 80 ? String(text.prefix(80)) + "..." : text
        parts.append("\\"\\(truncated)\\"")
    }
    if let x = el.x, let y = el.y {
        parts.append("x:\\(Int(x)) y:\\(Int(y))")
    }
    if let w = el.width, let h = el.height {
        parts.append("w:\\(Int(w)) h:\\(Int(h))")
    }
    if el.in_viewport == true {
        parts.append("visible")
    }
    return "\\(prefix)\\(parts.joined(separator: " "))"
}`;

const diffPrefixLiteral = `// Sources/MCPServer/main.swift:1007-1028
// Diff file format. The agent greps '^[+-~]' to recall
// "what changed after the last action" without ever
// reading the full tree.

if let diff = toolResponse.diff {
    lines.append("# diff: +\\(diff.added.count) added, -\\(diff.removed.count) removed, ~\\(diff.modified.count) modified")
    lines.append("")
    for el in diff.added {
        lines.append(formatElementLine(el, prefix: "+ "))
    }
    for el in diff.removed {
        lines.append(formatElementLine(el, prefix: "- "))
    }
    for mod in diff.modified {
        var changeParts: [String] = []
        for change in mod.changes {
            let old = change.oldValue ?? change.removedText ?? ""
            let new = change.newValue ?? change.addedText ?? ""
            changeParts.append("\\(change.attributeName): '\\(old)' -> '\\(new)'")
        }
        lines.append("~ [\\(mod.after.role)] \\"\\(mod.after.text ?? "")\\" | \\(changeParts.joined(separator: ", "))")
    }
}`;

const recallTerminal = [
  { type: "info" as const, text: "The agent has a file path in its scratchpad. It needs the Send button's coordinates. It does not re-read the tree." },
  { type: "command" as const, text: "ls -t /tmp/macos-use/ | head -2" },
  { type: "output" as const, text: "1713644152891_click_and_traverse.txt" },
  { type: "output" as const, text: "1713644152891_click_and_traverse.png" },
  { type: "command" as const, text: "grep -nE '\\[AXButton\\].*Send' /tmp/macos-use/1713644152891_click_and_traverse.txt" },
  { type: "output" as const, text: "312:  [AXButton (button)] \"Send\" x:820 y:612 w:60 h:28 visible" },
  { type: "command" as const, text: "grep '^# ' /tmp/macos-use/1713644152891_click_and_traverse.txt" },
  { type: "output" as const, text: "# diff: +2 added, -1 removed, ~3 modified" },
  { type: "command" as const, text: "grep '^[+-~]' /tmp/macos-use/1713644152891_click_and_traverse.txt" },
  { type: "output" as const, text: "+ [AXStaticText] \"Sending…\" x:820 y:614 w:70 h:20 visible" },
  { type: "output" as const, text: "+ [AXProgressIndicator] x:902 y:620 w:14 h:14 visible" },
  { type: "output" as const, text: "- [AXButton] \"Send\" x:820 y:612 w:60 h:28" },
  { type: "output" as const, text: "~ [AXTextField] | AXValue: 'Hey are you free Friday' -> ''" },
  { type: "success" as const, text: "Four greps. Zero tree in the LLM context. Enough memory to decide the next action." },
];

const summaryShape = [
  { type: "info" as const, text: "What the LLM actually receives back from one tool call. Not the tree — the pointer." },
  { type: "output" as const, text: "status: ok" },
  { type: "output" as const, text: "pid: 18334  app: Slack" },
  { type: "output" as const, text: "file: /tmp/macos-use/1713644152891_click_and_traverse.txt" },
  { type: "output" as const, text: "screenshot: /tmp/macos-use/1713644152891_click_and_traverse.png" },
  { type: "output" as const, text: "Clicked element 'Message Matt' (AXTextArea). 2 added, 1 removed, 3 modified." },
  { type: "output" as const, text: "notable: AXTextField value: '' -> 'Hey are you free Friday'" },
  { type: "output" as const, text: "visible_elements:" },
  { type: "output" as const, text: "  [AXButton] \"Send\" x:820 y:612 w:60 h:28 visible" },
  { type: "output" as const, text: "  [AXStaticText] \"Sending…\" x:820 y:614 w:70 h:20 visible" },
  { type: "output" as const, text: "  [AXButton] \"Formatting\" x:620 y:612 w:30 h:28 visible" },
  { type: "output" as const, text: "  ... (~12 lines total)" },
];

const beamFrom = [
  { label: "click_and_traverse tool call" },
  { label: "traverseBefore AX snapshot" },
  { label: "traverseAfter AX snapshot" },
  { label: "CGWindow screenshot" },
];

const beamHub = {
  label: "MCPServer",
  sublabel: "buildFlatTextResponse + buildMcpToolSummary",
};

const beamTo = [
  { label: "LLM context: 15-line summary" },
  { label: "LLM context: file path pointer" },
  { label: "Disk: <ts>_<tool>.txt (grep target)" },
  { label: "Disk: <ts>_<tool>.png (visual check)" },
];

const memoryBento = [
  {
    title: "One element per line",
    description:
      "formatElementLine at main.swift:972 forces `[Role] \"text\" x:N y:N w:W h:H visible` on every row. Grep can slice by role, by keyword, or by coordinate range. No parser required.",
    size: "2x1" as const,
    accent: true,
  },
  {
    title: "Timestamped chronological log",
    description:
      "Filenames are `<millisecond>_<tool>.txt`. `ls /tmp/macos-use/ | tail -5` is a five-action audit trail. Lexical sort equals temporal sort.",
    size: "1x1" as const,
  },
  {
    title: "Diff prefixes for recall",
    description:
      "+ added, - removed, ~ modified. One grep (`^[+-~]`) returns only what changed since the last traversal. The LLM reads deltas, not trees.",
    size: "1x1" as const,
  },
  {
    title: "Summary is the agent's short-term memory",
    description:
      "~15 lines per response: pid, app, file path, screenshot path, diff counts, up to 30 visible elements. Everything else is one grep away.",
    size: "2x1" as const,
  },
  {
    title: "Screenshot verifies the tree",
    description:
      "Same timestamp stem writes a PNG. The server instructions tell the model to Read it whenever the tree looks suspicious.",
    size: "1x1" as const,
  },
  {
    title: "Policy ships in the handshake",
    description:
      "main.swift:1411-1437 sends 'Use Grep/Read on the file' in the initialize response. The agent knows the memory pattern before its first tool call.",
    size: "1x1" as const,
  },
];

const recallSteps = [
  {
    title: "Tool call returns a pointer",
    description:
      "The MCP response contains file=<ts>_<tool>.txt, screenshot=<ts>_<tool>.png, and a ~15-line summary. The full AX tree is on disk, not in the response.",
  },
  {
    title: "Agent decides whether it already knows enough",
    description:
      "The summary includes up to 30 visible_elements. Most turns, that is enough — the agent can pick the next action from the summary alone.",
  },
  {
    title: "If not, grep the file",
    description:
      "The model runs its Grep tool on the file path, scoped to the role or text it needs. `grep -n 'AXTextField' <file>.txt` pulls every text field with its coordinates.",
  },
  {
    title: "If the tree looks wrong, read the PNG",
    description:
      "The server's own instructions tell the model to visually verify the screen when the AX tree seems stale or mismatched. The PNG shares the filename stem, so the model reads it by swapping the extension.",
  },
  {
    title: "Recall across multiple tool calls",
    description:
      "Older screens are still on disk. `ls /tmp/macos-use/ | tail -20` gives the last 20 tool calls. The agent can reason about 'what I did three steps ago' by rereading that file, not by re-traversing the app.",
  },
];

const comparisonRows = [
  {
    feature: "What is stored",
    competitor: "Conversation turns, AgentState dict, tool-call traces",
    ours: "AX tree snapshot + diff + window PNG, per tool call",
  },
  {
    feature: "When it writes",
    competitor: "At each graph node, on a configured channel",
    ours: "After every click, type, press, scroll, open, refresh",
  },
  {
    feature: "Storage backend",
    competitor: "SQLite, Postgres, Redis, in-memory",
    ours: "Flat .txt + .png pair in /tmp/macos-use/, ms-precision",
  },
  {
    feature: "Recall pattern",
    competitor: "Resume the graph from a saved node",
    ours: "Grep the .txt by role/text/coords, Read the .png if unsure",
  },
  {
    feature: "What the LLM sees on wire",
    competitor: "Full state object or replayed history",
    ours: "~15-line summary + file path + screenshot path",
  },
  {
    feature: "Token cost per turn",
    competitor: "Scales with state size",
    ours: "Near-constant (summary is bounded by visible-element caps)",
  },
  {
    feature: "Cross-reboot durability",
    competitor: "Survives (database-backed)",
    ours: "Ephemeral (/tmp clears on reboot) — pair with a checkpointer for long-term",
  },
];

const memoryMetrics = [
  { value: 15, suffix: " lines", label: "typical summary size on wire" },
  { value: 1, label: "file path + 1 screenshot path per call" },
  { value: 3, suffix: " prefixes", label: "+ / - / ~ for grep-by-delta" },
  { value: 6, label: "tools all writing the same shape" },
];

const marqueeChips = [
  "grep -n 'AXButton'",
  "grep '^# diff'",
  "grep '^[+-~]'",
  "ls /tmp/macos-use/ | tail",
  "file + screenshot pair",
  "one element per line",
  "ms-precision timestamps",
  "handshake ships the policy",
];

const relatedPosts = [
  {
    title: "AI Agent UI State Checkpointing",
    excerpt:
      "The sibling concept: three snapshots (cursor, frontmost app, AX tree) taken around every disruptive tool call, two restored on exit.",
    href: "/t/ai-agent-ui-state-checkpointing",
    tag: "Checkpointing",
  },
  {
    title: "macOS Accessibility Tree For Agents",
    excerpt:
      "Deep dive on the diff payload shape itself: showDiff, the scroll-bar noise filter, and how the +/-/~ lines get assembled.",
    href: "/t/macos-accessibility-tree-agents",
    tag: "AX Trees",
  },
  {
    title: "What Does 'MCP Server' Mean Here",
    excerpt:
      "The receipt-pointer contract that makes this memory pattern possible: summary on the wire, artifact on disk, same filename stem.",
    href: "/t/mcp-server-means",
    tag: "MCP",
  },
];

export default function MacosAiAgentStateMemoryPage() {
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
                Grep-addressable screen memory
              </span>
              <span className="inline-block bg-zinc-100 text-zinc-600 text-xs font-medium px-2 py-1 rounded-full">
                File path, not tree, on the wire
              </span>
              <span className="inline-block bg-cyan-50 text-cyan-700 text-xs font-medium px-2 py-1 rounded-full font-mono">
                /tmp/macos-use/&lt;ts&gt;_&lt;tool&gt;.txt
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 mb-6">
              macOS AI Agent State Memory:{" "}
              <GradientText>Why macos-use Hands The LLM A File Path</GradientText>
              , Not The AX Tree
            </h1>
            <p className="text-lg text-zinc-500 max-w-2xl mb-6">
              The first page of Google for this keyword is{" "}
              <span className="text-zinc-700 font-medium">LangGraph checkpointers</span>,{" "}
              <span className="text-zinc-700 font-medium">Mem0</span>,{" "}
              <span className="text-zinc-700 font-medium">LangMem</span>, and vector
              stores. Those articles solve the agent&apos;s memory of{" "}
              <em>its own reasoning</em>. macos-use solves the agent&apos;s memory of{" "}
              <em>your mac</em>. Every tool call writes the AX tree to{" "}
              <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-xs font-mono text-zinc-800">
                /tmp/macos-use/&lt;ts&gt;_&lt;tool&gt;.txt
              </code>{" "}
              as one grep-friendly line per element, returns only a ~15-line
              summary plus the file path to the model, and ships instructions
              on the MCP initialize handshake that literally tell the LLM to{" "}
              <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-xs font-mono text-zinc-800">
                Grep/Read
              </code>{" "}
              the file rather than load it into context. The screen lives on
              disk. The agent remembers it by grepping.
            </p>
            <ArticleMeta
              datePublished={DATE_PUBLISHED}
              author="macos-use maintainers"
              readingTime="12 min read"
            />
            <div className="mt-8 flex gap-4 flex-wrap">
              <ShimmerButton href="https://github.com/mediar-ai/mcp-server-macos-use/blob/main/Sources/MCPServer/main.swift#L1411">
                Read the handshake at main.swift:1411
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
            "Memory policy baked into the MCP initialize handshake at main.swift:1411-1437",
            "One AX element = one grep-friendly line (main.swift:972-989)",
            "~15-line summary + file path on wire; full tree on disk, never inline",
          ]}
        />

        <section className="max-w-4xl mx-auto px-6 py-16">
          <RemotionClip
            title="The agent's memory of your mac is a file path"
            subtitle="Not tokens. Not a tree. A pointer plus a 15-line summary."
            captions={[
              "Write the AX tree to disk, one element per line",
              "Capture a PNG of the target window at the same ms",
              "Return a 15-line summary + both paths to the model",
              "Ship 'use Grep/Read' in the MCP handshake itself",
              "The agent recalls state by grepping, not by reloading",
            ]}
            accent="teal"
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4" id="the-memory-serp-is-the-wrong-memory">
            The SERP For &quot;macOS AI Agent State Memory&quot; Is Answering The
            Wrong Question
          </h2>
          <p className="text-zinc-600 mb-4">
            Every top result for this keyword is a variation on one of three
            themes. LangGraph checkpointers persisting{" "}
            <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-xs font-mono">
              AgentState
            </code>{" "}
            across nodes so a graph can resume after a crash. Vector-store
            articles (Mem0, LangMem, Zep, Letta) on how to store long-term
            semantic facts about the user. Short-term versus long-term memory
            taxonomies from the usual platform blogs. All of it is about the
            agent remembering <em>its own reasoning</em>.
          </p>
          <p className="text-zinc-600 mb-4">
            If you are driving the macOS UI with an agent, that is the wrong
            layer. Your problem is not &quot;what did the model discuss with
            the user six turns ago&quot;. Your problem is &quot;what is
            actually on the screen right now, and how does the model see it
            cheaply&quot;. Pumping the full AX tree into context after every
            action works once, and then it bankrupts your token budget as soon
            as the user opens Slack or Xcode.
          </p>
          <p className="text-zinc-600">
            macos-use solves the screen-memory layer. The agent never sees the
            tree directly. It sees a file path pointing at the tree, a ~15-line
            sample of visible elements, a diff summary, and a matching PNG
            path. Everything else stays on disk. The product&apos;s own MCP
            handshake teaches the model the recall pattern before the first
            tool call ever fires.
          </p>
        </section>

        <section className="max-w-4xl mx-auto px-6 py-10">
          <ProofBanner
            quote="Use Grep/Read on the file to find specific elements. NEVER estimate coordinates visually from screenshots."
            source="main.swift:1416, 1429 — verbatim from the instructions literal sent on MCP initialize"
            metric="handshake"
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4" id="the-policy-ships-with-the-server">
            The Memory-Recall Policy Ships In The MCP Handshake
          </h2>
          <p className="text-zinc-600 mb-6">
            Most MCP servers either leave{" "}
            <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-xs font-mono">
              instructions
            </code>{" "}
            empty or use it for ad-hoc usage tips. macos-use uses it to
            prescribe how the agent should recall UI state. The sentence
            &quot;Use Grep/Read on the file to find specific elements&quot; is
            in the server constructor at main.swift:1411-1437. Every MCP client
            sees it during the initialize request, and it becomes part of the
            model&apos;s system context for this server. You do not need to
            write a system prompt explaining the memory model — the server
            already told the model.
          </p>
          <AnimatedCodeBlock
            code={instructionsLiteral}
            language="swift"
            filename="Sources/MCPServer/main.swift"
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <AnimatedBeam
            title="One tool call. Two outputs for the LLM. Two outputs on disk."
            from={beamFrom}
            hub={beamHub}
            to={beamTo}
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4" id="one-element-per-line">
            One AX Element = One Grep-Friendly Line
          </h2>
          <p className="text-zinc-600 mb-6">
            The disk format is deliberate. Every AX element gets exactly one
            line, with role in brackets, truncated text in quotes, and integer
            coordinates inlined. That is what makes the tree grep-addressable
            instead of parse-required. The agent never parses — it slices by
            role, by substring, by the{" "}
            <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-xs font-mono">
              visible
            </code>{" "}
            suffix, or by the diff prefix.
          </p>
          <AnimatedCodeBlock
            code={flatTextFormatLiteral}
            language="swift"
            filename="Sources/MCPServer/main.swift"
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4" id="recall-by-grep">
            How The Agent Actually Recalls State
          </h2>
          <p className="text-zinc-600 mb-6">
            Four greps do the work that a naive agent would do by asking the
            MCP server for the full tree again. The agent&apos;s scratchpad
            holds only the file path from the last tool call. It runs Grep,
            picks the line it wants, and passes the coordinates into the next
            tool call. The tree never enters the model&apos;s context window.
          </p>
          <TerminalOutput
            title="Recall the Send button without re-reading the tree"
            lines={recallTerminal}
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4" id="diff-prefixes">
            The + / - / ~ Prefixes Are The Delta Index
          </h2>
          <p className="text-zinc-600 mb-6">
            For every action that mutates state — click, type, press, scroll —
            the server writes a diff file instead of a full traversal. Three
            prefixes: <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-xs font-mono">+</code> for
            added,{" "}
            <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-xs font-mono">-</code>{" "}
            for removed,{" "}
            <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-xs font-mono">~</code>{" "}
            for modified. The agent runs{" "}
            <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-xs font-mono">
              grep &apos;^[+-~]&apos; &lt;file&gt;.txt
            </code>{" "}
            and gets exactly the changes from the last action. No subtraction
            in context. No re-reading the pre-state.
          </p>
          <AnimatedCodeBlock
            code={diffPrefixLiteral}
            language="swift"
            filename="Sources/MCPServer/main.swift"
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-6">
          <Marquee speed={42} fade pauseOnHover>
            {marqueeChips.map((c, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-2 px-4 py-2 mx-2 rounded-full border border-teal-200 bg-teal-50 text-teal-700 text-sm font-mono whitespace-nowrap"
              >
                {c}
              </span>
            ))}
          </Marquee>
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4" id="what-the-llm-sees">
            What The LLM Actually Sees, Per Turn
          </h2>
          <p className="text-zinc-600 mb-6">
            Bounded. On the order of 15 lines for most calls, capped by the
            visible-element sampler before it hits the wire. Compare against a
            full traversal for a busy app, which can run 40 to 80 KB of text.
            The summary is the model&apos;s short-term memory of the screen;
            the file path on the summary is the hook into its long-term
            memory. Short-term is free. Long-term is one grep away.
          </p>
          <TerminalOutput
            title="One MCP response, as the model sees it"
            lines={summaryShape}
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6" id="memory-design-principles">
            Six Design Choices That Make The Memory Cheap
          </h2>
          <BentoGrid cards={memoryBento} />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <MetricsRow metrics={memoryMetrics} />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6" id="five-steps-of-recall">
            Five Steps Of A Single Recall
          </h2>
          <StepTimeline steps={recallSteps} />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4" id="naive-vs-grep-addressed">
            Naive Tree-In-Context vs. Grep-Addressed Disk Memory
          </h2>
          <p className="text-zinc-600 mb-6">
            The contrast is stark on any busy app. Toggle between the two
            patterns below.
          </p>
          <BeforeAfter
            title="Two ways an agent can 'remember' the screen"
            before={{
              label: "Naive: full tree in context every turn",
              content:
                "Each tool call returns the entire AX tree as its result text. The agent pastes it into its reasoning, pays the token cost, and does it again next turn. Slack alone can be 40 to 80 KB per turn. Ten turns and the context is full of stale trees.",
              highlights: [
                "Token cost scales with screen complexity",
                "Model context fills up fast on busy apps",
                "No efficient way to ask 'what changed since last turn'",
                "Stale copies linger in context across turns",
              ],
            }}
            after={{
              label: "macos-use: file path + 15-line summary",
              content:
                "Each tool call returns a compact summary and two file paths. The agent greps the .txt for specific elements and reads the .png only if the tree looks suspicious. The full tree never enters the context window unless the model explicitly chooses to Read it.",
              highlights: [
                "Bounded response size per tool call",
                "Delta recall via grep '^[+-~]'",
                "Chronological log via ls /tmp/macos-use/ | tail",
                "Screenshot available at the same filename stem",
              ],
            }}
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <GlowCard>
            <div className="p-6">
              <h3 className="text-xl font-semibold text-zinc-900 mb-2">
                The anchor fact, verbatim
              </h3>
              <p className="text-zinc-600 mb-3">
                The phrase &quot;Use Grep/Read on the file to find specific
                elements&quot; is on line 1416 of{" "}
                <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-xs font-mono">
                  Sources/MCPServer/main.swift
                </code>
                . It sits inside the multi-line string literal passed as{" "}
                <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-xs font-mono">
                  instructions
                </code>{" "}
                to the{" "}
                <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-xs font-mono">
                  Server(name: &quot;SwiftMacOSServerDirect&quot;, version:
                  &quot;1.6.0&quot;, ...)
                </code>{" "}
                constructor at line 1411. Every MCP client this server talks to
                receives that string during the handshake. That is where the
                agent&apos;s memory-recall policy lives: not in a prompt, not
                in docs, but in the protocol response the LLM sees on connect.
              </p>
              <p className="text-zinc-600">
                You can verify by cloning the repo, opening main.swift, and
                jumping to line 1411. You can verify at runtime by connecting
                any MCP client with protocol logging enabled and watching the{" "}
                <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-xs font-mono">
                  initialize
                </code>{" "}
                result — the string is right there in the response body.
              </p>
            </div>
          </GlowCard>
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <ComparisonTable
            heading="Framework Agent Memory vs. macos-use Screen Memory"
            intro="Stack them, do not substitute them. LangGraph/Mem0 solves one layer; macos-use solves a different one."
            productName="macos-use (/tmp/macos-use/)"
            competitorName="Framework memory (LangGraph / Mem0 / LangMem)"
            rows={comparisonRows}
          />
        </section>

        <BookCallCTA
          appearance="footer"
          destination="https://cal.com/team/mediar/macos-use"
          site="macOS MCP"
          heading="Want a grep-addressable memory layer for your agent's macOS loop?"
          description="Fifteen minutes on a call to see how macos-use plugs under your existing LangGraph or Claude Agent SDK stack without rewriting the upper layers."
        />

        <FaqSection items={faqItems} />

        <section className="max-w-6xl mx-auto px-6 py-16">
          <RelatedPostsGrid
            title="Adjacent deep dives on the same repo"
            subtitle="Layers you can stack with this one"
            posts={relatedPosts}
          />
        </section>

        <BookCallCTA
          appearance="sticky"
          destination="https://cal.com/team/mediar/macos-use"
          site="macOS MCP"
          description="See macos-use drive your mac from your agent loop in under 15 minutes."
        />
      </article>
    </>
  );
}
