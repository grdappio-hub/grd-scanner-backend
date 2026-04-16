import { Router } from "express";
import { db } from "../db/client";

export const healthRouter = Router();

healthRouter.get("/", async (_req, res) => {
  try {
    const result = await db.query("SELECT NOW() as now");
    res.json({
      ok: true,
      database: "connected",
      time: result.rows[0].now,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      ok: false,
      database: "disconnected",
    });
  }
});
