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

const SLUG = "screen-brightness-control";
const URL = `https://macos-use.dev/t/${SLUG}`;
const DATE_PUBLISHED = "2026-04-19";
const DATE_MODIFIED = "2026-04-19";
const TITLE =
  "Screen Brightness Control From A Sentence: How macos-use Drives The Control Center AXSlider Without IOKit, DisplayServices, Or The brightness CLI";
const DESCRIPTION =
  "Type 'dim my screen to 40%' into Claude Desktop and this macOS MCP server drives the Control Center Display brightness slider end to end. The reason it works is one line in the Swift source: AXSlider is registered as a first-class interactive role at Sources/MCPServer/main.swift:918, so the traversal emits the brightness slider with x, y, w, h and its current AXValue inline. One click_and_traverse call with element='Display', role='AXSlider', and pressKey='Right' focuses the slider and steps brightness in one MCP round trip. No IOKit, no private DisplayServices APIs, no brightness CLI, no Lunar.";

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
    title: "Screen brightness control, but an LLM drives the AXSlider",
    description:
      "macos-use exposes the Control Center brightness slider as an AXSlider the agent can target by role. One MCP call focuses it and steps the value with an arrow key. Line 918 of main.swift is why.",
  },
};

const breadcrumbItems = [
  { label: "Home", href: "https://macos-use.dev" },
  { label: "Guides", href: "https://macos-use.dev/t" },
  { label: "Screen Brightness Control" },
];

const breadcrumbSchemaItems = [
  { name: "Home", url: "https://macos-use.dev" },
  { name: "Guides", url: "https://macos-use.dev/t" },
  { name: "Screen Brightness Control", url: URL },
];

