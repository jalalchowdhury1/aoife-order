import type { ReactNode } from "react";
import type { FigureSpec } from "../types";
import type { ExprSpec, Token } from "../expr";
import { tokenText } from "../expr";

// ONE line, rewritten in place — the whole figure system of this app.
//
// It never stacks and never scrolls sideways: the chunk she is about to do
// gets ringed, then the ring's contents are replaced by their value and the
// line re-flows shorter. The closing state shows the original expression with
// "= answer", so she finishes looking at the complete written statement.
//
// Design law inherited from the siblings: SEE it happen, never memorise it.
// The ring appears the moment she names the chunk; the value pops the moment
// she works it out.

const colourFor = (tk: Token): string => {
  switch (tk.t) {
    case "num":
      return "text-purple-800";
    case "op":
      return "text-pink-500";
    default:
      return "text-purple-400";
  }
};

// Numbers and signs breathe; brackets hug what's inside them.
const tightAfter = (prev?: Token, cur?: Token): boolean =>
  !prev || prev.t === "open" || cur?.t === "close";

function Tok({
  tk,
  prev,
  glow,
  muted,
}: {
  tk: Token;
  prev?: Token;
  glow?: boolean;
  muted?: boolean;
}) {
  const gap = tightAfter(prev, tk) ? "" : "ml-2";
  const colour = muted ? "text-purple-300" : colourFor(tk);
  return (
    <span className={`${gap} ${colour} ${glow ? "animate-pop text-pink-600" : ""}`}>
      {tokenText(tk)}
    </span>
  );
}

function Line({
  tokens,
  ring,
  glow,
  muted,
}: {
  tokens: Token[];
  ring?: [number, number];
  glow?: number;
  muted?: boolean;
}) {
  const parts: ReactNode[] = [];
  let i = 0;
  while (i < tokens.length) {
    if (ring && i === ring[0] && ring[1] < tokens.length) {
      const inner = tokens.slice(ring[0], ring[1] + 1);
      const gap = tightAfter(tokens[i - 1], tokens[i]) ? "" : "ml-2";
      parts.push(
        <span key={`ring-${i}`} className={`${gap} expr-ring`}>
          {inner.map((tk, k) => (
            <Tok key={k} tk={tk} prev={inner[k - 1]} muted={muted} />
          ))}
        </span>,
      );
      i = ring[1] + 1;
    } else {
      parts.push(
        <Tok key={i} tk={tokens[i]} prev={tokens[i - 1]} glow={glow === i} muted={muted} />,
      );
      i++;
    }
  }
  return <span className="inline-flex items-center flex-wrap justify-center">{parts}</span>;
}

/** A plain coloured expression — used under the bags picture and in choice labels. */
export function ExprTokens({ tokens }: { tokens: Token[] }) {
  return <Line tokens={tokens} />;
}

export function ExprLine({ spec }: { spec: FigureSpec }) {
  const s = spec as ExprSpec;
  const { tokens, ring, glow, done, origin } = s.state;
  const full = origin ?? s.original;

  return (
    <div className="flex justify-center mb-3">
      <div className="expr-card text-center">
        {done !== undefined ? (
          <div className="text-4xl font-bold leading-relaxed">
            <Line tokens={full} muted />
            <span className="ml-3 text-purple-400">=</span>
            <span className="ml-3 text-green-600 animate-pop">{done}</span>
          </div>
        ) : (
          <div className="text-4xl font-bold leading-relaxed">
            <Line tokens={tokens} ring={ring} glow={glow} />
          </div>
        )}
        {ring && done === undefined && (
          <div className="text-sm text-amber-700 mt-2 font-bold">👆 do this bit first</div>
        )}
      </div>
    </div>
  );
}
