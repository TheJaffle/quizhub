import type { IqResult } from "@/lib/iq-tests";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { IqResultCategoryChart } from "@/components/iq/iq-result-category-chart";
import { AlertTriangle, BarChart3, Brain, Calendar, Gauge, RotateCcw, Timer, User, WalletCards } from "lucide-react";
import Link from "next/link";

type IqResultPageProps = {
  result: IqResult | null;
  error?: "not-found" | "forbidden" | "load-error";
  userPseudo?: string;
};

const sectionScores = [
  { key: "verbal", label: "Verbal", color: "text-indigo-500" },
  { key: "logic", label: "Logique", color: "text-blue-500" },
  { key: "quantitative", label: "Quantitatif", color: "text-fuchsia-500" },
  { key: "audio_memory", label: "Sonore", color: "text-sky-500" },
  { key: "long_memory", label: "Memoire longue", color: "text-violet-500" },
  { key: "spatial", label: "Spatial", color: "text-cyan-500" },
  { key: "memory", label: "Memoire", color: "text-emerald-500" },
  { key: "speed", label: "Rapidite", color: "text-amber-500" },
] as const;

const SPEED_REFERENCE_MS = 15000;

function formatDate(date: Date | null) {
  if (!date) return "Non finalise";

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(date);
}

function formatDuration(milliseconds: number | null) {
  if (!milliseconds) return "Aucune donnee";

  if (milliseconds < 1000) return `${milliseconds} ms`;

  return `${(milliseconds / 1000).toFixed(1)} s`;
}

function clampScore(value: number) {
  if (!Number.isFinite(value)) return 0;

  return Math.max(0, Math.min(100, Math.round(value)));
}

function getErrorText(error?: IqResultPageProps["error"]) {
  if (error === "forbidden") {
    return "Cette tentative existe, mais elle n'appartient pas au compte connecte.";
  }

  if (error === "load-error") {
    return "Impossible de charger ce resultat pour le moment.";
  }

  return "Ce résultat de test de logique est invalide ou introuvable.";
}

export function IqResultPage({ result, error, userPseudo }: IqResultPageProps) {
  if (!result) {
    return (
      <div className="mx-auto max-w-3xl py-10">
        <Alert variant="destructive">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Résultat introuvable</AlertTitle>
          <AlertDescription>{getErrorText(error)}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const answeredProgress = result.totalQuestions > 0 ? Math.round((result.answeredQuestions / result.totalQuestions) * 100) : 0;
  const totalPossibleScore = result.sectionBreakdown.reduce((total, section) => total + section.maxScore, 0);
  const precisionProgress = totalPossibleScore > 0 ? clampScore((result.rawScore / totalPossibleScore) * 100) : 0;
  const speedProgress = result.averageResponseTimeMs ? clampScore((1 - result.averageResponseTimeMs / SPEED_REFERENCE_MS) * 100) : 0;
  const cognitiveScore = clampScore(precisionProgress * 0.8 + speedProgress * 0.2);

  return (
    <div className="mx-auto max-w-5xl py-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Badge className="mb-3 bg-indigo-500 text-white hover:bg-indigo-600">
            <Brain className="mr-1 h-3.5 w-3.5" />
            Score indicatif
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight">Votre résultat de logique</h1>
          {userPseudo ? <p className="text-muted-foreground">Connecte en tant que {userPseudo}</p> : null}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild variant="outline">
            <Link href="/dashboard/user">
              <WalletCards className="mr-2 h-4 w-4" />
              Retour au dashboard
            </Link>
          </Button>
          <Button asChild>
            <Link href="/iq">
              <RotateCcw className="mr-2 h-4 w-4" />
              Recommencer le test de logique
            </Link>
          </Button>
        </div>
      </div>

      <Card className="mb-6 overflow-hidden border-0 shadow-xl">
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
              <Gauge className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-2xl">{result.testTitle}</CardTitle>
              <CardDescription>Score indicatif basé sur les réponses enregistrées. Il ne s'agit pas d'une évaluation psychologique officielle.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-lg border bg-background p-4">
              <p className="text-sm text-muted-foreground">Score cognitif provisoire</p>
              <p className="mt-2 text-3xl font-bold">{cognitiveScore}%</p>
              <p className="mt-1 text-xs text-muted-foreground">Precision 80% + vitesse 20%</p>
            </div>
            <div className="rounded-lg border bg-background p-4">
              <p className="text-sm text-muted-foreground">Bonnes reponses</p>
              <p className="mt-2 text-3xl font-bold">{precisionProgress}%</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {result.rawScore} / {totalPossibleScore || result.totalQuestions}
              </p>
            </div>
            <div className="rounded-lg border bg-background p-4">
              <p className="text-sm text-muted-foreground">Score vitesse</p>
              <p className="mt-2 text-3xl font-bold">{speedProgress}%</p>
              <p className="mt-1 text-xs text-muted-foreground">Reference 15 s/question</p>
            </div>
            <div className="rounded-lg border bg-background p-4">
              <p className="text-sm text-muted-foreground">Temps moyen</p>
              <p className="mt-2 text-3xl font-bold">{formatDuration(result.averageResponseTimeMs)}</p>
            </div>
          </div>

          <div className="rounded-lg border bg-muted/40 p-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="font-medium">Questions repondues</p>
              <Badge variant="secondary">
                {result.answeredQuestions} / {result.totalQuestions}
              </Badge>
            </div>
            <Progress value={answeredProgress} className="h-2" />
          </div>

          <div className="rounded-lg border bg-muted/40 p-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="font-medium">Score cognitif provisoire</p>
              <Badge variant="outline">{cognitiveScore}%</Badge>
            </div>
            <Progress value={cognitiveScore} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <IqResultCategoryChart sections={result.sectionBreakdown} />

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-7">
        {sectionScores.map((section) => {
          const value = result.sectionBreakdown.find((item) => item.key === section.key);

          return (
            <Card key={section.key}>
              <CardContent className="p-4">
                <div className={`mb-3 flex items-center gap-2 ${section.color}`}>
                  <BarChart3 className="h-4 w-4" />
                  <p className="font-medium">{section.label}</p>
                </div>
                <p className="text-3xl font-bold">{value?.percentage ?? 0}%</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {value?.score ?? 0} / {value?.maxScore ?? 0} points
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-background p-4">
          <div className="mb-2 flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <p className="text-sm">Debut</p>
          </div>
          <p className="font-medium">{formatDate(result.startedAt)}</p>
        </div>
        <div className="rounded-lg border bg-background p-4">
          <div className="mb-2 flex items-center gap-2 text-muted-foreground">
            <Timer className="h-4 w-4" />
            <p className="text-sm">Fin</p>
          </div>
          <p className="font-medium">{formatDate(result.completedAt)}</p>
        </div>
        <div className="rounded-lg border bg-background p-4">
          <div className="mb-2 flex items-center gap-2 text-muted-foreground">
            <User className="h-4 w-4" />
            <p className="text-sm">Statut</p>
          </div>
          <Badge variant={result.status === "completed" ? "success" : "secondary"}>{result.status}</Badge>
        </div>
      </div>

      <Alert className="mt-6">
        <AlertTriangle className="h-5 w-5" />
        <AlertTitle>Resultat indicatif</AlertTitle>
        <AlertDescription>Ce resultat est indicatif et ne constitue pas un test psychometrique officiel.</AlertDescription>
      </Alert>
    </div>
  );
}
