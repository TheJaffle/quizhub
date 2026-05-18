import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getQuizResultByToken, getUserById, getUserQuizResultByToken } from "@/lib/auth";
import { canAccessResultWithEmailToken } from "@/lib/result-email-links";
import { AlertTriangle, Calendar, CheckCircle2, Trophy } from "lucide-react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

type ResultPageProps = {
  params: Promise<{
    token: string;
  }>;
  searchParams?: Promise<{
    email_token?: string;
  }>;
};

function formatResultDate(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(date);
}

export default async function ResultPage({ params, searchParams }: ResultPageProps) {
  const { token } = await params;
  const resolvedSearchParams = await searchParams;
  const emailToken = resolvedSearchParams?.email_token ?? null;
  const hasEmailAccess = await canAccessResultWithEmailToken({
    resultType: "quiz",
    resultToken: token,
    emailToken,
  });
  const cookieStore = await cookies();
  const userId = Number(cookieStore.get("quizhub_user_id")?.value);

  if (!userId && !hasEmailAccess) {
    redirect(`/login?result_token=${encodeURIComponent(token)}`);
  }

  const user = userId ? await getUserById(userId) : null;

  if (!user && !hasEmailAccess) {
    redirect(`/login?result_token=${encodeURIComponent(token)}`);
  }

  const result = hasEmailAccess ? await getQuizResultByToken(token) : user ? await getUserQuizResultByToken(token, user.id) : null;

  if (!result) {
    return (
      <div className="mx-auto max-w-3xl py-10">
        <Alert variant="destructive">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Résultat introuvable</AlertTitle>
          <AlertDescription>Ce résultat est invalide ou n’appartient pas au compte connecté.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl py-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Badge variant="success" className="mb-3">
            Résultat sécurisé
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight">Votre résultat</h1>
          <p className="text-muted-foreground">{user ? `Connecté en tant que ${user.pseudo}` : "Lien sécurisé reçu par email"}</p>
        </div>
      </div>

      <Card className="border-0 shadow-xl">
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
              <Trophy className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-2xl">{result.quizTitle}</CardTitle>
              <CardDescription>Voici le score rattaché à votre compte.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border bg-background p-4">
              <p className="text-sm text-muted-foreground">Score</p>
              <p className="mt-2 text-3xl font-bold">
                {result.score}
                <span className="text-base font-medium text-muted-foreground"> / {result.totalQuestions}</span>
              </p>
            </div>
            <div className="rounded-lg border bg-background p-4">
              <p className="text-sm text-muted-foreground">Pourcentage</p>
              <p className="mt-2 text-3xl font-bold">{result.percentage}%</p>
            </div>
            <div className="rounded-lg border bg-background p-4">
              <p className="text-sm text-muted-foreground">Questions</p>
              <p className="mt-2 text-3xl font-bold">{result.totalQuestions}</p>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-2 rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Résultat créé le {formatResultDate(result.createdAt)}</span>
          </div>

          <div className="mt-6 flex items-center gap-2 text-sm text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            <span>{user ? "Ce résultat appartient bien à votre compte." : "Ce résultat a été ouvert avec un lien email valide."}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