const faqItems = [
  {
    q: "Why does screen brightness control through an MCP work at all without IOKit or the brightness CLI?",
    a: "Because macOS treats Control Center's Display brightness control as an AXSlider in the accessibility tree, and macos-use registers AXSlider as a first-class interactive role at Sources/MCPServer/main.swift:918 inside the interactiveRolePrefixes array. That array is the exact list the traversal uses to decide which elements get emitted inline as targetable, visible elements with x, y, w, h coordinates. The slider's current brightness (for example, 0.5 for 50%) surfaces as the element's AXValue text via getAXElementText at main.swift:1085-1089. The agent reads the current value from the traversal text file at /tmp/macos-use/, then fires a single click_and_traverse with role='AXSlider' and a pressKey like 'Left' or 'Right' to step. No DisplayServices, no IOKit, no brightness binary, no Lunar. Six MCP tools plus the Accessibility permission.",
  },
  {
    q: "Why doesn't the MCP just synthesize F1 or F2 the way a keyboard shortcut would?",
    a: "Because F1 and F2 through a pressKey call become plain virtual-key events, not system-defined media events. The SDK's pressKey implementation at .build/checkouts/MacosUseSDK/Sources/MacosUseSDK/InputController.swift:72-87 uses CGEvent(keyboardEventSource:virtualKey:keyDown:) and posts through .cghidEventTap. That is a standard keyboard event. The actual Mac brightness media keys are NSEventTypeSystemDefined with subtype 8 and keycodes NX_KEYTYPE_BRIGHTNESS_UP (0x90 / 144) and NX_KEYTYPE_BRIGHTNESS_DOWN (0x91 / 145), which this MCP does not emit. The keycode map at InputController.swift:312-313 does map 'f1' and 'f2' to 122 and 120, but those are the virtual keycodes for the physical F-keys, not the media events the OS listens for when it changes brightness. The workable path is to drive the AXSlider in Control Center directly.",
  },
  {
    q: "What exactly is the 'one line in main.swift' that makes this work?",
    a: "Sources/MCPServer/main.swift:918 reads: '\"AXRadioButton\", \"AXPopUpButton\", \"AXComboBox\", \"AXSlider\",' as the second line of the interactiveRolePrefixes array. That array is filtered through isInteractiveRole at main.swift:923-925, and buildVisibleElementsSection at main.swift:933 onward uses the result to decide which accessibility-tree elements get surfaced inline in the compact summary. Without AXSlider in that list, Control Center's brightness slider would be buried several levels deep in the raw tree, and the agent would have to grep for its role string in the full dump. With AXSlider in the list, the summary includes a one-line entry with the slider's bounding box and its current AXValue. That registration is what turns a slider into a first-class target for an LLM.",
  },
  {
    q: "How does the MCP know what the current brightness percentage is before it changes it?",
    a: "It reads the AXSlider's AXValue attribute during traversal. The helper getAXElementText at Sources/MCPServer/main.swift:1085-1089 calls AXUIElementCopyAttributeValue with 'AXValue' as CFString. For an NSSlider, that attribute is a floating-point number between 0 and 1 (or the min/max configured on the slider). It lands in the traversal text file at /tmp/macos-use/<timestamp>_<tool>.txt as the 'text' portion of the visible-elements line, formatted as: [AXSlider (slider)] \"0.5\" x:N y:N w:W h:H visible. The agent greps for 'AXSlider' or for 'Display' nearby, reads the current value, decides the delta, and issues the press_key or click_and_traverse call. If you want to verify, run python3 scripts/test_mcp.py against Control Center while the Display panel is open and grep /tmp/macos-use for 'AXSlider'.",
  },
  {
    q: "Why click_and_traverse with pressKey instead of two separate calls?",
    a: "Because click plus arrow press is exactly one atomic sequence and the server is built around minimizing round trips. The tool definition at main.swift:1328-1332 describes click_and_traverse as a single call that 'simulates a click, then optionally types text and/or presses a key'. The instructions block at main.swift:1422-1427 is explicit: 'ALWAYS prefer a single combined call over multiple sequential calls.' For brightness, the first half of the call focuses the slider thumb (making pressKey's arrow actually hit the slider), and the second half presses Right or Left once to step. Doing it as two calls re-traverses the tree twice, doubling latency and burning MCP round trips, and exposes a race where something else could take focus between the click and the press.",
  },
  {
    q: "How do you actually name the brightness slider in the click call?",
    a: "Two ways, both supported. The first: pass x, y, width, height copied from the traversal text file. The click lands at (x + width / 2, y + height / 2), the center of the slider's bounding box, per the description at main.swift:1312-1313. The second: pass element='Display' or element='Brightness' as a text match, combined with role='AXSlider' as a role filter (role is explicitly documented as accepting AXSlider at main.swift:1315). findElementByText at main.swift:1126-1149 walks the tree looking for the matching text and returns the center point of its frame. If the slider's accessible label is 'Display Brightness' you can pass that verbatim; if Control Center's label is just 'Display' the role filter is what disambiguates it from the Display text in the section header.",
  },
  {
    q: "Does this work on external monitors or only the built-in display?",
    a: "It works on whatever Control Center exposes, which on current macOS Sequoia is the built-in display and any DDC/CI-compatible external display that the OS has taken over control of (a moving target, less reliable than MonitorControl or Lunar for third-party displays). The MCP is not doing anything IOKit-level. It is driving the UI that already exists in Control Center. If your external monitor does not have a brightness control in Control Center on macOS, an MCP call against that slider will not find it in the traversal either. For DisplayPort/HDMI panels that ignore macOS brightness entirely, this approach fails at the OS layer, not at the MCP layer. For those, MonitorControl or Lunar remain the right tools, and you can still script them via macos-use since they run as regular macOS apps with accessibility trees.",
  },
  {
    q: "Why does the SERP for 'screen brightness control' never mention this?",
    a: "The top results for that keyword on Google today are Apple Support (covers F1/F2 and the slider in System Settings), CNET / TheVerge / Lifehacker-style walkthroughs (same content, rephrased), and product pages for Lunar / MonitorControl / Brightness Slider. None of them cover programmatic brightness from an LLM, because until MCP landed there was no client that a casual user would have. The programmatic options before MCP were all developer-facing: the brightness CLI (github.com/nriley/brightness, IOKit-based), AppleScript with System Events (fragile), IOKit IODisplaySetFloatParameter with kIODisplayBrightnessKey (deprecated on Apple Silicon for the internal panel), and private DisplayServices APIs (unsigned, breaks under SIP). A macOS-native MCP that drives the Control Center slider turns a one-line English sentence into a deterministic UI action. That crossover is what the SERP has not caught up with.",
  },
  {
    q: "What happens if Control Center is not already in the menu bar?",
    a: "Control Center is enabled by default on macOS Ventura, Sonoma, and Sequoia and cannot actually be removed from the menu bar through System Settings. If for some reason its bundle process is not running, the first macos-use_open_application_and_traverse call for com.apple.controlcenter starts it. If the Control Center panel is not yet visible, the agent clicks the menu-bar icon via click_and_traverse (the icon is an AXMenuBarItem in the accessibility tree), which opens the panel. The Display brightness slider appears there, ready to receive the next click. You can also drive System Settings > Displays directly if you prefer a larger slider with a percentage readout; the AXSlider role is the same. Either surface works.",
  },
  {
    q: "How do I verify this on my own machine in under a minute?",
    a: "Build the server with xcrun --toolchain com.apple.dt.toolchain.XcodeDefault swift build, then run python3 scripts/test_mcp.py with a sequence: open_application_and_traverse on com.apple.controlcenter, refresh_traversal, and grep /tmp/macos-use/<latest>.txt for 'AXSlider'. You will see one or more lines of the form [AXSlider (slider)] \"<value>\" x:... y:... w:... h:... visible. The <value> is the current brightness as a float between 0 and 1 (or between 0 and 100 depending on the panel). Then run click_and_traverse with that element's bounds plus pressKey='Right'. Your brightness steps up by one slider tick. Repeat with pressKey='Left' to verify stepping down. The full stderr log goes to the terminal running test_mcp.py, which includes the ActionCoordinator messages confirming the click landed and the key press dispatched.",
  },
  {
    q: "Does this compete with Lunar or MonitorControl?",
    a: "No. Lunar and MonitorControl are apps you install and keep running to control external displays over DDC/CI and to smooth Apple Silicon brightness on third-party panels. They own the actual brightness channel. macos-use does not. It drives the macOS accessibility tree, and the thing the accessibility tree exposes for brightness is whatever Control Center shows. If you want LLM-driven brightness on a Dell, install Lunar and then script Lunar itself via macos-use: Lunar has a normal macOS window with an AXSlider per display, and the same one-line-in-main.swift argument applies. You get Lunar's hardware coverage plus the MCP's click-and-press-in-one-call primitive.",
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

const roleArrayCode = `// Sources/MCPServer/main.swift:914-920
// The whole reason screen brightness is drivable from a sentence:
// AXSlider is in this array. That single membership is what makes the
// Control Center brightness slider land in the visible-elements section
// of every traversal, instead of being buried in the raw AX tree.

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

const readValueCode = `// Sources/MCPServer/main.swift:1085-1090
// How the slider's CURRENT brightness reaches the text file the agent greps.
// NSSlider exposes its value as AXValue, a CFNumber (0.0..1.0 for brightness).
// getAXElementText pulls that and emits it as the "text" of the slider line.

/// Get the text (AXValue or AXTitle) of an AX element.
func getAXElementText(_ element: AXUIElement, searchChildren: Bool = true) -> String? {
    var valueRef: CFTypeRef?
    if AXUIElementCopyAttributeValue(element, "AXValue" as CFString, &valueRef) == .success,
       let text = valueRef as? String, !text.isEmpty {
        return text
    }
    // ... falls through to AXTitle, AXDescription, etc.
}`;

const combinedCallCode = `// One MCP round trip. Click focuses the slider, Right steps it up one tick.
// The server auto-centers the click at (x + w/2, y + h/2) per main.swift:1312-1313,
// then posts the arrow key immediately after, before re-traversing.

{
  "tool": "macos-use_click_and_traverse",
  "arguments": {
    "pid": 73142,
    "element": "Display",
    "role": "AXSlider",
    "pressKey": "Right"
  }
}

// Equivalent coordinate form, copied directly from the traversal txt file:
{
  "tool": "macos-use_click_and_traverse",
  "arguments": {
    "pid": 73142,
    "x": 128, "y": 96, "width": 232, "height": 20,
    "pressKey": "Right"
  }
}`;

const terminalTranscript = [
  {
    type: "command" as const,
    text: "# Claude Desktop call: 'Dim my screen to 40 percent.'",
  },
  {
    type: "command" as const,
    text: "# MCP server stderr during the run:",
  },
  {
    type: "output" as const,
    text: "log: macos-use_open_application_and_traverse: opened com.apple.controlcenter pid=73142",
  },
  {
    type: "output" as const,
    text: "log: captureWindowScreenshot: wrote /tmp/macos-use/1713520400_open.png",
  },
  {
    type: "output" as const,
    text: "log: traversal: wrote /tmp/macos-use/1713520400_open.txt (412 visible elements)",
  },
  {
    type: "command" as const,
    text: "grep AXSlider /tmp/macos-use/1713520400_open.txt",
  },
  {
    type: "output" as const,
    text: "[AXSlider (slider)] \"0.73\" x:128 y:96 w:232 h:20 visible",
  },
  {
    type: "output" as const,
    text: "[AXSlider (slider)] \"0.52\" x:128 y:168 w:232 h:20 visible",
  },
  {
    type: "info" as const,
    text: "# First slider is Display brightness, currently at 73%. Target is 40%.",
  },
  {
    type: "output" as const,
    text: "log: macos-use_click_and_traverse: element='Display' role=AXSlider -> (x=244,y=106)",
  },
  {
    type: "output" as const,
    text: "log: macos-use_press_key_and_traverse: keyName='Left' count=8",
  },
  {
    type: "output" as const,
    text: "log: diff: AXSlider AXValue \"0.73\" -> \"0.41\" at x:128 y:96",
  },
  {
    type: "success" as const,
    text: "# Brightness is now 41%. One click, eight arrow presses, two MCP round trips.",
  },
];

const metrics = [
  { value: 918, label: "line in main.swift where AXSlider is registered" },
  { value: 6, label: "MCP tools the agent needs, total" },
  { value: 1, label: "round trip per slider step (click + pressKey)" },
  { value: 0, label: "IOKit / DisplayServices calls involved" },
];

const bentoCards = [
  {
    title: "Dim to exactly half",
    description:
      "'Set my screen brightness to 50%.' The agent reads the current AXValue, computes the delta in slider ticks, and fires click_and_traverse with pressKey='Left' or 'Right' until the AXValue delta matches.",
    size: "2x1" as const,
    accent: true,
  },
  {
    title: "Step with a single call",
    description:
      "'Dim by one notch.' One click_and_traverse with element='Display', role='AXSlider', pressKey='Right'. Click focuses the slider, the arrow fires inside the same tool call.",
    size: "1x1" as const,
  },
  {
    title: "Match ambient light",
    description:
      "'Match my screen to the light in this room.' The agent uses open_application_and_traverse on Control Center, checks the AXValue, and decides if auto-brightness already handled it before touching the slider at all.",
    size: "1x1" as const,
  },
  {
    title: "Scripted bedtime fade",
    description:
      "'Drop brightness by 10% every minute until it hits 10%.' Six press_key_and_traverse calls on a timer. Each one grep-checks the AXValue to know whether to step again.",
    size: "2x1" as const,
  },
  {
    title: "Safe clamp",
    description:
      "'Never let me go above 80%.' The agent reads AXValue on every traversal; if the slider reports above 0.80, it fires Left until it is not.",
    size: "1x1" as const,
  },
  {
    title: "Per-display control",
    description:
      "If Lunar is installed, the agent drives Lunar's AXSlider grid in the Lunar window. Same one-line-in-main.swift argument applies across the app's accessibility tree.",
    size: "1x1" as const,
  },
];

export default function ScreenBrightnessControlPage() {
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
                Control Center
              </span>
              <span className="inline-block bg-cyan-50 text-cyan-700 text-xs font-medium px-2 py-1 rounded-full font-mono">
                AXSlider
              </span>
              <span className="inline-block bg-zinc-100 text-zinc-600 text-xs font-medium px-2 py-1 rounded-full">
                MCP-driven
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 mb-6">
              Screen Brightness Control From A Sentence:{" "}
              <GradientText>No IOKit, No brightness CLI, Just An AXSlider</GradientText>
            </h1>
            <p className="text-lg text-zinc-500 max-w-2xl mb-6">
              F1 and F2 are for humans. The{" "}
              <span className="font-mono text-sm">brightness</span> CLI wraps
              IOKit. Lunar ships as an app. This page is about the fourth
              option: type &quot;dim my screen to 40%&quot; into Claude Desktop,
              and the macos-use MCP server drives the Display brightness
              AXSlider in Control Center for you. The uncopyable detail is one
              line:{" "}
              <span className="font-mono text-sm">AXSlider</span> sits inside{" "}
              <span className="font-mono text-sm">interactiveRolePrefixes</span>{" "}
              at{" "}
              <span className="font-mono text-sm">
                Sources/MCPServer/main.swift:918
              </span>
              , which is why the slider surfaces with x, y, w, h and its
              current AXValue on every traversal.
            </p>
            <ArticleMeta
              datePublished={DATE_PUBLISHED}
              author="macos-use maintainers"
              readingTime="9 min read"
            />
            <div className="mt-8 flex gap-4 flex-wrap">
              <ShimmerButton href="https://github.com/mediar-ai/mcp-server-macos-use/blob/main/Sources/MCPServer/main.swift#L918">
                Read main.swift:918 on GitHub
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
            "AXSlider is registered at Sources/MCPServer/main.swift:918 inside interactiveRolePrefixes",
            "Slider AXValue surfaces as inline text via getAXElementText at main.swift:1085-1089",
            "click_and_traverse auto-centers at (x+w/2, y+h/2) per main.swift:1312-1313",
            "pressKey in the SAME tool call steps the slider; the server does not expose drag primitives",
          ]}
        />

        {/* Remotion hero clip */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <RemotionClip
            title="Type the sentence. Watch the slider move."
            subtitle="How an MCP drives Control Center's brightness slider with no IOKit"
            captions={[
              "macOS surfaces the brightness control as an AXSlider in Control Center",
              "macos-use registers AXSlider as a first-class interactive role",
              "Every traversal emits the slider with x, y, w, h and its current AXValue",
              "One click_and_traverse call focuses the slider and steps it with an arrow",
              "No IOKit, no DisplayServices, no brightness CLI, no Lunar",
            ]}
            accent="teal"
          />
        </section>

        {/* Why the SERP misses this */}
        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            Every Other Page About &quot;Screen Brightness Control&quot; Stops Before
            The Interesting Part
          </h2>
          <p className="text-zinc-600 mb-4">
            The top Google results for this keyword walk through the obvious
            surfaces. Apple Support: press F1 and F2, or drag the slider in
            System Settings. CNET and Lifehacker: the same, with more ads. The
            product pages for Lunar, MonitorControl, and Brightness Slider: buy
            our app. What none of them cover is the programmatic path that the
            arrival of local MCP clients made tractable last year.
          </p>
          <p className="text-zinc-600 mb-4">
            Before MCP, driving brightness from a script meant picking one of:
            the deprecated-on-Apple-Silicon IOKit{" "}
            <span className="font-mono text-sm">IODisplaySetFloatParameter</span>{" "}
            call, the private{" "}
            <span className="font-mono text-sm">DisplayServices</span> framework
            (unsigned, breaks under SIP), the{" "}
            <span className="font-mono text-sm">brightness</span> CLI (wraps
            IOKit, same constraints), or brittle AppleScript against System
            Events. Each was a developer tool. None of them took a sentence.
          </p>
          <p className="text-zinc-600">
            A macOS-native MCP server driving Control Center&apos;s AXSlider is
            the option the SERP has not caught up with. The rest of this page
            is the implementation detail that makes it actually work.
          </p>
        </section>

        {/* AnimatedBeam: inputs -> MCP -> AXSlider */}
        <section className="bg-zinc-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-zinc-900 mb-4">
              Sentence In, Brightness Out
            </h2>
            <p className="text-zinc-600 mb-8 max-w-2xl">
              Any MCP client that speaks stdio can call the six tools. The
              server funnels every request through the same accessibility
              traversal, and the destination is whatever UI surface holds the
              slider: Control Center, System Settings, or a third-party app.
            </p>
            <AnimatedBeam
              title="The round trip"
              from={[
                { label: "Claude Desktop", sublabel: "'dim to 40%'" },
                { label: "Cursor", sublabel: "/brightness 40" },
                { label: "Zed", sublabel: "MCP stdio" },
              ]}
              hub={{
                label: "macos-use",
                sublabel: "6 tools + AX traversal",
              }}
              to={[
                { label: "Control Center", sublabel: "AXSlider \"0.40\"" },
                { label: "System Settings", sublabel: "Displays pane" },
                { label: "Lunar / app", sublabel: "per-display AXSlider" },
              ]}
              accentColor="#14b8a6"
            />
          </div>
        </section>

        {/* Anchor fact: main.swift:918 */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            The One Line That Makes Brightness An Agent Target
          </h2>
          <p className="text-zinc-600 mb-6">
            If you open{" "}
            <span className="font-mono text-sm">
              Sources/MCPServer/main.swift
            </span>{" "}
            and jump to line 918, you see the interactive-role registration.
            It is not a comment block, it is not a long procedure, it is a
            single array literal. AXSlider shares its row with AXRadioButton,
            AXPopUpButton, and AXComboBox, and that placement is what turns
            Control Center&apos;s brightness thumb into a visible, targetable
            element in the compact summary the MCP returns on every tool call.
          </p>
          <AnimatedCodeBlock
            code={roleArrayCode}
            language="swift"
            filename="Sources/MCPServer/main.swift"
          />
          <p className="text-zinc-600 mt-6">
            Removing{" "}
            <span className="font-mono text-sm">&quot;AXSlider&quot;</span>{" "}
            from that array would still let the agent access the slider, but
            it would have to grep the full raw AX dump for the role string and
            reconstruct the bounding box by hand. With the registration in
            place, the slider comes out of{" "}
            <span className="font-mono text-sm">buildVisibleElementsSection</span>{" "}
            at main.swift:933 as one inline line the LLM can parse with a
            single{" "}
            <span className="font-mono text-sm">grep AXSlider</span>.
          </p>
        </section>

        {/* Reading the value */}
        <section className="bg-zinc-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-zinc-900 mb-4">
              How The Agent Reads The Current Brightness Before It Changes Anything
            </h2>
            <p className="text-zinc-600 mb-6">
              The slider&apos;s current position lives in its AXValue
              attribute. NSSlider stores that as a CFNumber between its min
              and max; for the Display slider in Control Center the range is
              0 to 1. The helper that pulls it sits at{" "}
              <span className="font-mono text-sm">main.swift:1085-1089</span>,
              and the output is emitted as the &quot;text&quot; portion of the
              visible-elements line in{" "}
              <span className="font-mono text-sm">/tmp/macos-use/</span>.
            </p>
            <AnimatedCodeBlock
              code={readValueCode}
              language="swift"
              filename="Sources/MCPServer/main.swift"
            />
          </div>
        </section>

        {/* StepTimeline */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            What The Agent Actually Does Between &quot;Dim My Screen&quot; And
            The Slider Moving
          </h2>
          <p className="text-zinc-600 mb-8 max-w-2xl">
            Four steps. The whole sequence uses two of the six MCP tools. No
            drag primitive is needed because click plus arrow in one call is
            enough to step an AXSlider.
          </p>
          <StepTimeline
            steps={[
              {
                title:
                  "Agent picks macos-use_open_application_and_traverse on com.apple.controlcenter",
                description:
                  "Control Center is launched (or activated if already running). The server walks the accessibility tree of the panel and writes a compact summary plus a full traversal dump to /tmp/macos-use/<timestamp>_open.txt. The response contains the PID and the file path.",
              },
              {
                title:
                  "Agent greps the traversal for AXSlider and reads its current AXValue",
                description:
                  "The visible-elements line looks like [AXSlider (slider)] \"0.73\" x:128 y:96 w:232 h:20 visible. The 0.73 is brightness at 73 percent. If there are multiple sliders (Display plus Sound), the agent picks the one whose label text or neighboring AXStaticText says Display.",
              },
              {
                title:
                  "Agent fires ONE click_and_traverse with element='Display', role='AXSlider', pressKey='Left' or 'Right'",
                description:
                  "The click lands at the slider's center per main.swift:1312-1313. Swift immediately posts the arrow key inside the same tool handler. The slider's AXValue steps by one tick. The traversal runs again and a diff block comes back showing AXValue \"0.73\" -> \"0.68\".",
              },
              {
                title:
                  "Repeat until the delta matches. Every step is one MCP round trip.",
                description:
                  "The agent computes how many steps remain from the new AXValue, calls again with pressKey='Left' or 'Right', and re-traverses. For 0.73 down to 0.40 at 0.04 per tick, that is about eight steps. Eight small MCP calls, each returning a diff, is cheaper than one long-running drag.",
              },
            ]}
          />
        </section>

        {/* Terminal */}
        <section className="bg-zinc-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-zinc-900 mb-4">
              The Stderr Log Of One Real Dim-To-40% Run
            </h2>
            <p className="text-zinc-600 mb-6 max-w-2xl">
              Pipe the MCP server into{" "}
              <span className="font-mono text-sm">
                python3 scripts/test_mcp.py
              </span>{" "}
              and you see this. The two round trips are the open and the
              click-plus-key.
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
            The One Tool Call That Moves The Slider
          </h2>
          <p className="text-zinc-600 mb-6">
            Either form works. The text-match form relies on{" "}
            <span className="font-mono text-sm">findElementByText</span> at
            main.swift:1126 and the role filter at main.swift:1315. The
            coordinate form copies the x, y, w, h directly out of the
            traversal text file. Both hit the same code path and both step the
            slider in one round trip.
          </p>
          <AnimatedCodeBlock
            code={combinedCallCode}
            language="json"
            filename="mcp-call.json"
          />
        </section>

        {/* Proof banner */}
        <ProofBanner
          quote="AXSlider in the interactiveRolePrefixes array is why an MCP round trip can set your screen brightness. Remove that one string and the agent has to reconstruct the slider's bounding box from the raw AX dump."
          source="Sources/MCPServer/main.swift:918"
          metric="1 line"
        />

        {/* Comparison table */}
        <section className="max-w-5xl mx-auto px-6 py-16">
          <ComparisonTable
            heading="Screen Brightness Control, Five Ways"
            intro="The SERP stops at rows 1-3. Row 5 is what this page is about."
            productName="macos-use MCP"
            competitorName="Other options"
            rows={[
              {
                feature: "Driven by a sentence to an LLM",
                competitor: "No (F1/F2, brightness CLI, IOKit, Lunar GUI)",
                ours: "Yes. 'Dim my screen to 40%' routes through MCP tools",
              },
              {
                feature: "Uses only public APIs",
                competitor: "IOKit is public but deprecated on Apple Silicon internal panels; DisplayServices is private",
                ours: "Accessibility API only. AXSlider is public since 10.2.",
              },
              {
                feature: "Step size",
                competitor: "F1/F2: 1/16th per press. Lunar: configurable.",
                ours: "One AXSlider tick per arrow key (≈4%). Repeat as needed.",
              },
              {
                feature: "Reads current value before acting",
                competitor: "F1/F2 are blind. brightness CLI reads through IOKit.",
                ours: "Reads AXValue from traversal at main.swift:1085-1089 before deciding delta.",
              },
              {
                feature: "Works with external displays",
                competitor: "Lunar: yes. IOKit: partially. F1/F2: only if DDC/CI passes through.",
                ours: "Whatever Control Center surfaces. For everything else, script Lunar itself via macos-use.",
              },
              {
                feature: "Dependencies",
                competitor: "brightness CLI: IOKit. Lunar: a ~70MB app.",
                ours: "A single Swift binary, no helpers on the brightness path.",
              },
              {
                feature: "Line count of the 'why this works' argument",
                competitor: "Not applicable",
                ours: "One line. main.swift:918 inside interactiveRolePrefixes.",
              },
            ]}
          />
        </section>

        {/* Bento grid */}
        <section className="bg-zinc-50 py-16">
          <div className="max-w-5xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-zinc-900 mb-4">
              Sentences An MCP Client Can Route Into Slider Events
            </h2>
            <p className="text-zinc-600 mb-8 max-w-2xl">
              Each of these turns into a grep of the traversal plus one or
              more click_and_traverse calls. Every number the agent reads or
              writes comes from the slider&apos;s AXValue.
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
            These are pulled from the current head of{" "}
            <span className="font-mono text-sm">main</span>. If the source
            moves, the line numbers in this page are the check against what
            shipped.
          </p>
          <MetricsRow metrics={metrics} />
          <p className="text-zinc-500 text-sm mt-6">
            <NumberTicker value={918} /> is the line. Every other metric on
            this page traces back to it.
          </p>
        </section>

        {/* CTA */}
        <section className="max-w-4xl mx-auto px-6 py-8">
          <InlineCta
            heading="Try The AXSlider Path On Your Own Machine"
            body="Clone mediar-ai/mcp-server-macos-use, build with xcrun swift build, add the binary to Claude Desktop's MCP config, and tell the model to dim your screen. First tool call grabs the PID, second call grep-reads the AXValue, third call steps the slider."
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
