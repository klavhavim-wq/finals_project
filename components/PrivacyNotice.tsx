import Link from "next/link";
import type { Locale } from "@/lib/engine/types";
import { PRIVACY } from "@/lib/i18n/privacy";

/**
 * The privacy and credits page.
 *
 * Deliberately plain: no board colours, no dog, no game chrome. A parent or a
 * teacher reading this is not playing, and the page has to be skimmable enough
 * that they actually reach the part about where their child's name goes.
 *
 * Styled inline rather than through the game's stylesheet, because none of the
 * game's classes fit a document and this page should not start depending on
 * them.
 */
export default function PrivacyNotice({ locale }: { locale: Locale }) {
  const c = PRIVACY[locale];
  const rtl = locale === "he";

  return (
    <main
      dir={rtl ? "rtl" : "ltr"}
      lang={locale}
      style={{
        maxWidth: "44rem",
        margin: "0 auto",
        padding: "2.5rem 1.25rem 4.5rem",
        color: "#3f2d1a",
        lineHeight: 1.75,
        fontSize: "1rem",
        textAlign: "start",
      }}
    >
      <h1 style={{ fontSize: "1.75rem", fontWeight: 800, margin: "0 0 .35rem" }}>{c.pageTitle}</h1>
      <p style={{ margin: "0 0 1.5rem", fontSize: ".85rem", color: "#8a7050" }}>{c.updated}</p>

      <p style={{ margin: "0 0 2rem" }}>{c.intro}</p>

      {c.sections.map((s) => (
        <section key={s.heading} style={{ margin: "0 0 1.9rem" }}>
          <h2 style={{ fontSize: "1.12rem", fontWeight: 700, margin: "0 0 .6rem" }}>{s.heading}</h2>
          {s.body.map((p, i) => (
            <p key={i} style={{ margin: "0 0 .7rem" }}>
              {p}
            </p>
          ))}
        </section>
      ))}

      <section style={{ margin: "0 0 1.9rem" }}>
        <h2 style={{ fontSize: "1.12rem", fontWeight: 700, margin: "0 0 .6rem" }}>
          {c.contactHeading}
        </h2>
        <p style={{ margin: "0 0 .7rem" }}>
          {c.contactIntro}{" "}
          <a href={`mailto:${c.contactEmail}`} style={{ color: "#7c4a15", fontWeight: 600 }} dir="ltr">
            {c.contactEmail}
          </a>
        </p>
      </section>

      <section style={{ margin: "0 0 2rem" }}>
        <h2 style={{ fontSize: "1.12rem", fontWeight: 700, margin: "0 0 .6rem" }}>
          {c.creditsHeading}
        </h2>
        {c.creditsBody.map((p, i) => (
          <p key={i} style={{ margin: "0 0 .7rem" }}>
            {p}
          </p>
        ))}
      </section>

      <Link
        href={rtl ? "/he" : "/"}
        style={{
          display: "inline-block",
          padding: ".55rem 1.1rem",
          borderRadius: "999px",
          background: "#f5e6cc",
          color: "#7c4a15",
          fontWeight: 700,
          textDecoration: "none",
        }}
      >
        {c.backToGame}
      </Link>
    </main>
  );
}
