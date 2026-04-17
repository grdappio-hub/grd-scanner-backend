
const { getTokenPairs } = require('../services/market/dexscreenerService');
import { Router } from "express";
import { z } from "zod";
import { db } from "../db/client";
import {
  getSolanaBalance,
  getTokenLargestAccounts,
  getTopTokenOwners,
  isTokenMint
} from "../services/solana";
import { getTokenMetadata } from "../services/tokenMetadata";
export const scanRouter = Router();
function formatCompactNumber(value: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) return null;

  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(2)}K`;

  return `$${value.toFixed(2)}`;
}
const scanRequestSchema = z.object({
  chain: z.string().min(1),
  address: z.string().min(1),
});

scanRouter.post("/", async (req, res) => {
  const parsed = scanRequestSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid request body",
      details: parsed.error.flatten(),
    });
  }

  const { chain, address } = parsed.data;

  try {
    let balance = 0;
    let concentration = 0;
    let riskLevel = "UNKNOWN";
    let riskScore = 0;
    let confidence = 90;
    let scanType = "wallet";
    let largestAccounts: any[] = [];
    let topOwners: any[] = [];
    let largestAccountsError: string | null = null;
    let verificationStatus = "wallet";
    let alertMessage = "Wallet scan completed";
    let alertSeverity = "low";

    let tokenName: string | null = null;
let tokenSymbol: string | null = null;
let isVerifiedToken = false;
let marketData: any = null;

    if (chain === "solana") {
      balance = await getSolanaBalance(address);

      const isMint = await isTokenMint(address);

      if (isMint) {
  scanType = "token";
  marketData = await getTokenPairs(chain, address);

  const tokenMeta = await getTokenMetadata(address);
  tokenName = tokenMeta.name;
  tokenSymbol = tokenMeta.symbol;
  isVerifiedToken = tokenMeta.verified;

  verificationStatus = isVerifiedToken
    ? "verified_token"
    : "unverified_token";

  try {
          largestAccounts = await getTokenLargestAccounts(address);
topOwners = await getTopTokenOwners(address);

const totalOwnerBalance = topOwners.reduce(
  (sum, owner) => sum + Number(owner.amount),
  0
);

const top5Owners = topOwners
  .slice(0, 5)
  .reduce((sum, owner) => sum + Number(owner.amount), 0);

concentration = totalOwnerBalance > 0
  ? (top5Owners / totalOwnerBalance) * 100
  : 0;

          if (concentration > 50) {
            riskLevel = "HIGH";
            riskScore = 80;
          } else if (concentration > 25) {
            riskLevel = "MEDIUM";
            riskScore = 60;
          } else {
            riskLevel = "LOW";
            riskScore = 20;
          }

       let whaleRisk = 0;

if (topOwners.length > 0) {
  const largest = Number(topOwners[0].amount);
  const total = topOwners.reduce(
    (sum, owner) => sum + Number(owner.amount),
    0
  );

  const largestPercent = total > 0 ? (largest / total) * 100 : 0;

  if (largestPercent > 20) {
    whaleRisk = 20;
  } else if (largestPercent > 10) {
    whaleRisk = 10;
  }
}

riskScore += whaleRisk;
          if (scanType === "token" && topOwners.length === 0) {
  riskLevel = "UNKNOWN";
  riskScore = 0;
  confidence = 60;
}
          

          alertMessage = `Top owner concentration: ${concentration.toFixed(2)}%`;
          alertSeverity = concentration > 40 ? "high" : "low";
          if (whaleRisk > 0) {
  alertMessage += " | Large holder detected";
}
        } catch (e) {
          largestAccountsError =
            e instanceof Error ? e.message : "Unknown error";

         if (largestAccountsError.includes("Too many accounts requested")) {
        concentration = 0;
        riskLevel = "UNKNOWN";
        riskScore = 0;
        confidence = 50;
        verificationStatus = "large_token";
        alertMessage = "Distribution data unavailable for this token";
        alertSeverity = "medium";
}       else {
        concentration = 0;
        riskLevel = "UNKNOWN";
        riskScore = 0;
        confidence = 40;
        verificationStatus = "unavailable";
        alertMessage = "Unable to analyze holder distribution";
        alertSeverity = "medium";
}
        }
      }
    }

    let saved = false;

if (db) {
  const chainResult = await db.query(
    `INSERT INTO chains (name, slug)
     VALUES ($1, $2)
     ON CONFLICT (slug)
     DO UPDATE SET slug = EXCLUDED.slug
     RETURNING id`,
    [chain, chain]
  );

  const chainId = chainResult.rows[0].id;

  const tokenResult = await db.query(
    `INSERT INTO tokens (chain_id, address)
     VALUES ($1, $2)
     ON CONFLICT (chain_id, address)
     DO UPDATE SET address = EXCLUDED.address
     RETURNING id`,
    [chainId, address]
  );

  const tokenId = tokenResult.rows[0].id;

  const rawData = {
    chain,
    address,
    balance,
    concentration,
    scanType,
    largestAccountsError,
  };

  const scanInsert = await db.query(
    `INSERT INTO scans (token_id, status, risk_score, confidence, raw_data, completed_at)
     VALUES ($1, $2, $3, $4, $5, NOW())
     RETURNING id`,
    [tokenId, "completed", riskLevel, 90, JSON.stringify(rawData)]
  );

  const scanId = scanInsert.rows[0].id;

  await db.query(
    `INSERT INTO scan_results (
      scan_id,
      holder_concentration,
      largest_wallet,
      liquidity_score,
      liquidity_usd,
      whale_activity,
      verification_status,
      risk_level
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      scanId,
      concentration,
      largestAccounts[0] ? Number(largestAccounts[0].amount) : 0,
      "Unknown",
      balance / 1e9,
      concentration > 40,
      verificationStatus,
      riskLevel
    ]
  );

  await db.query(
    `INSERT INTO scan_alerts (scan_id, message, severity)
     VALUES ($1, $2, $3)`,
    [scanId, alertMessage, alertSeverity]
  );

  saved = true;
}

const marketDisplay = marketData
  ? {
      priceUsd: marketData.priceUsd,
      priceUsdFormatted:
        marketData.priceUsd !== null ? `$${marketData.priceUsd.toFixed(4)}` : null,

      liquidityUsd: marketData.liquidityUsd,
      liquidityUsdFormatted: formatCompactNumber(marketData.liquidityUsd),

      volume24h: marketData.volume24h,
      volume24hFormatted: formatCompactNumber(marketData.volume24h),

      marketCap: marketData.marketCap,
      marketCapFormatted: formatCompactNumber(marketData.marketCap),

      fdv: marketData.fdv,
      fdvFormatted: formatCompactNumber(marketData.fdv),

      priceChange24h: marketData.priceChange24h,
      dexId: marketData.dexId,
      pairUrl: marketData.pairUrl,
    }
  : null;

return res.json({
  token: {
    chain,
    address,
    name: tokenName,
    symbol: tokenSymbol,
    verified: isVerifiedToken,
  },
  marketData: marketDisplay,
  scanType,
  balance,
  concentration: concentration > 0
    ? concentration.toFixed(2) + "%"
    : null,
  largestAccountsCount: largestAccounts.length,
  topOwnersCount: topOwners.length,
  largestAccountsError,
  risk: {
    level: riskLevel,
    score: riskScore,
    confidence,
  },
  timestamp: new Date().toISOString(),
  saved,
});
  } catch (error) {
    console.error("Scan route failed:", error);
    return res.status(500).json({
      error: "Failed to process scan",
    });
  }
});
