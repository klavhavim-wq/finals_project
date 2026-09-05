# Simulation harnesses

Three scripts that drive the game engine headlessly, without a browser. They were
written while hunting bugs that only show up over many turns, and they are kept
because the findings they produced are cited in the project write-up.

| Script | What it does |
|---|---|
| `sim.js` | Plays one full turn exactly as the interface does — start a game, take the target card, walk a route — so a single turn can be inspected step by step. |
| `soak.js` | Runs the game over and over across levels and player counts, flagging anything that looks wrong. This is what surfaced the rarer faults. |
| `edge.js` | Reproduces one specific case: the dog standing on the hex that the new target card asks for, which used to leave the confirm button dead with nothing on screen explaining why. |

`last-run.log` is the output of the last soak run, kept as a record.

## Running them

They were written against a JavaScript build of `lib/engine`, which lived beside
them in a scratch folder and is not kept here — a second copy of the engine would
drift out of step with the real one, and a stale copy that still runs is worse
than none.

To run them now, point the `require` calls at the TypeScript sources and let Node
strip the types (Node 22 or newer):

```bash
node --experimental-strip-types tools/sim/soak.js
```

The engine's internal imports are extensionless, so either add `.ts` to them or
run the scripts through a bundler. The rule that makes this necessary is the same
one that keeps the engine worth testing this way: `lib/engine` is plain
TypeScript with no React and no browser, so it runs anywhere.
