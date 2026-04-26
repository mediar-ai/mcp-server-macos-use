import type { Metadata } from "next";
import { HeadingAnchors, FullSiteAnalytics, NewsletterSignup } from "@seo/components";
import { SiteSidebar } from "@/components/site-sidebar";
import { GuideChat } from "@/components/guide-chat";
import "./globals.css";

export const metadata: Metadata = {
  title: "macos-use: drive any Mac app from Claude Code (no AppleScript)",
  description:
    "Open source Swift MCP server for Claude Code, Cursor, VS Code, Windsurf. Reads Apple's accessibility tree (no AppleScript glue, no screenshot OCR), runs locally over stdio. One install, any macOS app.",
  metadataBase: new URL("https://macos-use.dev"),
  openGraph: {
    title: "macos-use: drive any Mac app from Claude Code (no AppleScript)",
    description:
      "Swift MCP server. Native accessibility tree, not screenshots. Not an AppleScript wrapper. Runs locally. Works with Claude Code, Cursor, VS Code, Windsurf, Cline.",
    url: "https://macos-use.dev",
    siteName: "macos-use",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "macos-use: native macOS control for Claude Code",
    description:
      "Drive any Mac app from your AI assistant. Native accessibility tree, no AppleScript, no screenshots. Open source Swift, runs locally.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-white text-zinc-900 antialiased">
        <FullSiteAnalytics
          posthogKey={process.env.NEXT_PUBLIC_POSTHOG_KEY}
          posthogHost={process.env.NEXT_PUBLIC_POSTHOG_HOST}
        >
          <div className="flex min-h-screen">
            <SiteSidebar />
            <main className="flex-1 min-w-0">
              <HeadingAnchors />
              {children}
            </main>
            <GuideChat />
          </div>
          <NewsletterSignup />
        </FullSiteAnalytics>
      </body>
    </html>
  );
}
