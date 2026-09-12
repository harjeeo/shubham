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

export async function getDailyCandles(symbol: string, days = 35): Promise<Candle[]> {
  const end = Math.floor(Date.now() / 1000);
  const start = end - days * 86400;
  const { data } = await axios.get(`${DELTA_BASE_URL}/v2/history/candles`, {
    params: { resolution: "1d", symbol, start, end },
  });
  return (data.result ?? []) as Candle[];
}
