import { Request, Response } from "express";
import { getAllTickers, getTickerBySymbol } from "../services/deltaService";

export async function listTickers(_req: Request, res: Response) {
  try {
    const tickers = await getAllTickers();
    res.json({ success: true, data: tickers });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch tickers" });
  }
}

export async function getTicker(req: Request, res: Response) {
  try {
    const { symbol } = req.params;
    const ticker = await getTickerBySymbol(symbol);
    res.json({ success: true, data: ticker });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch ticker" });
  }
}
