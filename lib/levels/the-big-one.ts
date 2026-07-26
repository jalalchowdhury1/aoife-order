// Level 14 — the boss, and deliberately NOT one fixed shape.
//
// Every problem is drawn at random from every shape she has met, including the
// ones with nothing to build. Practising one shape at a time feels like
// learning and mostly isn't; mixing them is what makes the habit stick, because
// she has to decide what kind of problem this is before she can start.
import type { Framework, Problem } from "../types";
import type { Rng } from "../rng";
import { close, evalTokens, exprFigure, num, op, open, type Token } from "../expr";
import { FAM, finalFor, scriptFor } from "./shared";

function generate(rng: Rng): Problem {
  const a = rng.int(2, 5); // a is a × factor in shapes 3 and 5 — never let it be 1
  const b = rng.int(2, 4);
  const c = rng.int(2, 4);
  const d = rng.int(2, 4);
  const shape = rng.int(0, 7);

  const shapes: Token[][] = [
    [num(a), op("+"), num(b), op("*"), num(c)],
    [num(b), op("*"), num(c), op("+"), num(a)],
    [num(a), op("+"), num(b), op("+"), num(c)],
    [num(a), op("*"), num(b), op("+"), num(c), op("*"), num(d)],
    [open(), num(a), op("+"), num(b), close(), op("*"), num(c)],
    [num(a), op("*"), open(), num(b), op("+"), num(c), close()],
    [open(), num(a), op("+"), num(b), close(), op("*"), open(), num(c), op("+"), num(d), close()],
    [num(a), op("+"), num(b), op("*"), num(c), op("+"), num(d)],
  ];

  const tokens = shapes[shape];
  const total = evalTokens(tokens);

  return {
    promptText: "Anything can turn up now! Look first, decide what to do first, then do it.",
    figure: exprFigure(tokens),
    steps: scriptFor(rng, tokens),
    ...finalFor(tokens),
    data: { a, b, c, d, shape, total },
  };
}

export const theBigOne: Framework = {
  id: "the-big-one",
  title: "The Big One",
  emoji: "👑",
  family: FAM.detective,
  blurb: "Every shape you've learned, all mixed up. No warning which is which.",
  generate,
  invariant: (d) => d.total >= 0 && d.shape >= 0 && d.shape <= 7,
};
