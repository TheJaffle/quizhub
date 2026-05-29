import { IqSondageReviewPage } from "@/components/iq/iq-sondage-review-page";
import { getIqSondageReviewByEmail } from "@/lib/iq-tests";

type IqSondageReviewRouteProps = {
  searchParams?: Promise<{
    email?: string;
  }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return {
    title: "Relecture sondage | brainspark",
    description: "Relecture question par question des reponses d'un participant au sondage IQ.",
  };
}

export default async function IqSondageReviewRoute({ searchParams }: IqSondageReviewRouteProps) {
  const resolvedSearchParams = await searchParams;
  const initialEmail = resolvedSearchParams?.email?.trim() ?? "";
  const { review, error } = initialEmail ? await getIqSondageReviewByEmail(initialEmail) : { review: null, error: undefined };

  return <IqSondageReviewPage initialEmail={initialEmail} review={review} error={error} />;
}
