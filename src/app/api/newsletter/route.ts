import { createNewsletterHandler } from "@seo/components/server";

export const POST = createNewsletterHandler({
  audienceId: process.env.RESEND_AUDIENCE_ID || "",
  fromEmail: "Matt from macOS Use <matt@macos-use.dev>",
  brand: "macOS Use",
  siteUrl: "https://macos-use.dev",
});
