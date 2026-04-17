import type { Metadata } from "next";
import { SeoComponentsStyles } from "@seo/components/server";
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
        {children}
      </body>
    </html>
  );
}
