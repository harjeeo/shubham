export interface Ticker {
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

export type Timeframe = "5m" | "15m" | "1h" | "4h" | "1d" | "1w";

export const TIMEFRAMES: Timeframe[] = ["5m", "15m", "1h", "4h", "1d", "1w"];

export interface SymbolLevels {
  symbol: string;
  high: number;
  low: number;
  pivot: number;
  r: number[];
  s: number[];
}
