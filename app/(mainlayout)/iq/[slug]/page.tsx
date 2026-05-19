import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import nextDynamic from "next/dynamic";
import { getIqTestIntroBySlug } from "@/lib/iq-tests";

const IqIntroPage = nextDynamic(
  () => import("@/components/iq/iq-intro-page").then((module) => module.IqIntroPage),
  {
    ssr: false,
    loading: () => (
      <div className="mx-auto max-w-3xl py-10">
        <Alert>
          <AlertTitle>Chargement du test</AlertTitle>
          <AlertDescription>Preparation de l&apos;ecran de demarrage...</AlertDescription>
        </Alert>
      </div>
    ),
  }
);

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
    description: test.description ?? "Démarrez votre test de logique sur QI-FREE.",
  };
}

export default async function IqTestPage({ params }: IqTestPageProps) {
  const { slug } = await params;
  const { test, error } = await getIqTestIntroBySlug(slug);

  return <IqIntroPage test={test} error={error} />;
}
