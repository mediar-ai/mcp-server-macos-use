import MCP
import Foundation
import CoreGraphics // Still needed for CGPoint, CGEventFlags
import ApplicationServices // For AXUIElement APIs (scroll-into-view, window bounds)
import AppKit // For NSEvent.mouseLocation (cursor position save/restore)
import MacosUseSDK // <-- Import the SDK

// --- Helper to serialize Swift structs to JSON String ---
func serializeToJsonString<T: Encodable>(_ value: T) -> String? {
    let encoder = JSONEncoder()
    // Use pretty printing for easier debugging of the output if needed
    encoder.outputFormatting = [.sortedKeys, .withoutEscapingSlashes]
    do {
        let jsonData = try encoder.encode(value)
        return String(data: jsonData, encoding: .utf8)
    } catch {
        fputs("error: serializeToJsonString: failed to encode value to JSON: \(error)\n", stderr)
        return nil
    }
}

// --- Function to get arguments from MCP Value ---
// Helper to extract typed values safely
func getRequiredString(from args: [String: Value]?, key: String) throws -> String {
    guard let val = args?[key]?.stringValue else {
        throw MCPError.invalidParams("Missing or invalid required string argument: '\(key)'")
    }
    return val
}

func getRequiredDouble(from args: [String: Value]?, key: String) throws -> Double {
    guard let value = args?[key] else {
        throw MCPError.invalidParams("Missing required number argument: '\(key)'")
    }
    switch value {
    case .int(let intValue):
        fputs("log: getRequiredDouble: converting int \(intValue) to double for key '\(key)'\n", stderr)
        return Double(intValue)
    case .double(let doubleValue):
        return doubleValue
    default:
        throw MCPError.invalidParams("Invalid type for required number argument: '\(key)', expected Int or Double, got \(value)")
    }
}

func getRequiredInt(from args: [String: Value]?, key: String) throws -> Int {
    guard let value = args?[key] else {
        throw MCPError.invalidParams("Missing required integer argument: '\(key)'")
    }
    // Allow conversion from Double if it's an exact integer
    if let doubleValue = value.doubleValue {
        if let intValue = Int(exactly: doubleValue) {
             fputs("log: getRequiredInt: converting exact double \(doubleValue) to int for key '\(key)'\n", stderr)
             return intValue
        } else {
            fputs("warning: getRequiredInt: received non-exact double \(doubleValue) for key '\(key)', expecting integer.\n", stderr)
            throw MCPError.invalidParams("Invalid type for required integer argument: '\(key)', received non-exact Double \(doubleValue)")
        }
    }
    // Otherwise, require it to be an Int directly
    guard let intValue = value.intValue else {
        throw MCPError.invalidParams("Invalid type for required integer argument: '\(key)', expected Int or exact Double, got \(value)")
    }
    return intValue
}


// --- Get Optional arguments ---
// Helper for optional values
func getOptionalDouble(from args: [String: Value]?, key: String) throws -> Double? {
    guard let value = args?[key] else { return nil } // Key not present is valid for optional
    if value.isNull { return nil } // Explicit null is also valid
    switch value {
    case .int(let intValue):
        fputs("log: getOptionalDouble: converting int \(intValue) to double for key '\(key)'\n", stderr)
        return Double(intValue)
    case .double(let doubleValue):
        return doubleValue
    default:
        throw MCPError.invalidParams("Invalid type for optional number argument: '\(key)', expected Int or Double, got \(value)")
    }
}

func getOptionalInt(from args: [String: Value]?, key: String) throws -> Int? {
    guard let value = args?[key] else { return nil } // Key not present is valid for optional
    if value.isNull { return nil } // Explicit null is also valid

    if let doubleValue = value.doubleValue {
        if let intValue = Int(exactly: doubleValue) {
             fputs("log: getOptionalInt: converting exact double \(doubleValue) to int for key '\(key)'\n", stderr)
             return intValue
        } else {
            fputs("warning: getOptionalInt: received non-exact double \(doubleValue) for key '\(key)', expecting integer.\n", stderr)
            throw MCPError.invalidParams("Invalid type for optional integer argument: '\(key)', received non-exact Double \(doubleValue)")
        }
    }
    guard let intValue = value.intValue else {
        throw MCPError.invalidParams("Invalid type for optional integer argument: '\(key)', expected Int or exact Double, got \(value)")
    }
    return intValue
}

func getOptionalBool(from args: [String: Value]?, key: String) throws -> Bool? {
     guard let value = args?[key] else { return nil } // Key not present
     if value.isNull { return nil } // Explicit null
     guard let boolValue = value.boolValue else {
         throw MCPError.invalidParams("Invalid type for optional boolean argument: '\(key)', expected Bool, got \(value)")
     }
     return boolValue
}

// --- NEW Helper to parse modifier flags ---
func parseFlags(from value: Value?) throws -> CGEventFlags {
    guard let arrayValue = value?.arrayValue else {
        // No flags provided or not an array, return empty flags
        return []
    }

    var flags: CGEventFlags = []
    for flagValue in arrayValue {
        guard let flagString = flagValue.stringValue else {
            throw MCPError.invalidParams("Invalid modifierFlags array: contains non-string element \(flagValue)")
        }
        switch flagString.lowercased() {
            // Standard modifiers
            case "capslock", "caps": flags.insert(.maskAlphaShift)
            case "shift": flags.insert(.maskShift)
            case "control", "ctrl": flags.insert(.maskControl)
            case "option", "opt", "alt": flags.insert(.maskAlternate)
            case "command", "cmd": flags.insert(.maskCommand)
            // Other potentially useful flags
            case "help": flags.insert(.maskHelp)
            case "function", "fn": flags.insert(.maskSecondaryFn)
            case "numericpad", "numpad": flags.insert(.maskNumericPad)
            // Non-keyed state (less common for press simulation)
            // case "noncoalesced": flags.insert(.maskNonCoalesced)
            default:
                fputs("warning: parseFlags: unknown modifier flag string '\(flagString)', ignoring.\n", stderr)
                // Optionally throw an error:
                // throw MCPError.invalidParams("Unknown modifier flag: '\(flagString)'")
        }
    }
    return flags
}

// --- Enriched Data Structures (adds in_viewport metadata) ---

struct EnrichedElementData: Codable {
    var role: String
    var text: String?
    var x: Double?
    var y: Double?
    var width: Double?
    var height: Double?
    var in_viewport: Bool?
}

struct EnrichedResponseData: Codable {
    let app_name: String
    var elements: [EnrichedElementData]
    var stats: Statistics
    let processing_time_seconds: String
}

/// Diff element: role, text, viewport status, and coordinates for spatial targeting
struct DiffElementData: Codable {
    var role: String
    var text: String?
    var in_viewport: Bool?
    var x: Double?
    var y: Double?
    var width: Double?
    var height: Double?
}

