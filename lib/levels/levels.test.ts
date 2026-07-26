// The generator contract (DO NOT BREAK) — every level, 500 seeds.
// Inherited from aoife-columns / aoife-frameworks, plus the working-line rules
// this app needs (rules 7 and 9).
import { describe, it, expect } from "vitest";
import { makeRng } from "../rng";
import { LEVELS } from "./index";
import { evalTokens, figureAt, type BagsSpec, type ExprSpec, type ExprState } from "../expr";
import type { Problem } from "../types";

const SEEDS = 500;

// Arithmetic decoys must never evaluate to a live answer (rule 5). × is in the
// character class on purpose — in THIS app a "what is 3 × 4?" decoy that lands
// on a real answer is the likeliest way to reward wrong reasoning.
const ARITH_RE = /what is (\d+)\s*([+×*−-])\s*(\d+)\?/i;

function liveAnswers(p: Problem): Set<number> {
  const s = new Set<number>();
  for (const st of p.steps) if (typeof st.answer === "number") s.add(st.answer);
  for (const f of p.finalAnswers) s.add(f.value);
  return s;
}

const isExprState = (s: unknown): s is ExprState =>
  !!s && typeof s === "object" && "tokens" in (s as object);

describe("level registry", () => {
  it("has 14 levels with unique ids", () => {
    expect(LEVELS.length).toBe(14);
    expect(new Set(LEVELS.map((f) => f.id)).size).toBe(14);
  });
});

