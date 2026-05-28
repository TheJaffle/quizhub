"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import confetti from "canvas-confetti";
import { CheckCircle, Clock, Home, RotateCw, Share2, Trophy } from "lucide-react";
import { useEffect } from "react";
import type { BattleState } from "./battle-page";

interface BattleResultsProps {
  battleState: BattleState;
  onRematch: () => void;
  onReturnHome: () => void;
}

export function BattleResults({ battleState, onRematch, onReturnHome }: BattleResultsProps) {
  const sortedParticipants = [...battleState.participants].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.durationSeconds === null && b.durationSeconds !== null) return 1;
    if (a.durationSeconds !== null && b.durationSeconds === null) return -1;
    return (a.durationSeconds ?? 0) - (b.durationSeconds ?? 0);
  });
  const currentEmail = battleState.participantEmail.trim().toLowerCase();
  const currentParticipant = sortedParticipants.find((participant) => participant.email.toLowerCase() === currentEmail);
  const currentRank = currentParticipant ? sortedParticipants.findIndex((participant) => participant.id === currentParticipant.id) + 1 : null;

  useEffect(() => {
    if ((currentParticipant?.score ?? 0) >= 70) {
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
    }
  }, [currentParticipant?.score]);

  const shareLink = () => {
    if (battleState.roomLink) {
      navigator.clipboard.writeText(battleState.roomLink);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-bold">Résultats du défi</h1>
        <p className="text-muted-foreground">Le classement reste disponible pour toutes les personnes qui ouvrent le lien.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Classement</CardTitle>
              <CardDescription>
                {sortedParticipants.length > 0 ? `${sortedParticipants.length} participation${sortedParticipants.length > 1 ? "s" : ""}` : "Aucun résultat enregistré"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {sortedParticipants.map((participant, index) => {
                  const isCurrent = participant.email.toLowerCase() === currentEmail;

                  return (
                    <div key={participant.id} className={`flex items-center rounded-lg border p-3 ${isCurrent ? "border-primary bg-primary/5" : ""}`}>
                      <div className="w-8 text-lg font-bold">{index + 1}</div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{participant.pseudo || participant.email}</div>
                        <div className="truncate text-sm text-muted-foreground">{participant.email}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{participant.score}%</div>
                        <div className="text-xs text-muted-foreground">
                          {participant.correctAnswers}/{participant.totalQuestions}
                          {participant.durationSeconds !== null ? ` • ${participant.durationSeconds}s` : ""}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
            <CardFooter className="flex flex-wrap justify-between gap-3">
              <Button variant="outline" onClick={onReturnHome}>
                <Home className="mr-2 h-4 w-4" />
                Retour
              </Button>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={shareLink}>
                  <Share2 className="mr-2 h-4 w-4" />
                  Copier le lien
                </Button>
                <Button onClick={onRematch}>
                  <RotateCw className="mr-2 h-4 w-4" />
                  Nouveau passage
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>

        <div className="space-y-6">
          {currentParticipant ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Votre résultat</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    <span>Score</span>
                  </div>
                  <span className="text-xl font-bold">{currentParticipant.score}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Bonnes réponses</span>
                  </div>
                  <span className="font-bold">
                    {currentParticipant.correctAnswers}/{currentParticipant.totalQuestions}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-500" />
                    <span>Temps</span>
                  </div>
                  <span className="font-bold">{currentParticipant.durationSeconds ?? "-"}s</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Classement</span>
                  <span className="font-bold">#{currentRank}</span>
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Défi privé</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>Le lien reste actif. Vos amis peuvent faire le même quiz plus tard, avec les mêmes questions.</p>
              <p className="break-all">{battleState.roomLink}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
