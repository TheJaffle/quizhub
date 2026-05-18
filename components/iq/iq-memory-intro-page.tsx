"use client";

import type { IqMemoryIntro } from "@/lib/iq-tests";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Brain, Clock3, Eye, Play, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

type IqMemoryIntroPageProps = {
  data: IqMemoryIntro | null;
  error?: string;
};

function formatDisplayTime(seconds: number) {
  return `${seconds} sec`;
}

function formatTimeLimit(seconds: number | null) {
  if (!seconds) return "Temps libre pour cette phase";

  const minutes = Math.ceil(seconds / 60);
  return `${minutes} min max`;
}

export function IqMemoryIntroPage({ data, error }: IqMemoryIntroPageProps) {
  const router = useRouter();

  if (error || !data) {
    return (
      <div className="mx-auto max-w-3xl py-10">
        <Alert variant="destructive">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Introduction memoire indisponible</AlertTitle>
          <AlertDescription>{error || "Cette tentative de test de logique est introuvable."}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl py-8">
      <Card className="overflow-hidden border-0 shadow-xl">
        <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative min-h-[260px] bg-emerald-950 text-white" >
            <div className="absolute inset-0 bg-cover bg-center opacity-60" style={{ backgroundImage: "url('/iq/memoire.png')" }} />
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/90 via-teal-900/75 to-cyan-900/80" />
            <div className="relative z-10 flex h-full flex-col justify-start p-6 md:p-8">
              <Badge className="mb-4 w-fit bg-white/15 text-white hover:bg-white/20">
                <Brain className="mr-1 h-3.5 w-3.5" />
                Test de memoire
              </Badge>
              <h1 className="max-w-xl text-3xl font-bold tracking-tight md:text-4xl">Test de memoire</h1>
              <p className="mt-4 max-w-xl text-white/80">
                Une nouvelle phase commence dans {data.attempt.testTitle}. Cette partie mesure votre capacité à retenir rapidement une information avant qu&apos;elle disparaisse.
              </p>
            </div>
          </div>

          <CardContent className="space-y-6 p-6 md:p-8">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border bg-background p-4">
                <p className="text-sm text-muted-foreground">Questions memoire</p>
                <p className="mt-2 text-3xl font-bold">{data.section.questionCount}</p>
              </div>
              <div className="rounded-lg border bg-background p-4">
                <p className="text-sm text-muted-foreground">Stimulus visible</p>
                <p className="mt-2 text-2xl font-bold">{formatDisplayTime(data.section.displayTimeSeconds)}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-emerald-500" />
                <h2 className="text-xl font-semibold">Comment ca marche</h2>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Une suite de chiffres ou un contenu va s&apos;afficher pendant quelques secondes.</p>
                <p>Vous devrez le memoriser.</p>
                <p>Ensuite, le contenu disparaitra et plusieurs reponses seront proposees.</p>
                <p>Choisissez la reponse qui correspond a ce que vous avez memorise.</p>
              </div>
            </div>

            <div className="rounded-lg border bg-muted/40 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                <Sparkles className="h-4 w-4 text-emerald-500" />
                Repere utile
              </div>
              <p className="text-sm text-muted-foreground">
                Chaque stimulus restera affiche environ {formatDisplayTime(data.section.displayTimeSeconds)}. La phase complete prevoit {formatTimeLimit(data.section.timeLimitSeconds)}.
              </p>
            </div>

            <Button className="w-full" size="lg" onClick={() => router.push(data.nextUrl)}>
              <Play className="mr-2 h-4 w-4" />
              Commencer la memoire
            </Button>

            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Clock3 className="h-3.5 w-3.5" />
              <span>La phase suivante ouvrira le mode memoire avec disparition automatique du stimulus.</span>
            </div>
          </CardContent>
        </div>
      </Card>
    </div>
  );
}
