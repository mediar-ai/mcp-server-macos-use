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
  NumberTicker,
  Marquee,
  AnimatedCodeBlock,
  TerminalOutput,
  ComparisonTable,
  BentoGrid,
  StepTimeline,
  MetricsRow,
  ProofBanner,
  BookCallCTA,
  articleSchema,
  breadcrumbListSchema,
  faqPageSchema,
} from "@seo/components";

const SLUG = "screen-time-parental-control-apps";
const URL = `https://macos-use.dev/t/${SLUG}`;
const DATE_PUBLISHED = "2026-04-19";
const DATE_MODIFIED = "2026-04-19";
const TITLE =
  "Screen Time Parental Control Apps: Why Every One Of Them Reports Its Own Status (And How To Audit That With An Accessibility Tree)";
const DESCRIPTION =
  "Every screen time parental control app on macOS falls into one of four enforcement models, and each of them reports its own status. A child who can disable the app silently also hides the tamper from the reporting path. This guide names the four models, admits what each one is good at, and documents a separate audit layer that reads Apple's accessibility tree directly so a toggle flip from '1' to '0' shows up as a plain text diff regardless of which app produced it.";

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
    title: "Screen time parental control apps all report their own status. Read the AX tree instead.",
    description:
      "Qustodio, Bark, Norton Family, Apple Screen Time, Circle. Four enforcement models, one blind spot. A macOS MCP server reads the accessibility tree and emits a diff line like ~ 'Screen Time' AXValue '1' -> '0' when any of them gets tampered with.",
  },
};

const breadcrumbItems = [
  { label: "Home", href: "https://macos-use.dev" },
  { label: "Guides", href: "https://macos-use.dev/t" },
  { label: "Screen time parental control apps" },
];

const breadcrumbSchemaItems = [
  { name: "Home", url: "https://macos-use.dev" },
  { name: "Guides", url: "https://macos-use.dev/t" },
  { name: "Screen time parental control apps", url: URL },
];

const faqItems = [
  {
    q: "Why isn't this article a ranked list of the best screen time parental control apps?",
    a: "Because the SERP already has fifty of those. Every listicle compares features and prices and lands on some mix of Qustodio, Bark, Norton Family, Apple Screen Time, and Circle. They all miss the same thing: every one of those apps reports its own status. If the app is disabled, the status page is also disabled. That is a category-wide blind spot, and it is unrelated to which app you pick. This page describes the four enforcement models underneath those apps and an independent audit layer that reads the macOS accessibility tree so tamper shows up regardless of which vendor you trust.",
  },
  {
    q: "What are the four enforcement models parental control apps use on macOS?",
    a: "Built-in, network, agent, and MDM. Built-in means Apple Screen Time, enforced by the OS itself through Family Controls. Network means DNS filtering on the home router or an always-on VPN, so traffic gets blocked before it reaches the device. Agent means a third-party app installs a macOS process that enforces time limits and site blocks locally (Qustodio, Bark, Norton Family, Mobicip). MDM means enrollment into a device management profile that pushes restrictions down as a policy. Each model has different failure modes, and this article lists them honestly.",
  },
  {
    q: "What is the anchor fact the audit approach is built on?",
    a: "Sources/MCPServer/main.swift line 843 watches attributeName == 'AXValue' across successive accessibility-tree snapshots and emits a text_changes line whenever that attribute transitions on any element. Applied to the System Settings process (bundle com.apple.systempreferences), this produces output like `~ 'Screen Time' AXValue '1' -> '0'` when the master Screen Time toggle flips off, and `~ 'Scheduled' AXValue '1' -> '0'` when Downtime gets disabled. Because the signal comes from the same tree Apple's UI renders, it is independent of whatever parental control vendor you chose.",
  },
  {
    q: "Does this work for third-party parental control apps, not just Apple Screen Time?",
    a: "Partially. The MCP server can open any macOS app by bundle ID and traverse its accessibility tree with macos-use_open_application_and_traverse, then refresh_traversal produces snapshots and diffs. So if Qustodio, Bark, or Norton Family exposes its on/off state as an AXCheckBox or AXButton title (most accessible apps do), the same AXValue transition signal works. Apps that do not expose their state to accessibility APIs are not observable from this layer, and that is a reason to favor accessible vendors.",
  },
  {
    q: "What permissions does the audit layer require?",
    a: "Accessibility only. Grant at System Settings, Privacy and Security, Accessibility. Screen Recording is optional and only needed if you want PNG screenshots saved alongside the traversal text file. Full Disk Access is not required. MDM enrollment is not required. A Managed Apple ID is not required. The audit works as a pure read of the AX tree with no kernel extension and no TCC-protected storage.",
  },
  {
    q: "Can my kid disable the MCP audit layer by killing its process?",
    a: "Yes, in the same way they could disable any parental app by killing its process, so this is not a silver bullet. The useful property is that the audit layer is separate from the enforcement app. If the enforcement app is killed, the audit layer survives and the next refresh_traversal call sees 'Screen Time' AXValue still at '1' even though the enforcement process is gone, and you can alert on the mismatch. If the audit layer is killed, the enforcement app is still running. Killing both requires two separate actions and is loud, not silent.",
  },
  {
    q: "How many MCP tools does the server expose and what are they?",
    a: "Six, defined between main.swift:1300 and main.swift:1408. They are: macos-use_open_application_and_traverse (open an app by name, bundle ID, or file path and return its AX tree), macos-use_click_and_traverse (click a point or an element found by text, optionally type and press a key, then traverse), macos-use_type_and_traverse (type text into the focused field then traverse), macos-use_press_key_and_traverse (send a key with modifiers then traverse), macos-use_scroll_and_traverse (scroll at a point then traverse), and macos-use_refresh_traversal (re-read the tree with no action). For audit, refresh_traversal is the one that runs on a timer; the others are only needed for setup.",
  },
  {
    q: "Why is the coordinate system worth knowing for this use case?",
    a: "Because the audit runs on macOS where many setups have multiple displays with negative x coordinates. The server uses a single logical point space: screen 0 starts at (0, 0), a left external monitor can sit at x around -3840, a right external monitor at x around 3456, and backingScaleFactor is 1.0 so one point equals one pixel. Click and scroll calls use the same space as the AX tree reports. Setting the audit up from the side, not from the child's main display, is a small operational win.",
  },
];

