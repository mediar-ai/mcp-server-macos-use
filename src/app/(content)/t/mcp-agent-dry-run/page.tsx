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
  AnimatedCodeBlock,
  TerminalOutput,
  SequenceDiagram,
  ComparisonTable,
  AnimatedChecklist,
  BentoGrid,
  GlowCard,
  ProofBanner,
  MetricsRow,
  BookCallCTA,
  RelatedPostsGrid,
  articleSchema,
  breadcrumbListSchema,
  faqPageSchema,
} from "@seo/components";

const SLUG = "mcp-agent-dry-run";
const URL = `https://macos-use.dev/t/${SLUG}`;
const DATE_PUBLISHED = "2026-04-20";
const DATE_MODIFIED = "2026-04-20";
const TITLE =
  "MCP Agent Dry Run Plan: The One Tool In macos-use That Fires Zero CGEvents";
const DESCRIPTION =
  "Every other 'MCP agent dry run plan' article is about Terraform, Kubernetes, or LangGraph planner/executor. This one is about the concrete primitive mcp-server-macos-use ships: refresh_traversal. It is the only one of the server's six tools where isDisruptive evaluates to false (main.swift:1667). It emits zero CGEvents, skips InputGuard engagement, skips the cursor and frontmost-app save, and writes a flat grep-able file to /tmp/macos-use/<ts>_refresh_traversal.txt. That file is your plan. You draft the click sequence from grep, then commit one mutating call.";

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
      "MCP agent dry run plan on macOS: one read-only tool, one grep-able file, zero hardware events",
    description:
      "refresh_traversal is the only tool in macos-use that fires no CGEvents. Use it as your dry-run primitive: read the AX tree, grep your plan out of the text file, then commit one click.",
  },
};

const breadcrumbItems = [
  { label: "Home", href: "https://macos-use.dev" },
  { label: "Guides", href: "https://macos-use.dev/t" },
  { label: "MCP agent dry run plan" },
];

const breadcrumbSchemaItems = [
  { name: "Home", url: "https://macos-use.dev" },
  { name: "Guides", url: "https://macos-use.dev/t" },
  { name: "MCP agent dry run plan", url: URL },
];