for (const level of LEVELS) {
  describe(`level: ${level.id}`, () => {
    // rule 8 bookkeeping: a choice answer that never varies must not sit still
    const correctValues = new Map<string, Set<string>>();
    const correctIndices = new Map<string, Set<number>>();

    it(`obeys the generator contract across ${SEEDS} seeds`, () => {
      for (let seed = 1; seed <= SEEDS; seed++) {
        const p = level.generate(makeRng(seed));
        const answers = liveAnswers(p);
        const finalValues = new Set(p.finalAnswers.map((f) => f.value));
        const asks = new Set(p.steps.map((s) => s.ask));

        expect(new Set(p.steps.map((s) => s.id)).size, "step ids unique").toBe(p.steps.length);
        expect(p.steps.length).toBeGreaterThan(0);

        for (const step of p.steps) {
          // rule 1: numeric answers are non-negative integers
          if (step.input === "number") {
            expect(Number.isInteger(step.answer), `${step.id} answer int`).toBe(true);
            expect(Number(step.answer)).toBeGreaterThanOrEqual(0);
          }

          // rule 2: every step has a hint and at least two decoys
          expect(step.hint.length, `${step.id} hint`).toBeGreaterThan(0);
          expect(step.decoyQuestions.length, `${step.id} decoys`).toBeGreaterThanOrEqual(2);
          expect(new Set(step.decoyQuestions).size, `${step.id} decoys unique`).toBe(
            step.decoyQuestions.length,
          );

          for (const d of step.decoyQuestions) {
            expect(d).not.toBe(step.ask);
            // rule 9: a decoy may never be a question the app itself teaches
            // elsewhere in this problem — picking it would be punished for
            // being right somewhere else.
            expect(asks.has(d), `decoy "${d}" is another step's ask`).toBe(false);
            // rule 5: arithmetic decoys can't equal any live answer
            const m = d.match(ARITH_RE);
            if (m) {
              const x = Number(m[1]);
              const y = Number(m[3]);
              const v = m[2] === "+" ? x + y : m[2] === "×" || m[2] === "*" ? x * y : x - y;
              expect(answers.has(v), `decoy "${d}" collides with a real answer`).toBe(false);
            }
          }

          // rule 10: no degenerate bag. "1 × 5" is one lot of five — it teaches
          // nothing about building, and makes the × look pointless. Every bare
          // multiplication she is ever asked to do has both factors ≥ 2.
          for (const m of step.ask.matchAll(/(\d+)\s*×\s*(\d+)/g)) {
            expect(Number(m[1]), `${step.id}: "${m[0]}" has a factor of 1`).toBeGreaterThan(1);
            expect(Number(m[2]), `${step.id}: "${m[0]}" has a factor of 1`).toBeGreaterThan(1);
          }

          // rule 3: choice steps are well-formed and have exactly one right answer
          if (step.input === "choice") {
            expect(step.choices, `${step.id} choices`).toBeDefined();
            expect(step.choices!.length).toBeGreaterThanOrEqual(2);
            expect(
              new Set(step.choices!.map((c) => String(c.value))).size,
              `${step.id} choice values unique`,
            ).toBe(step.choices!.length);
            const hits = step.choices!.filter((c) => c.value === step.answer);
            expect(hits.length, `${step.id} exactly one correct`).toBe(1);

            if (!correctValues.has(step.id)) {
              correctValues.set(step.id, new Set());
              correctIndices.set(step.id, new Set());
            }
            correctValues.get(step.id)!.add(String(step.answer));
            correctIndices
              .get(step.id)!
              .add(step.choices!.findIndex((c) => c.value === step.answer));
          }
        }

        // rule 4: every final is a non-negative int, is actually REACHED by a
        // numeric step, and the script ENDS on one
        const numericStepAnswers = new Set(
          p.steps.filter((s) => s.input === "number").map((s) => Number(s.answer)),
        );
        expect(p.finalAnswers.length).toBeGreaterThan(0);
        for (const f of p.finalAnswers) {
          expect(Number.isInteger(f.value)).toBe(true);
          expect(f.value).toBeGreaterThanOrEqual(0);
          expect(numericStepAnswers.has(f.value), `final "${f.label}" is reached`).toBe(true);
        }
        const last = p.steps[p.steps.length - 1];
        expect(
          p.finalAnswers.some((f) => f.value === Number(last.answer)),
          "last step's answer is a final answer",
        ).toBe(true);

        // rule 6: the level's own invariant
        expect(level.invariant(p.data), `invariant seed ${seed}`).toBe(true);

        // rule 7: THE WORKING LINE NEVER LIES.
        // At every point in the script the line on screen must still mean the
        // same thing it started as — i.e. it must evaluate to one of the
        // problem's final answers. This is what makes it safe for her to trust
        // what she sees.
        expect(p.figure).toBeDefined();
        for (const step of p.steps) {
          const st = step.figState;
          if (!st) continue;

          // rule 7a: THE FIGURE NEVER ANNOUNCES A NUMBER SHE HASN'T SAID YET.
          // A picture that shows the total before she works it out hands her
          // the answer; the sibling apps have been bitten by exactly this. A
          // total/closing statement may only appear on the step that earns it.
          const shown = isExprState(st) ? st.done : (st as { total?: number }).total;
          if (shown !== undefined) {
            expect(
              Number(step.answer),
              `${level.id}/${step.id}: figure shows ${shown} before it is answered`,
            ).toBe(shown);
          }

          if (!isExprState(st)) continue;
          expect(
            finalValues.has(evalTokens(st.tokens)),
            `${level.id} seed ${seed}: line at step ${step.id} (${JSON.stringify(
              st.tokens,
            )}) doesn't evaluate to a final answer`,
          ).toBe(true);
          if (st.done !== undefined) {
            expect(st.done, `${step.id} closing statement`).toBe(evalTokens(st.origin ?? []));
          }
        }

        // and the finished figure shows the truth
        const fig = figureAt(p, p.steps.length)!;
        if (fig.kind === "expr") {
          const state = (fig as ExprSpec).state;
          expect(state.tokens.length, "line is worked down to one number").toBe(1);
          expect(finalValues.has(evalTokens(state.tokens))).toBe(true);
        } else {
          const bags = fig as BagsSpec;
          const state = bags.state;
          expect(state.total, "bags picture ends on the true total").toBe(
            bags.loose + bags.bags * bags.per,
          );
          if (state.expr) expect(evalTokens(state.expr)).toBe(state.total);
        }
      }

      // rule 8: a choice answer that never changes must not always sit in the
      // same slot, or she learns the position instead of the maths
      for (const [stepId, values] of correctValues) {
        if (values.size === 1) {
          expect(
            correctIndices.get(stepId)!.size,
            `${level.id}/${stepId}: correct choice position must vary across seeds`,
          ).toBeGreaterThan(1);
        }
      }
    });
  });
}