struct DiffAttributeChange: Codable {
    let attributeName: String
    let addedText: String?
    let removedText: String?
    let oldValue: String?
    let newValue: String?
}

struct DiffModifiedElement: Codable {
    let before: DiffElementData
    let after: DiffElementData
    let changes: [DiffAttributeChange]
}

struct EnrichedTraversalDiff: Codable {
    let added: [DiffElementData]
    let removed: [DiffElementData]
    let modified: [DiffModifiedElement]
}

/// Simplified response: returns either a full traversal (open/refresh) or a diff (click/type/press)
struct ToolResponse: Codable {
    var openResult: AppOpenerResult?
    var traversalPid: pid_t?
    var traversal: EnrichedResponseData?      // for open/refresh: full current state
    var diff: EnrichedTraversalDiff?           // for click/type/press: what changed
    var primaryActionError: String?
    var traversalError: String?
}

// --- Viewport Detection Helpers ---

/// Extract window bounds from traversal data by finding the AXWindow element
func getWindowBoundsFromTraversal(_ responseData: ResponseData?) -> CGRect? {
    guard let response = responseData else { return nil }
    for element in response.elements {
        if element.role == "AXWindow",
           let x = element.x, let y = element.y,
           let w = element.width, let h = element.height {
            return CGRect(x: x, y: y, width: w, height: h)
        }
    }
    return nil
}

/// Find the window (element + frame) whose frame contains the given point.
/// Searches all AXWindows of the app; falls back to AXMainWindow if none matches.
func getWindowContainingPoint(appElement: AXUIElement, point: CGPoint) -> (element: AXUIElement, bounds: CGRect)? {
    var windowsRef: CFTypeRef?
    if AXUIElementCopyAttributeValue(appElement, "AXWindows" as CFString, &windowsRef) == .success,
       let windows = windowsRef as? [AXUIElement] {
        for window in windows {
            guard let frame = getAXElementFrame(window) else { continue }
            if frame.contains(point) {
                fputs("log: getWindowContainingPoint: matched window \(frame) for point \(point)\n", stderr)
                return (window, frame)
            }
        }
    }
    // Fallback to main window
    var winRef: CFTypeRef?
    guard AXUIElementCopyAttributeValue(appElement, "AXMainWindow" as CFString, &winRef) == .success else { return nil }
    let win = winRef as! AXUIElement
    guard let frame = getAXElementFrame(win) else { return nil }
    fputs("log: getWindowContainingPoint: no window contains \(point), falling back to main window \(frame)\n", stderr)
    return (win, frame)
}

/// Get window bounds directly from the accessibility API
func getWindowBoundsFromAPI(pid: pid_t) -> CGRect? {
    let appElement = AXUIElementCreateApplication(pid)

    var windowValue: CFTypeRef?
    guard AXUIElementCopyAttributeValue(appElement, "AXMainWindow" as CFString, &windowValue) == .success else {
        fputs("warning: getWindowBoundsFromAPI: could not get main window for pid \(pid)\n", stderr)
        return nil
    }
    let windowElement = windowValue as! AXUIElement

    var positionValue: CFTypeRef?
    guard AXUIElementCopyAttributeValue(windowElement, "AXPosition" as CFString, &positionValue) == .success else {
        fputs("warning: getWindowBoundsFromAPI: could not get window position\n", stderr)
        return nil
    }
    var position = CGPoint.zero
    AXValueGetValue(positionValue as! AXValue, .cgPoint, &position)

    var sizeValue: CFTypeRef?
    guard AXUIElementCopyAttributeValue(windowElement, "AXSize" as CFString, &sizeValue) == .success else {
        fputs("warning: getWindowBoundsFromAPI: could not get window size\n", stderr)
        return nil
    }
    var size = CGSize.zero
    AXValueGetValue(sizeValue as! AXValue, .cgSize, &size)

    return CGRect(origin: position, size: size)
}

/// Enrich a ResponseData with in_viewport metadata for each element
func enrichResponseData(_ response: ResponseData, windowBounds: CGRect?) -> EnrichedResponseData {
    let enrichedElements = response.elements.map { element -> EnrichedElementData in
        let inViewport: Bool?
        if let x = element.x, let y = element.y, let bounds = windowBounds {
            inViewport = bounds.contains(CGPoint(x: x, y: y))
        } else {
            inViewport = nil
        }
        return EnrichedElementData(
            role: element.role, text: element.text,
            x: element.x, y: element.y,
            width: element.width, height: element.height,
            in_viewport: inViewport
        )
    }
    return EnrichedResponseData(
        app_name: response.app_name,
        elements: enrichedElements,
        stats: response.stats,
        processing_time_seconds: response.processing_time_seconds
    )
}

/// Look up text for a container element (AXRow, AXCell) by:
/// 1. Coordinate containment — find a text-bearing child within the element's bounds
/// 2. List proximity — the traversal is depth-first, so children follow the parent;
///    find the element in the flat list and check the next few entries for text.
///    This handles off-screen elements whose children have no coordinates.
func findTextForElement(_ element: ElementData, in traversal: ResponseData?) -> String? {
    if let text = element.text, !text.isEmpty { return text }
    guard let elements = traversal?.elements else { return nil }

    // Strategy 1: coordinate containment (works for visible elements)
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

    // Strategy 2: list proximity (works for off-screen elements)
    // Use approximate coordinate matching (±2px) to handle floating-point differences
    if let x = element.x, let y = element.y {
        for (i, el) in elements.enumerated() {
            if el.role == element.role,
               let elX = el.x, let elY = el.y,
               abs(elX - x) < 2, abs(elY - y) < 2 {
                // Found the element — look at next few entries for text
                for j in (i + 1)..<min(i + 6, elements.count) {
                    if let text = elements[j].text, !text.isEmpty {
                        return text
                    }
                    // Stop if we hit another row (left the subtree)
                    if elements[j].role.contains("AXRow") && j > i + 1 { break }
                }
                break
            }
        }
    }

    return nil
}

/// Returns true if the role represents a scroll-bar component (noise in diffs).
func isScrollBarNoise(_ role: String) -> Bool {
    let lower = role.lowercased()
    return lower.contains("scrollbar") || lower.contains("scroll bar") ||
           lower.contains("value indicator") ||
           lower.contains("page button") || lower.contains("arrow button")
}

/// Returns true if the role is a structural container that's noise without text.
func isStructuralNoise(_ role: String, text: String?) -> Bool {
    if let text = text, !text.isEmpty { return false }
    let lower = role.lowercased()
    return lower.contains("axrow") || lower.contains("outline row") ||
           lower.contains("axcell") || lower.contains("cell") ||
           lower.contains("axcolumn") || lower.contains("column") ||
           lower.contains("axmenu") || lower.contains("menu")
}

