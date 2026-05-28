"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Copy, Link2, ListChecks, Trophy, X } from "lucide-react";
import { useState } from "react";
import { BattleState } from "./battle-page";

interface BattleLobbyProps {
  battleState: BattleState;
  onStartBattle: (participant: { email: string; pseudo: string }) => void;
  onCancel: () => void;
}

export function BattleLobby({ battleState, onStartBattle, onCancel }: BattleLobbyProps) {
  const [copied, setCopied] = useState(false);
  const currentUser = battleState.currentUser;
  const [email, setEmail] = useState(currentUser?.email ?? battleState.participantEmail);
  const [pseudo, setPseudo] = useState(currentUser?.pseudo ?? battleState.participantPseudo);
  const emailToUse = currentUser?.email ?? email.trim();
  const pseudoToUse = currentUser?.pseudo ?? pseudo.trim();
  const canStart = currentUser ? true : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailToUse);

  const copyRoomLink = () => {
    const valueToCopy = battleState.roomLink || battleState.roomCode;

    if (valueToCopy) {
      navigator.clipboard.writeText(valueToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-bold">Défi privé</h1>
        <p className="text-muted-foreground">Partagez le lien. Chaque personne peut faire le quiz quand elle veut.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Lien du défi</CardTitle>
              <CardDescription>Les questions sont déjà figées pour ce lien : tout le monde aura exactement le même quiz.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <Link2 className="h-4 w-4" />
                  Lien à envoyer
                </div>
                <p className="break-all text-sm text-muted-foreground">{battleState.roomLink}</p>
              </div>

              {currentUser ? (
                <div className="rounded-lg border bg-muted/30 p-4">
                  <div className="text-sm text-muted-foreground">Vous participez avec votre compte connecté</div>
                  <div className="mt-1 font-medium">{currentUser.pseudo}</div>
                  <div className="text-sm text-muted-foreground">{currentUser.email}</div>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="duel-email">Email</Label>
                    <Input id="duel-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="vous@example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duel-pseudo">Pseudo</Label>
                    <Input id="duel-pseudo" value={pseudo} onChange={(event) => setPseudo(event.target.value)} placeholder="Votre pseudo" />
                  </div>
                </div>
              )}

              <p className="text-sm text-muted-foreground">
                {currentUser
                  ? "Votre résultat sera rattaché à votre compte et affiché dans le classement de ce défi."
                  : "Votre email doit avoir un format valide et votre pseudo sera affiché dans le classement de ce défi."}
              </p>
            </CardContent>
            <CardFooter className="flex flex-wrap justify-between gap-3">
              <Button variant="outline" onClick={onCancel}>
                <X className="mr-2 h-4 w-4" />
                Retour
              </Button>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={copyRoomLink}>
                  {copied ? <CheckCircle2 className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                  {copied ? "Lien copié" : "Copier le lien"}
                </Button>
                <Button onClick={() => onStartBattle({ email: emailToUse, pseudo: pseudoToUse })} disabled={!canStart}>
                  Commencer le quiz
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Paramètres</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Catégorie</div>
                <div className="font-medium">{battleState.categoryName || "Aléatoire"}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Difficulté</div>
                <div className="font-medium">{battleState.difficulty === "easy" ? "Facile" : battleState.difficulty === "hard" ? "Difficile" : "Moyen"}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Questions</div>
                <div className="font-medium">{battleState.totalQuestions} questions</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Temps par question</div>
                <div className="font-medium">{battleState.timePerQuestion} secondes</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Classement
              </CardTitle>
            </CardHeader>
            <CardContent>
              {battleState.participants.length > 0 ? (
                <div className="space-y-2">
                  {battleState.participants.slice(0, 5).map((participant, index) => (
                    <div key={participant.id} className="flex items-center justify-between rounded-lg border p-2 text-sm">
                      <span className="truncate">
                        {index + 1}. {participant.pseudo || participant.email}
                      </span>
                      <span className="font-semibold">{participant.score}%</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ListChecks className="h-4 w-4" />
                  Aucun résultat pour le moment.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
