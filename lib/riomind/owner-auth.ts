import { createPublicKey, verify, type JsonWebKey } from "node:crypto";

export class RioMindAuthenticationError extends Error {
  constructor() { super("Authenticated identity required"); this.name = "RioMindAuthenticationError"; }
}
type Config = { issuer: string; audience: string };
type Fetcher = typeof fetch;
export function createOwnerVerifier(config: Config, fetcher: Fetcher = fetch, now: () => number = Date.now) {
  if (!/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(config.issuer) || !config.audience) throw new RioMindAuthenticationError();
  let keys: Record<string, JsonWebKey> = Object.create(null);
  let expires = 0;
  let pending: Promise<void> | undefined;
  async function refresh() {
    if (!pending) pending = (async () => {
      const response = await fetcher(`${config.issuer}/cdn-cgi/access/certs`, { signal: AbortSignal.timeout(5000), redirect: "error" });
      if (!response.ok) throw new RioMindAuthenticationError();
      const raw = await response.text();
      if (raw.length > 65536) throw new RioMindAuthenticationError();
      const body = JSON.parse(raw);
      if (!Array.isArray(body.keys) || body.keys.length > 16) throw new RioMindAuthenticationError();
      const next: Record<string, JsonWebKey> = Object.create(null);
      for (const key of body.keys) if (key.kty === "RSA" && (!key.alg || key.alg === "RS256") && (!key.use || key.use === "sig") && typeof key.kid === "string") next[key.kid] = key;
      keys = next; expires = now() + 300000;
    })().finally(() => { pending = undefined; });
    await pending;
  }
  return async function owner(headers: Headers): Promise<string> {
    try {
      const token = headers.get("cf-access-jwt-assertion");
      if (!token || token.length > 16384) throw new RioMindAuthenticationError();
      const parts = token.split(".");
      if (parts.length !== 3 || parts.some(part => !/^[A-Za-z0-9_-]+$/.test(part))) throw new RioMindAuthenticationError();
      const header = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
      const claims = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
      if (header.alg !== "RS256" || typeof header.kid !== "string" || header.crit) throw new RioMindAuthenticationError();
      if (expires <= now()) await refresh();
      // Unknown key IDs are rejected until the bounded cache refresh, preventing unauthenticated fetch floods.
      const jwk = keys[header.kid];
      if (!jwk || !verify("RSA-SHA256", Buffer.from(`${parts[0]}.${parts[1]}`), createPublicKey({ key: jwk, format: "jwk" }), Buffer.from(parts[2], "base64url"))) throw new RioMindAuthenticationError();
      const seconds = now() / 1000;
      const audience = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
      if (claims.iss !== config.issuer || !audience.includes(config.audience) || typeof claims.exp !== "number" || !Number.isFinite(claims.exp) || claims.exp <= seconds || (claims.nbf !== undefined && (typeof claims.nbf !== "number" || claims.nbf > seconds)) || typeof claims.sub !== "string" || !/^[A-Za-z0-9_-]{1,120}$/.test(claims.sub)) throw new RioMindAuthenticationError();
      return claims.sub;
    } catch { throw new RioMindAuthenticationError(); }
  };
}
let verifier: ReturnType<typeof createOwnerVerifier> | undefined;
let configured = "";
export async function getVerifiedOwnerKey(headers: Headers) {
  const issuer = process.env.CF_ACCESS_TEAM_DOMAIN || "";
  const audience = process.env.CF_ACCESS_AUD || "";
  const signature = `${issuer}|${audience}`;
  if (!verifier || configured !== signature) { verifier = createOwnerVerifier({ issuer, audience }); configured = signature; }
  return verifier(headers);
}