/// Build a ToolResponse from an ActionResult.
/// For actions with diff: returns only the diff (enriched with in_viewport on added elements).
/// For open/refresh: returns the full traversal (enriched with in_viewport).
func buildToolResponse(_ result: ActionResult, hasDiff: Bool) -> ToolResponse {
    var windowBounds = getWindowBoundsFromTraversal(result.traversalAfter)
        ?? getWindowBoundsFromTraversal(result.traversalBefore)
    if windowBounds == nil {
        if let pid = result.traversalPid ?? result.openResult?.pid {
            windowBounds = getWindowBoundsFromAPI(pid: pid)
        }
    }

    var response = ToolResponse()
    response.openResult = result.openResult
    response.traversalPid = result.traversalPid
    response.primaryActionError = result.primaryActionError
    response.traversalError = result.traversalAfterError ?? result.traversalBeforeError

    if hasDiff, let rawDiff = result.traversalDiff {
        let coordinateAttrs: Set<String> = ["x", "y", "width", "height"]

        // Filter noise, strip coordinates, add in_viewport, resolve text
        let filteredAdded = rawDiff.added
            .filter { !isScrollBarNoise($0.role) }
            .map { element -> DiffElementData in
                let inViewport: Bool?
                if let x = element.x, let y = element.y, let bounds = windowBounds {
                    inViewport = bounds.contains(CGPoint(x: x, y: y))
                } else {
                    inViewport = nil
                }
                let text = findTextForElement(element, in: result.traversalAfter)
                return DiffElementData(role: element.role, text: text, in_viewport: inViewport,
                    x: element.x, y: element.y, width: element.width, height: element.height)
            }
            .filter { !isStructuralNoise($0.role, text: $0.text) }

        let filteredRemoved = rawDiff.removed
            .filter { !isScrollBarNoise($0.role) }
            .map { element -> DiffElementData in
                let text = findTextForElement(element, in: result.traversalBefore)
                return DiffElementData(role: element.role, text: text, in_viewport: nil,
                    x: element.x, y: element.y, width: element.width, height: element.height)
            }
            .filter { !isStructuralNoise($0.role, text: $0.text) }

        // Filter modified: skip scroll-bar noise, drop coordinate-only changes
        var filteredModified: [DiffModifiedElement] = []
        for mod in rawDiff.modified {
            if isScrollBarNoise(mod.before.role) || isScrollBarNoise(mod.after.role) { continue }

            let meaningfulChanges = mod.changes.filter { !coordinateAttrs.contains($0.attributeName) }
            if meaningfulChanges.isEmpty { continue }

            let diffChanges = meaningfulChanges.map {
                DiffAttributeChange(
                    attributeName: $0.attributeName,
                    addedText: $0.addedText,
                    removedText: $0.removedText,
                    oldValue: $0.oldValue,
                    newValue: $0.newValue
                )
            }

            let beforeVP: Bool?
            if let x = mod.before.x, let y = mod.before.y, let bounds = windowBounds {
                beforeVP = bounds.contains(CGPoint(x: x, y: y))
            } else { beforeVP = nil }

            let afterVP: Bool?
            if let x = mod.after.x, let y = mod.after.y, let bounds = windowBounds {
                afterVP = bounds.contains(CGPoint(x: x, y: y))
            } else { afterVP = nil }

            let beforeText = findTextForElement(mod.before, in: result.traversalBefore)
            let afterText = findTextForElement(mod.after, in: result.traversalAfter)

            filteredModified.append(DiffModifiedElement(
                before: DiffElementData(role: mod.before.role, text: beforeText, in_viewport: beforeVP),
                after: DiffElementData(role: mod.after.role, text: afterText, in_viewport: afterVP),
                changes: diffChanges
            ))
        }

        response.diff = EnrichedTraversalDiff(
            added: filteredAdded,
            removed: filteredRemoved,
            modified: filteredModified
        )
    } else if let after = result.traversalAfter {
        // Full traversal for open/refresh
        response.traversal = enrichResponseData(after, windowBounds: windowBounds)
    }

    return response
}

// --- Compact Summary Builder (file-based MCP responses) ---

/// Build a concise text summary for the MCP response instead of returning the full JSON.
/// The full JSON is written to a file; this summary contains just the key info + file path.
func buildCompactSummary(toolName: String, params: CallTool.Parameters, toolResponse: ToolResponse, filepath: String) -> String {
    var lines: [String] = []

    // Status line
    let status = (toolResponse.primaryActionError != nil || toolResponse.traversalError != nil) ? "error" : "success"
    lines.append("status: \(status)")

    // PID and app
    if let pid = toolResponse.traversalPid {
        lines.append("pid: \(pid)")
    }
    if let appName = toolResponse.traversal?.app_name ?? toolResponse.openResult?.appName {
        lines.append("app: \(appName)")
    }

    // File path
    lines.append("file: \(filepath)")

    // Errors if any
    if let err = toolResponse.primaryActionError {
        lines.append("error: \(err)")
    }
    if let err = toolResponse.traversalError {
        lines.append("traversal_error: \(err)")
    }

    // Tool-specific summary line
    let summaryLine: String
    switch toolName {
    case "macos-use_open_application_and_traverse":
        let identifier = params.arguments?["identifier"]?.stringValue ?? "unknown"
        if let traversal = toolResponse.traversal {
            let total = traversal.elements.count
            let visible = traversal.elements.filter { $0.in_viewport == true }.count
            summaryLine = "Opened \(identifier) (PID:\(toolResponse.traversalPid ?? 0)). \(total) elements, \(visible) visible."
        } else {
            summaryLine = "Opened \(identifier) (PID:\(toolResponse.traversalPid ?? 0))."
        }

    case "macos-use_click_and_traverse":
        let x = params.arguments?["x"]?.doubleValue ?? params.arguments?["x"]?.intValue.map(Double.init) ?? 0
        let y = params.arguments?["y"]?.doubleValue ?? params.arguments?["y"]?.intValue.map(Double.init) ?? 0
        let diffSummary = buildDiffSummary(toolResponse.diff)
        summaryLine = "Clicked at (\(Int(x)),\(Int(y))). \(diffSummary)"

    case "macos-use_type_and_traverse":
        let text = params.arguments?["text"]?.stringValue ?? ""
        let truncatedText = text.count > 40 ? String(text.prefix(40)) + "..." : text
        let diffSummary = buildDiffSummary(toolResponse.diff)
        summaryLine = "Typed '\(truncatedText)'. \(diffSummary)"

    case "macos-use_press_key_and_traverse":
        let keyName = params.arguments?["keyName"]?.stringValue ?? "unknown"
        let mods = params.arguments?["modifierFlags"]?.arrayValue?.compactMap { $0.stringValue }.joined(separator: "+")
        let keyDesc = (mods != nil && !mods!.isEmpty) ? "\(mods!)+\(keyName)" : keyName
        let diffSummary = buildDiffSummary(toolResponse.diff)
        summaryLine = "Pressed \(keyDesc). \(diffSummary)"

    case "macos-use_scroll_and_traverse":
        let x = params.arguments?["x"]?.doubleValue ?? params.arguments?["x"]?.intValue.map(Double.init) ?? 0
        let y = params.arguments?["y"]?.doubleValue ?? params.arguments?["y"]?.intValue.map(Double.init) ?? 0
        let deltaY = params.arguments?["deltaY"]?.intValue ?? 0
        let diffSummary = buildDiffSummary(toolResponse.diff)
        summaryLine = "Scrolled deltaY=\(deltaY) at (\(Int(x)),\(Int(y))). \(diffSummary)"

    case "macos-use_refresh_traversal":
        if let traversal = toolResponse.traversal {
            let total = traversal.elements.count
            let visible = traversal.elements.filter { $0.in_viewport == true }.count
            summaryLine = "Refreshed PID \(toolResponse.traversalPid ?? 0) (\(traversal.app_name)). \(total) elements, \(visible) visible."
        } else {
            summaryLine = "Refreshed PID \(toolResponse.traversalPid ?? 0)."
        }

    default:
        summaryLine = "Tool \(toolName) completed."
    }

    lines.append("summary: \(summaryLine)")

    // Append notable text changes from diff (up to 3, truncated)
    if let diff = toolResponse.diff {
        var textChanges: [String] = []

        for mod in diff.modified.prefix(5) {
            for change in mod.changes {
                if change.attributeName == "text" || change.attributeName == "AXValue" {
                    let oldVal = truncate(change.oldValue ?? change.removedText ?? "", maxLen: 60)
                    let newVal = truncate(change.newValue ?? change.addedText ?? "", maxLen: 60)
                    if !oldVal.isEmpty || !newVal.isEmpty {
                        textChanges.append("  '\(oldVal)' -> '\(newVal)'")
                    }
                }
            }
            if textChanges.count >= 3 { break }
        }

        if !textChanges.isEmpty {
            lines.append("text_changes:")
            lines.append(contentsOf: textChanges.prefix(3))
        }
    }

    return lines.joined(separator: "\n")
}

