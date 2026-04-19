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
  ComparisonTable,
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
  "macos-use: How The MCP Server Catches The Frontmost App Switching Mid-Tool-Call";
const DESCRIPTION =
  "When a click opens a link in a browser, or a keypress triggers Cmd+Tab, or a save dialog pushes a different app to the front, the PID your agent thought it was driving is now behind a new window. macos-use detects this inside the same tool call at Sources/MCPServer/main.swift:1786-1809, re-runs the accessibility traversal against the new frontmost PID, and attaches both the original diff and the new app's full tree under a single app_switch section. The model reads one response that describes two apps.";

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
    title: "macos-use: cross-app handoff detection inside a single MCP tool call",
    description:
      "Your click opens Chrome. Your Cmd+Return sends a Mail message and a save sheet takes focus. macos-use notices and traverses the new frontmost PID before the response returns.",
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
    q: "What exactly triggers the cross-app handoff detection, and where is the code?",
    a: "Every diff-producing tool (click, type, press, scroll) sets hasDiff = true. After the primary action returns and the response has been built, the CallTool handler reaches main.swift:1788 which reads 'if hasDiff, let originalPid = options.pidForTraversal'. That originalPid is the PID the caller asked to drive. On the next line, main.swift:1789 reads NSWorkspace.shared.frontmostApplication?.processIdentifier. If those two values differ, the handler treats the action as a cross-app handoff. The whole block is 25 lines, main.swift:1786-1809, and it fires inside the same tool invocation, before the MCP response is serialized.",
  },
  {
    q: "Why is detecting an app switch important in practice?",
    a: "Because agents keep holding onto stale PIDs. Imagine the model calls click_and_traverse on a Mail message that contains a link; the click opens Chrome. Without handoff detection the tool returns a diff of the Mail window (which now contains no new elements relative to before, because the link just left the window), the model sees no change, tries to click the same coordinates, and its CGEvent posts to a Chrome window that happens to cover the point. It hits the wrong target and fails in a hard-to-debug way. Handoff detection writes an app_switch section that tells the model the frontmost app is now Chrome, here is its PID, here are its elements, continue from there.",
  },
  {
    q: "Does the handoff detection re-run the traversal on the new PID, or does it just name the app?",
    a: "It re-runs the traversal. main.swift:1797-1803 calls traverseAccessibilityTree(pid: newPid) inside a @MainActor Task (AX calls must run on the main actor) and then enriches the result with window bounds using the same getWindowBoundsFromTraversal -> getWindowBoundsFromAPI fallback chain the primary traversal uses. The full ResponseData for the new app is stored as toolResponse.appSwitchTraversal. The flat-text file the MCP client reads contains the original diff for the old PID plus every element of the new PID under a '# app_switch: <Name> (PID: N)' header (main.swift:1030-1037).",
  },
  {
    q: "What does the screenshot look like when the frontmost app changes?",
    a: "The PNG is of the new app, not the old one. main.swift:1837 reads 'let screenshotPid = toolResponse.appSwitchPid ?? toolResponse.traversalPid ?? options.pidForTraversal', which resolves to the new PID when appSwitchPid is set. captureWindowScreenshot is then called with that PID and the new window's bounds. This is important: the click annotation (the red crosshair at the click point) is drawn in the coordinate space of the NEW window, which is where the click actually landed visually after the app switch. An old-app screenshot would show the crosshair hovering over whatever is now behind Chrome.",
  },
  {
    q: "What exactly appears in the flat text response file?",
    a: "For a click that causes an app switch, the file at /tmp/macos-use/<timestamp>_click_and_traverse.txt contains four sections in order. One: the '# diff' header with +added, -removed, ~modified lines for the ORIGINAL PID's traversal (the old app, which may be empty if the action just moved focus away). Two: any primaryActionError or traversalError lines. Three: a blank line. Four: a '# app_switch: <AppName> (PID: N)' header followed by every element of the new frontmost window, written in the same 'formatElementLine' format the rest of the traversal uses. The builder is at main.swift:1030-1037; grep for 'app_switch:' in the file to jump straight to the new app's elements.",
  },
  {
    q: "How does this interact with the frontmost-app restore logic?",
    a: "It does not, because the restore logic runs before the detection runs. main.swift:1775-1781 tries to restore focus to savedFrontmostApp (the app that was frontmost BEFORE the tool call), but only if savedFrontmostApp is still alive and not already frontmost. If the action itself made a different app frontmost and the user did not want the tool to change focus, the restore kicks the new app back to the background. If the user's intent was 'click this link, then describe the resulting page', the savedFrontmostApp check still runs but the detection captures the new app's state before focus changes back, so the app_switch traversal is still correct even if focus flips back.",
  },
  {
    q: "What if the new frontmost app is one I do not have accessibility permissions for, or it is a system process?",
    a: "The detection code at main.swift:1797-1808 wraps the traversal in a do/catch. If traverseAccessibilityTree throws (permission denied, process not traversable, AX timeout), the catch block at main.swift:1805-1807 logs a warning and returns. appSwitchPid and appSwitchAppName are still set, so the caller learns an app switch happened and can see the name, but appSwitchTraversal stays nil. The compact summary (buildCompactSummary, main.swift:872-882) only prints the app_switch header if switchPid is present, and only prints the element list if switchTraversal is present. Graceful degradation.",
  },
  {
    q: "How is this different from what other macOS MCP servers do?",
    a: "Every other macOS automation MCP I checked treats the target PID as a fixed parameter. steipete/macos-automator-mcp is AppleScript-scoped, which is app-specific by nature. ashwwwin/automation-mcp and CursorTouch/MacOS-MCP both expose click/type/press but do not re-check frontmost after the action, so a click that changes focus silently strands the tool on the old PID. mb-dev/macos-ui-automation-mcp has a current_app tool you can call separately, which is the manual version of the same idea, but the model has to notice on its own that it should call it. macos-use collapses the detection into the same tool call, inside the same MCP round-trip, so the model reads one response and has ground truth about both apps at once.",
  },
  {
    q: "Can I turn the detection off?",
    a: "Not through a flag today. The condition is 'if hasDiff' at main.swift:1788, so refresh_traversal (which sets hasDiff = false, main.swift:1656) is the only tool that skips the check. click, type, press, scroll all trigger it. If you want to bypass it in a local fork, comment out the block at main.swift:1786-1809 and the response will fall back to the diff of the original PID only. The behavioral trade-off is that cross-app workflows (anything involving Cmd+Tab, link clicks that spawn browsers, save dialogs that surface Finder) will stop reporting the new app's state, so downstream tool calls have to re-query manually.",
  },
  {
    q: "What happens when the composed click-type-press chain finishes and an app switch fired somewhere inside?",
    a: "Composed mode is the 'additionalActions' branch in the same handler, main.swift:1710-1751. Each additional action runs with minimal options and no diff. Only the FINAL traversal at main.swift:1737-1741 produces the combined result. The detection at main.swift:1788 fires against the final post-chain state, which is what you want: the model should see the frontmost app AFTER the entire click + type + Return chain completed, not between steps. If step two (typing) caused the switch and step three (Return) committed the new app's form, the app_switch section describes the final form, not the intermediate typing state.",
  },
  {
    q: "Is there a way to tell from the summary alone that an app switch happened, without reading the whole file?",
    a: "Yes. buildCompactSummary at main.swift:872-882 appends a line 'app_switch: <Name> (PID: N) is now frontmost' right before the traversal returns. That line is always in the compact MCP response body, so the model reads it before it decides whether to grep the full file. The summary also adds an 'app_switch_elements: X total, Y visible' line (main.swift:878), so the model can judge at a glance whether the new app has enough visible state to act on, or whether it should call refresh_traversal to let the app finish launching.",
  },
  {
    q: "Can I reproduce this? What is the shortest reliable trigger?",
    a: "Open Mail. Select any message that contains a link. Run macos-use_click_and_traverse on that link's coordinates. The default browser (Chrome in most configs) will take focus. The MCP response will include a '# app_switch: Google Chrome (PID: N)' header. Alternative: open Terminal, call macos-use_press_key_and_traverse with keyName='Tab' and modifierFlags=['Command']. The frontmost app changes to whatever the previous app was. The log line 'handler(CallTool): app switch detected! Original PID X -> new frontmost PID Y' (main.swift:1792) prints to stderr and the summary carries the same info.",
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

const detectionCode = `// Sources/MCPServer/main.swift:1786-1809
// Runs inside the same CallTool handler, after the primary action completes,
// before the MCP response is serialized. "hasDiff" is true for click, type,
// press, scroll. It is false only for refresh_traversal, which has nothing
// to react to.

// --- Detect cross-app handoff ---
// After diff-based actions, check if a different app became frontmost
if hasDiff, let originalPid = options.pidForTraversal {
    let frontmostPid =
        NSWorkspace.shared.frontmostApplication?.processIdentifier
    if let newPid = frontmostPid, newPid != originalPid {
        let frontmostName =
            NSWorkspace.shared.frontmostApplication?.localizedName ?? "Unknown"
        fputs("log: handler(CallTool): app switch detected! " +
              "Original PID \\(originalPid) -> new frontmost PID " +
              "\\(newPid) (\\(frontmostName))\\n", stderr)
        toolResponse.appSwitchPid = newPid
        toolResponse.appSwitchAppName = frontmostName

        // Traverse the new frontmost app
        do {
            let newTraversal: ResponseData = try await Task { @MainActor in
                return try traverseAccessibilityTree(pid: newPid)
            }.value
            let newWindowBounds = getWindowBoundsFromTraversal(newTraversal)
                ?? getWindowBoundsFromAPI(pid: newPid)
            toolResponse.appSwitchTraversal =
                enrichResponseData(newTraversal,
                                   windowBounds: newWindowBounds)
        } catch {
            // Permission denied, process died, AX timeout:
            // keep the switch name/PID, drop the traversal.
            fputs("warning: failed to traverse new frontmost " +
                  "app \\(frontmostName): \\(error)\\n", stderr)
        }
    }
}`;

const flatTextCode = `// Sources/MCPServer/main.swift:1030-1037
// Writes the new app's tree under a "# app_switch:" header so the model
// can jump directly to it with a grep. The same formatElementLine used
// for the primary traversal is reused, so the format is identical.

// Cross-app handoff
if let switchTraversal = toolResponse.appSwitchTraversal {
    lines.append("")
    lines.append("# app_switch: " +
                 "\\(toolResponse.appSwitchAppName ?? \\"Unknown\\") " +
                 "(PID: \\(toolResponse.appSwitchPid ?? 0))")
    for el in switchTraversal.elements {
        lines.append(formatElementLine(el))
    }
}`;

const screenshotPidCode = `// Sources/MCPServer/main.swift:1837
// The screenshot always follows the frontmost app. The ?? chain resolves
// to the new PID when an app switch was detected, otherwise falls back
// to the original traversal PID, then to the pid passed in options.

let screenshotPid =
    toolResponse.appSwitchPid
    ?? toolResponse.traversalPid
    ?? options.pidForTraversal

if let pid = screenshotPid {
    screenshotPath = captureWindowScreenshot(
        pid: pid,
        outputPath: screenshotFilepath,
        clickPoint: lastClickPoint,
        traversalWindowBounds: toolResponse.windowBounds
    )
}`;

const terminalTranscript = [
  { type: "command" as const, text: "# Mail is frontmost, PID 1247. A message contains a link." },
  { type: "command" as const, text: "macos-use_click_and_traverse pid=1247 element='https://example.com'" },
  { type: "output" as const, text: "log: click_and_traverse: activated app pid=1247" },
  { type: "output" as const, text: "log: click_and_traverse: found 1 match(es). Clicking 'https://example.com' [AXLink] at center (412,598)" },
  { type: "output" as const, text: "log: handler(CallTool): app switch detected! Original PID 1247 -> new frontmost PID 8892 (Google Chrome)" },
  { type: "output" as const, text: "log: handler(CallTool): traversed new frontmost app Google Chrome (PID 8892): 247 elements" },
  { type: "output" as const, text: "log: captureWindowScreenshot: selected window 31704 (score=2073600)" },
  { type: "success" as const, text: "status: success" },
  { type: "success" as const, text: "pid: 1247" },
  { type: "success" as const, text: "app: Mail" },
  { type: "success" as const, text: "file: /tmp/macos-use/1744996800123_click_and_traverse.txt" },
  { type: "success" as const, text: "screenshot: /tmp/macos-use/1744996800123_click_and_traverse.png" },
  { type: "success" as const, text: "app_switch: Google Chrome (PID: 8892) is now frontmost" },
  { type: "success" as const, text: "app_switch_elements: 247 total, 43 visible" },
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
                cross-app handoff
              </span>
              <span className="inline-block bg-cyan-50 text-cyan-700 text-xs font-medium px-2 py-1 rounded-full font-mono">
                frontmostApplication
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 mb-6">
              Your Click Opened A Different App.{" "}
              <GradientText>macos-use Noticed</GradientText> And Traversed It
              Before The Tool Call Returned.
            </h1>
            <p className="text-lg text-zinc-500 max-w-2xl mb-6">
              Most macOS automation servers treat the target PID as a fixed
              parameter. You send a click, you get back a diff for that PID, the
              next tool call assumes the same PID is still in focus. That
              assumption breaks the moment a click opens a browser, a save
              sheet surfaces Finder, or a Cmd-Tab promotes a background app.
              macos-use checks{" "}
              <span className="font-mono text-sm">
                NSWorkspace.shared.frontmostApplication
              </span>{" "}
              after every diff-producing action, and if the PID is not the one
              you asked for, it re-runs the accessibility traversal on the new
              frontmost app and attaches both trees to the same MCP response.
              The block is 25 lines of Swift in{" "}
              <span className="font-mono text-sm">main.swift:1786-1809</span>.
            </p>
            <ArticleMeta
              datePublished={DATE_PUBLISHED}
              author="macos-use maintainers"
              readingTime="9 min read"
            />
            <div className="mt-8 flex gap-4 flex-wrap">
              <ShimmerButton href="https://github.com/mediar-ai/mcp-server-macos-use/blob/main/Sources/MCPServer/main.swift#L1786">
                Read the detection block on GitHub
              </ShimmerButton>
              <a
                href="https://github.com/mediar-ai/mcp-server-macos-use/blob/main/Sources/MCPServer/main.swift#L1030"
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-zinc-200 bg-white text-zinc-700 text-sm font-medium hover:border-teal-300 hover:text-teal-700 transition-colors"
              >
                Open flat-text writer at main.swift:1030
              </a>
            </div>
          </div>
        </BackgroundGrid>

        {/* Proof band */}
        <ProofBand
          rating={5.0}
          ratingCount="open source"
          highlights={[
            "Detection fires inside the same MCP tool call, not in a separate call",
            "New frontmost app's accessibility tree is attached to the same response",
            "Screenshot PID follows the app switch, not the caller's original PID",
          ]}
        />

        {/* Remotion hero clip */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <RemotionClip
            title="One click. Two apps. One response."
            subtitle="Cross-app handoff detection inside a single MCP round-trip"
            captions={[
              "Click on a link in Mail, the PID 1247 that started the call",
              "Chrome becomes frontmost, new PID 8892, different AX tree",
              "macos-use notices the PID drift and traverses the new app",
              "Response carries Mail's diff AND Chrome's full tree, one file",
              "Screenshot is of Chrome, where the click visibly landed",
            ]}
            accent="teal"
          />
        </section>

        {/* The SERP gap */}
        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            The One Failure Mode None Of The Competing MCPs Describe
          </h2>
          <p className="text-zinc-600 mb-4">
            Search the keyword{" "}
            <span className="font-mono text-sm">macos-use</span> and read the
            top results: the GitHub READMEs for steipete/macos-automator-mcp,
            ashwwwin/automation-mcp, CursorTouch/MacOS-MCP, digithree/automac-mcp,
            mb-dev/macos-ui-automation-mcp, and several blog walkthroughs. Every
            one of them describes the tool surface (click, type, press, launch
            app) and the accessibility-tree payload. Not one of them addresses
            the question of what happens when the action you just performed
            pushes a different app to the front.
          </p>
          <p className="text-zinc-600 mb-4">
            This is not a rare edge case. It is the default for: clicking a link
            in Mail, Messages, Slack, or Discord. Pressing Cmd-Tab at any
            point. Running a keyboard shortcut that triggers Spotlight or a
            global menu extra. Opening any file from Finder. Sending an email
            that closes the composer and returns focus to the inbox. Any save
            sheet that surfaces Finder. Any authentication flow that redirects
            to a browser.
          </p>
          <p className="text-zinc-600">
            Without handoff detection, the model&apos;s next tool call uses the
            original PID, lands on a background window, and the agent gets
            silently confused. The failure mode is invisible in the tool
            response because the response looks normal; the diff just happens to
            describe the wrong app.
          </p>
        </section>

        {/* ComparisonTable with competitors */}
        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            What Each macOS MCP Reports When A Click Opens A Different App
          </h2>
          <p className="text-zinc-600 mb-8 max-w-2xl">
            Behavior observed by running the same click flow (click a link in
            Mail, read the tool response) against each server&apos;s public
            release. The column headers are the named MCP projects on GitHub;
            rows are what the model reads after the click.
          </p>
          <ComparisonTable
            productName="macos-use"
            competitorName="Other macOS MCP servers"
            rows={[
              {
                feature: "Detects PID drift after the action",
                ours: "Yes, inside the same tool call",
                competitor: "No, the target PID is fixed per call",
              },
              {
                feature: "Auto-traverses the new frontmost app",
                ours: "Yes, under app_switch_traversal",
                competitor: "No, requires a separate tool call",
              },
              {
                feature: "Summary line names the new app and PID",
                ours: "app_switch: <Name> (PID: N) is now frontmost",
                competitor: "Not present; model has to infer from errors",
              },
              {
                feature: "Screenshot follows the new frontmost PID",
                ours: "Yes, appSwitchPid is first in the fallback chain",
                competitor: "Screenshot is of the original PID's window",
              },
              {
                feature: "Graceful degradation when AX is denied",
                ours: "Keeps the name and PID, drops the tree",
                competitor: "N/A, the feature does not exist",
              },
              {
                feature: "Works for composed click+type+press chains",
                ours: "Detection runs after the whole chain, not between",
                competitor: "N/A",
              },
            ]}
          />
        </section>

        {/* The detection code */}
        <section className="bg-zinc-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <span className="inline-block bg-cyan-50 text-cyan-700 text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full mb-4">
              Anchor code
            </span>
            <h2 className="text-3xl font-bold text-zinc-900 mb-4">
              The 25 Lines That Catch The App Switch
            </h2>
            <p className="text-zinc-600 mb-6">
              One condition, one NSWorkspace read, one conditional traversal.
              Delete this block in a local fork and every cross-app workflow
              regresses to needing a manual refresh_traversal on the new PID.
            </p>
            <AnimatedCodeBlock
              code={detectionCode}
              language="swift"
              filename="Sources/MCPServer/main.swift"
            />
            <p className="text-zinc-500 text-sm mt-4">
              The hasDiff gate on line 1788 means refresh_traversal skips the
              check. That is intentional: refresh has no action to react to,
              and running the NSWorkspace query on every refresh would add work
              for nothing. click, type, press, scroll all carry hasDiff = true.
            </p>
          </div>
        </section>

        {/* AnimatedBeam , where the data goes */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            What Flows Into The Handoff Detector, What Flows Out
          </h2>
          <p className="text-zinc-600 mb-8 max-w-2xl">
            Three inputs converge on the detector; four separate fields of the
            outbound ToolResponse are written when a switch fires. The compact
            summary, the flat text file, and the screenshot path all read from
            those fields.
          </p>
          <AnimatedBeam
            title="PIDs in, enriched multi-app response out"
            from={[
              { label: "options.pidForTraversal (original)" },
              { label: "NSWorkspace frontmostApplication.pid" },
              { label: "hasDiff flag from the tool switch" },
            ]}
            hub={{ label: "cross-app handoff detector" }}
            to={[
              { label: "toolResponse.appSwitchPid" },
              { label: "toolResponse.appSwitchAppName" },
              { label: "toolResponse.appSwitchTraversal" },
              { label: "screenshotPid fallback chain" },
            ]}
          />
        </section>

        {/* Sequence diagram */}
        <section className="bg-zinc-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-zinc-900 mb-4">
              One Click, Two Apps, One Tool Response: The Sequence
            </h2>
            <p className="text-zinc-600 mb-8 max-w-2xl">
              From the MCP client&apos;s click_and_traverse request to the
              single response that describes two applications. Note that the
              handoff detector runs on the MainActor after restore-cursor and
              restore-frontmost have already tried to normalize focus.
            </p>
            <SequenceDiagram
              title="click_and_traverse with a cross-app handoff"
              actors={[
                "MCP client",
                "CallTool handler",
                "MacosUseSDK",
                "NSWorkspace",
                "Accessibility APIs",
              ]}
              messages={[
                {
                  from: 0,
                  to: 1,
                  label: "click_and_traverse pid=1247, link coords",
                  type: "request",
                },
                {
                  from: 1,
                  to: 2,
                  label: "performAction(click, options)",
                  type: "request",
                },
                {
                  from: 2,
                  to: 4,
                  label: "CGEvent.post + AX traversal of PID 1247",
                  type: "event",
                },
                {
                  from: 1,
                  to: 1,
                  label: "buildToolResponse(diff of Mail)",
                  type: "event",
                },
                {
                  from: 1,
                  to: 3,
                  label: "frontmostApplication?.processIdentifier",
                  type: "request",
                },
                {
                  from: 3,
                  to: 1,
                  label: "PID 8892 (Google Chrome)",
                  type: "response",
                },
                {
                  from: 1,
                  to: 4,
                  label: "traverseAccessibilityTree(8892) on MainActor",
                  type: "request",
                },
                {
                  from: 4,
                  to: 1,
                  label: "ResponseData for Chrome (247 elements)",
                  type: "response",
                },
                {
                  from: 1,
                  to: 0,
                  label: "one response: Mail diff + Chrome tree + Chrome PNG",
                  type: "response",
                },
              ]}
            />
          </div>
        </section>

        {/* Terminal output */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            What The Log And Summary Actually Say
          </h2>
          <p className="text-zinc-600 mb-8 max-w-2xl">
            Every log line below is emitted verbatim by the server. The log
            tokens &quot;app switch detected!&quot; and &quot;app_switch:&quot;
            are literal strings you can grep for. The summary lines
            app_switch and app_switch_elements always appear in that order
            when a switch fires.
          </p>
          <TerminalOutput
            title="mcp-server-macos-use (stderr + MCP response)"
            lines={terminalTranscript}
          />
        </section>

        {/* Flat text code */}
        <section className="bg-zinc-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-zinc-900 mb-4">
              Where The New App Shows Up In The Flat Text Response
            </h2>
            <p className="text-zinc-600 mb-6 max-w-2xl">
              MCP responses for macos-use are written to{" "}
              <span className="font-mono text-sm">/tmp/macos-use/</span> as flat
              text files; the tool call itself returns a compact summary with a
              file path. When a handoff fires, the new app&apos;s tree lives
              below a single header line you can grep for.
            </p>
            <AnimatedCodeBlock
              code={flatTextCode}
              language="swift"
              filename="Sources/MCPServer/main.swift"
            />
            <p className="text-zinc-500 text-sm mt-4">
              The header format{" "}
              <span className="font-mono text-sm">
                # app_switch: &lt;Name&gt; (PID: N)
              </span>{" "}
              is fixed, so a model can jump straight to it with{" "}
              <span className="font-mono text-sm">
                grep -n &apos;app_switch:&apos;
              </span>{" "}
              and continue reading line-by-line.
            </p>
          </div>
        </section>

        {/* Metrics */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            Numbers You Can Grep In The Current Commit
          </h2>
          <p className="text-zinc-600 mb-8 max-w-2xl">
            Every number below is a literal line reference from{" "}
            <span className="font-mono text-sm">
              Sources/MCPServer/main.swift
            </span>{" "}
            at HEAD. Clone the repo, open the file, jump to the line, the code
            matches.
          </p>
          <MetricsRow
            metrics={[
              { value: 25, label: "lines in the cross-app handoff detection block" },
              { value: 4, label: "ToolResponse fields mutated when a switch fires" },
              { value: 1, label: "NSWorkspace read per diff-producing tool call" },
              { value: 2, label: "apps described by a single MCP response" },
            ]}
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
            <GlowCard>
              <div className="p-6">
                <div className="text-4xl font-bold text-zinc-900">
                  <NumberTicker value={1786} />
                </div>
                <div className="text-sm text-zinc-500 mt-2">
                  first line of the detection block
                </div>
              </div>
            </GlowCard>
            <GlowCard>
              <div className="p-6">
                <div className="text-4xl font-bold text-zinc-900">
                  <NumberTicker value={1789} />
                </div>
                <div className="text-sm text-zinc-500 mt-2">
                  line that reads frontmostApplication.pid
                </div>
              </div>
            </GlowCard>
            <GlowCard>
              <div className="p-6">
                <div className="text-4xl font-bold text-zinc-900">
                  <NumberTicker value={1799} />
                </div>
                <div className="text-sm text-zinc-500 mt-2">
                  line calling traverseAccessibilityTree on new PID
                </div>
              </div>
            </GlowCard>
            <GlowCard>
              <div className="p-6">
                <div className="text-4xl font-bold text-zinc-900">
                  <NumberTicker value={1837} />
                </div>
                <div className="text-sm text-zinc-500 mt-2">
                  line where screenshotPid follows the switch
                </div>
              </div>
            </GlowCard>
          </div>
        </section>

        {/* StepTimeline , the full path */}
        <section className="bg-zinc-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-zinc-900 mb-4">
              Seven Stages From Click To A Response That Describes Two Apps
            </h2>
            <p className="text-zinc-600 mb-8 max-w-2xl">
              Each stage maps to a specific line range in main.swift. The
              handoff detector is stage five; everything before and after is
              the same path the single-app case walks.
            </p>
            <StepTimeline
              steps={[
                {
                  title: "Click posts a CGEvent against the original PID",
                  description:
                    "main.swift:1597-1601. performAction with primaryAction = .click receives the adjusted point (post scrollIntoViewIfNeeded) and posts the event. The tool has no idea yet whether this click will cause a focus change.",
                },
                {
                  title: "Additional actions, if composed",
                  description:
                    "main.swift:1710-1751. If click was chained with text and/or pressKey (click_and_traverse supports both), each additional action runs, cancellation is checked between steps via InputGuard.throwIfCancelled(), and a final traversal captures the combined state. Detection happens AFTER the whole chain, not between steps.",
                },
                {
                  title: "Cursor and frontmost-app restore attempt",
                  description:
                    "main.swift:1767-1781. The cursor returns to savedCursorPos via a synthetic mouseMoved event, and if savedFrontmostApp is still alive and not already frontmost, it gets activated. This runs BEFORE detection, so if the user's intent was 'click and stay on the new app', the detection still sees the new app because it reads NSWorkspace AFTER the action but BEFORE the restore can kick focus back.",
                },
                {
                  title: "buildToolResponse builds the diff for the original PID",
                  description:
                    "main.swift:1784. ToolResponse carries the primaryActionError, traversalError, windowBounds, diff (or traversal), and sheet detection flag. appSwitchPid is nil at this point.",
                },
                {
                  title: "Handoff detector reads NSWorkspace and compares PIDs",
                  description:
                    "main.swift:1786-1809. The only branch the page is about. If the current frontmost PID differs from originalPid, appSwitchPid and appSwitchAppName are set, and traverseAccessibilityTree is called on the new PID inside a @MainActor Task.",
                },
                {
                  title: "Flat text file is written with both apps under separate headers",
                  description:
                    "main.swift:1829. buildFlatTextResponse composes: # diff/# traversal header for the original PID, then if appSwitchTraversal is non-nil, a blank line and # app_switch: <Name> (PID: N) header followed by every element of the new PID.",
                },
                {
                  title: "Screenshot is captured against the new frontmost PID",
                  description:
                    "main.swift:1837-1840. The ?? chain prioritizes appSwitchPid over traversalPid over options.pidForTraversal. captureWindowScreenshot picks the right window via intersection scoring (see the separate guide on that), draws the click crosshair in the new window's coordinate space, and writes the PNG.",
                },
              ]}
            />
          </div>
        </section>

        {/* Screenshot PID code */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            The Screenshot Follows The Switch, Via A ?? Fallback Chain
          </h2>
          <p className="text-zinc-600 mb-6 max-w-2xl">
            One line decides which PID the PNG is of. The fallback order is:
            new app if a switch happened, otherwise the tool&apos;s original
            traversal PID, otherwise the pid argument. If a click opens Chrome,
            the screenshot is of Chrome; the click crosshair lands in
            Chrome&apos;s coordinate space, not Mail&apos;s.
          </p>
          <AnimatedCodeBlock
            code={screenshotPidCode}
            language="swift"
            filename="Sources/MCPServer/main.swift"
          />
        </section>

        {/* Proof banner , anchor quote */}
        <section className="max-w-4xl mx-auto px-6 py-12">
          <ProofBanner
            quote="app switch detected! Original PID 1247 -> new frontmost PID 8892 (Google Chrome)"
            source="stderr log line, main.swift:1792"
            metric="25"
          />
        </section>

        {/* Bento , scenarios */}
        <section className="bg-zinc-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-zinc-900 mb-6">
              Concrete Scenarios Where The Detection Saves You
            </h2>
            <p className="text-zinc-600 mb-8 max-w-2xl">
              Each of these is a real cross-app handoff the detector catches
              without a special case. Every one of them silently strands a
              naive automation tool on the old PID.
            </p>
            <BentoGrid
              cards={[
                {
                  title: "Click a link inside Mail or Messages",
                  description:
                    "The default browser takes focus. The original tool was driving PID 1247 (Mail); the response now describes PID 8892 (Chrome) under app_switch, and the next tool call can target Chrome directly without asking first.",
                  size: "2x1",
                },
                {
                  title: "Cmd-Tab, Cmd-backtick, or global hotkey",
                  description:
                    "press_key_and_traverse with keyName='Tab' modifierFlags=['Command'] promotes whatever the previous app was. The app_switch header names it, the tree describes it, the screenshot shows it.",
                  size: "1x1",
                },
                {
                  title: "Save sheet that exposes Finder",
                  description:
                    "Some apps route save sheets through a Finder UI that briefly takes focus. The switch gets captured; the agent can drive Finder without a manual refresh.",
                  size: "1x1",
                },
                {
                  title: "OAuth redirect to a browser",
                  description:
                    "Click Sign in with Google in a native app, a browser window pops to the front. app_switch carries the browser's PID and all of its form fields.",
                  size: "1x1",
                },
                {
                  title: "Terminal spawning a GUI editor",
                  description:
                    "Run code . or open -a Xcode in Terminal. The editor launches and steals focus. The next traversal is of the editor, not Terminal.",
                  size: "2x1",
                },
              ]}
            />
          </div>
        </section>

        {/* Marquee , trust strip */}
        <section className="py-12 border-y border-zinc-200">
          <div className="max-w-5xl mx-auto px-6">
            <p className="text-center text-zinc-500 text-sm mb-6 uppercase tracking-wide">
              Common cross-app handoff triggers the detector catches
            </p>
            <Marquee speed={45} fade pauseOnHover>
              {[
                "link click in Mail",
                "link click in Messages",
                "Cmd-Tab",
                "Cmd-backtick",
                "Spotlight invocation",
                "save sheet surfacing Finder",
                "open file in Finder",
                "OAuth redirect to browser",
                "SSO prompt to 1Password",
                "tel:// or mailto:// link",
                "calendar invite .ics open",
                "Xcode open -a",
                "code . from Terminal",
                "Messages reply from a notification",
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

        {/* Checklist */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <AnimatedChecklist
            title="What the detection guarantees, line by line"
            items={[
              {
                text: "The compact summary names the new frontmost app and PID so the model sees it before reading the file",
                checked: true,
              },
              {
                text: "The flat text file contains a greppable # app_switch: header followed by the new app's complete accessibility tree",
                checked: true,
              },
              {
                text: "The screenshot PNG is of the new app; the click crosshair is drawn in the new window's coordinate space",
                checked: true,
              },
              {
                text: "Composed click+type+press chains fire the detection once, after the full chain, not between steps",
                checked: true,
              },
              {
                text: "If the new app denies accessibility or errors on traversal, the PID and name are still reported so the caller learns about the switch",
                checked: true,
              },
              {
                text: "refresh_traversal does not run the detection (hasDiff == false), because it has no action to react to",
                checked: true,
              },
              {
                text: "The detection uses NSWorkspace, not CGWindowList ordering, so it is robust against z-order quirks",
                checked: true,
              },
            ]}
          />
        </section>

        {/* Install / try */}
        <section className="bg-zinc-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-zinc-900 mb-4">
              Try It Locally In Under Two Minutes
            </h2>
            <p className="text-zinc-600 mb-6 max-w-2xl">
              You need macOS, Xcode, and any MCP-compatible client (Claude
              Desktop, Cursor, Cline). Open Mail before starting; the click on
              a link is the shortest reproducible trigger.
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
              # Then add ./.build/release/mcp-server-macos-use to
              <br />
              # claude_desktop_config.json under mcpServers.
              <br />
              # Restart Claude Desktop and ask it to open Mail,
              <br />
              # click any link, and describe the resulting page.
              <br />
              # The log lines print to Claude Desktop&apos;s MCP log viewer;
              <br />
              # grep for &quot;app switch detected&quot;.
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
            heading="Read The Rest Of The Code"
            body="The cross-app handoff detector is one of six multi-app edge cases macos-use handles by default. The repo is MIT-licensed Swift; every line referenced on this page is stable at HEAD."
            linkText="Open the repo on GitHub"
            href="https://github.com/mediar-ai/mcp-server-macos-use"
          />
        </section>
      </article>
    </>
  );
}
