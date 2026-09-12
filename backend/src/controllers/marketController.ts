import { Request, Response } from "express";
import { getAllTickers, getTickerBySymbol } from "../services/deltaService";
import { getAllLevels, isTimeframe, type Timeframe } from "../services/pivotService";
import { getCachedSymbols } from "../services/deltaWebsocketService";

export async function listTickers(req: Request, res: Response) {
  try {
    const contractTypes =
      typeof req.query.contract_types === "string" ? req.query.contract_types : "spot,perpetual_futures";
    const tickers = await getAllTickers(contractTypes);
    res.json({ success: true, data: tickers });
  } catch (err) {
    console.error("listTickers error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch tickers" });
  }
}

export async function getTicker(req: Request, res: Response) {
  try {
    const { symbol } = req.params;
    const ticker = await getTickerBySymbol(symbol);
    res.json({ success: true, data: ticker });
  } catch (err) {
    console.error("getTicker error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch ticker" });
  }
}

export async function listLevels(req: Request, res: Response) {
  try {
    const timeframe: Timeframe = isTimeframe(req.query.timeframe) ? req.query.timeframe : "1d";
    const levels = await getAllLevels(getCachedSymbols(), timeframe);
    res.json({ success: true, data: levels });
  } catch (err) {
    console.error("listLevels error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch levels" });
  }
}
