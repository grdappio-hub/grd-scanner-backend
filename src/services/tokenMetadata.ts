import { publicKey } from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  fetchMetadataFromSeeds,
} from "@metaplex-foundation/mpl-token-metadata";

type TokenMetadataResult = {
  name: string;
  symbol: string;
  verified: boolean;
};

export async function getTokenMetadata(
  address: string
): Promise<TokenMetadataResult> {
  try {
    // Use public Solana RPC
    const umi = createUmi("https://api.mainnet-beta.solana.com");

    const mint = publicKey(address);

    // This automatically derives the metadata PDA and fetches it
    const metadata = await fetchMetadataFromSeeds(umi, { mint });

    return {
      name: metadata.name?.trim() || "Unknown Token",
      symbol: metadata.symbol?.trim() || "UNKNOWN",
      verified: true, // means metadata exists
    };
  } catch (error) {
    console.error("Metaplex lookup failed:", error);

    return {
      name: "Unknown Token",
      symbol: "UNKNOWN",
      verified: false,
    };
  }
}