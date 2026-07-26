// Level 13 — using the idea backwards.
//
// She's given the numbers and the answer, and has to place the bubble that
// makes it true. You can only do this if you can predict what a bubble WILL do
// before you draw it — which is the difference between following the rule and
// owning it.
//
// The four placements must land on four different totals or more than one
// answer would be right. v1 and v2 are the only pair that can collide
// (a(c−1) vs d(b−1)); when they would, `d` is bumped by one, which shifts
// d(b−1) by b−1 ≥ 1 and separates them. Everything else is ordered by
// construction. `expr.test.ts` proves this holds for every seed.
import type { Framework, Problem } from "../types";
import type { Rng } from "../rng";
import { close, evalTokens, exprFigure, exprText, num, op, open, type Token } from "../expr";
import { FAM, plainState, scriptFor } from "./shared";

function generate(rng: Rng): Problem {
  const a = rng.int(1, 4);
  const b = rng.int(2, 4);
  const c = rng.int(2, 3);
  const d0 = rng.int(1, 3);
  const d = a * (c - 1) === d0 * (b - 1) ? d0 + 1 : d0;

  const bare: Token[] = [num(a), op("+"), num(b), op("*"), num(c), op("+"), num(d)];
  const variants: Token[][] = [
    bare,
    [open(), num(a), op("+"), num(b), close(), op("*"), num(c), op("+"), num(d)],
    [num(a), op("+"), num(b), op("*"), open(), num(c), op("+"), num(d), close()],
    [open(), num(a), op("+"), num(b), close(), op("*"), open(), num(c), op("+"), num(d), close()],
  ];

  const pick = rng.int(0, 3);
  const chosen = variants[pick];
  const target = evalTokens(chosen);
  const answer = exprText(chosen);

  return {
    promptText: `Make it TRUE: ${exprText(bare)} = ${target}. Where does the bubble go?`,
    figure: exprFigure(bare),
    steps: [
      {
        id: "place",
        ask: `Which one comes to ${target}?`,
        answer,
        input: "choice",
        choices: rng.shuffle(variants.map((v) => ({ label: exprText(v), value: exprText(v) }))),
        hint: "Think what each bubble would make you do first — then see which one could reach that number.",
        decoyQuestions: [
          "Should I change one of the numbers instead?",
          "Should I put brackets round the whole thing?",
          "Which one looks the neatest?",
        ],
        figState: plainState(chosen),
      },
      ...scriptFor(rng, chosen, { read: true }),
    ],
    finalAsk: `What is ${answer}?`,
    finalAnswers: [{ label: answer, value: target }],
    data: { a, b, c, d, pick, target },
  };
}

export const drawTheBubble: Framework = {
  id: "draw-the-bubble",
  title: "Draw the Bubble",
  emoji: "✏️",
  family: FAM.detective,
  blurb: "Here's the answer — now work out where the brackets belong.",
  generate,
  invariant: (d) => d.target >= 0 && d.pick >= 0 && d.pick <= 3 && d.a * (d.c - 1) !== d.d * (d.b - 1),
};
