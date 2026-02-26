#!/usr/bin/swift
import AppKit
import ApplicationServices
import CoreGraphics

// MARK: - AX helpers

func getFrame(_ el: AXUIElement) -> CGRect? {
    var posRef: CFTypeRef?; var sizeRef: CFTypeRef?
    guard AXUIElementCopyAttributeValue(el, "AXPosition" as CFString, &posRef) == .success,
          AXUIElementCopyAttributeValue(el, "AXSize" as CFString, &sizeRef) == .success else { return nil }
    var pos = CGPoint.zero; var sz = CGSize.zero
    AXValueGetValue(posRef as! AXValue, .cgPoint, &pos)
    AXValueGetValue(sizeRef as! AXValue, .cgSize, &sz)
    return CGRect(origin: pos, size: sz)
}

func getText(_ el: AXUIElement) -> String? {
    for attr in ["AXValue", "AXTitle", "AXDescription", "AXLabel"] {
        var ref: CFTypeRef?
        if AXUIElementCopyAttributeValue(el, attr as CFString, &ref) == .success,
           let s = ref as? String, !s.isEmpty { return s }
    }
    return nil
}

func findByTextContaining(_ root: AXUIElement, _ search: String, depth: Int = 0) -> (AXUIElement, CGRect, String)? {
    guard depth < 25 else { return nil }
    if let text = getText(root), text.contains(search), let frame = getFrame(root) { return (root, frame, text) }
    var childrenRef: CFTypeRef?
    if AXUIElementCopyAttributeValue(root, "AXChildren" as CFString, &childrenRef) == .success,
       let children = childrenRef as? [AXUIElement] {
        for child in children {
            if let found = findByTextContaining(child, search, depth: depth + 1) { return found }
        }
    }
    return nil
}

/// Returns text of the focused element (or its nearest text-bearing ancestor)
func getFocusedElementText(_ app: AXUIElement) -> String? {
    var focusedRef: CFTypeRef?
    guard AXUIElementCopyAttributeValue(app, "AXFocusedUIElement" as CFString, &focusedRef) == .success else { return nil }
    let focused = focusedRef as! AXUIElement
    // Try the element itself first, then its parent
    if let t = getText(focused) { return t }
    var parentRef: CFTypeRef?
    if AXUIElementCopyAttributeValue(focused, "AXParent" as CFString, &parentRef) == .success {
        if let t = getText(parentRef as! AXUIElement) { return t }
    }
    return nil
}

/// Returns the text of the AXButton in the conversation header (the contact name/number).
/// In Messages the header button is small (~28px tall) and positioned in the top-right of
/// the window — we pick the first AXButton whose text isn't a known UI chrome label.
let knownUIChrome: Set<String> = [
    "compose", "filter", "add", "Emoji picker",
    "Record audio Activate to start recording audio.",
    "this button also has an action to zoom the window"
]
func getSelectedConversationName(_ app: AXUIElement) -> String? {
    func search(_ el: AXUIElement, depth: Int = 0) -> String? {
        guard depth < 20 else { return nil }
        var roleRef: CFTypeRef?
        if AXUIElementCopyAttributeValue(el, "AXRole" as CFString, &roleRef) == .success,
           let role = roleRef as? String, role == "AXButton",
           let text = getText(el), !text.isEmpty,
           !knownUIChrome.contains(text) {
            return text
        }
        var childrenRef: CFTypeRef?
        if AXUIElementCopyAttributeValue(el, "AXChildren" as CFString, &childrenRef) == .success,
           let children = childrenRef as? [AXUIElement] {
            for child in children {
                if let found = search(child, depth: depth + 1) { return found }
            }
        }
        return nil
    }
    return search(app)
}

// MARK: - Click helper

func click(at point: CGPoint) {
    guard let src = CGEventSource(stateID: .hidSystemState) else { return }
    let down = CGEvent(mouseEventSource: src, mouseType: .leftMouseDown, mouseCursorPosition: point, mouseButton: .left)
    let up   = CGEvent(mouseEventSource: src, mouseType: .leftMouseUp,   mouseCursorPosition: point, mouseButton: .left)
    down?.post(tap: .cghidEventTap); usleep(50_000)
    up?.post(tap: .cghidEventTap);   usleep(50_000)
}

// MARK: - Main

let pid: pid_t = 7301
let app = AXUIElementCreateApplication(pid)

// 1. Capture state BEFORE click
print("=== BEFORE CLICK ===")
let beforeConvo = getSelectedConversationName(app)
print("Selected conversation (button): \(beforeConvo ?? "(none)")")

// 2. Find Stripe element
guard let (_, stripeFrame, stripeText) = findByTextContaining(app, "Stripe") else {
    print("❌ Stripe element not found in AX tree. Make sure Messages is open and visible.")
    exit(1)
}
let stripeCenter = CGPoint(x: stripeFrame.midX, y: stripeFrame.midY)
print("\nStripe element found:")
print("  frame:  \(stripeFrame)")
print("  center: \(stripeCenter)")

// 3. Activate Messages so it's in the foreground
NSRunningApplication(processIdentifier: pid)?.activate(options: [])
usleep(300_000) // 300ms for activation

// 4. Send the click
print("\n=== CLICKING at \(stripeCenter) ===")
click(at: stripeCenter)

// 5. Wait for UI to settle
usleep(600_000) // 600ms

// 6. Capture state AFTER click
print("\n=== AFTER CLICK ===")
let afterConvo = getSelectedConversationName(app)
print("Selected conversation (button): \(afterConvo ?? "(none)")")
let focusedText = getFocusedElementText(app)
print("AXFocusedUIElement text: \(focusedText ?? "(none)")")

// Also look for Stripe in the detail pane (message content area)
if let (_, _, _) = findByTextContaining(app, "[Stripe Inc.]") {
    print("Stripe message content visible in detail pane: ✅")
} else {
    print("Stripe message content visible in detail pane: ❌ (not found)")
}

// 7. Verdict — primary signal: Stripe message content visible in detail pane
print("\n=== RESULT ===")
let stripeContentVisible = findByTextContaining(app, "[Stripe Inc.]") != nil
let conversationChanged  = afterConvo != beforeConvo

if stripeContentVisible {
    print("✅ PASS — Stripe message content is visible in the detail pane after click")
    print("   Conversation button: '\(afterConvo ?? "(none)")'")
} else if conversationChanged {
    print("⚠️  PARTIAL — conversation changed ('\(beforeConvo ?? "none")' → '\(afterConvo ?? "none")') but Stripe content not found in detail pane")
} else {
    print("❌ FAIL — nothing changed (conversation still '\(afterConvo ?? "none")', no Stripe content visible)")
}
