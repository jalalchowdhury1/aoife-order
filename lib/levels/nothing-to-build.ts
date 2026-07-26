// Level 6 — the level where the rule does NOTHING.
//
// Roughly half these problems are `a + b + c`: no builder anywhere, so there
// is no decision to make and no bag to fill. Without this level she starts
// seeing bags in every sum and applying the rule as a reflex. The habit being
// taught is CHECK first, not "× first" — and checking has to be allowed to
// come back "nothing here".
//
// Note the engine does the honest thing on its own: in `a + b + c` the order
// genuinely doesn't matter, so `chunkOptions` finds no wrong alternative and
// no "which bit first?" question is asked at all.
import type { Framework, Problem } from "../types";
import type { Rng } from "../rng";
import { evalTokens, exprFigure, num, op, type Token } from "../expr";
import { FAM, finalFor, plainState, scriptFor } from "./shared";

function generate(rng: Rng): Problem {
  const hasBuilder = rng.int(0, 1) === 1;
  const a = rng.int(1, 9);
  const b = rng.int(2, 5);
  const c = rng.int(2, 5);
  const d = rng.int(1, 9);

  const tokens: Token[] = hasBuilder
    ? rng.int(0, 1) === 1
      ? [num(a), op("+"), num(b), op("*"), num(c)]
      : [num(b), op("*"), num(c), op("+"), num(a)]
    : [num(a), op("+"), num(b), op("+"), num(d)];
  const total = evalTokens(tokens);
  const YES = "yes";
  const NO = "no";

  return {
    promptText: "Careful — not every sum has a bag in it. Check before you start!",
    figure: exprFigure(tokens),
    steps: [
      {
        id: "any-builder",
        ask: "Is there a bag to build here?",
        answer: hasBuilder ? YES : NO,
        input: "choice",
        choices: rng.shuffle([
          { label: "Yes — there's a × in there", value: YES },
          { label: "No — it's all + signs", value: NO },
        ]),
        hint: "Only a × builds a bag. Read along the line and see if there is one.",
        decoyQuestions: [
          "Which number is the biggest?",
          "How many numbers are there?",
          "Should I work it out from the right-hand end?",
        ],
        figState: plainState(tokens),
      },
      ...scriptFor(rng, tokens),
    ],
    ...finalFor(tokens),
    data: { total, hasBuilder: hasBuilder ? 1 : 0 },
  };
}

export const nothingToBuild: Framework = {
  id: "nothing-to-build",
  title: "Nothing to Build",
  emoji: "😌",
  family: FAM.build,
  blurb: "Sometimes there's no bag at all — check first, then go left to right.",
  generate,
  invariant: (d) => d.total >= 0 && (d.hasBuilder === 0 || d.hasBuilder === 1),
};
