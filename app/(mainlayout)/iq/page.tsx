import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { IqResetSessionButton } from "@/components/iq/iq-reset-session-button";
import { getIqTestLaunchItems } from "@/lib/iq-tests";
import { AlertTriangle, Brain, Crown, FlaskConical, Play, Rocket, SquareStack } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const BUTTON_LABELS: Record<string, string> = {
  "test-qi-complet": "Test",
  sondage: "Sondage",
  basic: "Basic",
  premium: "Premium",
};

const BUTTON_ICONS: Record<string, typeof FlaskConical> = {
  "test-qi-complet": FlaskConical,
  sondage: SquareStack,
  basic: Rocket,
  premium: Crown,
};

export default async function IqTestsLaunchPage() {
  const tests = await getIqTestLaunchItems();
  const launchOrder = ["test-qi-complet", "sondage", "basic", "premium"];
  const launchableTests = launchOrder
    .map((slug) => tests.find((test) => test.slug === slug))
    .filter((test): test is NonNullable<typeof test> => Boolean(test));

  if (launchableTests.length === 0) {
    return (
      <div className="mx-auto max-w-3xl py-10">
        <Alert variant="destructive">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Tests indisponibles</AlertTitle>
          <AlertDescription>Aucun test pilotable n&apos;est disponible pour le moment.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl py-8">
      <div className="mb-8 text-center">
        <Badge className="mb-4 bg-indigo-500 text-white hover:bg-indigo-600">
          <Brain className="mr-1 h-3.5 w-3.5" />
          Tests de logique
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Choisissez le test a lancer</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {launchableTests.map((test) => {
          const buttonLabel = BUTTON_LABELS[test.slug] ?? test.title;
          const Icon = BUTTON_ICONS[test.slug] ?? Brain;

          return (
            <Card key={test.slug} className="border-0 shadow-xl">
              <CardHeader>
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
                  <Icon className="h-6 w-6" />
                </div>
                <CardTitle>{buttonLabel}</CardTitle>
                <CardDescription>{test.description || "Parcours de raisonnement indicatif."}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href={`/iq/${test.slug}`}>
                    <Play className="mr-2 h-4 w-4" />
                    Lancer {buttonLabel}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <IqResetSessionButton />
    </div>
  );
}
