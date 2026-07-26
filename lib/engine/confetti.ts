// Celebration helper — non-essential, so failures are swallowed.
export async function fireConfetti(big = false) {
  try {
    const confetti = (await import("canvas-confetti")).default;
    confetti({
      particleCount: big ? 250 : 120,
      spread: big ? 100 : 70,
      origin: { y: 0.6 },
    });
  } catch {
    /* confetti is non-essential */
  }
}
