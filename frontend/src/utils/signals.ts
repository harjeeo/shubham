import type { SymbolLevels, Ticker } from "../types/market";
import { toNumber } from "./format";

export type BullishSignalKey = "high" | "r1" | "r2" | "r3" | "r4" | "r5";
export type BearishSignalKey = "low" | "s1" | "s2" | "s3" | "s4" | "s5";

export const BULLISH_OPTIONS: { key: BullishSignalKey; label: string }[] = [
  { key: "high", label: "High" },
  { key: "r1", label: "R1 Breakout" },
  { key: "r2", label: "R2 Breakout" },
  { key: "r3", label: "R3 Breakout" },
  { key: "r4", label: "R4 Breakout" },
  { key: "r5", label: "R5 Breakout" },
];

export const BEARISH_OPTIONS: { key: BearishSignalKey; label: string }[] = [
  { key: "low", label: "Low" },
  { key: "s1", label: "S1 Breakout" },
  { key: "s2", label: "S2 Breakout" },
  { key: "s3", label: "S3 Breakout" },
  { key: "s4", label: "S4 Breakout" },
  { key: "s5", label: "S5 Breakout" },
];

// A live "high"/"low" keeps updating to match the current price the instant a
// new extreme prints, so a strict close === high/low match almost never holds.
// A small tolerance treats "sitting at/near the level" as the signal instead.
const NEAR_LEVEL_TOLERANCE = 0.0015;

function isNear(value: number, level: number, direction: "above" | "below"): boolean {
  if (!Number.isFinite(level) || level === 0) return false;
  return direction === "above" ? value >= level * (1 - NEAR_LEVEL_TOLERANCE) : value <= level * (1 + NEAR_LEVEL_TOLERANCE);
}

// Right after a new candle opens, its high and low both equal the first
// trade's price (no range has formed yet), so "near the high" and "near the
// low" trivially match at the same time. Require a spread meaningfully wider
// than the tolerance band before trusting either signal.
function hasMeaningfulRange(high: number, low: number): boolean {
  if (!Number.isFinite(high) || !Number.isFinite(low) || high <= 0 || low <= 0) return false;
  const mid = (high + low) / 2;
  return (high - low) / mid > NEAR_LEVEL_TOLERANCE * 3;
}

export function evaluateSignals(
  ticker: Ticker,
  levels: SymbolLevels | undefined
): { bullish: Record<BullishSignalKey, boolean>; bearish: Record<BearishSignalKey, boolean> } {
  const close = toNumber(ticker.close);

  const high = levels?.high ?? 0;
  const low = levels?.low ?? 0;
  const rangeOk = hasMeaningfulRange(high, low);
  const [r1, r2, r3, r4, r5] = levels?.r ?? [Infinity, Infinity, Infinity, Infinity, Infinity];
  const [s1, s2, s3, s4, s5] = levels?.s ?? [-Infinity, -Infinity, -Infinity, -Infinity, -Infinity];

  return {
    bullish: {
      high: rangeOk && isNear(close, high, "above"),
      r1: close > r1,
      r2: close > r2,
      r3: close > r3,
      r4: close > r4,
      r5: close > r5,
    },
    bearish: {
      low: rangeOk && isNear(close, low, "below"),
      s1: close < s1,
      s2: close < s2,
      s3: close < s3,
      s4: close < s4,
      s5: close < s5,
    },
  };
}
