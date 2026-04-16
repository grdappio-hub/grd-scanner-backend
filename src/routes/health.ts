import { Router } from "express";
import { db } from "../db/client";

export const healthRouter = Router();

healthRouter.get("/", async (_req, res) => {
  try {
    if (!db) {
  return res.json({
    status: "ok",
    db: "disabled",
  });
}

const result = await db.query("SELECT NOW() as now");

return res.json({
  status: "ok",
  db: result.rows[0].now,
});
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
