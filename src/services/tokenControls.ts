import { Connection, PublicKey } from "@solana/web3.js";
import { getMint } from "@solana/spl-token";
import { Metaplex } from "@metaplex-foundation/js";

const RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`;

const connection = new Connection(RPC_URL, "confirmed");
const metaplex = Metaplex.make(connection);

type ControlStatus = "active" | "revoked" | "unknown";
type RiskImpact = "low" | "medium" | "high" | "unknown";

export type TokenControlsResult = {
  mintAuthority: {
    status: ControlStatus;
    address: string | null;
    riskImpact: RiskImpact;
    note: string | null;
  };
  freezeAuthority: {
    status: ControlStatus;
    address: string | null;
    riskImpact: RiskImpact;
    note: string | null;
  };
  updateAuthority: {
    status: ControlStatus;
    address: string | null;
    riskImpact: RiskImpact;
    note: string | null;
  };
  supply: {
    raw: string | null;
    formatted: string | null;
  };
  decimals: number | null;
  tokenProgram: string | null;
};

function formatSupply(rawSupply: bigint, decimals: number) {
  const divisor = 10 ** decimals;
  const numeric = Number(rawSupply) / divisor;

  if (numeric >= 1_000_000_000) return `${(numeric / 1_000_000_000).toFixed(2)}B`;
  if (numeric >= 1_000_000) return `${(numeric / 1_000_000).toFixed(2)}M`;
  if (numeric >= 1_000) return `${(numeric / 1_000).toFixed(2)}K`;
  return numeric.toLocaleString();
}

function authorityStatus(authority: PublicKey | null): {
  status: ControlStatus;
  address: string | null;
} {
  if (!authority) {
    return { status: "revoked", address: null };
  }

  return {
    status: "active",
    address: authority.toBase58(),
  };
}

export async function getTokenControls(address: string): Promise<TokenControlsResult> {
  try {
    const mintAddress = new PublicKey(address);
    const mint = await getMint(connection, mintAddress);

    const mintAuthority = authorityStatus(mint.mintAuthority);
    const freezeAuthority = authorityStatus(mint.freezeAuthority);

    let updateAuthority: {
      status: ControlStatus;
      address: string | null;
      riskImpact: RiskImpact;
      note: string | null;
    } = {
      status: "unknown",
      address: null,
      riskImpact: "unknown",
      note: "Metadata authority unavailable",
    };

    try {
      const metadata = await metaplex.nfts().findByMint({ mintAddress });
      const ua = metadata?.updateAuthorityAddress?.toBase58?.() || null;

      updateAuthority = ua
        ? {
            status: "active",
            address: ua,
            riskImpact: "medium",
            note: "Metadata can still be updated",
          }
        : {
            status: "revoked",
            address: null,
            riskImpact: "low",
            note: "Metadata update authority not detected",
          };
    } catch {
      updateAuthority = {
        status: "unknown",
        address: null,
        riskImpact: "unknown",
        note: "Metadata authority unavailable",
      };
    }

    return {
      mintAuthority: {
        status: mintAuthority.status,
        address: mintAuthority.address,
        riskImpact: mintAuthority.status === "active" ? "high" : "low",
        note:
          mintAuthority.status === "active"
            ? "Mint authority is active — supply can still be increased"
            : "Mint authority revoked — supply cannot be increased",
      },
      freezeAuthority: {
        status: freezeAuthority.status,
        address: freezeAuthority.address,
        riskImpact: freezeAuthority.status === "active" ? "high" : "low",
        note:
          freezeAuthority.status === "active"
            ? "Freeze authority is active — token accounts may be frozen"
            : "Freeze authority revoked — token accounts cannot be frozen by authority",
      },
      updateAuthority,
      supply: {
        raw: mint.supply.toString(),
        formatted: formatSupply(mint.supply, mint.decimals),
      },
      decimals: mint.decimals,
      tokenProgram: mint.tlvData ? "Token-2022" : "SPL Token",
    };
  } catch (error) {
    console.error("Token controls fetch failed:", error);

    return {
      mintAuthority: {
        status: "unknown",
        address: null,
        riskImpact: "unknown",
        note: "Unable to fetch mint authority",
      },
      freezeAuthority: {
        status: "unknown",
        address: null,
        riskImpact: "unknown",
        note: "Unable to fetch freeze authority",
      },
      updateAuthority: {
        status: "unknown",
        address: null,
        riskImpact: "unknown",
        note: "Unable to fetch update authority",
      },
      supply: {
        raw: null,
        formatted: null,
      },
      decimals: null,
      tokenProgram: null,
    };
  }
}