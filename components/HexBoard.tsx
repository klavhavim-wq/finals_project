"use client";

import { boardMaxFor, DC, DOGS, factorBonusActive, PCOLORS, SFILL } from "@/lib/engine/constants";
import {
  R,
  hCenter,
  factorTilesOf,
  hexBaseFill,
  hexSym,
  hNeighbors,
  hVerts,
  isPrime,
  boardSvgSize,
  edgeColor,
} from "@/lib/engine/hexgrid";
import type { GameState } from "@/lib/engine/types";

/** Mix a #rrggbb colour toward white. t=1 → full colour, t=0 → white. */
function tint(hex: string, t: number): string {
  const c = hex.replace("#", "");
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  const mix = (x: number) => Math.round(255 + (x - 255) * t);
  return `rgb(${mix(r)},${mix(g)},${mix(b)})`;
}

function fillFor(state: GameState, n: number): string {
  if (state.wrongHex === n) return SFILL.blocked;
  const pathIdx = state.path.indexOf(n);
  if (pathIdx !== -1) {
    // Each hex on the route is painted in the colour of the door used to reach
    // it, so the planned/walked path reads straight off the board. Walked steps
    // are a touch stronger than the ones still ahead.
    const doorColor = DC[state.pathDoors[pathIdx]]?.color ?? "#9CA3AF";
    return tint(doorColor, pathIdx < state.stepIdx ? 0.5 : 0.3);
  }
  if (state.targetHex === n) return SFILL.target;
  return hexBaseFill(n);
}

