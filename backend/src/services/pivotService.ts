import { getCandles, Candle, CandleResolution } from "./deltaService";

export type Timeframe = CandleResolution | "1w";

export const TIMEFRAMES: Timeframe[] = ["5m", "15m", "1h", "4h", "1d", "1w"];

export const PIVOT_LEVEL_COUNT = 15;

export interface SymbolLevels {
  symbol: string;
  high: number;
  low: number;
  pivot: number;
  r: number[];
  s: number[];
}

const TTL_MS: Record<Timeframe, number> = {
  "5m": 60_000,
  "15m": 2 * 60_000,
  "1h": 5 * 60_000,
  "4h": 15 * 60_000,
  "1d": 30 * 60_000,
  "1w": 2 * 60 * 60_000,
};

const CONCURRENCY = 5;

interface CacheEntry {
  levels: SymbolLevels;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

function cacheKey(symbol: string, timeframe: Timeframe): string {
  return `${symbol}:${timeframe}`;
}

async function getWeeklyCandles(symbol: string): Promise<Candle[]> {
  const daily = await getCandles(symbol, "1d", 400);
  const sorted = [...daily].sort((a, b) => a.time - b.time);

  const buckets = new Map<number, Candle[]>();
  for (const c of sorted) {
    const weekStart = c.time - (c.time % (7 * 86400));
    const bucket = buckets.get(weekStart) ?? [];
    bucket.push(c);
    buckets.set(weekStart, bucket);
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a - b)
    .map(([weekStart, candles]) => ({
      time: weekStart,
      open: candles[0].open,
      close: candles[candles.length - 1].close,
      high: Math.max(...candles.map((c) => c.high)),
      low: Math.min(...candles.map((c) => c.low)),
      volume: candles.reduce((sum, c) => sum + c.volume, 0),
    }));
}

// How many candles on each side must be lower/higher for a candle to count
// as a swing high/low (a real turning point in price, not just noise).
const SWING_STRENGTH = 3;
// Swing points within this % of each other are the same real level touched
// more than once (like the horizontal zones on a chart), so they get merged.
const CLUSTER_TOLERANCE = 0.005;

function detectSwings(candles: Candle[], strength: number): { highs: number[]; lows: number[] } {
  const highs: number[] = [];
  const lows: number[] = [];

  for (let i = strength; i < candles.length - strength; i++) {
    const window = candles.slice(i - strength, i + strength + 1);
    if (candles[i].high === Math.max(...window.map((c) => c.high))) highs.push(candles[i].high);
    if (candles[i].low === Math.min(...window.map((c) => c.low))) lows.push(candles[i].low);
  }

  return { highs, lows };
}

function clusterLevels(levels: number[], tolerance: number): number[] {
  if (levels.length === 0) return [];
  const sorted = [...levels].sort((a, b) => a - b);
  const clusters: number[][] = [[sorted[0]]];

  for (let i = 1; i < sorted.length; i++) {
    const current = clusters[clusters.length - 1];
    const clusterAvg = current.reduce((sum, v) => sum + v, 0) / current.length;
    if ((sorted[i] - clusterAvg) / clusterAvg <= tolerance) {
      current.push(sorted[i]);
    } else {
      clusters.push([sorted[i]]);
    }
  }

  return clusters.map((c) => c.reduce((sum, v) => sum + v, 0) / c.length);
}

async function computeLevels(symbol: string, timeframe: Timeframe): Promise<SymbolLevels | null> {
  const candles = timeframe === "1w" ? await getWeeklyCandles(symbol) : await getCandles(symbol, timeframe, 150);
  const sorted = [...candles].sort((a, b) => a.time - b.time);
  if (sorted.length < SWING_STRENGTH * 2 + 2) return null;

  const current = sorted[sorted.length - 1];
  const price = current.close;

  // The still-forming current candle isn't a confirmed swing point yet.
  const { highs, lows } = detectSwings(sorted.slice(0, -1), SWING_STRENGTH);
  const resistanceLevels = clusterLevels(highs, CLUSTER_TOLERANCE);
  const supportLevels = clusterLevels(lows, CLUSTER_TOLERANCE);

  // R1 = nearest historical resistance above the current price, R2 = next one
  // up, etc. S1 = nearest support below price, S2 = next one down, etc. -
  // i.e. real chart levels, not a formula derived from a single candle.
  const r = resistanceLevels
    .filter((level) => level > price)
    .sort((a, b) => a - b)
    .slice(0, PIVOT_LEVEL_COUNT);
  const s = supportLevels
    .filter((level) => level < price)
    .sort((a, b) => b - a)
    .slice(0, PIVOT_LEVEL_COUNT);

  return {
    symbol,
    high: current.high,
    low: current.low,
    pivot: (current.high + current.low + current.close) / 3,
    r,
    s,
  };
}

export async function getLevels(symbol: string, timeframe: Timeframe): Promise<SymbolLevels | null> {
  const key = cacheKey(symbol, timeframe);
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.levels;

  try {
    const levels = await computeLevels(symbol, timeframe);
    if (levels) cache.set(key, { levels, expiresAt: Date.now() + TTL_MS[timeframe] });
    return levels;
  } catch (err) {
    console.error(`Pivot levels: failed to compute ${symbol} @ ${timeframe}:`, (err as Error).message);
    return cached?.levels ?? null;
  }
}

export async function getAllLevels(symbols: string[], timeframe: Timeframe): Promise<SymbolLevels[]> {
  const out: SymbolLevels[] = [];
  for (let i = 0; i < symbols.length; i += CONCURRENCY) {
    const batch = symbols.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map((s) => getLevels(s, timeframe)));
    results.forEach((l) => l && out.push(l));
  }
  return out;
}

export function isTimeframe(value: unknown): value is Timeframe {
  return typeof value === "string" && (TIMEFRAMES as string[]).includes(value);
}

export function warmDefaultLevels(getSymbols: () => string[]) {
  const run = () => {
    const symbols = getSymbols();
    if (symbols.length > 0) {
      getAllLevels(symbols, "1d");
    } else {
      setTimeout(run, 5000);
    }
  };
  run();
}
