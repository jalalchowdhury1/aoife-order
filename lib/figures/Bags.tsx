import type { FigureSpec } from "../types";
import type { BagsSpec } from "../expr";
import { ExprTokens } from "./ExprLine";

// The concrete picture behind the whole rule: a few loose sweets, plus some
// bags with the same number in each.
//
// She counts THIS, and it is the picture — never the symbols — that settles
// which method is right in level 3. Two hard rules:
//   1. The picture must always be countable.
//   2. It must NEVER state a total she hasn't worked out yet. `spilled`,
//      `merged` and `total` only ever arrive on a step's figState, which the
//      engine shows AFTER she has answered that step.

function Item({ item }: { item: string }) {
  return <span className="text-2xl leading-none">{item}</span>;
}

function Pile({ n, item, max = "max-w-64" }: { n: number; item: string; max?: string }) {
  return (
    <div className={`flex flex-wrap justify-center gap-1 ${max}`}>
      {Array.from({ length: n }, (_, i) => (
        <Item key={i} item={item} />
      ))}
    </div>
  );
}

function Label({ children, tone }: { children: React.ReactNode; tone: "pink" | "purple" }) {
  return (
    <div
      className={`text-xs font-bold uppercase tracking-wide mb-1 ${
        tone === "pink" ? "text-pink-500" : "text-purple-500"
      }`}
    >
      {children}
    </div>
  );
}

export function Bags({ spec }: { spec: FigureSpec }) {
  const s = spec as BagsSpec;
  const { loose, bags, per, item, state } = s;
  const inBags = bags * per;

  return (
    <div className="flex justify-center mb-3">
      <div className="expr-card">
        {state.merged ? (
          <div className="text-center">
            <Label tone="pink">all in one pile</Label>
            <Pile n={loose + inBags} item={item} />
          </div>
        ) : (
          <div className="flex items-end justify-center gap-4 flex-wrap">
            <div className="text-center">
              <Label tone="pink">loose</Label>
              <div className="min-h-8">
                <Pile n={loose} item={item} max="max-w-24" />
              </div>
            </div>

            <div className="text-3xl text-purple-300 pb-2">+</div>

            <div className="text-center">
              <Label tone="purple">
                {state.spilled ? "out of the bags" : `${bags} bags of ${per}`}
              </Label>
              {state.spilled ? (
                <Pile n={inBags} item={item} max="max-w-40" />
              ) : (
                <div className="flex gap-2 flex-wrap justify-center">
                  {Array.from({ length: bags }, (_, b) => (
                    <div
                      key={b}
                      className="border-4 border-purple-300 bg-purple-50 rounded-xl p-1.5 flex flex-wrap justify-center gap-0.5 w-16"
                    >
                      {Array.from({ length: per }, (_, i) => (
                        <Item key={i} item={item} />
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {(state.expr || state.total !== undefined) && (
          <div className="mt-4 pt-3 border-t-2 border-dashed border-purple-200 text-center text-3xl font-bold">
            {state.expr && <ExprTokens tokens={state.expr} />}
            {state.total !== undefined && (
              <>
                {state.expr && <span className="ml-3 text-purple-400">=</span>}
                <span className="ml-3 text-green-600 animate-pop">{state.total}</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
