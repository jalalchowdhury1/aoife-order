// Level 7 — two bags, then the pile.
//
// The important honesty here: in `a × b + c × d` it does NOT matter which × she
// builds first. `chunkOptions` works that out by actually carrying each option
// through, so the right-hand × is never offered as a wrong answer — only the
// genuinely broken move (doing the + first) is.
import type { Framework, Problem } from "../types";
import type { Rng } from "../rng";
import { evalTokens, exprFigure, num, op } from "../expr";
import { FAM, finalFor, scriptFor } from "./shared";

function generate(rng: Rng): Problem {
  const a = rng.int(2, 5);
  const b = rng.int(2, 5);
  const c = rng.int(2, 5);
  const d = rng.int(2, 5);
  const tokens = [num(a), op("*"), num(b), op("+"), num(c), op("*"), num(d)];
  const total = evalTokens(tokens);

  return {
    promptText: "Two bags this time. Build them both, THEN tip everything into the pile.",
    figure: exprFigure(tokens),
    steps: scriptFor(rng, tokens),
    ...finalFor(tokens),
    data: { a, b, c, d, total },
  };
}

export const twoBuilders: Framework = {
  id: "two-builders",
  title: "Two Bags",
  emoji: "🎒",
  family: FAM.build,
  blurb: "Two × chunks and one +. Build, build, then gather.",
  generate,
  invariant: (d) => d.total === d.a * d.b + d.c * d.d,
};
