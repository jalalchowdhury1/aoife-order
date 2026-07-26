// Level 5 — the × stops sitting in the same place.
//
// Half the time it's on the LEFT (`b × c + a`), where working left to right
// happens to give the right answer. That's on purpose: she must learn to find
// the builder rather than learn a position, and a level where the lazy method
// accidentally works is the only way to test that.
import type { Framework, Problem } from "../types";
import type { Rng } from "../rng";
import { evalTokens, exprFigure, num, op, type Token } from "../expr";
import { FAM, finalFor, scriptFor } from "./shared";

function generate(rng: Rng): Problem {
  const a = rng.int(1, 9);
  const b = rng.int(2, 5);
  const c = rng.int(2, 5);
  const onLeft = rng.int(0, 1) === 1;
  const tokens: Token[] = onLeft
    ? [num(b), op("*"), num(c), op("+"), num(a)]
    : [num(a), op("+"), num(b), op("*"), num(c)];
  const total = evalTokens(tokens);

  return {
    promptText: "The × has moved! Find the bag first — wherever it's hiding.",
    figure: exprFigure(tokens),
    steps: scriptFor(rng, tokens),
    ...finalFor(tokens),
    data: { a, b, c, total, onLeft: onLeft ? 1 : 0 },
  };
}

export const builderHides: Framework = {
  id: "builder-hides",
  title: "Where's the Builder?",
  emoji: "🔍",
  family: FAM.build,
  blurb: "The × hides on either side now. Look before you leap.",
  generate,
  invariant: (d) => d.total === d.a + d.b * d.c && d.b >= 2 && d.c >= 2,
};
