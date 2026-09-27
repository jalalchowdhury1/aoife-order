# AGENTS.md — Which First? (aoife-order)

> **Single source of truth for anyone (human or AI) touching this repo.** Read it fully
> before changing code or "fixing" anything. If something here is wrong, fix *this* file.
> README.md is Jalal's plain-English doc — leave it alone unless asked.

The fourth sibling in Aoife's set: `aoife-math` drills operations, `aoife-frameworks`
teaches word-problem reasoning, `aoife-columns` teaches the written column algorithm,
and **this app teaches the ORDER OF OPERATIONS** — which bit of `2 + 3 × 4` you do
first, and why. Scope today is **brackets, × and +** only; `−` and `÷` are a planned
extension (§7) and the code is built so they slot in without re-teaching anything.

There is **no backend, no database, no API, no auth, no accounts, no timer**. Static
client-side site; progress lives in `localStorage["aoife-order-progress"]`.

---

## 1. What this is

**Next.js 16 (App Router) + React 19 + Tailwind v4**, static, deploys to **Vercel**
(`aoife-order.vercel.app`). Same pink/purple **Bubblegum Sans** look and the same
5-pill ladder as the siblings: **👀 Watch → 🤝 Together → 🧭 Lead → 🦋 Solo** +
**🔁 Practice**. The engine (`lib/engine/`) is copied from `aoife-columns` unchanged
except for the figure it renders.

## 2. THE IDEA — do not water this down

Order of operations is normally taught as an acronym to memorise (BODMAS/PEMDAS). This
app refuses to do that, for the same reason the siblings refuse to: a memorised rule
with no reason behind it leaks under pressure. The whole app rests on one claim a
seven-year-old can check for herself:

> **× BUILDS a bag. + GATHERS what's built into a pile.**
> **You cannot tip out a bag you haven't filled yet.**

`3 × 4` is not "a three and a four" — it is **one number** (twelve) that hasn't been
written out yet. A bracket is glue **she** can draw, building a bag out of whatever is
inside it. That's why brackets beat ×: it isn't a second rule, it's the same rule
applied to a bag she made herself.

"Glue" is what she SEES (the amber ring). "Bags" is WHY it's there. Keep both.

**This is also why the level order is what it is.** Levels 1–3 have no symbols in them
at first: she counts real sweets, then sees how that gets written down, then watches a
left-to-right count fail against the picture. Notation always arrives AFTER the thing
it describes. Do not "streamline" the ladder by moving the symbols earlier — that turns
the app back into the acronym it exists to avoid.

## 3. The ladder — 14 levels, 4 families

| # | id | teaches |
|---|----|---------|
| 1 | `count-the-bags` | no symbols at all: fill the bags, then count the pile |
| 2 | `write-it-down` | the bridge — same picture, now written `5 + 4 × 2`; match part to part |
| 3 | `two-ways` | **THE PROOF**: Ben counts left to right and gets sweets that aren't in the picture |
| 4 | `builder-first` | picture off, same shape: name the builder, then do it |
| 5 | `builder-hides` | the × moves side to side — she must LOOK, not learn a position |
| 6 | `nothing-to-build` | half the problems have NO × — checking must be allowed to come back "nothing" |
| 7 | `two-builders` | two bags, then the pile |
| 8 | `bubble-first` | brackets as glue she can draw |
| 9 | `same-numbers` | **THE SECOND PROOF**: `a + b × c` vs `(a + b) × c`, both worked, different answers |
| 10 | `bubble-moves` | bracket anywhere — including where it changes nothing |
| 11 | `two-bubbles` | `(a + b) × (c + d)` |
| 12 | `is-ben-right` | mark someone else's work and name the mistake |
| 13 | `draw-the-bubble` | backwards: given the answer, place the brackets |
| 14 | `the-big-one` | **interleaved** — every shape she's met, drawn at random |

Home page: "⭐ start here" ring on the first level without a solo pass. Nothing locked.

Level 14 is mixed on purpose. Practising one shape at a time feels like learning and
mostly isn't; she has to decide what kind of problem this is before she can start.

## 4. Architecture

`lib/expr.ts` is the whole model and the only file that knows any arithmetic:

- `Token` = `num | op | open | close`; an expression is a flat token list.
- `BUILDERS` (`*`) and `GATHERERS` (`+`) — **the two families**, and the only
  operator-specific data in the file besides `applyOp`/`OP_SIGN`.
- `evalTokens` — an independent recursive-descent evaluator. The tests use it as
  ground truth against the step machinery, so **never** implement it in terms of
  `nextChunk`.
