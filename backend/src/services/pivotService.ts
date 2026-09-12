import { getDailyCandles, Candle } from "./deltaService";

export interface SymbolLevels {
  symbol: string;
  prevDayHigh: number;
  prevDayLow: number;
  weekHigh: number;
  weekLow: number;
  monthHigh: number;
  monthLow: number;
  pivot: number;
  r: [number, number, number, number, number];
  s: [number, number, number, number, number];
}

const REFRESH_INTERVAL_MS = 30 * 60 * 1000;
const CONCURRENCY = 5;

const levelsCache = new Map<string, SymbolLevels>();

export function getAllLevels(): SymbolLevels[] {
  return Array.from(levelsCache.values());
}

function mostRecentCompletedDay(sorted: Candle[]): Candle | null {
  if (sorted.length === 0) return null;
  const today = Math.floor(Date.now() / 1000 / 86400);
  const last = sorted[sorted.length - 1];
  if (Math.floor(last.time / 86400) === today) {
    return sorted[sorted.length - 2] ?? null;
  }
  return last;
}

function computeLevels(symbol: string, candles: Candle[]): SymbolLevels | null {
  const sorted = [...candles].sort((a, b) => a.time - b.time);
  const prevDay = mostRecentCompletedDay(sorted);
  if (!prevDay) return null;

  const completedDays = sorted.filter((c) => c.time <= prevDay.time);
  const lastWeek = completedDays.slice(-7);
  const lastMonth = completedDays.slice(-30);

  const { high: H, low: L, close: C } = prevDay;
  const pivot = (H + L + C) / 3;
  const r1 = 2 * pivot - L;
  const s1 = 2 * pivot - H;
  const r2 = pivot + (H - L);
  const s2 = pivot - (H - L);
  const r3 = H + 2 * (pivot - L);
  const s3 = L - 2 * (H - pivot);
  const r4 = r3 + (r2 - r1);
  const s4 = s3 - (s1 - s2);
  const r5 = r4 + (r3 - r2);
  const s5 = s4 - (s2 - s3);

  return {
    symbol,
    prevDayHigh: H,
    prevDayLow: L,
    weekHigh: Math.max(...lastWeek.map((c) => c.high)),
    weekLow: Math.min(...lastWeek.map((c) => c.low)),
    monthHigh: Math.max(...lastMonth.map((c) => c.high)),
    monthLow: Math.min(...lastMonth.map((c) => c.low)),
    pivot,
    r: [r1, r2, r3, r4, r5],
    s: [s1, s2, s3, s4, s5],
  };
}

async function refreshSymbol(symbol: string) {
  try {
    const candles = await getDailyCandles(symbol);
    const levels = computeLevels(symbol, candles);
    if (levels) levelsCache.set(symbol, levels);
  } catch (err) {
    console.error(`Pivot levels: failed to refresh ${symbol}:`, (err as Error).message);
  }
}

async function refreshAll(symbols: string[]) {
  for (let i = 0; i < symbols.length; i += CONCURRENCY) {
    const batch = symbols.slice(i, i + CONCURRENCY);
    await Promise.all(batch.map(refreshSymbol));
  }
}

const INITIAL_RETRY_DELAY_MS = 5000;

export function startPivotService(getSymbols: () => string[]) {
  const run = () => {
    const symbols = getSymbols();
    if (symbols.length > 0) {
      refreshAll(symbols);
    } else {
      setTimeout(run, INITIAL_RETRY_DELAY_MS);
      return;
    }
  };
  run();
  setInterval(run, REFRESH_INTERVAL_MS);
}
