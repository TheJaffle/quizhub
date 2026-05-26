"use client";

import { Button } from "@/components/ui/button";
import { MailCheck } from "lucide-react";
import { useState } from "react";

export function BrevoTestMailButton() {
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setIsSending(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/brevo-test-email", {
        method: "POST",
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error ?? "Impossible d'envoyer le mail de test.");
      }

      setMessage("Mail de test envoye via Brevo.");
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Impossible d'envoyer le mail de test.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2 px-4 py-4 text-center">
      <Button type="button" variant="outline" size="sm" onClick={handleClick} disabled={isSending}>
        <MailCheck aria-hidden="true" />
        {isSending ? "Envoi en cours..." : "Test envoie mail"}
      </Button>
      {message ? <p className="text-xs font-medium text-emerald-700">{message}</p> : null}
      {error ? <p className="max-w-md text-xs font-medium text-red-600">{error}</p> : null}
    </div>
  );
}