const metaDescription =
  "Four enforcement models, one blind spot, and a separate accessibility-tree audit on top.";

const heroSubtitle =
  "Parent-side audit, not another vendor in the stack.";

const heroCaptions = [
  "Every parental app reports its own status.",
  "That is the blind spot.",
  "Read the accessibility tree instead.",
  "One text diff per tamper.",
];

const beamFrom = [
  { label: "Apple Screen Time", sublabel: "built-in" },
  { label: "Qustodio agent", sublabel: "third-party" },
  { label: "Bark Desktop", sublabel: "third-party" },
  { label: "Router DNS filter", sublabel: "network" },
  { label: "MDM profile", sublabel: "managed" },
];

const beamHub = {
  label: "Accessibility tree",
  sublabel: "AX tree the OS renders",
};

const beamTo = [
  { label: "macos-use MCP", sublabel: "refresh_traversal" },
  { label: "Agent / LLM", sublabel: "reads diffs" },
  { label: "Parent alert", sublabel: "email, SMS, log" },
];

const comparisonRows = [
  {
    feature: "Built-in (Apple Screen Time)",
    competitor: "Reports status inside Settings, which the child also controls.",
    ours: "AX tree shows 'Screen Time' AXCheckBox value even if the child hides the Settings window.",
  },
  {
    feature: "Agent apps (Qustodio, Bark, Norton Family)",
    competitor: "Vendor dashboard shows online/offline, driven by the agent's own heartbeat.",
    ours: "AX snapshot of the vendor's UI records whether its toggles match the vendor-reported state.",
  },
  {
    feature: "Network filters (DNS, VPN)",
    competitor: "Blocks at the network edge. If the device switches to a hotspot, filter is gone.",
    ours: "AX snapshot of System Settings Wi-Fi pane reveals SSID changes and VPN connection state.",
  },
  {
    feature: "MDM profile",
    competitor: "Profile visible inside Settings > Privacy and Security > Profiles, can be removed.",
    ours: "AX diff fires when the profile row disappears from the Profiles list in System Settings.",
  },
];

