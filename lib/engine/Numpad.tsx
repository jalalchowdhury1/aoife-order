"use client";

interface NumpadProps {
  value: string;
  onDigit: (d: string) => void;
  onClear: () => void;
  onSubmit: () => void;
  disabled?: boolean;
}

const DIGITS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

export function Numpad({ value, onDigit, onClear, onSubmit, disabled }: NumpadProps) {
  return (
    <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto w-full">
      {DIGITS.map((d) => (
        <button
          key={d}
          type="button"
          className="btn-numpad h-16"
          onClick={() => onDigit(d)}
          disabled={disabled}
        >
          {d}
        </button>
      ))}
      <button
        type="button"
        className="btn-numpad btn-numpad-clear h-16 text-xl"
        onClick={onClear}
        disabled={disabled}
      >
        C
      </button>
      <button
        type="button"
        className="btn-numpad h-16"
        onClick={() => onDigit("0")}
        disabled={disabled}
      >
        0
      </button>
      <button
        type="button"
        className="btn-numpad btn-numpad-submit h-16"
        onClick={onSubmit}
        disabled={disabled || value.length === 0}
        aria-label="submit"
      >
        ✔︎
      </button>
    </div>
  );
}
