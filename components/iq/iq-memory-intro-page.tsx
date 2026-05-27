"use client";

import type { IqMemoryIntro } from "@/lib/iq-tests";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Brain, Eye, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { useBlockTestBackNavigation } from "@/components/iq/use-block-test-back-navigation";

type IqMemoryIntroPageProps = {
  data: IqMemoryIntro | null;
  error?: string;
};

function formatDisplayTime(seconds: number) {
  return `${seconds} sec`;
}

export function IqMemoryIntroPage({ data, error }: IqMemoryIntroPageProps) {
  const router = useRouter();
  useBlockTestBackNavigation();

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
    <div className="mx-auto max-w-5xl py-2 md:py-8">
      <Card className="overflow-hidden border-0 shadow-xl">
        <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative min-h-[120px] bg-emerald-950 text-white md:min-h-[220px]" >
            <div className="absolute inset-0 bg-cover bg-center opacity-60" style={{ backgroundImage: "url('/iq/memoire.png')" }} />
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/90 via-teal-900/75 to-cyan-900/80" />
            <div className="relative z-10 flex h-full flex-col justify-end p-4 md:justify-start md:p-8">
              <Badge className="mb-2 w-fit bg-white/15 text-white hover:bg-white/20">
                <Brain className="mr-1 h-3.5 w-3.5" />
                Mémoire
              </Badge>
              <h1 className="max-w-xl text-2xl font-bold tracking-tight md:text-4xl">Test de mémoire</h1>
              <p className="mt-2 max-w-xl text-sm text-white/80 md:text-base">Mémorisez vite, puis répondez après disparition.</p>
            </div>
          </div>

          <CardContent className="space-y-3 p-4 md:space-y-5 md:p-8">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border bg-background p-3">
                <p className="text-xs text-muted-foreground">Questions</p>
                <p className="mt-1 text-2xl font-bold">{data.section.questionCount}</p>
              </div>
              <div className="rounded-lg border bg-background p-3">
                <p className="text-xs text-muted-foreground">Affichage</p>
                <p className="mt-1 text-xl font-bold">{formatDisplayTime(data.section.displayTimeSeconds)}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-emerald-500" />
                <h2 className="font-semibold">À faire</h2>
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>Regardez le contenu.</p>
                <p>Mémorisez-le.</p>
                <p>Choisissez ensuite la bonne réponse.</p>
              </div>
            </div>

            <Button className="w-full" size="lg" onClick={() => router.push(data.nextUrl)}>
              <Play className="mr-2 h-4 w-4" />
              Commencer la memoire
            </Button>

            <p className="text-center text-xs text-muted-foreground">Le stimulus disparaît automatiquement.</p>
          </CardContent>
        </div>
      </Card>
    </div>
  );
}
