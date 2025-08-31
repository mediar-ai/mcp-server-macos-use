// swift-tools-version: 5.9
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(
    name: "mcp-server-macos-use",
    platforms: [
        .macOS(.v13)
    ],
    dependencies: [
        .package(url: "https://github.com/modelcontextprotocol/swift-sdk.git", from: "0.7.1"),
        .package(url: "https://github.com/mediar-ai/MacosUseSDK.git", branch: "main")
    ],
    targets: [
        // Targets are the basic building blocks of a package, defining a module or a test suite.
        // Targets can depend on other targets in this package and products from dependencies.
        .executableTarget(
            name: "mcp-server-macos-use",
            dependencies: [
                .product(name: "MCP", package: "swift-sdk"),
                .product(name: "MacosUseSDK", package: "MacosUseSDK")
            ]
        ),
    ]
)
