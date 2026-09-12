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
