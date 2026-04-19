"use client";
import { trackScheduleClick } from "@seo/components";

const BOOKING_URL = "https://cal.com/team/mediar/mediar-next-day";

export function BookCallButton({ className = "", label = "Book a call", section = "hero" }: { className?: string; label?: string; section?: string }) {
  return (
    <a
      href={BOOKING_URL}
      onClick={() => {
        trackScheduleClick({ destination: BOOKING_URL, site: "macos-use", section, text: label });
      }}
      className={`inline-flex items-center justify-center rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 transition ${className}`}
    >
      {label}
    </a>
  );
}
