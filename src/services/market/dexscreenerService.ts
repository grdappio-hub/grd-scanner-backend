const BASE_URL = "https://api.dexscreener.com";

const TRUSTED_QUOTES = ["USDC", "USDT", "SOL"];

function normalizeSymbol(symbol?: string | null) {
  return symbol ? symbol.toUpperCase() : null;
}

function isStable(symbol?: string | null) {
  const s = normalizeSymbol(symbol);
  return s === "USDC" || s === "USDT";
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

    const normalizedAddress = tokenAddress;

    const scoredPairs = data.map((pair: any) => {
      const baseAddress = pair.baseToken?.address || null;
      const quoteAddress = pair.quoteToken?.address || null;
      const baseSymbol = normalizeSymbol(pair.baseToken?.symbol);
      const quoteSymbol = normalizeSymbol(pair.quoteToken?.symbol);

      const scannedIsBase = baseAddress === normalizedAddress;
      const scannedIsQuote = quoteAddress === normalizedAddress;

      let trustScore = 0;

      // Prefer pools where the scanned token is the base token
      if (scannedIsBase) trustScore += 100;
      if (scannedIsQuote) trustScore += 20;

      // Prefer trusted quote assets
      if (TRUSTED_QUOTES.includes(quoteSymbol || "")) trustScore += 50;

      // Prefer stable quote most of all
      if (quoteSymbol === "USDC") trustScore += 30;
      if (quoteSymbol === "USDT") trustScore += 25;
      if (quoteSymbol === "SOL") trustScore += 15;

      // Penalize pools where scanned token is quote and base is some random asset
      if (scannedIsQuote && !isStable(baseSymbol)) trustScore -= 40;

      return {
        pair,
        trustScore,
      };
    });

    scoredPairs.sort((a: any, b: any) => {
      if (b.trustScore !== a.trustScore) {
        return b.trustScore - a.trustScore;
      }
      return (b.pair.liquidity?.usd || 0) - (a.pair.liquidity?.usd || 0);
    });

    const bestPair = scoredPairs[0].pair;

    const baseAddress = bestPair.baseToken?.address || null;
    const quoteAddress = bestPair.quoteToken?.address || null;
    const baseSymbol = normalizeSymbol(bestPair.baseToken?.symbol);
    const quoteSymbol = normalizeSymbol(bestPair.quoteToken?.symbol);

    const scannedIsBase = baseAddress === normalizedAddress;
    const scannedIsQuote = quoteAddress === normalizedAddress;

    let priceUsd = bestPair.priceUsd ? Number(bestPair.priceUsd) : null;

    // If the scanned token itself is a stablecoin, force peg-safe display
    if (
      normalizedAddress === "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" || // Solana USDC
      (scannedIsBase && isStable(baseSymbol)) ||
      (scannedIsQuote && isStable(quoteSymbol))
    ) {
      priceUsd = 1;
    }

    return {
      source: "dexscreener",
      chainId: bestPair.chainId,
      dexId: bestPair.dexId,
      pairAddress: bestPair.pairAddress,
      pairUrl: bestPair.url,
      pricingSource: scannedIsBase ? (quoteSymbol || "UNKNOWN") : `QUOTE_SIDE_${baseSymbol || "UNKNOWN"}`,

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