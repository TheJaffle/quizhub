import { IqSondageReviewPage } from "@/components/iq/iq-sondage-review-page";
import { getIqSondageReviewByToken } from "@/lib/iq-tests";

type IqSondageReviewByTokenRouteProps = {
  params: Promise<{
    token: string;
  }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return {
    title: "Correction sondage | Free Logic Test",
    description: "Correction question par question du sondage IQ.",
  };
}

export default async function IqSondageReviewByTokenRoute({ params }: IqSondageReviewByTokenRouteProps) {
  const { token } = await params;

  const { review, error } = await getIqSondageReviewByToken(token);

  return <IqSondageReviewPage initialEmail="" review={review} error={error} hideLookupForm />;
}