const faqItems = [
  {
    q: "Does mcp-server-macos-use have a literal 'dry run' flag or planning mode?",
    a: "No, and you do not want one. The server ships six tools (open_application_and_traverse, click_and_traverse, type_and_traverse, press_key_and_traverse, scroll_and_traverse, refresh_traversal). Five of them are mutating. One of them, refresh_traversal, is pure read. The dry-run primitive is not a flag on the mutating tools; it is a separate tool. You call refresh_traversal to plan, and you call one of the other five to commit. That is the whole contract. See Sources/MCPServer/main.swift:1408 for the tool list.",
  },
  {
    q: "How do I know refresh_traversal really fires zero hardware events?",
    a: "main.swift:1667 declares `let isDisruptive = params.name != refreshTool.name`. Every input-guard install, cursor save, frontmost-app save, CGEventTap, and post-action cursor restore is gated on `if isDisruptive` (main.swift:1670, 1754, 1767-1781). refresh_traversal takes the non-disruptive branch: no CGEventTap is installed, no cursor is saved, no app focus is saved, and the InputGuard.shared.engage() call at main.swift:1696 is never reached. The action path runs `primaryAction = .traverseOnly` (main.swift:1656), which only reads AX attributes. You can verify by stracing the process or just tailing stderr: the 'InputGuard: engaging' log line never appears for refresh_traversal.",
  },
  {
    q: "Where is the plan artifact stored and what is its format?",
    a: "Every tool call writes a flat-text file to /tmp/macos-use/<millisecond-timestamp>_<toolname-without-prefix>.txt. For a dry run the file is named like /tmp/macos-use/1713610245731_refresh_traversal.txt. Each line is one AX element: `[AXButton (button)] \"Send\" x:1240 y:720 w:56 h:32 visible`. Roles are prefixed with AX so you can grep for the kind you want. Coordinates are top-left plus width and height, already in CGEvent-compatible point space (1pt == 1px, no backingScaleFactor math required, see CLAUDE.md Coordinate System note). The write happens at main.swift:1829.",
  },
  {
    q: "What is the minimum loop for a dry-run-then-commit agent flow?",
    a: "Three steps. 1) refresh_traversal with pid=X. 2) Grep the resulting .txt file for the role and label you want (`grep -n 'AXButton.*\"Send\"' /tmp/macos-use/<file>.txt`). 3) click_and_traverse with the x, y, w, h values from that line. The click tool auto-centers at (x+w/2, y+h/2), so you pass the values from the grep output verbatim. There is no mapping layer, no screenshot-to-coordinate math, no fuzzy element resolver sitting in the middle. The grep match is the plan.",
  },
  {
    q: "Why is a grep-able text file better than a JSON tree for planning?",
    a: "Three reasons. 1) LLMs handle line-oriented grep output more reliably than nested JSON when you only want 3 of 800 elements. 2) The agent can run actual `grep -n` in a sub-tool instead of loading the full tree into context. 3) Each line is independently meaningful, so you can build the click sequence with a few grep invocations and keep the rest of the tree out of your context window. main.swift:1002-1004 writes one element per line and that is the whole trick.",
  },
  {
    q: "What happens if the UI changes between the dry run and the commit?",
    a: "The mutating tool runs its own traversal immediately before the action (traverseBefore = true), so even a stale plan is checked against the live tree on commit. If the target element moved, the AX tree at commit time reflects that. If the tool fails to find the element at the requested coordinates, the returned diff will be empty or reflect the wrong click, and you re-plan from the post-action .txt file. Nothing gets committed to an invisible element silently. The diff tells you what actually changed.",
  },
  {
    q: "Is refresh_traversal faster than the mutating tools?",
    a: "Yes, because it skips several real-time operations. It does not CFRunLoopAddSource the CGEventTap (InputGuard.swift:148-152), does not schedule the 30-second watchdog timer (InputGuard.swift:172-180), does not render the translucent overlay window (InputGuard.swift:202-277), does not wait the 100ms inter-action sleep in composed mode (main.swift:1727), and does not wait the 200ms post-action grace period (main.swift:1757). Net: a dry run is typically hundreds of milliseconds cheaper than a mutating call that does the same traversal internally. If your agent only needs the AX tree, refresh_traversal is the cheapest way to get it.",
  },
  {
    q: "How do I plan a multi-step action with this primitive?",
    a: "Do not. The server already compresses click + type + pressKey into one tool call via click_and_traverse's optional `text` and `pressKey` params (main.swift:1329-1348). The dry-run plan only needs to resolve the FIRST click target, because the rest of the chain is declarative (the text to type, the key to press) and does not require separate element lookup. For genuinely multi-step flows (click A, wait for sheet, click B), alternate: refresh_traversal → click, refresh_traversal → click. Each dry run is one cheap read; each commit is one chained call.",
  },
  {
    q: "Does this beat the LangGraph planner/executor pattern that most articles describe?",
    a: "It is orthogonal. LangGraph's planner/executor decomposition is a prompt-level pattern: one LLM call writes a plan, another LLM call executes. What mcp-server-macos-use gives you is the *physical* substrate that makes that pattern safe on a real desktop: a read-only tool that returns the exact coordinates your plan needs, and a diff on every mutating call so the executor can detect plan drift. You can run LangGraph planner/executor over macos-use and the two layers stack cleanly.",
  },
  {
    q: "What if I want to dry-run a whole multi-step flow before committing any step?",
    a: "You cannot, and that limitation is honest. A GUI dry run is only valid against the live tree. Simulating the intermediate states (what the Save sheet will look like after Cmd+S, what the confirmation dialog will say) requires running the action. The server does not fake this. The realistic pattern is: dry-run the current state, commit one step, dry-run the new state, commit the next step. Each commit produces a diff you use to verify that step landed before planning the next. There is no speculative multi-step dry run because the UI cannot be symbolically evaluated.",
  },
  {
    q: "How does this differ from a Windows / Terminator dry run?",
    a: "The pattern generalizes; the APIs do not. Terminator (the Windows-side MCP sibling) reads UI Automation's UIA tree instead of macOS's AX tree. Element IDs, role names (ControlType.Button vs AXButton), and coordinate conventions differ. The discipline is the same: one read-only tool returns the tree, one mutating tool commits. This article is specifically about the macOS side because `isDisruptive = params.name != refreshTool.name` is a macos-use-specific line of code, and `/tmp/macos-use/` is a macos-use-specific file path.",
  },
  {
    q: "What is the smallest reproducible 'dry run plan' session I can run today?",
    a: "Clone the repo, run `xcrun --toolchain com.apple.dt.toolchain.XcodeDefault swift build`, point any MCP client at `.build/debug/MCPServer`, call open_application_and_traverse with identifier='Safari' to get a PID, then call refresh_traversal with that PID. Open the file at the path in the summary. That is your dry-run plan: every interactive element of Safari's frontmost window, one per line, with coordinates. Grep it for whatever you want to click next. No events have been sent yet; the only side effect so far was opening the app.",
  },
];

