import Foundation
import CoreGraphics
import AppKit

/// Blocks user keyboard/mouse input during MCP automation and shows a floating overlay.
/// Press Esc (plain, no modifiers) to cancel and immediately release.
///
/// Usage:
///   InputGuard.shared.engage(message: "Clicking in Safari…")
///   // … perform automation …
///   InputGuard.shared.disengage()
///
/// The guard automatically disengages after `watchdogTimeout` seconds to prevent lockout.
final class InputGuard: @unchecked Sendable {
    static let shared = InputGuard()

    // MARK: - Configuration
    /// Maximum seconds the guard stays engaged before auto-releasing (safety net).
    var watchdogTimeout: TimeInterval = 30

    // MARK: - State
    private var eventTap: CFMachPort?
    private var runLoopSource: CFRunLoopSource?
    private var watchdogTimer: DispatchSourceTimer?
    private let lock = NSLock()
    private var _engaged = false

    /// Whether the guard is currently blocking input.
    var isEngaged: Bool {
        lock.lock()
        defer { lock.unlock() }
        return _engaged
    }

    /// Callback invoked when the user presses Esc to cancel. Called on an arbitrary thread.
    var onUserCancelled: (() -> Void)?

    // MARK: - Overlay
    private var overlayWindow: NSWindow?
    private var overlayThread: Thread?

    // MARK: - Engage / Disengage

    /// Start blocking user input and show the overlay banner.
    func engage(message: String = "AI is controlling your computer — press Esc to cancel") {
        lock.lock()
        guard !_engaged else { lock.unlock(); return }
        _engaged = true
        lock.unlock()

        fputs("log: InputGuard: engaging — \(message)\n", stderr)

        // 1. Show overlay on a dedicated AppKit thread
        showOverlay(message: message)

        // 2. Create the event tap
        createEventTap()

        // 3. Start watchdog timer
        startWatchdog()
    }

    /// Stop blocking user input and hide the overlay.
    func disengage() {
        lock.lock()
        guard _engaged else { lock.unlock(); return }
        _engaged = false
        lock.unlock()

        fputs("log: InputGuard: disengaging\n", stderr)

        destroyEventTap()
        stopWatchdog()
        hideOverlay()
    }

    // MARK: - CGEventTap

    private func createEventTap() {
        // We want to intercept all user hardware events:
        let mask: CGEventMask =
            (1 << CGEventType.keyDown.rawValue) |
            (1 << CGEventType.keyUp.rawValue) |
            (1 << CGEventType.leftMouseDown.rawValue) |
            (1 << CGEventType.leftMouseUp.rawValue) |
            (1 << CGEventType.rightMouseDown.rawValue) |
            (1 << CGEventType.rightMouseUp.rawValue) |
            (1 << CGEventType.mouseMoved.rawValue) |
            (1 << CGEventType.leftMouseDragged.rawValue) |
            (1 << CGEventType.rightMouseDragged.rawValue) |
            (1 << CGEventType.scrollWheel.rawValue) |
            (1 << CGEventType.flagsChanged.rawValue)

        // Store `self` as a raw pointer for the C callback
        let refcon = Unmanaged.passUnretained(self).toOpaque()

        guard let tap = CGEvent.tapCreate(
            tap: .cghidEventTap,
            place: .headInsertedEventTap,
            options: .defaultTap,   // Active tap — can suppress events
            eventsOfInterest: mask,
            callback: inputGuardCallback,
            userInfo: refcon
        ) else {
            fputs("error: InputGuard: failed to create CGEventTap (check Accessibility permissions)\n", stderr)
            lock.lock()
            _engaged = false
            lock.unlock()
            return
        }

        eventTap = tap
        runLoopSource = CFMachPortCreateRunLoopSource(kCFAllocatorDefault, tap, 0)
        CFRunLoopAddSource(CFRunLoopGetMain(), runLoopSource, .commonModes)
        CGEvent.tapEnable(tap: tap, enable: true)
        fputs("log: InputGuard: CGEventTap created and enabled\n", stderr)
    }

    private func destroyEventTap() {
        if let tap = eventTap {
            CGEvent.tapEnable(tap: tap, enable: false)
            if let source = runLoopSource {
                CFRunLoopRemoveSource(CFRunLoopGetMain(), source, .commonModes)
            }
            CFMachPortInvalidate(tap)
            fputs("log: InputGuard: CGEventTap destroyed\n", stderr)
        }
        eventTap = nil
        runLoopSource = nil
    }

    // MARK: - Watchdog

    private func startWatchdog() {
        let timer = DispatchSource.makeTimerSource(queue: .global())
        timer.schedule(deadline: .now() + watchdogTimeout)
        timer.setEventHandler { [weak self] in
            fputs("warning: InputGuard: watchdog fired after \(self?.watchdogTimeout ?? 0)s — auto-disengaging\n", stderr)
            self?.disengage()
        }
        timer.resume()
        watchdogTimer = timer
    }

    private func stopWatchdog() {
        watchdogTimer?.cancel()
        watchdogTimer = nil
    }

    // MARK: - Overlay Window

    private func showOverlay(message: String) {
        // NSWindow must be created on a thread with a run loop.
        // We use the main thread via DispatchQueue.main since the MCP server
        // uses async/await which keeps the main run loop alive.
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }

            // Ensure NSApplication is set up (no-op if already done)
            let app = NSApplication.shared
            app.setActivationPolicy(.accessory) // Don't show in dock or Cmd+Tab