/// Build a short diff summary string like "3 added, 2 removed, 1 modified."
func buildDiffSummary(_ diff: EnrichedTraversalDiff?) -> String {
    guard let diff = diff else { return "No diff." }
    var parts: [String] = []
    if !diff.added.isEmpty { parts.append("\(diff.added.count) added") }
    if !diff.removed.isEmpty { parts.append("\(diff.removed.count) removed") }
    if !diff.modified.isEmpty { parts.append("\(diff.modified.count) modified") }
    return parts.isEmpty ? "No changes." : parts.joined(separator: ", ") + "."
}

/// Truncate a string to maxLen characters
func truncate(_ s: String, maxLen: Int) -> String {
    s.count > maxLen ? String(s.prefix(maxLen)) + "..." : s
}

// --- Direct AX Element Interaction ---

// --- Auto-Scroll via Scroll Wheel Events ---

/// Walk the AX tree to find an element whose frame contains the given point.
/// Returns the deepest (smallest) match. Always recurses into children since
/// scroll area content may extend beyond the parent's visible frame.
func findAXElementAtPoint(root: AXUIElement, point: CGPoint, maxDepth: Int = 25) -> AXUIElement? {
    guard maxDepth > 0 else { return nil }

    var posRef: CFTypeRef?
    var sizeRef: CFTypeRef?
    let hasFrame =
        AXUIElementCopyAttributeValue(root, "AXPosition" as CFString, &posRef) == .success &&
        AXUIElementCopyAttributeValue(root, "AXSize" as CFString, &sizeRef) == .success
    var containsPoint = false
    if hasFrame {
        var pos = CGPoint.zero; var sz = CGSize.zero
        AXValueGetValue(posRef as! AXValue, .cgPoint, &pos)
        AXValueGetValue(sizeRef as! AXValue, .cgSize, &sz)
        containsPoint = CGRect(origin: pos, size: sz).contains(point)
    }

    var childrenRef: CFTypeRef?
    if AXUIElementCopyAttributeValue(root, "AXChildren" as CFString, &childrenRef) == .success,
       let children = childrenRef as? [AXUIElement] {
        for child in children {
            if let found = findAXElementAtPoint(root: child, point: point, maxDepth: maxDepth - 1) {
                return found
            }
        }
    }
    return containsPoint ? root : nil
}

/// Get the text (AXValue or AXTitle) of an AX element.
/// If the element itself has no text, search its children (e.g. AXRow -> AXCell -> AXStaticText).
func getAXElementText(_ element: AXUIElement, searchChildren: Bool = true) -> String? {
    var valueRef: CFTypeRef?
    if AXUIElementCopyAttributeValue(element, "AXValue" as CFString, &valueRef) == .success,
       let str = valueRef as? String, !str.isEmpty {
        return str
    }
    if AXUIElementCopyAttributeValue(element, "AXTitle" as CFString, &valueRef) == .success,
       let str = valueRef as? String, !str.isEmpty {
        return str
    }
    // For container elements (AXRow, AXCell), check children for text
    if searchChildren {
        var childrenRef: CFTypeRef?
        if AXUIElementCopyAttributeValue(element, "AXChildren" as CFString, &childrenRef) == .success,
           let children = childrenRef as? [AXUIElement] {
            for child in children {
                if let childText = getAXElementText(child, searchChildren: true) {
                    return childText
                }
            }
        }
    }
    return nil
}

/// Get the frame (position + size) of an AX element as a CGRect.
func getAXElementFrame(_ element: AXUIElement) -> CGRect? {
    var posRef: CFTypeRef?
    var sizeRef: CFTypeRef?
    guard AXUIElementCopyAttributeValue(element, "AXPosition" as CFString, &posRef) == .success,
          AXUIElementCopyAttributeValue(element, "AXSize" as CFString, &sizeRef) == .success else { return nil }
    var pos = CGPoint.zero; var sz = CGSize.zero
    AXValueGetValue(posRef as! AXValue, .cgPoint, &pos)
    AXValueGetValue(sizeRef as! AXValue, .cgSize, &sz)
    return CGRect(origin: pos, size: sz)
}

/// Search the AX tree for an element with matching text, returning its center if within viewport.
/// Uses a 40px inset margin to ensure the element is well within the visible area, not at the edge.
func findElementByText(root: AXUIElement, text: String, viewport: CGRect, maxDepth: Int = 25) -> CGPoint? {
    guard maxDepth > 0 else { return nil }
    let safeViewport = viewport.insetBy(dx: 0, dy: 15)

    if let elementText = getAXElementText(root), elementText == text {
        if let frame = getAXElementFrame(root) {
            let center = CGPoint(x: frame.midX, y: frame.midY)
            if safeViewport.contains(center) {
                return center
            }
        }
    }

    var childrenRef: CFTypeRef?
    if AXUIElementCopyAttributeValue(root, "AXChildren" as CFString, &childrenRef) == .success,
       let children = childrenRef as? [AXUIElement] {
        for child in children {
            if let found = findElementByText(root: child, text: text, viewport: viewport, maxDepth: maxDepth - 1) {
                return found
            }
        }
    }
    return nil
}

