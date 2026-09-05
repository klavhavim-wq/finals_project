"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PRIVACY } from "@/lib/i18n/privacy";

/**
 * The thin line along the bottom of every screen.
 *
 * The layout above it is shared by both languages and knows nothing about which
 * one is on screen, so the path decides: anything under /he is the Hebrew game.
 *
 * The strip itself stays click-through, otherwise it would swallow taps meant
 * for the board sitting behind it. Only the link takes pointer events back.
 */
export default function SiteFooter({ year }: { year: number }) {
  const pathname = usePathname() ?? "/";
  const locale = pathname === "/he" || pathname.startsWith("/he/") ? "he" : "en";
  const c = PRIVACY[locale];
  const onPrivacyPage = pathname === "/privacy" || pathname === "/he/privacy";

  return (
    <footer
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "0.5rem",
        textAlign: "center",
        fontSize: "0.7rem",
        color: "rgba(120, 53, 15, 0.45)",
        padding: "3px 0 5px",
        pointerEvents: "none",
        zIndex: 1000,
        direction: "ltr",
        letterSpacing: "0.3px",
      }}
    >
      <span>© {year} Daffy Nudel</span>
      {!onPrivacyPage && (
        <>
          <span aria-hidden="true">·</span>
          <Link
            href={locale === "he" ? "/he/privacy" : "/privacy"}
            style={{
              pointerEvents: "auto",
              color: "inherit",
              textDecoration: "underline",
            }}
          >
            {c.footerLink}
          </Link>
        </>
      )}
    </footer>
  );
}
