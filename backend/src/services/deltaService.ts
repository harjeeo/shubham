import axios from "axios";

const DELTA_BASE_URL = process.env.DELTA_BASE_URL || "https://api.india.delta.exchange";

export interface DeltaTicker {
  symbol: string;
  close: string;
  open: string;
  high: string;
  low: string;
  mark_price: string;
  volume: string;
  turnover_usd: string;
  oi: string;
  oi_value_usd?: string;
  contract_type?: string;
  [key: string]: unknown;
}

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export async function getAllTickers(contractTypes?: string): Promise<DeltaTicker[]> {
  const { data } = await axios.get(`${DELTA_BASE_URL}/v2/tickers`, {
    params: contractTypes ? { contract_types: contractTypes } : undefined,
  });
  return data.result as DeltaTicker[];
}

export async function getTickerBySymbol(symbol: string): Promise<DeltaTicker> {
  const { data } = await axios.get(`${DELTA_BASE_URL}/v2/tickers/${symbol}`);
  return data.result as DeltaTicker;
}

export type CandleResolution = "5m" | "15m" | "1h" | "4h" | "1d";

const RESOLUTION_SECONDS: Record<CandleResolution, number> = {
  "5m": 300,
  "15m": 900,
  "1h": 3600,
  "4h": 14400,
  "1d": 86400,
};

export async function getCandles(
  symbol: string,
  resolution: CandleResolution,
  periods = 40
): Promise<Candle[]> {
  const end = Math.floor(Date.now() / 1000);
  const start = end - RESOLUTION_SECONDS[resolution] * periods;
  const { data } = await axios.get(`${DELTA_BASE_URL}/v2/history/candles`, {
    params: { resolution, symbol, start, end },
  });
  return (data.result ?? []) as Candle[];
}
