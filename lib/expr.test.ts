// The model's own tests. These prove the RULE is right, independently of any
// level — the levels then only choose which shapes to hand it.
import { describe, it, expect } from "vitest";
import {
  chunkLabel,
  chunkOptions,
  close,
  evalTokens,
  exprText,
  nextChunk,
  num,
  op,
  open,
  reduceChunk,
  solvePath,
  type Token,
} from "./expr";

const E = {
  plain: [num(2), op("+"), num(3), op("*"), num(4)],
  leftBuilder: [num(3), op("*"), num(4), op("+"), num(2)],
  allPlus: [num(2), op("+"), num(3), op("+"), num(4)],
  twoBuilders: [num(2), op("*"), num(3), op("+"), num(4), op("*"), num(5)],
  bubbled: [open(), num(2), op("+"), num(3), close(), op("*"), num(4)],
  bubbleRight: [num(2), op("*"), open(), num(3), op("+"), num(4), close()],
  twoBubbles: [
    open(), num(2), op("+"), num(3), close(),
    op("*"),
    open(), num(4), op("+"), num(1), close(),
  ],
  fourTerm: [num(2), op("+"), num(3), op("*"), num(4), op("+"), num(5)],
} satisfies Record<string, Token[]>;

describe("exprText", () => {
  it("spaces signs and hugs brackets", () => {
    expect(exprText(E.plain)).toBe("2 + 3 × 4");
    expect(exprText(E.bubbled)).toBe("(2 + 3) × 4");
    expect(exprText(E.twoBubbles)).toBe("(2 + 3) × (4 + 1)");
    expect(exprText(E.bubbleRight)).toBe("2 × (3 + 4)");
  });
});

describe("evalTokens", () => {
  it("puts builders before gatherers and brackets before everything", () => {
    expect(evalTokens(E.plain)).toBe(14);
    expect(evalTokens(E.leftBuilder)).toBe(14);
    expect(evalTokens(E.allPlus)).toBe(9);
    expect(evalTokens(E.twoBuilders)).toBe(26);
    expect(evalTokens(E.bubbled)).toBe(20);
    expect(evalTokens(E.bubbleRight)).toBe(14);
    expect(evalTokens(E.twoBubbles)).toBe(25);
    expect(evalTokens(E.fourTerm)).toBe(19);
  });
});

describe("nextChunk", () => {
  it("takes the × before the +", () => {
    expect(chunkLabel(E.plain, nextChunk(E.plain)!)).toBe("3 × 4");
    expect(chunkLabel(E.leftBuilder, nextChunk(E.leftBuilder)!)).toBe("3 × 4");
  });

  it("takes a bracket even when a × is sitting outside it", () => {
    expect(chunkLabel(E.bubbled, nextChunk(E.bubbled)!)).toBe("(2 + 3)");
    expect(chunkLabel(E.bubbleRight, nextChunk(E.bubbleRight)!)).toBe("(3 + 4)");
  });

  it("takes the leftmost when everything is the same family", () => {
    expect(chunkLabel(E.allPlus, nextChunk(E.allPlus)!)).toBe("2 + 3");
  });

  it("returns null once a single number is left", () => {
    expect(nextChunk([num(7)])).toBe(null);
  });

  it("reduces the bracket away, parens and all", () => {
    const c = nextChunk(E.bubbled)!;
    expect(exprText(reduceChunk(E.bubbled, c))).toBe("5 × 4");
  });
});

describe("solvePath", () => {
  for (const [name, tokens] of Object.entries(E)) {
    it(`walks ${name} down to the right answer`, () => {
      const moves = solvePath(tokens);
      expect(moves.length).toBeGreaterThan(0);
      const last = moves[moves.length - 1];
      expect(last.after.length).toBe(1);
      expect(evalTokens(last.after)).toBe(evalTokens(tokens));
      // the line means the same thing at every point in the working
      for (const m of moves) {
        expect(evalTokens(m.before)).toBe(evalTokens(tokens));
        expect(evalTokens(m.after)).toBe(evalTokens(tokens));
      }
    });
  }
});

describe("chunkOptions — the honesty rule", () => {
  it("offers the genuinely wrong move as a distractor", () => {
    const opts = chunkOptions(E.plain);
    expect(opts.find((o) => o.correct)!.label).toBe("3 × 4");
    expect(opts.map((o) => o.label)).toContain("2 + 3");
  });

  it("puts a bracket ahead of the × that ignores it", () => {
    const opts = chunkOptions(E.bubbled);
    expect(opts.find((o) => o.correct)!.label).toBe("(2 + 3)");
    expect(opts.map((o) => o.label)).toContain("3 × 4");
  });

  // The rule that keeps the app honest: an ordering that reaches the same
  // answer must NEVER be presented as a mistake.
  it("never offers the other × as wrong when either × may go first", () => {
    const opts = chunkOptions(E.twoBuilders);
    expect(opts.find((o) => o.correct)!.label).toBe("2 × 3");
    expect(opts.map((o) => o.label)).not.toContain("4 × 5");
    expect(opts.map((o) => o.label)).toContain("3 + 4");
  });

  it("never offers the other bubble as wrong", () => {
    const opts = chunkOptions(E.twoBubbles);
    expect(opts.find((o) => o.correct)!.label).toBe("(2 + 3)");
    expect(opts.map((o) => o.label)).not.toContain("4 + 1");
  });

  it("asks nothing at all when the order truly cannot matter", () => {
    expect(chunkOptions(E.allPlus).length).toBe(1); // 2+3 first or 3+4 first — same answer
  });

  it("every distractor really does change the answer", () => {
    for (const tokens of Object.values(E)) {
      const truth = evalTokens(tokens);
      for (const o of chunkOptions(tokens)) {
        if (o.correct) continue;
        // reconstructing the wrong move must land somewhere else
        expect(o.label).not.toBe(chunkLabel(tokens, nextChunk(tokens)!));
      }
      expect(truth).toBe(evalTokens(tokens));
    }
  });
});
