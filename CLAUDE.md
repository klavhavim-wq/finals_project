# Dogylishios / כשכש-נשנש — Agent Instructions

## The person giving you tasks is not a programmer

The person instructing you has no coding knowledge. Treat every interaction as if you are talking to someone who has never written a line of code.

**How to communicate:**
- Narrate what you are doing as you go, but always in plain everyday language — as if explaining to a friend who has never coded.
- Describe your steps in terms of the game, not the code. Instead of "reading types.ts", say "I'm looking at how the game keeps track of questions". Instead of "updating the reducer", say "I'm changing the part of the game that decides which question to show next".
- Do not mention file names, function names, variable names, or technical concepts in your narration.
- Do not mention build steps, TypeScript, lint, commits, or pushes **while they are going fine**. Handle the routine silently — it is not relevant to the user.
- When the change is live, say something like: "Done! The game has been updated. The change will be live on the website in about a minute." — not "The commit is pushed to GitHub, Netlify will rebuild."
- **"Silently" applies to routine and to jargon. It never applies to failure.** If a build or a publish fails, say so plainly and immediately — "I couldn't get the change onto the website, I'm looking into why" — and never say the change is live when it is not. The user cannot check this herself, so a false success is worse than any amount of technical talk.
- If something goes wrong, say what you are doing to fix it in plain terms — not what the technical error was.

**What NOT to say (examples of things that sound like developer talk):**
- "Let me check types.ts to see the GameState definition..."
- "I added a `lastExpr` field to the state..."
- "The ROLL_DICE reducer case now records..."
- "There were no TypeScript errors..."
- "The commit is pushed to GitHub. Netlify will detect the push and rebuild automatically."

**What to say instead:**
- "I'm looking at how the game picks questions — let me find where that happens..."
- "Found it! I'm now changing the rule so the game remembers the last question and skips it next time."
- "Done! The game will no longer show the same multiplication question twice in a row. The update is on its way to the website and should be live in about a minute."

## Deployment

This project deploys to **Netlify**. Netlify watches the GitHub repository and rebuilds automatically on every push to `main`.

**To publish a change:**
```bash
git add <files>
git commit -m "your message"
git push origin main
```

Always run `npm run build` locally before pushing to catch TypeScript and build errors before they break the Netlify build. Fix all errors before pushing — a failed build leaves the live site on the previous version.

GitHub remote: `https://github.com/klavhavim-wq/finals_project.git`

**The working tree is this directory** — the one holding this file. It is the git
repo. `C:\dogcheck` is a scratch mirror used only to run builds (the real path has
Hebrew and spaces, which the build tool chokes on); it is synced one way, has no
git repo, and **anything edited there is destroyed on the next sync**. Never work
in it. `C:\dog_build` and `C:\dogbuild_real` also exist on this machine and are of
unknown origin — do not assume either is live.

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
