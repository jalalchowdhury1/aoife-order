import type { Framework } from "../types";
import { FAM } from "./shared";
import { countTheBags } from "./count-the-bags";
import { writeItDown } from "./write-it-down";
import { twoWays } from "./two-ways";
import { builderFirst } from "./builder-first";
import { builderHides } from "./builder-hides";
import { nothingToBuild } from "./nothing-to-build";
import { twoBuilders } from "./two-builders";
import { bubbleFirst } from "./bubble-first";
import { sameNumbers } from "./same-numbers";
import { bubbleMoves } from "./bubble-moves";
import { twoBubbles } from "./two-bubbles";
import { isBenRight } from "./is-ben-right";
import { drawTheBubble } from "./draw-the-bubble";
import { theBigOne } from "./the-big-one";

// Ladder order — Level 1..14, concrete first. The home page rings the first
// level without a solo pass. Nothing is ever locked; she can wander.
//
// Adding or removing a level means updating THIS array and the count assertion
// in levels.test.ts together — LEVEL_NUM and "start here" both come from
// array position.
export const LEVELS: Framework[] = [
  countTheBags,
  writeItDown,
  twoWays,
  builderFirst,
  builderHides,
  nothingToBuild,
  twoBuilders,
  bubbleFirst,
  sameNumbers,
  bubbleMoves,
  twoBubbles,
  isBenRight,
  drawTheBubble,
  theBigOne,
];

export const FAMILIES = [FAM.bags, FAM.build, FAM.bubble, FAM.detective];

export const LEVEL_NUM: Record<string, number> = Object.fromEntries(
  LEVELS.map((f, i) => [f.id, i + 1]),
);

export const byId = (id: string) => LEVELS.find((f) => f.id === id);