            // Build the overlay window
            let screenFrame = NSScreen.main?.frame ?? NSRect(x: 0, y: 0, width: 1920, height: 1080)
            let bannerHeight: CGFloat = 44
            let bannerWidth: CGFloat = min(600, screenFrame.width * 0.5)
            let bannerX = screenFrame.origin.x + (screenFrame.width - bannerWidth) / 2
            // Position near top of screen (NSWindow origin is bottom-left)
            let bannerY = screenFrame.origin.y + screenFrame.height - bannerHeight - 8

            let window = NSWindow(
                contentRect: NSRect(x: bannerX, y: bannerY, width: bannerWidth, height: bannerHeight),
                styleMask: [.borderless],
                backing: .buffered,
                defer: false
            )
            window.level = .screenSaver          // Float above everything
            window.isOpaque = false
            window.backgroundColor = .clear
            window.ignoresMouseEvents = true      // Click-through
            window.hasShadow = true
            window.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary]

            // Content view with rounded dark background
            let contentView = NSVisualEffectView(frame: NSRect(x: 0, y: 0, width: bannerWidth, height: bannerHeight))
            contentView.material = .hudWindow
            contentView.state = .active
            contentView.blendingMode = .behindWindow
            contentView.wantsLayer = true
            contentView.layer?.cornerRadius = 10
            contentView.layer?.masksToBounds = true

            // Pulsing dot indicator
            let dotSize: CGFloat = 10
            let dotView = NSView(frame: NSRect(x: 14, y: (bannerHeight - dotSize) / 2, width: dotSize, height: dotSize))
            dotView.wantsLayer = true
            dotView.layer?.backgroundColor = NSColor.systemOrange.cgColor
            dotView.layer?.cornerRadius = dotSize / 2

            // Pulse animation
            let pulse = CABasicAnimation(keyPath: "opacity")
            pulse.fromValue = 1.0
            pulse.toValue = 0.3
            pulse.duration = 0.8
            pulse.autoreverses = true
            pulse.repeatCount = .infinity
            dotView.layer?.add(pulse, forKey: "pulse")

            // Label
            let label = NSTextField(labelWithString: message)
            label.font = NSFont.systemFont(ofSize: 13, weight: .medium)
            label.textColor = .white
            label.frame = NSRect(x: 32, y: 0, width: bannerWidth - 44, height: bannerHeight)

            contentView.addSubview(dotView)
            contentView.addSubview(label)
            window.contentView = contentView

            window.orderFrontRegardless()
            self.overlayWindow = window
            fputs("log: InputGuard: overlay shown\n", stderr)
        }
    }

    private func hideOverlay() {
        DispatchQueue.main.async { [weak self] in
            self?.overlayWindow?.orderOut(nil)
            self?.overlayWindow = nil
            fputs("log: InputGuard: overlay hidden\n", stderr)
        }
    }

    // MARK: - Handle Esc from event tap callback

    fileprivate func handleEscPressed() {
        fputs("log: InputGuard: Esc pressed — user cancelled\n", stderr)
        disengage()
        onUserCancelled?()
    }

    /// Re-enable the tap if macOS auto-disabled it (happens if callback is too slow).
    fileprivate func reEnableTapIfNeeded(type: CGEventType) {
        if type == .tapDisabledByTimeout || type == .tapDisabledByUserInput {
            if let tap = eventTap {
                CGEvent.tapEnable(tap: tap, enable: true)
                fputs("warning: InputGuard: re-enabled CGEventTap after system disabled it\n", stderr)
            }
        }
    }
}

// MARK: - C callback (must be a free function)

private func inputGuardCallback(
    proxy: CGEventTapProxy,
    type: CGEventType,
    event: CGEvent,
    refcon: UnsafeMutableRawPointer?
) -> Unmanaged<CGEvent>? {
    guard let refcon = refcon else { return Unmanaged.passUnretained(event) }
    let guard_ = Unmanaged<InputGuard>.fromOpaque(refcon).takeUnretainedValue()

    // Handle system tap-disable events
    if type == .tapDisabledByTimeout || type == .tapDisabledByUserInput {
        guard_.reEnableTapIfNeeded(type: type)
        return Unmanaged.passUnretained(event)
    }

    // Let programmatic events through (events posted by our own CGEvent.post calls).
    // Hardware events have eventSourceStateID == 0 (or privateState); our posted events
    // come from .hidSystemState which has a non-zero ID.
    // However, a simpler heuristic: check if the event source is .hidSystemState
    // by looking at the event source state ID field.
    let sourceStateID = event.getIntegerValueField(.eventSourceStateID)
    if sourceStateID != 0 {
        // This is a programmatic event (from our automation or another app) — let it through
        return Unmanaged.passUnretained(event)
    }

    // Check for plain Esc key (no modifiers)
    if type == .keyDown {
        let keyCode = event.getIntegerValueField(.keyboardEventKeycode)
        let flags = event.flags
        // Allow only plain Esc (keycode 53), no Cmd/Ctrl/Option/Shift
        let modifierMask: CGEventFlags = [.maskCommand, .maskControl, .maskAlternate, .maskShift]
        if keyCode == 53 && flags.intersection(modifierMask).isEmpty {
            guard_.handleEscPressed()
            // Suppress the Esc event itself (don't let it reach apps)
            return nil
        }
    }

    // Block all other hardware user events
    return nil
}
