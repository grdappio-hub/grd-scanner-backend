const { getTokenPairs } = require('./services/market/dexscreenerService');

async function run() {
  const chainId = 'solana';
  const tokenAddress = 'So11111111111111111111111111111111111111112'; // wrapped SOL

  const data = await getTokenPairs(chainId, tokenAddress);

  console.log('Dexscreener raw response:');
  console.dir(data, { depth: null });
}

run();