// Reproduces the OLD direct-CGEvent click path (pre-NSEvent bridge) so we can
// isolate whether the NSEvent change introduced a Catalyst table-row regression.
//
// Usage:
//   xcrun --toolchain com.apple.dt.toolchain.XcodeDefault swift scripts/old_click_test.swift <pid> <x> <y>
//
// Activates the target app, then posts a leftMouseDown/leftMouseUp at (x, y)
// using the OLD CGEvent(mouseEventSource:...) constructor. Same as what
// MacosUseSDK.clickMouse did before the NSEvent rewrite.
import Foundation
import AppKit
import CoreGraphics

let args = CommandLine.arguments
guard args.count == 4,
      let pid = pid_t(args[1]),
      let x = Double(args[2]),
      let y = Double(args[3]) else {
    fputs("usage: old_click_test.swift <pid> <x> <y>\n", stderr)
    exit(2)
}

if let app = NSRunningApplication(processIdentifier: pid) {
    app.activate(options: [])
    Thread.sleep(forTimeInterval: 0.2)
    fputs("activated pid \(pid)\n", stderr)
} else {
    fputs("no app for pid \(pid)\n", stderr)
    exit(1)
}

guard let source = CGEventSource(stateID: .hidSystemState) else {
    fputs("failed to create event source\n", stderr); exit(1)
}

let pt = CGPoint(x: x, y: y)
let down = CGEvent(mouseEventSource: source, mouseType: .leftMouseDown, mouseCursorPosition: pt, mouseButton: .left)
guard down != nil else { fputs("failed to create down\n", stderr); exit(1) }
down!.post(tap: .cghidEventTap)
usleep(15_000)

let up = CGEvent(mouseEventSource: source, mouseType: .leftMouseUp, mouseCursorPosition: pt, mouseButton: .left)
guard up != nil else { fputs("failed to create up\n", stderr); exit(1) }
up!.post(tap: .cghidEventTap)
usleep(15_000)

fputs("OLD click posted at (\(x), \(y))\n", stderr)
