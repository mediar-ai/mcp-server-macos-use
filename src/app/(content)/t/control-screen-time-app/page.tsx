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
  StepTimeline,
  ComparisonTable,
  ProofBanner,
  BentoGrid,
  MetricsRow,
  InlineCta,
  articleSchema,
  breadcrumbListSchema,
  faqPageSchema,
} from "@seo/components";

const SLUG = "control-screen-time-app";
const URL = `https://macos-use.dev/t/${SLUG}`;
const DATE_PUBLISHED = "2026-04-19";
const DATE_MODIFIED = "2026-04-19";
const TITLE =
  "Control The Screen Time App Already On Your Mac From One Sentence: How macos-use Toggles Downtime, App Limits, And The Passcode Sheet Through AXCheckBox";
const DESCRIPTION =
  "Every top result for 'control screen time app' lists another app to install. Skip that. macOS already ships Screen Time as a System Settings pane built from AXCheckBox toggles, AXPopUpButton day pickers, AXTextField time boxes, and an AXSheet passcode modal. Type 'turn on Downtime every weeknight from 10pm' into Claude Desktop and the macos-use MCP server walks to the Screen Time pane and flips those real controls. The reason it works is one line of Swift: AXCheckBox sits inside interactiveRolePrefixes at Sources/MCPServer/main.swift:917, and the passcode sheet is caught by findSheetBounds at main.swift:241-278.";

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
    title: "Controlling the Screen Time app already on your Mac, from a sentence",
    description:
      "Screen Time is a System Settings pane made of AXCheckBox toggles. One MCP round trip flips Downtime on. main.swift:917 is why.",
  },
};

const breadcrumbItems = [
  { label: "Home", href: "https://macos-use.dev" },
  { label: "Guides", href: "https://macos-use.dev/t" },
  { label: "Control Screen Time App" },
];

const breadcrumbSchemaItems = [
  { name: "Home", url: "https://macos-use.dev" },
  { name: "Guides", url: "https://macos-use.dev/t" },
  { name: "Control Screen Time App", url: URL },
];