/// If the target point is outside the window viewport:
/// 1. Find the element at that point in the AX tree to get its text
/// 2. Scroll incrementally, targeting the element's x coordinate
/// 3. After each scroll step, search the AX tree for the element by text
/// 4. When found within viewport, return its actual position
///
/// If the element at the target has no text (common for far off-screen items),
/// scroll toward the target and keep probing until an element with text appears.
func scrollIntoViewIfNeeded(pid: pid_t, point: CGPoint) async -> CGPoint {
    let appElement = AXUIElementCreateApplication(pid)

    guard let (windowElement, windowBounds) = getWindowContainingPoint(appElement: appElement, point: point) else {
        fputs("log: scrollIntoViewIfNeeded: could not get window bounds, using original point\n", stderr)
        return point
    }

    if windowBounds.contains(point) {
        // Already in viewport — the caller already centered the point from (x + w/2, y + h/2).
        // Do NOT try to refine via findAXElementAtPoint: the AX tree has overlapping full-width
        // group elements (e.g. message rows spanning the entire window) that would shadow sidebar
        // items and send clicks to the wrong location.
        fputs("log: scrollIntoViewIfNeeded: in viewport, using caller-centered point \(point)\n", stderr)
        return point
    }

    // Try to find the element and its text
    let targetElement = findAXElementAtPoint(root: windowElement, point: point)
    let targetText = targetElement != nil ? getAXElementText(targetElement!) : nil

    let scrollingUp: Bool = point.y > windowBounds.maxY   // need to reveal content below
    let distance: CGFloat = scrollingUp
        ? point.y - windowBounds.maxY
        : windowBounds.minY - point.y
    // Scale lines per step to distance: 1 line for tiny offsets, up to 3 for large ones.
    // Each scroll line ≈ 20-40px, so 1 line is enough when distance < 80px.
    let linesPerStep: Int32 = distance < 80 ? 1 : (distance < 250 ? 2 : 3)
    let scrollDirection: Int32 = scrollingUp ? -linesPerStep : linesPerStep
    let maxSteps = 30

    if let targetText = targetText {
        // CASE 1: We have the element's text - scroll and search by text
        fputs("log: scrollIntoViewIfNeeded: target text=\"\(targetText)\", distance=\(distance)px, lines/step=\(linesPerStep), dir=\(scrollDirection)\n", stderr)

        for step in 1...maxSteps {
            guard let scrollEvent = CGEvent(scrollWheelEvent2Source: nil, units: .line, wheelCount: 1, wheel1: scrollDirection, wheel2: 0, wheel3: 0) else { return point }
            scrollEvent.location = CGPoint(x: point.x, y: windowBounds.midY)
            scrollEvent.post(tap: .cghidEventTap)
            try? await Task.sleep(nanoseconds: 100_000_000)

            // Debug: check where the target element currently is
            if step % 5 == 1 || step <= 3 {
                if let el = targetElement, let frame = getAXElementFrame(el) {
                    fputs("log: scrollIntoViewIfNeeded: step \(step): element frame=\(frame)\n", stderr)
                }
            }

            if let foundCenter = findElementByText(root: windowElement, text: targetText, viewport: windowBounds) {
                fputs("log: scrollIntoViewIfNeeded: found \"\(targetText)\" at \(foundCenter) after \(step) steps\n", stderr)
                try? await Task.sleep(nanoseconds: 100_000_000)
                return foundCenter
            }
        }
        fputs("warning: scrollIntoViewIfNeeded: could not scroll \"\(targetText)\" into view after \(maxSteps) steps\n", stderr)
        // Debug: final position
        if let el = targetElement, let frame = getAXElementFrame(el) {
            fputs("log: scrollIntoViewIfNeeded: final element frame=\(frame)\n", stderr)
        }
        return point
    } else {
        // CASE 2: No text at target coordinates (common for far off-screen sidebar items).
        // Strategy: scroll proportionally to the distance, then probe near the viewport
        // edge where new content appears. As we scroll, check the bottom/top edge for
        // newly revealed elements.
        let distance = point.y > windowBounds.maxY
            ? point.y - windowBounds.maxY
            : windowBounds.minY - point.y
        fputs("log: scrollIntoViewIfNeeded: no text at \(point), distance=\(distance)px, scrolling and probing edge\n", stderr)

        // Probe position: near the edge where new content scrolls in
        let probeY = point.y > windowBounds.maxY
            ? windowBounds.maxY - 60  // probe near bottom edge
            : windowBounds.minY + 60  // probe near top edge
        let probePoint = CGPoint(x: point.x, y: probeY)

        var lastText: String? = nil

        for step in 1...maxSteps {
            guard let scrollEvent = CGEvent(scrollWheelEvent2Source: nil, units: .line, wheelCount: 1, wheel1: scrollDirection, wheel2: 0, wheel3: 0) else { return point }
            scrollEvent.location = CGPoint(x: point.x, y: windowBounds.midY)
            scrollEvent.post(tap: .cghidEventTap)
            try? await Task.sleep(nanoseconds: 150_000_000)

            // Probe near the viewport edge for newly revealed elements
            if let element = findAXElementAtPoint(root: windowElement, point: probePoint),
               let text = getAXElementText(element) {
                if text != lastText {
                    fputs("log: scrollIntoViewIfNeeded: edge element after \(step) steps: \"\(text)\"\n", stderr)
                    lastText = text
                }
            }

            // Also check: has the target point come into range? (for shorter distances)
            if let element = findAXElementAtPoint(root: windowElement, point: point),
               let text = getAXElementText(element) {
                fputs("log: scrollIntoViewIfNeeded: target appeared after \(step) steps: \"\(text)\"\n", stderr)
                // Switch to text-based tracking
                if let foundCenter = findElementByText(root: windowElement, text: text, viewport: windowBounds) {
                    fputs("log: scrollIntoViewIfNeeded: \"\(text)\" in viewport at \(foundCenter)\n", stderr)
                    try? await Task.sleep(nanoseconds: 100_000_000)
                    return foundCenter
                }
                // Nudge a few more steps
                for step2 in 1...8 {
                    guard let se = CGEvent(scrollWheelEvent2Source: nil, units: .line, wheelCount: 1, wheel1: scrollDirection > 0 ? linesPerStep : -linesPerStep, wheel2: 0, wheel3: 0) else { return point }
                    se.location = CGPoint(x: point.x, y: windowBounds.midY)
                    se.post(tap: .cghidEventTap)
                    try? await Task.sleep(nanoseconds: 150_000_000)
                    if let fc = findElementByText(root: windowElement, text: text, viewport: windowBounds) {
                        fputs("log: scrollIntoViewIfNeeded: \"\(text)\" at \(fc) after \(step+step2) steps\n", stderr)
                        try? await Task.sleep(nanoseconds: 100_000_000)
                        return fc
                    }
                }
                // Use current position as fallback
                if let frame = getAXElementFrame(element) {
                    return CGPoint(x: frame.midX, y: frame.midY)
                }
                return point
            }
        }
        fputs("warning: scrollIntoViewIfNeeded: no element appeared after \(maxSteps) scroll steps\n", stderr)
        return point
    }
}

