import type { SymbolLevels, Ticker } from "../types/market";
import { toNumber } from "./format";

export type BullishSignalKey = "dayHigh" | "weeklyHigh" | "monthlyHigh" | "r1" | "r2" | "r3" | "r4" | "r5";
export type BearishSignalKey = "dayLow" | "weeklyLow" | "monthlyLow" | "s1" | "s2" | "s3" | "s4" | "s5";

export const BULLISH_OPTIONS: { key: BullishSignalKey; label: string }[] = [
  { key: "dayHigh", label: "Day High" },
  { key: "weeklyHigh", label: "Weekly High" },
  { key: "monthlyHigh", label: "Monthly High" },
  { key: "r1", label: "R1 Breakout" },
  { key: "r2", label: "R2 Breakout" },
  { key: "r3", label: "R3 Breakout" },
  { key: "r4", label: "R4 Breakout" },
  { key: "r5", label: "R5 Breakout" },
];

export const BEARISH_OPTIONS: { key: BearishSignalKey; label: string }[] = [
  { key: "dayLow", label: "Day Low" },
  { key: "weeklyLow", label: "Weekly Low" },
  { key: "monthlyLow", label: "Monthly Low" },
  { key: "s1", label: "S1 Breakout" },
  { key: "s2", label: "S2 Breakout" },
  { key: "s3", label: "S3 Breakout" },
  { key: "s4", label: "S4 Breakout" },
  { key: "s5", label: "S5 Breakout" },
];

export function evaluateSignals(
  ticker: Ticker,
  levels: SymbolLevels | undefined
): { bullish: Record<BullishSignalKey, boolean>; bearish: Record<BearishSignalKey, boolean> } {
  const close = toNumber(ticker.close);
  const todayHigh = toNumber(ticker.high);
  const todayLow = toNumber(ticker.low);

  const weekHigh = Math.max(levels?.weekHigh ?? -Infinity, todayHigh);
  const weekLow = Math.min(levels?.weekLow ?? Infinity, todayLow || Infinity);
  const monthHigh = Math.max(levels?.monthHigh ?? -Infinity, todayHigh);
  const monthLow = Math.min(levels?.monthLow ?? Infinity, todayLow || Infinity);

  const [r1, r2, r3, r4, r5] = levels?.r ?? [Infinity, Infinity, Infinity, Infinity, Infinity];
  const [s1, s2, s3, s4, s5] = levels?.s ?? [-Infinity, -Infinity, -Infinity, -Infinity, -Infinity];

  return {
    bullish: {
      dayHigh: todayHigh > 0 && close >= todayHigh,
      weeklyHigh: weekHigh !== -Infinity && close >= weekHigh,
      monthlyHigh: monthHigh !== -Infinity && close >= monthHigh,
      r1: close > r1,
      r2: close > r2,
      r3: close > r3,
      r4: close > r4,
      r5: close > r5,
    },
    bearish: {
      dayLow: todayLow > 0 && close <= todayLow,
      weeklyLow: weekLow !== Infinity && close <= weekLow,
      monthlyLow: monthLow !== Infinity && close <= monthLow,
      s1: close < s1,
      s2: close < s2,
      s3: close < s3,
      s4: close < s4,
      s5: close < s5,
    },
  };
}
