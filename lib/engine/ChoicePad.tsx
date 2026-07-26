"use client";

import type { Choice } from "../types";
import { renderRich } from "./rich";

interface ChoicePadProps {
  choices: Choice[];
  onPick: (value: number | string) => void;
  variant?: "normal" | "lead";
  disabled?: boolean;
}

export function ChoicePad({ choices, onPick, variant = "normal", disabled }: ChoicePadProps) {
  const cls = variant === "lead" ? "q-choice-lead" : "q-choice";
  return (
    <div className="flex flex-col gap-2 max-w-md mx-auto w-full">
      {choices.map((c, i) => (
        <button
          key={i}
          type="button"
          className={`${cls} px-4 py-4 text-lg font-semibold text-purple-800`}
          onClick={() => onPick(c.value)}
          disabled={disabled}
        >
          {renderRich(c.label)}
        </button>
      ))}
    </div>
  );
}
