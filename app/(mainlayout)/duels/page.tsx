import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getUserById } from "@/lib/auth";
import { getMyDuelSummaries } from "@/lib/duels";
import { Calendar, Copy, Swords } from "lucide-react";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Mes duels | brainspark",
  description: "Consultez les résultats de vos défis privés.",
};

const difficultyLabels = {
  Easy: "Facile",
  Medium: "Moyen",
  Hard: "Difficile",
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function DuelsPage() {
  const cookieStore = await cookies();
  const userId = Number(cookieStore.get("quizhub_user_id")?.value);

  if (!Number.isInteger(userId) || userId <= 0) {
    redirect("/login");
  }

  const user = await getUserById(userId);

  if (!user) {
    redirect("/login");
  }

  const duels = await getMyDuelSummaries(user.id);

  return (
    <div className="container mx-auto max-w-5xl py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Badge className="mb-3 w-fit" variant="outline">
            Défis privés
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight">Mes duels</h1>
          <p className="mt-2 text-muted-foreground">Retrouvez les résultats des personnes qui ont joué à vos défis.</p>
        </div>
        <Button asChild>
          <Link href="/battle">
            <Swords className="mr-2 h-4 w-4" />
            Créer un duel
          </Link>
        </Button>
      </div>

      {duels.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Swords className="h-7 w-7" />
            </div>
            <h2 className="mb-2 text-xl font-semibold">Aucun duel pour le moment</h2>
            <p className="mb-5 text-muted-foreground">Créez un duel privé, partagez le lien, puis les scores apparaîtront ici.</p>
            <Button asChild>
              <Link href="/battle">Créer mon premier duel</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {duels.map((duel) => {
            const invitePath = `/battle?room=${encodeURIComponent(duel.roomCode)}&mode=1v1`;

            return (
              <Card key={duel.roomCode}>
                <CardHeader>
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Swords className="h-5 w-5 text-primary" />
                        Duel {duel.roomCode}
                      </CardTitle>
                      <CardDescription className="mt-2 flex flex-wrap items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(duel.createdAt)}
                        </span>
                        <span>{difficultyLabels[duel.difficulty]}</span>
                        <span>{duel.totalQuestions} questions</span>
                      </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={invitePath}>
                        <Copy className="mr-2 h-4 w-4" />
                        Ouvrir le lien
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {duel.participants.length === 0 ? (
                    <p className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">Aucun participant n’a encore terminé ce duel.</p>
                  ) : (
                    <div className="overflow-hidden rounded-lg border">
                      <div className="grid grid-cols-[48px_1fr_1fr_110px] bg-muted/60 px-4 py-3 text-sm font-medium">
                        <span>#</span>
                        <span>Email</span>
                        <span>Pseudo</span>
                        <span className="text-right">Note</span>
                      </div>
                      {duel.participants.map((participant, index) => (
                        <div key={participant.id} className="grid grid-cols-[48px_1fr_1fr_110px] items-center border-t px-4 py-3 text-sm">
                          <span className="font-medium">{index + 1}</span>
                          <span className="break-all">{participant.email}</span>
                          <span>{participant.pseudo || "-"}</span>
                          <span className="text-right font-semibold">
                            {participant.correctAnswers}/{participant.totalQuestions} ({participant.score}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
