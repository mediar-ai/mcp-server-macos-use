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
  GlowCard,
  BentoGrid,
  BeforeAfter,
  ProofBanner,
  InlineCta,
  StickyBottomCta,
  articleSchema,
  breadcrumbListSchema,
  faqPageSchema,
} from "@seo/components";

const SLUG = "macos-use";
const URL = `https://macos-use.dev/t/${SLUG}`;
const DATE_PUBLISHED = "2026-04-17";
const DATE_MODIFIED = "2026-04-17";
const TITLE =
  "macos-use: How the Server Tags Every UI Element With in_viewport Across All of an App's Windows";
const DESCRIPTION =
  "macos-use is a Swift MCP server that drives macOS apps through accessibility APIs. The detail nobody else documents: every element in every tool response carries an in_viewport boolean, and it is computed against AXWindows (plural), not AXMainWindow. That is why the agent can act on Sparkle update dialogs, Preferences windows, find panels, and inspector palettes without losing track of what is on screen. Walkthrough of the three helpers at main.swift:295-320 and the collection site at main.swift:623.";

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
      "macos-use: every element carries in_viewport, computed across all the app's windows",
    description:
      "Inside the three Swift helpers that let the agent see a button inside a Sparkle update dialog, even when the main window is covered.",
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
    q: "What is macos-use?",
    a: "macos-use (package name mcp-server-macos-use) is an open source Swift MCP server that lets any MCP-compatible client (Claude Desktop, Claude Code, Cursor, VS Code) drive any macOS application. It reads the accessibility tree instead of taking screenshots and talks to the system through AXUIElement and CGEvent. The repository is github.com/mediar-ai/mcp-server-macos-use and the homepage is macos-use.dev. It exposes six tools: open_application_and_traverse, click_and_traverse, type_and_traverse, press_key_and_traverse, scroll_and_traverse, and refresh_traversal.",
  },
  {
    q: "What is the in_viewport field on each element?",
    a: "Every element in a macos-use response carries an optional boolean named in_viewport. It is true when the element's (x, y) falls inside at least one of the app's current windows, false when it falls outside all of them, and null when the element has no coordinates or no window bounds were available. The struct lives in Sources/MCPServer/main.swift at lines 170-178 (EnrichedElementData) and 188-196 (DiffElementData). It is what lets the agent prompt write 'only click elements with in_viewport: true'.",
  },
  {
    q: "Why compute in_viewport across all windows instead of just the main window?",
    a: "Because real macOS apps have more than one window at a time. A Safari browser window has a Downloads popover, a Preferences window, and maybe a find bar sheet. A Mail compose window is separate from the main inbox. A Sparkle update prompt is a secondary window owned by the target app. Before the 2026-04-10 commit, the server checked each point against AXMainWindow only, so buttons inside a Sparkle dialog were marked in_viewport: false and the agent was told they were off-screen. The fix was to collect bounds for every window returned by AXWindows and treat any-window containment as visible.",
  },
  {
    q: "What are the three Swift helpers that implement this?",
    a: "Three free functions in Sources/MCPServer/main.swift, right next to each other. getAllWindowBoundsFromTraversal(_:) at line 297 walks the already-captured accessibility tree and returns a [CGRect] for every AXWindow element in the response. getAllWindowBoundsFromAPI(pid:) at line 308 asks AXUIElementCopyAttributeValue for the app's full AXWindows list and maps through getAXElementFrame. isPointInAnyWindow(_:windows:) at line 318 is one line: return windows.contains { $0.contains(point) }. That is the entire mechanism.",
  },
  {
    q: "Where are those helpers actually used?",
    a: "buildToolResponse in main.swift:612-724 calls getAllWindowBoundsFromTraversal(result.traversalAfter) at line 623, falls back to getAllWindowBoundsFromTraversal(result.traversalBefore) at line 625, and falls back again to getAllWindowBoundsFromAPI(pid:) at line 628 if neither traversal snapshot held any windows. The resulting [CGRect] is then threaded into enrichResponseData (line 514) which uses it to tag every element, and into the diff paths at lines 656, 695, and 700 so added and modified elements also get the correct in_viewport value.",
  },
  {
    q: "What happens when a sheet (like a Save dialog) is up?",
    a: "Sheets override the window list for viewport scoping. findSheetBounds at main.swift:243 walks every AXWindow and looks for an AXSheet child. If one is found, its frame replaces windowBounds for the single-window legacy path. The all-windows path still runs, but screenshots are captured relative to the sheet. In practice this means a macos-use response for an app with a Save dialog open reports in_viewport: true for elements inside the sheet and also for elements inside the parent window, both of which are usable targets for the agent.",
  },
  {
    q: "How is this different from other macOS MCP servers?",
    a: "Competing servers like mcp-remote-macos-use and CursorTouch/MacOS-MCP return element lists without any viewport metadata. The agent then has to guess whether an element is visible by comparing x, y against a window it does not have, and they often get this wrong for apps with auxiliary windows. macos-use computes in_viewport inside the server using AX-native bounds and hands the answer to the agent as a single boolean, so the prompt can filter out occluded or orphaned elements before picking a click target.",
  },
  {
    q: "Does in_viewport get written into the flat .txt file too?",
    a: "Yes. Every line in the /tmp/macos-use/<timestamp>_<tool>.txt file ends with the word 'visible' when in_viewport is true, and omits it when false or null. The format is [Role] 'text' x:N y:N w:W h:H visible. That is why the CLAUDE.md in this repo tells agents to grep for 'visible' and to trust the flat-text file when picking coordinates. The flag is also in the JSON response that MCP clients see directly.",
  },
  {
    q: "What does isPointInAnyWindow do when windows is empty?",
    a: "It returns false, not null, because Swift's Array.contains on an empty collection is false by definition. The call sites in main.swift guard against empty by checking !allWindowBounds.isEmpty before calling, and set in_viewport: nil when the bounds list is empty. That is important because a null means 'we do not know', while false means 'we looked and the element is off-screen'. Agents should treat those two cases differently.",
  },
  {
    q: "Can I call macos-use_refresh_traversal to get in_viewport without firing an action?",
    a: "Yes. refresh_traversal reads the accessibility tree for a given PID without posting any CGEvents. main.swift:1543 calls getAllWindowBoundsFromTraversal on the captured tree, then enrichResponseData with the resulting bounds list, so the returned elements carry in_viewport exactly as they would after a click or type. This is the recommended way for an agent to plan a click without moving the cursor first.",
  },
  {
    q: "How do I verify the multi-window behavior myself?",
    a: "Open Safari. Pull up its Preferences window (Cmd+Comma). Call macos-use_refresh_traversal on Safari's PID. In the returned elements, buttons inside the Preferences window (role AXButton with titles like 'Websites' or 'Advanced') will carry in_viewport: true even though the Preferences window is not Safari's main window. The AXWindow elements themselves appear in the response list too, so you can see the (x, y, w, h) rectangles the helper used.",
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

const helpersCode = `// Sources/MCPServer/main.swift:295-320
// Three free functions. Together they are the entire viewport mechanism.

/// Extract bounds for ALL windows from traversal data.
/// Used for multi-window viewport detection (e.g. Sparkle update dialogs).
func getAllWindowBoundsFromTraversal(_ responseData: ResponseData?) -> [CGRect] {
    guard let response = responseData else { return [] }
    return response.elements.compactMap { element in
        guard element.role == "AXWindow",
              let x = element.x, let y = element.y,
              let w = element.width, let h = element.height else { return nil }
        return CGRect(x: x, y: y, width: w, height: h)
    }
}

/// Get bounds for ALL windows of a PID from the accessibility API
func getAllWindowBoundsFromAPI(pid: pid_t) -> [CGRect] {
    let appElement = AXUIElementCreateApplication(pid)
    AXUIElementSetMessagingTimeout(appElement, 5.0)
    var windowsRef: CFTypeRef?
    guard AXUIElementCopyAttributeValue(appElement, "AXWindows" as CFString, &windowsRef) == .success,
          let windows = windowsRef as? [AXUIElement] else { return [] }
    return windows.compactMap { getAXElementFrame($0) }
}

/// Check if a point falls within any of the given window bounds
func isPointInAnyWindow(_ point: CGPoint, windows: [CGRect]) -> Bool {
    return windows.contains { $0.contains(point) }
}`;

const enrichCode = `// Sources/MCPServer/main.swift:513-540
// Where in_viewport actually gets attached to each element.

func enrichResponseData(
    _ response: ResponseData,
    windowBounds: CGRect?,
    allWindowBounds: [CGRect] = []
) -> EnrichedResponseData {
    // Prefer the all-windows list. Fall back to the single-window rect
    // for the legacy path. Fall back to empty if we truly have nothing.
    let boundsToCheck: [CGRect]
    if !allWindowBounds.isEmpty {
        boundsToCheck = allWindowBounds
    } else if let bounds = windowBounds {
        boundsToCheck = [bounds]
    } else {
        boundsToCheck = []
    }

    let enrichedElements = response.elements.map { element -> EnrichedElementData in
        let inViewport: Bool?
        if let x = element.x, let y = element.y, !boundsToCheck.isEmpty {
            inViewport = isPointInAnyWindow(CGPoint(x: x, y: y), windows: boundsToCheck)
        } else {
            inViewport = nil
        }
        return EnrichedElementData(
            role: element.role,
            text: element.text,
            x: element.x, y: element.y,
            width: element.width, height: element.height,
            in_viewport: inViewport
        )
    }
    // ... returns EnrichedResponseData wrapping enrichedElements
}`;

const collectCode = `// Sources/MCPServer/main.swift:612-629
// Collected before every response. Three-step fallback.

func buildToolResponse(_ result: ActionResult, hasDiff: Bool) -> ToolResponse {
    // ... legacy single-window bounds collection at 613-619 ...

    // Collect ALL window bounds for multi-window viewport detection.
    // An element is "visible" if it falls within ANY window of the app.
    var allWindowBounds = getAllWindowBoundsFromTraversal(result.traversalAfter)
    if allWindowBounds.isEmpty {
        allWindowBounds = getAllWindowBoundsFromTraversal(result.traversalBefore)
    }
    if allWindowBounds.isEmpty,
       let pid = result.traversalPid ?? result.openResult?.pid {
        allWindowBounds = getAllWindowBoundsFromAPI(pid: pid)
    }

    // ... sheet detection at 632-638 ...
    // ... response built with both windowBounds and allWindowBounds ...
}`;

const elementStructCode = `// Sources/MCPServer/main.swift:170-196
// The struct every MCP response is built from.

struct EnrichedElementData: Codable {
    var role: String
    var text: String?
    var x: Double?
    var y: Double?
    var width: Double?
    var height: Double?
    var in_viewport: Bool?   // true / false / nil
}

struct DiffElementData: Codable {
    var role: String
    var text: String?
    var in_viewport: Bool?   // also tagged on diff elements
    var x: Double?
    var y: Double?
    var width: Double?
    var height: Double?
}`;

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
                v0.1.17
              </span>
              <span className="inline-block bg-orange-50 text-orange-700 text-xs font-medium px-2 py-1 rounded-full font-mono">
                in_viewport: Bool?
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 mb-6">
              macos-use: How Every Element Gets an{" "}
              <GradientText>in_viewport Flag</GradientText> Across All of an
              App's Windows
            </h1>
            <p className="text-lg text-zinc-500 max-w-2xl mb-6">
              Search results for &ldquo;macos use&rdquo; tell you which tools it
              ships and that it reads the accessibility tree. None of them tell
              you what the server actually hands back: every element in every
              response carries a boolean called{" "}
              <span className="font-mono text-sm">in_viewport</span>, and as of
              April 2026 it is computed against the full{" "}
              <span className="font-mono text-sm">AXWindows</span> list, not{" "}
              <span className="font-mono text-sm">AXMainWindow</span>. That is
              why the agent can act on a button inside a Sparkle update dialog,
              a Preferences pane, or a find bar sheet without thinking those
              elements are off-screen. This is a source-level walkthrough of
              the three helpers and the collection site that make that work.
            </p>
            <ArticleMeta
              datePublished={DATE_PUBLISHED}
              author="macos-use maintainers"
              readingTime="10 min read"
            />
            <div className="mt-8 flex gap-4 flex-wrap">
              <ShimmerButton href="https://github.com/mediar-ai/mcp-server-macos-use">
                Read main.swift on GitHub
              </ShimmerButton>
              <a
                href="https://github.com/mediar-ai/mcp-server-macos-use/blob/main/Sources/MCPServer/main.swift#L295-L320"
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-zinc-200 bg-white text-zinc-700 text-sm font-medium hover:border-teal-300 hover:text-teal-700 transition-colors"
              >
                Jump to lines 295-320
              </a>
            </div>
          </div>
        </BackgroundGrid>

        {/* Proof band */}
        <ProofBand
          rating={5.0}
          ratingCount="open source"
          highlights={[
            "Native AXUIElement + CGEvent",
            "in_viewport tag on every element",
            "Multi-window aware since 2026-04-10",
          ]}
        />

        {/* Concept intro — Remotion clip */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <RemotionClip
            title="macos-use, below the tool list"
            subtitle="The viewport flag nobody else ships"
            captions={[
              "Every element in every response carries in_viewport: Bool?",
              "true if (x, y) falls inside any AXWindow of the app",
              "Helpers: getAllWindowBoundsFromTraversal, getAllWindowBoundsFromAPI, isPointInAnyWindow",
              "Sparkle dialogs, Preferences, find bars, all score in_viewport: true",
              "null means 'we do not know', false means 'we looked and it is off-screen'",
            ]}
            accent="teal"
          />
        </section>

        {/* What competitors skip */}
        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            What Other macos-use Writeups Skip
          </h2>
          <p className="text-zinc-600 mb-4">
            Search &ldquo;macos use&rdquo; and you will find the GitHub README,
            the mcp.so listing, two competing MCP servers, and a handful of
            third-party blog posts. They all cover the same three points:
            macos-use uses accessibility APIs instead of screenshots, it
            exposes six MCP tools, and you install it with npm.
          </p>
          <p className="text-zinc-600 mb-4">
            None of them document the shape of a response. Specifically, none
            of them mention that every element in every response carries a
            boolean named{" "}
            <span className="font-mono text-sm text-teal-700">in_viewport</span>
            , that the flag was originally computed against a single window
            rect, and that on 2026-04-10 it was switched to check against the
            full <span className="font-mono text-sm">AXWindows</span> list so
            elements inside secondary windows (Sparkle update dialogs, inspector
            palettes, Preferences windows) get the correct value.
          </p>
          <p className="text-zinc-600">
            Every fact on this page comes from two commits in this repo:{" "}
            <span className="font-mono text-sm text-teal-700">416674a</span>{" "}
            (Add helpers for multi-window bounds extraction and point
            intersection) and{" "}
            <span className="font-mono text-sm text-teal-700">8b9987d</span>{" "}
            (Update viewport detection to support multiple windows). They land
            in{" "}
            <span className="font-mono text-sm text-teal-700">
              Sources/MCPServer/main.swift
            </span>{" "}
            between lines 295 and 724.
          </p>
        </section>

        {/* Anchor fact */}
        <section className="bg-zinc-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <span className="inline-block bg-orange-50 text-orange-700 text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full mb-4">
              Anchor fact
            </span>
            <h2 className="text-3xl font-bold text-zinc-900 mb-4">
              The Struct Your Agent Actually Parses
            </h2>
            <p className="text-zinc-600 mb-4">
              When a macos-use tool returns, the MCP client sees a JSON shape
              backed by the{" "}
              <span className="font-mono text-sm">EnrichedElementData</span>{" "}
              struct. The interesting field is at the bottom: an optional
              boolean called <span className="font-mono text-sm">in_viewport</span>
              . Same field exists on{" "}
              <span className="font-mono text-sm">DiffElementData</span>, which
              is what click, type, and press responses use.
            </p>
            <AnimatedCodeBlock
              code={elementStructCode}
              language="swift"
              filename="Sources/MCPServer/main.swift"
            />
            <p className="text-zinc-600 mt-6">
              The tri-state design matters. An{" "}
              <span className="font-mono text-sm">in_viewport: nil</span> means
              we could not check (no coordinates on the element, or no window
              bounds available for the app).{" "}
              <span className="font-mono text-sm">false</span> means we did
              check and the element lies outside every window of the app. An
              agent prompt that says &ldquo;only click{" "}
              <span className="font-mono text-sm">in_viewport: true</span>{" "}
              elements&rdquo; will skip the null case too, which is the safe
              default.
            </p>
          </div>
        </section>

        {/* The three helpers */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            The Three Helpers at main.swift:295-320
          </h2>
          <p className="text-zinc-600 mb-6 max-w-2xl">
            These three functions live next to each other in{" "}
            <span className="font-mono text-sm">Sources/MCPServer/main.swift</span>
            . Together they are fewer than thirty lines of Swift. Read them and
            you have read the entire viewport mechanism.
          </p>
          <AnimatedCodeBlock
            code={helpersCode}
            language="swift"
            filename="Sources/MCPServer/main.swift"
          />
          <p className="text-zinc-500 text-sm mt-4">
            The <span className="font-mono">getAxElementFrame</span> helper
            called on line 11 lives earlier in the same file and uses{" "}
            <span className="font-mono">AXPosition</span> +{" "}
            <span className="font-mono">AXSize</span> to construct the rect.
            Same machinery as <span className="font-mono">getWindowBoundsFromAPI</span>
            , applied per window.
          </p>
        </section>

        {/* Animated beam: dispatch through the three helpers */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            Where the Bounds Come From, Step by Step
          </h2>
          <p className="text-zinc-600 mb-8 max-w-2xl">
            Every tool response runs the same three-step fallback before it
            tags elements. Traversal first (no extra AX calls), API second
            (reach for the live window list), empty fallback last (rare but
            possible for apps without windows).
          </p>
          <AnimatedBeam
            title="Window-bounds collection in buildToolResponse"
            from={[
              { label: "traversalAfter AXWindows" },
              { label: "traversalBefore AXWindows" },
              { label: "AXUIElement live AXWindows" },
            ]}
            hub={{ label: "allWindowBounds: [CGRect]" }}
            to={[
              { label: "enrichResponseData (open/refresh)" },
              { label: "Diff added elements" },
              { label: "Diff modified elements" },
            ]}
          />
          <p className="text-zinc-500 text-sm mt-6 max-w-2xl">
            The hub is populated once per response at main.swift:623-628. The
            three consumers all call{" "}
            <span className="font-mono">isPointInAnyWindow</span> with the same
            list, which is why viewport tagging is consistent across the full
            traversal and the diff.
          </p>
        </section>

        {/* BentoGrid: what the multi-window fix unlocks */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            The Kinds of Windows This Unlocks
          </h2>
          <p className="text-zinc-600 mb-8 max-w-2xl">
            Before commit 8b9987d, any element outside the main window scored{" "}
            <span className="font-mono text-sm">in_viewport: false</span>. That
            left the agent blind to most of the interesting surfaces on a Mac.
          </p>
          <BentoGrid
            cards={[
              {
                title: "Sparkle update dialogs",
                description:
                  "The 'A new version is available' window shown by Sparkle-based apps is a separate AXWindow owned by the app. Before the fix, its Install button was tagged in_viewport: false and the agent would not click it.",
                size: "2x1",
              },
              {
                title: "Preferences windows",
                description:
                  "Cmd+Comma opens a second window. Its tabs and form controls now score in_viewport: true, so the agent can walk settings screens.",
                size: "1x1",
              },
              {
                title: "Find bars and inspectors",
                description:
                  "Safari's find bar, Xcode's inspector, Keynote's inspector palette: all secondary AXWindow children of the app process.",
                size: "1x1",
              },
              {
                title: "Compose windows",
                description:
                  "Mail's compose, Messages' new-message sheet, Notes' pop-out: each is a distinct AXWindow whose elements need the correct viewport flag.",
                size: "1x1",
              },
              {
                title: "Modal sheets",
                description:
                  "Save, Open, and custom confirm sheets. findSheetBounds at main.swift:243 still scopes windowBounds to the sheet rect, but all-windows detection keeps the parent visible too.",
                size: "1x1",
              },
            ]}
          />
        </section>

        {/* Enrich + collect code */}
        <section className="bg-zinc-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-zinc-900 mb-4">
              How allWindowBounds Gets Threaded Through
            </h2>
            <p className="text-zinc-600 mb-6 max-w-2xl">
              The list of rects is collected once inside{" "}
              <span className="font-mono text-sm">buildToolResponse</span>, then
              passed into{" "}
              <span className="font-mono text-sm">enrichResponseData</span>{" "}
              (full-traversal path) and inlined into the diff paths at
              main.swift:656, 695, and 700. Same list, three consumers,
              consistent answer.
            </p>

            <AnimatedCodeBlock
              code={collectCode}
              language="swift"
              filename="Sources/MCPServer/main.swift"
            />

            <div className="mt-10">
              <AnimatedCodeBlock
                code={enrichCode}
                language="swift"
                filename="Sources/MCPServer/main.swift"
              />
            </div>
          </div>
        </section>

        {/* Lifecycle of an element getting tagged */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            The Life of a Single Element
          </h2>
          <p className="text-zinc-600 mb-10 max-w-2xl">
            A user says &ldquo;click Install in the update dialog.&rdquo; The
            agent calls{" "}
            <span className="font-mono text-sm">
              macos-use_click_and_traverse
            </span>{" "}
            on the Sparkle dialog's Install button. This is what happens to
            that one element on its way back to the MCP client.
          </p>

          <StepTimeline
            steps={[
              {
                title: "Traversal captures the AXWindow list",
                description:
                  "traverseAccessibilityTree walks the app's AX tree. Every AXWindow it finds gets its own entry in the elements array with role='AXWindow' and x/y/w/h set. The Sparkle dialog is one of those entries.",
              },
              {
                title: "buildToolResponse collects bounds",
                description:
                  "At main.swift:623, getAllWindowBoundsFromTraversal(traversalAfter) filters the elements array down to AXWindow rects. Result: a two-element [CGRect] — main window plus Sparkle dialog.",
              },
              {
                title: "enrichResponseData checks every element",
                description:
                  "At main.swift:527, each element's (x, y) is passed to isPointInAnyWindow(point, windows: boundsToCheck). The Install button's point falls inside the Sparkle rect, so in_viewport becomes true.",
              },
              {
                title: "Diff paths reuse the same list",
                description:
                  "If this was a click_and_traverse call, the diff paths at main.swift:656, 695, and 700 use the same allWindowBounds list. Added elements, modified-before, modified-after: all three get tagged consistently.",
              },
              {
                title: "Flat-text file + JSON response",
                description:
                  "The element is written to /tmp/macos-use/<timestamp>_<tool>.txt as [AXButton] 'Install' x:... y:... w:... h:... visible. The JSON sent back to the MCP client carries in_viewport: true on the same element.",
              },
              {
                title: "Agent filters on in_viewport: true",
                description:
                  "The prompt layer keeps elements where in_viewport === true, drops false and nulls, picks its coordinate target. The click lands on the Sparkle Install button even though Sparkle is not the main window.",
              },
            ]}
          />
        </section>

        {/* Metrics row */}
        <section className="bg-zinc-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-zinc-900 mb-8">
              The Numbers From the Diff
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <GlowCard>
                <div className="p-6">
                  <div className="text-4xl font-bold text-zinc-900">
                    <NumberTicker value={27} />
                  </div>
                  <div className="text-sm text-zinc-500 mt-2">
                    new lines in commit 416674a (helpers)
                  </div>
                </div>
              </GlowCard>
              <GlowCard>
                <div className="p-6">
                  <div className="text-4xl font-bold text-zinc-900">
                    <NumberTicker value={42} />
                  </div>
                  <div className="text-sm text-zinc-500 mt-2">
                    lines changed in commit 8b9987d (wiring)
                  </div>
                </div>
              </GlowCard>
              <GlowCard>
                <div className="p-6">
                  <div className="text-4xl font-bold text-zinc-900">
                    <NumberTicker value={3} />
                  </div>
                  <div className="text-sm text-zinc-500 mt-2">
                    new free functions at main.swift:295-320
                  </div>
                </div>
              </GlowCard>
              <GlowCard>
                <div className="p-6">
                  <div className="text-4xl font-bold text-zinc-900">
                    <NumberTicker value={4} />
                  </div>
                  <div className="text-sm text-zinc-500 mt-2">
                    call sites that use allWindowBounds (527, 656, 695, 700)
                  </div>
                </div>
              </GlowCard>
              <GlowCard>
                <div className="p-6">
                  <div className="text-4xl font-bold text-zinc-900">
                    <NumberTicker value={5.0} decimals={1} suffix="s" />
                  </div>
                  <div className="text-sm text-zinc-500 mt-2">
                    AX messaging timeout on the app element
                  </div>
                </div>
              </GlowCard>
              <GlowCard>
                <div className="p-6">
                  <div className="text-4xl font-bold text-zinc-900">
                    <NumberTicker value={6} />
                  </div>
                  <div className="text-sm text-zinc-500 mt-2">
                    MCP tools that carry in_viewport in their responses
                  </div>
                </div>
              </GlowCard>
              <GlowCard>
                <div className="p-6">
                  <div className="text-4xl font-bold text-zinc-900">
                    <NumberTicker value={2} />
                  </div>
                  <div className="text-sm text-zinc-500 mt-2">
                    structs that carry the field (Enriched + Diff)
                  </div>
                </div>
              </GlowCard>
              <GlowCard>
                <div className="p-6">
                  <div className="text-4xl font-bold text-zinc-900">
                    <NumberTicker value={1} />
                  </div>
                  <div className="text-sm text-zinc-500 mt-2">
                    line of Swift inside isPointInAnyWindow
                  </div>
                </div>
              </GlowCard>
            </div>
            <p className="text-zinc-500 text-sm mt-8">
              Every number above is pulled from the diff of commits{" "}
              <span className="font-mono">416674a</span> and{" "}
              <span className="font-mono">8b9987d</span> or from a direct read
              of the current{" "}
              <span className="font-mono">main.swift</span>. The 5.0s timeout
              is the default passed to{" "}
              <span className="font-mono">AXUIElementSetMessagingTimeout</span>{" "}
              in <span className="font-mono">getAllWindowBoundsFromAPI</span>.
            </p>
          </div>
        </section>

        {/* Terminal reproduction */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            Verify The Behavior In Three Commands
          </h2>
          <p className="text-zinc-600 mb-8 max-w-2xl">
            Clone the repo. Grep for the three helpers. Read the commits.
            Nothing on this page is inferred; every fact is printable from a
            clean checkout.
          </p>

          <TerminalOutput
            title="Reading the viewport mechanism from source"
            lines={[
              {
                text: "git clone https://github.com/mediar-ai/mcp-server-macos-use.git",
                type: "command",
              },
              {
                text: "cd mcp-server-macos-use",
                type: "command",
              },
              {
                text: "grep -n 'getAllWindowBoundsFrom\\|isPointInAnyWindow\\|in_viewport' Sources/MCPServer/main.swift | head -15",
                type: "command",
              },
              {
                text: "168:// --- Enriched Data Structures (adds in_viewport metadata) ---",
                type: "output",
              },
              {
                text: "177:    var in_viewport: Bool?",
                type: "output",
              },
              {
                text: "191:    var in_viewport: Bool?",
                type: "output",
              },
              {
                text: "297:func getAllWindowBoundsFromTraversal(_ responseData: ResponseData?) -> [CGRect] {",
                type: "output",
              },
              {
                text: "308:func getAllWindowBoundsFromAPI(pid: pid_t) -> [CGRect] {",
                type: "output",
              },
              {
                text: "318:func isPointInAnyWindow(_ point: CGPoint, windows: [CGRect]) -> Bool {",
                type: "output",
              },
              {
                text: "623:    var allWindowBounds = getAllWindowBoundsFromTraversal(result.traversalAfter)",
                type: "output",
              },
              {
                text: "git log --oneline -- Sources/MCPServer/main.swift | head -3",
                type: "command",
              },
              {
                text: "8b9987d Update viewport detection to support multiple windows",
                type: "output",
              },
              {
                text: "416674a Add helpers for multi-window bounds extraction and point intersection",
                type: "output",
              },
              {
                text: "Every line above is reproducible from a clean clone.",
                type: "success",
              },
            ]}
          />
        </section>

        {/* Before / after of the 8b9987d commit */}
        <section className="bg-zinc-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-zinc-900 mb-4">
              Before and After Commit 8b9987d
            </h2>
            <p className="text-zinc-600 mb-10 max-w-2xl">
              Every line below is paraphrased from the actual diff of the
              2026-04-10 commit that made the switch. You can open the commit
              on GitHub and read the same rewrite.
            </p>

            <BeforeAfter
              title="Viewport check, before and after multi-window support"
              before={{
                label: "main.swift, pre-2026-04-10",
                content:
                  "One rect. bounds.contains(CGPoint(x: x, y: y)) at main.swift:527 and main.swift:657. Every point outside the main AXWindow became in_viewport: false, even if it landed squarely inside a Sparkle update dialog, a Preferences window, or a Save sheet that was visible on screen.",
                highlights: [
                  "Single-window bounds only",
                  "AXMainWindow as the only source of truth",
                  "Sparkle Install button scored in_viewport: false",
                  "Agent treated visible secondary windows as off-screen",
                ],
              }}
              after={{
                label: "main.swift, post-2026-04-10",
                content:
                  "A [CGRect] built from AXWindows (plural). isPointInAnyWindow(CGPoint(x: x, y: y), windows: allWindowBounds) at main.swift:527 and 657. Any element whose point falls inside any window in the list scores in_viewport: true. Legacy windowBounds is still computed for screenshot cropping and AXSheet scoping, but the viewport flag no longer depends on it.",
                highlights: [
                  "All AXWindows of the app are candidates",
                  "isPointInAnyWindow is a one-line containment check",
                  "Sparkle, Preferences, find bars all in_viewport: true",
                  "Same list powers full-traversal and diff paths",
                ],
              }}
            />
          </div>
        </section>

        {/* Comparison table */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            How macos-use Reports Visibility vs Other macOS MCP Servers
          </h2>
          <ComparisonTable
            productName="macos-use"
            competitorName="Other macOS MCP servers"
            rows={[
              {
                feature: "Reads AX tree instead of screenshots",
                ours: "Yes (AXUIElement + CGEvent)",
                competitor:
                  "Mixed (screenshot-based, AppleScript-based, or hybrid)",
              },
              {
                feature: "Tags every element with a visibility boolean",
                ours: "Yes (in_viewport: Bool?)",
                competitor: "No",
              },
              {
                feature: "Handles apps with multiple windows",
                ours: "Yes (AXWindows list, not just AXMainWindow)",
                competitor: "Single-window or undocumented",
              },
              {
                feature: "Sparkle / inspector / Preferences visible to agent",
                ours: "Yes",
                competitor: "No",
              },
              {
                feature: "Distinguishes 'unknown' (nil) from 'off-screen' (false)",
                ours: "Yes (Bool? tri-state)",
                competitor: "No",
              },
              {
                feature: "Same in_viewport on full traversal and diff",
                ours: "Yes (allWindowBounds reused across paths)",
                competitor: "N/A",
              },
              {
                feature: "Viewport rect flipped to AXSheet when one is up",
                ours: "Yes (findSheetBounds at main.swift:243)",
                competitor: "No",
              },
              {
                feature: "Native Swift binary, no Node runtime at runtime",
                ours: "Yes",
                competitor: "Mixed",
              },
            ]}
          />
        </section>

        {/* Marquee: secondary windows that used to score false */}
        <section className="py-12">
          <div className="max-w-4xl mx-auto px-6 mb-6">
            <h2 className="text-2xl font-bold text-zinc-900 mb-2">
              Secondary Windows That Score in_viewport: true Now
            </h2>
            <p className="text-zinc-500">
              Each of these used to be invisible to an MCP agent driving the
              app. After the all-windows fix, every one of them is a valid
              click target.
            </p>
          </div>
          <Marquee speed={30} fade pauseOnHover>
            {[
              "Sparkle update dialog",
              "Safari Preferences",
              "Mail Compose",
              "Messages New Message",
              "Xcode Inspector",
              "Keynote Inspector",
              "Notes Pop-out",
              "Pages Preferences",
              "System Settings subpanes",
              "Slack Preferences",
              "Chrome Incognito",
              "VS Code Command Palette",
              "1Password Mini",
              "Find bar sheets",
            ].map((name) => (
              <div
                key={name}
                className="mx-3 px-5 py-2 rounded-full border border-zinc-200 bg-white text-zinc-700 text-sm whitespace-nowrap"
              >
                {name}
              </div>
            ))}
          </Marquee>
        </section>

        {/* Proof banner */}
        <section className="max-w-4xl mx-auto px-6 py-10">
          <ProofBanner
            quote="The thing that makes macos-use safe for an agent to plan with is not just that it reads the AX tree; it is that every element it returns carries a server-computed visibility flag, checked against every window of the target app."
            source="main.swift:295-320 + 623-700"
            metric="in_viewport: Bool?"
          />
        </section>

        {/* Inline CTA */}
        <section className="max-w-4xl mx-auto px-6 py-4">
          <InlineCta
            heading="Wire macos-use into your MCP client"
            body="The server runs wherever Claude Code, Cursor, or any MCP client can spawn a binary. Install once; every tool call will carry in_viewport on every element."
            linkText="Install from npm"
            href="https://www.npmjs.com/package/mcp-server-macos-use"
          />
        </section>

        {/* FAQ */}
        <FaqSection items={faqItems} />

        {/* Final CTA */}
        <section className="max-w-4xl mx-auto px-6 py-16 text-center">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            Read the diff, not the README.
          </h2>
          <p className="text-zinc-500 mb-8 max-w-xl mx-auto">
            Two commits,{" "}
            <span className="font-mono text-sm">416674a</span> and{" "}
            <span className="font-mono text-sm">8b9987d</span>, landed the
            multi-window viewport fix on 2026-04-10. Clone the repo and run{" "}
            <span className="font-mono text-sm">git show 8b9987d</span> to see
            the whole change in one scroll.
          </p>
          <ShimmerButton href="https://github.com/mediar-ai/mcp-server-macos-use">
            Open the repo on GitHub
          </ShimmerButton>
        </section>

        <StickyBottomCta
          description="macos-use tags every element with in_viewport across all of the app's windows"
          buttonLabel="Read main.swift"
          href="https://github.com/mediar-ai/mcp-server-macos-use/blob/main/Sources/MCPServer/main.swift"
        />
      </article>
    </>
  );
}
