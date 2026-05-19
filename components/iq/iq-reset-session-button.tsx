"use client";

import { Button } from "@/components/ui/button";
import { Loader2, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function IqResetSessionButton() {
  const router = useRouter();
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReset = async () => {
    setIsResetting(true);
    setError(null);

    try {
      const response = await fetch("/api/iq/reset-session", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Impossible de reinitialiser les cookies locaux.");
      }

      router.refresh();
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : "Impossible de reinitialiser les cookies locaux.");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="mt-6 flex flex-col items-center gap-2">
      <Button type="button" variant="outline" onClick={handleReset} disabled={isResetting}>
        {isResetting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
        Reinitialiser les cookies de test
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
