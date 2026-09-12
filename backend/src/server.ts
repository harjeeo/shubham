import dotenv from "dotenv";
dotenv.config();

import http from "http";
import express from "express";
import cors from "cors";
import marketRoutes from "./routes/marketRoutes";
import { createTickerHub } from "./websocket/tickerHub";
import { startDeltaWebsocket, getCachedSymbols } from "./services/deltaWebsocketService";
import { warmDefaultLevels } from "./services/pivotService";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ status: "ok", message: "Crypto Screener backend running" });
});

app.use("/api/market", marketRoutes);

const server = http.createServer(app);
createTickerHub(server);
startDeltaWebsocket();
warmDefaultLevels(getCachedSymbols);

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`WebSocket ticker feed at ws://localhost:${PORT}/ws/tickers`);
});
