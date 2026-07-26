// Level 10 — the bubble stops living in one place, and sometimes does nothing.
//
// Two of the four shapes wrap a bubble round a chunk that would have gone
// first anyway, so the answer is unchanged. That's the point: a bubble is an
// instruction to check, not a signal to panic. The closing question makes her
// say out loud whether this particular bubble mattered.
import type { Framework, Problem } from "../types";
import type { Rng } from "../rng";
import { close, evalTokens, exprFigure, num, op, open, type Token } from "../expr";
import { FAM, finalFor, readStep, scriptFor } from "./shared";

function generate(rng: Rng): Problem {
  const a = rng.int(2, 5);
  const b = rng.int(2, 5);
  const c = rng.int(2, 5);
  const shape = rng.int(0, 3);

  const tokens: Token[] =
    shape === 0
      ? [open(), num(a), op("+"), num(b), close(), op("*"), num(c)] // changes things
      : shape === 1
        ? [num(a), op("*"), open(), num(b), op("+"), num(c), close()] // changes things
        : shape === 2
          ? [open(), num(a), op("*"), num(b), close(), op("+"), num(c)] // changes nothing
          : [num(a), op("+"), open(), num(b), op("*"), num(c), close()]; // changes nothing

  const total = evalTokens(tokens);
  const bare = tokens.filter((t) => t.t !== "open" && t.t !== "close");
  const sameWithout = evalTokens(bare) === total;
  const YES = "yes";
  const NO = "no";

  return {
    promptText: "The bubble has moved. Do what's inside it first — wherever it is.",
    figure: exprFigure(tokens),
    steps: [
      ...scriptFor(rng, tokens, { read: false }),
      {
        id: "did-it-matter",
        ask: "Would you have got the same answer with NO bubble at all?",
        answer: sameWithout ? YES : NO,
        input: "choice",
        choices: rng.shuffle([
          { label: "Yes — the bubble made no difference here", value: YES },
          { label: "No — the bubble changed the answer", value: NO },
        ]),
        hint: "Cover the brackets with your finger. Which bit would go first then — the same one, or a different one?",
        decoyQuestions: [
          "Should I rub the brackets out and start again?",
          "Which number is the biggest?",
          "Do brackets always change the answer?",
        ],
      },
      readStep(tokens, total),
    ],
    ...finalFor(tokens),
    data: { a, b, c, shape, total, sameWithout: sameWithout ? 1 : 0 },
  };
}

export const bubbleMoves: Framework = {
  id: "bubble-moves",
  title: "The Bubble Moves",
  emoji: "🎈",
  family: FAM.bubble,
  blurb: "Brackets can sit anywhere — and sometimes they change nothing at all.",
  generate,
  invariant: (d) => d.total >= 0 && d.shape >= 0 && d.shape <= 3,
};
