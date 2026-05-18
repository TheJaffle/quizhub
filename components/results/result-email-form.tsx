"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Send } from "lucide-react";
import { FormEvent, useRef, useState } from "react";

type ResultEmailFormProps = {
  resultType: "quiz" | "iq";
  resultToken: string;
};

export function ResultEmailForm({ resultType, resultToken }: ResultEmailFormProps) {
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [devAccessUrl, setDevAccessUrl] = useState<string | null>(null);
  const formStartedAtRef = useRef(Date.now());

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSending(true);
    setMessage(null);
    setError(null);
    setDevAccessUrl(null);

    try {
      const response = await fetch("/api/result-email-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resultType,
          resultToken,
          email,
          website,
          formStartedAt: formStartedAtRef.current,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Impossible d'envoyer le lien.");
      }

      setMessage("Lien envoyé. Vérifiez votre boite mail pour consulter le résultat.");
      setDevAccessUrl(typeof payload.devAccessUrl === "string" ? payload.devAccessUrl : null);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Impossible d'envoyer le lien.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card className="mx-auto max-w-xl p-6 text-left">
      <div className="mb-5 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
          <Mail className="h-7 w-7" />
        </div>
        <h2 className="text-2xl font-bold">Recevoir mon résultat</h2>
        <p className="mt-2 text-sm text-muted-foreground">Entrez votre email. Nous envoyons un lien sécurisé pour afficher votre résultat.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="hidden" aria-hidden="true">
          <Label htmlFor="website">Site web</Label>
          <Input id="website" value={website} onChange={(event) => setWebsite(event.target.value)} tabIndex={-1} autoComplete="off" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="result-email">Email</Label>
          <Input id="result-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="vous@example.com" required />
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
        {devAccessUrl ? (
          <p className="break-all rounded-lg bg-muted p-3 text-xs text-muted-foreground">
            Mode local : <a href={devAccessUrl}>{devAccessUrl}</a>
          </p>
        ) : null}

        <Button type="submit" className="h-auto min-h-11 w-full whitespace-normal px-3 py-3 text-center leading-tight" disabled={isSending}>
          <Send className="h-4 w-4 shrink-0" />
          <span>{isSending ? "Envoi..." : "M'envoyer mon résultat"}</span>
        </Button>
      </form>
    </Card>
  );
}
