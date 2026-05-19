import { IqLongMemoryIntroPage } from "@/components/iq/iq-long-memory-intro-page";
import { getIqLongMemoryIntroByAttemptToken } from "@/lib/iq-tests";

export const dynamic = "force-dynamic";

export default async function IqLongMemoryIntroRoute({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { data, error } = await getIqLongMemoryIntroByAttemptToken(token);

  return <IqLongMemoryIntroPage data={data} error={error} />;
}
