# Dogylishios / כשכש-נשנש — Agent Instructions

## The person giving you tasks is not a programmer

Assume the person instructing you has no coding knowledge. This means:

- Explain what you did and why in plain language after completing any task — no jargon, no code snippets in explanations unless asked.
- If a request is ambiguous, ask a clarifying question in simple terms before writing any code.
- When something goes wrong, describe the problem and your fix in plain language, not in terms of stack traces or compiler errors.
- Never ask the person to edit code, run commands, or make technical decisions — handle all of that yourself.
- When you push to GitHub to deploy, confirm in plain language that the change is now live (or will be shortly).

## Deployment

This project deploys to **Netlify**. Netlify watches the GitHub repository and rebuilds automatically on every push to `main`.

**To publish a change:**
```bash
git add <files>
git commit -m "your message"
git push origin main
```

Always run `npm run build` locally before pushing to catch TypeScript and build errors before they break the Netlify build. Fix all errors before pushing — a failed build leaves the live site on the previous version.

GitHub remote: `https://github.com/AmosNudel/dog_game.git`

## Commands

```bash
npm run dev    # dev server at http://localhost:3000 (Turbopack)
npm run build  # production build — must pass before pushing
npm run start  # serve the production build
npm run lint   # ESLint
```

## Tech stack

- Next.js 16 (App Router, Turbopack) — **not standard Next.js 13/14/15**; read `node_modules/next/dist/docs/` before using Next.js APIs
- React 19 + TypeScript
- Tailwind CSS v4 — config is in `postcss.config.mjs`, not `tailwind.config.js`
- `next/font` (Rubik) for Latin + Hebrew typography

## Routes

| Path | Locale | Direction |
|------|--------|-----------|
| `/`  | English | LTR |
| `/he` | Hebrew | RTL |

Both routes render `<Game locale="en|he" />`. A `<LanguageSwitch>` component links between them.

## Project structure

```
app/
  layout.tsx          Root layout, fonts, metadata, favicon
  page.tsx            English route → <Game locale="en" />
  globals.css         Tailwind import + game styles + RTL overrides
  he/page.tsx         Hebrew route → <Game locale="he" />
components/
  Game.tsx            Top-level client component; routes screens and overlays
  useGame.ts          useReducer hook — timer dispatchers and RNG live here
  HexBoard.tsx        SVG board rendered from game state
  Modal.tsx           Declarative modal variants
  screens/            Welcome, Instructions, Setup, GameScreen, Win
  ActionPanel.tsx     In-turn action controls
  PlayerCards.tsx     Player hand/score display
  LanguageSwitch.tsx  EN ↔ HE toggle
  RichText.tsx        Renders localized rich text with correct LTR math under RTL
lib/
  engine/
    types.ts          Game state, action, and domain types
    constants.ts      Doors, cards, colors, point values
    hexgrid.ts        Hex geometry, neighbors, symbols, edge colors
    gameReducer.ts    Pure state machine (phases, scoring, cards, win)
  i18n/
    index.ts          Dict interface + getDict
    en.ts             English strings
    he.ts             Hebrew strings
public/
  logo.jpg            Brand logo (used for favicon and OG image)
```

## Architecture rules

- **Engine is pure**: `lib/engine` is framework-agnostic — no React, no DOM, no `window`. Keep it that way.
- **Reducer is deterministic**: randomness (card draws, dice) and the timer must stay in `useGame` dispatchers/effects, never in the reducer.
- **Localization**: all UI strings go through `lib/i18n/en.ts` and `lib/i18n/he.ts`, both implementing the `Dict` interface. Edit both files when adding or changing copy.
- **RTL**: Hebrew layout is driven by CSS locale classes in `globals.css`. Math expressions inside RTL text must be wrapped LTR — use `<RichText>` for any copy that mixes Hebrew and math.
- **No server components with state**: all interactive components must be client components (`"use client"`).

## Before pushing

1. `npm run build` — zero TypeScript errors, zero build errors
2. `npm run lint` — zero ESLint errors
3. Test both `/` and `/he` routes in the browser

## Next.js 16 caveat

This project uses Next.js 16, which has breaking changes from earlier versions. APIs, conventions, and file conventions may differ from your training data. Check `node_modules/next/dist/docs/` for the authoritative reference before using any Next.js API.
