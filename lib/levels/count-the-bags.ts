// Level 1 — before a single symbol appears.
//
// She counts a real thing and finds out for herself that the bags have to be
// filled before the pile can be counted. Everything the app teaches later is
// this discovery written down; if this level doesn't land, nothing else will.
import type { Framework, Problem } from "../types";
import type { Rng } from "../rng";
import { bagsFigure } from "../expr";
import { FAM, bagsSetup } from "./shared";

function generate(rng: Rng): Problem {
  const { item, per, bags, loose, inBags, total } = bagsSetup(rng);

  return {
    promptText: `Aoife has ${loose} loose ${item} and ${bags} bags. Every bag has the same number inside.`,
    figure: bagsFigure(loose, bags, per, item),
    steps: [
      {
        id: "per",
        ask: "How many are inside ONE bag?",
        answer: per,
        input: "number",
        hint: "Peek inside any bag and count what's in it — every bag holds the same.",
        decoyQuestions: [
          "How many bags are there?",
          "Should I count everything on the screen?",
          "Which bag is the biggest?",
        ],
      },
      {
        id: "in-bags",
        ask: `${bags} bags with ${per} inside each. How many are IN THE BAGS altogether?`,
        answer: inBags,
        input: "number",
        hint: `Count up in ${per}s — once for each bag. Leave the loose ones out of it for now.`,
        decoyQuestions: [
          "Should I count the loose ones in as well?",
          "How many bags are still shut?",
          "Should I take the loose ones away?",
        ],
        figState: { spilled: true },
      },
      {
        id: "total",
        ask: `Now tip the ${loose} loose ones in too. How many altogether?`,
        answer: total,
        input: "number",
        hint: `You already know what came out of the bags — count on the loose ones from there.`,
        decoyQuestions: [
          "Should I put them back in the bags?",
          "How many are left over?",
          "Should I count the bags again?",
        ],
        figState: { merged: true, total },
      },
    ],
    finalAsk: "How many altogether?",
    finalAnswers: [{ label: "altogether", value: total }],
    data: { loose, bags, per, inBags, total },
  };
}

export const countTheBags: Framework = {
  id: "count-the-bags",
  title: "Sweets in Bags",
  emoji: "🍬",
  family: FAM.bags,
  blurb: "Fill the bags first, then tip everything into one pile.",
  generate,
  invariant: (d) =>
    d.inBags === d.bags * d.per &&
    d.total === d.loose + d.inBags &&
    d.per >= 2 &&
    d.loose >= 1 &&
    d.bags >= 2,
};
