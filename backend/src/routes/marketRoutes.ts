import { Router } from "express";
import { listTickers, getTicker, listLevels } from "../controllers/marketController";

const router = Router();

router.get("/tickers", listTickers);
router.get("/tickers/:symbol", getTicker);
router.get("/levels", listLevels);

export default router;
