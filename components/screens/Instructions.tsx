"use client";

import RichText from "../RichText";
import type { GameActions } from "../useGame";
import type { Dict } from "@/lib/i18n";

export default function Instructions({
  t,
  idx,
  actions,
}: {
  t: Dict;
  idx: number;
  actions: GameActions;
}) {
  const page = t.inst[idx];
  const isLast = idx === t.inst.length - 1;

  const nav = (d: number) => {
    const next = Math.max(0, Math.min(t.inst.length - 1, idx + d));
    actions.instSet(next);
  };

  return (
    <div
      className="inst-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) actions.closeInst();
      }}
    >
      <div className="ibox">
        <button className="mclose" onClick={actions.closeInst}>
          ✕
        </button>
        <div className="iicon">{page.i}</div>
        <div className="ititl">{page.t}</div>
        <RichText className="itext" html={page.x} />
        <div className="inav">
          <button
            className="iback"
            style={{ visibility: idx ? "visible" : "hidden" }}
            onClick={() => nav(-1)}
          >
            {t.back}
          </button>
          <div id="idots" style={{ display: "flex", gap: 5 }}>
            {t.inst.map((_, i) => (
              <div
                key={i}
                className={"idot" + (i === idx ? " on" : "")}
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
