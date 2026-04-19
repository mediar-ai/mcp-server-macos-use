import type { Metadata } from "next";
import { SeoComponentsStyles } from "@seo/components/server";
import { HeadingAnchors } from "@seo/components";
import { SiteSidebar } from "@/components/site-sidebar";
import { GuideChat } from "@/components/guide-chat";
import "./globals.css";

export const metadata: Metadata = {
  title: "macos-use: Swift MCP server for controlling macOS apps",
  description:
    "Open source Swift MCP server that gives AI agents access to any macOS application through native accessibility APIs.",
  metadataBase: new URL("https://macos-use.dev"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-white text-zinc-900 antialiased">
        <SeoComponentsStyles />
        <div className="flex min-h-screen">
          <SiteSidebar />
          <main className="flex-1 min-w-0">
            <HeadingAnchors />
            {children}
          </main>
          <GuideChat />
        </div>
      </body>
    </html>
  );
}