// Async helper function to set up and start the server
func setupAndStartServer() async throws -> Server {
    fputs("log: setupAndStartServer: entering function.\n", stderr)

    // --- Define Schemas and Tools for Simplified Actions ---
    // (Schemas remain the same as they define the MCP interface)
    let openAppSchema: Value = .object([
        "type": .string("object"),
        "properties": .object([
            "identifier": .object(["type": .string("string"), "description": .string("REQUIRED. App name, path, or bundle ID.")])
        ]),
        "required": .array([.string("identifier")])
    ])
    let openAppTool = Tool(
        name: "macos-use_open_application_and_traverse",
        description: "Opens/activates an application and then traverses its accessibility tree. Returns a summary with file path. Use Grep/Read on the file to find specific elements.",
        inputSchema: openAppSchema
    )

    let clickSchema: Value = .object([
        "type": .string("object"),
        "properties": .object([
            "pid": .object(["type": .string("number"), "description": .string("REQUIRED. PID of the target application window.")]),
            "x": .object(["type": .string("number"), "description": .string("REQUIRED. X coordinate for the click (top-left of element).")]),
            "y": .object(["type": .string("number"), "description": .string("REQUIRED. Y coordinate for the click (top-left of element).")]),
            "width": .object(["type": .string("number"), "description": .string("Optional. Element width from traversal. When provided with height, click lands at center (x+width/2, y+height/2).")]),
            "height": .object(["type": .string("number"), "description": .string("Optional. Element height from traversal. When provided with width, click lands at center (x+width/2, y+height/2).")])
        ]),
        "required": .array([.string("pid"), .string("x"), .string("y")])
    ])
    let clickTool = Tool(
        name: "macos-use_click_and_traverse",
        description: "Simulates a click at the given coordinates within the app specified by PID, then traverses its accessibility tree. Returns a summary with file path. Use Grep/Read on the file to find specific elements.",
        inputSchema: clickSchema
    )

    let typeSchema: Value = .object([
        "type": .string("object"),
        "properties": .object([
            "pid": .object(["type": .string("number"), "description": .string("REQUIRED. PID of the target application window.")]),
            "text": .object(["type": .string("string"), "description": .string("REQUIRED. Text to type.")])
             // Add optional options here if needed later
       ]),
        "required": .array([.string("pid"), .string("text")])
    ])
    let typeTool = Tool(
        name: "macos-use_type_and_traverse",
        description: "Simulates typing text into the app specified by PID, then traverses its accessibility tree. Returns a summary with file path. Use Grep/Read on the file to find specific elements.",
        inputSchema: typeSchema
    )

    let refreshSchema: Value = .object([
        "type": .string("object"),
        "properties": .object([
            "pid": .object(["type": .string("number"), "description": .string("REQUIRED. PID of the application to traverse.")])
             // Add optional options here if needed later
        ]),
        "required": .array([.string("pid")])
    ])
    let refreshTool = Tool(
        name: "macos-use_refresh_traversal",
        description: "Traverses the accessibility tree of the application specified by PID. Returns a summary with file path. Use Grep/Read on the file to find specific elements.",
        inputSchema: refreshSchema
    )

    // *** NEW: Schema and Tool for Press Key ***
    let pressKeySchema: Value = .object([
        "type": .string("object"),
        "properties": .object([
            "pid": .object(["type": .string("number"), "description": .string("REQUIRED. PID of the target application window.")]),
            "keyName": .object(["type": .string("string"), "description": .string("REQUIRED. Name of the key to press (e.g., 'Return', 'Enter', 'Escape', 'Tab', 'up', 'down', 'left', 'right', 'PageUp', 'PageDown', 'Home', 'End', 'Delete', 'a', 'B'). Case-insensitive for special keys.")]),
            "modifierFlags": .object([ // Optional array of strings
                "type": .string("array"),
                "description": .string("OPTIONAL. Modifier keys to hold (e.g., ['Command', 'Shift']). Valid: CapsLock, Shift, Control, Option, Command, Function, NumericPad, Help."),
                "items": .object(["type": .string("string")]) // Items in the array must be strings
            ])
            // Add optional ActionOptions overrides here if needed later
        ]),
        "required": .array([.string("pid"), .string("keyName")])
    ])
    let pressKeyTool = Tool(
        name: "macos-use_press_key_and_traverse",
        description: "Simulates pressing a specific key (like Return, Enter, Escape, Tab, Arrow Keys, regular characters) with optional modifiers, then traverses the accessibility tree. Returns a summary with file path. Use Grep/Read on the file to find specific elements.",
        inputSchema: pressKeySchema
    )

    // *** NEW: Schema and Tool for Scroll Wheel ***
    let scrollSchema: Value = .object([
        "type": .string("object"),
        "properties": .object([
            "pid": .object(["type": .string("number"), "description": .string("REQUIRED. PID of the target application window.")]),
            "x": .object(["type": .string("number"), "description": .string("REQUIRED. X coordinate for the scroll location.")]),
            "y": .object(["type": .string("number"), "description": .string("REQUIRED. Y coordinate for the scroll location.")]),
            "deltaY": .object(["type": .string("integer"), "description": .string("REQUIRED. Vertical scroll amount in lines. Negative = scroll up (reveal content above), positive = scroll down (reveal content below).")]),
            "deltaX": .object(["type": .string("integer"), "description": .string("Optional. Horizontal scroll amount in lines. Negative = scroll left, positive = scroll right. Defaults to 0.")])
        ]),
        "required": .array([.string("pid"), .string("x"), .string("y"), .string("deltaY")])
    ])
    let scrollTool = Tool(
        name: "macos-use_scroll_and_traverse",
        description: "Simulates a scroll wheel event at the given coordinates within the app specified by PID, then traverses its accessibility tree. Returns a summary with file path. Use Grep/Read on the file to find specific elements.",
        inputSchema: scrollSchema
    )

    // --- Aggregate list of tools ---
    let allTools = [openAppTool, clickTool, typeTool, pressKeyTool, scrollTool, refreshTool]
    fputs("log: setupAndStartServer: defined \(allTools.count) tools: \(allTools.map { $0.name })\n", stderr)

    let server = Server(
        name: "SwiftMacOSServerDirect", // Renamed slightly
        version: "1.3.0", // Incremented version for major change
        capabilities: .init(
            tools: .init(listChanged: true)
        )
    )
    fputs("log: setupAndStartServer: server instance created (\(server.name)) version \(server.version).\n", stderr)

    // --- Dummy Handlers (ReadResource, ListResources, ListPrompts) ---
    // (Keep these as they are part of the MCP spec, even if unused for now)
    await server.withMethodHandler(ReadResource.self) { params in
        let uri = params.uri
        fputs("log: handler(ReadResource): received request for uri: \(uri) (dummy handler)\n", stderr)
        // In a real scenario, you might fetch resource content here
        return .init(contents: [.text("dummy content for \(uri)", uri: uri)])
    }
    fputs("log: setupAndStartServer: registered ReadResource handler (dummy).\n", stderr)

    await server.withMethodHandler(ListResources.self) { _ in
        fputs("log: handler(ListResources): received request (dummy handler).\n", stderr)
        // In a real scenario, list available resources
        return ListResources.Result(resources: [])
    }
    fputs("log: setupAndStartServer: registered ListResources handler (dummy).\n", stderr)

    await server.withMethodHandler(ListPrompts.self) { _ in
        fputs("log: handler(ListPrompts): received request (dummy handler).\n", stderr)
        // In a real scenario, list available prompts
        return ListPrompts.Result(prompts: [])
    }
    fputs("log: setupAndStartServer: registered ListPrompts handler (dummy).\n", stderr)

    // --- ListTools Handler ---
    await server.withMethodHandler(ListTools.self) { _ in
        fputs("log: handler(ListTools): received request.\n", stderr)
        let result = ListTools.Result(tools: allTools)
        fputs("log: handler(ListTools): responding with \(result.tools.count) tools: \(result.tools.map { $0.name })\n", stderr)
        return result
    }
    fputs("log: setupAndStartServer: registered ListTools handler.\n", stderr)

    // --- UPDATED CallTool Handler (Direct SDK Call) ---
    await server.withMethodHandler(CallTool.self) { params in
        fputs("log: handler(CallTool): received request for tool: \(params.name).\n", stderr)
        fputs("log: handler(CallTool): arguments received (raw MCP): \(params.arguments?.debugDescription ?? "nil")\n", stderr)

        do {
            // --- Determine Action and Options from MCP Params ---
            let primaryAction: PrimaryAction
            var options = ActionOptions(traverseAfter: true, showAnimation: false) // MCP tools should return the tree by default, no visual highlighting

            // PID is required for click, type, press, refresh
            // Optional only for open (where SDK finds it)
            let pidOptionalInt = try getOptionalInt(from: params.arguments, key: "pid")

            // Convert Int? to pid_t?
            let pidForOptions: pid_t?
            if let unwrappedPid = pidOptionalInt {
                guard let convertedPid = pid_t(exactly: unwrappedPid) else {
                    fputs("error: handler(CallTool): PID value \(unwrappedPid) is out of range for pid_t (Int32).\n", stderr)
                    throw MCPError.invalidParams("PID value \(unwrappedPid) is out of range.")
                }
                pidForOptions = convertedPid
            } else {
                pidForOptions = nil
            }
            options.pidForTraversal = pidForOptions

            // Potentially allow overriding default options from params
            options.traverseBefore = try getOptionalBool(from: params.arguments, key: "traverseBefore") ?? options.traverseBefore
            options.traverseAfter = try getOptionalBool(from: params.arguments, key: "traverseAfter") ?? options.traverseAfter
            options.showDiff = try getOptionalBool(from: params.arguments, key: "showDiff") ?? options.showDiff
            options.onlyVisibleElements = try getOptionalBool(from: params.arguments, key: "onlyVisibleElements") ?? options.onlyVisibleElements
            options.showAnimation = try getOptionalBool(from: params.arguments, key: "showAnimation") ?? options.showAnimation
            options.animationDuration = try getOptionalDouble(from: params.arguments, key: "animationDuration") ?? options.animationDuration
            options.delayAfterAction = try getOptionalDouble(from: params.arguments, key: "delayAfterAction") ?? options.delayAfterAction

             options = options.validated()
             fputs("log: handler(CallTool): constructed ActionOptions: \(options)\n", stderr)


            // Track whether this tool returns a diff (click/type/press) or full traversal (open/refresh)
            var hasDiff = false

            switch params.name {
            case openAppTool.name:
                let identifier = try getRequiredString(from: params.arguments, key: "identifier")
                primaryAction = .open(identifier: identifier)

            case clickTool.name:
                guard let reqPid = pidForOptions else { throw MCPError.invalidParams("Missing required 'pid' for click tool") }
                let x = try getRequiredDouble(from: params.arguments, key: "x")
                let y = try getRequiredDouble(from: params.arguments, key: "y")
                let w = try getOptionalDouble(from: params.arguments, key: "width")
                let h = try getOptionalDouble(from: params.arguments, key: "height")
                // If width+height provided, compute exact center; otherwise use raw point (AX will center via lookup)
                let rawPoint: CGPoint
                if let w = w, let h = h {
                    rawPoint = CGPoint(x: x + w / 2, y: y + h / 2)
                    fputs("log: click_and_traverse: centering (\(x),\(y)) + size(\(w)×\(h)) → \(rawPoint)\n", stderr)
                } else {
                    rawPoint = CGPoint(x: x, y: y)
                }
                // Activate the target app before clicking so the click registers correctly
                if let runningApp = NSRunningApplication(processIdentifier: reqPid) {
                    runningApp.activate(options: [])
                    fputs("log: click_and_traverse: activated app pid=\(reqPid)\n", stderr)
                    try? await Task.sleep(nanoseconds: 200_000_000) // 200ms for activation
                }
                // Auto-scroll element into view if it's outside the visible window area
                let adjustedPoint = await scrollIntoViewIfNeeded(pid: reqPid, point: rawPoint)
                primaryAction = .input(action: .click(point: adjustedPoint))
                options.pidForTraversal = reqPid
                options.showDiff = true // enables traverseBefore automatically
                hasDiff = true

            case typeTool.name:
                guard let reqPid = pidForOptions else { throw MCPError.invalidParams("Missing required 'pid' for type tool") }
                let text = try getRequiredString(from: params.arguments, key: "text")
                primaryAction = .input(action: .type(text: text))
                options.pidForTraversal = reqPid
                options.showDiff = true
                hasDiff = true

            case pressKeyTool.name:
                guard let reqPid = pidForOptions else { throw MCPError.invalidParams("Missing required 'pid' for press key tool") }
                let keyName = try getRequiredString(from: params.arguments, key: "keyName")
                let flags = try parseFlags(from: params.arguments?["modifierFlags"])
                fputs("log: handler(CallTool): parsed modifierFlags: \(flags)\n", stderr)
                primaryAction = .input(action: .press(keyName: keyName, flags: flags))
                options.pidForTraversal = reqPid
                options.showDiff = true
                hasDiff = true

            case scrollTool.name:
                guard let reqPid = pidForOptions else { throw MCPError.invalidParams("Missing required 'pid' for scroll tool") }
                let x = try getRequiredDouble(from: params.arguments, key: "x")
                let y = try getRequiredDouble(from: params.arguments, key: "y")
                let deltaY = try getRequiredInt(from: params.arguments, key: "deltaY")
                let deltaX = try getOptionalInt(from: params.arguments, key: "deltaX") ?? 0
                let scrollPoint = CGPoint(x: x, y: y)
                // Activate the target app before scrolling so the event registers correctly
                if let runningApp = NSRunningApplication(processIdentifier: reqPid) {
                    runningApp.activate(options: [])
                    fputs("log: scroll_and_traverse: activated app pid=\(reqPid)\n", stderr)
                    try? await Task.sleep(nanoseconds: 200_000_000) // 200ms for activation
                }
                primaryAction = .input(action: .scroll(point: scrollPoint, deltaY: Int32(deltaY), deltaX: Int32(deltaX)))
                options.pidForTraversal = reqPid
                options.showDiff = true
                hasDiff = true

            case refreshTool.name:
                guard let reqPid = pidForOptions else { throw MCPError.invalidParams("Missing required 'pid' for refresh tool") }
                primaryAction = .traverseOnly
                options.pidForTraversal = reqPid

            default:
                fputs("error: handler(CallTool): received request for unknown or unsupported tool: \(params.name)\n", stderr)
                throw MCPError.methodNotFound(params.name)
            }

            fputs("log: handler(CallTool): constructed PrimaryAction: \(primaryAction)\n", stderr)

            // --- Save cursor position before click actions so we can restore it after ---
            var savedCursorPos: CGPoint? = nil
            if case .input(let inputAction) = primaryAction, case .click = inputAction {
                let nsPos = NSEvent.mouseLocation
                if let primaryScreen = NSScreen.screens.first {
                    // NSEvent uses bottom-left origin; CGEvent uses top-left — flip Y
                    savedCursorPos = CGPoint(x: nsPos.x, y: primaryScreen.frame.height - nsPos.y)
                    fputs("log: handler(CallTool): saved cursor position \(savedCursorPos!)\n", stderr)
                }
            }

            // --- Execute the Action using MacosUseSDK ---
            let actionResult: ActionResult = await Task { @MainActor in
                fputs("log: handler(CallTool): executing performAction on MainActor via Task...\n", stderr)
                return await performAction(action: primaryAction, optionsInput: options)
            }.value
            fputs("log: handler(CallTool): performAction task completed.\n", stderr)

            // --- Restore cursor position after click ---
            if let pos = savedCursorPos,
               let moveEvent = CGEvent(mouseEventSource: nil, mouseType: .mouseMoved,
                                       mouseCursorPosition: pos, mouseButton: .left) {
                moveEvent.post(tap: .cghidEventTap)
                fputs("log: handler(CallTool): restored cursor to \(pos)\n", stderr)
            }

            // --- Build simplified response and serialize to JSON ---
            let toolResponse = buildToolResponse(actionResult, hasDiff: hasDiff)
            guard let resultJsonString = serializeToJsonString(toolResponse) else {
                fputs("error: handler(CallTool): failed to serialize ToolResponse to JSON for tool \(params.name).\n", stderr)
                throw MCPError.internalError("failed to serialize ToolResponse to JSON")
            }

            // --- Determine if it was an error overall ---
            let isError = actionResult.primaryActionError != nil ||
                          (options.traverseBefore && actionResult.traversalBeforeError != nil) ||
                          (options.traverseAfter && actionResult.traversalAfterError != nil)

            if isError {
                 fputs("warning: handler(CallTool): Action resulted in an error state (primary: \(actionResult.primaryActionError ?? "nil"), before: \(actionResult.traversalBeforeError ?? "nil"), after: \(actionResult.traversalAfterError ?? "nil")).\n", stderr)
            }

            // --- Write full JSON to file, return compact summary ---
            let outputDir = "/tmp/macos-use"
            try? FileManager.default.createDirectory(atPath: outputDir, withIntermediateDirectories: true)

            let timestamp = Int(Date().timeIntervalSince1970 * 1000) // ms precision to avoid collisions
            let safeName = params.name.replacingOccurrences(of: "macos-use_", with: "")
            let filename = "\(timestamp)_\(safeName).json"
            let filepath = "\(outputDir)/\(filename)"
            try? resultJsonString.write(toFile: filepath, atomically: true, encoding: .utf8)
            fputs("log: handler(CallTool): wrote full response to \(filepath) (\(resultJsonString.count) bytes)\n", stderr)

            let summary = buildCompactSummary(toolName: params.name, params: params, toolResponse: toolResponse, filepath: filepath)
            fputs("log: handler(CallTool): returning compact summary (\(summary.count) chars)\n", stderr)

            return .init(content: [.text(summary)], isError: isError)

        } catch let error as MCPError {
             fputs("error: handler(CallTool): MCPError occurred processing MCP params for tool '\(params.name)': \(error)\n", stderr)
             return .init(content: [.text("Error processing parameters for tool '\(params.name)': \(error.localizedDescription)")], isError: true)
        } catch {
             fputs("error: handler(CallTool): Unexpected error occurred setting up call for tool '\(params.name)': \(error)\n", stderr)
             return .init(content: [.text("Unexpected setup error executing tool '\(params.name)': \(error.localizedDescription)")], isError: true)
        }
    }
    fputs("log: setupAndStartServer: registered CallTool handler.\n", stderr)


    // --- Transport and Start ---
    let transport = StdioTransport()
    fputs("log: setupAndStartServer: created StdioTransport.\n", stderr)

    fputs("log: setupAndStartServer: calling server.start()...\n", stderr)
    try await server.start(transport: transport)
    fputs("log: setupAndStartServer: server.start() completed (background task launched).\n", stderr)

    fputs("log: setupAndStartServer: returning server instance.\n", stderr)
    return server
}

// --- @main Entry Point ---
@main
struct MCPServer {
    // Main entry point - Async
    static func main() async {
        fputs("log: main: starting server (async).\n", stderr)

        // Configure logging if needed (optional)
        // LoggingSystem.bootstrap { label in MultiplexLogHandler([...]) }

        let server: Server
        do {
            fputs("log: main: calling setupAndStartServer()...\n", stderr)
            server = try await setupAndStartServer()
            fputs("log: main: setupAndStartServer() successful, server instance obtained.\n", stderr)

            fputs("log: main: server started, calling server.waitUntilCompleted()...\n", stderr)
            await server.waitUntilCompleted() // Waits until the server loop finishes/errors
            fputs("log: main: server.waitUntilCompleted() returned. Server has stopped.\n", stderr)

        } catch {
            fputs("error: main: server setup or run failed: \(error)\n", stderr)
            if let mcpError = error as? MCPError {
                 fputs("error: main: MCPError details: \(mcpError.localizedDescription)\n", stderr)
             }
            // Consider more specific exit codes if useful
            exit(1) // Exit with error code
        }

        fputs("log: main: Server processing finished gracefully. Exiting.\n", stderr)
        exit(0) // Exit cleanly
    }
}
