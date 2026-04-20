import type { Metadata } from "next";
import {
  Breadcrumbs,
  ArticleMeta,
  ProofBand,
  FaqSection,
  MotionSequence,
  BackgroundGrid,
  GradientText,
  NumberTicker,
  ShimmerButton,
  Marquee,
  OrbitingCircles,
  AnimatedCodeBlock,
  FlowDiagram,
  CodeComparison,
  BentoGrid,
  StepTimeline,
  ProofBanner,
  BookCallCTA,
  RelatedPostsGrid,
  articleSchema,
  breadcrumbListSchema,
  faqPageSchema,
} from "@seo/components";

const SLUG = "mcp-agent-plan-execution";
const URL = `https://macos-use.dev/t/${SLUG}`;
const DATE_PUBLISHED = "2026-04-20";
const DATE_MODIFIED = "2026-04-20";
const TITLE =
  "MCP Agent Plan Execution On The Desktop: Why macos-use Refuses To Have A Plan Primitive";
const DESCRIPTION =
  "Every 'MCP agent plan execution' article from 2026 describes orchestration layers: planner, executor, synthesizer. None of them address plan execution on a desktop where the user is at the keyboard, focus can shift mid-plan, targets can be off-screen, and you need a single keystroke to kill the whole thing. mcp-server-macos-use compresses a 3-step micro-plan into optional params on one tool call (click + text + pressKey), runs it as 5 ordered OS events with an Esc-cancellation checkpoint between each, and silently swallows the two plan-break events that would otherwise stall an agent's outer loop.";

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
      "MCP agent plan execution on a real desktop: 5 OS events, 1 MCP round-trip, Esc to kill",
    description:
      "Orchestration-layer articles miss the desktop-specific failure modes. macos-use chains click + type + press into one tool call, polls throwIfCancelled between each step, and auto-recovers from app-switch and off-screen targets.",
  },
};

const breadcrumbItems = [
  { label: "Home", href: "https://macos-use.dev" },
  { label: "Guides", href: "https://macos-use.dev/t" },
  { label: "MCP agent plan execution" },
];

const breadcrumbSchemaItems = [
  { name: "Home", url: "https://macos-use.dev" },
  { name: "Guides", url: "https://macos-use.dev/t" },
  { name: "MCP agent plan execution", url: URL },
];

