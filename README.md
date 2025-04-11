# mcp-server-macos-use

This project implements an [MCP (Multi-Capability Protocol)](https://github.com/sourcegraph/managed-capabilities-protocol) server in Swift. It allows controlling macOS applications by leveraging the accessibility APIs, primarily through the `MacosUseSDK`.

The server listens for MCP commands over standard input/output (`stdio`) and exposes several tools to interact with applications.

## Available Tools

The server exposes the following tools via the `CallTool` MCP method:

1.  **`macos-use_open_application_and_traverse`**
    *   **Description:** Opens or activates a specified application and then traverses its accessibility tree.
    *   **Parameters:**
        *   `identifier` (String, Required): The application's name, bundle ID, or file path.

2.  **`macos-use_click_and_traverse`**
    *   **Description:** Simulates a mouse click at specific coordinates within the window of the target application (identified by PID) and then traverses its accessibility tree.
    *   **Parameters:**
        *   `pid` (Number, Required): The Process ID (PID) of the target application.
        *   `x` (Number, Required): The X-coordinate for the click (relative to the window/screen, depending on SDK behavior).
        *   `y` (Number, Required): The Y-coordinate for the click.

3.  **`macos-use_type_and_traverse`**
    *   **Description:** Simulates typing text into the target application (identified by PID) and then traverses its accessibility tree.
    *   **Parameters:**
        *   `pid` (Number, Required): The Process ID (PID) of the target application.
        *   `text` (String, Required): The text to be typed.

4.  **`macos-use_press_key_and_traverse`**
    *   **Description:** Simulates pressing a specific keyboard key (e.g., 'Enter', 'Tab', 'a', 'B') with optional modifier keys held down, targeting the application specified by PID, and then traverses its accessibility tree.
    *   **Parameters:**
        *   `pid` (Number, Required): The Process ID (PID) of the target application.
        *   `keyName` (String, Required): The name of the key (e.g., `Return`, `Escape`, `ArrowUp`, `Delete`, `a`, `B`). Case-sensitive for letters if no modifiers are active.
        *   `modifierFlags` (Array<String>, Optional): An array of modifier keys to hold during the press. Valid values: `CapsLock` (or `Caps`), `Shift`, `Control` (or `Ctrl`), `Option` (or `Opt`, `Alt`), `Command` (or `Cmd`), `Function` (or `Fn`), `NumericPad` (or `Numpad`), `Help`.

5.  **`macos-use_refresh_traversal`**
    *   **Description:** Only performs the accessibility tree traversal for the specified application (identified by PID). Useful for getting the current UI state without performing an action.
    *   **Parameters:**
        *   `pid` (Number, Required): The Process ID (PID) of the application to traverse.

**Common Optional Parameters (for `CallTool`)**

These can potentially be passed in the `arguments` object for any tool call to override default `MacosUseSDK` behavior (refer to `ActionOptions` in the code):

*   `traverseBefore` (Boolean, Optional): Traverse accessibility tree before the primary action.
*   `traverseAfter` (Boolean, Optional): Traverse accessibility tree after the primary action (usually defaults to true).
*   `showDiff` (Boolean, Optional): Include a diff between traversals (if applicable).
*   `onlyVisibleElements` (Boolean, Optional): Limit traversal to visible elements.
*   `showAnimation` (Boolean, Optional): Show visual feedback animation for actions.
*   `animationDuration` (Number, Optional): Duration of the feedback animation.
*   `delayAfterAction` (Number, Optional): Add a delay after performing the action.

## Dependencies

*   [MCP.swift](https://github.com/sourcegraph/managed-capabilities-protocol) (Swift implementation of the MCP protocol)
*   `MacosUseSDK` (Assumed local or external Swift package providing macOS control functionality)
*   Swift Standard Library
*   Foundation
*   CoreGraphics

## Building and Running

```bash
# Example build command (adjust as needed, use 'debug' for development)
swift build -c debug # Or 'release' for production

# Running the server (it communicates via stdin/stdout)
./.build/debug/mcp-server-macos-use
```

**Integrating with Clients (Example: Claude Desktop)**

Once built, you need to tell your client application where to find the server executable. For example, to configure Claude Desktop, you might add the following to its configuration:

```json
{
    "mcpServers": {
        "mcp-server-macos-use": {
            "command": "/path/to/your/project/mcp-server-macos-use/.build/debug/mcp-server-macos-use"
        }
    }
}
```

*Replace `/path/to/your/project/` with the actual absolute path to your `mcp-server-macos-use` directory.*

## Help

Reach out to matt@mediar.ai
Discord: m13v_