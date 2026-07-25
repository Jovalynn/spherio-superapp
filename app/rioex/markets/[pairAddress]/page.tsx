import { redirect } from "next/navigation";

type RioExMarketRedirectPageProps = {
  params: Promise<{
    pairAddress?: string;
  }>;
};

export default async function RioExMarketRedirectPage({ params }: RioExMarketRedirectPageProps) {
  const resolved = await params;
  const pairAddress = String(resolved?.pairAddress || "").trim();

  if (pairAddress) {
    redirect(`/rioex?pair=${encodeURIComponent(pairAddress)}`);
  }

  redirect("/rioex");
}
