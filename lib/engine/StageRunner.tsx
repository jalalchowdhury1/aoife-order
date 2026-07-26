"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Problem, Stage, Step } from "../types";
import { makeRng } from "../rng";
import { Numpad } from "./Numpad";
import { ChoicePad } from "./ChoicePad";
import { fireConfetti } from "./confetti";
import { renderRich } from "./rich";

interface RunnerProps {
  stage: Stage;
  problem: Problem;
  seed: number;
  onComplete: (stage: Stage) => void;
  onStep?: (completed: number) => void; // lets StageEngine advance the live figure
}

type Feedback = null | "correct" | "wrong" | "revealed" | "badq";

function displayAnswer(step: Step): string {
  if (step.input === "choice" && step.choices) {
    const c = step.choices.find((c) => c.value === step.answer);
    if (c) return c.label;
  }
  return String(step.answer);
}

export function StageRunner({ stage, problem, seed, onComplete, onStep }: RunnerProps) {
  if (stage === "solo") {
    return <SoloRunner problem={problem} onComplete={onComplete} />;
  }
  return (
    <StepRunner
      stage={stage}
      problem={problem}
      seed={seed}
      onComplete={onComplete}
      onStep={onStep}
    />
  );
}

/* ----------------------------- Watch / Together / Lead ----------------------------- */

function StepRunner({
  stage,
  problem,
  seed,
  onComplete,
  onStep,
}: {
  stage: Stage;
  problem: Problem;
  seed: number;
  onComplete: (stage: Stage) => void;
  onStep?: (completed: number) => void;
}) {
  const steps = problem.steps;
  const [idx, setIdx] = useState(0);
  const [recorded, setRecorded] = useState<string[]>([]); // her answers for completed steps
  const [entry, setEntry] = useState("");
  const [tries, setTries] = useState(0);
  const [qChosen, setQChosen] = useState(stage !== "lead"); // lead: choose the question first
  const [feedback, setFeedback] = useState<Feedback>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const step = steps[idx];

  // ONE pending timer at a time: arming or clearing always kills the previous
  // one, so a stale Lead "bad question" timeout can never wipe later feedback,
  // un-lock a locked step, or double-fire advance.
  const clearTimer = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  };
  const arm = (fn: () => void, ms: number) => {
    clearTimer();
    timer.current = setTimeout(fn, ms);
  };

  // Shuffled candidate questions for the Lead stage (stable per step).
  const leadChoices = useMemo(() => {
    if (stage !== "lead" || !step) return [];
    const opts = [step.ask, ...step.decoyQuestions];
    return makeRng(seed * 131 + idx).shuffle(opts).map((q) => ({ label: q, value: q }));
  }, [stage, step, seed, idx]);

  if (!step) return null;

  const advance = () => {
    setRecorded((r) => [...r, displayAnswer(step)]);
    setFeedback(null);
    setEntry("");
    setTries(0);
    setQChosen(stage !== "lead");
    onStep?.(idx + 1); // the figure shows this step's written work
    if (idx + 1 >= steps.length) {
      onComplete(stage);
    } else {
      setIdx(idx + 1);
    }
  };

  const handleCorrect = () => {
    setFeedback("correct");
    arm(advance, 850);
  };

  const checkAnswer = (val: number | string) => {
    clearTimer();
    const ok =
      step.input === "choice"
        ? val === step.answer
        : Number(val) === Number(step.answer);
    if (ok) {
      handleCorrect();
    } else if (tries === 0) {
      setFeedback("wrong");
      setTries(1);
      setEntry("");
    } else {
      setFeedback("revealed");
      arm(advance, 1700);
    }
  };

  const pickQuestion = (q: number | string) => {
    clearTimer();
    if (q === step.ask) {
      setQChosen(true);
      setFeedback(null);
    } else {
      setFeedback("badq");
      arm(() => setFeedback(null), 1200);
    }
  };

  const locked = feedback === "correct" || feedback === "revealed";

  return (
    <div className="flex flex-col gap-3">
      {/* Completed steps */}
      {steps.slice(0, idx).map((s, i) => (
        <div key={s.id} className="step-done px-4 py-2 flex items-center gap-2 text-sm">
          <span>✅</span>
          <span className="flex-1 text-gray-600">{renderRich(s.ask)}</span>
          <b className="text-green-700">{renderRich(recorded[i])}</b>
        </div>
      ))}

      {/* Active step */}
      {stage === "watch" ? (
        <div className="step-active p-4">
          <div className="text-lg font-bold text-purple-800 mb-1">{renderRich(step.ask)}</div>
          <div className="text-2xl font-bold text-pink-600">{renderRich(displayAnswer(step))}</div>
          <button
            type="button"
            className="mt-3 bg-purple-500 text-white rounded-xl px-5 py-2 font-bold active:scale-95"
            onClick={advance}
          >
            {idx + 1 >= steps.length ? "Done ✓" : "Next ▶"}
          </button>
        </div>
      ) : stage === "lead" && !qChosen ? (
        <div className="step-active p-4">
          <div className="text-base font-bold text-amber-700 mb-2">
            🧭 What&apos;s the right move next?
          </div>
          <ChoicePad choices={leadChoices} onPick={pickQuestion} variant="lead" />
          {feedback === "badq" && (
            <div className="mt-2 text-center text-amber-700 font-semibold animate-shake">
              Hmm — that move won&apos;t help here yet. Try another!
            </div>
          )}
        </div>
      ) : (
        <div className={`step-active p-4 ${feedback === "wrong" ? "animate-shake" : ""}`}>
          <div className="text-lg font-bold text-purple-800 mb-3">{renderRich(step.ask)}</div>

          {feedback === "revealed" ? (
            <div className="text-center">
              <div className="text-sm text-gray-500">The answer is</div>
              <div className="text-3xl font-bold text-purple-600">{renderRich(displayAnswer(step))}</div>
            </div>
          ) : step.input === "choice" && step.choices ? (
            <ChoicePad choices={step.choices} onPick={checkAnswer} disabled={locked} />
          ) : (
            <>
              <div className="text-center text-4xl font-bold text-pink-600 h-12 mb-2">
                {entry || <span className="text-purple-200">_</span>}
              </div>
              <Numpad
                value={entry}
                onDigit={(d) => entry.length < 5 && setEntry(entry + d)}
                onClear={() => setEntry("")}
                onSubmit={() => checkAnswer(Number(entry))}
                disabled={locked}
              />
            </>
          )}

          {feedback === "correct" && (
            <div className="mt-2 text-center text-green-600 font-bold text-xl animate-bounce-in">
              Yes! 🎉
            </div>
          )}
          {feedback === "wrong" && (
            <div className="mt-2 text-center text-pink-600 font-semibold">
              💡 {renderRich(step.hint)}
            </div>
          )}
        </div>
      )}

      {/* Locked future steps (together/lead only) */}
      {stage !== "watch" &&
        steps.slice(idx + 1).map((s) => (
          <div key={s.id} className="step-locked px-4 py-2 flex items-center gap-2 text-sm">
            <span>🔒</span>
            <span className="flex-1">• • •</span>
          </div>
        ))}
    </div>
  );
}

