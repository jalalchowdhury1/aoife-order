// Level 4 — the picture comes off, the shape stays the same.
//
// Deliberately the SAME shape as the bags (`loose + bags × per`), so this is
// the level-1 discovery with the sweets rubbed out. She names the builder
// before she is allowed to touch a number.
import type { Framework, Problem } from "../types";
import type { Rng } from "../rng";
import { evalTokens, exprFigure, num, op } from "../expr";
import { FAM, finalFor, plainState, scriptFor, whichSignStep } from "./shared";

function generate(rng: Rng): Problem {
  const a = rng.int(1, 9);
  const b = rng.int(2, 5);
  const c = rng.int(2, 5);
  const tokens = [num(a), op("+"), num(b), op("*"), num(c)];
  const total = evalTokens(tokens);

  return {
    promptText: "No sweets this time — just the sum. Same job: build the bag, then tip it into the pile.",
    figure: exprFigure(tokens),
    steps: [whichSignStep(rng, tokens, plainState(tokens)), ...scriptFor(rng, tokens)],
    ...finalFor(tokens),
    data: { a, b, c, total },
  };
}

export const builderFirst: Framework = {
  id: "builder-first",
  title: "The Builder Goes First",
  emoji: "🔨",
  family: FAM.build,
  blurb: "× builds a bag. You can't tip out a bag you haven't filled.",
  generate,
  invariant: (d) => d.total === d.a + d.b * d.c && d.b >= 2 && d.c >= 2,
};
