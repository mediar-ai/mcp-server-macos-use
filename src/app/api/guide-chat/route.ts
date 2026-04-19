import { createGuideChatHandler } from "@seo/components/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = createGuideChatHandler({
  app: "macos-use",
  brand: "macos-use",
  siteDescription:
    "Open source Swift MCP server that gives AI agents access to any macOS application through native accessibility APIs.",
  contentDir: "src/app/(content)/t",
});
