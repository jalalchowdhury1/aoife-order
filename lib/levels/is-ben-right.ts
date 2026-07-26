// Level 12 — marking someone else's work.
//
// Spotting a mistake in another person's method is a much harder test than
// doing it yourself, and it's the one that shows the idea has really landed.
// Ben's error is ALWAYS the same one: he gathered before he built. Half the
// time he happens to be right, so "Ben is wrong" can never become the reflex
// answer.
import type { Framework, Problem } from "../types";
import type { Rng } from "../rng";
import { evalTokens, exprFigure, exprText, num, op, type Token } from "../expr";
import { FAM, finalFor, readStep, scriptFor } from "./shared";

function generate(rng: Rng): Problem {
  const a = rng.int(1, 6);
  const b = rng.int(2, 5);
  const c = rng.int(2, 5);
  const onLeft = rng.int(0, 1) === 1;
  const tokens: Token[] = onLeft
    ? [num(b), op("*"), num(c), op("+"), num(a)]
    : [num(a), op("+"), num(b), op("*"), num(c)];
  const truth = evalTokens(tokens);

  // Ben's one and only mistake: do the + before the ×.
  const benSlip = onLeft ? b * (c + a) : (a + b) * c;
  const benWrong = rng.int(0, 1) === 1;
  const benAnswer = benWrong ? benSlip : truth;
  const YES = "yes";
  const NO = "no";
  const GATHERED = "gathered";
  const BUILT = "built";

  return {
    promptText: `Ben has had a go at ${exprText(tokens)}. Work it out yourself first — then mark his work!`,
    figure: exprFigure(tokens),
    steps: [
      ...scriptFor(rng, tokens, { read: false }),
      {
        id: "verdict",
        ask: `Ben says ${exprText(tokens)} = ${benAnswer}. Is Ben right?`,
        answer: benWrong ? NO : YES,
        input: "choice",
        choices: rng.shuffle([
          { label: "Yes — that's what I got too", value: YES },
          { label: "No — that's not what I got", value: NO },
        ]),
        hint: "Compare Ben's number with the one you just worked out on your line.",
        decoyQuestions: [
          "Should I just trust Ben?",
          "Is Ben's number bigger or smaller?",
          "Should I work it out Ben's way instead?",
        ],
      },
      {
        id: "diagnose",
        ask: "What did Ben do FIRST?",
        answer: benWrong ? GATHERED : BUILT,
        input: "choice",
        choices: rng.shuffle([
          { label: "He built the bag first (the ×)", value: BUILT },
          { label: "He gathered first (the +)", value: GATHERED },
        ]),
        hint: "Try it both ways in your head and see which one lands on Ben's number.",
        decoyQuestions: [
          "How many numbers did Ben use?",
          "Did Ben write it neatly?",
          "Should I give Ben a new sum?",
        ],
      },
      readStep(tokens, truth),
    ],
    ...finalFor(tokens),
    data: { a, b, c, truth, benAnswer, benWrong: benWrong ? 1 : 0 },
  };
}

export const isBenRight: Framework = {
  id: "is-ben-right",
  title: "Is Ben Right?",
  emoji: "❌",
  family: FAM.detective,
  blurb: "Mark someone else's work — and say exactly what went wrong.",
  generate,
  invariant: (d) =>
    d.truth >= 0 &&
    (d.benWrong === 1 ? d.benAnswer !== d.truth : d.benAnswer === d.truth),
};
