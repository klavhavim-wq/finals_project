"use client";

import Link from "next/link";
import type { Locale } from "@/lib/engine/types";

export default function LanguageSwitch({
  locale,
  className = "ghbtn",
}: {
  locale: Locale;
  className?: string;
}) {
  const other: Locale = locale === "en" ? "he" : "en";
  const href = other === "en" ? "/" : "/he";
  const label = other === "en" ? "English" : "עברית";
  return (
    <Link href={href} className={className} prefetch={false}>
      <span className="lang-globe">🌐 </span>
      {label}
    </Link>
  );
}