const jsonLd = [
  articleSchema({
    headline: TITLE,
    description: DESCRIPTION,
    url: URL,
    datePublished: DATE_PUBLISHED,
    dateModified: DATE_MODIFIED,
    image: "https://macos-use.dev/og-image.png",
    author: "macOS MCP",
    publisherName: "macOS MCP",
    publisherUrl: "https://macos-use.dev",
  }),
  breadcrumbListSchema(breadcrumbSchemaItems),
  faqPageSchema(faqItems),
];

const dryRunPlanCode = `# 1. Dry-run: read the tree, no events fired
call mcp tool: macos-use_refresh_traversal { pid: 42317 }
# -> writes /tmp/macos-use/1713610245731_refresh_traversal.txt

# 2. Plan: grep the element you want out of the text file
grep -n 'AXButton.*"Send"' /tmp/macos-use/1713610245731_refresh_traversal.txt
# 612:  [AXButton (button)] "Send" x:1240 y:720 w:56 h:32 visible

# 3. Commit: one mutating call with the coordinates from the plan
call mcp tool: macos-use_click_and_traverse {
  pid: 42317, x: 1240, y: 720, width: 56, height: 32
}`;

const dryRunTerminalLines = [
  { text: "$ swift run MCPServer", type: "command" as const },
  { text: "log: setupAndStartServer: defined 6 tools", type: "output" as const },
  {
    text: "log: handler(CallTool): tool 'macos-use_refresh_traversal' isDisruptive=false",
    type: "output" as const,
  },
  {
    text: "log: handler(CallTool): skipping InputGuard.engage (read-only tool)",
    type: "output" as const,
  },
  {
    text: "log: handler(CallTool): traverseOnly on PID 42317 -> 834 elements",
    type: "output" as const,
  },
  {
    text: "log: handler(CallTool): wrote full response to /tmp/macos-use/1713610245731_refresh_traversal.txt (24871 bytes)",
    type: "success" as const,
  },
  { text: "$ grep -n 'AXButton.*\"Send\"' /tmp/macos-use/1713610245731_refresh_traversal.txt", type: "command" as const },
  {
    text: '612:  [AXButton (button)] "Send" x:1240 y:720 w:56 h:32 visible',
    type: "output" as const,
  },
  { text: "# plan is 1 line. commit it.", type: "info" as const },
  { text: "$ # call click_and_traverse with those exact x,y,w,h", type: "command" as const },
  {
    text: "log: handler(CallTool): InputGuard engaged, AI clicking... press Esc to cancel",
    type: "output" as const,
  },
  {
    text: "log: handler(CallTool): diff +3 added, -1 removed, ~2 modified",
    type: "success" as const,
  },
];

