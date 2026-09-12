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
  const daily = await getCandles(symbol, "1d", 90);
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

// Extends the classic 3 pivot levels (R1-R3 / S1-S3) with the same recurrence
// used to derive R4/R5 in the traditional formula: each next level is the
// previous one plus the trend of the last two. Applied out to R15/S15.
function extendLevels([l1, l2, l3]: [number, number, number], count: number): number[] {
  const levels = [l1, l2, l3];
  for (let n = 3; n < count; n++) {
    levels.push(levels[n - 1] + (levels[n - 2] - levels[n - 3]));
  }
  return levels;
}

function pivotsFrom(prev: Candle) {
  const { high: H, low: L, close: C } = prev;
  const pivot = (H + L + C) / 3;
  const r1 = 2 * pivot - L;
  const s1 = 2 * pivot - H;
  const r2 = pivot + (H - L);
  const s2 = pivot - (H - L);
  const r3 = H + 2 * (pivot - L);
  const s3 = L - 2 * (H - pivot);
  return {
    pivot,
    r: extendLevels([r1, r2, r3], PIVOT_LEVEL_COUNT),
    s: extendLevels([s1, s2, s3], PIVOT_LEVEL_COUNT),
  };
}

async function computeLevels(symbol: string, timeframe: Timeframe): Promise<SymbolLevels | null> {
  const candles = timeframe === "1w" ? await getWeeklyCandles(symbol) : await getCandles(symbol, timeframe, 40);
  const sorted = [...candles].sort((a, b) => a.time - b.time);
  if (sorted.length < 2) return null;

  const current = sorted[sorted.length - 1];
  const prev = sorted[sorted.length - 2];
  const { pivot, r, s } = pivotsFrom(prev);

  return {
    symbol,
    high: current.high,
    low: current.low,
    pivot,
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
