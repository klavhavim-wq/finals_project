"use client";

import { useEffect } from "react";
import RichText from "../RichText";
import type { GameActions } from "../useGame";
import type { Level } from "@/lib/engine/types";
import type { Dict } from "@/lib/i18n";

export default function Instructions({
  t,
  idx,
  actions,
  mode,
  level,
}: {
  t: Dict;
  idx: number;
  actions: GameActions;
  mode: "simple" | "full";
  level: Level | null;
}) {
  const pages = mode === "simple" ? t.simpleGuide(level) : t.inst;
  const safeIdx = Math.min(idx, pages.length - 1);
  const page = pages[safeIdx];
  const isLast = safeIdx === pages.length - 1;

  const { closeInst } = actions;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeInst();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeInst]);

  const nav = (d: number) => {
    const next = Math.max(0, Math.min(pages.length - 1, safeIdx + d));
    actions.instSet(next);
  };

  return (
    <div
      className="inst-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) actions.closeInst();
      }}
    >
      <div className="ibox" role="dialog" aria-modal="true">
        <button className="mclose" onClick={actions.closeInst} aria-label={t.close}>
          ✕
        </button>
        <div className="iicon">{page.i}</div>
        <div className="ititl">{page.t}</div>
        <RichText className="itext" html={page.x} />
        <div className="inav">
          <button
            className="iback"
            style={{ visibility: safeIdx ? "visible" : "hidden" }}
            onClick={() => nav(-1)}
          >
            {t.back}
          </button>
          <div id="idots" style={{ display: "flex", gap: 5 }}>
            {pages.map((_, i) => (
              <div
                key={i}
                className={"idot" + (i === safeIdx ? " on" : "")}
                onClick={() => actions.instSet(i)}
              />
            ))}
          </div>
          {isLast ? (
            <button className="ibtn" onClick={actions.closeInst}>
              {t.gotItDone}
            </button>
          ) : (
            <button className="ibtn" onClick={() => nav(1)}>
              {t.next}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