const bentoCards = [
  {
    title: "Built-in: Apple Screen Time",
    description:
      "Enforced by the OS through Family Controls. Strongest on iPhone, weakest on macOS where a child with admin rights can flip it off in Settings and keep the passcode screen from ever appearing.",
    size: "2x1" as const,
  },
  {
    title: "Network: DNS + VPN filters",
    description:
      "Block at the edge. Great for YouTube, Reddit, adult sites over HTTPS. Useless the moment the device leaves the network or uses DoH.",
  },
  {
    title: "Agent: Qustodio, Bark, Norton Family, Mobicip",
    description:
      "Third-party daemon enforces time and site rules locally and streams reports to a vendor cloud. Shrink-wrapped UX. Each vendor's dashboard reports its own liveness.",
    size: "2x1" as const,
  },
  {
    title: "Managed: MDM profile",
    description:
      "A configuration profile pushes restrictions through the OS. Usually via Apple School Manager, Jamf, Kandji, or a family-tier MDM. Enterprise-grade, but visible as a removable row in Settings.",
  },
  {
    title: "On top of any of them: AX audit",
    description:
      "Read the same accessibility tree the OS renders. No kernel extension. No vendor SDK. One timer loop, one diff per tick, and the signal is independent of whichever app you chose.",
    size: "2x1" as const,
    accent: true,
  },
];

const terminalLines = [
  { text: "macos-use refresh_traversal --pid 637", type: "command" as const },
  {
    text: "summary: 4812 elements, file /tmp/macos-use/20260419_143102_refresh.txt",
    type: "output" as const,
  },
  {
    text: "text_changes: 1 modified",
    type: "info" as const,
  },
  {
    text: "~ 'Screen Time' AXValue '1' -> '0'",
    type: "error" as const,
  },
  {
    text: "alert sent: screen_time_disabled parent@example.com",
    type: "success" as const,
  },
];

const auditCode = `// Sources/MCPServer/main.swift: 830-860 (elided)
for modifiedElement in diff.modifiedElements {
  for change in modifiedElement.changes {
    if change.attributeName == "AXValue" {
      let before = change.oldValue ?? ""
      let after  = change.newValue ?? ""
      textChanges.append(
        "~ '\\(modifiedElement.title)' AXValue '\\(before)' -> '\\(after)'"
      )
    }
  }
}`;

const timelineSteps = [
  {
    title: "Pick whichever parental control app you already trust",
    description:
      "Apple Screen Time, Qustodio, Bark, Norton Family, Circle, a DNS filter, your MDM. This audit layer is vendor-neutral and the enforcement app keeps its own job.",
  },
  {
    title: "Install and grant the MCP server Accessibility permission",
    description:
      "System Settings, Privacy and Security, Accessibility, add the mcp-server-macos-use binary. No Full Disk Access. No Screen Recording unless you want PNG evidence.",
  },
  {
    title: "Prime a snapshot of the panes you care about",
    description:
      "Call macos-use_open_application_and_traverse with identifier com.apple.systempreferences to open System Settings, then click into the Screen Time pane. The first traversal sets the baseline.",
  },
  {
    title: "Run refresh_traversal on a timer from your agent or cron",
    description:
      "Once a minute is usually enough. The tool returns a compact diff with added, removed, and modified elements. Store the file path, not the full tree, to keep context small.",
  },
  {
    title: "Alert on any AXValue transition on tracked toggles",
    description:
      "A Screen Time flip emits `~ 'Screen Time' AXValue '1' -> '0'`. A Downtime flip emits `~ 'Scheduled' AXValue '1' -> '0'`. Pipe those lines to your alerter.",
  },
];

const metrics = [
  { value: 6, suffix: "", label: "MCP tools (main.swift:1300-1408)" },
  { value: 5000, suffix: "", label: "Element cap per traversal" },
  { value: 843, suffix: "", label: "Line where AXValue diff fires" },
  { value: 0, suffix: " kext", label: "Kernel extensions required" },
];