/* ----------------------------------- Solo ----------------------------------- */

export function SoloRunner({
  problem,
  onComplete,
  celebrate = true, // false → no per-problem confetti (practice fires its own at run end)
  onSolved, // practice: called with firstTry instead of onComplete
}: {
  problem: Problem;
  onComplete: (stage: Stage) => void;
  celebrate?: boolean;
  onSolved?: (firstTry: boolean) => void;
}) {
  const finals = problem.finalAnswers;
  const [slot, setSlot] = useState(0);
  const [entry, setEntry] = useState("");
  const [filled, setFilled] = useState<number[]>([]);
  const [wrong, setWrong] = useState(false);
  const [done, setDone] = useState(false); // final slot filled — ignore stray taps
  const everWrong = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const arm = (fn: () => void, ms: number) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(fn, ms);
  };

  const submit = () => {
    if (done) return;
    const ok = Number(entry) === finals[slot].value;
    if (!ok) {
      setWrong(true);
      everWrong.current = true;
      setEntry("");
      arm(() => setWrong(false), 1200);
      return;
    }
    const nextFilled = [...filled, finals[slot].value];
    setFilled(nextFilled);
    setEntry("");
    if (slot + 1 >= finals.length) {
      setDone(true);
      if (celebrate) void fireConfetti();
      arm(() => {
        if (onSolved) onSolved(!everWrong.current);
        else onComplete("solo");
      }, 400);
    } else {
      setSlot(slot + 1);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="text-center text-xl font-bold text-purple-800">{renderRich(problem.finalAsk)}</div>

      <div className="flex justify-center gap-3 flex-wrap">
        {finals.map((f, i) => (
          <div key={i} className="text-center">
            <div className="text-sm text-purple-500">{renderRich(f.label)}</div>
            <div
              className={`min-w-20 h-14 px-3 rounded-xl border-4 flex items-center justify-center text-2xl font-bold ${
                i < filled.length
                  ? "bg-green-50 border-green-300 text-green-700"
                  : i === slot
                    ? "bg-white border-purple-400 text-pink-600"
                    : "bg-gray-50 border-gray-200 text-gray-300"
              }`}
            >
              {i < filled.length ? filled[i] : i === slot ? entry || "_" : "?"}
            </div>
          </div>
        ))}
      </div>

      {wrong && (
        <div className="text-center text-pink-600 font-semibold animate-shake">
          Not quite — find the bag and build it first. You&apos;ve got this!
        </div>
      )}

      <Numpad
        value={entry}
        onDigit={(d) => !done && entry.length < 5 && setEntry(entry + d)}
        onClear={() => setEntry("")}
        onSubmit={submit}
        disabled={done}
      />
    </div>
  );
}
