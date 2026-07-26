// The expression model shared by every level: tokens, the two operator families,
// the rule that decides which chunk gets done next, and the cumulative display
// snapshots that drive the one live working line.
//
// ─────────────────────────────────────────────────────────────────────────────
// THE IDEA THE WHOLE APP IS BUILT ON (do not water this down):
//
//   ×  BUILDS a bag.   "3 × 4" is not a three and a four — it is ONE number
//                      (twelve) that hasn't been written out yet.
//   +  GATHERS bags and loose bits into a pile.
//
//   You cannot tip out a bag you haven't filled yet. That — not a memorised
//   acronym — is WHY builders go before gatherers. Brackets are glue the child
//   can draw herself: they build a bag out of whatever is inside them.
//
// Adding ÷ to BUILDERS and − to GATHERERS is the whole change needed to extend
// this app to full BODMAS; nothing else in this file is operator-specific
// except `applyOp` and `OP_SIGN`. (Left-to-right tie-breaking within a family
// already works — `nextChunk` always takes the leftmost.)
// ─────────────────────────────────────────────────────────────────────────────
import type { FigureSpec, Problem } from "./types";

export type Op = "+" | "*";

export type Token =
  | { t: "num"; v: number }
  | { t: "op"; v: Op }
  | { t: "open" }
  | { t: "close" };

export const num = (v: number): Token => ({ t: "num", v });
export const op = (v: Op): Token => ({ t: "op", v });
export const open = (): Token => ({ t: "open" });
export const close = (): Token => ({ t: "close" });

/** Operators that MAKE a new number out of two (a bag). */
export const BUILDERS: readonly Op[] = ["*"];
/** Operators that GATHER what's already made (a pile). */
export const GATHERERS: readonly Op[] = ["+"];

export const isBuilder = (o: Op): boolean => BUILDERS.includes(o);

export const OP_SIGN: Record<Op, string> = { "+": "+", "*": "×" };
export const OP_WORD: Record<Op, string> = { "+": "plus", "*": "times" };

export const applyOp = (a: number, o: Op, b: number): number => (o === "*" ? a * b : a + b);

/* ------------------------------- text ------------------------------- */

export function tokenText(tk: Token): string {
  switch (tk.t) {
    case "num":
      return String(tk.v);
    case "op":
      return OP_SIGN[tk.v];
    case "open":
      return "(";
    case "close":
      return ")";
  }
}

/** "2 + 3 × 4", "(2 + 3) × 4" — spaces everywhere except hugging the brackets. */
export function exprText(tokens: readonly Token[]): string {
  let s = "";
  tokens.forEach((tk, i) => {
    const prev = tokens[i - 1];
    if (i > 0 && prev.t !== "open" && tk.t !== "close") s += " ";
    s += tokenText(tk);
  });
  return s;
}

/* ----------------------------- evaluation ----------------------------- */
// Recursive descent, so the test harness has a source of truth that is
// completely independent of the step-by-step machinery below.

function parseFactor(tk: readonly Token[], i: number): [number, number] {
  const t = tk[i];
  if (!t) throw new Error(`unexpected end of expression at ${i}`);
  if (t.t === "num") return [t.v, i + 1];
  if (t.t === "open") {
    const [v, j] = parseExpr(tk, i + 1);
    if (tk[j]?.t !== "close") throw new Error("missing )");
    return [v, j + 1];
  }
  throw new Error(`unexpected token ${tokenText(t)} at ${i}`);
}

function parseTerm(tk: readonly Token[], i: number): [number, number] {
  let [v, j] = parseFactor(tk, i);
  for (;;) {
    const t = tk[j];
    if (!t || t.t !== "op" || !isBuilder(t.v)) return [v, j];
    const [r, k] = parseFactor(tk, j + 1);
    v = applyOp(v, t.v, r);
    j = k;
  }
}

function parseExpr(tk: readonly Token[], i: number): [number, number] {
  let [v, j] = parseTerm(tk, i);
  for (;;) {
    const t = tk[j];
    if (!t || t.t !== "op" || isBuilder(t.v)) return [v, j];
    const [r, k] = parseTerm(tk, j + 1);
    v = applyOp(v, t.v, r);
    j = k;
  }
}