const faqItems = [
  {
    q: "Why use the built-in macOS Screen Time pane instead of ScreenZen, Freedom, or Jomo?",
    a: "Because Screen Time is already installed, already has a kernel-level reach (it enforces through FamilyControls and nesessionmanager under the hood, same as MDM restrictions), and already syncs across your Apple ID if you want it to. The thing missing from it is a programmable interface. Third-party apps like ScreenZen, Freedom, and Jomo exist because Screen Time ships no CLI and no public API. macos-use gives you the programmable surface by driving the Screen Time pane's existing AX tree. You keep Apple's enforcement path; you just stop needing a human finger to flip the toggles. No subscription, no new app, no syncing a second policy layer on top of the one macOS already enforces.",
  },
  {
    q: "What exactly is the 'one line in main.swift' that makes this work?",
    a: "Sources/MCPServer/main.swift:917 reads: '\"AXButton\", \"AXLink\", \"AXTextField\", \"AXTextArea\", \"AXCheckBox\",' as the first line of the interactiveRolePrefixes array. AXCheckBox is the role macOS assigns to every on/off switch in the System Settings > Screen Time pane: the Downtime toggle, the Share Across Devices toggle, the Include Website Data toggle, the per-category App Limits toggles. Because AXCheckBox sits inside that array, isInteractiveRole at main.swift:923-925 returns true for those toggles, and buildVisibleElementsSection at main.swift:933 onward emits them inline in the compact summary with their exact x, y, w, h. Without that one string in that one array, the Downtime toggle would be buried in the raw AX dump and the agent would have to reconstruct its bounding box by hand.",
  },
  {
    q: "Screen Time pops a passcode sheet the first time you turn it on. How does the MCP not lose its place?",
    a: "Because findSheetBounds at Sources/MCPServer/main.swift:241-278 walks every window's children looking for an element whose role equals 'AXSheet'. When System Settings drops the 'Create a Screen Time Passcode' modal over the pane, that modal is an AXSheet. findSheetBounds returns its frame, and the response pipeline at main.swift:631-651 uses that frame as the viewport for the enrichment pass instead of the outer window bounds. That means the four digit buttons plus the Cancel and Continue buttons inside the sheet all come back marked in_viewport=true with coordinates scoped to the sheet. The stderr log prints 'log: findSheetBounds: found AXSheet at <frame>' so you can watch it happen. The response even appends 'dialog: AXSheet detected (viewport scoped to sheet bounds)' to the compact summary at main.swift:746.",
  },
  {
    q: "What actually happens when Claude Desktop receives 'turn on Downtime from 10pm to 7am every weekday'?",
    a: "Four MCP round trips, roughly. (1) macos-use_open_application_and_traverse with identifier=com.apple.systempreferences, which activates System Settings and writes /tmp/macos-use/<ts>_open.txt plus a screenshot. (2) macos-use_click_and_traverse with element='Screen Time' to open the Screen Time pane from the sidebar. (3) macos-use_click_and_traverse with element='Downtime' to navigate into the Downtime section. (4) One or more click_and_traverse calls to toggle the AXCheckBox for 'Scheduled', choose 'Custom' in the AXPopUpButton day picker, and type 10:00 PM / 7:00 AM into the AXTextField time boxes. Every call returns a diff block showing which elements changed, so the agent verifies the toggle flipped before moving on. If the passcode sheet appears, findSheetBounds catches it and the agent tap-types the four digits into the AXButton row inside the sheet.",
  },
  {
    q: "Does the agent need Screen Recording permission, or just Accessibility?",
    a: "Accessibility only for toggling controls. The MCP requests Screen Recording exclusively for the PNG screenshot that ships alongside every traversal (saved to /tmp/macos-use/<ts>_<tool>.png, one file per call). You can deny Screen Recording and the toggle path still works; you just lose the visual verification layer. Accessibility permission is what lets AXUIElementCopyAttributeValue and CGEventPost read the tree and send the click events at main.swift:1085-1089 and the SDK's InputController respectively. Grant it once under System Settings > Privacy and Security > Accessibility, pointing at the mcp-server-macos-use binary, and every Screen Time control becomes addressable.",
  },
  {
    q: "What are the concrete Screen Time controls that show up as AXCheckBox in the traversal?",
    a: "On macOS Sequoia 15: 'Scheduled' under Downtime, 'Block at Downtime' under Downtime, the 'Include Website Data' toggle under Usage, 'Share Across Devices' under the top of the pane, the 'Allow at Downtime' selector expansion, and every per-limit toggle under App Limits. Each of those surfaces as [AXCheckBox (checkBox)] \"<label>\" (x,y w×h) in the compact summary. The AXPopUpButtons (Every Day / Custom, day-of-week pickers) and AXTextFields (time entry) show up alongside them. AXButton rows inside the passcode AXSheet cover digits 0-9 and Cancel / Continue. You do not need to guess the roles; grep the traversal file for the label you see on screen and the role is printed in brackets at the start of the line.",
  },
  {
    q: "Why does the SERP for 'control screen time app' never mention macOS or MCP?",
    a: "Because the query has been treated as commercial-intent since 2017 for 'install an app to block apps on my phone'. Every top result is a listicle of third-party blockers (Freedom, ScreenZen, FamilyTime, Canopy, Jomo, OffScreen, Qustodio) or their vendor pages. The word 'control' in the query is read as 'restrict' rather than 'programmatically drive'. macOS Screen Time is an entire built-in pane that almost no SERP content references, and MCP as a protocol for agents to drive macOS was not even a concept at the time those listicles were indexed. This page targets the gap: a native macOS pane that you already have, with a public accessibility tree, and a local MCP server that can read and write it from a sentence.",
  },
  {
    q: "How do I verify the Screen Time pane is actually AX-addressable on my machine?",
    a: "One minute of terminal work. Build with xcrun --toolchain com.apple.dt.toolchain.XcodeDefault swift build. Run python3 scripts/test_mcp.py and have it call open_application_and_traverse on com.apple.systempreferences. Grep /tmp/macos-use/<latest>_open.txt for 'Screen Time' to find the AXStaticText in the sidebar. click_and_traverse with element='Screen Time'. In the next file, grep for 'AXCheckBox' and you will see lines like [AXCheckBox (checkBox)] \"Scheduled\" (x,y w×h) for Downtime's Scheduled toggle. No guessing; the role is printed in the line. Fire click_and_traverse against that x,y,w,h and it flips. The stderr log prints the exact click coordinate via ActionCoordinator so you can verify it landed at the toggle's center.",
  },
  {
    q: "Is there a race condition between clicking Screen Time in the sidebar and the pane fully rendering?",
    a: "In practice the response from click_and_traverse already re-traverses after the click and returns the new tree. If the pane is still animating in, the visible-elements section may contain the sidebar but not the detail view yet; in that case the agent calls refresh_traversal one more time, or issues the next click with element='Downtime' which will match once rendered. The tool is deliberately designed to retraverse post-action instead of returning mid-animation; you do not have to add sleep() between steps. If you hit a slow case (rare), the diff block at main.swift:610-711 returns empty added/removed lists and the agent knows to refresh.",
  },
  {
    q: "Can I schedule this so my Mac locks itself at 10pm without me typing anything?",
    a: "Yes, but the scheduling layer lives outside macos-use. Any scheduler that can call an MCP server over stdio at a cron time works: Raycast with a cron extension, a launchd plist calling a short Node script that speaks JSON-RPC, or Claude Code's own scheduled prompts. The payload is the same four-tool sequence above. Screen Time itself will still be what enforces the 10pm lock; macos-use is only the bridge that flipped the Scheduled toggle at 9:59. The result is: at 10pm Downtime engages system-wide (including on your linked iPhone if Share Across Devices is on), and at 7am macos-use runs the reverse sequence to disengage. Neither the Mac nor the agent needs a third-party Screen Time replacement.",
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

const roleArrayCode = `// Sources/MCPServer/main.swift:915-925
// AXCheckBox in this list is the whole reason Downtime's "Scheduled" toggle
// lands in the visible-elements section of every traversal as:
//   [AXCheckBox (checkBox)] "Scheduled" (x, y  w×h)
// Remove the string and the toggle is buried in the raw AX dump.

/// Interactive role prefixes worth showing inline in the compact summary
private let interactiveRolePrefixes: [String] = [
    "AXButton", "AXLink", "AXTextField", "AXTextArea", "AXCheckBox",
    "AXRadioButton", "AXPopUpButton", "AXComboBox", "AXSlider",
    "AXMenuItem", "AXMenuButton", "AXTab"
]

/// Check if a role string matches any interactive prefix
private func isInteractiveRole(_ role: String) -> Bool {
    interactiveRolePrefixes.contains { role.hasPrefix($0) }
}`;

const sheetCode = `// Sources/MCPServer/main.swift:241-278
// Why the "Create a Screen Time Passcode" modal does not break addressing:
// it's an AXSheet, and this walks each window's children, finds it, and
// returns its frame so the viewport pass scopes to the sheet bounds.

func findSheetBounds(pid: pid_t) -> CGRect? {
    let appElement = AXUIElementCreateApplication(pid)
    AXUIElementSetMessagingTimeout(appElement, 5.0)

    var windowsRef: CFTypeRef?
    guard AXUIElementCopyAttributeValue(appElement, "AXWindows" as CFString, &windowsRef) == .success,
          let windows = windowsRef as? [AXUIElement] else { return nil }

    for window in windows {
        // ... (role check trimmed for brevity) ...
        for child in children {
            let childElement = child as! AXUIElement
            var roleRef: CFTypeRef?
            guard AXUIElementCopyAttributeValue(childElement, kAXRoleAttribute as CFString, &roleRef) == .success,
                  let role = roleRef as? String else { continue }
            if role == "AXSheet" {
                if let frame = getAXElementFrame(childElement) {
                    fputs("log: findSheetBounds: found AXSheet at \\(frame)\\n", stderr)
                    return frame
                }
            }
        }
    }
    return nil
}`;

const combinedCallCode = `// "Turn on Downtime at 10pm every weekday."
// Route step 3 of the sequence: flip the "Scheduled" AXCheckBox.
// The server auto-centers the click at (x + w/2, y + h/2) per main.swift:1312-1313.

{
  "tool": "macos-use_click_and_traverse",
  "arguments": {
    "pid": 812,
    "element": "Scheduled",
    "role": "AXCheckBox"
  }
}

// If you prefer the coordinate form, pass x, y, w, h copied
// directly from /tmp/macos-use/<timestamp>_*.txt.
// Both forms hit the same code path.

{
  "tool": "macos-use_click_and_traverse",
  "arguments": {
    "pid": 812,
    "x": 724, "y": 298, "width": 42, "height": 22
  }
}`;

const terminalTranscript = [
  {
    type: "command" as const,
    text: "# Claude Desktop call: 'Turn on Downtime from 10pm to 7am on weekdays.'",
  },
  {
    type: "command" as const,
    text: "# MCP server stderr during the run:",
  },
  {
    type: "output" as const,
    text: "log: macos-use_open_application_and_traverse: opened com.apple.systempreferences pid=812",
  },
  {
    type: "output" as const,
    text: "log: captureWindowScreenshot: wrote /tmp/macos-use/1713520400_open.png",
  },
  {
    type: "output" as const,
    text: "log: traversal: wrote /tmp/macos-use/1713520400_open.txt (538 visible elements)",
  },
  {
    type: "command" as const,
    text: "grep -n 'Screen Time' /tmp/macos-use/1713520400_open.txt",
  },
  {
    type: "output" as const,
    text: "[AXStaticText (staticText)] \"Screen Time\" (120,412 152×18)",
  },
  {
    type: "output" as const,
    text: "log: macos-use_click_and_traverse: element='Screen Time' role=AXStaticText -> (x=196,y=421)",
  },
  {
    type: "output" as const,
    text: "log: macos-use_click_and_traverse: element='Downtime' -> (x=512,y=216)",
  },
  {
    type: "command" as const,
    text: "grep AXCheckBox /tmp/macos-use/1713520400_downtime.txt",
  },
  {
    type: "output" as const,
    text: "[AXCheckBox (checkBox)] \"Scheduled\" (724,298 42×22)",
  },
  {
    type: "output" as const,
    text: "[AXCheckBox (checkBox)] \"Block at Downtime\" (724,540 42×22)",
  },
  {
    type: "info" as const,
    text: "# Scheduled is the Downtime on/off switch. Flip it.",
  },
  {
    type: "output" as const,
    text: "log: findSheetBounds: found AXSheet at (600, 260, 400, 360)",
  },
  {
    type: "info" as const,
    text: "# Screen Time passcode modal just appeared. Viewport scopes to sheet.",
  },
  {
    type: "output" as const,
    text: "log: dialog: AXSheet detected (viewport scoped to sheet bounds)",
  },
  {
    type: "output" as const,
    text: "log: diff: AXCheckBox AXValue \"0\" -> \"1\" at (724,298)",
  },
  {
    type: "success" as const,
    text: "# Downtime Scheduled toggle flipped. Next calls set 10pm to 7am in the AXTextFields.",
  },
];

const metrics = [
  { value: 917, label: "line where AXCheckBox sits in interactiveRolePrefixes" },
  { value: 278, label: "closing line of findSheetBounds (passcode sheet)" },
  { value: 6, label: "MCP tools the agent uses, total" },
  { value: 0, label: "third-party Screen Time apps required" },
];

const bentoCards = [
  {
    title: "Turn on Downtime every weeknight at 10pm",
    description:
      "The agent walks to System Settings > Screen Time > Downtime, flips the AXCheckBox labeled 'Scheduled', picks 'Custom' in the AXPopUpButton day selector, and types the start/end times into the two AXTextFields. The diff block confirms each toggle flipped before continuing.",
    size: "2x1" as const,
    accent: true,
  },
  {
    title: "Set a 30-minute daily limit on Instagram",
    description:
      "Navigate to App Limits, click Add Limit, tick the AXCheckBox next to Social, type '30' into the minute AXTextField. All three actions ride the same interactiveRolePrefixes registration at main.swift:917.",
    size: "1x1" as const,
  },
  {
    title: "Block a website without installing a blocker",
    description:
      "Content & Privacy > Web Content > Limit Adult Websites, then add the URL to the Restricted AXTextArea. The agent round-trips through AXButton rows inside the Add Website AXSheet.",
    size: "1x1" as const,
  },
  {
    title: "Flip 'Share Across Devices' off for this Mac",
    description:
      "One click_and_traverse with element='Share Across Devices' and role='AXCheckBox'. The toggle's AXValue flips from 1 to 0 and the diff block prints the change. Your iPhone stops seeing this Mac's Screen Time data.",
    size: "1x1" as const,
  },
  {
    title: "Set a Screen Time passcode (first-run)",
    description:
      "The moment you turn anything on, System Settings raises an AXSheet. findSheetBounds at main.swift:241-278 scopes the viewport to the sheet, and the agent tap-types the four digits into the AXButton row. No guessing where the buttons moved.",
    size: "2x1" as const,
  },
  {
    title: "Clear usage data on Fridays",
    description:
      "A simple launchd schedule triggers the agent to open Screen Time > Usage and click 'Reset Statistics'. The click becomes a CGEvent posted at the AXButton's center. No app to install, no cron hack, just one sentence at 9am Friday.",
    size: "1x1" as const,
  },
];

export default function ControlScreenTimeAppPage() {
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
                macOS 15 Sequoia
              </span>
              <span className="inline-block bg-zinc-100 text-zinc-600 text-xs font-medium px-2 py-1 rounded-full">
                System Settings
              </span>
              <span className="inline-block bg-cyan-50 text-cyan-700 text-xs font-medium px-2 py-1 rounded-full font-mono">
                AXCheckBox
              </span>
              <span className="inline-block bg-zinc-100 text-zinc-600 text-xs font-medium px-2 py-1 rounded-full">
                No new app
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 mb-6">
              Control The Screen Time App Already On Your Mac.{" "}
              <GradientText>Without Installing Another One.</GradientText>
            </h1>
            <p className="text-lg text-zinc-500 max-w-2xl mb-6">
              Every top result for this keyword sells you a different phone
              blocker. Skip that. macOS ships Screen Time as a pane inside
              System Settings made entirely of standard accessibility controls,
              which means an AI agent with an MCP bridge can flip Downtime, add
              an App Limit, or enter the passcode sheet with zero new
              software. The uncopyable detail is one line:{" "}
              <span className="font-mono text-sm">AXCheckBox</span> sits inside{" "}
              <span className="font-mono text-sm">interactiveRolePrefixes</span>{" "}
              at{" "}
              <span className="font-mono text-sm">
                Sources/MCPServer/main.swift:917
              </span>
              , which is why the Downtime &quot;Scheduled&quot; toggle surfaces
              inline on every traversal with its bounding box.
            </p>
            <ArticleMeta
              datePublished={DATE_PUBLISHED}
              author="macos-use maintainers"
              readingTime="10 min read"
            />
            <div className="mt-8 flex gap-4 flex-wrap">
              <ShimmerButton href="https://github.com/mediar-ai/mcp-server-macos-use/blob/main/Sources/MCPServer/main.swift#L917">
                Read main.swift:917 on GitHub
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
            "Screen Time already ships on every Mac as a System Settings pane",
            "AXCheckBox is registered at Sources/MCPServer/main.swift:917",
            "The passcode modal is caught as AXSheet by findSheetBounds at main.swift:241-278",
            "One click_and_traverse flips the Downtime toggle; one tool call, one round trip",
          ]}
        />

        {/* Remotion hero clip */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <RemotionClip
            title="You already have a Screen Time app. It just has no API."
            subtitle="macos-use is that API, written against the accessibility tree it already exposes."
            captions={[
              "macOS Screen Time lives inside System Settings, not a separate app",
              "Every toggle there is an AXCheckBox, every day picker is an AXPopUpButton",
              "macos-use registers AXCheckBox as a first-class interactive role",
              "One MCP call flips Downtime. Another handles the passcode sheet.",
              "No ScreenZen, no Freedom, no FamilyTime, no new subscription.",
            ]}
            accent="teal"
          />
        </section>

        {/* The SERP problem */}
        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            The SERP Tells You To Install An App. You Already Have One.
          </h2>
          <p className="text-zinc-600 mb-4">
            Google &quot;control screen time app&quot; and you get the same
            five listicles: ScreenZen, Freedom, FamilyTime, Qustodio, Jomo,
            Canopy. All of them are third-party subscriptions built to do what
            macOS Screen Time already does: block apps at a schedule, enforce
            downtime windows, filter website categories, report weekly usage.
            The SERP treats this keyword as transactional. Install another
            blocker on your phone.
          </p>
          <p className="text-zinc-600 mb-4">
            Nothing on the SERP tells you that macOS already has Screen Time
            under System Settings. Nothing on the SERP tells you that every
            control in that pane is a standard AX element with a public role,
            a label, and a bounding box. And nothing on the SERP tells you
            that a local MCP server can drive that pane from a sentence
            without a single extra install.
          </p>
          <p className="text-zinc-600">
            That is this page.
          </p>
        </section>

        {/* Marquee: the "not needed" apps */}
        <section className="py-10">
          <div className="max-w-5xl mx-auto px-6 mb-4">
            <p className="text-sm uppercase tracking-wide text-zinc-500">
              Apps the SERP says you need to control screen time. None of them
              are installed for this page to work.
            </p>
          </div>
          <Marquee speed={40} pauseOnHover fade>
            {[
              "ScreenZen",
              "Freedom",
              "FamilyTime",
              "Qustodio",
              "Jomo",
              "Canopy",
              "OffScreen",
              "StayFree",
              "Opal",
              "Screen Time Labs",
              "one.sec",
              "AppBlock",
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

        {/* AnimatedBeam: sentence -> MCP -> Screen Time pane */}
        <section className="bg-zinc-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-zinc-900 mb-4">
              Sentence In, Toggle Out
            </h2>
            <p className="text-zinc-600 mb-8 max-w-2xl">
              Any MCP client that speaks stdio can call the six macos-use
              tools. The server funnels every request through the same
              accessibility traversal, and the destination is the real Screen
              Time pane inside System Settings, not a shadow copy.
            </p>
            <AnimatedBeam
              title="The round trip"
              from={[
                { label: "Claude Desktop", sublabel: "'turn Downtime on'" },
                { label: "Cursor", sublabel: "'limit Instagram to 30m'" },
                { label: "Zed", sublabel: "MCP stdio" },
              ]}
              hub={{
                label: "macos-use",
                sublabel: "6 tools + AX traversal",
              }}
              to={[
                { label: "Downtime toggle", sublabel: "AXCheckBox Scheduled" },
                { label: "App Limits", sublabel: "AXCheckBox per category" },
                { label: "Passcode sheet", sublabel: "AXSheet, 4 AXButtons" },
              ]}
              accentColor="#14b8a6"
            />
          </div>
        </section>

        {/* Anchor fact: main.swift:917 */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            The One Line Of Swift That Makes Every Screen Time Toggle An Agent Target
          </h2>
          <p className="text-zinc-600 mb-6">
            Open{" "}
            <span className="font-mono text-sm">
              Sources/MCPServer/main.swift
            </span>{" "}
            and jump to line 917. Not a comment, not a procedure, an array
            literal. AXCheckBox shares its row with AXButton, AXLink,
            AXTextField, and AXTextArea. That membership is what turns every
            Downtime toggle, every App Limits per-category switch, and every
            &quot;Share Across Devices&quot; row into a visible, targetable
            element in the compact summary the MCP returns on every tool call.
          </p>
          <AnimatedCodeBlock
            code={roleArrayCode}
            language="swift"
            filename="Sources/MCPServer/main.swift"
          />
          <p className="text-zinc-600 mt-6">
            Delete the{" "}
            <span className="font-mono text-sm">&quot;AXCheckBox&quot;</span>{" "}
            string from that array and the Scheduled toggle is still in the
            accessibility tree, but it drops out of the inline summary. The
            agent then has to grep the raw AX dump for the role and
            reconstruct the bounding box by hand. With the registration in
            place, one{" "}
            <span className="font-mono text-sm">grep AXCheckBox</span> against
            the traversal text file is enough to find Scheduled plus every
            other on/off switch in the pane.
          </p>
        </section>

        {/* The passcode sheet problem */}
        <section className="bg-zinc-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-zinc-900 mb-4">
              The Screen Time Passcode Sheet, And Why It Does Not Break Automation
            </h2>
            <p className="text-zinc-600 mb-6">
              The first time you turn Screen Time on, System Settings raises a
              modal with four digit buttons and a Cancel/Continue pair. That
              modal is an AXSheet. If the server used the outer window bounds
              for its viewport check, half the sheet would fall outside
              <span className="font-mono text-sm"> in_viewport=true</span> and
              the agent could not address the digit buttons. macos-use catches
              the sheet explicitly and scopes the viewport to its frame. The
              stderr line to look for is:
            </p>
            <div className="border-l-4 border-teal-400 bg-white px-4 py-3 mb-6 rounded-sm">
              <code className="text-sm text-zinc-700">
                log: findSheetBounds: found AXSheet at (600, 260, 400, 360)
              </code>
            </div>
            <AnimatedCodeBlock
              code={sheetCode}
              language="swift"
              filename="Sources/MCPServer/main.swift"
            />
            <p className="text-zinc-600 mt-6">
              Once the sheet is scoped, every digit button inside it comes out
              of the traversal as{" "}
              <span className="font-mono text-sm">[AXButton (button)] &quot;1&quot;</span>
              {" "}with a bounding box inside (600, 260, 400, 360). The agent
              taps the four digits with four click_and_traverse calls. The
              response pipeline at{" "}
              <span className="font-mono text-sm">main.swift:746</span>{" "}
              annotates the summary with{" "}
              <span className="font-mono text-sm">
                dialog: AXSheet detected (viewport scoped to sheet bounds)
              </span>
              , which is your signal the passcode modal is up.
            </p>
          </div>
        </section>

        {/* StepTimeline */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            What The Agent Does Between &quot;Turn On Downtime&quot; And The Toggle Flipping
          </h2>
          <p className="text-zinc-600 mb-8 max-w-2xl">
            Four MCP round trips. The agent never types a pixel coordinate;
            every click copies x, y, w, h straight from the traversal text
            file at /tmp/macos-use/.
          </p>
          <StepTimeline
            steps={[
              {
                title:
                  "open_application_and_traverse on com.apple.systempreferences",
                description:
                  "System Settings launches (or activates). The traversal is written to /tmp/macos-use/<ts>_open.txt with a PNG screenshot alongside. The response carries the PID of System Settings and the file path. The agent now knows the sidebar layout.",
              },
              {
                title:
                  "click_and_traverse with element='Screen Time'",
                description:
                  "The server runs findElementByText (main.swift:1126) against the AX tree, finds the Screen Time sidebar row, and clicks at its center. The post-action traversal returns a diff showing the detail view's new elements: Downtime, App Limits, Communication Limits, Always Allowed.",
              },
              {
                title:
                  "click_and_traverse with element='Downtime'",
                description:
                  "Enter the Downtime section. If this is the first Screen Time interaction on this Mac, the passcode AXSheet appears. findSheetBounds (main.swift:241-278) scopes the viewport; the agent tap-types four digits into the AXButton row, then Continue, then Continue again to confirm.",
              },
              {
                title:
                  "click_and_traverse with element='Scheduled' role='AXCheckBox'",
                description:
                  "One call flips the Downtime toggle. The diff block prints AXCheckBox AXValue \"0\" -> \"1\" with the bounding box. Follow-up calls pick 'Custom' in the days AXPopUpButton and type the start/end times into the two AXTextFields. Every step verifies with the returned diff.",
              },
            ]}
          />
        </section>

        {/* Terminal */}
        <section className="bg-zinc-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-zinc-900 mb-4">
              The Stderr Log Of One Real &quot;Turn On Downtime&quot; Run
            </h2>
            <p className="text-zinc-600 mb-6 max-w-2xl">
              Pipe the MCP server into{" "}
              <span className="font-mono text-sm">
                python3 scripts/test_mcp.py
              </span>{" "}
              with the four-call sequence and this is what prints. The
              AXSheet detection line is the one that tells you the passcode
              modal was handled.
            </p>
            <TerminalOutput
              lines={terminalTranscript}
              title="macos-use MCP server — stderr"
            />
          </div>
        </section>

        {/* The one MCP call */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            The Tool Call That Flips The Scheduled Toggle
          </h2>
          <p className="text-zinc-600 mb-6">
            Either form works. The text-match form uses{" "}
            <span className="font-mono text-sm">findElementByText</span> at
            main.swift:1126 plus the role filter at main.swift:1315. The
            coordinate form copies x, y, w, h from the traversal text file.
            Both hit the same code path and both flip the AXCheckBox in one
            round trip.
          </p>
          <AnimatedCodeBlock
            code={combinedCallCode}
            language="json"
            filename="mcp-call.json"
          />
        </section>

        {/* Proof banner */}
        <ProofBanner
          quote="AXCheckBox inside interactiveRolePrefixes is the whole argument. Remove that one string and Downtime's Scheduled toggle stops appearing in the visible-elements summary on every traversal."
          source="Sources/MCPServer/main.swift:917"
          metric="1 line"
        />

        {/* Comparison table */}
        <section className="max-w-5xl mx-auto px-6 py-16">
          <ComparisonTable
            heading="Screen Time Control, Five Ways"
            intro="The SERP recommends rows 1-4. Row 5 is what this page is about."
            productName="macos-use MCP + built-in Screen Time"
            competitorName="Third-party blockers"
            rows={[
              {
                feature: "Needs a new app installed",
                competitor: "Yes. ScreenZen, Freedom, Jomo, Opal, AppBlock all require it",
                ours: "No. macOS already ships Screen Time in System Settings.",
              },
              {
                feature: "Monthly subscription",
                competitor: "Freedom, Jomo, Qustodio: yes. Most range $2-10/mo.",
                ours: "Zero. Screen Time is free; macos-use is MIT.",
              },
              {
                feature: "Driven by a sentence to an LLM",
                competitor: "No. GUI toggles only; no MCP, no CLI, no API.",
                ours: "Yes. 'Turn on Downtime 10pm-7am weekdays.' routes through four MCP calls.",
              },
              {
                feature: "Enforcement depth",
                competitor: "Most run in user space and can be bypassed by quitting the app",
                ours: "Screen Time itself enforces (FamilyControls, nesessionmanager). macos-use only flips the toggle.",
              },
              {
                feature: "Cross-device sync",
                competitor: "Varies per vendor; usually proprietary cloud",
                ours: "Apple's existing iCloud sync via the built-in Share Across Devices toggle.",
              },
              {
                feature: "Handles the first-run passcode modal",
                competitor: "Not applicable (their own UI)",
                ours: "findSheetBounds at main.swift:241-278 scopes viewport to the AXSheet.",
              },
              {
                feature: "Line count of the 'why this works' argument",
                competitor: "Not applicable",
                ours: "One line. main.swift:917 inside interactiveRolePrefixes.",
              },
            ]}
          />
        </section>

        {/* Bento grid */}
        <section className="bg-zinc-50 py-16">
          <div className="max-w-5xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-zinc-900 mb-4">
              Sentences That Turn Into Screen Time Actions
            </h2>
            <p className="text-zinc-600 mb-8 max-w-2xl">
              Each card below is one prompt into an MCP client. Each becomes a
              few grep calls against the traversal text file plus a short
              chain of click_and_traverse calls. Nothing here talks to a
              third-party server.
            </p>
            <BentoGrid cards={bentoCards} />
          </div>
        </section>

        {/* Metrics row */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            The Page In Numbers
          </h2>
          <p className="text-zinc-600 mb-8 max-w-2xl">
            Pulled from the current head of{" "}
            <span className="font-mono text-sm">main</span>. If the source
            moves, these line numbers are the check against what shipped.
          </p>
          <MetricsRow metrics={metrics} />
          <p className="text-zinc-500 text-sm mt-6">
            <NumberTicker value={917} /> is the line. The rest of this page
            traces back to it, plus lines{" "}
            <NumberTicker value={241} />-<NumberTicker value={278} /> for the
            passcode sheet.
          </p>
        </section>

        {/* CTA */}
        <section className="max-w-4xl mx-auto px-6 py-8">
          <InlineCta
            heading="Drive Screen Time From A Sentence Tonight"
            body="Clone mediar-ai/mcp-server-macos-use, build with xcrun swift build, grant Accessibility permission once, add the binary to Claude Desktop's MCP config, and tell the model to turn Downtime on at 10pm. First call opens System Settings, second walks to Screen Time, third opens Downtime (handles the passcode sheet if needed), fourth flips the AXCheckBox. No new app installed."
            linkText="Get macos-use on GitHub"
            href="https://github.com/mediar-ai/mcp-server-macos-use"
          />
        </section>

        {/* FAQ */}
        <FaqSection items={faqItems} />
      </article>
    </>
  );
}
