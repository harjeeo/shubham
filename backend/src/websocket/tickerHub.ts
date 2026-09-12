import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import { getTickerSnapshot, tickerEvents } from "../services/deltaWebsocketService";
import type { DeltaTicker } from "../services/deltaService";

export function createTickerHub(server: Server) {
  const wss = new WebSocketServer({ server, path: "/ws/tickers" });

  wss.on("connection", (client) => {
    client.send(JSON.stringify({ type: "snapshot", data: getTickerSnapshot() }));

    const onTicker = (ticker: DeltaTicker) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: "update", data: ticker }));
      }
    };

    tickerEvents.on("ticker", onTicker);

    client.on("close", () => {
      tickerEvents.off("ticker", onTicker);
    });
  });

  return wss;
}
