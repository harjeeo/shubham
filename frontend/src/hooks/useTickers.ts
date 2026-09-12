import { useEffect, useRef, useState } from "react";
import { fetchTickers } from "../services/api";
import type { Ticker } from "../types/market";

const POLL_INTERVAL_MS = 5000;

export function useTickers() {
  const [tickers, setTickers] = useState<Ticker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await fetchTickers();
        if (!cancelled) {
          setTickers(data);
          setError(null);
        }
      } catch {
        if (!cancelled) setError("Failed to fetch live market data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    timerRef.current = setInterval(load, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return { tickers, loading, error };
}
