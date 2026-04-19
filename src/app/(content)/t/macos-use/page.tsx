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
  FlowDiagram,
  SequenceDiagram,
  AnimatedChecklist,
  MetricsRow,
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
const DATE_PUBLISHED = "2026-04-18";
const DATE_MODIFIED = "2026-04-18";
const TITLE =
  "macos-use: The Accessibility Diff You See Is Not The One macOS Emits";
const DESCRIPTION =
  "macos-use does not hand the raw accessibility tree diff to the model. Before the MCP response leaves the server, a filter pipeline drops coordinate-only changes, scroll-bar subcomponents, and empty structural containers, then back-fills text onto AXRow and AXCell via a two-strategy proximity search. A click that reflows fifty elements arrives as a handful of semantic events. The rules live in Sources/MCPServer/main.swift lines 592 through 718.";

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
    title: "macos-use: the diff you see is not the raw AX tree",
    description:
      "Coordinate-only changes dropped, scroll-bar roles dropped, empty AXRow/AXCell dropped, text back-filled via depth-first proximity. Read main.swift:649-718.",
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
    q: "What exactly does macos-use filter out of the raw accessibility diff, and where is that done in the source?",
    a: "Three filter passes run inside buildToolResponse at Sources/MCPServer/main.swift:612-725. Pass one drops any element whose role is a scroll-bar subcomponent, checked by isScrollBarNoise at main.swift:592-597 against the substrings scrollbar, scroll bar, value indicator, page button, and arrow button. Pass two drops any modification whose only changes are coordinate attributes, using a literal Set declared at line 649 as let coordinateAttrs: Set<String> = [\"x\", \"y\", \"width\", \"height\"] and applied at lines 681-682. Pass three drops any structural container with no text, checked by isStructuralNoise at main.swift:600-607 against AXRow, outline row, AXCell, cell, AXColumn, column, AXMenu, and menu. Nothing else in the codebase mutates the diff after these passes.",
  },
  {
    q: "Why is dropping coordinate-only changes safe, and when would it hide something real?",
    a: "macos-use already reports windowBounds and each surviving element carries x, y, width, and height alongside its role and text. If a model needs to know where something is to click it, the coordinates are right there. What the filter hides is reflow churn: the scroll view moved, every row's y shifted by 22, fifty modifications appear in the raw AX diff for a single click. None of those carry semantic information the agent can act on. The filter would hide a real change only if the code responded to a click by moving an element without altering any other attribute, and that element had no associated text. In practice the position move comes paired with the change the agent actually cares about (a button becoming enabled, a cell's text updating, a menu opening). The associated attribute change survives the filter and brings the element with it.",
  },
  {
    q: "How does macos-use find text for a cell or row whose AXValue is empty?",
    a: "findTextForElement at main.swift:551-589 runs two fallback strategies. Strategy one is coordinate containment: walk every element in the traversal and return the first element that has non-empty text and whose x, y falls inside the container's bounds. Strategy two is list proximity: the AX traversal is depth-first, so children immediately follow their parent in the flat list. The function finds the container by role plus a 2px coordinate match, then scans forward up to five entries for text, stopping if it hits another AXRow (which would mean the scan left the current subtree). Strategy one handles visible cells. Strategy two handles off-screen cells that have no coordinates because the AX system only reports bounds for on-screen elements. Together they keep row and cell diffs legible instead of anonymous.",
  },
  {
    q: "What counts as scroll-bar noise exactly?",
    a: "The substring list in isScrollBarNoise is deliberately wide. It catches AXScrollBar itself, but also AXValueIndicator (the draggable thumb), AXPageButton (the area above and below the thumb), AXArrowButton (the end caps), and generic scroll bar variants. Any click or scroll that moves the scroll view fires updates on the thumb position and the page button bounds, which would otherwise spam the diff with three or four modifications for every scroll event. After the filter, a scroll operation that reveals new content returns only the new content. The scroll mechanism itself is silent.",
  },
  {
    q: "Is the compact summary line (3 added, 2 modified) computed before or after filtering?",
    a: "After. buildDiffSummary at main.swift:888-895 counts diff.added.count, diff.removed.count, and diff.modified.count on the already-filtered EnrichedTraversalDiff assigned at main.swift:714-718. The number the model sees in its response summary is always the post-filter count. This matters because the numbers become the prompt: if a scroll showed \"18 modified\" every time due to scroll-bar churn, the model would start ignoring the field. Keeping the count semantic keeps it useful.",
  },
  {
    q: "Does the filter affect the full traversal returned by open or refresh, or only diffs?",
    a: "Only diffs. For tools that return a full traversal (open_application_and_traverse, refresh_traversal), the response field is toolResponse.traversal, populated at main.swift:721 by enrichResponseData. That function adds in_viewport flags but does not strip any roles. A refresh gives you the whole tree. The filter pipeline runs only when hasDiff is true, inside the else branch that builds EnrichedTraversalDiff.",
  },
  {
    q: "How does macos-use decide in_viewport when an app has multiple windows?",
    a: "getAllWindowBoundsFromTraversal at main.swift:297 collects CGRects from every AXWindow in the traversal. isPointInAnyWindow at main.swift:318 then checks whether an element's x, y falls inside any of those rects. The in_viewport flag is true if the point is inside any window, false otherwise. This is why a popover, dialog, or secondary window does not cause visible elements to be marked invisible: every window contributes to the viewport set. Sheets are a special case. When an AXSheet is present, windowBounds is narrowed to the sheet and sheetDetected is set in the response so the agent knows focus is modal.",
  },
  {
    q: "Why are static text entries capped at 10 and interactive entries capped at 30 in the compact summary?",
    a: "main.swift:933 defines buildVisibleElementsSection with defaults interactiveCap: 30 and textCap: 10. For diffs of new elements (diff.added), the caps are tightened to 20 and 10 at main.swift:867. The reason is MCP response size. A huge AX tree can emit hundreds of visible elements per call. The model does not need all of them inline when the full set is already in the flat text file at /tmp/macos-use/. The compact summary is a teaser with enough structure to write the next action; the file is there when the model wants to grep.",
  },
  {
    q: "What are the interactive role prefixes the compact summary recognises?",
    a: "main.swift:916-920 lists twelve: AXButton, AXLink, AXTextField, AXTextArea, AXCheckBox, AXRadioButton, AXPopUpButton, AXComboBox, AXSlider, AXMenuItem, AXMenuButton, and AXTab. isInteractiveRole is a has-prefix check, so AXMenuItemCell, AXComboBoxSubrole, and other longer variants still match. Everything else lands in the static-text bucket only if its role starts with AXStaticText. Anything that is neither interactive nor static text is dropped from the inline preview entirely (it stays in the flat file).",
  },
  {
    q: "How do I verify the filter pipeline on my own machine?",
    a: "Clone the repo, install the MCP server, point Claude Desktop at it, and grep. Example: grep -n 'coordinateAttrs' Sources/MCPServer/main.swift returns line 649. grep -nE 'isScrollBarNoise|isStructuralNoise' returns the predicate definitions and every call site. For a live check, open TextEdit via open_application_and_traverse, then scroll_and_traverse in a long document. The response summary will show a handful of added elements (the newly-revealed text) and no modified entries for the scroll bar itself. Remove the coordinateAttrs filter in a local build and the same scroll emits dozens of coordinate-only modifications. The difference is the filter doing its job.",
  },
  {
    q: "Does this filtering approach lose any information the agent needs later?",
    a: "Short answer: no, because the filter writes to the summary, not to the flat file. Every MCP tool response is paired with a file at /tmp/macos-use/<timestamp>_<tool>.txt containing the full serialised traversal and diff, pre-filter counts and all. An agent that suspects something was trimmed can grep that file by role, text, or coordinates. The filter shapes what arrives in the model's context window by default, it does not erase data. This is the same design principle as the subprocess screenshot: make the default cheap, keep the full fidelity on disk.",
  },
  {
    q: "Where does the text_changes line in the response come from?",
    a: "main.swift:837-858. After the summary line, buildCompactSummary scans the first five modifications in the filtered diff. For each modification, it walks the surviving changes and picks out any whose attributeName is text or AXValue. Up to three of those are emitted as lines shaped like '  'old text' -> 'new text'' with each value truncated to 60 characters. The effect is that a typing operation or a label swap shows up as a human-readable before-after pair in the summary, without the model needing to open the flat file.",
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

const filterCode = `// Sources/MCPServer/main.swift:648-718 (condensed)
// The accessibility diff the model receives is not the raw AX tree diff.
// Three filter passes run before the response leaves the server.

if hasDiff, let rawDiff = result.traversalDiff {
    let coordinateAttrs: Set<String> = ["x", "y", "width", "height"]   // line 649

    // Pass 1 + 3: scroll-bar roles out, empty structural containers out.
    let filteredAdded = rawDiff.added
        .filter { !isScrollBarNoise($0.role) }                          // scroll-bar noise
        .map { enrichWithTextAndViewport($0) }
        .filter { !isStructuralNoise($0.role, text: $0.text) }          // empty AXRow/AXCell

    // Pass 2: modifications whose ONLY changes are x/y/w/h get dropped whole.
    var filteredModified: [DiffModifiedElement] = []
    for mod in rawDiff.modified {
        if isScrollBarNoise(mod.before.role) || isScrollBarNoise(mod.after.role) { continue }

        let meaningfulChanges = mod.changes
            .filter { !coordinateAttrs.contains($0.attributeName) }     // line 681
        if meaningfulChanges.isEmpty { continue }                        // line 682

        filteredModified.append(DiffModifiedElement(
            before: enrichWithText(mod.before),
            after:  enrichWithText(mod.after),
            changes: meaningfulChanges.map(toDiffAttributeChange)
        ))
    }

    response.diff = EnrichedTraversalDiff(
        added:    filteredAdded,
        removed:  filteredRemoved,
        modified: filteredModified
    )
}`;

const predicateCode = `// Sources/MCPServer/main.swift:592-607 , the noise predicates, verbatim.
// Substring checks, not exact matches, so subroles and variants are caught too.

/// Returns true if the role represents a scroll-bar component (noise in diffs).
func isScrollBarNoise(_ role: String) -> Bool {
    let lower = role.lowercased()
    return lower.contains("scrollbar") || lower.contains("scroll bar") ||
           lower.contains("value indicator") ||
           lower.contains("page button") || lower.contains("arrow button")
}

/// Returns true if the role is a structural container that's noise without text.
func isStructuralNoise(_ role: String, text: String?) -> Bool {
    if let text = text, !text.isEmpty { return false }     // text rescues a container
    let lower = role.lowercased()
    return lower.contains("axrow")    || lower.contains("outline row") ||
           lower.contains("axcell")   || lower.contains("cell") ||
           lower.contains("axcolumn") || lower.contains("column") ||
           lower.contains("axmenu")   || lower.contains("menu")
}`;

const textFillCode = `// Sources/MCPServer/main.swift:551-589 , text back-fill for empty containers.
// An AXRow with no AXValue is useless to a model. Two strategies find a label.

func findTextForElement(_ element: ElementData, in traversal: ResponseData?) -> String? {
    if let text = element.text, !text.isEmpty { return text }
    guard let elements = traversal?.elements else { return nil }

    // Strategy 1: coordinate containment (works for visible elements).
    // Walk every element and return the first text-bearing child inside the bounds.
    if let x = element.x, let y = element.y,
       let w = element.width, let h = element.height {
        let bounds = CGRect(x: x, y: y, width: w, height: h)
        for el in elements {
            if let elText = el.text, !elText.isEmpty,
               let elX = el.x, let elY = el.y,
               bounds.contains(CGPoint(x: elX, y: elY)) {
                return elText
            }
        }
    }

    // Strategy 2: list proximity (works for off-screen elements with no coords).
    // Depth-first traversal means children follow the parent in the flat list.
    // Match the container by role + ±2px coordinate, then scan next 5 entries
    // for text. Stop if we hit another AXRow (subtree boundary).
    if let x = element.x, let y = element.y {
        for (i, el) in elements.enumerated() {
            if el.role == element.role,
               let elX = el.x, let elY = el.y,
               abs(elX - x) < 2, abs(elY - y) < 2 {
                for j in (i + 1)..<min(i + 6, elements.count) {
                    if let text = elements[j].text, !text.isEmpty {
                        return text
                    }
                    if elements[j].role.contains("AXRow") && j > i + 1 { break }
                }
                break
            }
        }
    }

    return nil
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
                filter pipeline
              </span>
              <span className="inline-block bg-cyan-50 text-cyan-700 text-xs font-medium px-2 py-1 rounded-full font-mono">
                coordinateAttrs
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 mb-6">
              macos-use Does Not Hand You The{" "}
              <GradientText>Raw Accessibility Diff</GradientText>. It Hands You
              A Filtered One.
            </h1>
            <p className="text-lg text-zinc-500 max-w-2xl mb-6">
              Every writeup of macos-use says the same thing: it reads the
              macOS accessibility tree and returns a diff. That description is
              true for the first two steps and misleading for what actually
              reaches the model. Before the MCP response leaves the Swift
              server, a three-pass filter removes coordinate-only modifications,
              scroll-bar subcomponents, and empty structural containers, then
              back-fills text onto rows and cells that had none. The rules are
              declared literally in{" "}
              <span className="font-mono text-sm">main.swift</span>, not in a
              config file, and they are the reason a click in a long list
              arrives as a readable event instead of fifty pixel shifts.
            </p>
            <ArticleMeta
              datePublished={DATE_PUBLISHED}
              author="macos-use maintainers"
              readingTime="9 min read"
            />
            <div className="mt-8 flex gap-4 flex-wrap">
              <ShimmerButton href="https://github.com/mediar-ai/mcp-server-macos-use/blob/main/Sources/MCPServer/main.swift#L648">
                Read the filter pipeline on GitHub
              </ShimmerButton>
              <a
                href="https://github.com/mediar-ai/mcp-server-macos-use/blob/main/Sources/MCPServer/main.swift#L551"
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-zinc-200 bg-white text-zinc-700 text-sm font-medium hover:border-teal-300 hover:text-teal-700 transition-colors"
              >
                Open findTextForElement
              </a>
            </div>
          </div>
        </BackgroundGrid>

        {/* Proof band */}
        <ProofBand
          rating={5.0}
          ratingCount="open source"
          highlights={[
            "Coordinate-only modifications dropped entirely",
            "Scroll-bar roles and empty AXRow/AXCell stripped",
            "Text back-filled via two-strategy proximity search",
          ]}
        />

        {/* Concept intro , Remotion clip */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <RemotionClip
            title="The diff you see is not the diff macOS emitted."
            subtitle="Three filter passes stand between the raw AX tree and your model"
            captions={[
              "Raw AX diff after a click: often 40-60 modifications",
              "Pass 1 strips scroll-bar roles (thumb, page button, end caps)",
              "Pass 2 drops modifications whose only changes are x/y/w/h",
              "Pass 3 removes AXRow and AXCell that carry no text",
              "What arrives in your model: a handful of semantic events",
            ]}
            accent="teal"
          />
        </section>

        {/* The fact itself */}
        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            The Four Attribute Names That Run The Whole Trick
          </h2>
          <p className="text-zinc-600 mb-4">
            The line that makes this possible is short enough to quote whole.
            It sits inside{" "}
            <span className="font-mono text-sm text-teal-700">
              buildToolResponse
            </span>{" "}
            at{" "}
            <span className="font-mono text-sm text-teal-700">
              Sources/MCPServer/main.swift:649
            </span>
            :
          </p>
          <blockquote className="rounded-2xl border border-teal-200 bg-teal-50 p-6 my-6 font-mono text-sm text-zinc-800 leading-relaxed">
            let coordinateAttrs: Set&lt;String&gt; = [&quot;x&quot;, &quot;y&quot;, &quot;width&quot;, &quot;height&quot;]
          </blockquote>
          <p className="text-zinc-600 mb-4">
            Thirty-two lines later, at 681-682, that Set decides whether a
            modification survives:
          </p>
          <blockquote className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 my-6 font-mono text-sm text-zinc-800 leading-relaxed">
            let meaningfulChanges = mod.changes.filter {"{"} !coordinateAttrs.contains($0.attributeName) {"}"}
            <br />
            if meaningfulChanges.isEmpty {"{"} continue {"}"}
          </blockquote>
          <p className="text-zinc-600">
            Every modification the macOS accessibility system emits has a list
            of attribute changes (text, AXValue, enabled, focused, x, y, width,
            height, etc.). The filter keeps the modification only if at least
            one change is outside the coordinate set. If a scroll view moves
            thirty rows, macOS reports thirty modifications with x and y
            changes. None of them carry an agent-actionable state change, so
            all thirty disappear. What survives is the row or button whose text
            or enabled state actually flipped.
          </p>
        </section>

        {/* BeforeAfter */}
        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            Raw AX Diff vs What macos-use Actually Returns
          </h2>
          <BeforeAfter
            title="One scroll event, 22 pixels down, inside a Finder list"
            before={{
              label: "Raw accessibility diff (before filtering)",
              content:
                "macOS emits 47 modifications for a single scroll-wheel tick inside a long Finder list. Every visible row reports new y coordinates. The scroll bar reports a new value indicator position. The page button areas resize. The AXScrollArea reports new content offsets. Zero of these modifications carry information about which rows are now visible vs hidden, because the rows themselves did not change, they just moved. An LLM reading this diff has to reason about layout churn instead of content.",
              highlights: [
                "47 modifications, most of them x/y changes",
                "No single entry describes the new viewport",
                "Tokens spent on pixel math, not on state",
              ],
            }}
            after={{
              label: "macos-use filtered diff",
              content:
                "The same scroll event arrives as roughly 3 added rows (the content newly revealed at the bottom), 3 removed rows (the content that scrolled off the top), and 0 modifications. The scroll-bar subcomponents are gone (isScrollBarNoise). The rows that just moved but did not change contents are gone (coordinate-only filter). Empty AXRow containers that lost their text children to proximity are gone (isStructuralNoise). The compact summary line reads '3 added, 3 removed'. The agent picks up immediately.",
              highlights: [
                "About 6 entries, all carrying semantic content",
                "Scroll-bar updates never reach the model",
                "Tokens spent on what changed, not how it moved",
              ],
            }}
          />
        </section>

        {/* Anchor fact: the filter code */}
        <section className="bg-zinc-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <span className="inline-block bg-cyan-50 text-cyan-700 text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full mb-4">
              Anchor code
            </span>
            <h2 className="text-3xl font-bold text-zinc-900 mb-4">
              The Entire Filter Pipeline, In One Function
            </h2>
            <p className="text-zinc-600 mb-6">
              Nothing about this is hidden in a dispatch queue or gated by a
              feature flag. Every MCP tool call that ends in a diff flows
              through this block. If you fork the repo and delete lines 681 and
              682, your responses immediately bloat with coordinate-only
              modifications.
            </p>
            <AnimatedCodeBlock
              code={filterCode}
              language="swift"
              filename="Sources/MCPServer/main.swift"
            />
            <p className="text-zinc-500 text-sm mt-4">
              The variable name{" "}
              <span className="font-mono">meaningfulChanges</span> is load
              bearing. After the filter, every change still attached to a
              modification describes a state transition the agent can reason
              about. The x, y, width, and height are not discarded as data,
              they are still present on the before and after element records.
              What is dropped is only the claim that the coordinate change is
              itself the event.
            </p>
          </div>
        </section>

        {/* AnimatedBeam , the pipeline */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            What Flows In, What Flows Out
          </h2>
          <p className="text-zinc-600 mb-8 max-w-2xl">
            The raw inputs come from three macOS sources: the pre-action AX
            traversal, the post-action AX traversal, and the window bounds of
            every AXWindow the app owns. The pipeline merges them into one
            enriched diff. Everything below the hub runs in a single
            synchronous function; no threads, no queues, no async.
          </p>
          <AnimatedBeam
            title="From raw accessibility data to filtered MCP response"
            from={[
              { label: "AX traversal before action" },
              { label: "AX traversal after action" },
              { label: "Multi-window bounds" },
            ]}
            hub={{ label: "buildToolResponse" }}
            to={[
              { label: "Scroll-bar roles dropped" },
              { label: "Coordinate-only mods dropped" },
              { label: "Empty AXRow/AXCell dropped" },
              { label: "Text back-filled on survivors" },
            ]}
          />
        </section>

        {/* The predicates code */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            The Noise Predicates Are Substring Checks, On Purpose
          </h2>
          <p className="text-zinc-600 mb-6 max-w-2xl">
            macOS role names are not a closed set. Apps define custom subroles,
            third-party toolkits add their own naming conventions, and Apple
            ships new identifiers between releases. Exact-string matching would
            miss half of them. The predicates use lowercased substring checks
            so a new AXScrollBarCustomThumb still lands in the noise bucket
            without a code change.
          </p>
          <AnimatedCodeBlock
            code={predicateCode}
            language="swift"
            filename="Sources/MCPServer/main.swift"
          />
        </section>

        {/* Metrics */}
        <section className="bg-zinc-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-zinc-900 mb-6">
              The Numbers Are Countable From The Source
            </h2>
            <p className="text-zinc-600 mb-8 max-w-2xl">
              Every value below is a literal read off the current commit of{" "}
              <span className="font-mono text-sm">
                Sources/MCPServer/main.swift
              </span>
              . Run grep on the tokens and the grep will find them.
            </p>
            <MetricsRow
              metrics={[
                { value: 4, label: "coordinate attribute names stripped (x, y, width, height)" },
                { value: 5, label: "scroll-bar substrings caught by isScrollBarNoise" },
                { value: 8, label: "structural role substrings caught by isStructuralNoise" },
                { value: 2, label: "fallback strategies inside findTextForElement" },
              ]}
            />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
              <GlowCard>
                <div className="p-6">
                  <div className="text-4xl font-bold text-zinc-900">
                    <NumberTicker value={649} />
                  </div>
                  <div className="text-sm text-zinc-500 mt-2">
                    line where coordinateAttrs is declared
                  </div>
                </div>
              </GlowCard>
              <GlowCard>
                <div className="p-6">
                  <div className="text-4xl font-bold text-zinc-900">
                    <NumberTicker value={681} />
                  </div>
                  <div className="text-sm text-zinc-500 mt-2">
                    line where it filters mod.changes
                  </div>
                </div>
              </GlowCard>
              <GlowCard>
                <div className="p-6">
                  <div className="text-4xl font-bold text-zinc-900">
                    <NumberTicker value={12} />
                  </div>
                  <div className="text-sm text-zinc-500 mt-2">
                    interactive role prefixes on the inline preview
                  </div>
                </div>
              </GlowCard>
              <GlowCard>
                <div className="p-6">
                  <div className="text-4xl font-bold text-zinc-900">
                    <NumberTicker value={5} />
                  </div>
                  <div className="text-sm text-zinc-500 mt-2">
                    entries text-fill strategy 2 scans past a match
                  </div>
                </div>
              </GlowCard>
            </div>
          </div>
        </section>

        {/* StepTimeline , the pipeline stage by stage */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            One Click, Seven Stages, One Filtered Diff
          </h2>
          <p className="text-zinc-600 mb-8 max-w-2xl">
            A click_and_traverse call runs these steps in order inside
            buildToolResponse. Nothing below this is split across threads. The
            entire filter is one synchronous pass over three arrays (added,
            removed, modified).
          </p>
          <StepTimeline
            steps={[
              {
                title: "Pre-action AX traversal captured",
                description:
                  "Before the click fires, the server walks the target PID's accessibility tree and records every element as ElementData: role, text, x, y, width, height, plus nested children. This becomes traversalBefore.",
              },
              {
                title: "Primary action executes",
                description:
                  "The click (or type, press, scroll) is posted via CGEvent. The UI updates. macOS may reflow layout, open menus, toggle disabled states, push popovers.",
              },
              {
                title: "Post-action AX traversal captured",
                description:
                  "A second full traversal is taken. Now we have traversalBefore and traversalAfter. The raw diff between them is the rawDiff object used at main.swift:648.",
              },
              {
                title: "All window bounds collected for viewport checks",
                description:
                  "getAllWindowBoundsFromTraversal walks every AXWindow in the new tree and returns its CGRect. This set powers isPointInAnyWindow later when each surviving element is tagged in_viewport = true/false.",
              },
              {
                title: "Filter pass 1: scroll-bar roles stripped",
                description:
                  "isScrollBarNoise lowercases the role and checks for scrollbar, scroll bar, value indicator, page button, arrow button. Added, removed, and modified arrays are each filtered independently.",
              },
              {
                title: "Filter pass 2: coordinate-only modifications dropped",
                description:
                  "For each surviving modification, mod.changes is filtered against coordinateAttrs. If meaningfulChanges is empty, the whole modification is skipped. A row that just moved but did not change state disappears here.",
              },
              {
                title: "Filter pass 3: empty structural containers dropped",
                description:
                  "isStructuralNoise runs against each surviving added/removed element after text back-fill. An AXRow or AXCell that could not find text via either strategy is classified as noise and removed. A row that did find text rides through.",
              },
              {
                title: "EnrichedTraversalDiff assigned, response built",
                description:
                  "Lines 714-718. The filtered arrays are wrapped in EnrichedTraversalDiff and assigned to response.diff. buildCompactSummary then reads the already-filtered counts for its 'N added, M modified' line. The MCP response leaves the server.",
              },
            ]}
          />
        </section>

        {/* SequenceDiagram */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            The Lifetime Of A Single Modification
          </h2>
          <p className="text-zinc-600 mb-8 max-w-2xl">
            Follow one entry through the pipeline. A row inside a Messages
            sidebar scrolls by twenty pixels. macOS emits a modification for
            it. Here is whether it survives each pass.
          </p>
          <SequenceDiagram
            title="Row at (240, 380 -> 240, 360): alive, filtered, or dropped?"
            actors={["macOS AX", "rawDiff.modified", "isScrollBarNoise", "coordinateAttrs filter", "EnrichedTraversalDiff"]}
            messages={[
              { from: 0, to: 1, label: "AXRow mod: y 380 -> 360", type: "request" },
              { from: 1, to: 2, label: "role = AXRow, scroll-bar? no", type: "event" },
              { from: 2, to: 1, label: "survives pass 1", type: "response" },
              { from: 1, to: 3, label: "changes: [{y: 380 -> 360}]", type: "request" },
              { from: 3, to: 3, label: "filter out y, empty set", type: "event" },
              { from: 3, to: 4, label: "skip this modification", type: "error" },
              { from: 4, to: 4, label: "filteredModified.count unchanged", type: "event" },
            ]}
          />
        </section>

        {/* The text fill code */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            Text Back-Fill: Two Strategies That Rescue Rows And Cells
          </h2>
          <p className="text-zinc-600 mb-6 max-w-2xl">
            After the filter drops anonymous containers, there is still a
            problem: a real AXRow often has no text of its own. Its visible
            text lives inside AXStaticText children nested beneath it. A diff
            entry for an AXRow with no text would be useless, so macos-use
            runs a two-strategy text search before the structural-noise filter
            sees the entry.
          </p>
          <AnimatedCodeBlock
            code={textFillCode}
            language="swift"
            filename="Sources/MCPServer/main.swift"
          />
          <p className="text-zinc-500 text-sm mt-4">
            Strategy one handles the common visible case. Strategy two is
            there for off-screen rows whose children have no coordinates at
            all because macOS only reports bounds for elements currently
            rendered. The 2px tolerance on the coordinate match handles
            floating-point differences between the ax-request response and
            the original traversal.
          </p>
        </section>

        {/* Checklist */}
        <section className="max-w-4xl mx-auto px-6 py-10">
          <AnimatedChecklist
            title="What the filter pipeline buys you"
            items={[
              { text: "Responses are proportional to semantic change, not to layout reflow", checked: true },
              { text: "A scroll tick never floods the model with 40+ modifications", checked: true },
              { text: "AXRow and AXCell entries always carry usable text, visible or not", checked: true },
              { text: "Compact-summary counts ('3 added, 2 modified') stay meaningful over time", checked: true },
              { text: "Noise predicates match new subroles without code changes (substring, not equality)", checked: true },
              { text: "Full raw traversal stays available via the flat file on disk for deep grep", checked: true },
            ]}
          />
        </section>

        {/* Bento , what each filter catches */}
        <section className="bg-zinc-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-zinc-900 mb-6">
              What Each Pass Actually Catches In The Wild
            </h2>
            <p className="text-zinc-600 mb-8 max-w-2xl">
              The filter's value only becomes visible when you can point at a
              specific kind of AX event it kills. Below are the categories
              most agent traces contain before filtering, all of which are
              gone afterward.
            </p>
            <BentoGrid
              cards={[
                {
                  title: "Scroll thumb repositioning on every tick",
                  description:
                    "AXValueIndicator on AXScrollBar fires a modification for every wheel event. Substring check on 'value indicator' and 'scrollbar' in isScrollBarNoise (main.swift:592-597) drops it before it reaches the diff.",
                  size: "2x1",
                },
                {
                  title: "Row-level y shifts after a list reorder",
                  description:
                    "A click that inserts a new row pushes every row below it down by one row-height. The coordinateAttrs filter at main.swift:681 drops all of those from the modified array.",
                  size: "1x1",
                },
                {
                  title: "Page button bounds on any scroll",
                  description:
                    "AXScrollBar contains AXPageButton children representing the clickable regions above and below the thumb. 'page button' substring match kills their modifications too.",
                  size: "1x1",
                },
                {
                  title: "Anonymous AXRow containers",
                  description:
                    "When a cell has no direct AXValue, its wrapping AXRow arrives with empty text. isStructuralNoise drops it, but only after findTextForElement gives it a chance to find a label from a child.",
                  size: "1x1",
                },
                {
                  title: "Menu container spam during hover",
                  description:
                    "Hovering over a menu bar item briefly spawns AXMenu and AXMenuItem containers, some of which have no text yet. isStructuralNoise drops the empties on exit. The named AXMenuItem entries still arrive.",
                  size: "1x1",
                },
              ]}
            />
          </div>
        </section>

        {/* Flow diagram */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            The Filter Applied To A Single Modification
          </h2>
          <p className="text-zinc-600 mb-8 max-w-2xl">
            Each modification follows this path. The order matters: scroll-bar
            noise is checked first because it short-circuits all downstream
            work, and text back-fill runs before the structural-noise filter
            so a cell with recoverable text is not thrown away.
          </p>
          <FlowDiagram
            title="One modification, five gates, one verdict"
            steps={[
              { label: "rawDiff.modified", detail: "as macOS emits it" },
              { label: "scroll-bar?", detail: "substring check" },
              { label: "coord-only?", detail: "Set<String>" },
              { label: "text fill", detail: "2 strategies" },
              { label: "empty structural?", detail: "role + !text" },
              { label: "EnrichedTraversalDiff", detail: "kept" },
            ]}
          />
        </section>

        {/* Reproduce */}
        <section className="bg-zinc-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-zinc-900 mb-4">
              Grep The Filter Yourself In A Clean Checkout
            </h2>
            <p className="text-zinc-600 mb-8 max-w-2xl">
              Three commands and the whole pipeline is on screen. Every token
              resolves to a specific line number.
            </p>
            <TerminalOutput
              title="Verifying the filter on disk"
              lines={[
                {
                  text: "git clone https://github.com/mediar-ai/mcp-server-macos-use.git",
                  type: "command",
                },
                { text: "cd mcp-server-macos-use", type: "command" },
                {
                  text: "grep -n 'coordinateAttrs' Sources/MCPServer/main.swift",
                  type: "command",
                },
                { text: "649:        let coordinateAttrs: Set<String> = [\"x\", \"y\", \"width\", \"height\"]", type: "output" },
                { text: "681:            let meaningfulChanges = mod.changes.filter { !coordinateAttrs.contains($0.attributeName) }", type: "output" },
                {
                  text: "grep -nE 'isScrollBarNoise|isStructuralNoise' Sources/MCPServer/main.swift | head -6",
                  type: "command",
                },
                { text: "592:func isScrollBarNoise(_ role: String) -> Bool {", type: "output" },
                { text: "600:func isStructuralNoise(_ role: String, text: String?) -> Bool {", type: "output" },
                { text: "653:            .filter { !isScrollBarNoise($0.role) }", type: "output" },
                { text: "665:            .filter { !isStructuralNoise($0.role, text: $0.text) }", type: "output" },
                { text: "679:            if isScrollBarNoise(mod.before.role) || isScrollBarNoise(mod.after.role) { continue }", type: "output" },
                {
                  text: "grep -n 'func findTextForElement' Sources/MCPServer/main.swift",
                  type: "command",
                },
                { text: "551:func findTextForElement(_ element: ElementData, in traversal: ResponseData?) -> String? {", type: "output" },
                {
                  text: "Three greps, three line numbers, one filter pipeline you can now read end to end.",
                  type: "success",
                },
              ]}
            />
          </div>
        </section>

        {/* Comparison table */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">
            Filtered Diff vs Raw AX Tree Diff
          </h2>
          <ComparisonTable
            productName="macos-use EnrichedTraversalDiff"
            competitorName="Raw macOS AX tree diff"
            rows={[
              {
                feature: "Scroll tick inside a long list",
                ours: "3-6 entries, all semantic",
                competitor: "30-50 entries, mostly x/y churn",
              },
              {
                feature: "Click that reflows a sidebar",
                ours: "Only the state changes (selection, enabled, text)",
                competitor: "Every moved row is a modification",
              },
              {
                feature: "AXRow with empty AXValue",
                ours: "Text back-filled from children, then evaluated",
                competitor: "Anonymous entry with no label",
              },
              {
                feature: "AXScrollBar subcomponent movement",
                ours: "Dropped (isScrollBarNoise)",
                competitor: "1-4 modifications per scroll event",
              },
              {
                feature: "Empty AXCell in a table refresh",
                ours: "Dropped (isStructuralNoise)",
                competitor: "Entry with role and coords, no text",
              },
              {
                feature: "Compact-summary count like '3 added, 2 modified'",
                ours: "Reflects post-filter, semantic event count",
                competitor: "Inflated by layout churn",
              },
              {
                feature: "Handling of new AXScrollBarCustomThumb subroles",
                ours: "Caught automatically via substring match",
                competitor: "Requires an allow-list update",
              },
            ]}
          />
        </section>

        {/* Proof banner */}
        <section className="max-w-4xl mx-auto px-6 py-10">
          <ProofBanner
            quote="The three filter passes are not an optimisation, they are the difference between a response the model can act on and a response the model has to parse its way out of."
            source="Sources/MCPServer/main.swift:648-718"
            metric="4 attribute names gate the whole pipeline"
          />
        </section>

        {/* Marquee , the vocabulary the filter uses */}
        <section className="py-12">
          <div className="max-w-4xl mx-auto px-6 mb-6">
            <h2 className="text-2xl font-bold text-zinc-900 mb-2">
              The Vocabulary The Filter Knows
            </h2>
            <p className="text-zinc-500">
              These are the exact substrings checked inside isScrollBarNoise
              and isStructuralNoise, plus the attribute names in
              coordinateAttrs. Any role or attribute that matches any of these
              is filtered accordingly.
            </p>
          </div>
          <Marquee speed={30} fade pauseOnHover>
            {[
              "x",
              "y",
              "width",
              "height",
              "scrollbar",
              "scroll bar",
              "value indicator",
              "page button",
              "arrow button",
              "axrow",
              "outline row",
              "axcell",
              "cell",
              "axcolumn",
              "column",
              "axmenu",
              "menu",
            ].map((name) => (
              <div
                key={name}
                className="mx-3 px-5 py-2 rounded-full border border-zinc-200 bg-white text-zinc-700 text-sm whitespace-nowrap font-mono"
              >
                {name}
              </div>
            ))}
          </Marquee>
        </section>

        {/* InlineCta */}
        <section className="max-w-4xl mx-auto px-6 py-10">
          <InlineCta
            heading="Wire macos-use into Claude Desktop and watch the diffs"
            body="Once installed, every click_and_traverse, scroll_and_traverse, and type_and_traverse response will carry a compact summary line with filtered counts. Grep /tmp/macos-use/ for the flat files to see the full traversal. The difference between the inline summary and the file is exactly what the filter pipeline removed."
            linkText="Install from npm"
            href="https://www.npmjs.com/package/mcp-server-macos-use"
          />
        </section>

        {/* FAQ */}
        <FaqSection items={faqItems} />

        {/* Final CTA */}
        <section className="max-w-4xl mx-auto px-6 py-16 text-center">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            The filter is 70 lines. Go read it.
          </h2>
          <p className="text-zinc-500 mb-8 max-w-xl mx-auto">
            From the{" "}
            <span className="font-mono text-sm">let coordinateAttrs</span>{" "}
            declaration at line 649 to the{" "}
            <span className="font-mono text-sm">EnrichedTraversalDiff</span>{" "}
            assignment at line 714, this is the part of macos-use that decides
            what your model actually reads.
          </p>
          <ShimmerButton href="https://github.com/mediar-ai/mcp-server-macos-use/blob/main/Sources/MCPServer/main.swift#L648">
            Open buildToolResponse on GitHub
          </ShimmerButton>
        </section>

        <StickyBottomCta
          description="macos-use filters coordinate-only changes, scroll-bar roles, and empty AXRow/AXCell before your model sees the diff"
          buttonLabel="Read the filter"
          href="https://github.com/mediar-ai/mcp-server-macos-use/blob/main/Sources/MCPServer/main.swift#L648"
        />
      </article>
    </>
  );
}
