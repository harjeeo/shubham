export interface Ticker {
  symbol: string;
  close: string;
  open: string;
  mark_price: string;
  volume: string;
  turnover_usd: string;
  oi: string;
  oi_value_usd?: string;
  contract_type?: string;
  [key: string]: unknown;
}
