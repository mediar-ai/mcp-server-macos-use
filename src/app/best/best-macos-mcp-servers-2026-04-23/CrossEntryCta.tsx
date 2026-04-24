"use client";

import { trackCrossProductClick } from "@seo/components";

interface CrossEntryCtaProps {
  targetProduct: string;
  destination: string;
  text: string;
  section: string;
}

export function CrossEntryCta({
  targetProduct,
  destination,
  text,
  section,
}: CrossEntryCtaProps) {
  return (
    <a
      href={destination}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => {
        trackCrossProductClick({
          site: "macos mcp",
          targetProduct,
          destination,
          text,
          component: "CrossRoundupEntry",
          section,
        });
      }}
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-zinc-900 text-white text-sm font-semibold hover:bg-zinc-800 transition-colors"
    >
      {text}
      <svg
        className="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17 8l4 4m0 0l-4 4m4-4H3"
        />
      </svg>
    </a>
  );
}
