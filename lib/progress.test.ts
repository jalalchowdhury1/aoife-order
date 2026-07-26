import { describe, it, expect, beforeEach } from "vitest";
import { readProgress, recordStageDone, recordSolo, recordPractice, PROGRESS_KEY } from "./progress";

const store: Record<string, string> = {};
beforeEach(() => {
  for (const k of Object.keys(store)) delete store[k];
  (globalThis as unknown as { localStorage: Storage }).localStorage = {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => {
      store[k] = v;
    },
    removeItem: (k: string) => {
      delete store[k];
    },
    clear: () => {
      for (const k of Object.keys(store)) delete store[k];
    },
    key: () => null,
    length: 0,
  } as Storage;
});

describe("progress", () => {
  it("records practice runs and perfect runs additively", () => {
    recordPractice("two-kinds", false);
    recordPractice("two-kinds", true);
    const e = readProgress()["two-kinds"];
    expect(e.practiceRuns).toBe(2);
    expect(e.perfectRuns).toBe(1);
    expect(e.stageReached).toBe(0); // untouched
  });
  it("practice fields default safely on old records", () => {
    recordSolo("two-kinds"); // creates a record without practice fields
    recordPractice("two-kinds", true);
    const e = readProgress()["two-kinds"];
    expect(e.practiceRuns).toBe(1);
    expect(e.perfectRuns).toBe(1);
    expect(e.soloPasses).toBe(1);
  });
  it("starts empty", () => {
    expect(readProgress()["two-kinds"]).toBeUndefined();
  });
  it("records highest stage reached", () => {
    recordStageDone("two-kinds", "watch");
    recordStageDone("two-kinds", "together");
    expect(readProgress()["two-kinds"].stageReached).toBe(2); // 1 watch,2 together,3 lead,4 solo
  });
  it("never lowers stageReached", () => {
    recordStageDone("two-kinds", "lead"); // 3
    recordStageDone("two-kinds", "watch"); // 1 — ignored
    expect(readProgress()["two-kinds"].stageReached).toBe(3);
  });
  it("counts solo passes", () => {
    recordSolo("fenceposts");
    recordSolo("fenceposts");
    expect(readProgress()["fenceposts"].soloPasses).toBe(2);
    expect(readProgress()["fenceposts"].stageReached).toBe(4);
  });
  it("persists under the documented key", () => {
    recordStageDone("x", "watch");
    expect(JSON.parse(store[PROGRESS_KEY])["x"].stageReached).toBe(1);
  });
});
