import WebSocket from "ws";
import { EventEmitter } from "events";
import { getAllTickers, DeltaTicker } from "./deltaService";

const DELTA_WS_URL = process.env.DELTA_WS_URL || "wss://socket.india.delta.exchange";
const INITIAL_RECONNECT_DELAY_MS = 2000;
const MAX_RECONNECT_DELAY_MS = 30000;

export const tickerEvents = new EventEmitter();

const tickerCache = new Map<string, DeltaTicker>();
let reconnectDelay = INITIAL_RECONNECT_DELAY_MS;
let socket: WebSocket | null = null;

export function getTickerSnapshot(): DeltaTicker[] {
  return Array.from(tickerCache.values());
}

export function getCachedSymbols(): string[] {
  return Array.from(tickerCache.keys());
}

function scheduleReconnect() {
  setTimeout(connect, reconnectDelay);
  reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_DELAY_MS);
}

async function connect() {
  let symbols: string[];

  try {
    const seed = await getAllTickers("spot,perpetual_futures");
    seed.forEach((t) => tickerCache.set(t.symbol, t));
    symbols = seed.map((t) => t.symbol);
  } catch (err) {
    console.error("Delta WS: failed to seed tickers, retrying:", (err as Error).message);
    scheduleReconnect();
    return;
  }

  socket = new WebSocket(DELTA_WS_URL);

  socket.on("open", () => {
    reconnectDelay = INITIAL_RECONNECT_DELAY_MS;
    console.log("Connected to Delta Exchange WebSocket");
    socket?.send(
      JSON.stringify({
        type: "subscribe",
        payload: {
          channels: [{ name: "v2/ticker", symbols }],
        },
      })
    );
  });

  socket.on("message", (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      if (msg.symbol && (msg.type === "v2/ticker" || msg.type === "ticker")) {
        const existing = tickerCache.get(msg.symbol) ?? ({} as DeltaTicker);
        const updated: DeltaTicker = { ...existing, ...msg };
        tickerCache.set(msg.symbol, updated);
        tickerEvents.emit("ticker", updated);
      }
    } catch (err) {
      console.error("Delta WS: failed to parse message:", err);
    }
  });

  socket.on("close", () => {
    console.warn("Delta WebSocket closed, reconnecting…");
    scheduleReconnect();
  });

  socket.on("error", (err) => {
    console.error("Delta WebSocket error:", err.message);
    socket?.close();
  });
}

export function startDeltaWebsocket() {
  connect();
}
