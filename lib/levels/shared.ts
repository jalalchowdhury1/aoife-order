// Shared step factories. EVERY level's question-script is assembled from these,
// so the wording of a move is identical wherever it appears. Change wording
// HERE, never in a level file.
//
// Vocabulary of the app (keep it consistent — she learns these five words):
//   builder (×)  a sign that BUILDS a bag — makes one new number out of two
//   gatherer (+) a sign that GATHERS what's built into a pile
//   bag          a chunk that's been built but not written out yet
//   pile         the running total
//   bubble       brackets — glue she can draw herself
import type { Rng } from "../rng";
import type { Step, Choice, FinalAnswer } from "../types";
import type { Chunk, Move, Token } from "../expr";
import {
  OP_SIGN,
  chunkLabel,
  chunkOptions,
  evalTokens,
  exprText,
  isBuilder,
  num,
  op,
  solvePath,
} from "../expr";

export const FAM = {
  bags: "🍬 Bags and Piles",
  build: "🔨 Spot the Builder",
  bubble: "🫧 The Bubble",
  detective: "🕵️ Detective",
} as const;

/* --------------------------- the concrete picture --------------------------- */

const ITEMS = ["🍬", "🍎", "⭐", "🍓", "🍪"];

export interface BagsSetup {
  item: string;
  per: number;
  bags: number;
  loose: number;
  inBags: number;
  total: number;
  wrong: number; // what left-to-right counting gives — always ≠ total
  tokens: Token[];
}

/**
 * The shared picture for levels 1–3. Constructive constraints, no rejection:
 *  - `per >= 2` and `loose >= 1` guarantee the left-to-right answer is WRONG
 *    (they differ by loose × (per − 1)), which is the whole point of level 3;
 *  - `loose !== per` keeps level 2's answer labels from colliding as strings.
 */
export function bagsSetup(rng: Rng): BagsSetup {
  const item = rng.pick(ITEMS);
  const per = rng.int(2, 5);
  const bags = rng.int(2, 4);
  const loose = rng.pick([1, 2, 3, 4, 5, 6].filter((v) => v !== per));
  const inBags = bags * per;
  return {
    item,
    per,
    bags,
    loose,
    inBags,
    total: loose + inBags,
    wrong: (loose + bags) * per,
    tokens: [num(loose), op("+"), num(bags), op("*"), num(per)],
  };
}

/* ------------------------------ figure states ------------------------------ */

export const ringState = (tokens: Token[], c: Chunk) => ({
  tokens: [...tokens],
  ring: [c.from, c.to] as [number, number],
});

export const valueState = (tokens: Token[], at: number) => ({
  tokens: [...tokens],
  glow: at,
});

export const doneState = (tokens: Token[], total: number) => ({
  tokens: [num(total)],
  done: total,
  origin: [...tokens],
});

export const plainState = (tokens: Token[]) => ({ tokens: [...tokens] });

/* --------------------------------- decoys --------------------------------- */

// Plausible-but-wrong MOVES for the Lead stage. None of these is ever the
// taught question, and none is accidentally valid in the problem it appears in
// — a decoy that happens to work would reward the wrong reasoning.
const GENERIC_DECOYS = [
  "Should I do the biggest numbers first?",
  "Should I just write an answer without working it out?",
  "Do I need to make all the numbers the same size first?",
  "Should I count how many numbers there are?",
  "Should I start from the right-hand end?",
];

export function decoysFor(rng: Rng, tokens: Token[], chunk: Chunk): string[] {
  const pool = [...GENERIC_DECOYS];
  const hasBracket = tokens.some((t) => t.t === "open");
  const hasGatherer = tokens.some((t) => t.t === "op" && !isBuilder(t.v));
  if (hasBracket) pool.push("Can I just ignore the brackets?");
  // only when doing a gatherer first would genuinely be an error
  if (!chunk.bracket && isBuilder(chunk.op) && hasGatherer) {
    pool.push("Should I do the + first because it comes first?");
  }
  return rng.shuffle(pool).slice(0, 3);
}

/* ------------------------------ the two moves ------------------------------ */

/**
 * "Which bit do you do first?" — offered only when there is a genuine decision.
 * `chunkOptions` refuses to present a harmless alternative ordering as wrong,
 * so a single-operator line (or `2 + 3 + 4`, where order truly doesn't matter)
 * simply gets no choice step.
 */