export function evalTokens(tokens: readonly Token[]): number {
  const [v, i] = parseExpr(tokens, 0);
  if (i !== tokens.length) throw new Error(`bad expression: ${exprText(tokens)}`);
  return v;
}

/* ------------------------- which chunk goes next ------------------------- */

export interface Chunk {
  from: number; // inclusive token index — the "(" when bracketed
  to: number; // inclusive token index — the ")" when bracketed
  a: number;
  op: Op;
  b: number;
  value: number;
  bracket: boolean;
}

/** The chunk she must do next: innermost-leftmost bracket → leftmost builder → leftmost gatherer. */
export function nextChunk(tokens: readonly Token[]): Chunk | null {
  // 1. brackets win. The first ")" and its matching "(" is the innermost-leftmost group.
  const closeIdx = tokens.findIndex((t) => t.t === "close");
  if (closeIdx >= 0) {
    let openIdx = -1;
    for (let i = closeIdx - 1; i >= 0; i--) {
      if (tokens[i].t === "open") {
        openIdx = i;
        break;
      }
    }
    if (openIdx < 0) throw new Error(`unmatched ) in ${exprText(tokens)}`);
    const inner = tokens.slice(openIdx + 1, closeIdx);
    const opCount = inner.filter((t) => t.t === "op").length;
    if (opCount === 1) {
      const a = inner[0];
      const o = inner[1];
      const b = inner[2];
      if (a?.t !== "num" || o?.t !== "op" || b?.t !== "num" || inner.length !== 3) {
        throw new Error(`unsupported bracket contents in ${exprText(tokens)}`);
      }
      return {
        from: openIdx,
        to: closeIdx,
        a: a.v,
        op: o.v,
        b: b.v,
        value: applyOp(a.v, o.v, b.v),
        bracket: true,
      };
    }
    // more than one operation inside — solve within the bracket first
    const c = nextChunk(inner);
    if (!c) return null;
    return { ...c, from: c.from + openIdx + 1, to: c.to + openIdx + 1 };
  }

  // 2. no brackets: leftmost builder, else leftmost gatherer.
  const opIdxs: number[] = [];
  tokens.forEach((t, i) => {
    if (t.t === "op") opIdxs.push(i);
  });
  if (opIdxs.length === 0) return null;
  const builderIdx = opIdxs.find((i) => {
    const t = tokens[i];
    return t.t === "op" && isBuilder(t.v);
  });
  const idx = builderIdx ?? opIdxs[0];
  const a = tokens[idx - 1];
  const o = tokens[idx];
  const b = tokens[idx + 1];
  if (a?.t !== "num" || o?.t !== "op" || b?.t !== "num") {
    throw new Error(`malformed expression ${exprText(tokens)}`);
  }
  return {
    from: idx - 1,
    to: idx + 1,
    a: a.v,
    op: o.v,
    b: b.v,
    value: applyOp(a.v, o.v, b.v),
    bracket: false,
  };
}

/** Replace the chunk with its value — the line as it looks after that move. */
export function reduceChunk(tokens: readonly Token[], c: Chunk): Token[] {
  return [...tokens.slice(0, c.from), num(c.value), ...tokens.slice(c.to + 1)];
}

export interface Move {
  chunk: Chunk;
  before: Token[];
  after: Token[];
}

/** The full ordered sequence of moves from expression to single number. */
export function solvePath(tokens: readonly Token[]): Move[] {
  const out: Move[] = [];
  let cur: Token[] = [...tokens];
  for (let guard = 0; guard < 24; guard++) {
    const chunk = nextChunk(cur);
    if (!chunk) return out;
    const after = reduceChunk(cur, chunk);
    out.push({ chunk, before: cur, after });
    cur = after;
  }
  throw new Error(`solvePath did not terminate for ${exprText(tokens)}`);
}

/* --------------------------- choice candidates --------------------------- */

export interface Candidate {
  label: string; // "3 × 4" or "(2 + 3)"
  correct: boolean;
}

export function chunkLabel(tokens: readonly Token[], c: Chunk): string {
  const body = `${c.a} ${OP_SIGN[c.op]} ${c.b}`;
  return c.bracket ? `(${body})` : body;
}

