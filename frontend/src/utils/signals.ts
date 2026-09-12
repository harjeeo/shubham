import type { SymbolLevels, Ticker } from "../types/market";
import { toNumber } from "./format";

export const PIVOT_LEVEL_COUNT = 15;
type LevelDigit =
  | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15;

export type BullishSignalKey = "high" | `r${LevelDigit}`;
export type BearishSignalKey = "low" | `s${LevelDigit}`;

interface SignalOption<K extends string> {
  key: K;
  label: string;
  shortLabel: string;
}

const LEVEL_NUMBERS = Array.from({ length: PIVOT_LEVEL_COUNT }, (_, i) => i + 1);

export const BULLISH_OPTIONS: SignalOption<BullishSignalKey>[] = [
  { key: "high", label: "High", shortLabel: "High" },
  ...LEVEL_NUMBERS.map((n) => ({
    key: `r${n}` as BullishSignalKey,
    label: `R${n} Breakout`,
    shortLabel: `R${n}`,
  })),
];

export const BEARISH_OPTIONS: SignalOption<BearishSignalKey>[] = [
  { key: "low", label: "Low", shortLabel: "Low" },
  ...LEVEL_NUMBERS.map((n) => ({
    key: `s${n}` as BearishSignalKey,
    label: `S${n} Breakout`,
    shortLabel: `S${n}`,
  })),
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
  const r = levels?.r ?? [];
  const s = levels?.s ?? [];

  const bullish = { high: rangeOk && isNear(close, high, "above") } as Record<BullishSignalKey, boolean>;
  const bearish = { low: rangeOk && isNear(close, low, "below") } as Record<BearishSignalKey, boolean>;

  LEVEL_NUMBERS.forEach((n) => {
    bullish[`r${n}` as BullishSignalKey] = close > (r[n - 1] ?? Infinity);
    bearish[`s${n}` as BearishSignalKey] = close < (s[n - 1] ?? -Infinity);
  });

  return { bullish, bearish };
}