export default function HexBoard({
  state,
  onHexClick,
}: {
  state: GameState;
  onHexClick: (n: number) => void;
}) {
  const validNextHexes = new Set<number>();
  const otherPlayerHexes = new Set<number>();
  if (state.phase === 2) {
    const tip = state.path.length > 0
      ? state.path[state.path.length - 1]
      : state.players[state.cur].hex;
    // Once the route reaches the target, it's the final step — don't suggest any
    // "next" hexes, so it's clear the target is the end of the walk.
    if (tip !== state.targetHex) {
      hNeighbors(tip).forEach(n => { if (n !== null) validNextHexes.add(n); });
      state.path.forEach(h => validNextHexes.delete(h));
      validNextHexes.delete(state.players[state.cur].hex);
    }
    state.players.forEach((p, i) => { if (i !== state.cur) otherPlayerHexes.add(p.hex); });
  }

  const boardMax = boardMaxFor(state.level);

  // Factor-hunt highlight: gold ring on tiles that are factors of the target.
  const factorSet = new Set<number>();
  if (
    factorBonusActive(state.level) &&
    state.targetHex != null &&
    (state.phase === 2 || state.phase === 3)
  ) {
    factorTilesOf(state.targetHex, boardMax).forEach((d) => factorSet.add(d));
  }

  const hexes = [];
  for (let n = 1; n <= boardMax; n++) {
    const { x: cx, y: cy } = hCenter(n);
    const v = hVerts(cx, cy);
    const pts = v.map((p) => p.x.toFixed(1) + "," + p.y.toFixed(1)).join(" ");
    const nb = hNeighbors(n);
    // Calm mode hides the special-tile symbols and the prime highlight.
    const prime = !state.settings.focus && isPrime(n);
    const sym = state.settings.focus ? "" : hexSym(n);
    const tcol = prime ? "#7C3AED" : "#78350F";
    const fw = prime ? 900 : 700;
    const pathIdx = state.path.indexOf(n);
    const isUpcomingPath = pathIdx !== -1 && pathIdx >= state.stepIdx;

    const edges = [];
    for (let e = 0; e < 6; e++) {
      const v1 = v[e];
      const v2 = v[(e + 1) % 6];
      const neighbor = nb[e];
      if (neighbor && neighbor <= boardMax) {
        const dkey = edgeColor(state.edgeColors, state.level, n, neighbor);
        const stroke = DC[dkey].color;
        // Steak (redlong) is drawn dashed so it can't be confused with the
        // solid red Sausage door — distinguishable without relying on hue.
        edges.push(
          <line
            key={e}
            x1={v1.x.toFixed(1)}
            y1={v1.y.toFixed(1)}
            x2={v2.x.toFixed(1)}
            y2={v2.y.toFixed(1)}
            stroke={stroke}
            strokeWidth={4.5}
            strokeLinecap="round"
            strokeDasharray={dkey === "redlong" ? "7 5" : undefined}
          />
        );
      } else {
        edges.push(
          <line
            key={e}
            x1={v1.x.toFixed(1)}
            y1={v1.y.toFixed(1)}
            x2={v2.x.toFixed(1)}
            y2={v2.y.toFixed(1)}
            stroke="#C9A882"
            strokeWidth={1.5}
          />
        );
      }
    }

    const factorRing = factorSet.has(n)
      ? v
          .map(
            (p) =>
              (cx + (p.x - cx) * 0.64).toFixed(1) +
              "," +
              (cy + (p.y - cy) * 0.64).toFixed(1)
          )
          .join(" ")
      : null;

    // The "you can step here next" hint, drawn as an inset ring AFTER the door
    // edges so it stays visible on center hexes (a plain outline would be hidden
    // under the colored door lines that surround a fully-bordered hex).
    const nextRing =
      validNextHexes.has(n) && !isUpcomingPath
        ? v
            .map(
              (p) =>
                (cx + (p.x - cx) * 0.72).toFixed(1) +
                "," +
                (cy + (p.y - cy) * 0.72).toFixed(1)
            )
            .join(" ")
        : null;

    hexes.push(
      <g
        key={n}
        className="hex-group"
        onClick={() => onHexClick(n)}
      >
        <polygon
          points={pts}
          fill={fillFor(state, n)}
          stroke={
            isUpcomingPath ? "#0891B2"
            : otherPlayerHexes.has(n) ? "#FB923C"
            : "none"
          }
          strokeWidth={
            isUpcomingPath ? 2.5
            : otherPlayerHexes.has(n) ? 2.5
            : 0
          }
        />
        {edges}
        {factorRing && (
          <polygon
            points={factorRing}
            fill="none"
            stroke="#D97706"
            strokeWidth={2}
            strokeDasharray="4 3"
            pointerEvents="none"
          />
        )}
        {nextRing && (
          <polygon
            points={nextRing}
            fill="none"
            stroke="#16A34A"
            strokeWidth={2.5}
            strokeDasharray="5 3"
            pointerEvents="none"
          />
        )}
        <text
          x={cx.toFixed(1)}
          y={(cy - (sym ? 9 : 0)).toFixed(1)}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={sym ? 19 : 25}
          fontWeight={fw}
          fill={tcol}
          pointerEvents="none"
          fontFamily="Arial,sans-serif"
        >
          {n}
        </text>
        {sym && (
          <text
            x={cx.toFixed(1)}
            y={(cy + 13).toFixed(1)}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={13}
            pointerEvents="none"
          >
            {sym}
          </text>
        )}
      </g>
    );
  }

  const badges =
    state.phase === 2
      ? state.path.map((h, i) => {
          const { x: cx, y: cy } = hCenter(h);
          return (
            <g key={`badge-${h}`} className="svg-badge">
              <circle cx={(cx + 13).toFixed(1)} cy={(cy - 13).toFixed(1)} r={9} fill="#3B82F6" stroke="white" strokeWidth={1.5} />
              <text
                x={(cx + 13).toFixed(1)}
                y={(cy - 13).toFixed(1)}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={10}
                fill="white"
                fontWeight={800}
                pointerEvents="none"
              >
                {i + 1}
              </text>
            </g>
          );
        })
      : null;

  // Once the route is confirmed (walk stage), the chosen hexes are redrawn on
  // top as a "raised" ribbon — a drop shadow + a thick door-coloured border —
  // so the route the dog walks stands clearly apart from the rest of the board.
  const raisedPath =
    state.phase === 3
      ? state.path.map((h, i) => {
          const { x: cx, y: cy } = hCenter(h);
          const v = hVerts(cx, cy);
          const pts = v.map((p) => p.x.toFixed(1) + "," + p.y.toFixed(1)).join(" ");
          const door = state.pathDoors[i];
          const doorColor = DC[door]?.color ?? "#9CA3AF";
          const fill = tint(doorColor, i < state.stepIdx ? 0.62 : 0.4);
          const prime = !state.settings.focus && isPrime(h);
          const sym = state.settings.focus ? "" : hexSym(h);
          const tcol = prime ? "#7C3AED" : "#78350F";
          return (
            <g key={`raise-${h}`} pointerEvents="none">
              <polygon
                points={pts}
                fill={fill}
                stroke={doorColor}
                strokeWidth={4.5}
                strokeLinejoin="round"
                filter="url(#route-raise)"
              />
              <text
                x={cx.toFixed(1)}
                y={(cy - (sym ? 9 : 0)).toFixed(1)}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={sym ? 19 : 25}
                fontWeight={prime ? 900 : 700}
                fill={tcol}
                fontFamily="Arial,sans-serif"
              >
                {h}
              </text>
              {sym && (
                <text x={cx.toFixed(1)} y={(cy + 13).toFixed(1)} textAnchor="middle" dominantBaseline="middle" fontSize={13}>
                  {sym}
                </text>
              )}
            </g>
          );
        })
      : null;

  const tokens = [...state.players.map((p, i) => ({ p, i }))]
    .sort((a, b) => {
      if (a.p.hex !== b.p.hex) return a.p.hex - b.p.hex;
      if (b.i === state.cur) return -1;
      if (a.i === state.cur) return 1;
      return a.i - b.i;
    })
    .map(({ p, i }) => {
      const { x: cx, y: cy } = hCenter(p.hex);
      return (
        <g
          key={`tok-${i}`}
          transform={`translate(${cx.toFixed(1)},${(cy - R * 0.5).toFixed(1)})`}
          style={{ transition: "transform .45s ease" }}
          pointerEvents="none"
        >
          <circle r={17} fill="white" fillOpacity={0.93} stroke={PCOLORS[i]} strokeWidth={3} />
          <text fontSize={24} textAnchor="middle" dominantBaseline="middle">
            {DOGS[i]}
          </text>
        </g>
      );
    });

  const { w: SVG_W, h: SVG_H } = boardSvgSize(state.level);

  return (
    <svg
      id="hsvg"
      viewBox={`0 0 ${SVG_W} ${SVG_H}`}
      width={SVG_W}
      height={SVG_H}
      style={{ display: "block" }}
    >
      <defs>
        <filter id="route-raise" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="3" stdDeviation="2.6" floodColor="#1f2937" floodOpacity="0.4" />
        </filter>
      </defs>
      {hexes}
      {raisedPath}
      {badges}
      {tokens}
    </svg>
  );
}
