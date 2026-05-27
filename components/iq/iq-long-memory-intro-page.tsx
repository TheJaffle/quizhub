"use client";

import type { IqLongMemoryIntro } from "@/lib/iq-tests";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Brain, Eye, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { useBlockTestBackNavigation } from "@/components/iq/use-block-test-back-navigation";

type IqLongMemoryIntroPageProps = {
  data: IqLongMemoryIntro | null;
  error?: string;
};

export function IqLongMemoryIntroPage({ data, error }: IqLongMemoryIntroPageProps) {
  const router = useRouter();
  useBlockTestBackNavigation();

  if (error || !data) {
    return (
      <div className="mx-auto max-w-3xl py-10">
        <Alert variant="destructive">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Introduction memoire longue indisponible</AlertTitle>
          <AlertDescription>{error || "Cette tentative de test de logique est introuvable."}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl py-2 md:py-8">
      <Card className="overflow-hidden border-0 shadow-xl">
        <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative bg-violet-950 text-white">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-950/90 via-fuchsia-900/75 to-indigo-900/80" />
            <div className="relative z-10 p-4 md:p-8">
              <Badge className="mb-2 w-fit bg-white/15 text-white hover:bg-white/20 md:mb-4">
                <Brain className="mr-1 h-3.5 w-3.5" />
                Memoire longue
              </Badge>
              <h1 className="max-w-xl text-2xl font-bold tracking-tight md:text-4xl">{data.introTitle}</h1>
              <p className="mt-1 max-w-xl text-sm text-white/80 md:mt-2 md:text-base">Mémorisez maintenant. Réponse plus tard.</p>
            </div>
          </div>

          <CardContent className="space-y-3 p-4 md:space-y-5 md:p-8">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-violet-500" />
                <h2 className="text-xl font-bold">Comment ça marche</h2>
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>Regardez le stimulus quelques secondes.</p>
                <p>Mémorisez-le sans répondre maintenant.</p>
                <p>La question reviendra plus tard dans le test.</p>
              </div>
            </div>

            <Button className="w-full" size="lg" onClick={() => router.push(data.nextUrl)}>
              <Play className="mr-2 h-4 w-4" />
              Compris
            </Button>

            <p className="text-center text-xs text-muted-foreground">Le premier stimulus arrive juste après.</p>
          </CardContent>
        </div>
      </Card>
    </div>
  );
}
