import { env } from "../config/env";

async function heliusRpcRequest(method: string, params: unknown[]) {
  const url = `https://mainnet.helius-rpc.com/?api-key=${env.heliusApiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "1",
      method,
      params,
    }),
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message || "Helius RPC request failed");
  }

  return data.result;
}

export async function getSolanaBalance(address: string) {
  const result = await heliusRpcRequest("getBalance", [address]);
  return result.value;
}

export async function getTokenLargestAccounts(mintAddress: string) {
  const result = await heliusRpcRequest("getTokenLargestAccounts", [mintAddress]);
  return result.value;
}

export async function getAccountInfo(address: string) {
  const result = await heliusRpcRequest("getAccountInfo", [
    address,
    { encoding: "jsonParsed" }
  ]);
  return result.value;
}

export async function isTokenMint(address: string) {
  const accountInfo = await getAccountInfo(address);

  if (!accountInfo) {
    return false;
  }

  const parsed = accountInfo.data?.parsed;

  return parsed?.type === "mint";
}

export async function getTopTokenOwners(mintAddress: string) {
  const largestAccounts = await getTokenLargestAccounts(mintAddress);

  const ownerBalances = new Map<string, number>();

  for (const account of largestAccounts) {
    const accountInfo = await getAccountInfo(account.address);

    const owner = accountInfo?.data?.parsed?.info?.owner;
    const amount = Number(account.amount);

    if (!owner) {
      continue;
    }

    const currentBalance = ownerBalances.get(owner) || 0;
    ownerBalances.set(owner, currentBalance + amount);
  }

  return Array.from(ownerBalances.entries())
    .map(([owner, amount]) => ({
      owner,
      amount,
    }))
    .sort((a, b) => b.amount - a.amount);
}