export function whichChunkStep(
  rng: Rng,
  tokens: Token[],
  chunk: Chunk,
  idx: number,
  prefix = "",
): Step | null {
  const opts = chunkOptions(tokens);
  if (opts.length < 2) return null;
  const choices: Choice[] = rng.shuffle(opts.map((o) => ({ label: o.label, value: o.label })));
  const answer = chunkLabel(tokens, chunk);
  const hasBracket = tokens.some((t) => t.t === "open");
  return {
    id: `${prefix}which-${idx}`,
    ask: idx === 0 ? "Which bit do you do FIRST?" : "Which bit do you do NEXT?",
    answer,
    input: "choice",
    choices,
    hint: hasBracket
      ? "A bubble always goes first — even before a ×. Look for the brackets."
      : "× builds a bag, and + can only gather bags that are already built. Is there a × waiting?",
    decoyQuestions: decoysFor(rng, tokens, chunk),
    figState: ringState(tokens, chunk),
  };
}

/** The move itself: work the ringed chunk out and watch the line get shorter. */
export function computeStep(rng: Rng, m: Move, idx: number, prefix = ""): Step {
  const { chunk } = m;
  const sum = `${chunk.a} ${OP_SIGN[chunk.op]} ${chunk.b}`;
  const lead = chunk.bracket
    ? "The bubble goes first"
    : isBuilder(chunk.op)
      ? "Build the bag"
      : "Tip it into the pile";
  const hint = isBuilder(chunk.op)
    ? `${chunk.a} × ${chunk.b} means ${chunk.a} lots of ${chunk.b} — count up in ${chunk.b}s, ${chunk.a} times.`
    : `Start at the bigger number and count on the smaller one.`;
  return {
    id: `${prefix}do-${idx}`,
    ask: `${lead} — what is ${sum}?`,
    answer: chunk.value,
    input: "number",
    hint,
    decoyQuestions: decoysFor(rng, m.before, chunk),
    figState: valueState(m.after, chunk.from),
  };
}

/** Close on the whole written statement, so she ends looking at `expr = answer`. */
export function readStep(tokens: Token[], total: number, prefix = ""): Step {
  return {
    id: `${prefix}read`,
    ask: `So what is ${exprText(tokens)}?`,
    answer: total,
    input: "number",
    hint: "Look at your line — you've already worked it all the way down to one number.",
    decoyQuestions: [
      "Should I start the whole sum again?",
      "Do I add all my working-out numbers together?",
    ],
    figState: doneState(tokens, total),
  };
}

/**
 * The whole question-script for an expression, generated from the rule itself.
 * Levels supply the SHAPE of the expression and any extra teaching steps; the
 * moves come from here, so every level stays consistent and adding ÷ / − later
 * needs no change in any level file.
 */
export function scriptFor(
  rng: Rng,
  tokens: Token[],
  opts?: { read?: boolean; prefix?: string },
): Step[] {
  const prefix = opts?.prefix ?? "";
  const moves = solvePath(tokens);
  const steps: Step[] = [];
  moves.forEach((m, i) => {
    const choice = whichChunkStep(rng, m.before, m.chunk, i, prefix);
    if (choice) steps.push(choice);
    steps.push(computeStep(rng, m, i, prefix));
  });
  const wantRead = opts?.read ?? moves.length >= 2;
  if (wantRead) steps.push(readStep(tokens, evalTokens(tokens), prefix));
  return steps;
}

/* -------------------------------- teaching -------------------------------- */

/** "Which sign builds a bag?" — the naming step, used in the spotting levels. */
export function whichSignStep(rng: Rng, tokens: Token[], figState?: Step["figState"]): Step {
  return {
    id: "which-sign",
    ask: "Which sign BUILDS a bag?",
    answer: "*",
    input: "choice",
    choices: rng.shuffle([
      { label: "×  (it builds)", value: "*" },
      { label: "+  (it gathers)", value: "+" },
    ]),
    hint: "One sign makes a brand-new number out of two. The other just gathers up what's already there.",
    decoyQuestions: [
      "Which sign is written first?",
      "Which sign has the biggest numbers next to it?",
      "Should I just add everything?",
    ],
    figState,
  };
}

/** Reusable single-slot finish. */
export function finalFor(tokens: Token[]): { finalAsk: string; finalAnswers: FinalAnswer[] } {
  const total = evalTokens(tokens);
  return {
    finalAsk: `What is ${exprText(tokens)}?`,
    finalAnswers: [{ label: exprText(tokens), value: total }],
  };
}