/** Drop parens left unbalanced by a splice, so a wrong-order line still evaluates. */
function dropUnmatchedParens(tokens: readonly Token[]): Token[] {
  const keep: boolean[] = tokens.map(() => true);
  const stack: number[] = [];
  tokens.forEach((t, i) => {
    if (t.t === "open") stack.push(i);
    else if (t.t === "close") {
      if (stack.length) stack.pop();
      else keep[i] = false;
    }
  });
  for (const i of stack) keep[i] = false;
  return tokens.filter((_, i) => keep[i]);
}

/**
 * The options for a "which chunk do we do first?" question: the correct chunk
 * plus ONLY those alternatives that genuinely change the answer.
 *
 * This matters. In `2 × 3 + 4 × 5` doing the right-hand × first is not an
 * error — offering it as a "wrong" option would teach a rule that isn't true.
 * So each candidate is actually carried out and evaluated; it survives as a
 * distractor only if it lands on a different total.
 */
export function chunkOptions(tokens: readonly Token[]): Candidate[] {
  const correct = nextChunk(tokens);
  if (!correct) return [];
  const truth = evalTokens(tokens);
  const out: Candidate[] = [{ label: chunkLabel(tokens, correct), correct: true }];
  const seen = new Set([out[0].label]);

  tokens.forEach((t, i) => {
    if (t.t !== "op") return;
    if (i > correct.from && i < correct.to) return; // the correct chunk's own operator
    let li = i - 1;
    while (li >= 0 && tokens[li].t !== "num") li--;
    let ri = i + 1;
    while (ri < tokens.length && tokens[ri].t !== "num") ri++;
    const a = tokens[li];
    const b = tokens[ri];
    if (a?.t !== "num" || b?.t !== "num") return;
    const label = `${a.v} ${OP_SIGN[t.v]} ${b.v}`;
    if (seen.has(label)) return;
    const spliced = dropUnmatchedParens([
      ...tokens.slice(0, li),
      num(applyOp(a.v, t.v, b.v)),
      ...tokens.slice(ri + 1),
    ]);
    let result: number;
    try {
      result = evalTokens(spliced);
    } catch {
      return; // not a coherent thing to do at all
    }
    if (result === truth) return; // harmless alternative order — never mark it wrong
    seen.add(label);
    out.push({ label, correct: false });
  });

  return out;
}

/* ------------------------------ the figure ------------------------------ */

/**
 * A snapshot of the ONE working line. Snapshots are CUMULATIVE — each step's
 * figState is the whole picture after that step, never a delta.
 */
export interface ExprState {
  tokens: Token[]; // the line exactly as it stands now
  ring?: [number, number]; // inclusive token range circled as "do this bit first"
  glow?: number; // index of the token that just became a value
  done?: number; // set on the last step: show `origin = done`
  origin?: Token[]; // which expression the closing statement restates (levels
  // that work through TWO expressions must set this, or the
  // second one would close by restating the first)
}

export interface ExprSpec extends FigureSpec {
  kind: "expr";
  original: Token[]; // for the closing full statement
  state: ExprState;
}

export function exprFigure(tokens: Token[]): ExprSpec {
  return { kind: "expr", original: [...tokens], state: { tokens: [...tokens] } };
}

/** A pile of loose items plus some bags — the concrete picture behind the rule. */
export interface BagsState {
  spilled?: boolean; // bags emptied into ONE pile, still apart from the loose ones
  merged?: boolean; // everything in a single pile
  expr?: Token[]; // show this expression under the picture
  total?: number; // show "= total"
}

export interface BagsSpec extends FigureSpec {
  kind: "bags";
  loose: number;
  bags: number;
  per: number;
  item: string; // emoji
  state: BagsState;
}

export function bagsFigure(
  loose: number,
  bags: number,
  per: number,
  item: string,
  state: BagsState = {},
): BagsSpec {
  return { kind: "bags", loose, bags, per, item, state };
}

/** Figure to show after `done` completed steps: the latest defined figState. */
export function figureAt(problem: Problem, done: number): FigureSpec | undefined {
  const fig = problem.figure;
  if (!fig) return fig;
  let state: ExprState | BagsState | undefined;
  for (let i = 0; i < done && i < problem.steps.length; i++) {
    state = problem.steps[i].figState ?? state;
  }
  return state ? { ...fig, state } : fig;
}
