import axios from "axios";
import type { SymbolLevels, Ticker, Timeframe } from "../types/market";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
});

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export async function fetchTickers(): Promise<Ticker[]> {
  const { data } = await api.get<ApiResponse<Ticker[]>>("/market/tickers");
  return data.data;
}

export async function fetchLevels(timeframe: Timeframe): Promise<SymbolLevels[]> {
  const { data } = await api.get<ApiResponse<SymbolLevels[]>>("/market/levels", { params: { timeframe } });
  return data.data;
}
