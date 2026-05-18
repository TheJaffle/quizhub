"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookOpen, Loader2, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const [resultToken, setResultToken] = useState<string | null>(null);
  const [attemptToken, setAttemptToken] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [pseudo, setPseudo] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    setResultToken(params.get("result_token"));
    setAttemptToken(params.get("attempt_token"));
  }, []);

  const authQuery = new URLSearchParams();

  if (resultToken) {
    authQuery.set("result_token", resultToken);
  }

  if (attemptToken) {
    authQuery.set("attempt_token", attemptToken);
  }

  const authQueryString = authQuery.toString();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, pseudo, password, resultToken, attemptToken }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Impossible de créer le compte.");
      }

      router.push(payload.nextUrl ?? (attemptToken ? `/iq/results/${encodeURIComponent(attemptToken)}` : resultToken ? `/results/${encodeURIComponent(resultToken)}` : "/"));
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Impossible de créer le compte.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative mx-auto z-10 flex flex-col justify-center items-center text-white p-12 text-center">
          <div className="w-24 h-24 bg-white/20 rounded-3xl flex items-center justify-center mb-6 backdrop-blur-sm">
            <BookOpen className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Join QuizHub</h1>
          <p className="text-xl text-white/90 leading-relaxed">Créez un compte gratuit pour retrouver vos résultats.</p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <Card className="w-full max-w-md shadow-xl border-0">
          <CardHeader className="text-center pb-8">
            <div className="lg:hidden mx-auto mb-4 w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold">Créer un compte</CardTitle>
            <CardDescription>
              {attemptToken
                ? "Votre résultat QI sera rattaché après inscription."
                : resultToken
                  ? "Votre résultat invité sera rattaché après inscription."
                  : "Commencez votre parcours QuizHub."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="pseudo">Pseudo</Label>
                <Input id="pseudo" value={pseudo} onChange={(event) => setPseudo(event.target.value)} required className="h-12" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required className="h-12" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required className="h-12" />
              </div>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <Button className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UserPlus className="h-4 w-4 mr-2" />}
                Créer un compte
              </Button>
            </form>
            <div className="text-center text-sm mt-6">
              Déjà un compte ?{" "}
              <Link href={`/login${authQueryString ? `?${authQueryString}` : ""}`} className="text-indigo-600 font-medium">
                Se connecter
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
