import { SiteNavbar, SiteFooter } from "@seo/components";

const BRAND_LOGO = (
  <span className="font-mono font-bold text-lg text-zinc-900">
    macos-use
  </span>
);

export default function BestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteNavbar
        brandName="macos-use"
        brandLogo={BRAND_LOGO}
        ctaLabel="Book a Call"
        ctaHref="https://cal.com/team/mediar/macos-use"
        ctaClassName="bg-zinc-900 hover:bg-zinc-700 text-white"
        site="macos-use"
      />
      {children}
      <SiteFooter
        brandName="macos-use"
        brandLogo={BRAND_LOGO}
        tagline="MCP server for native macOS control"
      />
    </>
  );
}
