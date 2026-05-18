"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Bell, Loader2, Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type NotificationSettingsProps = {
  user: {
    email: string;
    pseudo: string;
    fullName: string | null;
    bio: string | null;
    avatarUrl: string | null;
    birthDate: string | null;
    gender: string | null;
    newsletterOptIn: boolean;
    notificationsOptIn: boolean;
  };
};

export function NotificationSettings({ user }: NotificationSettingsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [newsletterOptIn, setNewsletterOptIn] = useState(user.newsletterOptIn);
  const [notificationsOptIn, setNotificationsOptIn] = useState(user.notificationsOptIn);

  const handleSave = async () => {
    setIsLoading(true);

    try {
      const currentProfileResponse = await fetch("/api/auth/me", { cache: "no-store" });
      const currentProfilePayload = await currentProfileResponse.json();
      const currentUser = currentProfilePayload.user ?? user;

      const response = await fetch("/api/auth/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: currentUser.email,
          pseudo: currentUser.pseudo,
          fullName: currentUser.fullName,
          bio: currentUser.bio,
          avatarUrl: currentUser.avatarUrl,
          birthDate: currentUser.birthDate,
          gender: currentUser.gender,
          newsletterOptIn,
          notificationsOptIn,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Impossible d'enregistrer vos préférences.");
      }

      toast.success("Préférences enregistrées.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible d'enregistrer vos préférences.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Préférences de contact</h3>
        <p className="text-sm text-muted-foreground">Choisissez simplement ce que vous acceptez de recevoir de QI-FREE.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notifications et newsletter</CardTitle>
          <CardDescription>Le site est gratuit : aucune option de paiement ou d'abonnement n'est activée ici.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <Mail className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Newsletter</p>
                <p className="text-sm text-muted-foreground">Recevoir les nouveautés, conseils et informations importantes.</p>
              </div>
            </div>
            <Switch checked={newsletterOptIn} onCheckedChange={setNewsletterOptIn} />
          </div>

          <Separator />

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <Bell className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Notifications</p>
                <p className="text-sm text-muted-foreground">Autoriser les notifications liées à vos résultats et à votre compte.</p>
              </div>
            </div>
            <Switch checked={notificationsOptIn} onCheckedChange={setNotificationsOptIn} />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSave} disabled={isLoading} className="w-full">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enregistrer mes préférences
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