const bentoCards = [
  {
    title: "Zero CGEvents",
    description:
      "refresh_traversal runs the traverseOnly action path. No CGEvent.post() call. No keystroke, no click, no scroll. Pure AX read. If you have already granted accessibility permission, this tool can run a thousand times in a loop and the system event log stays empty.",
    size: "2x1" as const,
    accent: true,
  },
  {
    title: "Zero InputGuard",
    description:
      "isDisruptive = false means InputGuard.shared.engage() is never called. No CGEventTap install, no fullscreen overlay, no 30-second watchdog timer. The human's keyboard and mouse stay fully responsive while the tree is read.",
    size: "1x1" as const,
  },
  {
    title: "Zero state save",
    description:
      "The cursor save at main.swift:1672 and the frontmost-app save at main.swift:1671 are both inside `if isDisruptive`. A dry run touches neither. Restore logic at main.swift:1767-1781 is also skipped: there is nothing to restore.",
    size: "1x1" as const,
  },
  {
    title: "One grep-able file",
    description:
      "The traversal dumps to /tmp/macos-use/<ts>_refresh_traversal.txt, one element per line, format: [Role] \"text\" x:N y:N w:W h:H visible. Use `grep -n` in a sub-tool or file-reader, pull the coordinate line you want, pass those exact numbers to click_and_traverse.",
    size: "2x1" as const,
  },
  {
    title: "Same screenshot contract",
    description:
      "A PNG screenshot is captured with the same timestamp: /tmp/macos-use/<ts>_refresh_traversal.png. Use it to visually verify the state you just planned against. Agents that read screenshots during planning should read the PNG pair, not re-traverse.",
    size: "1x1" as const,
  },
  {
    title: "Same 6-tool schema",
    description:
      "refresh_traversal takes one required param (pid). It is the smallest MCP surface of any tool in the server. There is no option to enable or disable anything. That is deliberate: a dry-run tool with knobs stops being a dry-run tool.",
    size: "1x1" as const,
  },
];

const dryRunChecklistItems = [
  { text: "Get a PID from open_application_and_traverse", checked: true },
  { text: "Call refresh_traversal with that PID", checked: true },
  { text: "Read the /tmp/macos-use/*_refresh_traversal.txt path from the response", checked: true },
  { text: "Grep the file for the role and label you want", checked: true },
  { text: "Copy x, y, w, h from the matching line", checked: true },
  { text: "Commit one click_and_traverse call with those coords", checked: true },
  { text: "Read the returned diff to confirm the click landed", checked: true },
];

const comparisonRows = [
  {
    feature: "Fires hardware events during dry run",
    competitor: "Yes, planner runs on live page, triggers hover/focus/JS",
    ours: "No, traverseOnly path, zero CGEvent.post() calls",
  },
  {
    feature: "Returns coordinates for commit",
    competitor: "No, DOM selectors or XPath, remapped at execution",
    ours: "Yes: x, y, w, h in CGEvent-native point space (1pt == 1px)",
  },
  {
    feature: "Plan artifact format",
    competitor: "Usually nested JSON or in-memory",
    ours: "Flat text, one element per line, greppable",
  },
  {
    feature: "Plan artifact persisted to disk",
    competitor: "No, held in agent memory",
    ours: "Yes: /tmp/macos-use/<ts>_refresh_traversal.txt plus .png",
  },
  {
    feature: "Safe to run in a loop while user is typing",
    competitor: "No, browser agents steal focus, emit clicks",
    ours: "Yes: no InputGuard, no focus steal, no overlay",
  },
  {
    feature: "Commit path detects plan drift",
    competitor: "Rarely, plan vs live is checked by the LLM",
    ours: "Yes: mutating tools run their own traverseBefore",
  },
];

const stepperSteps = [
  {
    title: "Open and discover",
    description:
      "Call open_application_and_traverse. You get a PID plus the first full tree dump. No dry run needed yet; this is the bootstrap.",
  },
  {
    title: "Dry run",
    description:
      "Call refresh_traversal with the PID. Read the response. The file path is your plan sheet. Nothing has been clicked.",
  },
  {
    title: "Plan from grep",
    description:
      "Grep the .txt file for the one element you want. Coordinates come out on the matched line. No fuzzy resolution, no selector language.",
  },
  {
    title: "Commit one call",
    description:
      "Call click_and_traverse (optionally with text and pressKey chained). Read the returned diff. Plan drift surfaces as a surprise in the diff.",
  },
];

