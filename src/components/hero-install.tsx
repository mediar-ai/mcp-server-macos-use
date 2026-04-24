"use client";

import { useState } from "react";
import { trackGetStartedClick } from "@seo/components";

const COMMAND = "claude mcp add macos-use -- npx -y mcp-server-macos-use";

export function HeroInstall() {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(COMMAND);
      setCopied(true);
      trackGetStartedClick({
        destination: "https://github.com/mediar-ai/mcp-server-macos-use",
        site: "macos-use",
        section: "hero-install",
        text: "copy-claude-code-oneliner",
      });
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-100 bg-zinc-50">
        <div className="text-xs font-medium text-zinc-600">
          Install in Claude Code, one line
        </div>
        <a
          href="#install"
          className="text-xs font-medium text-teal-700 hover:text-teal-800"
        >
          Cursor / VS Code / Windsurf →
        </a>
      </div>
      <div className="relative">
        <pre className="m-0 bg-zinc-900 text-zinc-100 px-4 py-3.5 text-sm overflow-x-auto font-mono">
          <code>
            <span className="text-zinc-500">$ </span>
            {COMMAND}
          </code>
        </pre>
        <button
          type="button"
          onClick={onCopy}
          className="absolute top-2 right-2 inline-flex items-center gap-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-2.5 py-1 text-xs font-medium text-zinc-100 transition"
          aria-label="Copy command to clipboard"
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
