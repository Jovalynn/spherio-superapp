export type TokenVisual = {
  symbol: string;
  verified: boolean;
  kind: "image" | "rusd_diamond" | "generic";
  logoUrl?: string | null;
};

export const RIO_LOGO_URL =
  "https://avatars.githubusercontent.com/u/175851528?s=400&u=b0c1a871d1e739566c4c2bf96a97720fedfc03ab&v=4";

export const TOKEN_REGISTRY: Record<string, TokenVisual> = {
  urio: {
    symbol: "RIO",
    verified: true,
    kind: "image",
    logoUrl: RIO_LOGO_URL,
  },

  rio14nurau9scuqhr3sczktx63sr8kdpvwh00zyftamrrn685vex2uus7ne2df: {
    symbol: "RUSD",
    verified: true,
    kind: "rusd_diamond",
  },
};

export function getTokenMeta(assetId?: string | null): TokenVisual {
  if (!assetId) {
    return {
      symbol: "—",
      verified: false,
      kind: "generic",
    };
  }

  const entry = TOKEN_REGISTRY[assetId];
  if (entry) return entry;

  return {
    symbol: assetId.slice(0, 6).toUpperCase(),
    verified: false,
    kind: "generic",
  };
}