- `nextChunk(tokens)` — the rule itself: innermost-leftmost bracket → leftmost
  builder → leftmost gatherer.
- `solvePath(tokens)` — the full ordered move list. **Levels do not hand-write step
  scripts**; `scriptFor()` in `lib/levels/shared.ts` generates them from this. A level
  file only chooses the SHAPE of the expression plus any extra teaching steps.

Each level is one file exporting `{ id, title, emoji, family, blurb, generate(rng),
invariant(data) }` — identical contract to the siblings.

### 4.1 `chunkOptions` — the honesty rule (DO NOT BREAK)

The "which bit do you do FIRST?" question offers the correct chunk plus distractors.
A distractor is only included if **actually carrying it out lands on a different
total** — each candidate is spliced in and evaluated for real.

This is not a nicety. In `2 × 3 + 4 × 5` doing the right-hand × first is *not* an
error, and in `(2 + 3) × (4 + 1)` neither is popping the second bubble first. Offering
those as wrong answers would teach a rule that isn't true. Likewise `2 + 3 + 4` gets no
"which first?" question at all, because the order genuinely doesn't matter.

`lib/expr.test.ts` locks all three cases. If you make the chunk logic cheaper, these
tests are the reason not to.

## 5. The live working line (`lib/figures/ExprLine.tsx`)

ONE line, rewritten in place — Jalal picked this shape explicitly over a stacked
working-out and over a rightward-growing chain of `=`.

- The chunk she names gets an amber ring (`expr-ring`) + "👆 do this bit first".
- Answering the move replaces the ringed tokens with their value in place; the line
  re-flows shorter. It never stacks and never scrolls sideways.
- The closing step shows the ORIGINAL expression muted, `=`, and the answer in green,
  so she finishes looking at the complete written statement.

`Problem.figure` is an `ExprSpec` (or a `BagsSpec` for levels 1–3). Each step may carry
`figState`, a **cumulative** snapshot shown once that step is ANSWERED — `StageRunner`
reports completed steps via `onStep`, `StageEngine` renders `figureAt(problem, done)`.
**Solo and Practice always show the bare initial figure** (test conditions).

`ExprState.origin` exists for levels that work through TWO expressions (9, 13): without
it the closing statement would restate the first expression next to the second's answer.

Design law inherited from the siblings: **see it happen, never memorise it.**

## 6. The generator contract (self-test — DO NOT BREAK)

`lib/levels/levels.test.ts` runs every level across **500 seeds**. Rules 1–6 and 8 are
inherited from `aoife-columns`; 7, 7a, 9 and 10 are this app's:

- **7 — the working line never lies.** At every point in the script the line on screen
  must still evaluate to one of the problem's final answers. This is what makes it
  safe for her to trust what she sees.
- **7a — the figure never announces a number she hasn't said yet.** A `total`/`done`
  may only appear on the step whose own answer is that number. (The sibling apps have
  been bitten by figures that revealed the answer early.)
- **9 — a decoy may never be another step's ask** in the same problem. Picking it
  would punish her for a question the app itself teaches.
- **10 — no degenerate bag.** Every bare multiplication she is asked to do has both
  factors ≥ 2. "1 × 5" is one lot of five; it teaches nothing about building and makes
  the × look pointless. Several generators have tightened ranges purely for this.
- **5** is widened from the sibling: the arithmetic-decoy regex includes `×`, since in
  THIS app a "what is 3 × 4?" decoy landing on a real answer is the likeliest way to
  reward wrong reasoning.
- **8** — a choice answer that never varies must not sit at a fixed position. All
  choice arrays are `rng.shuffle`d; keep it that way.

`lib/expr.test.ts` separately proves the rule itself (§4.1).

**Keep the numbers clean.** Generation is constructive — no rejection loops. Ranges are
picked so the property the level needs holds by construction:
`bagsSetup` keeps `per ≥ 2, loose ≥ 1` so Ben always overcounts (level 3's whole
argument); `same-numbers` keeps `a ≥ 1, c ≥ 2` so the two totals differ;
`draw-the-bubble` bumps `d` by one when `a(c−1) === d(b−1)`, the only way its four
bracket placements can collide.

## 7. Adding − and ÷ (planned, ~Sept 2026)

Jalal has said these are coming. The design already accounts for them — do it this way:

1. In `lib/expr.ts`: add `"/"` to `BUILDERS`, `"-"` to `GATHERERS`, extend the `Op`
   union, `applyOp` and `OP_SIGN`. **Nothing else in that file is operator-specific.**
   Left-to-right tie-breaking within a family already works (`nextChunk` always takes
   the leftmost).
