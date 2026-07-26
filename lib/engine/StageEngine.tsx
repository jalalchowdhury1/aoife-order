"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Framework, Stage } from "../types";
import { STAGES, STAGE_LABEL, STAGE_BLURB } from "../types";
import { makeRng, randomSeed } from "../rng";
import {
  readProgress,
  recordStageDone,
  recordSolo,
  recordPractice,
  isUnlocked,
  type Progress,
} from "../progress";
import { figureAt } from "../expr";
import { Figure } from "../figures/Figure";
import { renderRich } from "./rich";
import { fireConfetti } from "./confetti";
import { PracticeRunner } from "./PracticeRunner";
import { StageRunner } from "./StageRunner";

function startStageFor(progress: Progress, id: string): Stage {
  const reached = progress[id]?.stageReached ?? 0;
  return STAGES[Math.min(reached, STAGES.length - 1)];
}

export function StageEngine({ framework }: { framework: Framework }) {
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState<Progress>({});
  const [stage, setStage] = useState<Stage>("watch");
  const [seed, setSeed] = useState(1);
  const [finished, setFinished] = useState<Stage | null>(null);
  const [mode, setMode] = useState<"stages" | "practice">("stages");
  const [practiceDone, setPracticeDone] = useState<null | { perfect: boolean }>(null);
  const [stepsDone, setStepsDone] = useState(0); // drives the live column figure

  // Client-only init: read progress + pick the starting stage + a random problem.
  // localStorage/Math.random must run after mount (not in render) to avoid hydration
  // mismatch; this synchronous setState-in-effect is intentional.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const p = readProgress();
    setProgress(p);
    setStage(startStageFor(p, framework.id));
    setSeed(randomSeed());
    setReady(true);
  }, [framework.id]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const problem = useMemo(
    () => framework.generate(makeRng(seed)),
    [framework, seed],
  );

  const stageIdx = STAGES.indexOf(stage);
  const nextStage = stageIdx < STAGES.length - 1 ? STAGES[stageIdx + 1] : null;

  const handleComplete = (completed: Stage) => {
    if (completed === "solo") recordSolo(framework.id);
    else recordStageDone(framework.id, completed);
    setProgress(readProgress());
    setFinished(completed);
  };

  const goStage = (s: Stage) => {
    // Tapping the already-active pill mid-run must not throw the problem away.
    if (mode === "stages" && s === stage && !finished) return;
    setMode("stages");
    setPracticeDone(null);
    setStage(s);
    setSeed(randomSeed());
    setFinished(null);
    setStepsDone(0);
  };

  const goPractice = () => {
    if (mode === "practice" && !practiceDone) return; // already mid-run
    setMode("practice");
    setPracticeDone(null);
    setSeed(randomSeed());
    setFinished(null);
    setStepsDone(0);
  };

  const finishPractice = (perfect: boolean) => {
    recordPractice(framework.id, perfect);
    setProgress(readProgress());
    void fireConfetti(perfect);
    setPracticeDone({ perfect });
  };

  const again = () => {
    setSeed(randomSeed());
    setFinished(null);
    setStepsDone(0);
  };

  if (!ready) {
    return <div className="p-8 text-center text-purple-400 font-bold">Loading…</div>;
  }

  // Solo shows the bare tower (test conditions); other stages show the work so far.
  const liveFigure = stage === "solo" ? problem.figure : figureAt(problem, stepsDone);

  return (
    <div className="w-full max-w-xl mx-auto px-3 pb-8">
      {/* Header */}
      <div className="flex items-center gap-2 py-3">
        <Link href="/" className="text-purple-500 text-2xl active:scale-95" aria-label="home">
          🏠
        </Link>
        <div className="flex-1 text-center">
          <div className="text-xl font-bold text-purple-800">
            {framework.emoji} {framework.title}
          </div>
        </div>
        <div className="w-8" />
      </div>

      {/* Stage picker */}
      <div className="grid grid-cols-5 gap-1 mb-3">
        {STAGES.map((s) => {
          const unlocked = isUnlocked(progress, framework.id, s);
          const active = mode === "stages" && s === stage && !finished;
          return (
            <button
              key={s}
              type="button"
              disabled={!unlocked}
              onClick={() => unlocked && goStage(s)}
              className={`rounded-xl py-2 text-xs font-bold transition-all ${
                active
                  ? "bg-purple-500 text-white"
                  : unlocked
                    ? "bg-purple-100 text-purple-700 active:scale-95"
                    : "bg-gray-100 text-gray-300"
              }`}
            >
              {STAGE_LABEL[s]}
            </button>
          );
        })}
        <button
          type="button"
          disabled={!isUnlocked(progress, framework.id, "solo")}
          onClick={goPractice}
          className={`rounded-xl py-2 text-xs font-bold transition-all ${
            mode === "practice" && !practiceDone
              ? "bg-amber-400 text-white"
              : isUnlocked(progress, framework.id, "solo")
                ? "bg-amber-100 text-amber-700 active:scale-95"
                : "bg-gray-100 text-gray-300"
          }`}
        >
          🔁 Practice
        </button>
      </div>

      {mode === "practice" ? (
        practiceDone ? (
          <div className="text-center py-6 animate-bounce-in">
            <div className="text-5xl mb-2">{practiceDone.perfect ? "🏆" : "🎉"}</div>
            <div className="text-2xl font-bold text-purple-800 mb-1">
              {practiceDone.perfect ? "PERFECT — five stars in a row!" : "Five in a row — done!"}
            </div>
            <div className="text-sm text-purple-400 mb-5">{framework.title}</div>
            <div className="flex flex-col gap-2 max-w-xs mx-auto">
              <button
                type="button"
                onClick={goPractice}
                className="bg-amber-400 text-white rounded-2xl py-3 font-bold text-lg active:scale-95"
              >
                🔁 Practice again
              </button>
              <Link
                href="/"
                className="bg-purple-100 text-purple-700 rounded-2xl py-3 font-bold text-lg active:scale-95"
              >
                🏠 Home
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="text-center text-sm text-amber-600 font-bold mb-2">
              🔁 Practice — five in a row, all by yourself!
            </div>
            <PracticeRunner
              key={`practice:${seed}`}
              framework={framework}
              baseSeed={seed}
              onFinish={finishPractice}
            />
          </>
        )
      ) : finished ? (
        <EndPanel
          stage={finished}
          frameworkTitle={framework.title}
          nextStage={nextStage}
          onAgain={again}
          onNext={nextStage ? () => goStage(nextStage) : undefined}
        />
      ) : (
        <>
          <div className="text-center text-sm text-purple-500 mb-2">{STAGE_BLURB[stage]}</div>

          {/* Problem statement + live figure shown in EVERY stage, including Solo. */}
          <div className="bg-white border-4 border-pink-200 rounded-2xl p-4 mb-3 text-lg text-gray-800 leading-snug">
            {renderRich(problem.promptText)}
          </div>
          <Figure spec={liveFigure} />

          <StageRunner
            key={`${stage}:${seed}`}
            stage={stage}
            problem={problem}
            seed={seed}
            onComplete={handleComplete}
            onStep={setStepsDone}
          />
        </>
      )}
    </div>
  );
}

