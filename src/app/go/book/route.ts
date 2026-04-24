import { createBookCallRedirectHandler } from "@seo/components/server";

export const GET = createBookCallRedirectHandler({
  site: "macos-use",
  fallbackBookingUrl: "https://cal.com/team/mediar/macos-use",
});
