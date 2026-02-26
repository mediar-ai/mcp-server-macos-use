# Project: mcp-server-macos-use

## Build Rules (overrides global CLAUDE.md)

After making any changes to `Sources/`, **always rebuild immediately**:

```
xcrun --toolchain com.apple.dt.toolchain.XcodeDefault swift build 2>&1 | tail -5
```

Do NOT wait for the user to build. Rebuild, check for errors, fix if needed.

## Testing MCP Changes

**IMPORTANT: After rebuilding, do NOT call MCP tools (e.g. `mcp__macos-use__*`) directly.** Claude Code's MCP connection still points at the old server process. You must either:

1. **Use the test script** (preferred) — it spawns a fresh server binary each time:
   ```
   python3 scripts/test_mcp.py
   ```
2. **Ask the user to reconnect MCP** (`/mcp` in Claude Code) so the live MCP tools pick up the new binary.

Calling MCP tools directly after a rebuild without reconnecting will test the OLD code, not your changes.

## Toolchain Note

Always use `xcrun --toolchain com.apple.dt.toolchain.XcodeDefault swift` for both building and running Swift scripts. The system Swift is mismatched (SDK 6.2 vs compiler 6.1).

## MCP Response Files

MCP tool responses are saved as JSON files to `/tmp/macos-use/` to reduce context bloat. Each tool call returns a compact summary + file path instead of the full traversal data.

**Reading responses:**
- The summary includes status, PID, app name, file path, and a brief description of what happened
- To find specific elements: `grep -n "AXButton" /tmp/macos-use/<file>.json`
- To get coordinates for an element: `grep -B2 -A4 "search text" /tmp/macos-use/<file>.json`
- Don't read entire files into context — use targeted grep searches
- For diffs, the summary includes counts of added/removed/modified elements and up to 3 notable text changes

## Coordinate System

- 3 screens: Screen 0 built-in (0,0 top-left), Screen 1 left external (x≈-3840), Screen 2 right external (x≈3456)
- backingScaleFactor=1.0 on all screens — 1pt == 1px, no Retina scaling needed
- AX coordinates and CGEvent coordinates are in the same logical point space
- click_and_traverse receives (x, y, width, height) of the element's top-left+size from traversal; it centers automatically
