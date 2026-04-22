"use client";

import { useState } from "react";
import { trackGetStartedClick } from "@seo/components";

type Tab = {
  id: string;
  label: string;
  path?: string;
  command?: string;
  config?: string;
};

const TABS: Tab[] = [
  {
    id: "claude-code",
    label: "Claude Code",
    command: "claude mcp add macos-use -- npx -y mcp-server-macos-use",
  },
  {
    id: "cursor",
    label: "Cursor",
    path: "~/.cursor/mcp.json",
    config: `{
  "mcpServers": {
    "macos-use": {
      "command": "npx",
      "args": ["-y", "mcp-server-macos-use"]
    }
  }
}`,
  },
  {
    id: "claude-desktop",
    label: "Claude Desktop",
    path: "~/Library/Application Support/Claude/claude_desktop_config.json",
    config: `{
  "mcpServers": {
    "macos-use": {
      "command": "npx",
      "args": ["-y", "mcp-server-macos-use"]
    }
  }
}`,
  },
  {
    id: "vscode",
    label: "VS Code",
    path: "~/Library/Application Support/Code/User/mcp.json",
    config: `{
  "servers": {
    "macos-use": {
      "command": "npx",
      "args": ["-y", "mcp-server-macos-use"]
    }
  }
}`,
  },
  {
    id: "windsurf",
    label: "Windsurf",
    path: "~/.codeium/windsurf/mcp_config.json",
    config: `{
  "mcpServers": {
    "macos-use": {
      "command": "npx",
      "args": ["-y", "mcp-server-macos-use"]
    }
  }
}`,
  },
];

export function CopyConfig() {
  const [active, setActive] = useState(TABS[0].id);
  const [copied, setCopied] = useState(false);
  const tab = TABS.find((t) => t.id === active) ?? TABS[0];
  const payload = tab.command ?? tab.config ?? "";

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      trackGetStartedClick({
        destination: "https://github.com/mediar-ai/mcp-server-macos-use",
        site: "macos-use",
        section: `install-${tab.id}`,
        text: `copy-${tab.id}`,
      });
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden">
      <div className="flex flex-wrap border-b border-zinc-200 bg-zinc-50">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActive(t.id)}
            className={`px-4 py-2.5 text-sm font-medium transition border-b-2 -mb-px ${
              active === t.id
                ? "text-teal-700 border-teal-600 bg-white"
                : "text-zinc-600 border-transparent hover:text-zinc-900"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab.path && (
        <div className="px-4 pt-3 text-xs text-zinc-500">
          Edit{" "}
          <code className="font-mono text-zinc-700 bg-zinc-100 rounded px-1.5 py-0.5">
            {tab.path}
          </code>{" "}
          and add:
        </div>
      )}

      {tab.command && (
        <div className="px-4 pt-3 text-xs text-zinc-500">
          Run once, from any terminal:
        </div>
      )}

      <div className="relative">
        <pre className="m-4 rounded-xl bg-zinc-900 text-zinc-100 p-4 text-sm overflow-x-auto font-mono leading-relaxed">
          <code>{payload}</code>
        </pre>
        <button
          type="button"
          onClick={onCopy}
          className="absolute top-6 right-6 inline-flex items-center gap-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-2.5 py-1 text-xs font-medium text-zinc-100 transition"
          aria-label="Copy to clipboard"
        >
          {copied ? (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Copied
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              Copy
            </>
          )}
        </button>
      </div>
    </div>
  );
}
