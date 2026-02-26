#!/usr/bin/env python3
"""
MCP client test script for mcp-server-macos-use.

Spawns the built server, communicates over stdio using JSON-RPC,
and exercises the tools without needing Claude Code or manual reconnect.

Usage (from project root):
    python3 scripts/test_mcp.py
    python3 scripts/test_mcp.py --test tools
    python3 scripts/test_mcp.py --test click
"""

import json
import os
import subprocess
import sys
import threading
import argparse
from typing import Any, Optional

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SERVER_BIN = os.path.join(PROJECT_ROOT, ".build", "debug", "mcp-server-macos-use")


# ---------------------------------------------------------------------------
# Low-level MCP client (binary, newline-delimited JSON-RPC over stdio)
# ---------------------------------------------------------------------------

class MCPClient:
    def __init__(self, binary: str, timeout: float = 20.0):
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
        # Drain stderr in background so server doesn't block on it
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
        """Read one newline-terminated JSON response with timeout."""
        assert self.proc.stdout is not None
        import queue, threading

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
        print(f"[client] ← initialize OK", flush=True)
        self.send("notifications/initialized", notify=True)
        return resp

    def list_tools(self) -> list:
        print("[client] → tools/list", flush=True)
        resp = self.send("tools/list", {})
        tools = resp.get("result", {}).get("tools", [])
        print(f"[client] ← tools/list: {len(tools)} tools", flush=True)
        return tools

    def call_tool(self, name: str, arguments: dict) -> dict:
        print(f"[client] → tools/call {name} {list(arguments.keys())}", flush=True)
        resp = self.send("tools/call", {"name": name, "arguments": arguments})
        print(f"[client] ← tools/call {name} done", flush=True)
        return resp.get("result", {})

    def close(self):
        try:
            if self.proc.stdin:
                self.proc.stdin.close()
            self.proc.wait(timeout=5)
        except Exception:
            self.proc.kill()

    def dump_stderr(self):
        if self._stderr_lines:
            print("\n[server stderr (last 20 lines)]:")
            for line in self._stderr_lines[-20:]:
                print(f"  {line}")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def ok(msg: str):  print(f"  ✅ {msg}", flush=True)
def fail(msg: str): print(f"  ❌ {msg}", flush=True)
def info(msg: str): print(f"  ℹ️  {msg}", flush=True)

def section(title: str):
    print(f"\n{'='*60}", flush=True)
    print(f"  {title}", flush=True)
    print(f"{'='*60}", flush=True)

def parse_tool_result(result: dict) -> str:
    content = result.get("content", [])
    if content and isinstance(content, list):
        return content[0].get("text", "")
    return str(result)

def parse_traversal(result: dict) -> dict:
    text = parse_tool_result(result)
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return {}


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
        "macos-use_refresh_traversal",
    }
    found = {t["name"] for t in tools}
    missing = expected - found
    extra = found - expected
    if not missing and not extra:
        ok(f"All {len(expected)} expected tools present")
    else:
        if missing: fail(f"Missing tools: {missing}")
        if extra:   info(f"Extra tools: {extra}")
    return len(missing) == 0


def test_open_app(client: MCPClient, app: str = "TextEdit") -> Optional[int]:
    section(f"Test: open {app}")
    result = client.call_tool("macos-use_open_application_and_traverse", {"identifier": app})
    data = parse_traversal(result)

    open_result = data.get("openResult") or {}
    pid = data.get("traversalPid") or open_result.get("pid")
    app_name = open_result.get("appName", "")
    elements = data.get("traversal", {}).get("elements", [])

    if app_name:
        ok(f"Opened {app_name!r} (pid={pid})")
    else:
        fail(f"No appName in result; keys: {list(data.keys())}")

    if elements:
        ok(f"Traversal returned {len(elements)} elements")
        roles = {}
        for e in elements:
            r = e.get("role", "?").split(" ")[0]
            roles[r] = roles.get(r, 0) + 1
        info(f"Roles: { {k: v for k, v in sorted(roles.items(), key=lambda x: -x[1])[:6]} }")
    else:
        fail("No elements in traversal")

    return pid


