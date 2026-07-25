import { redirect } from "next/navigation";

type Props = {
  params: Promise<{
    pairAddress: string;
  }>;
};

export default async function LegacyRioExPairTradeRedirect({ params }: Props) {
  const { pairAddress } = await params;

  redirect(`/rioex/trade?pair=${encodeURIComponent(pairAddress)}`);
}
