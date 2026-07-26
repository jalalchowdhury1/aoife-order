"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LEVELS, FAMILIES, LEVEL_NUM } from "@/lib/levels";
import type { Framework } from "@/lib/types";
import { readProgress, type Progress } from "@/lib/progress";
import { STAGES, STAGE_LABEL } from "@/lib/types";

export default function Home() {
  const [progress, setProgress] = useState<Progress>({});
  const [ready, setReady] = useState(false);
  const [showPeek, setShowPeek] = useState(false);
  const taps = useRef<number[]>([]);

  // Client-only init: localStorage must be read after mount, not in render.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setProgress(readProgress());
    setReady(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Hidden parent peek: 5 quick taps on the title within 2s.
  const onTitleTap = () => {
    const now = Date.now();
    taps.current = [...taps.current, now].filter((t) => now - t < 2000);
    if (taps.current.length >= 5) {
      taps.current = [];
      setProgress(readProgress());
      setShowPeek(true);
    }
  };

  // "⭐ start here" ring on the first level of the ladder not yet soloed.
  const startHere = ready
    ? LEVELS.find((f) => (progress[f.id]?.soloPasses ?? 0) === 0)?.id
    : undefined;

  return (
    <main className="w-full max-w-3xl mx-auto px-4 py-6">
      <header className="text-center mb-6">
        <h1
          className="text-4xl font-bold text-purple-700 select-none cursor-default"
          onClick={onTitleTap}
        >
          🎒 Which First?
        </h1>
        <p className="text-purple-400 mt-1">
          × builds a bag. + tips it into the pile. You can&apos;t tip out a bag you haven&apos;t
          filled!
        </p>
      </header>

      {FAMILIES.map((family) => {
        const items = LEVELS.filter((f) => f.family === family);
        if (items.length === 0) return null;
        return (
          <section key={family} className="mb-6">
            <h2 className="text-sm font-bold uppercase tracking-wide text-pink-500 mb-2">
              {family}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {items.map((f) => (
                <Tile
                  key={f.id}
                  f={f}
                  progress={progress}
                  ready={ready}
                  level={LEVEL_NUM[f.id]}
                  startHere={startHere === f.id}
                />
              ))}
            </div>
          </section>
        );
      })}

      {showPeek && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
          onClick={() => setShowPeek(false)}
        >
          <div
            className="bg-white rounded-2xl p-5 max-w-md w-full max-h-[80vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-purple-800">Progress</h3>
              <button
                type="button"
                onClick={() => setShowPeek(false)}
                className="text-purple-400 text-xl"
                aria-label="close"
              >
                ✕
              </button>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-purple-400">
                  <th className="py-1">Level</th>
                  <th>Stage</th>
                  <th>Solos</th>
                  <th>Practice</th>
                </tr>
              </thead>
              <tbody>
                {LEVELS.map((f) => {
                  const p = progress[f.id];
                  const reached = p?.stageReached ?? 0;
                  return (
                    <tr key={f.id} className="border-t border-purple-50">
                      <td className="py-1 text-gray-700">
                        {f.emoji} {f.title}
                      </td>
                      <td className="text-purple-600">
                        {reached === 0 ? "—" : STAGE_LABEL[STAGES[reached - 1]]}
                      </td>
                      <td className="text-green-600">{p?.soloPasses ?? 0}</td>
                      <td className="text-amber-600">
                        {p?.practiceRuns ?? 0}
                        {(p?.perfectRuns ?? 0) > 0 ? ` (⭐${p!.perfectRuns})` : ""}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}

function Tile({
  f,
  progress,
  ready,
  level,
  startHere,
}: {
  f: Framework;
  progress: Progress;
  ready: boolean;
  level: number;
  startHere?: boolean;
}) {
  const p = progress[f.id];
  const reached = p?.stageReached ?? 0;
  const mastered = (p?.soloPasses ?? 0) > 0;
  return (
    <Link
      href={`/f/${f.id}`}
      className={`card-tile flex flex-col relative ${startHere ? "ring-4 ring-amber-300" : ""}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-3xl">{f.emoji}</span>
        <span className="flex items-center gap-1">
          <span className="bg-pink-100 text-pink-600 text-[10px] font-bold rounded-full px-2 py-0.5">
            Level {level}
          </span>
          {(p?.perfectRuns ?? 0) > 0 && <span title="Perfect practice!">🔁</span>}
          {mastered && <span title="Mastered!">⭐</span>}
        </span>
      </div>
      <div className="font-bold text-purple-800 text-sm mt-1 leading-tight">{f.title}</div>
      <div className="text-[11px] text-purple-400 mt-0.5 leading-tight">{f.blurb}</div>
      <div className="flex gap-1 mt-2">
        {STAGES.map((s, i) => (
          <span
            key={s}
            className={`w-2.5 h-2.5 rounded-full ${
              ready && i < reached ? "bg-green-400" : "bg-purple-100"
            }`}
          />
        ))}
      </div>
      {startHere && (
        <span className="absolute -top-2 -left-2 bg-amber-300 text-amber-900 text-[10px] font-bold rounded-full px-2 py-0.5">
          ⭐ start here
        </span>
      )}
    </Link>
  );
}