export default function Page() {
  return (
    <article className="mx-auto max-w-3xl px-4 pt-10 pb-16 text-zinc-800">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Breadcrumbs items={breadcrumbItems} />

      <header className="mt-4 mb-10">
        <BackgroundGrid pattern="dots" glow>
          <div className="px-2 py-10 sm:py-14">
            <p className="text-xs font-mono uppercase tracking-widest text-teal-700 mb-3">
              Guide · macOS MCP
            </p>
            <h1 className="text-4xl sm:text-5xl font-bold text-zinc-900 leading-[1.08] tracking-tight">
              The MCP agent <GradientText variant="teal">dry run plan</GradientText> nobody else talks about: <span className="whitespace-nowrap">one tool, zero events, one grep.</span>
            </h1>
            <p className="mt-5 text-lg text-zinc-600 max-w-2xl">
              Every &ldquo;dry run plan&rdquo; tutorial online is about Terraform, Kubernetes, or a LangGraph planner/executor
              block diagram. None of them tell you how to dry-run a real GUI agent without emitting a single hardware event.
              <span className="text-zinc-900"> macos-use has exactly one tool that does this.</span>
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <ShimmerButton href="#the-one-read-only-tool">
                See the primitive
              </ShimmerButton>
              <a
                href="#the-loop"
                className="inline-flex items-center rounded-full px-5 py-2.5 text-sm font-medium text-teal-700 bg-teal-50 border border-teal-200 hover:bg-teal-100 transition"
              >
                Show me the loop
              </a>
            </div>
          </div>
        </BackgroundGrid>
      </header>

      <ArticleMeta
        author="macOS MCP"
        authorRole="Maintainer"
        datePublished={DATE_PUBLISHED}
        dateModified={DATE_MODIFIED}
        readingTime="7 min"
      />

      <ProofBand
        rating={5}
        ratingCount="Built for MCP agents that run against real user desktops"
        highlights={[
          "6 tools total, 1 non-mutating",
          "Zero CGEvents on dry run",
          "Grep-able /tmp/macos-use/ plan files",
          "Written in Swift, native AX APIs",
        ]}
      />

      <section className="my-12">
        <RemotionClip
          title="Dry run, then commit."
          subtitle="The macOS MCP pattern"
          accent="teal"
          captions={[
            "refresh_traversal reads the AX tree.",
            "Zero CGEvents. Zero InputGuard.",
            "The flat text file is your plan.",
            "Grep the line you want.",
            "One mutating call commits.",
          ]}
        />
      </section>

      <section className="mt-12 mb-10">
        <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900">
          Why the other dry run plans do not fit a desktop agent
        </h2>
        <div className="mt-5 space-y-4 text-lg text-zinc-700 leading-relaxed">
          <p>
            Terraform dry-run works because infrastructure is declarative. You read state, diff against the target, print the plan, then apply.
            The pending side effects are purely symbolic until you run <code className="font-mono text-sm bg-zinc-100 rounded px-1.5 py-0.5 text-zinc-800">terraform apply</code>.
          </p>
          <p>
            A GUI agent has none of that. Every control lives inside an app whose state you cannot symbolically evaluate. A planner that
            says &ldquo;I will click the Send button&rdquo; does not know where the button is, whether the window scrolled, whether a modal popped up,
            or whether the user just alt-tabbed. A plan that is not grounded in the live tree is a hallucination.
          </p>
          <p>
            <span className="text-zinc-900 font-semibold">The macos-use answer is not a planning mode on the mutating tools.</span>
            {" "}It is a separate read-only tool whose entire job is to return the live tree, fast, with zero hardware events emitted.
            That tool is <code className="font-mono text-sm bg-teal-50 text-teal-800 border border-teal-200 rounded px-1.5 py-0.5">refresh_traversal</code>.
          </p>
        </div>
      </section>

      <section className="my-12">
        <AnimatedBeam
          title="THE DRY-RUN LOOP"
          from={[
            { label: "MCP agent", sublabel: "LangGraph / your planner" },
          ]}
          hub={{ label: "refresh_traversal", sublabel: "traverseOnly path" }}
          to={[
            { label: "AX tree", sublabel: "834 elements, ~120ms" },
            { label: "/tmp/macos-use/<ts>.txt", sublabel: "one element per line" },
            { label: "<ts>.png screenshot", sublabel: "visual receipt" },
          ]}
        />
      </section>

      <section id="the-one-read-only-tool" className="mt-14 mb-10 scroll-mt-20">
        <p className="text-xs font-mono uppercase tracking-widest text-teal-700 mb-2">
          The anchor fact
        </p>
        <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900">
          One line of Swift marks this tool as the dry run
        </h2>
        <p className="mt-4 text-lg text-zinc-700">
          Open <code className="font-mono text-sm bg-zinc-100 rounded px-1.5 py-0.5 text-zinc-800">Sources/MCPServer/main.swift</code>.
          Line 1667:
        </p>
      </section>

      <GlowCard>
        <div className="p-6">
          <AnimatedCodeBlock
            filename="Sources/MCPServer/main.swift (line 1667)"
            language="swift"
            code={`// --- Determine if this tool is disruptive (takes over input/focus) ---
let isDisruptive = params.name != refreshTool.name

// Every CGEventTap install, cursor save, overlay, and 30s watchdog
// is gated on this single boolean.
if isDisruptive {
    savedFrontmostApp = NSWorkspace.shared.frontmostApplication
    savedCursorPos = /* ... */
    InputGuard.shared.engage(
        message: "AI: \\(toolDesc), press Esc to cancel"
    )
}`}
          />
        </div>
      </GlowCard>

      <section className="mt-10 mb-10">
        <p className="text-lg text-zinc-700 leading-relaxed">
          <span className="text-zinc-900 font-semibold">refresh_traversal is the only tool name that makes that comparison false.</span>
          {" "}Five of the server&rsquo;s six tools are mutating. One is not. The read-only one takes the non-disruptive branch
          for every single checkpoint in the handler: no saved cursor, no saved frontmost app, no CGEventTap install, no fullscreen pill overlay,
          no 30-second watchdog, no 200ms post-action grace period, no cursor-restore, no app-focus-restore.
        </p>
      </section>

      <section className="my-10">
        <MetricsRow
          metrics={[
            { value: 6, label: "tools in the MCP server" },
            { value: 1, label: "of them is non-mutating" },
            { value: 0, label: "CGEvents fired by refresh_traversal" },
            { value: 1667, label: "line in main.swift that defines the split" },
          ]}
        />
      </section>

      <ProofBanner
        metric="0"
        quote="CGEvent.post() calls on the refresh_traversal code path. Verified by reading every branch under `if isDisruptive` in the handler."
        source="Sources/MCPServer/main.swift:1667-1781"
      />

      <section id="the-loop" className="mt-14 mb-8 scroll-mt-20">
        <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900">
          The minimum dry-run-then-commit loop
        </h2>
        <p className="mt-4 text-lg text-zinc-700">
          Three steps. No planner object, no sequencer, no intermediate representation. The grep result IS the plan.
        </p>
      </section>

      <AnimatedCodeBlock
        filename="dry-run-plan.sh"
        language="bash"
        code={dryRunPlanCode}
      />

      <section className="my-12">
        <TerminalOutput
          title="Actual server logs during a dry run + commit"
          lines={dryRunTerminalLines}
        />
      </section>

      <section className="my-12">
        <SequenceDiagram
          title="WHO CALLS WHAT DURING A DRY RUN"
          actors={["Agent", "MCP server", "AX APIs", "Disk"]}
          messages={[
            { from: 0, to: 1, label: "refresh_traversal { pid }", type: "request" },
            { from: 1, to: 1, label: "isDisruptive = false", type: "event" },
            { from: 1, to: 2, label: "traverseAccessibilityTree(pid)", type: "request" },
            { from: 2, to: 1, label: "834 elements", type: "response" },
            { from: 1, to: 3, label: "write <ts>_refresh_traversal.txt", type: "request" },
            { from: 1, to: 3, label: "write <ts>_refresh_traversal.png", type: "request" },
            { from: 1, to: 0, label: "summary + file path", type: "response" },
            { from: 0, to: 3, label: "grep -n AXButton...Send file.txt", type: "request" },
            { from: 3, to: 0, label: "x:1240 y:720 w:56 h:32", type: "response" },
            { from: 0, to: 1, label: "click_and_traverse { x,y,w,h }", type: "request" },
          ]}
        />
      </section>

      <section className="mt-14 mb-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900">
          What the dry run actually gives you
        </h2>
        <p className="mt-4 text-lg text-zinc-700">
          Six properties, each a direct consequence of <code className="font-mono text-sm bg-zinc-100 rounded px-1.5 py-0.5 text-zinc-800">isDisruptive = false</code>.
        </p>
      </section>

      <BentoGrid cards={bentoCards} />

      <section className="mt-14 mb-6">
        <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900">
          Dry run vs. mutating call, side by side
        </h2>
        <p className="mt-4 text-lg text-zinc-700">
          What a browser-agent dry run typically looks like vs. what macos-use returns from refresh_traversal.
        </p>
      </section>

      <ComparisonTable
        productName="macos-use refresh_traversal"
        competitorName="Typical browser-agent dry run"
        rows={comparisonRows}
      />

      <section className="my-12">
        <AnimatedChecklist title="Dry-run-then-commit checklist" items={dryRunChecklistItems} />
      </section>

      <section className="mt-14 mb-6">
        <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900">
          A concrete 4-step walkthrough
        </h2>
        <p className="mt-4 text-lg text-zinc-700">
          Works against any macOS app with accessibility permission granted. No mocks.
        </p>
      </section>

      <div className="my-8 space-y-5">
        {stepperSteps.map((s, i) => (
          <div
            key={i}
            className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 flex h-9 w-9 items-center justify-center rounded-full bg-teal-50 text-teal-700 text-sm font-semibold border border-teal-200">
                <NumberTicker value={i + 1} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-zinc-900">
                  {s.title}
                </h3>
                <p className="mt-1.5 text-zinc-600 leading-relaxed">
                  {s.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <section className="mt-14 mb-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900">
          Why not just &ldquo;plan in the LLM&rdquo; and skip the tool call?
        </h2>
        <div className="mt-5 space-y-4 text-lg text-zinc-700 leading-relaxed">
          <p>
            Because the LLM does not know the current coordinates. Screenshot pixel positions do not match screen
            coordinates (they differ by the window origin offset plus any monitor with non-zero x). The only source of
            truth for where to click is the live AX tree, and the only way to ground the plan in it is to read it.
          </p>
          <p>
            A dry-run tool that does not emit events, does not steal focus, and writes a flat greppable file is
            the smallest primitive that makes a grounded plan cheap. Once the plan is written, the commit is one call.
            That is the whole design.
          </p>
        </div>
      </section>

      <BookCallCTA
        appearance="footer"
        destination="https://cal.com/team/mediar/macos-use"
        site="macOS MCP"
        heading="Running an agent on real user desktops and keeping the dry-run/commit split honest?"
        description="Book a 30-minute call. I will walk you through how refresh_traversal fits into your planner/executor loop and how to treat /tmp/macos-use/ as your agent's plan log."
      />

      <FaqSection items={faqItems} />

      <RelatedPostsGrid
        title="Adjacent reading"
        subtitle="More macOS MCP internals"
        posts={[
          {
            title: "MCP Agent Plan Execution: why macos-use refuses to have a plan primitive",
            href: "/t/mcp-agent-plan-execution",
            excerpt:
              "The companion piece. Dry-run is the read side. This one is the commit side: how click_and_traverse chains click + type + pressKey into one tool call.",
            tag: "Internals",
          },
          {
            title: "AI agent UI state checkpointing on macOS",
            href: "/t/ai-agent-ui-state-checkpointing",
            excerpt:
              "The three snapshots every mutating tool takes (cursor, frontmost app, AX tree) and what a dry run deliberately skips.",
            tag: "Internals",
          },
          {
            title: "macOS accessibility tree for agents",
            href: "/t/macos-accessibility-tree-agents",
            excerpt:
              "How the AX tree becomes one element per line, why the format is grep-first, and how to read the flat text file produced by every traversal.",
            tag: "Reference",
          },
        ]}
      />

      <BookCallCTA
        appearance="sticky"
        destination="https://cal.com/team/mediar/macos-use"
        site="macOS MCP"
        description="Book a 30-min call on wiring refresh_traversal into your agent loop."
      />
    </article>
  );
}
