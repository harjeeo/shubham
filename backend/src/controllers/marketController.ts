import { Request, Response } from "express";
import { getAllTickers, getTickerBySymbol } from "../services/deltaService";

export async function listTickers(req: Request, res: Response) {
  try {
    const contractTypes = typeof req.query.contract_types === "string" ? req.query.contract_types : undefined;
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
