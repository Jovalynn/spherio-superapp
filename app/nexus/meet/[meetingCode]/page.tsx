import MeetingJoinGateway from "./MeetingJoinGateway";

export const dynamic = "force-dynamic";

type JoinPageProps = {
  params: Promise<{
    meetingCode: string;
  }>;
  searchParams: Promise<{
    t?: string | string[];
  }>;
};

export default async function NexusMeetingJoinPage({
  params,
  searchParams,
}: JoinPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const rawToken = resolvedSearchParams.t;
  const token = Array.isArray(rawToken)
    ? rawToken[0] ?? ""
    : rawToken ?? "";

  const meetingCode = decodeURIComponent(
    String(resolvedParams.meetingCode ?? "")
  )
    .trim()
    .toUpperCase();

  return (
    <MeetingJoinGateway
      meetingCode={meetingCode}
      token={token}
    />
  );
}
