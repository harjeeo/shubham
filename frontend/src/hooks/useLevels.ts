import { useEffect, useState } from "react";
import { fetchLevels } from "../services/api";
import type { SymbolLevels, Timeframe } from "../types/market";

// Backend caches per-timeframe with its own TTL, so a short uniform poll
// here is cheap and just picks up whatever the backend has ready.
const REFRESH_INTERVAL_MS = 30 * 1000;

export function useLevels(timeframe: Timeframe) {
  const [levels, setLevels] = useState<Record<string, SymbolLevels>>({});

  useEffect(() => {
    let cancelled = false;
    setLevels({});

    async function load() {
      try {
        const data = await fetchLevels(timeframe);
        if (cancelled) return;
        const map: Record<string, SymbolLevels> = {};
        data.forEach((l) => (map[l.symbol] = l));
        setLevels(map);
      } catch {
        // levels are a progressive enhancement over live prices; ignore failures
      }
    }

    load();
    const timer = setInterval(load, REFRESH_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [timeframe]);

  return levels;
}
