"use client";

import { useMemo, useState } from "react";
import type { Framework } from "../types";
import { makeRng } from "../rng";
import { Figure } from "../figures/Figure";
import { renderRich } from "./rich";
import { SoloRunner } from "./StageRunner";

const RUN = 5;

// 🔁 Practice: five fresh Solo problems of the same framework, back to back.
// ⭐ = solved first try, ✅ = solved after a retry. A wrong answer never resets
// the run — she just keeps trying that problem, exactly like Solo.
export function PracticeRunner({
  framework,
  baseSeed,
  onFinish,
}: {
  framework: Framework;
  baseSeed: number;
  onFinish: (perfect: boolean) => void;
}) {
  const [idx, setIdx] = useState(0);
  const [slots, setSlots] = useState<("star" | "check")[]>([]);

  const problem = useMemo(
    () => framework.generate(makeRng(baseSeed + idx)),
    [framework, baseSeed, idx],
  );

  const solved = (firstTry: boolean) => {
    const next = [...slots, firstTry ? ("star" as const) : ("check" as const)];
    setSlots(next);
    if (next.length >= RUN) {
      onFinish(next.every((s) => s === "star"));
    } else {
      setIdx(idx + 1);
    }
  };

  return (
    <div>
      {/* run header: five quality slots + position */}
      <div className="flex items-center justify-center gap-2 mb-3">
        {Array.from({ length: RUN }).map((_, i) => (
          <span
            key={i}
            className={`w-9 h-9 rounded-full border-2 flex items-center justify-center text-lg ${
              i < slots.length
                ? "bg-amber-50 border-amber-300"
                : i === slots.length
                  ? "bg-white border-purple-400"
                  : "bg-gray-50 border-gray-200"
            }`}
          >
            {i < slots.length ? (slots[i] === "star" ? "⭐" : "✅") : i === slots.length ? "🐇" : ""}
          </span>
        ))}
        <span className="ml-2 text-sm font-bold text-purple-500">
          Problem {Math.min(slots.length + 1, RUN)} of {RUN}
        </span>
      </div>

      {/* the problem — PracticeRunner owns prompt + figure (it changes mid-run) */}
      <div className="bg-white border-4 border-pink-200 rounded-2xl p-4 mb-3 text-lg text-gray-800 leading-snug">
        {renderRich(problem.promptText)}
      </div>
      <Figure spec={problem.figure} />

      <SoloRunner
        key={idx}
        problem={problem}
        onComplete={() => {}}
        celebrate={false}
        onSolved={solved}
      />
    </div>
  );
}
