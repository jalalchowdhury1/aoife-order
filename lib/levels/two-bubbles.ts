// Level 11 — two bubbles, one after the other.
//
// Note what the engine does NOT ask here: with two independent bubbles it
// makes no difference which she pops first, so `chunkOptions` refuses to offer
// the second bubble as a wrong answer. She is only ever marked wrong for a
// move that genuinely breaks the sum.
import type { Framework, Problem } from "../types";
import type { Rng } from "../rng";
import { close, evalTokens, exprFigure, num, op, open } from "../expr";
import { FAM, finalFor, scriptFor } from "./shared";

function generate(rng: Rng): Problem {
  const a = rng.int(1, 4);
  const b = rng.int(1, 4);
  const c = rng.int(1, 3);
  const d = rng.int(1, 3);
  const tokens = [
    open(),
    num(a),
    op("+"),
    num(b),
    close(),
    op("*"),
    open(),
    num(c),
    op("+"),
    num(d),
    close(),
  ];
  const total = evalTokens(tokens);

  return {
    promptText: "Two bubbles! Pop them both into bags, then build the last bag from those.",
    figure: exprFigure(tokens),
    steps: scriptFor(rng, tokens),
    ...finalFor(tokens),
    data: { a, b, c, d, total },
  };
}

export const twoBubbles: Framework = {
  id: "two-bubbles",
  title: "Two Bubbles",
  emoji: "🫧",
  family: FAM.bubble,
  blurb: "(2 + 3) × (4 + 1) — pop one bubble, then the other.",
  generate,
  invariant: (d) => d.total === (d.a + d.b) * (d.c + d.d),
};
