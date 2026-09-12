import { useEffect, useState } from "react";
import { fetchLevels } from "../services/api";
import type { SymbolLevels } from "../types/market";

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

export function useLevels() {
  const [levels, setLevels] = useState<Record<string, SymbolLevels>>({});

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await fetchLevels();
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
  }, []);

  return levels;
}
