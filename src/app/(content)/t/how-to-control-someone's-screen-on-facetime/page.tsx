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
  ComparisonTable,
  GlowCard,
  BentoGrid,
  ProofBanner,
  BeforeAfter,
  InlineCta,
  articleSchema,
  breadcrumbListSchema,
  faqPageSchema,
} from "@seo/components";

const SLUG = "how-to-control-someone's-screen-on-facetime";
const URL = `https://macos-use.dev/t/${SLUG}`;
const DATE_PUBLISHED = "2026-04-18";
const DATE_MODIFIED = "2026-04-18";
const TITLE =
  "How To Control Someone's Screen On FaceTime When The Viewer Can't See Your Cursor: The Accessibility-Tree Diff That Narrates For Them";
const DESCRIPTION =
  "Top SERP answers hand the cursor to the remote viewer. That's one workflow. This page is about the other: the remote viewer narrates, an AI on your Mac runs mcp-server-macos-use, and after every click the server returns a flat-text diff of the accessibility tree ('# diff: +N added, -N removed, ~N modified' at main.swift:1008) plus a paired .txt and .png receipt at /tmp/macos-use/. The remote viewer's AI reads the diff lines, not the SharePlay pixels. No squinting at video frames to tell if the Send button went from disabled to enabled.";

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
    title: "Control someone's screen on FaceTime, narrated from an AX diff",
    description:
      "Every mcp-server-macos-use tool call returns a +/-/~ accessibility-tree diff plus a .txt and .png receipt in /tmp/macos-use/. The remote viewer's AI reads the diff, not the SharePlay pixels.",
  },
};

const breadcrumbItems = [
  { label: "Home", href: "https://macos-use.dev" },
  { label: "Guides", href: "https://macos-use.dev/t" },
  { label: "Control someone's screen on FaceTime" },
];

const breadcrumbSchemaItems = [
  { name: "Home", url: "https://macos-use.dev" },
  { name: "Guides", url: "https://macos-use.dev/t" },
  { name: "Control someone's screen on FaceTime", url: URL },
];

