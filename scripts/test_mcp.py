#!/usr/bin/env python3
"""
MCP client test script for mcp-server-macos-use.

Spawns the built server, communicates over stdio using JSON-RPC,
and exercises the tools without needing Claude Code or manual reconnect.

Usage (from project root):
    python3 scripts/test_mcp.py
    python3 scripts/test_mcp.py --test tools
    python3 scripts/test_mcp.py --test cap
    python3 scripts/test_mcp.py --test click --app Messages --search "Krishna"
"""

import json
import os
import subprocess
import sys
import threading
import argparse
import queue
import re
from typing import Any, Optional

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SERVER_BIN = os.path.join(PROJECT_ROOT, ".build", "debug", "mcp-server-macos-use")


# ---------------------------------------------------------------------------
# Low-level MCP client (binary, newline-delimited JSON-RPC over stdio)
# ---------------------------------------------------------------------------

class MCPClient:
    def __init__(self, binary: str, timeout: float = 30.0):
        print(f"[client] Spawning server: {binary}", flush=True)
        if not os.path.exists(binary):
            raise FileNotFoundError(f"Server binary not found: {binary}")
        self.timeout = timeout
        self.proc = subprocess.Popen(
            [binary],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        self._id = 0
        self._stderr_lines: list[str] = []
        threading.Thread(target=self._drain_stderr, daemon=True).start()
        print(f"[client] Server PID: {self.proc.pid}", flush=True)

    def _drain_stderr(self):
        assert self.proc.stderr is not None
        for line in self.proc.stderr:
            decoded = line.decode("utf-8", errors="replace").rstrip()
            self._stderr_lines.append(decoded)

    def _next_id(self) -> int:
        self._id += 1
        return self._id

    def send(self, method: str, params: Optional[dict] = None, notify: bool = False) -> Optional[dict]:
        msg: dict[str, Any] = {"jsonrpc": "2.0", "method": method}
        if not notify:
            msg["id"] = self._next_id()
        if params is not None:
            msg["params"] = params

        data = (json.dumps(msg) + "\n").encode("utf-8")
        assert self.proc.stdin is not None
        self.proc.stdin.write(data)
        self.proc.stdin.flush()

        if notify:
            return None

        return self._read_response()

    def _read_response(self) -> dict:
        assert self.proc.stdout is not None
        result_q: queue.Queue = queue.Queue()

        def reader():
            try:
                while True:
                    line = self.proc.stdout.readline()
                    if not line:
                        result_q.put(RuntimeError("Server closed stdout"))
                        return
                    line = line.strip()
                    if line:
                        result_q.put(json.loads(line.decode("utf-8")))
                        return
            except Exception as e:
                result_q.put(e)

        t = threading.Thread(target=reader, daemon=True)
        t.start()
        try:
            result = result_q.get(timeout=self.timeout)
        except queue.Empty:
            raise TimeoutError(f"No response from server after {self.timeout}s")
        if isinstance(result, Exception):
            raise result
        return result

    def initialize(self) -> dict:
        print("[client] → initialize", flush=True)
        resp = self.send("initialize", {
            "protocolVersion": "2024-11-05",
            "capabilities": {},
            "clientInfo": {"name": "test-client", "version": "1.0"},
        })
        print("[client] ← initialize OK", flush=True)
        self.send("notifications/initialized", notify=True)
        return resp

    def list_tools(self) -> list:
        print("[client] → tools/list", flush=True)
        resp = self.send("tools/list", {})
        tools = resp.get("result", {}).get("tools", [])
        print(f"[client] ← tools/list: {len(tools)} tools", flush=True)
        return tools

    def call_tool(self, name: str, arguments: dict) -> "ToolResult":
        print(f"[client] → tools/call {name} {arguments}", flush=True)
        resp = self.send("tools/call", {"name": name, "arguments": arguments})
        result = resp.get("result", {})
        content = result.get("content", [])
        text = content[0].get("text", "") if content else ""
        print(f"[client] ← tools/call {name} done", flush=True)
        return ToolResult(text)

    def close(self):
        try:
            if self.proc.stdin:
                self.proc.stdin.close()
            self.proc.wait(timeout=5)
        except Exception:
            self.proc.kill()

    def dump_stderr(self, n: int = 30):
        if self._stderr_lines:
            print(f"\n[server stderr (last {n} lines)]:")
            for line in self._stderr_lines[-n:]:
                print(f"  {line}")


# ---------------------------------------------------------------------------
# Tool result parser — handles the compact summary format
# ---------------------------------------------------------------------------

class ToolResult:
    """Parses the compact text summary returned by MCP tools."""
    def __init__(self, text: str):
        self.raw = text
        self._fields = {}
        for line in text.split("\n"):
            if ": " in line and not line.startswith("  "):
                key, _, val = line.partition(": ")
                self._fields[key.strip()] = val.strip()

    @property
    def status(self) -> str:
        return self._fields.get("status", "unknown")

    @property
    def pid(self) -> Optional[int]:
        v = self._fields.get("pid")
        return int(v) if v else None

    @property
    def app(self) -> Optional[str]:
        return self._fields.get("app")

    @property
    def file(self) -> Optional[str]:
        return self._fields.get("file")

    @property
    def summary(self) -> str:
        return self._fields.get("summary", "")

    @property
    def error(self) -> Optional[str]:
        return self._fields.get("error") or self._fields.get("traversal_error")

    def load_full_json(self) -> dict:
        """Load the full JSON response file written by the server."""
        if not self.file or not os.path.exists(self.file):
            return {}
        with open(self.file, "r") as f:
            return json.load(f)

    def __repr__(self):
        return f"ToolResult(status={self.status}, pid={self.pid}, app={self.app}, summary={self.summary!r})"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def ok(msg: str):   print(f"  ✅ {msg}", flush=True)
def fail(msg: str): print(f"  ❌ {msg}", flush=True)
def info(msg: str): print(f"  ℹ️  {msg}", flush=True)

def section(title: str):
    print(f"\n{'='*60}", flush=True)
    print(f"  {title}", flush=True)
    print(f"{'='*60}", flush=True)


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def test_tools_list(client: MCPClient) -> bool:
    section("Test: tools/list")
    tools = client.list_tools()
    expected = {
        "macos-use_open_application_and_traverse",
        "macos-use_click_and_traverse",
        "macos-use_type_and_traverse",
        "macos-use_press_key_and_traverse",
        "macos-use_scroll_and_traverse",
        "macos-use_refresh_traversal",
    }
    found = {t["name"] for t in tools}
    missing = expected - found
    extra = found - expected
    if not missing:
        ok(f"All {len(expected)} expected tools present")
    else:
        fail(f"Missing tools: {missing}")
    if extra:
        info(f"Extra tools: {extra}")
    return len(missing) == 0


def test_open_app(client: MCPClient, app: str = "TextEdit") -> Optional[int]:
    section(f"Test: open {app}")
    result = client.call_tool("macos-use_open_application_and_traverse", {"identifier": app})

    if result.status == "error":
        fail(f"Error: {result.error}")
        return None

    ok(f"Opened {result.app!r} (PID: {result.pid})")
    info(f"Summary: {result.summary}")

    # Verify full JSON file was written
    data = result.load_full_json()
    if data:
        elements = data.get("traversal", {}).get("elements", [])
        stats = data.get("traversal", {}).get("stats", {})
        ok(f"Full JSON: {len(elements)} elements, truncated={stats.get('truncated', False)}")
    else:
        fail("Could not load full JSON response file")

    return result.pid


def test_click(client: MCPClient, pid: int, search: Optional[str] = None) -> bool:
    section(f"Test: click {'matching ' + repr(search) if search else 'first interactable'}")

    # Get current state
    result = client.call_tool("macos-use_refresh_traversal", {"pid": pid})
    data = result.load_full_json()
    elements = data.get("traversal", {}).get("elements", [])

    if not elements:
        fail("No elements from refresh")
        return False

    candidate = None

    if search:
        needle = search.lower()
        for e in elements:
            text = (e.get("text") or "").lower()
            if needle in text and e.get("in_viewport"):
                candidate = e
                break
        if not candidate:
            fail(f"No in-viewport element matching {search!r}")
            return False
    else:
        for e in elements:
            role = e.get("role", "")
            if (e.get("in_viewport") and e.get("text", "").strip()
                    and e.get("width") and e.get("height")
                    and ("Button" in role or "StaticText" in role)):
                candidate = e
                break

    if not candidate:
        fail("No suitable clickable element found")
        return False

    x, y = candidate["x"], candidate["y"]
    w, h = candidate.get("width", 0), candidate.get("height", 0)
    text = (candidate.get("text") or "")[:60]
    info(f"Clicking: {candidate.get('role')} | {text!r} | ({x},{y}) {w}x{h}")

    result = client.call_tool("macos-use_click_and_traverse", {
        "pid": pid, "x": x, "y": y, "width": w, "height": h,
    })

    if result.status == "success":
        ok(f"Click succeeded: {result.summary}")
        return True
    else:
        fail(f"Click failed: {result.error}")
        return False


def test_refresh(client: MCPClient, pid: int) -> bool:
    section("Test: refresh_traversal")
    result = client.call_tool("macos-use_refresh_traversal", {"pid": pid})

    if result.status != "success":
        fail(f"Refresh failed: {result.error}")
        return False

    data = result.load_full_json()
    elements = data.get("traversal", {}).get("elements", [])
    stats = data.get("traversal", {}).get("stats", {})

    ok(f"Refresh: {len(elements)} elements, {stats.get('visible_elements_count', '?')} visible")
    return True


def test_type(client: MCPClient, pid: int) -> bool:
    section("Test: type_and_traverse")
    result = client.call_tool("macos-use_type_and_traverse", {
        "pid": pid, "text": "hello test",
    })
    if result.status == "success":
        ok(f"Type succeeded: {result.summary}")
        return True
    else:
        fail(f"Type failed: {result.error}")
        return False


def test_press_key(client: MCPClient, pid: int) -> bool:
    section("Test: press_key_and_traverse")
    # Press Escape — safe, doesn't destructively change state
    result = client.call_tool("macos-use_press_key_and_traverse", {
        "pid": pid, "keyName": "Escape",
    })
    if result.status == "success":
        ok(f"Press key succeeded: {result.summary}")
        return True
    else:
        fail(f"Press key failed: {result.error}")
        return False


def test_element_cap(client: MCPClient) -> bool:
    """Test that the 5000 element cap works by opening Finder (which has many elements)."""
    section("Test: element cap (5000 limit)")

    # Open Finder which typically has lots of elements
    result = client.call_tool("macos-use_open_application_and_traverse", {
        "identifier": "com.apple.finder",
    })

    if result.status != "success":
        fail(f"Could not open Finder: {result.error}")
        return False

    pid = result.pid
    data = result.load_full_json()
    elements = data.get("traversal", {}).get("elements", [])
    stats = data.get("traversal", {}).get("stats", {})
    count = len(elements)
    truncated = stats.get("truncated", False)

    info(f"Finder: {count} elements, truncated={truncated}")

    if count <= 5000:
        ok(f"Element count ({count}) is within cap of 5000")
    else:
        fail(f"Element count ({count}) exceeds cap of 5000!")
        return False

    # Also verify the truncated field is present in stats
    if "truncated" in stats:
        ok(f"'truncated' field present in stats (value: {truncated})")
    else:
        fail("'truncated' field missing from stats")
        return False

    # For a real stress test, open Downloads in Finder and traverse again
    # But just verifying the field exists and count <= 5000 is sufficient
    info("To stress-test: open a folder with 1000s of files and call refresh_traversal")

    return True


def test_visible_elements(client: MCPClient, pid: int) -> bool:
    """Test that compact summaries include file_size, guidance, and visible_elements."""
    section("Test: visible_elements in compact summary")
    passed = True

    # 1. Full traversal case (refresh) — should have visible_elements from traversal
    result = client.call_tool("macos-use_refresh_traversal", {"pid": pid})
    raw = result.raw

    # Check file_size line
    if "file_size:" in raw and "bytes" in raw and "elements)" in raw:
        ok("Refresh summary has file_size line")
    else:
        fail("Refresh summary missing file_size line")
        passed = False

    # Check guidance line
    if "DO NOT read the full file" in raw:
        ok("Refresh summary has guidance line")
    else:
        fail("Refresh summary missing guidance line")
        passed = False

    # Check visible_elements section
    if "visible_elements:" in raw:
        # Count indented element lines
        vis_lines = [l for l in raw.split("\n") if l.startswith("  [AX")]
        ok(f"Refresh summary has visible_elements ({len(vis_lines)} elements)")
        # Verify format: [AXRole] "text" (x,y w×h)
        if vis_lines:
            sample = vis_lines[0]
            if "] \"" in sample:
                ok(f"Element format looks correct: {sample[:80]}")
            else:
                fail(f"Unexpected element format: {sample[:80]}")
                passed = False
    else:
        # It's possible (but unlikely) there are zero visible interactive elements
        info("No visible_elements section — may be OK if no interactive elements visible")

    # 2. Diff case (click) — should have visible_elements from added elements
    data = result.load_full_json()
    elements = data.get("traversal", {}).get("elements", [])
    candidate = None
    for e in elements:
        if (e.get("in_viewport") and e.get("text", "").strip()
                and e.get("width") and e.get("height")
                and ("Button" in e.get("role", "") or "StaticText" in e.get("role", ""))):
            candidate = e
            break

    if candidate:
        click_result = client.call_tool("macos-use_click_and_traverse", {
            "pid": pid, "x": candidate["x"], "y": candidate["y"],
            "width": candidate.get("width", 0), "height": candidate.get("height", 0),
        })
        click_raw = click_result.raw
        if "file_size:" in click_raw:
            ok("Click summary has file_size line")
        else:
            fail("Click summary missing file_size line")
            passed = False
        if "DO NOT read the full file" in click_raw:
            ok("Click summary has guidance line")
        else:
            fail("Click summary missing guidance line")
            passed = False
        # visible_elements may or may not be present depending on diff.added
        if "visible_elements:" in click_raw:
            vis_lines = [l for l in click_raw.split("\n") if l.startswith("  [AX")]
            ok(f"Click summary has visible_elements ({len(vis_lines)} elements)")
        else:
            info("Click summary has no visible_elements (no visible added elements in diff)")
    else:
        info("Skipped click sub-test — no suitable element to click")

    return passed


def test_scroll(client: MCPClient, pid: int) -> bool:
    section("Test: scroll_and_traverse")
    # Get an element position to scroll at
    result = client.call_tool("macos-use_refresh_traversal", {"pid": pid})
    data = result.load_full_json()
    elements = data.get("traversal", {}).get("elements", [])

    # Find a scrollable area
    target = None
    for e in elements:
        if e.get("in_viewport") and e.get("x") is not None and e.get("y") is not None:
            target = e
            break

    if not target:
        fail("No element to scroll at")
        return False

    x, y = target["x"], target["y"]
    result = client.call_tool("macos-use_scroll_and_traverse", {
        "pid": pid, "x": x, "y": y, "deltaY": 3,
    })
    if result.status == "success":
        ok(f"Scroll succeeded: {result.summary}")
        return True
    else:
        fail(f"Scroll failed: {result.error}")
        return False


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="MCP server test client")
    parser.add_argument("--test", choices=[
        "all", "tools", "open", "click", "refresh", "type", "press", "scroll", "cap", "visible"
    ], default="all")
    parser.add_argument("--app", default="TextEdit",
                        help="App to open for tests (default: TextEdit)")
    parser.add_argument("--search", default=None,
                        help="Text to search for in click test")
    parser.add_argument("--timeout", type=float, default=30.0,
                        help="Seconds to wait for each server response")
    args = parser.parse_args()

    client = MCPClient(SERVER_BIN, timeout=args.timeout)
    results = []

    try:
        init_resp = client.initialize()
        server_info = init_resp.get("result", {}).get("serverInfo", {})
        ok(f"Server initialized: {server_info}")

        pid = None

        if args.test in ("all", "tools"):
            results.append(("tools/list", test_tools_list(client)))

        if args.test in ("all", "cap"):
            results.append(("element_cap", test_element_cap(client)))

        if args.test in ("all", "open"):
            pid = test_open_app(client, args.app)
            results.append(("open_app", pid is not None))

        if args.test in ("all", "refresh"):
            if pid is None:
                pid = test_open_app(client, args.app)
            if pid:
                results.append(("refresh", test_refresh(client, pid)))

        if args.test in ("all", "visible"):
            if pid is None:
                pid = test_open_app(client, args.app)
            if pid:
                results.append(("visible_elements", test_visible_elements(client, pid)))

        if args.test in ("all", "click"):
            if pid is None:
                pid = test_open_app(client, args.app)
            if pid:
                results.append(("click", test_click(client, pid, search=args.search)))
            else:
                fail("Skipping click test — no PID")

        if args.test in ("all", "scroll"):
            if pid is None:
                pid = test_open_app(client, args.app)
            if pid:
                results.append(("scroll", test_scroll(client, pid)))

        if args.test in ("all", "press"):
            if pid is None:
                pid = test_open_app(client, args.app)
            if pid:
                results.append(("press_key", test_press_key(client, pid)))

        if args.test in ("all", "type"):
            if pid is None:
                pid = test_open_app(client, args.app)
            if pid:
                results.append(("type", test_type(client, pid)))

        # Summary
        section("Summary")
        passed = sum(1 for _, r in results if r)
        total = len(results)
        for name, r in results:
            symbol = "✅" if r else "❌"
            print(f"  {symbol} {name}", flush=True)
        print(flush=True)
        symbol = "✅" if passed == total else "❌"
        print(f"  {symbol} {passed}/{total} tests passed", flush=True)

        if passed < total:
            print("\n[server stderr (last 30 lines)]:")
            client.dump_stderr()
            sys.exit(1)

    except TimeoutError as e:
        print(f"\n⚠️  TIMEOUT: {e}", flush=True)
        client.dump_stderr()
        sys.exit(1)
    except Exception as e:
        import traceback
        print(f"\n⚠️  ERROR: {e}", flush=True)
        traceback.print_exc()
        client.dump_stderr()
        sys.exit(1)
    finally:
        client.close()


if __name__ == "__main__":
    main()