const faqItems = [
  {
    q: "Does macos-use have a 'plan' tool, a 'sequence' tool, or a planner primitive?",
    a: "No. The server exposes six tools (open, click, type, press_key, scroll, refresh) and nothing else. There is no plan object, no sequence handle, no agent-side state the server persists. The agent is the planner. What the server does offer is optional parameter chaining: click_and_traverse accepts optional text and pressKey params, so click + type + press fires inside one tool call. That is as close as the server gets to a plan primitive, and it is intentional. See Sources/MCPServer/main.swift:1300-1408 for the tool definitions.",
  },
  {
    q: "What is the minimum number of MCP round-trips to fill a form field and submit it?",
    a: "One. Calling click_and_traverse with { x, y, text: 'hello world', pressKey: 'Return' } runs traverseBefore → click → type → press Return → traverseAfter inside the server, returns one response with one diff, and writes one /tmp/macos-use/<ts>_click_and_traverse.txt file. A naive agent that issues three separate MCP calls (click, then type, then press) pays for 3x the LLM round-trips, 3x the traversal noise, and 3x the chance of the plan getting interrupted between tool calls. The composed path is main.swift:1709-1751.",
  },
  {
    q: "If a chained plan is 5 OS events deep inside one MCP call, how does the user kill it?",
    a: "Press Esc. InputGuard installs a CGEventTap at .cghidEventTap that sees every keystroke while the tool call is running. An Escape keydown with no modifiers sets _cancelled = true at InputGuard.swift:292. The handler polls InputGuard.shared.throwIfCancelled() between every action in the chain: main.swift:1708, 1721, 1728, 1734. After the chain finishes there is a 200ms grace window at main.swift:1757 during which a late Esc still cancels. On cancel the handler throws InputGuardCancelled, runs the cursor + foreground restore code, and returns an isError response. The plan stops at the current boundary, not at the final step.",
  },
  {
    q: "What does the agent get back as 'plan state' for the next step?",
    a: "A diff. After every action the server traverses the target app twice (before and after), subtracts them, and returns the delta as a flat-text list prefixed with + added, - removed, and ~ modified. The diff gets written to /tmp/macos-use/<timestamp>_<tool>.txt alongside a PNG screenshot with a red crosshair at the click point. The agent reads that file (grep by role, by text, by coordinates) to choose the next tool call. There is no JSON blob of 'plan progress' the server maintains between calls. The diff is the state. See main.swift:1007-1028 for the diff format and main.swift:1828-1840 for the file write.",
  },
  {
    q: "What happens if the click launches a different app and focus shifts mid-plan?",
    a: "The server catches it without the agent asking. After the action, main.swift:1788-1808 compares NSWorkspace.shared.frontmostApplication processIdentifier against the PID the tool call was addressed to. If the frontmost app changed, the handler traverses the NEW frontmost app, writes its tree into toolResponse.appSwitchTraversal, and sets appSwitchPid + appSwitchAppName. The agent's next planning step gets two trees in one response: the diff of the original app, plus the full tree of whatever is now in front. No retry loop, no 'app not found' error.",
  },
  {
    q: "What happens if the target element is off-screen when the agent tries to click it?",
    a: "scroll_into_view kicks in automatically. main.swift:1159-1285 computes the direction from the click point relative to the window bounds, then scrolls up to 30 steps (main.swift:1189, maxSteps = 30) with line-scaled deltas: 1 line/step if the distance is under 80px, 2 lines if under 250px, 3 lines otherwise. After every scroll step it probes the AX tree by text match (when the target has text) or by watching the viewport edge for newly-revealed elements. If the target appears, it clicks. If it doesn't appear after 30 steps, it logs a warning and clicks at the original coordinates anyway. The agent never learns the element was off-screen; it just gets a diff that shows the click landed.",
  },
  {
    q: "Why 30 steps and not unlimited? Isn't a cap a footgun?",
    a: "Accessibility-driven scrolling is cheap but not free (each step posts a CGEvent scrollWheelEvent2 at main.swift:1196 and waits 100ms before the next tree probe). 30 steps at 2 lines each ≈ 60 scroll lines ≈ ~1500px of travel, which covers most practical cases (long tables, sidebar lists, chat scrollback). Beyond that the likely explanation is that the AX coordinate the agent computed is stale, the window scrolled back, or the element is inside an unscrollable container. An unbounded loop would turn a planning error into a silent hang. The cap turns it into a 3-second log line.",
  },
  {
    q: "How is this different from mcp-agent or Agent-MCP or Cloudflare's Code Mode MCP?",
    a: "Those operate above MCP: they describe how a planner LLM breaks a user goal into sub-tasks, dispatches them to worker agents, and synthesizes results. Plan execution in that world is an orchestration-layer problem solved with Temporal-style durable workflows, code-compilation of plans, or multi-agent message passing. macos-use operates below MCP: it is one of the tools those planners call. Its job is to make a single call on a real desktop atomic, cancellable, and self-repairing, so the outer orchestration does not have to retry for reasons like 'the user was typing' or 'the window scrolled.' You can and should run both. See the SERP results at the top of the page for links.",
  },
  {
    q: "Can I chain more than click + type + press in one call?",
    a: "Not yet. The composed path at main.swift:1710-1751 special-cases a primary action followed by a series of input actions (type or press). You can issue multiple presses in the pressKey param (the exact parsing is at main.swift:1349-1383 for type_and_traverse and 1384-1408 for press_key_and_traverse). If you need a richer sequence, issue it as separate MCP calls; the diff-as-state model means each call self-plans off the previous result.",
  },
  {
    q: "Is the InputGuard overlay safe during a plan that takes longer than 30 seconds?",
    a: "The guard auto-releases the event tap after 30 seconds regardless of whether the tool call returned (InputGuard.swift:24 sets watchdogTimeout = 30). If your chained plan is still running when the watchdog fires, the input tap drops, the user regains full keyboard/mouse control, but the agent's OS events are still posted (they come from inside the macos-use process and do not need the tap). The tradeoff is safety over automation duration: a crashed Swift process holding an engaged tap would lock the Mac, so the ceiling is non-negotiable. If you need longer plans, split them into multiple tool calls and let the agent re-engage the guard per call.",
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

const composedPathCode = `// Sources/MCPServer/main.swift:1701-1751
// click_and_traverse { text, pressKey } — composed execution path.
// One MCP call. Five ordered OS events. An Esc checkpoint between each.

if additionalActions.isEmpty {
    // Single-action path (traverseBefore + click + traverseAfter)
    actionResult = await performAction(primaryAction, options)
    if isDisruptive { try InputGuard.shared.throwIfCancelled() }
} else {
    // --- Composed path: click → type? → press? → final traversal ---

    // Step 1: primary action with traverseBefore only
    var primaryOpts = options
    primaryOpts.traverseAfter = false
    primaryOpts.showDiff = false
    let primaryResult = await performAction(primaryAction, primaryOpts)
    if isDisruptive { try InputGuard.shared.throwIfCancelled() }   // ← main.swift:1721

    // Step 2: each additional input action (type, press), no traversal
    for additionalAction in additionalActions {
        try? await Task.sleep(nanoseconds: 100_000_000)             // 100ms gap
        if isDisruptive { try InputGuard.shared.throwIfCancelled() } // ← main.swift:1728
        _ = await performAction(.input(action: additionalAction), minOpts)
    }
    if isDisruptive { try InputGuard.shared.throwIfCancelled() }    // ← main.swift:1734

    // Step 3: final traversal to capture the after-state
    let finalResult = await performAction(.traverseOnly, finalOpts)

    // Combine: before from primary, after from final traversal
    var combined = primaryResult
    combined.traversalAfter = finalResult.traversalAfter
    actionResult = combined
}

// Post-chain grace window for a late Esc (main.swift:1757)
try? await Task.sleep(nanoseconds: 200_000_000)
if InputGuard.shared.wasCancelled { throw InputGuardCancelled() }`;

const naiveAgentLoop = `// Naive plan: one MCP call per OS event.
// Three LLM turns. Three traversals. Three chances for the user
// to type in the middle of your plan.

// Turn 1
call click_and_traverse { pid, element: "To field" }
  → 140 KB diff, LLM re-plans

// Turn 2
call type_and_traverse { pid, text: "alice@example.com" }
  → 140 KB diff, LLM re-plans

// Turn 3
call press_key_and_traverse { pid, key: "Tab" }
  → 140 KB diff, LLM re-plans

// Turn 4
call click_and_traverse { pid, element: "Send" }
  → 140 KB diff, LLM sees the new screen

// Total: 4 MCP round-trips, 4 LLM turns, 4 traversals.
// Every round-trip is a window for the user to interfere
// and a window for focus to shift to a different app.`;

const chainedAgentLoop = `// Chained plan: one MCP call fires 5 OS events.
// One LLM turn for the whole micro-plan. One diff.
// One post-plan grace window for Esc. Focus-shift
// detected automatically by the server.

// Turn 1
call click_and_traverse {
  pid,
  element: "To field",
  text: "alice@example.com",
  pressKey: "Tab"
}
  → traverseBefore + click + type + Tab + traverseAfter
    all inside one tool call, one diff returned.

// Turn 2
call click_and_traverse { pid, element: "Send" }
  → server detects that focus shifted to Mail's
    "recipient autocomplete" sheet, traverses the
    sheet, returns appSwitchTraversal in the same
    response. No retry loop required.

// Total: 2 MCP round-trips for the same work.`;

const sequenceFrames = [
  {
    title: "The MCP client makes one call",
    body: (
      <p>
        <code className="font-mono text-teal-600">click_and_traverse</code>{" "}
        with <code className="font-mono text-teal-600">text</code> and{" "}
        <code className="font-mono text-teal-600">pressKey</code> both set.
      </p>
    ),
  },
  {
    title: "Snapshot before",
    body: (
      <p>
        Save frontmost app and cursor. Engage InputGuard with the
        30-second watchdog armed. Traverse the target app.
      </p>
    ),
  },
  {
    title: "Five OS events in order",
    body: (
      <p className="font-mono text-sm">
        traverseBefore → click → type → press → traverseAfter
      </p>
    ),
  },
  {
    title: "Cancellation checkpoint between each",
    body: (
      <p>
        <code className="font-mono text-teal-600">throwIfCancelled()</code>{" "}
        polled at lines 1708, 1721, 1728, 1734. Esc kills the chain
        at the current boundary.
      </p>
    ),
  },
  {
    title: "One diff. One file. One response.",
    body: (
      <p>
        The server writes <code className="font-mono text-teal-600">/tmp/macos-use/&lt;ts&gt;_click_and_traverse.txt</code>{" "}
        plus a PNG with a red crosshair, restores the cursor and
        previous frontmost app, and returns.
      </p>
    ),
  },
];

const planBreakCards = [
  {
    title: "Off-screen target",
    description:
      "scroll_into_view probes up to 30 scroll steps with line-scaled deltas (1 / 2 / 3 lines per step based on distance) before giving up. The agent never learns it happened. main.swift:1189 sets maxSteps = 30.",
    size: "2x1" as const,
    accent: true,
  },
  {
    title: "Focus shifts to a different app",
    description:
      "After the action, the handler compares the new frontmost PID to the one the call targeted. If they differ, it traverses the new frontmost and returns it as appSwitchTraversal on the same response. main.swift:1788-1808.",
    size: "1x1" as const,
  },
  {
    title: "User types mid-plan",
    description:
      "CGEventTap at .cghidEventTap filters by source state ID. Hardware events (stateID=0) are dropped; events from the macos-use process pass through. Human input cannot race with the agent.",
    size: "1x1" as const,
  },
  {
    title: "User presses Esc",
    description:
      "The tap captures keycode 53 with no modifiers, sets _cancelled, and throwIfCancelled() raises on the next chain boundary. The restore code runs on the cancel path too. InputGuard.swift:289-350.",
    size: "1x1" as const,
  },
  {
    title: "The whole process hangs",
    description:
      "DispatchSource timer at InputGuard.swift:173 auto-disengages the event tap after 30 seconds. The user always gets their keyboard back, even if the Swift process is stuck.",
    size: "1x1" as const,
  },
];

const flowSteps = [
  { label: "traverseBefore", detail: "showDiff = true implies a pre-action AX tree snapshot" },
  { label: "click", detail: "auto-activates target app, optional scroll_into_view up to 30 steps" },
  { label: "type", detail: "only runs if caller passed the text param on click_and_traverse" },
  { label: "press", detail: "only runs if caller passed the pressKey param" },
  { label: "traverseAfter", detail: "subtract from before to build the diff the agent reads next" },
];

const timelineSteps = [
  {
    title: "The agent issues one tool call",
    description:
      "No plan primitive. No session handle. One request with optional chaining params. The server figures out the rest.",
  },
  {
    title: "The server checkpoints OS state",
    description:
      "Frontmost app, cursor position (flipped into CGEvent coordinates), AX tree. Input tap engaged with a 30s watchdog.",
  },
  {
    title: "The server fires N OS events in order",
    description:
      "For a click+type+press request, that is 5 ordered events with a 100ms gap between the input actions and a throwIfCancelled poll between each.",
  },
  {
    title: "The server handles plan-break events",
    description:
      "Off-screen: scroll up to 30 steps until the target is visible. App switch: traverse the new frontmost and attach it to the response. User Esc: throw and restore.",
  },
  {
    title: "The server writes the diff and restores OS state",
    description:
      "One .txt with + / - / ~ diff lines, one .png screenshot with a click crosshair. Cursor moved back, previous frontmost reactivated. MCP response returns.",
  },
  {
    title: "The agent re-plans from the diff",
    description:
      "Not from a planner object, not from a graph-state checkpoint. From a flat-text delta. The diff is the plan state.",
  },
];

const orbitItems = [
  <span
    key="off-screen"
    className="px-3 py-1.5 rounded-full bg-white border border-zinc-200 text-xs font-medium text-zinc-700 shadow-sm"
  >
    off-screen target
  </span>,
  <span
    key="app-switch"
    className="px-3 py-1.5 rounded-full bg-white border border-zinc-200 text-xs font-medium text-zinc-700 shadow-sm"
  >
    app switch mid-plan
  </span>,
  <span
    key="user-typing"
    className="px-3 py-1.5 rounded-full bg-white border border-zinc-200 text-xs font-medium text-zinc-700 shadow-sm"
  >
    user typing
  </span>,
  <span
    key="user-esc"
    className="px-3 py-1.5 rounded-full bg-white border border-zinc-200 text-xs font-medium text-zinc-700 shadow-sm"
  >
    user Esc
  </span>,
  <span
    key="hang"
    className="px-3 py-1.5 rounded-full bg-white border border-zinc-200 text-xs font-medium text-zinc-700 shadow-sm"
  >
    process hang
  </span>,
  <span
    key="cursor"
    className="px-3 py-1.5 rounded-full bg-white border border-zinc-200 text-xs font-medium text-zinc-700 shadow-sm"
  >
    cursor drift
  </span>,
];

const toolPills = [
  "open_application_and_traverse",
  "click_and_traverse",
  "type_and_traverse",
  "press_key_and_traverse",
  "scroll_and_traverse",
  "refresh_traversal",
];

const relatedPosts = [
  {
    title: "AI Agent UI State Checkpointing",
    excerpt:
      "The three snapshots macos-use takes around every click: frontmost app, cursor, AX tree.",
    href: "/t/ai-agent-ui-state-checkpointing",
    tag: "Checkpointing",
  },
  {
    title: "macOS Accessibility Tree For Agents",
    excerpt:
      "The AX tree is the input to every plan step. How macos-use serves the tree without dumping it wholesale on every call.",
    href: "/t/macos-accessibility-tree-agents",
    tag: "AX Trees",
  },
  {
    title: "macOS AI Agent State Memory",
    excerpt:
      "Where the diff goes, how long it lives, and why /tmp/macos-use/ doubles as a commit log for an agent's action history.",
    href: "/t/macos-ai-agent-state-memory",
    tag: "Memory",
  },
];

export default function McpAgentPlanExecutionPage() {
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
                One call, five OS events
              </span>
              <span className="inline-block bg-zinc-100 text-zinc-600 text-xs font-medium px-2 py-1 rounded-full">
                Esc kills the chain
              </span>
              <span className="inline-block bg-cyan-50 text-cyan-700 text-xs font-medium px-2 py-1 rounded-full font-mono">
                main.swift:1709-1751
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 mb-6">
              MCP Agent Plan Execution On A Real Desktop:{" "}
              <GradientText>
                Why macos-use Refuses To Have A Plan Primitive
              </GradientText>
            </h1>
            <p className="text-lg text-zinc-500 max-w-2xl mb-6">
              Every article you will find for this keyword describes plan
              execution as an orchestration-layer problem:{" "}
              <em>planner, executor, synthesizer</em>, Temporal-style
              durable workflows, agents compiling plans into code. All
              useful. None of it addresses plan execution on a desktop
              where the human is at the keyboard, focus can shift to a
              different app mid-plan, the target element can be
              off-screen, and a single keystroke needs to kill the whole
              thing. This is the below-MCP half of the problem, and
              macos-use solves it with no plan primitive at all.
            </p>
            <ArticleMeta
              datePublished={DATE_PUBLISHED}
              author="macos-use maintainers"
              readingTime="10 min read"
            />
            <div className="mt-8 flex gap-4 flex-wrap">
              <ShimmerButton href="https://github.com/mediar-ai/mcp-server-macos-use/blob/main/Sources/MCPServer/main.swift#L1709">
                Read the composed path at main.swift:1709
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
            "One tool call runs 5 ordered OS events: traverseBefore → click → type → press → traverseAfter (main.swift:1709-1751)",
            "throwIfCancelled() polled between each step at main.swift:1708, 1721, 1728, 1734; Esc kills the chain at the current boundary",
            "scroll_into_view probes up to 30 steps, app switch handoff traverses the new frontmost, watchdog releases the input tap after 30s",
          ]}
        />

        <section className="max-w-4xl mx-auto px-6 pt-10 pb-2">
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-3">
              The 6 tools macos-use exposes (no plan primitive)
            </p>
            <Marquee speed={28} pauseOnHover fade>
              {toolPills.map((pill) => (
                <span
                  key={pill}
                  className="mx-2 inline-flex items-center px-3 py-1.5 rounded-full bg-white border border-zinc-200 text-xs font-mono text-zinc-700"
                >
                  {pill}
                </span>
              ))}
            </Marquee>
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-6 py-16">
          <MotionSequence
            title="One MCP call, five OS events, one diff"
            frames={sequenceFrames}
            defaultDuration={3000}
            loop
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            What The Top Results For This Keyword All Get Right, And What They All Miss
          </h2>
          <p className="text-zinc-600 mb-4">
            The first-page SERP for <em>mcp agent plan execution</em> is
            consistent: lastmile-ai/mcp-agent describes planner /
            orchestrator / worker patterns from Anthropic&apos;s &quot;Building
            Effective Agents.&quot; Agent-MCP frames multi-agent coordination
            with shared context. Cloudflare&apos;s Code Mode MCP argues that
            agents should compile plans into code snippets to avoid
            loading every endpoint definition into context. OpenAI&apos;s Agents
            SDK documents MCP server integration. Anthropic&apos;s engineering
            blog covers code execution with MCP. All of these live above
            the MCP protocol: they describe how the agent decides what to
            call.
          </p>
          <p className="text-zinc-600 mb-4">
            None of them describe what happens when the call itself is to
            a real desktop app running on a real user&apos;s machine. On a
            desktop, plan execution has failure modes that do not exist
            in a web sandbox or a Docker container. The user is at the
            keyboard. Focus can shift because an action launched a second
            app. The AX element the plan computed an hour ago may now be
            off-screen. And if something goes wrong, there has to be a
            way to stop it that does not involve the agent re-planning
            anything.
          </p>
          <p className="text-zinc-600">
            That is what the rest of this page is about.
          </p>
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            The Plan Compression Trick: One Tool Call, Five OS Events
          </h2>
          <p className="text-zinc-600 mb-6">
            macos-use has no <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-xs font-mono text-zinc-800">plan</code>{" "}
            tool and no session state. What it has is optional chaining
            params on <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-xs font-mono text-zinc-800">click_and_traverse</code>.
            If you pass both <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-xs font-mono text-zinc-800">text</code>{" "}
            and <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-xs font-mono text-zinc-800">pressKey</code>,
            the server runs five ordered OS events inside the single
            MCP request, with a cancellation checkpoint between each.
          </p>
          <FlowDiagram
            title="The five events, in order"
            steps={flowSteps}
          />
          <p className="text-sm text-zinc-500 mt-4 font-mono">
            Execution order is set at main.swift:1701-1751. Every {" "}
            <span className="text-zinc-700">try InputGuard.shared.throwIfCancelled()</span>{" "}
            is a boundary where pressing Esc can still kill the chain.
          </p>
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-teal-200 bg-teal-50 p-5 text-center">
              <div className="text-4xl font-bold text-teal-700 mb-1">
                <NumberTicker value={5} />
              </div>
              <div className="text-xs font-medium text-teal-800">
                OS events per call
              </div>
              <div className="text-[11px] text-teal-700/70 mt-1 font-mono">
                click+type+press
              </div>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 text-center">
              <div className="text-4xl font-bold text-zinc-900 mb-1">
                <NumberTicker value={1} />
              </div>
              <div className="text-xs font-medium text-zinc-700">
                MCP round-trip
              </div>
              <div className="text-[11px] text-zinc-500 mt-1">
                one diff returned
              </div>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 text-center">
              <div className="text-4xl font-bold text-zinc-900 mb-1">
                <NumberTicker value={30} />
              </div>
              <div className="text-xs font-medium text-zinc-700">
                max scroll steps
              </div>
              <div className="text-[11px] text-zinc-500 mt-1 font-mono">
                main.swift:1189
              </div>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 text-center">
              <div className="text-4xl font-bold text-zinc-900 mb-1">
                <NumberTicker value={30} suffix="s" />
              </div>
              <div className="text-xs font-medium text-zinc-700">
                input-tap watchdog
              </div>
              <div className="text-[11px] text-zinc-500 mt-1 font-mono">
                InputGuard.swift:24
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            Naive Plan Versus Chained Plan, On The Wire
          </h2>
          <p className="text-zinc-600 mb-6">
            If you write the agent loop as three sequential MCP calls
            (click, then type, then press), you pay for three LLM turns,
            three AX traversals, and three windows during which the user
            can race you or focus can shift. The chained form collapses
            all three into one.
          </p>
          <CodeComparison
            title="Plan round-trips"
            leftCode={naiveAgentLoop}
            rightCode={chainedAgentLoop}
            leftLabel="Naive: one event per MCP call"
            rightLabel="Chained: one MCP call, five events"
            leftLines={18}
            rightLines={16}
            reductionSuffix="fewer MCP round-trips"
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            The Composed Execution Path, Verbatim
          </h2>
          <p className="text-zinc-600 mb-6">
            This is the branch the server takes when{" "}
            <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-xs font-mono text-zinc-800">click_and_traverse</code>{" "}
            has extra input actions to run after the click. Every arrow
            labeled <em>main.swift:17xx</em> in the comments is a line
            where the plan can be cancelled mid-execution.
          </p>
          <AnimatedCodeBlock
            code={composedPathCode}
            language="swift"
            filename="Sources/MCPServer/main.swift"
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            The Plan-Break Events The Server Handles Silently
          </h2>
          <p className="text-zinc-600 mb-6">
            If the agent had to detect and retry every one of these, the
            outer planner would be half plan and half recovery logic.
            macos-use absorbs them below the MCP boundary. The agent
            never learns most of them happened.
          </p>
          <BentoGrid cards={planBreakCards} />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <ProofBanner
            quote="Passing both text and pressKey on click_and_traverse triggers the composed path at main.swift:1709-1751. Five ordered OS events, an Esc-cancellation poll between each, one diff written to /tmp/macos-use/<ts>_click_and_traverse.txt. That is what 'plan execution' means in this server."
            metric="5 events / 1 diff"
            source="main.swift:1709"
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            A Plan, From Agent Turn To Diff On Disk
          </h2>
          <p className="text-zinc-600 mb-6">
            The whole round-trip in six stages. No planner object is
            maintained between stages; the diff from step 5 is the only
            state that survives into the next agent turn.
          </p>
          <StepTimeline steps={timelineSteps} />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            What Keeps A Plan From Surviving On A Desktop
          </h2>
          <p className="text-zinc-600 mb-6">
            Six things, orbiting one handler. The handler is the only
            code that ever sees all of them at once. Each orbit item
            corresponds to a named code path inside{" "}
            <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-xs font-mono text-zinc-800">Sources/MCPServer/</code>.
          </p>
          <div className="flex justify-center">
            <OrbitingCircles
              center={
                <div className="rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 text-white font-semibold text-sm px-4 py-2 shadow-lg">
                  macos-use handler
                </div>
              }
              items={orbitItems}
              radius={160}
              duration={26}
            />
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            Reproducing This, Start To Finish
          </h2>
          <ol className="space-y-3">
            <li className="rounded-xl border border-zinc-200 bg-zinc-50 p-5">
              <p className="text-sm text-zinc-700">
                <span className="font-semibold text-zinc-900">1.</span>{" "}
                Clone the repo and build:{" "}
                <code className="font-mono text-xs bg-white px-1.5 py-0.5 rounded border border-zinc-200">
                  xcrun --toolchain com.apple.dt.toolchain.XcodeDefault swift build
                </code>
                .
              </p>
            </li>
            <li className="rounded-xl border border-zinc-200 bg-zinc-50 p-5">
              <p className="text-sm text-zinc-700">
                <span className="font-semibold text-zinc-900">2.</span>{" "}
                Point an MCP client (Claude Desktop, Cursor, Zed,
                whatever speaks MCP) at the built binary.
              </p>
            </li>
            <li className="rounded-xl border border-zinc-200 bg-zinc-50 p-5">
              <p className="text-sm text-zinc-700">
                <span className="font-semibold text-zinc-900">3.</span>{" "}
                Call <code className="font-mono text-xs bg-white px-1.5 py-0.5 rounded border border-zinc-200">click_and_traverse</code>{" "}
                with both a <code className="font-mono text-xs bg-white px-1.5 py-0.5 rounded border border-zinc-200">text</code>{" "}
                and a <code className="font-mono text-xs bg-white px-1.5 py-0.5 rounded border border-zinc-200">pressKey</code>{" "}
                argument. Watch <code className="font-mono text-xs bg-white px-1.5 py-0.5 rounded border border-zinc-200">/tmp/macos-use/</code>{" "}
                for the new .txt + .png pair.
              </p>
            </li>
            <li className="rounded-xl border border-zinc-200 bg-zinc-50 p-5">
              <p className="text-sm text-zinc-700">
                <span className="font-semibold text-zinc-900">4.</span>{" "}
                Call it again, then press Esc before the chain finishes.
                The response should come back with{" "}
                <code className="font-mono text-xs bg-white px-1.5 py-0.5 rounded border border-zinc-200">
                  isError: true
                </code>{" "}
                and a message indicating cancellation. Your cursor will
                be where you left it.
              </p>
            </li>
            <li className="rounded-xl border border-zinc-200 bg-zinc-50 p-5">
              <p className="text-sm text-zinc-700">
                <span className="font-semibold text-zinc-900">5.</span>{" "}
                Click a button that launches a different app (a mailto:
                link in a browser works). Check the response for{" "}
                <code className="font-mono text-xs bg-white px-1.5 py-0.5 rounded border border-zinc-200">
                  appSwitchTraversal
                </code>
                . The new app&apos;s full AX tree is in the same response.
              </p>
            </li>
          </ol>
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            Why This Isn&apos;t An Orchestration-Layer Concern
          </h2>
          <p className="text-zinc-600 mb-4">
            Everything macos-use does inside that one tool call is
            invisible to the agent framework above. LangGraph, Temporal,
            mcp-agent, whatever else you are using to decide the next
            step: they see one MCP request and one MCP response. The
            planner is not aware that five OS events happened in
            between, that the cursor was parked at the corner of the
            screen and restored, that the input tap blocked a keystroke
            the user aimed at the target window, or that the 24th of 30
            scroll steps was the one that revealed the element.
          </p>
          <p className="text-zinc-600 mb-4">
            That is the point. Plan execution on a desktop is a pile of
            concerns that the agent framework should not have to model.
            The tool either atomically moved the desktop into the
            requested state, or returned an error that said why. The
            contract is the same one a SQL driver gives to a database
            ORM: hand me a statement, I will either commit it or tell
            you what happened.
          </p>
          <p className="text-zinc-600">
            You can and should stack this under a real planner. The
            planner decides &quot;send Alice an email about the Friday
            meeting.&quot; macos-use handles each of the seven or eight
            tool calls that realizes it, and absorbs the thirty or forty
            OS-layer things that could go sideways per call.
          </p>
        </section>

        <BookCallCTA
          appearance="footer"
          destination="https://cal.com/team/mediar/macos-use"
          site="macOS MCP"
          heading="Wiring macos-use under an agent planner?"
          description="Book 20 minutes with the team. We will walk the composed execution path on your actual plan and help you decide where the MCP boundary should sit."
        />

        <section className="max-w-4xl mx-auto px-6 py-12">
          <FaqSection items={faqItems} />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <RelatedPostsGrid
            title="Related guides on macos-use internals"
            posts={relatedPosts}
          />
        </section>

        <BookCallCTA
          appearance="sticky"
          destination="https://cal.com/team/mediar/macos-use"
          site="macOS MCP"
          description="See a chained plan run on your own app."
        />
      </article>
    </>
  );
}
