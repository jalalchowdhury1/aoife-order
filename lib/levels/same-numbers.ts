// Level 9 — the second heart of the app.
//
// The SAME three numbers in the SAME order, once without a bubble and once
// with, worked all the way through back to back. They land on different
// answers. That is the proof that the bubble does real work and that order is
// not decoration — and she gets it by doing both, not by being told.
//
// The two totals differ by a × (c − 1), which the ranges below keep above zero.
import type { Framework, Problem } from "../types";
import type { Rng } from "../rng";
import { close, evalTokens, exprFigure, exprText, num, op, open } from "../expr";
import { FAM, plainState, readStep, scriptFor } from "./shared";

function generate(rng: Rng): Problem {
  const a = rng.int(1, 6);
  const b = rng.int(2, 6);
  const c = rng.int(2, 5);
  const plain = [num(a), op("+"), num(b), op("*"), num(c)];
  const bubbled = [open(), num(a), op("+"), num(b), close(), op("*"), num(c)];
  const totalPlain = evalTokens(plain);
  const totalBubbled = evalTokens(bubbled);
  const BUBBLE = "bubble";
  const YES = "yes";

  return {
    promptText: `Same numbers. Same order. One little bubble. Let's see what it does…`,
    figure: exprFigure(plain),
    steps: [
      ...scriptFor(rng, plain, { prefix: "p" }),
      {
        id: "notice",
        ask: `Now look at this one: ${exprText(bubbled)}. What has changed?`,
        answer: BUBBLE,
        input: "choice",
        choices: rng.shuffle([
          { label: `A bubble has been drawn round the ${a} + ${b}`, value: BUBBLE },
          { label: "The numbers are different", value: "numbers" },
          { label: "The × has been swapped for a +", value: "signs" },
        ]),
        hint: "Read the two lines side by side. The numbers and the signs are all the same…",
        decoyQuestions: [
          "Should I answer with the number I just got?",
          "Are the numbers bigger this time?",
          "Should I skip this one?",
        ],
        figState: plainState(bubbled),
      },
      ...scriptFor(rng, bubbled, { prefix: "b", read: false }),
      {
        id: "compare",
        ask: "Same three numbers — did the bubble change the answer?",
        answer: YES,
        input: "choice",
        choices: rng.shuffle([
          { label: "Yes — it came out different!", value: YES },
          { label: "No — it came out the same", value: "no" },
        ]),
        hint: "Look at the two answers you worked out. Are they the same number or not?",
        decoyQuestions: [
          "Should I work the first one out again?",
          "Which answer is the biggest?",
          "Does it matter?",
        ],
      },
      readStep(bubbled, totalBubbled, "b"),
    ],
    finalAsk: "Two sums, same numbers — what does each one come to?",
    finalAnswers: [
      { label: exprText(plain), value: totalPlain },
      { label: exprText(bubbled), value: totalBubbled },
    ],
    data: { a, b, c, totalPlain, totalBubbled },
  };
}

export const sameNumbers: Framework = {
  id: "same-numbers",
  title: "Same Numbers, Different Answer",
  emoji: "⚖️",
  family: FAM.bubble,
  blurb: "2 + 3 × 4 and (2 + 3) × 4 are NOT the same. Find out why.",
  generate,
  invariant: (d) =>
    d.totalPlain === d.a + d.b * d.c &&
    d.totalBubbled === (d.a + d.b) * d.c &&
    d.totalPlain !== d.totalBubbled, // the entire point of the level
};
