// Level 3 — THE PROOF, and the most important level in the app.
//
// Two children count the same sweets and disagree. The picture settles it, not
// a rule and not the app: Ben works left to right and ends up with sweets that
// simply aren't there. She sees the wrong method fail against something real.
//
// Ben always OVERCOUNTS — the gap is loose × (per − 1), which `bagsSetup`
// keeps above zero — so "the picture has fewer than that" is exact wording,
// never a near-miss she could argue with.
import type { Framework, Problem } from "../types";
import type { Rng } from "../rng";
import { bagsFigure, exprText } from "../expr";
import { FAM, bagsSetup } from "./shared";

function generate(rng: Rng): Problem {
  const { item, per, bags, loose, inBags, total, wrong, tokens } = bagsSetup(rng);
  const base = { expr: tokens };
  const NO = "no";

  return {
    promptText: `Ben and Aoife counted the SAME sweets and got different answers. Only one of them can be right!`,
    figure: bagsFigure(loose, bags, per, item, base),
    steps: [
      {
        id: "count-real",
        ask: "First — count the picture yourself. How many sweets are really there?",
        answer: total,
        input: "number",
        hint: "Work out what's in the bags, then count the loose ones on as well.",
        decoyQuestions: [
          "Should I guess which child is right?",
          "How many bags are there?",
          "Should I read the sum before I look at the picture?",
        ],
        figState: { ...base, merged: true },
      },
      {
        id: "ben",
        ask: `Ben went straight left to right: he did ${loose} + ${bags} = ${loose + bags} first, then ${loose + bags} × ${per}. What did Ben get?`,
        answer: wrong,
        input: "number",
        hint: `Do what Ben did, even though it's wrong: ${loose + bags} lots of ${per}.`,
        decoyQuestions: [
          "Should I do it the right way instead?",
          "Should I skip Ben's way?",
          "How many did Aoife get?",
        ],
        figState: { ...base, merged: true },
      },
      {
        id: "check",
        ask: `Look at the picture. Are there really ${wrong} sweets there?`,
        answer: NO,
        input: "choice",
        choices: rng.shuffle([
          { label: `No — the picture has fewer than ${wrong}`, value: NO },
          { label: `Yes — Ben counted them right`, value: "yes" },
        ]),
        hint: "You already counted the real sweets. Is Ben's number the same as yours?",
        decoyQuestions: [
          "Should I just believe Ben?",
          "Should I count the bags again?",
          "Does it matter who is right?",
        ],
        figState: { ...base, merged: true },
      },
      {
        id: "aoife-bags",
        ask: `Aoife filled the bags FIRST: ${bags} × ${per} = ?`,
        answer: inBags,
        input: "number",
        hint: `${bags} lots of ${per} — count up in ${per}s, ${bags} times.`,
        decoyQuestions: [
          "Should I add the loose ones on first, like Ben?",
          "Should I count the bags on their own?",
          "Is Ben's way quicker?",
        ],
        figState: { ...base, merged: true },
      },
      {
        id: "aoife-total",
        ask: `…then tipped the loose ones in: ${loose} + ${inBags} = ?`,
        answer: total,
        input: "number",
        hint: "Start at the bigger number and count on the smaller one.",
        decoyQuestions: [
          "Should I multiply these instead?",
          "Should I start Ben's way again?",
          "Do I take the loose ones away?",
        ],
        figState: { ...base, merged: true },
      },
      {
        id: "read",
        ask: `Aoife matched the picture. So what is ${exprText(tokens)}?`,
        answer: total,
        input: "number",
        hint: "It's the number you counted off the picture at the very start.",
        decoyQuestions: [
          "Should I use Ben's number after all?",
          "Do I add both children's answers together?",
        ],
        figState: { ...base, merged: true, total },
      },
    ],
    finalAsk: `What is ${exprText(tokens)}?`,
    finalAnswers: [{ label: exprText(tokens), value: total }],
    data: { loose, bags, per, inBags, total, wrong },
  };
}

export const twoWays: Framework = {
  id: "two-ways",
  title: "Two Ways to Count",
  emoji: "⚖️",
  family: FAM.bags,
  blurb: "Ben counts left to right. The picture says he's wrong. Why?",
  generate,
  invariant: (d) =>
    d.total === d.loose + d.bags * d.per &&
    d.wrong === (d.loose + d.bags) * d.per &&
    d.wrong > d.total, // Ben must always overcount — the level's whole argument
};
