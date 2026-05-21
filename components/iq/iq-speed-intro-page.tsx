"use client";

import type { IqSpeedIntro } from "@/lib/iq-tests";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Brain, Clock3, Play, Sparkles, TimerReset, Zap } from "lucide-react";
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
    <div className="mx-auto max-w-5xl py-8">
      <Card className="overflow-hidden border-0 shadow-xl">
        <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative min-h-[260px] bg-amber-950 text-white">
            <div className="absolute inset-0 bg-cover bg-center opacity-60" style={{ backgroundImage: "url('/iq/vitesse.png')" }} />
            <div className="absolute inset-0 bg-gradient-to-br from-amber-950/90 via-orange-900/75 to-rose-900/80" />
            <div className="relative z-10 flex h-full flex-col justify-start p-6 md:p-8">
              <Badge className="mb-4 w-fit bg-white/15 text-white hover:bg-white/20">
                <Brain className="mr-1 h-3.5 w-3.5" />
                Test de rapidite
              </Badge>
              <h1 className="max-w-xl text-3xl font-bold tracking-tight md:text-4xl">Test de rapidite</h1>
              <p className="mt-4 max-w-xl text-white/80">
                Derniere grande ligne droite dans {data.attempt.testTitle}. Cette phase vous pousse a repondre vite tout en gardant de la precision.
              </p>
            </div>
          </div>

          <CardContent className="space-y-6 p-6 md:p-8">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border bg-background p-4">
                <p className="text-sm text-muted-foreground">Questions rapidite</p>
                <p className="mt-2 text-3xl font-bold">{data.section.questionCount}</p>
              </div>
              <div className="rounded-lg border bg-background p-4">
                <p className="text-sm text-muted-foreground">Temps disponible</p>
                <p className="mt-2 text-2xl font-bold">{formatTimeLimit(data.section.totalTimeLimitSeconds)}</p>
              </div>
              {data.section.timeLimitSeconds ? (
                <div className="rounded-lg border bg-background p-4 sm:col-span-2">
                  <p className="text-sm text-muted-foreground">Temps max par question</p>
                  <p className="mt-2 text-2xl font-bold">{formatTimeLimit(data.section.timeLimitSeconds)}</p>
                </div>
              ) : null}
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500" />
                <h2 className="text-xl font-semibold">Comment ca marche</h2>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Vous aurez {formatTimeLimit(data.section.totalTimeLimitSeconds)} pour repondre a un maximum de questions.</p>
                {data.section.timeLimitSeconds ? <p>Chaque question passera automatiquement apres {formatTimeLimit(data.section.timeLimitSeconds)} si vous ne repondez pas.</p> : null}
                <p>Repondez vite, mais essayez de rester precis.</p>
                <p>Chaque reponse sera enregistree immediatement.</p>
                <p>Lorsque le temps est ecoule, le test se termine automatiquement.</p>
              </div>
            </div>

            <div className="rounded-lg border bg-muted/40 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                <Sparkles className="h-4 w-4 text-amber-500" />
                Repere utile
              </div>
              <p className="text-sm text-muted-foreground">
                Le chronometre global sera lance pour {formatTimeLimit(data.section.totalTimeLimitSeconds)} et les reponses defileront sans attente.
              </p>
            </div>

            <Button className="w-full" size="lg" onClick={() => router.push(data.nextUrl)}>
              <Play className="mr-2 h-4 w-4" />
              Commencer la rapidite
            </Button>

            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Clock3 className="h-3.5 w-3.5" />
              <TimerReset className="h-3.5 w-3.5" />
              <span>Un chrono global pilote la phase et un chrono court peut aussi faire passer a la question suivante.</span>
            </div>
          </CardContent>
        </div>
      </Card>
    </div>
  );
}
