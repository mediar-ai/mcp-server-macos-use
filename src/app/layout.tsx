import type { Metadata } from "next";
import { HeadingAnchors, FullSiteAnalytics, NewsletterSignup } from "@seo/components";
import { SiteSidebar } from "@/components/site-sidebar";
import { GuideChat } from "@/components/guide-chat";
import "./globals.css";

export const metadata: Metadata = {
  title: "macos-use: MCP server that lets Claude Code drive your Mac",
  description:
    "Open source Swift MCP server for Claude Code, Cursor, VS Code, and Windsurf. Native accessibility APIs, structured UI trees, runs locally. One config, any macOS app.",
  metadataBase: new URL("https://macos-use.dev"),
  openGraph: {
    title: "macos-use: MCP server that lets Claude Code drive your Mac",
    description:
      "Swift MCP server. Native accessibility APIs, structured UI trees, runs locally. Works with Claude Code, Cursor, VS Code, Windsurf.",
    url: "https://macos-use.dev",
    siteName: "macos-use",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "macos-use: MCP server for native macOS control",
    description:
      "Let Claude Code drive your Mac, not just your browser. Open source, accessibility-API based, runs locally.",
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