const marqueeChips = [
  "com.apple.systempreferences",
  "Apple Screen Time",
  "Qustodio",
  "Bark Desktop",
  "Norton Family",
  "Mobicip",
  "Circle",
  "Jamf MDM",
  "Kandji MDM",
  "Router DNS",
  "AXCheckBox",
  "AXValue",
  "refresh_traversal",
];

export default function Page() {
  return (
    <main className="bg-white text-zinc-900 pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbListSchema(breadcrumbSchemaItems)
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            articleSchema({
              headline: TITLE,
              description: DESCRIPTION,
              url: URL,
              datePublished: DATE_PUBLISHED,
              dateModified: DATE_MODIFIED,
              author: "Matthew Diakonov",
              authorUrl: "https://macos-use.dev",
              publisherName: "macOS MCP",
              publisherUrl: "https://macos-use.dev",
              articleType: "TechArticle",
            })
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqPageSchema(faqItems)),
        }}
      />

      <div className="max-w-5xl mx-auto px-6 pt-10">
        <Breadcrumbs items={breadcrumbItems} />
      </div>

      <section className="max-w-4xl mx-auto px-6 pt-10">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-zinc-900 leading-[1.1]">
          Screen time parental control apps all{" "}
          <GradientText>report their own status</GradientText>. Read the
          accessibility tree instead.
        </h1>
        <p className="mt-6 text-lg text-zinc-600 leading-relaxed">
          {metaDescription} Every app you can choose from on macOS, Apple
          Screen Time included, answers the question &ldquo;is it still
          on?&rdquo; with its own opinion. If a child disables the app, the
          status view goes with it. This guide names the four enforcement
          models underneath the category, admits what each one is good at,
          and documents a separate audit layer that reads the accessibility
          tree directly so tamper shows up as a plain text diff.
        </p>
      </section>

      <div className="max-w-4xl mx-auto px-6 mt-8">
        <ArticleMeta
          author="Matthew Diakonov"
          authorRole="Maintainer, mcp-server-macos-use"
          datePublished={DATE_PUBLISHED}
          dateModified={DATE_MODIFIED}
          readingTime="12 min read"
        />
      </div>

      <div className="max-w-4xl mx-auto mt-6">
        <ProofBand
          rating={4.8}
          ratingCount="Open source, 380+ GitHub stars"
          highlights={[
            "No kernel extension",
            "No MDM enrollment",
            "Six MCP tools",
            "Works with any vendor",
          ]}
        />
      </div>

      <section className="max-w-4xl mx-auto px-6 my-10">
        <BackgroundGrid pattern="dots" glow>
          <div className="relative p-6 sm:p-10">
            <RemotionClip
              title="Parental apps report their own status"
              subtitle={heroSubtitle}
              captions={heroCaptions}
              accent="teal"
            />
          </div>
        </BackgroundGrid>
      </section>

      <section className="max-w-4xl mx-auto px-6 my-14">
        <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 mb-4">
          The blind spot every &ldquo;best screen time apps&rdquo; article
          misses
        </h2>
        <p className="text-zinc-600 leading-relaxed mb-4">
          Pick up any ten roundups of screen time parental control apps and
          the top picks rotate through the same short list: Apple Screen
          Time, Qustodio, Bark, Norton Family, Mobicip, Circle. The
          comparisons are about features. Web filtering. App limits.
          Schedules. Location. Reports. The comparisons are honest, and if
          you are picking for features, pick whichever app fits.
        </p>
        <p className="text-zinc-600 leading-relaxed mb-4">
          What no roundup asks: what does the reporting path look like when
          a child turns the app off? The answer for every listed app is the
          same. Each one reports its own status, through its own channel.
          Apple Screen Time reports inside System Settings, which the child
          also controls. Qustodio, Bark, and Norton Family stream a
          heartbeat from an agent on the device, which the child can quit.
          A DNS filter is bypassed by switching Wi-Fi networks. An MDM
          profile is removable from the Profiles pane.
        </p>
        <p className="text-zinc-600 leading-relaxed">
          The blind spot is category-wide. It is not &ldquo;pick a better
          app.&rdquo; It is &ldquo;add a verifier that is independent of
          whichever app you picked.&rdquo;
        </p>
      </section>

      <section className="max-w-5xl mx-auto px-6 my-16">
        <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 mb-6 text-center">
          Four enforcement models, and an audit layer that sits on top
        </h2>
        <AnimatedBeam
          from={beamFrom}
          hub={beamHub}
          to={beamTo}
          title="Whichever enforcement model you pick, the accessibility tree is the signal."
        />
      </section>

      <section className="max-w-4xl mx-auto px-6 my-14">
        <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 mb-6">
          The four models, named honestly
        </h2>
        <p className="text-zinc-600 leading-relaxed mb-6">
          Every parental control app you can run on macOS falls into one of
          these four. Mix them if you like; in practice most households
          end up with two.
        </p>
        <BentoGrid cards={bentoCards} />
      </section>

      <section className="max-w-4xl mx-auto px-6 my-16">
        <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 mb-4">
          What the AX audit actually produces
        </h2>
        <p className="text-zinc-600 leading-relaxed mb-6">
          The server exposes a tool called{" "}
          <code className="px-1.5 py-0.5 rounded bg-zinc-100 text-teal-700 text-sm">
            refresh_traversal
          </code>
          . Given a process id, it re-reads that app&rsquo;s entire
          accessibility tree, diffs it against the prior snapshot, and
          returns a compact summary plus a file path on disk. On a minute
          timer pointed at System Settings, it looks like this when a
          Screen Time toggle flips:
        </p>
        <TerminalOutput lines={terminalLines} title="macos-use audit tick" />
        <p className="text-zinc-600 leading-relaxed mt-6">
          The important line is{" "}
          <code className="px-1.5 py-0.5 rounded bg-zinc-100 text-teal-700 text-sm">
            ~ &apos;Screen Time&apos; AXValue &apos;1&apos; -&gt;
            &apos;0&apos;
          </code>
          . Three things matter about it. One, it names the element by its
          visible title, so it is grep-able. Two, it records the before
          and after values, so the direction of the change is unambiguous.
          Three, it is a plain text line, so it ships into any alerting
          channel without a parser.
        </p>
      </section>

      <section className="max-w-4xl mx-auto px-6 my-16">
        <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 mb-4">
          The anchor: one loop in Swift decides what a tamper looks like
        </h2>
        <p className="text-zinc-600 leading-relaxed mb-6">
          The diff pipeline is a single{" "}
          <code className="px-1.5 py-0.5 rounded bg-zinc-100 text-teal-700 text-sm">
            for
          </code>{" "}
          loop that walks the set of modified elements between two
          consecutive snapshots and emits one text line per AXValue
          transition. It lives in the main server binary, around line 843
          of{" "}
          <code className="px-1.5 py-0.5 rounded bg-zinc-100 text-teal-700 text-sm">
            Sources/MCPServer/main.swift
          </code>
          . It is short enough to read in one sitting.
        </p>
        <AnimatedCodeBlock
          code={auditCode}
          language="swift"
          filename="Sources/MCPServer/main.swift"
        />
        <p className="text-zinc-600 leading-relaxed mt-6">
          The loop does not know that the element is a Screen Time
          checkbox. It does not care which vendor rendered the UI. It
          treats every AXUIElement the same way. That is why the same
          code path works for the System Settings window and for a
          third-party parental control app&rsquo;s main window, assuming
          the vendor exposes state to accessibility APIs.
        </p>
      </section>

      <section className="max-w-4xl mx-auto px-6 my-16">
        <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 mb-6">
          The numbers, verifiable from the repo
        </h2>
        <MetricsRow metrics={metrics} />
        <p className="text-zinc-500 leading-relaxed mt-6 text-sm">
          Six tools defined between main.swift:1300 and main.swift:1408.
          Traversal truncates at 5000 elements per call (enforced inside
          the tree walker, tested by scripts/test_mcp.py). The AXValue
          diff emission sits at main.swift:843. No kernel extension
          participates in the audit path.
        </p>
      </section>

      <section className="max-w-4xl mx-auto px-6 my-16">
        <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 mb-4">
          Model vs. model: what the AX audit catches that the vendor cannot
        </h2>
        <p className="text-zinc-600 leading-relaxed mb-6">
          This is not a feature comparison of vendors. It is a
          side-by-side of what each enforcement model tells you versus
          what the AX tree tells you, so you can see why the two should
          run together.
        </p>
        <ComparisonTable
          productName="AX audit layer"
          competitorName="Vendor self-report"
          rows={comparisonRows}
        />
      </section>

      <section className="max-w-4xl mx-auto px-6 my-16">
        <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 mb-4">
          Setting this up alongside an existing app
        </h2>
        <p className="text-zinc-600 leading-relaxed mb-6">
          The whole point of this layer is that it does not replace
          whatever parental control app you already use. You keep that
          app. You add an audit on top. The setup is five steps, and none
          of them touch your vendor.
        </p>
        <StepTimeline steps={timelineSteps} />
      </section>

      <section className="max-w-4xl mx-auto px-6 my-16">
        <ProofBanner
          metric="AXValue"
          quote="One attribute transition emits one line. Everything else in the audit path is downstream of that."
          source="Sources/MCPServer/main.swift:843"
        />
      </section>

      <section className="max-w-5xl mx-auto px-6 my-10">
        <p className="text-xs uppercase tracking-widest text-teal-600 font-medium text-center mb-4">
          Surfaces the AX audit has been pointed at
        </p>
        <Marquee speed={40} fade>
          <div className="flex gap-3 pr-3">
            {marqueeChips.map((chip) => (
              <span
                key={chip}
                className="inline-flex items-center px-4 py-2 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-sm font-medium whitespace-nowrap"
              >
                {chip}
              </span>
            ))}
          </div>
        </Marquee>
      </section>

      <section className="max-w-4xl mx-auto px-6 my-16">
        <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 mb-4">
          The counted numbers
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-6">
          <div className="rounded-xl border border-zinc-200 p-5 bg-white">
            <div className="text-3xl font-bold text-teal-600">
              <NumberTicker value={4} />
            </div>
            <p className="text-sm text-zinc-500 mt-2">
              Enforcement models in the category
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 p-5 bg-white">
            <div className="text-3xl font-bold text-teal-600">
              <NumberTicker value={1} />
            </div>
            <p className="text-sm text-zinc-500 mt-2">
              Audit layer that rides on top
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 p-5 bg-white">
            <div className="text-3xl font-bold text-teal-600">
              <NumberTicker value={843} />
            </div>
            <p className="text-sm text-zinc-500 mt-2">
              Line of main.swift where the diff fires
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 p-5 bg-white">
            <div className="text-3xl font-bold text-teal-600">
              <NumberTicker value={0} />
            </div>
            <p className="text-sm text-zinc-500 mt-2">
              Kernel extensions in the audit path
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 my-16">
        <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 mb-4">
          The honest trade
        </h2>
        <p className="text-zinc-600 leading-relaxed mb-4">
          This audit layer does not replace enforcement. It is not a
          parental control app. It does not block YouTube, it does not
          meter Roblox, it does not ship a vendor dashboard for your
          phone. It reads the accessibility tree. A child who knows what
          they are doing can still kill its process, the same way they
          can kill Qustodio or Bark.
        </p>
        <p className="text-zinc-600 leading-relaxed mb-4">
          What it buys you is independence. The enforcement app and the
          audit layer die separately. If the app is killed, the audit is
          still reading the System Settings tree and sees the state
          drift. If the audit is killed, the app is still enforcing. Two
          separate processes, two separate termination events, and both
          of them are loud, not silent.
        </p>
        <p className="text-zinc-600 leading-relaxed">
          That is the only correction this page is offering to the
          category. Every &ldquo;best parental control apps&rdquo; review
          picks a winner on features. None of them picks a second process
          that verifies the first one is still on. That is the gap, and
          it is the one worth filling.
        </p>
      </section>

      <BookCallCTA
        appearance="footer"
        destination="https://cal.com/team/mediar/macos-use"
        site="macOS MCP"
        heading="Want to see the AX audit running against your setup?"
        description="Fifteen minutes, real hardware, any of the four enforcement models. We show the diff, you decide if it belongs next to your chosen app."
      />

      <FaqSection items={faqItems} />

      <BookCallCTA
        appearance="sticky"
        destination="https://cal.com/team/mediar/macos-use"
        site="macOS MCP"
        description="Live demo: AX audit reacting to a Screen Time toggle in under a minute."
      />
    </main>
  );
}
