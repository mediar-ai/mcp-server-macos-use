/// Standalone screenshot helper — runs in a subprocess so that ReplayKit
/// (loaded as a side-effect of CGWindowListCreateImage) dies with the process
/// instead of spinning forever in the parent MCP server.
///
/// Usage: screenshot-helper <windowID> <outputPath> [--click <x>,<y> --bounds <x>,<y>,<w>,<h>]

import Foundation
import CoreGraphics
import AppKit

func main() -> Int32 {
    let args = CommandLine.arguments
    guard args.count >= 3,
          let windowID = CGWindowID(args[1]) else {
        fputs("usage: screenshot-helper <windowID> <outputPath> [--click <x>,<y> --bounds <x>,<y>,<w>,<h>]\n", stderr)
        return 1
    }

    let outputPath = args[2]

    // Parse optional click point and window bounds
    var clickPoint: CGPoint? = nil
    var windowRect: CGRect? = nil

    var i = 3
    while i < args.count {
        if args[i] == "--click", i + 1 < args.count {
            let parts = args[i + 1].split(separator: ",").compactMap { Double($0) }
            if parts.count == 2 {
                clickPoint = CGPoint(x: parts[0], y: parts[1])
            }
            i += 2
        } else if args[i] == "--bounds", i + 1 < args.count {
            let parts = args[i + 1].split(separator: ",").compactMap { Double($0) }
            if parts.count == 4 {
                windowRect = CGRect(x: parts[0], y: parts[1], width: parts[2], height: parts[3])
            }
            i += 2
        } else {
            i += 1
        }
    }

    // Capture the window image
    guard let image = CGWindowListCreateImage(.null, .optionIncludingWindow, windowID, [.boundsIgnoreFraming, .bestResolution]) else {
        fputs("error: CGWindowListCreateImage failed for window \(windowID)\n", stderr)
        return 1
    }

    // Draw click point crosshair if provided
    var finalImage = image
    if let clickPoint = clickPoint, let windowRect = windowRect {
        let imageWidth = CGFloat(image.width)
        let imageHeight = CGFloat(image.height)
        let scaleX = imageWidth / windowRect.width
        let scaleY = imageHeight / windowRect.height
        let localX = (clickPoint.x - windowRect.origin.x) * scaleX
        let localY = (clickPoint.y - windowRect.origin.y) * scaleY

        let colorSpace = CGColorSpaceCreateDeviceRGB()
        if let ctx = CGContext(data: nil, width: image.width, height: image.height,
                               bitsPerComponent: 8, bytesPerRow: 0, space: colorSpace,
                               bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) {
            ctx.draw(image, in: CGRect(x: 0, y: 0, width: imageWidth, height: imageHeight))

            // Flip Y for CoreGraphics drawing (origin is bottom-left)
            let drawX = localX
            let drawY = imageHeight - localY

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
            ctx.addEllipse(in: CGRect(x: drawX - radius, y: drawY - radius, width: radius * 2, height: radius * 2))
            ctx.strokePath()

            if let annotatedImage = ctx.makeImage() {
                finalImage = annotatedImage
            }
        }
    }

    // Write PNG
    let bitmapRep = NSBitmapImageRep(cgImage: finalImage)
    guard let pngData = bitmapRep.representation(using: .png, properties: [:]) else {
        fputs("error: failed to create PNG data\n", stderr)
        return 1
    }

    do {
        try pngData.write(to: URL(fileURLWithPath: outputPath))
        // Print the path to stdout so the parent can confirm success
        print(outputPath)
        return 0
    } catch {
        fputs("error: failed to write screenshot: \(error)\n", stderr)
        return 1
    }
}

exit(main())