function EndPanel({
  stage,
  frameworkTitle,
  nextStage,
  onAgain,
  onNext,
}: {
  stage: Stage;
  frameworkTitle: string;
  nextStage: Stage | null;
  onAgain: () => void;
  onNext?: () => void;
}) {
  const msg =
    stage === "solo"
      ? "You solved it all by yourself! 🦋"
      : stage === "lead"
        ? "Brilliant — you picked all the right moves! 🧭"
        : "Nice work! 🌟";
  return (
    <div className="text-center py-6 animate-bounce-in">
      <div className="text-5xl mb-2">🎉</div>
      <div className="text-2xl font-bold text-purple-800 mb-1">{msg}</div>
      <div className="text-sm text-purple-400 mb-5">{frameworkTitle}</div>
      <div className="flex flex-col gap-2 max-w-xs mx-auto">
        {onNext && nextStage && (
          <button
            type="button"
            onClick={onNext}
            className="bg-purple-500 text-white rounded-2xl py-3 font-bold text-lg active:scale-95"
          >
            Next: {STAGE_LABEL[nextStage]} ▶
          </button>
        )}
        <button
          type="button"
          onClick={onAgain}
          className="bg-pink-400 text-white rounded-2xl py-3 font-bold text-lg active:scale-95"
        >
          🔁 Try another one
        </button>
        <Link
          href="/"
          className="bg-purple-100 text-purple-700 rounded-2xl py-3 font-bold text-lg active:scale-95"
        >
          🏠 Home
        </Link>
      </div>
    </div>
  );
}
