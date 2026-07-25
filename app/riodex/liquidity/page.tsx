import { redirect } from "next/navigation";

type LiquidityRedirectPageProps = {
  searchParams?: Promise<{
    pool?: string;
    pair?: string;
    mode?: string;
    source?: string;
  }>;
};

export default async function LiquidityRedirectPage({ searchParams }: LiquidityRedirectPageProps) {
  const params = await searchParams;
  const pool = String(params?.pool || params?.pair || "").trim();
  const mode = String(params?.mode || "add").trim() === "remove" ? "remove" : "add";
  const source = String(params?.source || "liquidity_redirect").trim();

  if (pool) {
    redirect(
      `/riodex/liquidity/action?pool=${encodeURIComponent(pool)}&mode=${encodeURIComponent(mode)}&source=${encodeURIComponent(source)}`
    );
  }

  redirect("/riodex/pools");
}
