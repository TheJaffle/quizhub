"use client";

import type { IqSpeedIntro } from "@/lib/iq-tests";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Brain, Play, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useBlockTestBackNavigation } from "@/components/iq/use-block-test-back-navigation";

type IqSpeedIntroPageProps = {
  data: IqSpeedIntro | null;
  error?: string;
};

function formatTimeLimit(seconds: number) {
  if (seconds < 60) {
    return `${seconds} sec`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (remainingSeconds === 0) {
    return `${minutes} min`;
  }

  return `${minutes} min ${remainingSeconds} sec`;
}

export function IqSpeedIntroPage({ data, error }: IqSpeedIntroPageProps) {
  const router = useRouter();
  useBlockTestBackNavigation();

  if (error || !data) {
    return (
      <div className="mx-auto max-w-3xl py-10">
        <Alert variant="destructive">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Introduction rapidite indisponible</AlertTitle>
          <AlertDescription>{error || "Cette tentative de test de logique est introuvable."}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl py-2 md:py-8">
      <Card className="overflow-hidden border-0 shadow-xl">
        <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative min-h-[120px] bg-amber-950 text-white md:min-h-[220px]">
            <div className="absolute inset-0 bg-cover bg-center opacity-60" style={{ backgroundImage: "url('/iq/vitesse.png')" }} />
            <div className="absolute inset-0 bg-gradient-to-br from-amber-950/90 via-orange-900/75 to-rose-900/80" />
            <div className="relative z-10 flex h-full flex-col justify-end p-4 md:justify-start md:p-8">
              <Badge className="mb-2 w-fit bg-white/15 text-white hover:bg-white/20">
                <Brain className="mr-1 h-3.5 w-3.5" />
                Rapidité
              </Badge>
              <h1 className="max-w-xl text-2xl font-bold tracking-tight md:text-4xl">Test de rapidité</h1>
              <p className="mt-2 max-w-xl text-sm text-white/80 md:text-base">Répondez vite, sans perdre en précision.</p>
            </div>
          </div>

          <CardContent className="space-y-3 p-4 md:space-y-5 md:p-8">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border bg-background p-3">
                <p className="text-xs text-muted-foreground">Questions</p>
                <p className="mt-1 text-2xl font-bold">{data.section.questionCount}</p>
              </div>
              <div className="rounded-lg border bg-background p-3">
                <p className="text-xs text-muted-foreground">Temps</p>
                <p className="mt-1 text-xl font-bold">{formatTimeLimit(data.section.totalTimeLimitSeconds)}</p>
              </div>
              {data.section.timeLimitSeconds ? (
                <div className="rounded-lg border bg-background p-3 sm:col-span-2">
                  <p className="text-xs text-muted-foreground">Par question</p>
                  <p className="mt-1 text-xl font-bold">{formatTimeLimit(data.section.timeLimitSeconds)}</p>
                </div>
              ) : null}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" />
                <h2 className="font-semibold">À retenir</h2>
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>Répondez au maximum de questions.</p>
                <p>Une réponse validée est enregistrée.</p>
                <p>À la fin du chrono, la phase s'arrête.</p>
              </div>
            </div>

            <Button className="w-full" size="lg" onClick={() => router.push(data.nextUrl)}>
              <Play className="mr-2 h-4 w-4" />
              Commencer la rapidite
            </Button>

            <p className="text-center text-xs text-muted-foreground">Le chrono démarre au lancement.</p>
          </CardContent>
        </div>
      </Card>
    </div>
  );
}
