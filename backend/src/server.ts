import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import marketRoutes from "./routes/marketRoutes";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ status: "ok", message: "Crypto Screener backend running" });
});

app.use("/api/market", marketRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
