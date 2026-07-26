// Level 2 — the bridge. Same picture as level 1, but now the sum is written
// underneath it, and every part of the writing is pointed at a part of the
// picture. Symbols arrive only AFTER the thing they describe.
import type { Framework, Problem } from "../types";
import type { Rng } from "../rng";
import { OP_SIGN, bagsFigure, exprText } from "../expr";
import { FAM, bagsSetup } from "./shared";

function generate(rng: Rng): Problem {
  const { item, per, bags, loose, inBags, total, tokens } = bagsSetup(rng);
  const bagPart = `${bags} ${OP_SIGN["*"]} ${per}`;
  const loosePart = `${loose}`;
  const base = { expr: tokens };

  return {
    promptText: `The very same sweets — now written down as ${exprText(tokens)}.`,
    figure: bagsFigure(loose, bags, per, item, base),
    steps: [
      {
        id: "find-bags",
        ask: `In ${exprText(tokens)}, which part means THE BAGS?`,
        answer: bagPart,
        input: "choice",
        choices: rng.shuffle([
          { label: bagPart, value: bagPart },
          { label: `${loose} + ${bags}`, value: `${loose} + ${bags}` },
          { label: loosePart, value: loosePart },
        ]),
        hint: `There are ${bags} bags with ${per} in each — look for those two numbers held together.`,
        decoyQuestions: [
          "Which part is written first?",
          "Which part has the biggest number?",
          "Should I just work it all out now?",
        ],
        figState: base,
      },
      {
        id: "find-loose",
        ask: "And which part means the LOOSE ones?",
        answer: loosePart,
        input: "choice",
        choices: rng.shuffle([
          { label: loosePart, value: loosePart },
          { label: bagPart, value: bagPart },
          { label: `${per}`, value: `${per}` },
        ]),
        hint: "The loose ones aren't in a bag with anything — they sit on their own.",
        decoyQuestions: [
          "Which part is written last?",
          "Which number is smallest?",
          "Should I count the bags instead?",
        ],
        figState: base,
      },
      {
        id: "bags-value",
        ask: `So what's in the bags? ${bagPart} = ?`,
        answer: inBags,
        input: "number",
        hint: `${bags} × ${per} means ${bags} lots of ${per} — count up in ${per}s, ${bags} times.`,
        decoyQuestions: [
          "Should I add the loose ones in first?",
          "Should I count the bags on their own?",
          "Do I need the loose ones for this bit?",
        ],
        figState: { ...base, spilled: true },
      },
      {
        id: "gather",
        ask: `Tip it all into the pile: ${loose} + ${inBags} = ?`,
        answer: total,
        input: "number",
        hint: "Start at the bigger number and count on the smaller one.",
        decoyQuestions: [
          "Should I put them back in the bags?",
          "Should I take the loose ones away instead?",
          "Do I multiply these two?",
        ],
        figState: { ...base, merged: true, total },
      },
    ],
    finalAsk: `What is ${exprText(tokens)}?`,
    finalAnswers: [{ label: exprText(tokens), value: total }],
    data: { loose, bags, per, inBags, total },
  };
}

export const writeItDown: Framework = {
  id: "write-it-down",
  title: "How We Write It",
  emoji: "✍️",
  family: FAM.bags,
  blurb: "Match the picture to the sum — which bit means the bags?",
  generate,
  invariant: (d) =>
    d.inBags === d.bags * d.per && d.total === d.loose + d.inBags && d.loose !== d.per,
};
