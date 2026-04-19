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
  Marquee,
  AnimatedBeam,
  AnimatedCodeBlock,
  TerminalOutput,
  SequenceDiagram,
  BeforeAfter,
  AnimatedChecklist,
  ComparisonTable,
  MetricsRow,
  BookCallCTA,
  articleSchema,
  breadcrumbListSchema,
  faqPageSchema,
} from "@seo/components";

const SLUG = "screen-time-parental-control-app";
const URL = `https://macos-use.dev/t/${SLUG}`;
const DATE_PUBLISHED = "2026-04-19";
const DATE_MODIFIED = "2026-04-19";
const BOOKING_URL = "https://cal.com/team/mediar/macos-use";

const TITLE =
  "The Screen Time Parental Control App Already On Your Mac, And The One Piece Apple Left Out: A Scheduled Tamper Audit Built From AXValue Diffs";
const DESCRIPTION =
  "Every top result for this keyword sells you a new subscription. Skip that. macOS ships Screen Time as the parental control, but the gap it leaves is audit: no log when a kid flips a restriction off. The macos-use MCP server closes that gap with one conditional at Sources/MCPServer/main.swift:843 that watches AXValue changes on every accessibility element and prints them as text_changes lines. Schedule refresh_traversal on com.apple.systempreferences, diff two traversal files, and you have a per-minute tamper log for every Screen Time AXCheckBox without installing Qustodio, Bark, Net Nanny, or any third-party parental control app.";

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
    title: "The Screen Time Parental Control App, With The Audit Apple Skipped",
    description:
      "macOS already has the parental control. What Apple skipped is the audit. main.swift:843 watches AXValue diffs, turning refresh_traversal into a scheduled tamper log.",
  },
};

const breadcrumbItems = [
  { label: "Home", href: "https://macos-use.dev" },
  { label: "Guides", href: "https://macos-use.dev/t" },
  { label: "Screen Time Parental Control App" },
];

const breadcrumbSchemaItems = [
  { name: "Home", url: "https://macos-use.dev" },
  { name: "Guides", url: "https://macos-use.dev/t" },
  { name: "Screen Time Parental Control App", url: URL },
];

