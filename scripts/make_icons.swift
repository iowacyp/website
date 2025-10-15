import AppKit
import CoreImage

let projectPath = "/Users/cox/Documents/iowacyp-site-starter"
let symbolURL = URL(fileURLWithPath: projectPath + "/content/Media/branding_symbol.png")
let outputDir = URL(fileURLWithPath: projectPath + "/src/assets/pwa")
let bgColor = NSColor(calibratedRed: 0.121, green: 0.302, blue: 0.478, alpha: 1.0)
let targetSizes: [CGFloat] = [512, 192]

guard let symbolCI = CIImage(contentsOf: symbolURL) else {
    fatalError("Could not load symbol image")
}

guard let filter = CIFilter(name: "CIColorMonochrome") else {
    fatalError("Could not create filter")
}
filter.setDefaults()
filter.setValue(symbolCI, forKey: kCIInputImageKey)
filter.setValue(CIColor(red: 1, green: 1, blue: 1), forKey: kCIInputColorKey)
filter.setValue(1.0, forKey: kCIInputIntensityKey)

guard let monoImage = filter.value(forKey: kCIOutputImageKey) as? CIImage else {
    fatalError("Filter failed")
}

let context = CIContext()

guard let cgWhiteSymbol = context.createCGImage(monoImage, from: monoImage.extent) else {
    fatalError("Could not create CGImage")
}

for size in targetSizes {
    let intSize = Int(size)
    guard let rep = NSBitmapImageRep(bitmapDataPlanes: nil,
                                     pixelsWide: intSize,
                                     pixelsHigh: intSize,
                                     bitsPerSample: 8,
                                     samplesPerPixel: 4,
                                     hasAlpha: true,
                                     isPlanar: false,
                                     colorSpaceName: .deviceRGB,
                                     bytesPerRow: intSize * 4,
                                     bitsPerPixel: 32) else {
        fatalError("Failed to create bitmap rep")
    }

    NSGraphicsContext.saveGraphicsState()
    if let context = NSGraphicsContext(bitmapImageRep: rep) {
        NSGraphicsContext.current = context
        context.cgContext.setFillColor(bgColor.cgColor)
        context.cgContext.fill(CGRect(x: 0, y: 0, width: size, height: size))
        context.cgContext.interpolationQuality = .high
        context.cgContext.draw(cgWhiteSymbol, in: CGRect(x: 0, y: 0, width: size, height: size))
        NSGraphicsContext.current = nil
    }
    NSGraphicsContext.restoreGraphicsState()

    if let data = rep.representation(using: .png, properties: [:]) {
        let filename = size == 512 ? "icon-512.png" : "icon-192.png"
        let url = outputDir.appendingPathComponent(filename)
        do {
            try data.write(to: url)
        } catch {
            fatalError("Failed to write icon: \(error)")
        }
    }
}
