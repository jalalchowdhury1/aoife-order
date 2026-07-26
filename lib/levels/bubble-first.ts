// Level 8 — brackets arrive, and they're introduced as glue SHE can draw.
//
// A bubble builds a bag out of whatever is inside it — even a +. That's why it
// beats the ×: it isn't a new rule, it's the same rule (build before you
// gather) applied to a bag she made herself.
import type { Framework, Problem } from "../types";
import type { Rng } from "../rng";
import { close, evalTokens, exprFigure, num, op, open } from "../expr";
import { FAM, finalFor, plainState, scriptFor } from "./shared";

function generate(rng: Rng): Problem {
  const a = rng.int(1, 6);
  const b = rng.int(1, 6);
  const c = rng.int(2, 5);
  const tokens = [open(), num(a), op("+"), num(b), close(), op("*"), num(c)];
  const total = evalTokens(tokens);
  const FIRST = "first";

  return {
    promptText: "Brackets! A bubble is glue — it turns whatever is inside it into a bag of its own.",
    figure: exprFigure(tokens),
    steps: [
      {
        id: "what-bubble",
        ask: "There's a bubble round part of the sum. What does a bubble tell you?",
        answer: FIRST,
        input: "choice",
        choices: rng.shuffle([
          { label: "Do what's inside it FIRST", value: FIRST },
          { label: "Do what's inside it LAST", value: "last" },
          { label: "Ignore it — brackets don't matter", value: "ignore" },
        ]),
        hint: "The bubble is glue holding two numbers together, exactly like a × does.",
        decoyQuestions: [
          "Which number is biggest?",
          "Should I rub the brackets out?",
          "Should I do the × first because × always wins?",
        ],
        figState: plainState(tokens),
      },
      ...scriptFor(rng, tokens),
    ],
    ...finalFor(tokens),
    data: { a, b, c, total },
  };
}

export const bubbleFirst: Framework = {
  id: "bubble-first",
  title: "The Bubble Goes First",
  emoji: "🫧",
  family: FAM.bubble,
  blurb: "Brackets are glue you can draw. Whatever's inside becomes a bag.",
  generate,
  invariant: (d) => d.total === (d.a + d.b) * d.c && d.c >= 2,
};
