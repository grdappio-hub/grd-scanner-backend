import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env";
import { healthRouter } from "./routes/health";
import { scanRouter } from "./routes/scan";
import { scansRouter } from "./routes/scans";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    name: "GRD Scanner API",
    status: "running",
  });
});

app.use("/health", healthRouter);
app.use("/api/scan", scanRouter);
app.use("/api/scans", scansRouter);

app.listen(env.port, () => {
  console.log(`Server running on http://localhost:${env.port}`);
});
