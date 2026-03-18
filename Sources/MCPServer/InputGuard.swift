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

    // MARK: - Engage / Disengage

    /// Start blocking user input and show the overlay banner.
    /// Blocks until the event tap is active and the overlay is shown.
    func engage(message: String = "AI is controlling your computer — press Esc to cancel") {
        lock.lock()
        guard !_engaged else { lock.unlock(); return }
        _engaged = true
        lock.unlock()

        fputs("log: InputGuard: engaging — \(message)\n", stderr)

        // Create event tap and overlay synchronously on main thread to ensure
        // they're active before we return and the automation starts.
        if Thread.isMainThread {
            createEventTap()
            showOverlaySync(message: message)
        } else {
            DispatchQueue.main.sync {
                self.createEventTap()
                self.showOverlaySync(message: message)
            }
        }

        // Start watchdog timer
        startWatchdog()

        fputs("log: InputGuard: engaged — tap active, overlay visible\n", stderr)
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
        // Build mask incrementally to avoid Swift type-checker timeout.
        var mask: CGEventMask = 0
        mask |= (1 << CGEventType.keyDown.rawValue)
        mask |= (1 << CGEventType.keyUp.rawValue)
        mask |= (1 << CGEventType.leftMouseDown.rawValue)
        mask |= (1 << CGEventType.leftMouseUp.rawValue)
        mask |= (1 << CGEventType.rightMouseDown.rawValue)
        mask |= (1 << CGEventType.rightMouseUp.rawValue)
        mask |= (1 << CGEventType.mouseMoved.rawValue)
        mask |= (1 << CGEventType.leftMouseDragged.rawValue)
        mask |= (1 << CGEventType.rightMouseDragged.rawValue)
        mask |= (1 << CGEventType.scrollWheel.rawValue)
        mask |= (1 << CGEventType.flagsChanged.rawValue)

        let refcon = Unmanaged.passUnretained(self).toOpaque()

        // kCGHeadInsertEventTap = 0 (Swift overlay doesn't expose the enum case name)
        let headInsert = CGEventTapPlacement(rawValue: 0)!
        guard let tap = CGEvent.tapCreate(
            tap: .cghidEventTap,
            place: headInsert,
            options: .defaultTap,
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

    /// Show overlay synchronously (must be called on main thread).
    private func showOverlaySync(message: String) {
        assert(Thread.isMainThread, "showOverlaySync must be called on main thread")
        buildAndShowOverlay(message: message)
    }

    private func showOverlay(message: String) {
        DispatchQueue.main.async { [weak self] in
            self?.buildAndShowOverlay(message: message)
        }
    }

    private func buildAndShowOverlay(message: String) {
        // Ensure NSApplication is set up (no-op if already initialized)
        let app = NSApplication.shared
        app.setActivationPolicy(.accessory) // Don't show in dock or Cmd+Tab

        let screenFrame = NSScreen.main?.frame ?? NSRect(x: 0, y: 0, width: 1920, height: 1080)

        // Full-screen transparent overlay
        let window = NSWindow(
            contentRect: screenFrame,
            styleMask: [.borderless],
            backing: .buffered,
            defer: false
        )
        window.level = .screenSaver
        window.isOpaque = false
        window.backgroundColor = NSColor.black.withAlphaComponent(0.15)
        window.ignoresMouseEvents = true
        window.hasShadow = false
        window.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary]

        // Container for the centered pill
        let contentView = NSView(frame: NSRect(origin: .zero, size: screenFrame.size))

        // Centered pill — solid dark background for strong contrast
        let pillWidth: CGFloat = min(720, screenFrame.width * 0.5)
        let pillHeight: CGFloat = 80
        let pillX = (screenFrame.width - pillWidth) / 2
        let pillY = (screenFrame.height - pillHeight) / 2

        let pill = NSView(frame: NSRect(x: pillX, y: pillY, width: pillWidth, height: pillHeight))
        pill.wantsLayer = true
        pill.layer?.backgroundColor = NSColor(white: 0.08, alpha: 0.92).cgColor
        pill.layer?.cornerRadius = pillHeight / 2
        pill.layer?.masksToBounds = true

        // Pulsing orange dot — vertically centered
        let dotSize: CGFloat = 16
        let dotView = NSView(frame: NSRect(x: 28, y: (pillHeight - dotSize) / 2, width: dotSize, height: dotSize))
        dotView.wantsLayer = true
        dotView.layer?.backgroundColor = NSColor.systemOrange.cgColor
        dotView.layer?.cornerRadius = dotSize / 2

        let pulse = CABasicAnimation(keyPath: "opacity")
        pulse.fromValue = 1.0
        pulse.toValue = 0.3
        pulse.duration = 0.8
        pulse.autoreverses = true
        pulse.repeatCount = .infinity
        dotView.layer?.add(pulse, forKey: "pulse")

        // Text label — large white font, single line, vertically centered via intrinsic sizing
        let font = NSFont.systemFont(ofSize: 20, weight: .semibold)
        let label = NSTextField(labelWithString: message)
        label.font = font
        label.textColor = NSColor.white
        label.alignment = .center
        label.lineBreakMode = .byTruncatingTail
        label.maximumNumberOfLines = 1
        // Size to fit the text height, then center vertically in the pill
        label.sizeToFit()
        let labelX: CGFloat = 54
        let labelWidth = pillWidth - labelX - 28
        let labelHeight = label.frame.height
        let labelY = (pillHeight - labelHeight) / 2
        label.frame = NSRect(x: labelX, y: labelY, width: labelWidth, height: labelHeight)

        pill.addSubview(dotView)
        pill.addSubview(label)
        contentView.addSubview(pill)
        window.contentView = contentView

        window.orderFrontRegardless()
        self.overlayWindow = window
        fputs("log: InputGuard: overlay shown (fullscreen)\n", stderr)
    }

    private func hideOverlay() {
        DispatchQueue.main.async { [weak self] in
            self?.overlayWindow?.orderOut(nil)
            self?.overlayWindow = nil
            fputs("log: InputGuard: overlay hidden\n", stderr)
        }
    }

    // MARK: - Esc handling

    fileprivate func handleEscPressed() {
        fputs("log: InputGuard: Esc pressed — user cancelled\n", stderr)
        disengage()
        onUserCancelled?()
    }

    /// Re-enable the tap if macOS auto-disabled it.
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

    // Let programmatic events through.
    // Our CGEvent.post() calls use .hidSystemState source which has a non-zero stateID.
    // Hardware events have stateID == 0.
    let sourceStateID = event.getIntegerValueField(.eventSourceStateID)
    if sourceStateID != 0 {
        return Unmanaged.passUnretained(event)
    }

    // Check for plain Esc key (keycode 53, no modifiers)
    if type == .keyDown {
        let keyCode = event.getIntegerValueField(.keyboardEventKeycode)
        let flags = event.flags
        let modifierMask: CGEventFlags = [.maskCommand, .maskControl, .maskAlternate, .maskShift]
        if keyCode == 53 && flags.intersection(modifierMask).isEmpty {
            guard_.handleEscPressed()
            return nil // Suppress the Esc event
        }
    }

    // Block all other hardware user events
    return nil
}
