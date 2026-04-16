import { Router } from "express";
import { db } from "../db/client";

export const scansRouter = Router();

scansRouter.get("/", async (_req, res) => {
  if (!db) {
    return res.status(503).json({
      error: "Database not configured",
    });
  }

  try {
    const result = await db.query(`
      SELECT
        scans.id,
        scans.requested_at,
        scans.completed_at,
        scans.status,
        scans.risk_score,
        scans.confidence,
        tokens.address,
        chains.slug AS chain
      FROM scans
      JOIN tokens ON scans.token_id = tokens.id
      JOIN chains ON tokens.chain_id = chains.id
      ORDER BY scans.id DESC
      LIMIT 20
    `);

    return res.json({
      scans: result.rows,
    });
  } catch (error) {
    console.error("Failed to fetch scans:", error);
    return res.status(500).json({
      error: "Failed to fetch scans",
    });
  }
});

scansRouter.get("/:id", async (req, res) => {
  if (!db) {
    return res.status(503).json({
      error: "Database not configured",
    });
  }

  try {
    const { id } = req.params;

    const scanResult = await db.query(
      `
      SELECT
        scans.id,
        scans.requested_at,
        scans.completed_at,
        scans.status,
        scans.risk_score,
        scans.confidence,
        scans.raw_data,
        tokens.address,
        chains.slug AS chain,
        scan_results.holder_concentration,
        scan_results.largest_wallet,
        scan_results.liquidity_score,
        scan_results.liquidity_usd,
        scan_results.whale_activity,
        scan_results.verification_status,
        scan_results.risk_level
      FROM scans
      JOIN tokens ON scans.token_id = tokens.id
      JOIN chains ON tokens.chain_id = chains.id
      LEFT JOIN scan_results ON scan_results.scan_id = scans.id
      WHERE scans.id = $1
      LIMIT 1
      `,
      [id]
    );

    if (scanResult.rows.length === 0) {
      return res.status(404).json({
        error: "Scan not found",
      });
    }

    const alertsResult = await db.query(
      `
      SELECT id, message, severity, created_at
      FROM scan_alerts
      WHERE scan_id = $1
      ORDER BY id ASC
      `,
      [id]
    );

    return res.json({
      scan: scanResult.rows[0],
      alerts: alertsResult.rows,
    });
  } catch (error) {
    console.error("Failed to fetch scan by id:", error);
    return res.status(500).json({
      error: "Failed to fetch scan",
    });
  }
});