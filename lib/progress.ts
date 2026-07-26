import { Stage, STAGES } from "./types";

export const PROGRESS_KEY = "aoife-order-progress";
export interface FwProgress {
  stageReached: number;
  soloPasses: number;
  lastPlayed: string;
  practiceRuns?: number; // completed 🔁 5-in-a-row runs
  perfectRuns?: number; // runs where all five were first-try ⭐
}
export type Progress = Record<string, FwProgress>;

const stageIndex = (s: Stage) => STAGES.indexOf(s) + 1; // 1..4

export function readProgress(): Progress {
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? "{}");
  } catch {
    return {};
  }
}
function write(p: Progress) {
  // Storage can throw (Safari private mode, quota) — losing a progress write
  // must never crash the tap handler that triggered it.
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
  } catch {
    /* progress is nice-to-have; play continues */
  }
}
function entry(p: Progress, id: string): FwProgress {
  return p[id] ?? { stageReached: 0, soloPasses: 0, lastPlayed: "" };
}
// Called only from event handlers / effects — never during render.
const today = () => new Date().toISOString().slice(0, 10);

export function recordStageDone(id: string, stage: Stage) {
  const p = readProgress();
  const e = entry(p, id);
  e.stageReached = Math.max(e.stageReached, stageIndex(stage));
  e.lastPlayed = today();
  p[id] = e;
  write(p);
}

export function recordSolo(id: string) {
  const p = readProgress();
  const e = entry(p, id);
  e.stageReached = Math.max(e.stageReached, 4);
  e.soloPasses += 1;
  e.lastPlayed = today();
  p[id] = e;
  write(p);
}

export function recordPractice(id: string, perfect: boolean) {
  const p = readProgress();
  const e = entry(p, id);
  e.practiceRuns = (e.practiceRuns ?? 0) + 1;
  if (perfect) e.perfectRuns = (e.perfectRuns ?? 0) + 1;
  e.lastPlayed = today();
  p[id] = e;
  write(p);
}

export const isUnlocked = (p: Progress, id: string, stage: Stage) =>
  stageIndex(stage) <= entry(p, id).stageReached + 1; // next rung is always unlocked