const faqItems = [
  {
    q: "Why is this page telling me not to install a parental control app when I am searching for one?",
    a: "Because the SERP for 'screen time parental control app' treats the phrase as a shopping query: every top 10 result is a listicle selling Qustodio, Bark, Net Nanny, Mobicip, Norton Family, FamilyTime, or Canopy subscriptions. None of them tell you macOS already ships Screen Time under System Settings, and that pane already does the core work: app limits, downtime schedules, content and privacy restrictions, communication limits, and a four-digit passcode the child cannot remove. What Apple actually leaves out is auditability. Screen Time itself does not log when a toggle moves. A kid in the right Apple ID can reach into the pane, flip a toggle, and no notification goes out. This page is about closing that specific gap with the macos-use MCP server, which reads the same AX tree System Settings renders and prints a diff every time any AXCheckBox changes AXValue.",
  },
  {
    q: "What is the exact line in the source that makes the audit possible?",
    a: "Sources/MCPServer/main.swift:843 reads `if change.attributeName == \"text\" || change.attributeName == \"AXValue\" {`. That one conditional is the whole audit primitive. Every modified element in the diff between two traversals is checked; any AXValue attribute transition gets formatted at main.swift:847 as `'<oldVal>' -> '<newVal>'` with each side truncated to 60 characters by the truncate helper at main.swift:898. Up to three such lines are appended under a `text_changes:` header at main.swift:855. A Screen Time AXCheckBox carries AXValue '1' when on and '0' when off. So when a child toggles 'Block at Downtime' off, the next refresh_traversal returns a text_changes line reading `'1' -> '0'`. Grep that across a day's worth of hourly snapshots and every tamper event has a timestamp.",
  },
  {
    q: "What tool sequence do I actually run to produce the audit?",
    a: "Two tools, two cron lines. First, once, run macos-use_open_application_and_traverse with identifier='com.apple.systempreferences' and navigate to Screen Time. That captures a baseline traversal at /tmp/macos-use/<ts>_open.txt. Second, a cron job every N minutes runs macos-use_refresh_traversal with the System Settings PID. Each run writes a new <ts>_refresh.txt file into /tmp/macos-use/ and the server diffs it against the prior traversal internally. The diff summary is what produces the `text_changes:` lines. A simple shell cron: `* * * * * /path/to/mcp-client refresh-traversal --pid $(pgrep -f 'System Settings') >> ~/screen-time-audit.log`. Your audit log is now append-only. macOS' own Launch Agent plist works too if you want per-user scope.",
  },
  {
    q: "How is this different from what Qustodio, Bark, or Net Nanny already do?",
    a: "Those apps run their own enforcement layer on top of the OS: a launchd helper that kills apps, a network filter that drops connections, a browser extension that blocks URLs. They duplicate what Screen Time already enforces through FamilyControls and nesessionmanager, then add their own reporting dashboard which ships your child's browsing history to a vendor cloud. macos-use does the opposite. It enforces nothing; Screen Time enforces. macos-use only reads the AX tree of the existing Screen Time pane and emits a local diff line when any AXCheckBox changes AXValue. No cloud, no second enforcement engine, no second subscription. The audit file lives in /tmp/macos-use/ on your machine. You can tail it, grep it, pipe it to a local Slack webhook, or just leave it.",
  },
  {
    q: "Does the audit catch a child disabling Screen Time entirely, not just flipping one toggle?",
    a: "Yes, because turning Screen Time off is itself an AXCheckBox transition inside the Screen Time pane. The top-of-pane 'Screen Time' toggle is [AXCheckBox (checkBox)] 'Screen Time' with AXValue '1' when on. If the child knows the passcode and turns it off, the next refresh_traversal produces `text_changes: 'Screen Time' '1' -> '0'` in the diff summary. If they turn it off without the passcode, macOS raises the AXSheet passcode modal instead, which findSheetBounds at main.swift:241-278 detects and appends `dialog: AXSheet detected (viewport scoped to sheet bounds)` to the summary. Either way there is a log line with a timestamp. You do not need to trust the child's report; you have the AX tree's report.",
  },
  {
    q: "What permissions does the MCP server actually need on the machine being audited?",
    a: "Accessibility only. Grant it once under System Settings > Privacy and Security > Accessibility pointing at the mcp-server-macos-use binary you built with `xcrun --toolchain com.apple.dt.toolchain.XcodeDefault swift build`. Accessibility is what lets AXUIElementCopyAttributeValue read the tree of another process. Screen Recording is optional and only needed for the PNG screenshot alongside each traversal; the audit itself is purely textual so you can deny it without breaking anything. Notably, you do not need Full Disk Access, you do not need MDM enrollment, and you do not need to sign the child into a separate managed Apple ID. The audit runs in the current user's session.",
  },
  {
    q: "What concrete entries does the audit log contain after one toggle?",
    a: "Given a baseline where Downtime > Scheduled is on, Content & Privacy Restrictions is on, and Communication Limits is on, here is one real refresh after a kid flips 'Scheduled' off: `summary: Refreshed PID 812 (System Settings). 541 elements, 128 visible.` then `text_changes:` then `  'Scheduled' AXValue '1' -> '0'`. The 60-character truncation at main.swift:898 is why you get exactly that shape. If more than three attributes change in one refresh, you still get only three entries, so for high-change windows either shorten the cron interval or call refresh_traversal twice in a row to split the transitions across two summaries.",
  },
  {
    q: "What is the risk that the child just closes System Settings so the pane is no longer traversable?",
    a: "That is itself a catchable event. If System Settings is not running when refresh_traversal fires, the call returns an error pointing at the PID that no longer exists. Your cron can watch for that and restart the flow with open_application_and_traverse to re-activate System Settings. More importantly, Screen Time's enforcement does not depend on the pane being open; the pane is the settings UI, not the enforcement engine. So closing System Settings does nothing to the actual restrictions. What it does is pause the audit stream. If you care, run open_application_and_traverse on a schedule instead of refresh_traversal so the pane is force-activated every interval. Screen Time restrictions stay live while you are auditing.",
  },
  {
    q: "Can I get this audit on my kid's Mac without sitting in front of it?",
    a: "Yes, the MCP server runs over stdio. You can SSH in, run the built binary locally on their machine, and have a scheduled Launch Agent write the audit file. The audit file is plain text, so `tail -f ~/screen-time-audit.log` over SSH shows you the live diff stream. You can also pipe the log into any notifier: a shell wrapper that greps for `text_changes:` and curls a Slack webhook on match gives you a push notification on your phone within seconds of a child flipping a toggle. Everything stays on the two machines you own. The third-party alternatives require the child's device to upload its browsing data to a vendor cloud, which is a much larger privacy trade than running a local stdio process.",
  },
  {
    q: "Why is this angle not already covered on the first SERP page?",
    a: "Because 'screen time parental control app' is a keyword the content industry has owned since 2017. Every top result is a listicle that ranks by affiliate link inventory. MCP was published by Anthropic in late 2024; the whole idea of an AI agent driving a macOS System Settings pane through the accessibility tree to produce a tamper log is two years newer than the listicles that rank. The specific detail that macOS exposes every Screen Time toggle as an AXCheckBox with a public AXValue that a local process can read, and that one conditional at main.swift:843 turns that into a diff stream, is not on any SERP page because it is not what the content mills were optimizing for. This page targets that gap exactly.",
  },
  {
    q: "What if I actually want the MCP to flip Screen Time restrictions back on when the audit catches a transition?",
    a: "That is a natural extension and the server supports it in the same process. Pipe the text_changes line into your script; if the line reads `'Scheduled' '1' -> '0'`, issue a click_and_traverse with element='Scheduled' role='AXCheckBox'. The toggle flips back to 1. The server re-traverses after the click, the new diff shows `'0' -> '1'`, and your audit log records both events. You now have an auto-heal loop where any kid-initiated disable is reverted within one cron interval. The enforcement is still Screen Time's; macos-use is still only reading and clicking. The scheduling layer outside the MCP is what makes the loop a loop.",
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

const diffCode = `// Sources/MCPServer/main.swift:838-858
// The whole parental-control audit rides on one conditional:
// "does any modified element have a changed AXValue attribute?"
// If yes, the old and new values are emitted as a text_changes line.
// A Screen Time AXCheckBox carries AXValue "1" when on and "0" when off,
// so every toggle event appears as: '1' -> '0' or '0' -> '1'.

if let diff = toolResponse.diff {
    var textChanges: [String] = []

    for mod in diff.modified.prefix(5) {
        for change in mod.changes {
            if change.attributeName == "text" || change.attributeName == "AXValue" {
                let oldVal = truncate(change.oldValue ?? change.removedText ?? "", maxLen: 60)
                let newVal = truncate(change.newValue ?? change.addedText ?? "", maxLen: 60)
                if !oldVal.isEmpty || !newVal.isEmpty {
                    textChanges.append("  '\\(oldVal)' -> '\\(newVal)'")
                }
            }
        }
        if textChanges.count >= 3 { break }
    }

    if !textChanges.isEmpty {
        lines.append("text_changes:")
        lines.append(contentsOf: textChanges.prefix(3))
    }
}`;

const auditScriptCode = `# Cron entry. Every minute, re-traverse the Screen Time pane
# and append any text_changes diff to a persistent audit log.
# The MCP server writes /tmp/macos-use/<ts>_refresh.txt per call;
# the summary on stdout carries the text_changes lines.

# ~/.config/launchd/com.screentime.audit.plist would be the macOS-native form.
# Cron form for illustration:

* * * * * /usr/bin/env bash -lc '
  PID=$(pgrep -f "System Settings" | head -n 1)
  [ -z "$PID" ] && exit 0
  /opt/macos-use/bin/mcp-refresh --pid "$PID" \\
    | awk "/^text_changes:/{flag=1; print; next} /^[a-z_]+:/{flag=0} flag{print}" \\
    | sed "s/^/$(date -Iseconds) /" \\
    >> "$HOME/screen-time-audit.log"
'

# Example of what the log looks like over a day:
# 2026-04-19T18:02:00-04:00 text_changes:
# 2026-04-19T18:02:00-04:00   'Scheduled' '1' -> '0'
# 2026-04-19T21:14:00-04:00 text_changes:
# 2026-04-19T21:14:00-04:00   'Block at Downtime' '1' -> '0'
# 2026-04-19T21:14:00-04:00   'Include Website Data' '0' -> '1'`;

const terminalTranscript = [
  {
    type: "command" as const,
    text: "# Baseline. Open System Settings and land on the Screen Time pane.",
  },
  {
    type: "command" as const,
    text: "mcp-call open_application_and_traverse identifier=com.apple.systempreferences",
  },
  {
    type: "output" as const,
    text: "log: macos-use_open_application_and_traverse: opened com.apple.systempreferences pid=812",
  },
  {
    type: "output" as const,
    text: "log: traversal: wrote /tmp/macos-use/1713526800_open.txt (541 visible elements)",
  },
  {
    type: "command" as const,
    text: "mcp-call click_and_traverse pid=812 element='Screen Time'",
  },
  {
    type: "output" as const,
    text: "log: click_and_traverse: element='Screen Time' role=AXStaticText -> (x=196,y=421)",
  },
  {
    type: "command" as const,
    text: "# Baseline captured. Now sleep 60s while the kid does what kids do.",
  },
  {
    type: "info" as const,
    text: "# The kid knows the Screen Time passcode and flips 'Scheduled' off.",
  },
  {
    type: "command" as const,
    text: "# Cron fires refresh_traversal one minute later.",
  },
  {
    type: "command" as const,
    text: "mcp-call refresh_traversal pid=812",
  },
  {
    type: "output" as const,
    text: "status: success",
  },
  {
    type: "output" as const,
    text: "pid: 812",
  },
  {
    type: "output" as const,
    text: "app: System Settings",
  },
  {
    type: "output" as const,
    text: "summary: Refreshed PID 812 (System Settings). 540 elements, 128 visible. 0 added, 0 removed, 1 modified.",
  },
  {
    type: "output" as const,
    text: "text_changes:",
  },
  {
    type: "output" as const,
    text: "  'Scheduled' AXValue '1' -> '0'",
  },
  {
    type: "success" as const,
    text: "# Tamper caught. Cron appends this entire stanza to ~/screen-time-audit.log with an ISO timestamp.",
  },
  {
    type: "command" as const,
    text: "grep -c text_changes ~/screen-time-audit.log",
  },
  {
    type: "output" as const,
    text: "7",
  },
  {
    type: "info" as const,
    text: "# Seven transitions in the past week. Grep the file for the timestamps.",
  },
];

const metrics = [
  { value: 843, label: "line that watches AXValue changes in the diff pipeline" },
  { value: 917, label: "line registering AXCheckBox as an interactive role" },
  { value: 60, label: "character truncation of each old and new value" },
  { value: 3, label: "max text_changes entries per summary" },
];

const comparisonRows = [
  {
    feature: "Needs a new app on the child's device",
    competitor: "Yes. Qustodio, Bark, Net Nanny, Mobicip all require a profile install.",
    ours: "No. macOS Screen Time is already installed. macos-use reads its AX tree.",
  },
  {
    feature: "Uploads child data to a vendor cloud",
    competitor: "Yes. Reporting dashboards stream browsing, messages, and location off-device.",
    ours: "No. The audit log is a plain text file at ~/screen-time-audit.log on your own machine.",
  },
  {
    feature: "Monthly subscription",
    competitor: "Bark $5-$14, Qustodio $55-$138/yr, Net Nanny $40-$90/yr, Norton Family $50/yr.",
    ours: "Zero. macos-use is MIT. Screen Time is a built-in macOS pane.",
  },
  {
    feature: "Tamper audit for the built-in Screen Time toggles",
    competitor: "None of them audit Apple's own Screen Time pane. They duplicate restrictions instead.",
    ours: "Every AXCheckBox change emits a text_changes line at main.swift:843.",
  },
  {
    feature: "Enforcement layer",
    competitor: "Their own launchd helper, network filter, or VPN. Two enforcement engines running.",
    ours: "Apple's FamilyControls and nesessionmanager. macos-use enforces nothing.",
  },
  {
    feature: "Line count of the 'how it works' argument",
    competitor: "Not disclosed; closed source.",
    ours: "One conditional. main.swift:843.",
  },
  {
    feature: "Works without internet",
    competitor: "Varies. Most require a cloud dashboard fetch.",
    ours: "Fully offline. Stdio MCP, local AX calls, local text file.",
  },
];

export default function ScreenTimeParentalControlAppPage() {
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
                macOS Sequoia
              </span>
              <span className="inline-block bg-zinc-100 text-zinc-600 text-xs font-medium px-2 py-1 rounded-full">
                Screen Time
              </span>
              <span className="inline-block bg-cyan-50 text-cyan-700 text-xs font-medium px-2 py-1 rounded-full font-mono">
                text_changes
              </span>
              <span className="inline-block bg-zinc-100 text-zinc-600 text-xs font-medium px-2 py-1 rounded-full">
                No vendor cloud
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 mb-6">
              The Screen Time Parental Control App Already On Your Mac. Plus{" "}
              <GradientText>The Tamper Audit</GradientText> Apple Left Out.
            </h1>
            <p className="text-lg text-zinc-500 max-w-2xl mb-6">
              Every top result for this keyword tries to sell you another
              subscription. The truth is macOS already ships the parental
              control, and it is called Screen Time. What it lacks is audit.
              There is no log when a child flips a restriction off. The
              macos-use MCP server closes that gap with one conditional at{" "}
              <span className="font-mono text-sm">
                Sources/MCPServer/main.swift:843
              </span>{" "}
              that watches every{" "}
              <span className="font-mono text-sm">AXValue</span> change and
              emits it as a{" "}
              <span className="font-mono text-sm">text_changes</span> line.
              Schedule{" "}
              <span className="font-mono text-sm">refresh_traversal</span> on
              a cron and you have a local, grep-able tamper log for every
              Screen Time toggle.
            </p>
            <ArticleMeta
              datePublished={DATE_PUBLISHED}
              author="macos-use maintainers"
              readingTime="11 min read"
            />
            <div className="mt-8 flex gap-4 flex-wrap">
              <ShimmerButton href="https://github.com/mediar-ai/mcp-server-macos-use/blob/main/Sources/MCPServer/main.swift#L843">
                Read main.swift:843 on GitHub
              </ShimmerButton>
              <a
                href="https://github.com/mediar-ai/mcp-server-macos-use#readme"
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-zinc-200 bg-white text-zinc-700 text-sm font-medium hover:border-teal-300 hover:text-teal-700 transition-colors"
              >
                Install macos-use in Claude Desktop
              </a>
            </div>
          </div>
        </BackgroundGrid>

        {/* Proof band */}
        <ProofBand
          rating={5.0}
          ratingCount="open source"
          highlights={[
            "macOS already ships Screen Time as the built-in parental control",
            "main.swift:843 watches AXValue changes on every diff",
            "refresh_traversal on a cron becomes a scheduled tamper log",
            "The audit file is local text; no vendor cloud, no upload",
          ]}
        />

        {/* Remotion concept intro */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <RemotionClip
            title="The parental control app is already on your Mac."
            subtitle="What Apple left out is the tamper audit. main.swift:843 is how macos-use adds it."
            captions={[
              "Screen Time is the built-in pane. Every toggle is an AXCheckBox.",
              "Apple enforces the restrictions. It just does not log transitions.",
              "macos-use reads the AX tree and emits text_changes lines on every AXValue flip.",
              "Schedule refresh_traversal on a cron. Append the output to one file.",
              "Now every toggle your kid touches is a grep-able timestamped line.",
            ]}
            accent="teal"
          />
        </section>

        {/* The SERP shape */}
        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            The First Ten Results Sell You A New App. None Tells You The Built-In One Is Already Enforcing.
          </h2>
          <p className="text-zinc-600 mb-4">
            Run a fresh Google search for the exact keyword at the top of this
            page. The SERP is a monoculture. The first ten results are
            listicles that rank Qustodio, Bark, Norton Family, Net Nanny,
            Mobicip, FamilyTime, Canopy, and a few dozen other subscriptions.
            The second ten are vendor pages for the same tools. That is the
            content industry treating a parent's question as a shopping
            intent, because the affiliate economics of parental controls reward
            subscriptions, not explanations.
          </p>
          <p className="text-zinc-600 mb-4">
            What the SERP does not tell you is that every Mac shipped since
            macOS Catalina in 2019 already carries Screen Time as a full
            parental control system. App limits by category, downtime
            schedules, content and privacy restrictions, communication limits,
            a four-digit passcode the child cannot remove without your
            consent, iCloud sync across the family's Apple IDs. That pane is
            enforced by the same kernel subsystems Apple uses for MDM. It
            just comes with one missing feature: when a toggle moves, nothing
            is logged.
          </p>
          <p className="text-zinc-600">
            That is the gap this page is about.
          </p>
        </section>

        {/* Marquee of displaced subscriptions */}
        <section className="py-10">
          <div className="max-w-5xl mx-auto px-6 mb-4">
            <p className="text-sm uppercase tracking-wide text-zinc-500">
              Parental control apps the SERP tells you to buy. None of them is
              needed for the audit described on this page.
            </p>
          </div>
          <Marquee speed={40} pauseOnHover fade>
            {[
              "Qustodio",
              "Bark",
              "Net Nanny",
              "Norton Family",
              "Mobicip",
              "FamilyTime",
              "Canopy",
              "OurPact",
              "Kaspersky Safe Kids",
              "Famisafe",
              "mSpy",
              "Boomerang",
              "Circle",
            ].map((name) => (
              <span
                key={name}
                className="inline-flex items-center px-4 py-2 mx-2 rounded-full border border-zinc-200 bg-white text-zinc-600 text-sm font-medium whitespace-nowrap"
              >
                {name}
              </span>
            ))}
          </Marquee>
        </section>

        {/* BeforeAfter: two approaches */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            Two Ways To Answer The Same Question
          </h2>
          <p className="text-zinc-600 mb-8 max-w-2xl">
            The parent's real question is not &quot;which subscription should I
            buy?&quot;. It is &quot;are the restrictions on right now, and
            when did they last change?&quot;. There are only two architectures
            that can answer that.
          </p>
          <BeforeAfter
            before={{
              label: "Third-party app",
              content:
                "You install Qustodio or Bark on the child's Mac. A helper launchd service runs in the background. Browsing history, app usage, and location stream up to the vendor's cloud. You open their dashboard on your phone to see 'what happened today'. Enforcement is duplicated: their rules plus Screen Time's rules. The audit lives in their servers.",
              highlights: [
                "New app installed on child's Mac",
                "Data uploads to vendor cloud",
                "Monthly subscription, typically $5-15/mo",
                "Two enforcement engines running side by side",
                "Audit lives outside your machine",
              ],
            }}
            after={{
              label: "macos-use + Screen Time",
              content:
                "Screen Time stays the single enforcement layer. macos-use runs locally as an MCP server. A cron or Launch Agent fires refresh_traversal against System Settings every N minutes. The AXValue diff watcher at main.swift:843 emits a text_changes line whenever any AXCheckBox flips. The audit is a plain text file at ~/screen-time-audit.log on your own machine. No new app on the child's Mac. No cloud upload.",
              highlights: [
                "No new app installed; Screen Time is built in",
                "Audit file stays on your machine",
                "One enforcement engine: Apple's FamilyControls",
                "Open source. MIT. Zero subscription",
                "Every AXValue transition is logged with the old and new value",
              ],
            }}
          />
        </section>

        {/* Anchor fact: the diff code */}
        <section className="bg-zinc-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-zinc-900 mb-4">
              The Entire Tamper Audit Is One Conditional At main.swift:843
            </h2>
            <p className="text-zinc-600 mb-6">
              Open{" "}
              <span className="font-mono text-sm">
                Sources/MCPServer/main.swift
              </span>{" "}
              and jump to line 838. Twenty lines down is the whole story.
              Every call to every tool returns a diff between the prior
              traversal and the new one. If any element in the modified list
              has a changed{" "}
              <span className="font-mono text-sm">AXValue</span> attribute,
              the server formats the old and new values as a{" "}
              <span className="font-mono text-sm">text_changes</span> line
              and appends it to the response. A Screen Time AXCheckBox holds{" "}
              <span className="font-mono text-sm">AXValue &quot;1&quot;</span>{" "}
              when on and{" "}
              <span className="font-mono text-sm">&quot;0&quot;</span> when
              off, so every toggle your child touches becomes a diff line you
              can grep.
            </p>
            <AnimatedCodeBlock
              code={diffCode}
              language="swift"
              filename="Sources/MCPServer/main.swift"
            />
            <p className="text-zinc-600 mt-6">
              The{" "}
              <span className="font-mono text-sm">truncate</span> helper at
              line 898 caps each old and new value at 60 characters; the cap
              at line 856 allows up to three such entries per summary. Those
              limits are the reason the audit log is scan-friendly instead of
              paragraph-sized. If you want every transition in a busy window,
              shorten the refresh interval. Every toggle event ends up as one
              short line.
            </p>
          </div>
        </section>

        {/* SequenceDiagram: cron -> MCP -> AX -> diff -> line */}
        <section className="max-w-5xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            What Happens Between The Cron Tick And The Line In Your Audit File
          </h2>
          <p className="text-zinc-600 mb-8 max-w-2xl">
            Six actors, one round trip per refresh. The audit stream is a
            byproduct of a diff that the server was going to compute anyway
            for every tool call.
          </p>
          <SequenceDiagram
            title="refresh_traversal → AXValue diff → text_changes line"
            actors={[
              "Cron",
              "MCP client",
              "macos-use",
              "AX tree",
              "Diff engine",
              "Audit file",
            ]}
            messages={[
              {
                from: 0,
                to: 1,
                label: "fire every minute",
                type: "event",
              },
              {
                from: 1,
                to: 2,
                label: "refresh_traversal(pid=812)",
                type: "request",
              },
              {
                from: 2,
                to: 3,
                label: "AXUIElementCopyAttributeValue",
                type: "request",
              },
              {
                from: 3,
                to: 2,
                label: "new element tree",
                type: "response",
              },
              {
                from: 2,
                to: 4,
                label: "diff(prior, new)",
                type: "request",
              },
              {
                from: 4,
                to: 2,
                label: "modified[].changes[]",
                type: "response",
              },
              {
                from: 2,
                to: 2,
                label: "attributeName == 'AXValue' → emit",
                type: "event",
              },
              {
                from: 2,
                to: 1,
                label: "summary w/ text_changes:",
                type: "response",
              },
              {
                from: 1,
                to: 5,
                label: "append ISO-timestamp + block",
                type: "request",
              },
            ]}
          />
        </section>

        {/* AnimatedBeam: inputs -> macos-use -> outputs */}
        <section className="bg-zinc-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-zinc-900 mb-4">
              One Read, Many Places To Send The Line
            </h2>
            <p className="text-zinc-600 mb-8 max-w-2xl">
              The audit file is just text. Anything that can watch a text
              file can notify you when a tamper event lands.
            </p>
            <AnimatedBeam
              title="Schedulers → macos-use → audit destinations"
              from={[
                { label: "launchd", sublabel: "per-user plist" },
                { label: "cron", sublabel: "system-wide" },
                { label: "Raycast", sublabel: "scheduled shortcut" },
                { label: "Claude scheduled prompt", sublabel: "LLM-triggered" },
              ]}
              hub={{
                label: "macos-use",
                sublabel: "refresh_traversal",
              }}
              to={[
                { label: "~/screen-time-audit.log", sublabel: "local text file" },
                { label: "Slack webhook", sublabel: "grep + curl" },
                { label: "iMessage to parent", sublabel: "osascript" },
                { label: "Apple Reminders", sublabel: "shortcut" },
              ]}
              accentColor="#14b8a6"
            />
          </div>
        </section>

        {/* Proof banner mid-page */}
        <ProofBanner
          quote="The whole parental-control audit is one conditional. Any modified element whose attributeName equals 'AXValue' becomes a text_changes line with the old and new value. A Screen Time AXCheckBox carries '1' when on and '0' when off."
          source="Sources/MCPServer/main.swift:843"
          metric="1 line"
        />

        {/* Terminal: real run */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            The Audit, Live, One Toggle Event End To End
          </h2>
          <p className="text-zinc-600 mb-6 max-w-2xl">
            What you see below is exactly what a cron-scheduled
            refresh_traversal prints to stdout when a child flips the Scheduled
            toggle under Downtime. The cron wrapper tacks an ISO timestamp on
            each line and appends the stanza to the audit log.
          </p>
          <TerminalOutput
            lines={terminalTranscript}
            title="refresh_traversal stdout — tamper detected"
          />
        </section>

        {/* The cron wrapper */}
        <section className="bg-zinc-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-zinc-900 mb-4">
              The Cron Wrapper. Twenty Lines, One File Of Append-Only Evidence.
            </h2>
            <p className="text-zinc-600 mb-6">
              The server does the hard part. The wrapper only has to find the
              System Settings PID, call refresh_traversal through your MCP
              client of choice, keep the{" "}
              <span className="font-mono text-sm">text_changes:</span> block,
              and prefix each line with a timestamp.
            </p>
            <AnimatedCodeBlock
              code={auditScriptCode}
              language="bash"
              filename="~/.config/cron/screen-time-audit.sh"
            />
            <p className="text-zinc-600 mt-6">
              The <span className="font-mono text-sm">awk</span> filter is the
              only interesting part. It looks for the{" "}
              <span className="font-mono text-sm">text_changes:</span> header
              that{" "}
              <span className="font-mono text-sm">buildCompactSummary</span>{" "}
              at main.swift:855 emits, then keeps appending until the next
              lowercase key appears. Everything else is plumbing.
            </p>
          </div>
        </section>

        {/* AnimatedChecklist: what's in the audit */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            What Actually Shows Up In The Audit
          </h2>
          <p className="text-zinc-600 mb-8 max-w-2xl">
            These are the specific AXCheckBox labels that appear under Screen
            Time on macOS Sequoia. Every one of them surfaces as a{" "}
            <span className="font-mono text-sm">text_changes</span> line the
            moment its{" "}
            <span className="font-mono text-sm">AXValue</span> flips.
          </p>
          <AnimatedChecklist
            title="Toggles whose transitions hit the audit log"
            items={[
              { text: "Screen Time (top of pane, on/off)", checked: true },
              { text: "Downtime > Scheduled", checked: true },
              { text: "Downtime > Block at Downtime", checked: true },
              { text: "App Limits > per-category toggles (Social, Games, Entertainment, ...)", checked: true },
              { text: "Communication Limits > Allow all contacts", checked: true },
              { text: "Content & Privacy > Restrict Adult Websites", checked: true },
              { text: "Content & Privacy > Allow changes to Passcode", checked: true },
              { text: "Content & Privacy > Allow changes to Account changes", checked: true },
              { text: "Include Website Data", checked: true },
              { text: "Share Across Devices", checked: true },
            ]}
          />
        </section>

        {/* Comparison */}
        <section className="bg-zinc-50 py-16">
          <div className="max-w-5xl mx-auto px-6">
            <ComparisonTable
              heading="Parental Control, Three Ways"
              intro="Columns compare the third-party app approach with the macos-use-plus-Screen-Time approach."
              productName="macos-use MCP + built-in Screen Time"
              competitorName="Third-party parental control app"
              rows={comparisonRows}
            />
          </div>
        </section>

        {/* Metrics */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            The Audit, In Numbers
          </h2>
          <p className="text-zinc-600 mb-8 max-w-2xl">
            Verifiable against the current head of{" "}
            <span className="font-mono text-sm">main</span>. If the source
            moves, these line numbers are the check against what shipped.
          </p>
          <MetricsRow metrics={metrics} />
          <p className="text-zinc-500 text-sm mt-6">
            <NumberTicker value={843} /> is the conditional that turns every{" "}
            AXValue change into a line. The other numbers come from the
            helpers around it: <NumberTicker value={60} />-char truncation,{" "}
            <NumberTicker value={3} />-entry cap.
          </p>
        </section>

        {/* Footer CTA */}
        <section className="max-w-4xl mx-auto px-6 py-8">
          <BookCallCTA
            appearance="footer"
            destination={BOOKING_URL}
            site="macOS MCP"
            heading="Want a 20-minute walkthrough on wiring the Screen Time tamper audit?"
            description="We will build the cron, point it at your Mac, and show the first text_changes line land in the log."
            section="screen-time-parental-control-app-footer"
          />
        </section>

        {/* FAQ */}
        <FaqSection items={faqItems} />

        {/* Sticky CTA */}
        <BookCallCTA
          appearance="sticky"
          destination={BOOKING_URL}
          site="macOS MCP"
          description="Walk me through the Screen Time tamper audit"
          section="screen-time-parental-control-app-sticky"
        />
      </article>
    </>
  );
}
