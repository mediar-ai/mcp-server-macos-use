import { createBookCallHandler } from "@seo/components/server";

export const POST = createBookCallHandler({
  site: "macos-use",
  // Same audience as /api/newsletter — one Resend audience per client.
  audienceId: process.env.RESEND_AUDIENCE_ID || "",
  fromEmail: "Matt from macOS Use <matt@macos-use.dev>",
  brand: "macOS Use",
  siteUrl: "https://macos-use.dev",
  redirectBaseUrl: "https://macos-use.dev/go/book",
});
