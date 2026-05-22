import { IqIntroPageNoSsr } from "@/components/iq/iq-intro-page-no-ssr";
import { getIqTestIntroBySlug } from "@/lib/iq-tests";

export const dynamic = "force-dynamic";

type IqTestPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({ params }: IqTestPageProps) {
  const { slug } = await params;
  const { test } = await getIqTestIntroBySlug(slug);

  if (!test) {
    return {
      title: "Test de logique indisponible | QuizHub",
    };
  }

  return {
    title: `${test.title} | QuizHub`,
    description: test.description ?? "Démarrez votre test de logique sur brainspark.",
  };
}

export default async function IqTestPage({ params }: IqTestPageProps) {
  const { slug } = await params;
  const { test, error } = await getIqTestIntroBySlug(slug);

  return <IqIntroPageNoSsr test={test} error={error} />;
}
