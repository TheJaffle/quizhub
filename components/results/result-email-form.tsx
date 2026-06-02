"use client";

import { clearAllIqDraftSubmissions, clearIqDraftSubmission, loadIqDraftSubmission } from "@/components/iq/iq-draft-storage";
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
  const [emailConfirmation, setEmailConfirmation] = useState("");
  const [website, setWebsite] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [hasSentEmail, setHasSentEmail] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [devAccessUrl, setDevAccessUrl] = useState<string | null>(null);
  const formStartedAtRef = useRef(Date.now());

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (hasSentEmail) {
      return;
    }

    setMessage(null);
    setError(null);
    setDevAccessUrl(null);

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedEmailConfirmation = emailConfirmation.trim().toLowerCase();

    if (normalizedEmail !== normalizedEmailConfirmation) {
      setError("Les deux adresses email ne correspondent pas. Verifiez votre saisie avant de continuer.");
      return;
    }

    setIsSending(true);

    try {
      const response = await fetch("/api/result-email-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resultType,
          resultToken,
          email: normalizedEmail,
          website,
          iqDraft: resultType === "iq" ? loadIqDraftSubmission(resultToken) : null,
          formStartedAt: formStartedAtRef.current,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Impossible d'envoyer le lien.");
      }

      setHasSentEmail(true);
      setMessage("Email envoye. Verifiez votre boite mail et, par securite, regardez aussi dans vos spams.");
      setDevAccessUrl(typeof payload.devAccessUrl === "string" ? payload.devAccessUrl : null);
      if (resultType === "iq") {
        clearIqDraftSubmission(resultToken);
        clearAllIqDraftSubmissions();
      }
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
        <h2 className="text-2xl font-bold">Recevoir mon resultat</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {hasSentEmail
            ? "Votre lien de resultat a ete envoye a l'adresse confirmee."
            : "Entrez votre email. Nous envoyons un lien securise pour afficher votre resultat."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="hidden" aria-hidden="true">
          <Label htmlFor="website">Site web</Label>
          <Input id="website" value={website} onChange={(event) => setWebsite(event.target.value)} tabIndex={-1} autoComplete="off" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="result-email">Email</Label>
          <Input id="result-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="vous@example.com" autoComplete="email" disabled={hasSentEmail} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="result-email-confirmation">Confirmer l&apos;email</Label>
          <Input
            id="result-email-confirmation"
            type="email"
            value={emailConfirmation}
            onChange={(event) => setEmailConfirmation(event.target.value)}
            onPaste={(event) => event.preventDefault()}
            onCopy={(event) => event.preventDefault()}
            onCut={(event) => event.preventDefault()}
            placeholder="Retapez votre email"
            autoComplete="off"
            disabled={hasSentEmail}
            required
          />
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
        {devAccessUrl ? (
          <p className="break-all rounded-lg bg-muted p-3 text-xs text-muted-foreground">
            Mode local : <a href={devAccessUrl}>{devAccessUrl}</a>
          </p>
        ) : null}

        <Button type="submit" className="h-auto min-h-11 w-full whitespace-normal px-3 py-3 text-center leading-tight" disabled={isSending || hasSentEmail}>
          <Send className="h-4 w-4 shrink-0" />
          <span>{isSending ? "Envoi..." : hasSentEmail ? "Email envoye" : "M'envoyer mon resultat"}</span>
        </Button>
      </form>
    </Card>
  );
}
