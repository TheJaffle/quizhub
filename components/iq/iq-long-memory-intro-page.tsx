"use client";

import type { IqLongMemoryIntro } from "@/lib/iq-tests";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Brain, Clock3, Eye, Play } from "lucide-react";
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
    <div className="mx-auto max-w-5xl py-8">
      <Card className="overflow-hidden border-0 shadow-xl">
        <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative min-h-[260px] bg-violet-950 text-white">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-950/90 via-fuchsia-900/75 to-indigo-900/80" />
            <div className="relative z-10 flex h-full flex-col justify-start p-6 md:p-8">
              <Badge className="mb-4 w-fit bg-white/15 text-white hover:bg-white/20">
                <Brain className="mr-1 h-3.5 w-3.5" />
                Memoire longue
              </Badge>
              <h1 className="max-w-xl text-3xl font-bold tracking-tight md:text-4xl">{data.introTitle}</h1>
              <p className="mt-4 max-w-xl text-white/80">{data.introText}</p>
            </div>
          </div>

          <CardContent className="space-y-6 p-6 md:p-8">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border bg-background p-4">
                <p className="text-sm text-muted-foreground">Sequences longues</p>
                <p className="mt-2 text-3xl font-bold">{data.itemCount}</p>
              </div>
              <div className="rounded-lg border bg-background p-4">
                <p className="text-sm text-muted-foreground">Principe</p>
                <p className="mt-2 text-2xl font-bold">Exposition puis rappel</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-violet-500" />
                <h2 className="text-xl font-semibold">Comment ca marche</h2>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Un stimulus sera affiche pendant quelques secondes.</p>
                <p>Vous devez le memoriser sans repondre tout de suite.</p>
                <p>Plus tard dans le test, les reponses apparaitront et vous devrez choisir la bonne.</p>
              </div>
            </div>

            <Button className="w-full" size="lg" onClick={() => router.push(data.nextUrl)}>
              <Play className="mr-2 h-4 w-4" />
              Compris
            </Button>

            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Clock3 className="h-3.5 w-3.5" />
              <span>Le premier stimulus de memoire longue sera affiche immediatement.</span>
            </div>
          </CardContent>
        </div>
      </Card>
    </div>
  );
}
