import { Router } from "express";
import { listTickers, getTicker } from "../controllers/marketController";

const router = Router();

router.get("/tickers", listTickers);
router.get("/tickers/:symbol", getTicker);

export default router;
