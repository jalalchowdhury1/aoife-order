import type { Rng } from "./rng";
import type { ExprState, BagsState } from "./expr";

export type Stage = "watch" | "together" | "lead" | "solo";
export const STAGES: Stage[] = ["watch", "together", "lead", "solo"];
export const STAGE_LABEL: Record<Stage, string> = {
  watch: "👀 Watch",
  together: "🤝 Together",
  lead: "🧭 Lead",
  solo: "🦋 Solo",
};
export const STAGE_BLURB: Record<Stage, string> = {
  watch: "Watch how it's done — read each move and its answer.",
  together: "Your turn to answer each move. I'll give the questions.",
  lead: "Now YOU pick the right move, then do it.",
  solo: "All on your own! Solve it and tell me the answer.",
};

export type InputKind = "number" | "choice";
export interface Choice {
  label: string;
  value: number | string;
}

/** Cumulative display snapshot attached to a step (see lib/expr.ts). */
export type FigState = ExprState | BagsState;

export interface Step {
  id: string;
  ask: string; // the move/question with values filled in
  answer: number | string; // expected answer
  input: InputKind;
  choices?: Choice[]; // when input === "choice"
  hint: string; // nudge after a wrong attempt — never the answer
  decoyQuestions: string[]; // Lead stage: plausible-but-wrong "next moves"
  figState?: FigState; // figure snapshot shown once this step is answered
}

export interface FigureSpec {
  kind: string;
  [k: string]: unknown;
}

export interface FinalAnswer {
  label: string;
  value: number;
}

export interface Problem {
  promptText: string;
  figure?: FigureSpec;
  steps: Step[];
  finalAsk: string;
  finalAnswers: FinalAnswer[];
  data: Record<string, number>; // structured numbers used by the self-test invariant
}

export interface Framework {
  id: string;
  title: string;
  emoji: string;
  family: string;
  blurb: string;
  generate(rng: Rng): Problem;
  invariant(data: Record<string, number>): boolean; // test-only: must hold for every generated problem
}
