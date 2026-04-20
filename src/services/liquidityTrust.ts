type LiquidityTrustStatus = "locked" | "burned" | "unlocked" | "unknown";
type RiskImpact = "low" | "medium" | "high" | "unknown";

export type LiquidityTrustResult = {
  status: LiquidityTrustStatus;
  riskImpact: RiskImpact;
  primaryDex: string | null;
  pairAddress: string | null;
  quoteAsset: string | null;
  poolCreatedAt: string | null;
  liquidityUsd: number | null;
  liquidityToMcapRatio: number | null;
  volumeToLiquidityRatio24h: number | null;
  note: string | null;
};

export async function getLiquidityTrust(marketData: any): Promise<LiquidityTrustResult> {
  if (!marketData) {
    return {
      status: "unknown",
      riskImpact: "unknown",
      primaryDex: null,
      pairAddress: null,
      quoteAsset: null,
      poolCreatedAt: null,
      liquidityUsd: null,
      liquidityToMcapRatio: null,
      volumeToLiquidityRatio24h: null,
      note: "Market data unavailable",
    };
  }

  const liquidityUsd =
    marketData.liquidityUsd !== null && marketData.liquidityUsd !== undefined
      ? Number(marketData.liquidityUsd)
      : null;

  const marketCap =
    marketData.marketCap !== null && marketData.marketCap !== undefined
      ? Number(marketData.marketCap)
      : null;

  const volume24h =
    marketData.volume24h !== null && marketData.volume24h !== undefined
      ? Number(marketData.volume24h)
      : null;

  const liquidityToMcapRatio =
    liquidityUsd && marketCap && marketCap > 0
      ? liquidityUsd / marketCap
      : null;

  const volumeToLiquidityRatio24h =
    liquidityUsd && volume24h && liquidityUsd > 0
      ? volume24h / liquidityUsd
      : null;

  let riskImpact: RiskImpact = "unknown";
  let note = "LP lock status not yet determined";

  if (liquidityUsd !== null) {
  if (liquidityUsd < 10000) {
    riskImpact = "high";
    note = "Very low liquidity — elevated manipulation/slippage risk";
  } else if (liquidityUsd < 100000) {
    riskImpact = "medium";
    note = "Moderate liquidity — use caution";
  } else {
    riskImpact = "low";
    note = "Visible liquidity detected";
  }
}

if (liquidityToMcapRatio !== null) {
  if (liquidityToMcapRatio < 0.001) {
    riskImpact = "high";
    note = "Liquidity is very thin relative to market cap";
  } else if (liquidityToMcapRatio < 0.01 && riskImpact !== "high") {
    riskImpact = "medium";
    note = "Liquidity is somewhat thin relative to market cap";
  }
}

  return {
    status: "unknown",
    riskImpact,
    primaryDex: marketData.dexId || null,
    pairAddress: marketData.pairAddress || null,
    quoteAsset: marketData.quoteToken?.symbol || null,
    poolCreatedAt: marketData.pairCreatedAt
      ? new Date(marketData.pairCreatedAt).toISOString()
      : null,
    liquidityUsd,
    liquidityToMcapRatio,
    volumeToLiquidityRatio24h,
    note,
  };
}