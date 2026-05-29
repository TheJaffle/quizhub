"use client";

import { clearIqDraftSubmission } from "@/components/iq/iq-draft-storage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function ResultAccessPage() {
  const params = useParams<{ emailToken: string }>();
  const [error, setError] = useState<string | null>(null);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    async function openResult() {
      try {
        const response = await fetch(`/api/result-access/${encodeURIComponent(params.emailToken)}`, {
          method: "POST",
          cache: "no-store",
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || "Impossible d'ouvrir le resultat.");
        }

        if (payload.resultType === "iq" && typeof payload.resultToken === "string") {
          clearIqDraftSubmission(payload.resultToken);
        }

        window.location.replace(payload.redirectUrl);
      } catch (accessError) {
        if (isMounted) {
          setError(accessError instanceof Error ? accessError.message : "Impossible d'ouvrir le resultat.");
        }
      }
    }

    if (params.emailToken && !hasStartedRef.current) {
      hasStartedRef.current = true;
      void openResult();
    }

    return () => {
      isMounted = false;
    };
  }, [params.emailToken]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <CardTitle>Ouverture du resultat</CardTitle>
          <CardDescription>Nous validons votre lien et preparons votre compte automatiquement.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <>
              <p className="text-sm text-destructive">{error}</p>
              <Button asChild className="w-full">
                <Link href="/">Retour a l'accueil</Link>
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span>Connexion automatique en cours...</span>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
