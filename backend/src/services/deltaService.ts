import axios from "axios";

const DELTA_BASE_URL = process.env.DELTA_BASE_URL || "https://api.india.delta.exchange";

export interface DeltaTicker {
  symbol: string;
  close: string;
  mark_price: string;
  volume: string;
  turnover_usd: string;
  oi: string;
  [key: string]: unknown;
}

export async function getAllTickers(): Promise<DeltaTicker[]> {
  const { data } = await axios.get(`${DELTA_BASE_URL}/v2/tickers`);
  return data.result as DeltaTicker[];
}

export async function getTickerBySymbol(symbol: string): Promise<DeltaTicker> {
  const { data } = await axios.get(`${DELTA_BASE_URL}/v2/tickers/${symbol}`);
  return data.result as DeltaTicker;
}