const faqItems = [
  {
    q: "What exactly does the accessibility-tree diff look like in the response file?",
    a: "Three blocks under a header. The header is 'diff: +N added, -N removed, ~N modified' written at main.swift:1008. Added elements print with a plus prefix at main.swift:1014 ('+ [AXButton (button)] \"Send\" x:820 y:612 w:60 h:28'). Removed elements print with a minus prefix at main.swift:1017. Modified elements print with a tilde prefix at main.swift:1026 in the shape '~ [AXButton] \"Send\" | AXEnabled: \\'false\\' -> \\'true\\''. The full response is written to /tmp/macos-use/<timestamp>_<tool>.txt so you can grep it later.",
  },
  {
    q: "Why is that format good for the remote viewer on FaceTime instead of just watching the video?",
    a: "SharePlay encodes at roughly 30fps and compresses text aggressively. Small UI state changes, like a disabled button going to enabled or a label swap from 'Send' to 'Sending…', are routinely lost to compression blur. The diff is unambiguous: the exact element role, the exact before and after text, the AXEnabled change. The remote viewer's AI reads 'AXButton Send changed AXEnabled false -> true' and narrates 'the Send button is enabled now' without ever inspecting a video frame.",
  },
  {
    q: "Which tools return a diff and which return a full traversal?",
    a: "The switch is inside buildToolResponse at main.swift:612 on the hasDiff flag. hasDiff is true for click, type, press, scroll — the four that mutate UI state. open_application and refresh_traversal return a full traversal instead, written out by the branch at main.swift:720-722. So the diff format is specific to mutation calls, which is the useful case during a FaceTime session. You do not need a full dump of the accessibility tree after every click, just what changed.",
  },
  {
    q: "Where does the red crosshair in the screenshot come from?",
    a: "ScreenshotHelper/main.swift:70-85. After CGWindowListCreateImage captures the frontmost window, ScreenshotHelper draws a 2pt red stroke crosshair with 15pt arms centered at lastClickPoint, plus a 10pt radius circle around it. The click coordinates are passed from main.swift:1839 via the --click-point flag on the helper subprocess. lastClickPoint is set per-call at the click_and_traverse handler site, so the PNG shows where the cursor landed even though the cursor itself has already snapped back.",
  },
  {
    q: "Where does the .txt file come from and how is it named?",
    a: "main.swift:1825-1829. The handler builds a timestamp in milliseconds ('Int(Date().timeIntervalSince1970 * 1000)'), strips the 'macos-use_' prefix from the tool name, and writes the response to '/tmp/macos-use/<ts>_<toolname>.txt'. The screenshot at main.swift:1834-1839 reuses the same timestamp so the .txt and .png names match. If you collect five clicks in one call they will be 1713456789012_click_and_traverse.txt through 1713456792512_click_and_traverse.txt, each paired with its own PNG.",
  },
  {
    q: "Does filtering remove noise from the diff, or is every accessibility change surfaced?",
    a: "Filtering happens in buildToolResponse at main.swift:648-718. Scroll-bar elements are dropped by isScrollBarNoise (main.swift:591). Structural containers like AXRow, AXCell, AXColumn, AXMenu without text are dropped by isStructuralNoise at main.swift:600-607. Coordinate-only changes (x, y, width, height attributes) are filtered out of modified entries at main.swift:681-682. What you are left with is role + text + the semantic attribute that flipped, which is exactly what narrates well.",
  },
  {
    q: "What does 'text_changes' mean in the compact summary the MCP client actually sees?",
    a: "The tool returns a short summary to the MCP client, with the full diff written to the .txt file. The summary at main.swift:838-857 collects up to three modified elements whose changed attribute is 'text' or 'AXValue' and prints them as 'text_changes:' followed by 'old' -> 'new' lines. That is the terse signal the AI reads first. If it wants more, the 'file:' line tells it where to grep. The hint line at main.swift:761 even shows the grep command: 'hint: grep -n AXButton <filepath>'.",
  },
  {
    q: "Can the remote viewer or their AI read the .txt file directly?",
    a: "Only the host's AI can. The .txt and .png live in /tmp/macos-use/ on the host machine. The MCP client (running on the host) sees the summary, then can shell out to read the full file if it decides to. The remote viewer sees neither; they see the host AI's narration and the SharePlay video feed. The receipt pair is for the host: it is what they hand a teammate, an auditor, or a bug report after the call to say 'this is exactly what happened'.",
  },
  {
    q: "Does the diff tell you if the action silently opened a different app?",
    a: "Yes, via the cross-app handoff section at main.swift:1788-1808. If hasDiff is true and the frontmost app PID changed from the one passed to the tool, the handler sets toolResponse.appSwitchPid and re-traverses the new frontmost app. The .txt file then appends a second 'app_switch:' header followed by the new app's element list (main.swift:1031-1036). The summary includes 'app_switch: <App> (PID: N) is now frontmost'. So the AI narrates 'that click launched Mail, here is its new window'.",
  },
  {
    q: "What if the click did nothing — is the diff empty or is there a default message?",
    a: "buildDiffSummary at main.swift:888-894 returns 'No changes.' when all three arrays are empty, and that string is appended to the one-line summary. So a click that landed on a non-interactive element, or an AXButton that did not change state, produces a response like 'Clicked at (420, 300). No changes.' and the .txt file has the header '# diff: +0 added, -0 removed, ~0 modified' followed by a blank element section. The AI can read that and narrate 'nothing happened, try a different spot'.",
  },
  {
    q: "Why both a .txt and a .png instead of just one? Isn't the diff enough?",
    a: "The diff describes the post-click world in accessibility terms. The PNG describes where the click physically landed in pixel terms, with the red crosshair showing the exact coordinate. Most of the time you only need the diff. But when an action does nothing, the PNG is the tiebreaker: you can see the crosshair fell on a disabled area, or missed the target, or landed on an overlay you did not know was there. Two formats, two angles on the same event.",
  },
  {
    q: "Can I clear the receipt files, or will /tmp/macos-use grow forever?",
    a: "Nothing in the server prunes them. /tmp is cleared by macOS on reboot and by periodic launchd tasks (typically anything untouched for 3 days). For a single FaceTime session you will accumulate on the order of tens to low-hundreds of file pairs. If you need to keep them, copy /tmp/macos-use/ somewhere persistent before rebooting. If you want them gone sooner, 'rm -rf /tmp/macos-use/*' between calls is safe — the directory is recreated by main.swift:1823 before the next write.",
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

const diffFormatCode = `// Sources/MCPServer/main.swift:1007-1028
// The flat-text response the handler writes to
// /tmp/macos-use/<timestamp>_<tool>.txt.
// The AI reads these lines. The remote FaceTime viewer does not need to
// see the SharePlay video to know what happened — the diff is structured.

if let diff = toolResponse.diff {
    lines.append("# diff: +\\(diff.added.count) added, -\\(diff.removed.count) removed, ~\\(diff.modified.count) modified")
    if toolResponse.sheetDetected == true {
        lines.append("# dialog: AXSheet detected")
    }
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

const crosshairCode = `// Sources/ScreenshotHelper/main.swift:70-85
// The red crosshair + circle drawn on every screenshot at the
// click point. This is what survives in /tmp/macos-use/<ts>_<tool>.png
// after the cursor has already snapped back.

// Red crosshair
ctx.setStrokeColor(CGColor(red: 1, green: 0, blue: 0, alpha: 1))
ctx.setLineWidth(2.0 * max(scaleX, scaleY))

let armLength: CGFloat = 15 * max(scaleX, scaleY)
ctx.move(to: CGPoint(x: drawX - armLength, y: drawY))
ctx.addLine(to: CGPoint(x: drawX + armLength, y: drawY))
ctx.move(to: CGPoint(x: drawX, y: drawY - armLength))
ctx.addLine(to: CGPoint(x: drawX, y: drawY + armLength))
ctx.strokePath()

// Circle around crosshair
ctx.setLineWidth(1.5 * max(scaleX, scaleY))
let radius: CGFloat = 10 * max(scaleX, scaleY)
ctx.addEllipse(in: CGRect(x: drawX - radius, y: drawY - radius,
                          width: radius * 2, height: radius * 2))
ctx.strokePath()`;

const receiptPairCode = `// Sources/MCPServer/main.swift:1821-1840
// The receipt pair: one .txt with the full diff, one .png with the crosshair.
// Both use the same timestamp so they align on disk and in the summary.

let outputDir = "/tmp/macos-use"
try? FileManager.default.createDirectory(atPath: outputDir,
                                         withIntermediateDirectories: true)

let timestamp = Int(Date().timeIntervalSince1970 * 1000)  // ms, avoids collisions
let safeName = params.name.replacingOccurrences(of: "macos-use_", with: "")
let filename = "\\(timestamp)_\\(safeName).txt"
let filepath = "\\(outputDir)/\\(filename)"
try? resultTextString.write(toFile: filepath, atomically: true, encoding: .utf8)
fputs("log: handler(CallTool): wrote full response to \\(filepath) (\\(resultTextString.count) bytes)\\n", stderr)

// --- Capture window screenshot ---
var screenshotPath: String? = nil
let screenshotFilename = "\\(timestamp)_\\(safeName).png"
let screenshotFilepath = "\\(outputDir)/\\(screenshotFilename)"
let screenshotPid = toolResponse.appSwitchPid ?? toolResponse.traversalPid ?? options.pidForTraversal
if let pid = screenshotPid {
    screenshotPath = captureWindowScreenshot(
        pid: pid,
        outputPath: screenshotFilepath,
        clickPoint: lastClickPoint,                 // crosshair lands here
        traversalWindowBounds: toolResponse.windowBounds
    )
}`;

export default function HowToControlFaceTimePage() {
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
                FaceTime SharePlay + MCP
              </span>
              <span className="inline-block bg-zinc-100 text-zinc-600 text-xs font-medium px-2 py-1 rounded-full">
                structured diff, not pixels
              </span>
              <span className="inline-block bg-cyan-50 text-cyan-700 text-xs font-medium px-2 py-1 rounded-full font-mono">
                .txt + .png receipt per call
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 mb-6">
              How To Control Someone&apos;s Screen On FaceTime When{" "}
              <GradientText>The Viewer Cannot See Your Cursor</GradientText>:
              The Accessibility-Tree Diff That Narrates Every Click
            </h1>
            <p className="text-lg text-zinc-500 max-w-2xl mb-6">
              Apple&apos;s native FaceTime remote control (iOS 18, macOS 15) is one
              workflow. The other workflow keeps the cursor with the host, puts an
              AI in the middle, and lets the remote viewer narrate. The piece that
              makes the narration work is not the video feed. It is the flat-text
              accessibility-tree diff mcp-server-macos-use writes after every
              disruptive tool call: one line per added, removed, or modified element,
              with attribute-level before and after. The diff plus a PNG with a red
              crosshair at the click point survive on disk as a per-call receipt.
            </p>
            <ArticleMeta
              datePublished={DATE_PUBLISHED}
              author="macos-use maintainers"
              readingTime="11 min read"
            />
            <div className="mt-8 flex gap-4 flex-wrap">
              <ShimmerButton href="https://github.com/mediar-ai/mcp-server-macos-use/blob/main/Sources/MCPServer/main.swift#L1007">
                Read the diff format at main.swift:1007
              </ShimmerButton>
              <a
                href="https://github.com/mediar-ai/mcp-server-macos-use/blob/main/Sources/ScreenshotHelper/main.swift#L70"
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-zinc-200 bg-white text-zinc-700 text-sm font-medium hover:border-teal-300 hover:text-teal-700 transition-colors"
              >
                Crosshair at ScreenshotHelper:70
              </a>
            </div>
          </div>
        </BackgroundGrid>

        <ProofBand
          rating={5.0}
          ratingCount="open source"
          highlights={[
            "Per-call AX diff: '# diff: +N added, -N removed, ~N modified' at main.swift:1008",
            "Modified lines carry attribute-level before -> after at main.swift:1024",
            "Paired .txt + .png receipt in /tmp/macos-use/ per call at main.swift:1821-1839",
          ]}
        />

        <section className="max-w-4xl mx-auto px-6 py-16">
          <RemotionClip
            title="The remote viewer isn't watching the video. Their AI is reading your diff."
            subtitle="Why an AI-narrated FaceTime screen-control session leans on text, not pixels"
            captions={[
              "Host clicks via macos-use_click_and_traverse",
              "Server returns +/-/~ diff of the AX tree",
              "Summary + .txt file + .png with red crosshair",
              "Remote viewer's AI reads the diff, narrates out loud",
              "Receipt pair lives in /tmp/macos-use/ after the call",
            ]}
            accent="teal"
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            The SERP Thinks You Want Someone Else Driving Your Cursor
          </h2>
          <p className="text-zinc-600 mb-4">
            Search the keyword and every top result tells you to use FaceTime&apos;s
            built-in remote control, Zoom remote control, TeamViewer, Anydesk, or
            macOS Screen Sharing. Different products, same workflow: the remote
            person moves your cursor directly. That workflow has its place (support
            calls where the remote expert has to touch the UI) and Apple&apos;s
            native feature is pretty good on iOS 18 and macOS 15, outside the EU.
          </p>
          <p className="text-zinc-600 mb-8">
            This page is about the workflow they miss. The remote person never
            gets the cursor. An AI on your Mac does, via mcp-server-macos-use. The
            remote person talks, the AI acts, and after every action the AI
            narrates what changed. The question that workflow raises is: how does
            the remote person know the click worked? The answer is not the
            SharePlay video feed. It is the accessibility-tree diff written to the
            server&apos;s flat-text response.
          </p>
          <BeforeAfter
            title="Two ways to know what happened after a click"
            before={{
              label: "Visual narration (watch the SharePlay frame)",
              content:
                "The remote viewer watches the compressed 30fps SharePlay stream and tries to spot the change. A Send button going from disabled to enabled is often one or two pixels of gray shift, easily lost to H.264 blocking. A label swapping from 'Send' to 'Sending…' can survive a compression pass or not. Narration depends on visual acuity and luck.",
              highlights: [
                "Relies on what the encoder preserved",
                "Small state flips are often invisible",
                "No persistent record after the call",
                "Cursor position muddies the signal",
              ],
            }}
            after={{
              label: "Structural narration (read the AX diff)",
              content:
                "The remote viewer's AI reads '# diff: +0 added, -0 removed, ~1 modified' followed by '~ [AXButton] \"Send\" | AXEnabled: false -> true'. The flip is unambiguous. The summary line also carries 'text_changes:' for any text / AXValue changes. The full diff is grep-able on the host at /tmp/macos-use/<ts>_<tool>.txt.",
              highlights: [
                "Structured: role, text, attribute, old -> new",
                "Unaffected by video compression",
                "Survives the call as a .txt + .png pair",
                "AI can narrate in one sentence: 'Send just enabled'",
              ],
            }}
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-8">
          <ProofBanner
            quote={`The response file opens with '# diff: +N added, -N removed, ~N modified' at main.swift:1008. Modified lines use the exact shape '~ [AXButton] "Send" | AXEnabled: \\'false\\' -> \\'true\\'' at main.swift:1024-1026. The paired PNG at /tmp/macos-use/<ts>_<tool>.png carries a 15pt red crosshair and a 10pt circle at lastClickPoint, drawn by ScreenshotHelper/main.swift:70-85. Both files survive the FaceTime call as a per-action receipt.`}
            source="Sources/MCPServer/main.swift and Sources/ScreenshotHelper/main.swift"
            metric="1 .txt + 1 .png per call"
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            One Tool Call, Three Outputs
          </h2>
          <p className="text-zinc-600 mb-6">
            Every disruptive tool call (click, type, press, scroll) produces the
            same three artifacts. The compact summary is what the MCP client sees
            inline. The .txt file is the full diff for grep. The .png is the
            crosshair receipt. They are all keyed to the same millisecond
            timestamp so you can pair them up after the call.
          </p>
          <AnimatedBeam
            title="One call, three receipts"
            from={[
              { label: "macos-use_click_and_traverse", sublabel: "(pid, x, y)" },
              { label: "macos-use_type_and_traverse", sublabel: "(pid, text)" },
              { label: "macos-use_press_key_and_traverse", sublabel: "(pid, key)" },
              { label: "macos-use_scroll_and_traverse", sublabel: "(pid, deltaY)" },
            ]}
            hub={{ label: "CallTool handler", sublabel: "main.swift:1474" }}
            to={[
              { label: "Compact summary (MCP reply)", sublabel: "buildCompactSummary, ~30 lines" },
              { label: "/tmp/macos-use/<ts>_<tool>.txt", sublabel: "full +/-/~ AX diff" },
              { label: "/tmp/macos-use/<ts>_<tool>.png", sublabel: "window shot + red crosshair" },
            ]}
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            The Diff Block, Verbatim From main.swift
          </h2>
          <p className="text-zinc-600 mb-6">
            Three loops, one header. Added elements print with a plus prefix,
            removed with a minus, modified with a tilde. The interesting case is
            the modified loop. Every changed attribute becomes one '&lt;name&gt;:
            old -&gt; new' fragment, joined by commas, tail-appended after a pipe.
            That is the shape the AI reads to narrate; it is also the shape a
            human reader can scan to answer &ldquo;did the click do anything?&rdquo;
          </p>
          <AnimatedCodeBlock
            code={diffFormatCode}
            language="swift"
            filename="Sources/MCPServer/main.swift"
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            What The Remote Viewer Actually Hears On The Call
          </h2>
          <p className="text-zinc-600 mb-6">
            Step by step, here is the loop a single &ldquo;click the Send
            button&rdquo; request runs through. The remote viewer is on the far
            side of a FaceTime call, SharePlay is active, and the host has
            mcp-server-macos-use wired into an MCP client. Nothing in this loop
            depends on what the remote viewer sees in the video feed.
          </p>
          <StepTimeline
            steps={[
              {
                title: "Remote viewer narrates: 'click Send'",
                description:
                  "Voice or text from the remote side of the FaceTime call. The host forwards it to the MCP client. FaceTime carries no input from the remote side in this workflow.",
                detail:
                  "Apple remote control is off. The only input channel into the Mac is the host's own keyboard into the AI client. The remote viewer is a narrator, not a driver.",
              },
              {
                title: "AI picks a tool and calls it",
                description:
                  "The MCP client issues macos-use_click_and_traverse with (pid, element: 'Send'). The handler at main.swift:1474 resolves the element, runs the click, and builds the diff via buildToolResponse at main.swift:612.",
                detail:
                  "hasDiff is true for click/type/press/scroll (main.swift:1518-1519). That flag determines the branch at main.swift:648 that returns a diff instead of a full traversal.",
              },
              {
                title: "Server filters noise out of the diff",
                description:
                  "Scroll-bar elements are dropped by isScrollBarNoise at main.swift:591. Structural containers without text (AXRow, AXCell, AXColumn, AXMenu) are dropped by isStructuralNoise at main.swift:600-607. Coordinate-only modified entries are dropped at main.swift:681-682.",
                detail:
                  "What is left is role + text + the semantic attribute that flipped. That is the useful signal for narration; everything else is layout churn the AI would have to ignore anyway.",
              },
              {
                title: "Server writes the receipt pair",
                description:
                  "main.swift:1827-1829 writes the flat-text response to /tmp/macos-use/<timestamp>_<tool>.txt. main.swift:1834-1839 launches the screenshot-helper subprocess to capture the window and draw the crosshair, writing the PNG with the same timestamp.",
                detail:
                  "Both paths are printed in the compact summary. The AI can shell out and grep the .txt for more detail; the host can open the .png after the call to verify the click landed where they meant.",
              },
              {
                title: "AI narrates from the summary",
                description:
                  "The summary lines 'summary: Clicked element Send. 0 added, 0 removed, 1 modified.' and 'text_changes:' feed the AI's response: 'Okay, Send fired. The button is greyed out now and the composer is empty.' The remote viewer hears that, not video interpretation.",
                detail:
                  "The AI reads the .txt with grep -n 'AXButton' <filepath> (the hint at main.swift:761 spells the command out) when the summary is not enough.",
              },
              {
                title: "After the call, the pair is your audit trail",
                description:
                  "Every action taken during the call left a .txt + .png in /tmp/macos-use/. Timestamps are in milliseconds so ordering is preserved. If something went wrong, you can reconstruct exactly what the AI clicked, where the cursor was, and what the accessibility tree reported afterward.",
                detail:
                  "/tmp is wiped on reboot and by launchd after ~3 days. If you need long-term audit, copy /tmp/macos-use/ to persistent storage before ending the session.",
              },
            ]}
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            A Real Diff Response, Line By Line
          </h2>
          <p className="text-zinc-600 mb-6">
            What the AI sees when it reads /tmp/macos-use/&lt;ts&gt;_click_and_traverse.txt
            after a click on the Send button in Mail. The header counts, the
            modified block carries the AXEnabled flip and the text swap, the
            added block surfaces a spinner that appeared in the toolbar.
          </p>
          <TerminalOutput
            title="/tmp/macos-use/1713456789012_click_and_traverse.txt"
            lines={[
              { type: "output", text: "# diff: +1 added, -0 removed, ~2 modified" },
              { type: "output", text: "" },
              { type: "output", text: "+ [AXImage (image)] \"sending indicator\" x:824 y:60 w:14 h:14 visible" },
              { type: "output", text: "~ [AXButton] \"Send\" | AXEnabled: 'true' -> 'false'" },
              { type: "output", text: "~ [AXTextArea] \"\" | AXValue: 'Hey — ship it' -> ''" },
              { type: "command", text: "grep -n 'AXButton' /tmp/macos-use/1713456789012_click_and_traverse.txt" },
              { type: "output", text: "3:~ [AXButton] \"Send\" | AXEnabled: 'true' -> 'false'" },
            ]}
          />
        </section>

        <section className="py-10 border-t border-b border-zinc-100">
          <Marquee speed={40} pauseOnHover>
            <span className="mx-8 px-4 py-2 bg-teal-50 text-teal-700 rounded-full text-sm font-medium whitespace-nowrap">
              # diff: +N added, -N removed, ~N modified
            </span>
            <span className="mx-8 px-4 py-2 bg-cyan-50 text-cyan-700 rounded-full text-sm font-medium whitespace-nowrap">
              + [AXButton] &quot;Send&quot;
            </span>
            <span className="mx-8 px-4 py-2 bg-zinc-100 text-zinc-700 rounded-full text-sm font-medium whitespace-nowrap">
              - [AXTextField] &quot;draft&quot;
            </span>
            <span className="mx-8 px-4 py-2 bg-teal-50 text-teal-700 rounded-full text-sm font-medium whitespace-nowrap">
              ~ AXEnabled: &apos;false&apos; -&gt; &apos;true&apos;
            </span>
            <span className="mx-8 px-4 py-2 bg-cyan-50 text-cyan-700 rounded-full text-sm font-medium whitespace-nowrap">
              isScrollBarNoise filter
            </span>
            <span className="mx-8 px-4 py-2 bg-zinc-100 text-zinc-700 rounded-full text-sm font-medium whitespace-nowrap">
              isStructuralNoise filter
            </span>
            <span className="mx-8 px-4 py-2 bg-teal-50 text-teal-700 rounded-full text-sm font-medium whitespace-nowrap">
              .txt + .png share a ms timestamp
            </span>
            <span className="mx-8 px-4 py-2 bg-cyan-50 text-cyan-700 rounded-full text-sm font-medium whitespace-nowrap">
              red crosshair at lastClickPoint
            </span>
          </Marquee>
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            By The Numbers
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <GlowCard>
              <div className="p-6 text-center">
                <div className="text-4xl font-bold text-teal-600">
                  <NumberTicker value={3} />
                </div>
                <div className="mt-2 text-sm text-zinc-500">
                  diff prefixes: + added, - removed, ~ modified
                </div>
              </div>
            </GlowCard>
            <GlowCard>
              <div className="p-6 text-center">
                <div className="text-4xl font-bold text-teal-600">
                  <NumberTicker value={2} />
                </div>
                <div className="mt-2 text-sm text-zinc-500">
                  files per call: .txt diff + .png crosshair
                </div>
              </div>
            </GlowCard>
            <GlowCard>
              <div className="p-6 text-center">
                <div className="text-4xl font-bold text-teal-600">
                  <NumberTicker value={15} suffix="pt" />
                </div>
                <div className="mt-2 text-sm text-zinc-500">
                  crosshair arm length at ScreenshotHelper:74
                </div>
              </div>
            </GlowCard>
            <GlowCard>
              <div className="p-6 text-center">
                <div className="text-4xl font-bold text-teal-600">
                  <NumberTicker value={4} />
                </div>
                <div className="mt-2 text-sm text-zinc-500">
                  AX roles filtered as structural noise
                </div>
              </div>
            </GlowCard>
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            The Receipt Pair, Written On One Timestamp
          </h2>
          <p className="text-zinc-600 mb-6">
            The .txt and .png share the same ms-precision timestamp by
            construction, not by coincidence. Both filenames are built at
            main.swift:1827 and main.swift:1834 from the single timestamp
            captured at main.swift:1825. So sorting /tmp/macos-use/ by name is
            sorting by chronological order, and the pair is always adjacent.
          </p>
          <AnimatedCodeBlock
            code={receiptPairCode}
            language="swift"
            filename="Sources/MCPServer/main.swift"
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            The Crosshair, Verbatim
          </h2>
          <p className="text-zinc-600 mb-6">
            The crosshair is a separate binary (ScreenshotHelper) so the main
            server never links against Quartz drawing paths it does not otherwise
            need. The helper reads --click-point from argv, captures the window
            with CGWindowListCreateImage, then draws a red 2pt stroke through
            the point with a 10pt circle around it. The point is scaled into
            image space via scaleX and scaleY computed from the window rect at
            ScreenshotHelper:55-58.
          </p>
          <AnimatedCodeBlock
            code={crosshairCode}
            language="swift"
            filename="Sources/ScreenshotHelper/main.swift"
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            One Call, Four Actors, Framed Around The Diff
          </h2>
          <p className="text-zinc-600 mb-6">
            The remote FaceTime viewer, the host&apos;s FaceTime (sharing the
            screen), the host&apos;s AI client (running MCP), and
            mcp-server-macos-use. Notice how the diff flows left-to-right and
            the video flows right-to-left. They are independent channels.
          </p>
          <SequenceDiagram
            title="Click -> diff -> narration, by actor"
            actors={["Remote viewer", "Host FaceTime", "AI client", "macos-use MCP"]}
            messages={[
              { from: 0, to: 1, label: "watches SharePlay video", type: "event" },
              { from: 0, to: 2, label: "narrates: click Send", type: "request" },
              { from: 2, to: 3, label: "click_and_traverse(pid, element: 'Send')", type: "request" },
              { from: 3, to: 3, label: "InputGuard.engage + CGEvent click", type: "event" },
              { from: 3, to: 3, label: "buildToolResponse, hasDiff=true", type: "event" },
              { from: 3, to: 3, label: "filter scrollbar + structural noise", type: "event" },
              { from: 3, to: 3, label: "write .txt + .png to /tmp/macos-use", type: "event" },
              { from: 3, to: 2, label: "compact summary + file path + screenshot path", type: "response" },
              { from: 2, to: 2, label: "optionally: read .txt to grep details", type: "event" },
              { from: 2, to: 0, label: "narrates: 'Send fired, button greyed out'", type: "response" },
              { from: 1, to: 0, label: "SharePlay catches up in 1-2 frames", type: "event" },
            ]}
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            Against The Top SERP Workflows, Row By Row
          </h2>
          <ComparisonTable
            productName="macos-use MCP + FaceTime SharePlay"
            competitorName="FaceTime remote control / Zoom / TeamViewer"
            rows={[
              {
                feature: "Who drives the cursor",
                ours: "the AI on the host, never the remote",
                competitor: "the remote person, directly",
              },
              {
                feature: "How the remote party knows a click landed",
                ours: "structured AX diff narrated by the AI",
                competitor: "their own eyes on the pixel stream",
              },
              {
                feature: "Click evidence after the call",
                ours: ".txt + .png pair in /tmp/macos-use/",
                competitor: "none by default",
              },
              {
                feature: "Works without Apple contacts relationship",
                ours: "yes, any FaceTime call works",
                competitor: "remote control requires contacts",
              },
              {
                feature: "Available in the EU",
                ours: "yes, no regional gate",
                competitor: "FaceTime remote control: no",
              },
              {
                feature: "State changes invisible to video compression",
                ours: "captured in the diff (AXEnabled, AXValue)",
                competitor: "often lost to H.264 blocking",
              },
              {
                feature: "Grep-able audit trail per action",
                ours: "main.swift:761 prints the grep command",
                competitor: "screen recording, if you remembered",
              },
            ]}
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            Why The Pair Matters, By Situation
          </h2>
          <BentoGrid
            cards={[
              {
                title: "The click seemed to do nothing on SharePlay",
                description:
                  "Grep the .txt for the tool name's last entry. If the diff says '0 added, 0 removed, 0 modified', the click really did nothing. If it says '1 modified', the UI changed but your viewer missed the pixel shift. Open the .png to see exactly where the crosshair landed.",
                size: "2x1",
              },
              {
                title: "You want to file a repro for a flaky app",
                description:
                  "Zip /tmp/macos-use/<ts>*.txt and <ts>*.png for the affected call range. You now have a timeline of accessibility state + click crosshairs for every action, no screen recording needed.",
                size: "1x1",
              },
              {
                title: "The remote viewer is on a bad connection",
                description:
                  "SharePlay may be dropping to a few fps. That does not matter. The diff is already on the wire from your AI client; the narration does not depend on the video reaching them cleanly.",
                size: "1x1",
              },
              {
                title: "A click silently launched another app",
                description:
                  "main.swift:1788-1808 detects the cross-app handoff, re-traverses the new frontmost app, and appends 'app_switch:' to the .txt. Your AI narrates 'that opened Mail, here is its window' without waiting for the video feed to resolve.",
                size: "2x1",
              },
            ]}
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-16 border-t border-zinc-100">
          <FaqSection items={faqItems} />
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <InlineCta
            heading="Read the diff format, the receipt-pair writer, and the crosshair drawer in one sitting"
            body="Three spots, total under 60 lines: main.swift:1007-1028 for the +/-/~ format, main.swift:1821-1840 for the .txt + .png pair, and ScreenshotHelper/main.swift:70-85 for the red crosshair. All open source, MIT-licensed, no accounts, no telemetry."
            linkText="Browse the repo on GitHub"
            href="https://github.com/mediar-ai/mcp-server-macos-use"
          />
        </section>
      </article>
    </>
  );
}