2. Teach them as new members of families she already knows: ÷ builds a bag by sharing,
   − is another way to adjust the pile. **Do not introduce a new metaphor** — the
   whole point of the builder/gatherer split was to make this a no-op conceptually.
3. The one genuinely new lesson is the **left-to-right tie-break** (`10 − 3 + 2`,
   `12 ÷ 2 × 3`), which deserves its own level or two in the build family.
4. Watch rule 10: guard against `x ÷ 1` and `x − 0` the same way.

## 8. Repo layout

```
app/page.tsx            — home grid (tiles by family, start-here ring) + parent peek (5 taps on title)
app/f/[id]/page.tsx     — level screen; mounts <StageEngine>
app/globals.css         — Tailwind v4 theme (pink/purple, Bubblegum Sans) + .expr-ring/.expr-card
lib/expr.ts             — THE MODEL: tokens, families, evalTokens, nextChunk, solvePath, figure states
lib/expr.test.ts        — proves the rule (incl. the honesty rule, §4.1)
lib/types.ts            — Framework / Problem / Step / Stage
lib/rng.ts              — seedable RNG (deterministic generators)
lib/progress.ts         — localStorage progress (key: aoife-order-progress)
lib/engine/             — StageEngine, StageRunner, PracticeRunner, Numpad, ChoicePad, confetti, rich
lib/figures/ExprLine.tsx— the one working line
lib/figures/Bags.tsx    — the concrete picture (levels 1–3 only)
lib/levels/<id>.ts      — one level each; shared.ts = step factories + the app's vocabulary
lib/levels/index.ts     — LEVELS ladder + FAMILIES + LEVEL_NUM + byId()
lib/levels/levels.test.ts — the 500-seed self-test harness
```

`npm run dev` / `npm run build` / `npm run lint` / `npm test` (Vitest). No env vars, no secrets.

## 9. Gotchas

- **Wording lives in `lib/levels/shared.ts`, not in level files.** Every level speaks
  the same five words: builder, gatherer, bag, pile, bubble. Change it there or the
  app starts contradicting itself.
- **Hints must be boundary-exact and must never state the answer** (inherited lesson —
  she follows hints literally). `computeStep`'s × hint says "count up in 4s, three
  times", never "4, 8, …", which would give it away for small factors.
- Adding/removing a level: update `lib/levels/index.ts` AND the count assertion in
  `levels.test.ts` together. Register in ladder order — `LEVEL_NUM` and "start here"
  derive from array position.
- **Never commit `node_modules` or npm caches.** `.gitignore` covers them.
- **Jalal's global npm cache has root-owned files** (`sudo chown -R 501:20 ~/.npm`
  fixes it, needs his password). Until then local `npm install` fails EEXIST —
  `node_modules` here was copied from `aoife-columns` (identical lockfile).
  CI/Vercel are unaffected.
- **No CDN runtime deps.** `canvas-confetti` is bundled from npm behind
  `lib/engine/confetti.ts`.
- **Vercel deploy:** GitHub auto-deploy is NOT linked — deploy with `vercel --prod`
  from the repo root (account `jalalchowdhury-8053`).
- Never call `Date.now()` / `new Date()` / `Math.random()` during render — eslint
  `react-hooks/purity` fails. Event handlers/effects only.
- 🔁 Practice is a sibling `mode` in StageEngine, NOT a 5th member of `STAGES`.
- **Local browser checks:** headless Chrome (`--headless --screenshot`) wedges after a
  few runs on this Mac; `pkill -9 -f headless` then run it with `nohup` + a watchdog
  loop that breaks as soon as the PNG appears. A throwaway `app/preview/page.tsx` that
  renders `figureAt(problem, i)` for every `i` is the fastest way to eyeball all figure
  states at once — build it, screenshot it, delete it.

## Home Screen install (2026-09-27)

Progress is localStorage-only, and Safari wipes a site's storage after 7 days without a
visit. A web app **added to the Home Screen** is exempt from that purge, so the app ships
`app/manifest.ts` (→ `/manifest.webmanifest`, display standalone), `app/apple-icon.png`
(180px, → `<link rel="apple-touch-icon">`), `public/icon-192.png` + `public/icon-512.png`,
and `appleWebApp` + `apple-mobile-web-app-capable` in `app/layout.tsx` metadata. Icons are a
pink-400 → purple-500 gradient with a white glyph. Don't remove these. Caveat: the installed
app has its OWN storage — stars earned in the Safari tab do not carry over to the icon.