def test_click_first_interactable(client: MCPClient, pid: int, search: Optional[str] = None) -> bool:
    """Generic test: find an in-viewport clickable element and click it.
    If search is given, finds the first element whose text contains it (case-insensitive).
    Otherwise picks the first narrow AXStaticText row or AXButton in viewport.
    Verifies that clicking produces some UI change (diff)."""
    section(f"Test: click {'element matching ' + repr(search) if search else 'first interactable element'}")

    result = client.call_tool("macos-use_refresh_traversal", {"pid": pid})
    data = parse_traversal(result)
    elements = data.get("traversal", {}).get("elements", [])

    candidate = None

    if search:
        needle = search.lower()
        # Prefer in-viewport sidebar row; fall back to any matching StaticText (scroll will handle it)
        for require_vp in (True, False):
            for e in elements:
                text = (e.get("text") or "").lower()
                role = e.get("role", "")
                w = e.get("width", 0)
                in_vp = e.get("in_viewport", False)
                if needle in text and "StaticText" in role and 50 < w <= 400:
                    if not require_vp or in_vp:
                        candidate = e
                        break
            if candidate:
                break
        if candidate is None:
            fail(f"No StaticText element containing {search!r} found")
            info("All elements with matching text:")
            for e in elements:
                if search.lower() in (e.get("text") or "").lower():
                    info(f"  {e.get('role')} in_viewport={e.get('in_viewport')} w={e.get('width')} | {(e.get('text') or '')[:60]}")
            return False
    else:
        # Pick a good target: prefer an AXStaticText sidebar/list row (narrow width,
        # has text, in_viewport). Fall back to any AXButton in viewport.
        for e in elements:
            role = e.get("role", "")
            in_vp = e.get("in_viewport", False)
            text = (e.get("text") or "").strip()
            w = e.get("width", 0)
            if not in_vp or not text:
                continue
            if "StaticText" in role and 50 < w <= 400:
                candidate = e
                break
        if candidate is None:
            for e in elements:
                role = e.get("role", "")
                if e.get("in_viewport") and "Button" in role and (e.get("text") or "").strip():
                    candidate = e
                    break

    if not candidate:
        fail("No suitable interactable element found in traversal")
        return False

    x, y, w, h = candidate["x"], candidate["y"], candidate["width"], candidate["height"]
    text = (candidate.get("text") or "")[:60]
    info(f"Clicking: {candidate.get('role')} | {text!r} | x={x}, y={y}, w={w}, h={h}")

    result = client.call_tool("macos-use_click_and_traverse", {
        "pid": pid, "x": x, "y": y, "width": w, "height": h,
    })
    data = parse_traversal(result)
    diff = data.get("diff", {})
    added   = diff.get("added", [])
    removed = diff.get("removed", [])
    modified = diff.get("modified", [])

    if added or removed or modified:
        ok(f"UI changed: {len(added)} added, {len(removed)} removed, {len(modified)} modified")
        return True
    else:
        fail("No UI change after click")
        info(f"Clicked: {text!r} at ({x},{y})")
        client.dump_stderr()
        return False


def test_refresh(client: MCPClient, pid: int) -> bool:
    section("Test: refresh_traversal")
    result = client.call_tool("macos-use_refresh_traversal", {"pid": pid})
    data = parse_traversal(result)
    elements = data.get("traversal", {}).get("elements", [])
    if elements:
        ok(f"Refresh returned {len(elements)} elements")
        return True
    else:
        fail("Refresh returned no elements")
        return False


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="MCP server test client")
    parser.add_argument("--test", choices=["all", "tools", "open", "click", "refresh"],
                        default="all")
    parser.add_argument("--app", default="Messages",
                        help="App to open for open/click/refresh tests (default: Messages)")
    parser.add_argument("--search", default=None,
                        help="Text to search for in click test (e.g. 'Krishna')")
    parser.add_argument("--timeout", type=float, default=20.0,
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
            results.append(test_tools_list(client))

        if args.test in ("all", "open"):
            pid = test_open_app(client, args.app)
            results.append(pid is not None)

        if args.test in ("all", "click"):
            if pid is None:
                pid = test_open_app(client, args.app)
            if pid:
                results.append(test_click_first_interactable(client, pid, search=args.search))
            else:
                fail("Skipping click test — no PID")

        if args.test in ("all", "refresh"):
            if pid is None:
                pid = test_open_app(client, args.app)
            if pid:
                results.append(test_refresh(client, pid))

        section("Summary")
        passed = sum(1 for r in results if r)
        total = len(results)
        symbol = "✅" if passed == total else "❌"
        print(f"  {symbol} {passed}/{total} tests passed", flush=True)

    except TimeoutError as e:
        print(f"\n⚠️  TIMEOUT: {e}", flush=True)
        client.dump_stderr()
        sys.exit(1)
    except Exception as e:
        print(f"\n⚠️  ERROR: {e}", flush=True)
        client.dump_stderr()
        sys.exit(1)
    finally:
        client.close()


if __name__ == "__main__":
    main()
