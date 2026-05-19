"use client";

import type { IqLongMemoryAnswer } from "@/lib/iq-tests";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { QuizQuestion } from "@/components/quiz/quiz-question";
import { AlertTriangle, Brain, CheckCircle, ImageIcon, Loader2, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { useBlockTestBackNavigation } from "@/components/iq/use-block-test-back-navigation";

type IqLongMemoryAnswerPageProps = {
  data: IqLongMemoryAnswer | null;
  error?: string;
};

type SavedAnswer = {
  isCorrect: boolean;
  correctOptionId: number | null;
  correctPosition: number | null;
  pointsEarned: number;
};

const FEEDBACK_DELAY_MS = 1100;

export function IqLongMemoryAnswerPage({ data, error }: IqLongMemoryAnswerPageProps) {
  const router = useRouter();
  useBlockTestBackNavigation();
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
  const [savedAnswer, setSavedAnswer] = useState<SavedAnswer | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const displayedAtRef = useRef<Date>(new Date());

  const currentQuestion = data?.question ?? null;
  const isOverlayQuestion = currentQuestion?.format === "visual_overlay" || currentQuestion?.format === "spatial_overlay";

  const templateQuestion = currentQuestion && !isOverlayQuestion
    ? {
        id: String(currentQuestion.id),
        text: currentQuestion.answerPromptText || currentQuestion.questionText || "Selectionnez la bonne reponse pour cette question de memoire longue.",
        correctOptionId: savedAnswer?.correctOptionId ? String(savedAnswer.correctOptionId) : "",
        options: currentQuestion.options.map((option) => ({
          id: String(option.id),
          label: option.key,
          text: option.text || "Option",
        })),
      }
    : null;

  const correctOptionText = useMemo(() => {
    if (!currentQuestion || !savedAnswer?.correctOptionId) return null;

    const correctOption = currentQuestion.options.find((option) => option.id === savedAnswer.correctOptionId);
    return correctOption?.text || correctOption?.key || null;
  }, [currentQuestion, savedAnswer]);

  const finishFlow = async () => {
    if (!data) return;

    const response = await fetch(`/api/iq/attempts/${data.attempt.token}/long-memory/after-answer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ returnToUrl: data.returnToUrl }),
    });
    const payload = await response.json();
    router.push(payload.nextUrl || data.returnToUrl);
  };

  const saveAnswer = async (body: { questionId: number; selectedOptionId?: number | null; selectedPosition?: number | null }) => {
    if (!data || !currentQuestion || isSaving || savedAnswer) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      const response = await fetch(`/api/iq/attempts/${data.attempt.token}/answers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...body,
          responseTimeMs: Math.max(new Date().getTime() - displayedAtRef.current.getTime(), 0),
          displayedAt: displayedAtRef.current.toISOString(),
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Impossible d'enregistrer la reponse.");
      }

      setSavedAnswer(payload.answer);
      setTimeout(() => {
        void finishFlow();
      }, FEEDBACK_DELAY_MS);
    } catch (answerError) {
      setSelectedOptionId(null);
      setSelectedPosition(null);
      setSaveError(answerError instanceof Error ? answerError.message : "Impossible d'enregistrer la reponse.");
    } finally {
      setIsSaving(false);
    }
  };

  if (error || !data || !currentQuestion) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Reponse memoire longue indisponible</AlertTitle>
          <AlertDescription>{error || "Cette tentative de test de logique est introuvable."}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-4 md:py-8">
      <div className="mb-6 hidden md:block">
        <Badge className="mb-3 w-fit bg-violet-500 text-white hover:bg-violet-600">
          <Brain className="mr-1 h-3.5 w-3.5" />
          Reponse memoire longue
        </Badge>
        <p className="text-lg font-medium text-foreground">Repondez maintenant a la question de memoire longue.</p>
      </div>

      <Card className="overflow-hidden">
        <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }} className="space-y-6 p-6">
          {templateQuestion ? (
            <QuizQuestion
              question={templateQuestion}
              selectedOptionId={selectedOptionId ? String(selectedOptionId) : null}
              onSelectOption={(_, optionId) => {
                const numericOptionId = Number(optionId);
                setSelectedOptionId(numericOptionId);
                void saveAnswer({ questionId: currentQuestion.id, selectedOptionId: numericOptionId });
              }}
              isReviewMode={Boolean(savedAnswer) || isSaving}
            />
          ) : null}

          {isOverlayQuestion && currentQuestion.overlay ? (
            <div className="space-y-6">
              <div className="rounded-lg border bg-violet-50 px-4 py-3">
                <p className="text-sm font-medium uppercase tracking-wide text-violet-700">Reponse memoire longue</p>
                <h2 className="mt-1 text-xl font-semibold leading-tight text-violet-950 md:text-2xl">
                  {currentQuestion.answerPromptText || currentQuestion.questionText || "Selectionnez la bonne reponse."}
                </h2>
              </div>
              <div className="relative overflow-hidden rounded-lg border bg-muted/30">
                <Image
                  src={currentQuestion.overlay.answersImageUrl}
                  alt="Reponses memoire longue"
                  width={900}
                  height={600}
                  sizes="(max-width: 768px) 100vw, 800px"
                  className="h-auto w-full object-contain"
                />
                <div
                  className="absolute inset-0 grid"
                  style={{
                    gridTemplateColumns: `repeat(${currentQuestion.overlay.gridColumns}, minmax(0, 1fr))`,
                    gridTemplateRows: `repeat(${currentQuestion.overlay.gridRows}, minmax(0, 1fr))`,
                  }}
                >
                  {Array.from({ length: currentQuestion.overlay.answerCount }, (_, index) => {
                    const position = index + 1;
                    const isSelected = selectedPosition === position;
                    const isCorrect = savedAnswer?.correctPosition === position;
                    const isWrong = Boolean(savedAnswer) && isSelected && !isCorrect;

                    return (
                      <button
                        key={position}
                        type="button"
                        aria-label={`Reponse ${position}`}
                        onClick={() => {
                          setSelectedPosition(position);
                          void saveAnswer({ questionId: currentQuestion.id, selectedPosition: position });
                        }}
                        disabled={Boolean(savedAnswer) || isSaving}
                        className={`border border-transparent bg-transparent transition-all hover:bg-violet-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
                          isSelected ? "bg-violet-500/15 ring-2 ring-violet-500" : ""
                        } ${isCorrect ? "bg-green-500/20 ring-2 ring-green-500" : ""} ${isWrong ? "bg-red-500/20 ring-2 ring-red-500" : ""}`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          ) : currentQuestion.imageUrl ? (
            <div className="flex min-h-[220px] items-center justify-center rounded-lg border bg-muted/40">
              <div className="text-center text-muted-foreground">
                <ImageIcon className="mx-auto mb-3 h-10 w-10" />
                <p className="text-sm">Question visuelle</p>
              </div>
            </div>
          ) : null}

          {savedAnswer ? (
            <div className={`rounded-lg p-6 text-center ${savedAnswer.isCorrect ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
              <div className={`mb-2 flex justify-center ${savedAnswer.isCorrect ? "text-green-500" : "text-red-500"}`}>
                {savedAnswer.isCorrect ? <CheckCircle className="h-14 w-14" /> : <XCircle className="h-14 w-14" />}
              </div>
              <h3 className="mb-1 text-xl font-bold">{savedAnswer.isCorrect ? "Correct !" : "Incorrect"}</h3>
              <p>
                {savedAnswer.isCorrect
                  ? "Reponse enregistree."
                  : isOverlayQuestion
                    ? `Bonne zone : ${savedAnswer.correctPosition ?? "indisponible"}`
                    : `Bonne reponse : ${correctOptionText ?? "indisponible"}`}
              </p>
            </div>
          ) : null}

          {saveError ? <p className="text-sm text-destructive">{saveError}</p> : null}
          {isSaving ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Enregistrement de la reponse...
            </div>
          ) : null}
        </motion.div>
      </Card>
    </div>
  );
}
