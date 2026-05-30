# Dogylishios / כשכש-נשנש

A bilingual (English + Hebrew) math board game built with Next.js. Help the dog collect pellets by solving multiplication problems, planning routes across a hex board, and landing on special tiles. Designed for 1–4 players in local pass-and-play.

## Features

- Hex board (10×10) with door tiers (Bone / Fish / Wing / Sausage / Steak) that scale math difficulty and points.
- Five difficulty levels: Beginner, Intermediate, Advanced, Champion, Hero (long multiplication).
- Special tiles: Bonus (💎), Limit (🚧), Steal (🦹), Twist (🎲 / primes).
- Multiple answer modes: multiple-choice, free numeric input, or click-the-answer on the board.
- Turn timer, cooperative mode, steal mechanic, and three win conditions (4 rounds / first to 100 / both).
- Full English and Hebrew localizations with correct RTL layout.
- Responsive: fixed pannable board on desktop, fit-to-width with page scroll on small screens.

## Tech stack

- Next.js 16 (App Router, Turbopack) + React 19 + TypeScript
- Tailwind CSS v4 (layout glue) plus authored game CSS in `app/globals.css`
- `next/font` (Rubik) for consistent Latin + Hebrew typography

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000 (English) or http://localhost:3000/he (Hebrew).

```bash
npm run build   # production build
npm run start   # serve the production build
npm run lint    # eslint
```

## Routes

- `/` — English (LTR)
- `/he` — Hebrew (RTL)

Both routes render the same `<Game>` component with a different `locale`; a language switcher in the header/welcome links between them.

## Project structure

```
app/
  layout.tsx        Root layout, fonts, metadata, favicon (app/icon.jpg)
  page.tsx          English route -> <Game locale="en" />
  he/page.tsx       Hebrew route  -> <Game locale="he" />
  globals.css       Tailwind import + game styles + locale/RTL overrides
lib/
  engine/
    types.ts        Game state, actions, and domain types
    constants.ts    Doors, cards, colors, point values
    hexgrid.ts      Hex geometry, neighbors, symbols, edge colors
    gameReducer.ts  Pure state machine (phases, scoring, cards, win)
  i18n/
    index.ts        Dict interface + getDict
    en.ts / he.ts   Localized strings (incl. instructions, card copy)
components/
  Game.tsx          Top-level client component; routes screens + overlays
  useGame.ts        useReducer hook + RNG/timer dispatchers
  HexBoard.tsx      SVG board rendered from state
  Modal.tsx         Declarative modal variants
  screens/          Welcome, Instructions (overlay), Setup, GameScreen, Win
  PlayerCards.tsx, ActionPanel.tsx, LanguageSwitch.tsx, RichText.tsx
public/
  logo.jpg          Brand logo (also used for favicon/OG image)
```

## Architecture notes

- The engine (`lib/engine`) is framework-agnostic and never touches the DOM; all rendering is derived from state.
- The reducer stays deterministic — randomness (card draws, dice) and the timer live in `useGame` dispatchers/effects.
- Localized rich text (instructions, card descriptions) is rendered via `RichText`; embedded math is wrapped LTR so it reads correctly under RTL.

## Deployment

The app is fully client-side and deploys to Vercel as-is. Set the public site URL so social/Open Graph image links resolve to absolute URLs:

```
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

## Localization

UI strings live in `lib/i18n/en.ts` and `lib/i18n/he.ts`, both implementing the `Dict` interface in `lib/i18n/index.ts`. To adjust copy, edit the matching key in both files.
