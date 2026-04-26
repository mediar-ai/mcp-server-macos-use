// Run with:
//   xcrun --toolchain com.apple.dt.toolchain.XcodeDefault swift scripts/ax_inspect.swift <pid> <x> <y>
//
// Dumps the AX element at (x, y), walks its parent chain, and lists the
// attributes/actions on each level to figure out which level (if any) is
// selectable.
import Foundation
import ApplicationServices

let args = CommandLine.arguments
guard args.count == 4,
      let pid = pid_t(args[1]),
      let x = Float(args[2]),
      let y = Float(args[3]) else {
    fputs("usage: ax_inspect.swift <pid> <x> <y>\n", stderr)
    exit(2)
}

let app = AXUIElementCreateApplication(pid)

func role(_ e: AXUIElement) -> String {
    var v: AnyObject?
    if AXUIElementCopyAttributeValue(e, kAXRoleAttribute as CFString, &v) == .success {
        return (v as? String) ?? "<no-role>"
    }
    return "<no-role>"
}

func attrs(_ e: AXUIElement) -> [String] {
    var arr: CFArray?
    AXUIElementCopyAttributeNames(e, &arr)
    return (arr as? [String]) ?? []
}

func actions(_ e: AXUIElement) -> [String] {
    var arr: CFArray?
    AXUIElementCopyActionNames(e, &arr)
    return (arr as? [String]) ?? []
}

func isSettable(_ e: AXUIElement, _ attr: String) -> Bool {
    var settable: DarwinBoolean = false
    AXUIElementIsAttributeSettable(e, attr as CFString, &settable)
    return settable.boolValue
}

func describe(_ e: AXUIElement, depth: Int) {
    let pad = String(repeating: "  ", count: depth)
    let r = role(e)
    let a = attrs(e)
    let act = actions(e)
    let sel = isSettable(e, kAXSelectedAttribute) ? "Y" : "N"
    let val = isSettable(e, kAXValueAttribute) ? "Y" : "N"
    print("\(pad)[\(r)] settable: AXSelected=\(sel) AXValue=\(val) | actions=\(act) | attrs=\(a.count)")

    // print a short title/value if available
    var title: AnyObject?
    AXUIElementCopyAttributeValue(e, kAXTitleAttribute as CFString, &title)
    if let t = title as? String, !t.isEmpty { print("\(pad)  title: \(t)") }

    var v: AnyObject?
    AXUIElementCopyAttributeValue(e, kAXValueAttribute as CFString, &v)
    if let s = v as? String, !s.isEmpty { print("\(pad)  value: \(s)") }
    if let n = v as? NSNumber { print("\(pad)  value: \(n)") }
}

// Hit-test
var hit: AXUIElement?
let hitErr = AXUIElementCopyElementAtPosition(app, x, y, &hit)
guard hitErr == .success, let element = hit else {
    fputs("hit-test failed: AXError \(hitErr.rawValue)\n", stderr)
    exit(1)
}

print("=== Hit at (\(x), \(y)) for pid \(pid) ===")
var current: AXUIElement? = element
var depth = 0
while let e = current, depth < 15 {
    describe(e, depth: depth)
    var parent: AnyObject?
    let err = AXUIElementCopyAttributeValue(e, kAXParentAttribute as CFString, &parent)
    if err != .success || parent == nil { break }
    current = (parent as! AXUIElement)
    depth += 1
}
