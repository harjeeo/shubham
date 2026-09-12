import { useEffect, useRef, useState } from "react";
import type { Ticker } from "../types/market";

const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:5000/ws/tickers";
const RECONNECT_DELAY_MS = 3000;

interface SnapshotMessage {
  type: "snapshot";
  data: Ticker[];
}

interface UpdateMessage {
  type: "update";
  data: Ticker;
}

type HubMessage = SnapshotMessage | UpdateMessage;

export function useLiveTickers() {
  const [tickerMap, setTickerMap] = useState<Record<string, Ticker>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let cancelled = false;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    function connect() {
      const socket = new WebSocket(WS_URL);
      socketRef.current = socket;

      socket.onopen = () => {
        if (!cancelled) setError(null);
      };

      socket.onmessage = (event) => {
        const msg: HubMessage = JSON.parse(event.data);
        if (msg.type === "snapshot") {
          const map: Record<string, Ticker> = {};
          msg.data.forEach((t) => (map[t.symbol] = t));
          setTickerMap(map);
          setLoading(false);
        } else if (msg.type === "update") {
          setTickerMap((prev) => ({ ...prev, [msg.data.symbol]: msg.data }));
        }
      };

      socket.onclose = () => {
        if (cancelled) return;
        setError("Live connection lost, reconnecting…");
        reconnectTimer = setTimeout(connect, RECONNECT_DELAY_MS);
      };

      socket.onerror = () => {
        socket.close();
      };
    }

    connect();

    return () => {
      cancelled = true;
      clearTimeout(reconnectTimer);
      socketRef.current?.close();
    };
  }, []);

  return { tickers: Object.values(tickerMap), loading, error };
}
