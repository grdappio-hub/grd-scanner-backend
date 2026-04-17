const BASE_URL = "https://api.dexscreener.com";

const TRUSTED_QUOTE_PRIORITY = ["USDC", "USDT", "SOL"];

function getQuotePriority(symbol?: string | null) {
  if (!symbol) return 999;
  const index = TRUSTED_QUOTE_PRIORITY.indexOf(symbol.toUpperCase());
  return index === -1 ? 999 : index;
}

export async function getTokenPairs(chainId: string, tokenAddress: string) {
  const url = `${BASE_URL}/token-pairs/v1/${chainId}/${tokenAddress}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Dexscreener API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      return null;
    }

    const sorted = [...data].sort((a: any, b: any) => {
      const aPriority = getQuotePriority(a.quoteToken?.symbol);
      const bPriority = getQuotePriority(b.quoteToken?.symbol);

      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }

      return (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0);
    });

    const bestPair = sorted[0];
    const quoteSymbol = bestPair.quoteToken?.symbol?.toUpperCase?.() || null;

    let priceUsd = bestPair.priceUsd ? Number(bestPair.priceUsd) : null;

    // Stablecoin sanity checks
    const baseSymbol = bestPair.baseToken?.symbol?.toUpperCase?.() || null;
    if (baseSymbol === "USDC") priceUsd = 1;
    if (baseSymbol === "USDT") priceUsd = 1;

    return {
      source: "dexscreener",
      chainId: bestPair.chainId,
      dexId: bestPair.dexId,
      pairAddress: bestPair.pairAddress,
      pairUrl: bestPair.url,
      pricingSource: quoteSymbol || "UNKNOWN",

      baseToken: {
        address: bestPair.baseToken?.address || null,
        name: bestPair.baseToken?.name || null,
        symbol: bestPair.baseToken?.symbol || null,
      },

      quoteToken: {
        address: bestPair.quoteToken?.address || null,
        name: bestPair.quoteToken?.name || null,
        symbol: bestPair.quoteToken?.symbol || null,
      },

      priceUsd,
      priceNative: bestPair.priceNative ? Number(bestPair.priceNative) : null,

      liquidityUsd: bestPair.liquidity?.usd || 0,
      volume24h: bestPair.volume?.h24 || 0,
      volume6h: bestPair.volume?.h6 || 0,
      volume1h: bestPair.volume?.h1 || 0,
      volume5m: bestPair.volume?.m5 || 0,

      buys24h: bestPair.txns?.h24?.buys || 0,
      sells24h: bestPair.txns?.h24?.sells || 0,

      priceChange24h: bestPair.priceChange?.h24 || 0,
      fdv: bestPair.fdv || null,
      marketCap: bestPair.marketCap || null,

      pairCreatedAt: bestPair.pairCreatedAt || null,

      imageUrl: bestPair.info?.imageUrl || null,
      website: bestPair.info?.websites?.[0]?.url || null,
      twitter:
        bestPair.info?.socials?.find((s: any) => s.type === "twitter")?.url || null,
    };
  } catch (error) {
    console.error("Dexscreener fetch failed:", error);
    return null;
  }
}