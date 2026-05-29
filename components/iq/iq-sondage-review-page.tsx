"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Headphones, ImageIcon, Mail, Search, Volume2, XCircle } from "lucide-react";

type ReviewQuestion = {
  sectionKey: string;
  sectionTitle: string;
  questionKey: string;
  questionText: string | null;
  answerPromptText: string | null;
  stimulusText: string | null;
  format: string;
  imageUrl: string | null;
  answersImageUrl: string | null;
  promptAudioUrl: string | null;
  selectedOptionKey: string | null;
  selectedOptionText: string | null;
  correctOptionKey: string | null;
  correctOptionText: string | null;
  selectedPosition: number | null;
  correctPosition: number | null;
  isCorrect: boolean;
  responseTimeMs: number | null;
  options: Array<{
    key: string;
    text: string | null;
    position: number;
    audioUrl: string | null;
  }>;
};

type ReviewSection = {
  key: string;
  label: string;
  questions: ReviewQuestion[];
};

type ReviewPayload = {
  email: string;
  userPseudo: string | null;
  attemptToken: string;
  sections: ReviewSection[];
};

type IqSondageReviewPageProps = {
  initialEmail: string;
  review: ReviewPayload | null;
  error?: "not-found" | "load-error";
  hideLookupForm?: boolean;
};

function formatOptionAnswer(optionKey: string | null, optionText: string | null) {
  const safeText = optionText?.trim() ?? "";
  const safeKey = optionKey?.trim() ?? "";

  if (safeKey && safeText && safeText !== safeKey) {
    return `${safeKey} - ${safeText}`;
  }

  return safeText || safeKey || null;
}

function formatAnswer(question: ReviewQuestion, kind: "selected" | "correct") {
  if (kind === "selected" && isQuestionUnanswered(question)) {
    return "Vous n'avez pas repondu";
  }

  if (kind === "selected" && isQuestionErroneousWithoutSelection(question)) {
    return "Reponse erronee";
  }

  const optionKey = kind === "selected" ? question.selectedOptionKey : question.correctOptionKey;
  const optionText = kind === "selected" ? question.selectedOptionText : question.correctOptionText;
  const optionAnswer = formatOptionAnswer(optionKey, optionText);

  if (optionAnswer) {
    return optionAnswer;
  }

  const position = kind === "selected" ? question.selectedPosition : question.correctPosition;
  if (position) {
    const optionLetter = String.fromCharCode(64 + position);
    return question.answersImageUrl ? optionLetter : `Zone ${position}`;
  }

  return "";
}

function isQuestionUnanswered(question: ReviewQuestion) {
  return question.responseTimeMs === 1000;
}

function isQuestionErroneousWithoutSelection(question: ReviewQuestion) {
  return question.responseTimeMs === 0 && !question.selectedOptionKey && !question.selectedOptionText && !question.selectedPosition;
}

function getQuestionLead(question: ReviewQuestion) {
  const parts = [question.stimulusText, question.questionText]
    .map((value) => value?.trim())
    .filter((value, index, array): value is string => Boolean(value) && array.indexOf(value) === index);
  return parts;
}

function getAnswerPrompt(question: ReviewQuestion) {
  const prompt = question.answerPromptText?.trim();
  if (!prompt) return null;
  if (prompt === question.questionText?.trim() || prompt === question.stimulusText?.trim()) return null;
  return prompt;
}

function getErrorText(error?: "not-found" | "load-error") {
  if (error === "load-error") {
    return "Impossible de charger ce sondage pour le moment.";
  }

  return "Aucun sondage complete n'a ete trouve pour cette adresse email.";
}

function getOptionLabel(option: ReviewQuestion["options"][number]) {
  const safeText = option.text?.trim() ?? "";
  return safeText && safeText !== option.key ? `${option.key} - ${safeText}` : safeText || option.key;
}

export function IqSondageReviewPage({ initialEmail, review, error, hideLookupForm = false }: IqSondageReviewPageProps) {
  const [sectionIndex, setSectionIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(-1);
  const [finished, setFinished] = useState(false);

  const totalQuestions = useMemo(() => review?.sections.reduce((total, section) => total + section.questions.length, 0) ?? 0, [review]);
  const answeredPrefixCount = useMemo(() => {
    if (!review) return 0;
    let total = 0;
    for (let index = 0; index < sectionIndex; index += 1) {
      total += review.sections[index]?.questions.length ?? 0;
    }
    return total;
  }, [review, sectionIndex]);

  const currentSection = review?.sections[sectionIndex] ?? null;
  const currentQuestion = currentSection && questionIndex >= 0 ? currentSection.questions[questionIndex] ?? null : null;
  const currentQuestionNumber = currentQuestion ? answeredPrefixCount + questionIndex + 1 : answeredPrefixCount;
  const shouldShowOptionList = Boolean(currentQuestion?.options.length) && !currentQuestion?.answersImageUrl;

  const handleAdvance = () => {
    if (!review || !currentSection) return;

    if (finished) {
      setSectionIndex(0);
      setQuestionIndex(-1);
      setFinished(false);
      return;
    }

    if (questionIndex < 0) {
      setQuestionIndex(0);
      return;
    }

    if (questionIndex < currentSection.questions.length - 1) {
      setQuestionIndex((current) => current + 1);
      return;
    }

    if (sectionIndex < review.sections.length - 1) {
      setSectionIndex((current) => current + 1);
      setQuestionIndex(-1);
      return;
    }

    setFinished(true);
  };

  const handleBack = () => {
    if (!review) return;

    if (finished) {
      const lastSectionIndex = review.sections.length - 1;
      const lastSection = review.sections[lastSectionIndex];
      setFinished(false);
      setSectionIndex(lastSectionIndex);
      setQuestionIndex(Math.max((lastSection?.questions.length ?? 1) - 1, 0));
      return;
    }

    if (questionIndex > 0) {
      setQuestionIndex((current) => current - 1);
      return;
    }

    if (questionIndex === 0) {
      setQuestionIndex(-1);
      return;
    }

    if (sectionIndex > 0) {
      const previousSectionIndex = sectionIndex - 1;
      const previousSection = review.sections[previousSectionIndex];
      setSectionIndex(previousSectionIndex);
      setQuestionIndex(Math.max((previousSection?.questions.length ?? 1) - 1, 0));
    }
  };

  const canGoBack = finished || sectionIndex > 0 || questionIndex >= 0;

  return (
    <div className="mx-auto max-w-5xl px-2 py-1 md:px-0 md:py-8">
      <div className="mb-2 space-y-2 md:mb-8 md:space-y-4">
        {!hideLookupForm ? (
          <div>
            <Badge className="mb-3 bg-indigo-500 text-white hover:bg-indigo-600">
              <Search className="mr-1 h-3.5 w-3.5" />
              Relecture sondage
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Revoir les reponses d&apos;un sondage</h1>
            <p className="mt-2 text-muted-foreground">Entrez l&apos;adresse mail d&apos;un participant pour afficher, categorie par categorie, les questions auxquelles il a repondu.</p>
          </div>
        ) : null}

        {!hideLookupForm ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <form action="/iq/sondage-review" method="get" className="flex flex-col gap-3 md:flex-row">
                <div className="relative flex-1">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input name="email" type="email" required defaultValue={initialEmail} placeholder="prenom.nom@email.com" className="pl-10" />
                </div>
                <Button type="submit">Charger le sondage</Button>
              </form>
            </CardContent>
          </Card>
        ) : null}
      </div>

      {!review ? (
        initialEmail ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle>Sondage introuvable</AlertTitle>
            <AlertDescription>{getErrorText(error)}</AlertDescription>
          </Alert>
        ) : null
      ) : finished ? (
        <Card className="border-0 shadow-xl">
          <CardContent className="space-y-4 p-8 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
            <h2 className="text-2xl font-bold">Relecture terminee</h2>
            <p className="text-muted-foreground">
              {review.userPseudo ? `${review.userPseudo} ` : ""}
              a maintenant toutes ses reponses relues.
            </p>
            <Button onClick={handleAdvance}>Recommencer depuis le debut</Button>
          </CardContent>
        </Card>
      ) : currentSection && questionIndex < 0 ? (
        <Card className="border-0 shadow-xl">
          <CardHeader className="pb-2 md:pb-3">
            <Badge className="w-fit bg-slate-900 text-white hover:bg-slate-900">Categorie {currentSection.label}</Badge>
            <CardTitle className="text-2xl font-black tracking-tight md:text-4xl">{currentSection.label}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4 md:space-y-6 md:p-8">
            <p className="text-sm text-muted-foreground md:text-base">
              {currentSection.questions.length} question{currentSection.questions.length > 1 ? "s" : ""} repondue{currentSection.questions.length > 1 ? "s" : ""} dans cette categorie.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button variant="outline" onClick={handleBack} disabled={!canGoBack}>
                <ChevronLeft className="h-4 w-4" />
                Retour
              </Button>
              <Button onClick={handleAdvance}>
                Commencer
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : currentQuestion ? (
        <div className="space-y-2 md:space-y-6">
          <Card className="relative overflow-hidden border-0 shadow-xl">
            <div className="absolute right-2 top-2 z-10 flex max-w-[62vw] flex-wrap justify-end gap-1">
              <Badge className="bg-indigo-500 px-2 py-0.5 text-[10px] text-white hover:bg-indigo-600">
                {currentSection?.label}
              </Badge>
              <Badge variant="outline" className="bg-white/95 px-2 py-0.5 text-[10px]">
                {currentQuestionNumber}/{totalQuestions}
              </Badge>
              <Badge variant="outline" className="bg-white/95 px-2 py-0.5 text-[10px]">
                {currentQuestion.questionKey}
              </Badge>
            </div>
            <CardContent className="grid gap-3 p-2 md:grid-cols-2 md:gap-6 md:p-6">
              <div className="space-y-2">
                <div className="min-h-[34px] space-y-1 pr-[172px] md:min-h-[42px] md:pr-[220px]">
                  {getQuestionLead(currentQuestion).map((line, index) => (
                    <h2 key={`${currentQuestion.questionKey}-${index}`} className="text-[15px] font-bold leading-tight md:text-3xl">
                      {line}
                    </h2>
                  ))}
                  {getAnswerPrompt(currentQuestion) ? (
                    <p className="text-[11px] font-medium leading-snug text-muted-foreground md:text-lg">{getAnswerPrompt(currentQuestion)}</p>
                  ) : null}
                </div>

                {currentQuestion.sectionKey === "audio_memory" && currentQuestion.promptAudioUrl ? (
                  <div className="rounded-xl border bg-slate-50 p-2 md:p-4">
                    <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-slate-700 md:text-sm">
                      <Headphones className="h-4 w-4" />
                      Piste sonore
                    </div>
                    <audio controls preload="none" className="w-full" src={currentQuestion.promptAudioUrl}>
                      Votre navigateur ne peut pas lire ce fichier audio.
                    </audio>
                  </div>
                ) : currentQuestion.answersImageUrl ? (
                  <div className="space-y-2">
                    {currentQuestion.imageUrl ? (
                      <div className="relative overflow-hidden rounded-xl border bg-muted/30">
                        <Image
                          src={currentQuestion.imageUrl}
                          alt="Enigme visuelle"
                          width={900}
                          height={600}
                          sizes="(max-width: 768px) 100vw, 50vw"
                          className="max-h-[27vh] w-full object-contain md:max-h-[38vh]"
                        />
                      </div>
                    ) : null}
                    <div className="relative overflow-hidden rounded-xl border bg-muted/30">
                        <Image
                          src={currentQuestion.answersImageUrl}
                          alt="Reponses visuelles"
                          width={900}
                          height={600}
                          sizes="(max-width: 768px) 100vw, 50vw"
                          className="max-h-[31vh] w-full object-contain md:max-h-[38vh]"
                        />
                      </div>
                    </div>
                ) : currentQuestion.imageUrl ? (
                  <div className="relative overflow-hidden rounded-xl border bg-muted/30">
                    <Image
                      src={currentQuestion.imageUrl}
                      alt="Question visuelle"
                      width={900}
                      height={600}
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="max-h-[31vh] w-full object-contain md:max-h-[42vh]"
                    />
                  </div>
                ) : (
                  <div className="hidden min-h-[120px] items-center justify-center rounded-xl border bg-muted/20 p-4 text-center text-muted-foreground md:flex md:min-h-[220px] md:p-6">
                    <div>
                      <ImageIcon className="mx-auto mb-3 h-8 w-8" />
                      <p className="text-sm">Question textuelle</p>
                    </div>
                  </div>
                )}

                {shouldShowOptionList ? (
                  <div className="space-y-1.5">
                    <div className="space-y-1.5">
                      {currentQuestion.options.map((option) => {
                        const isSelected = currentQuestion.selectedOptionKey === option.key;
                        const isCorrect = currentQuestion.correctOptionKey === option.key;

                        return (
                          <div
                            key={`${currentQuestion.questionKey}-${option.key}`}
                            className={`rounded-xl border px-3 py-2 text-sm md:px-4 md:py-3 md:text-base ${
                              isCorrect
                                ? "border-green-300 bg-green-50 text-green-900"
                                : isSelected
                                  ? "border-red-300 bg-red-50 text-red-800"
                                  : "bg-background text-slate-800"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span>{getOptionLabel(option)}</span>
                              {currentQuestion.sectionKey === "audio_memory" && option.audioUrl ? (
                                <audio controls preload="none" className="h-8 max-w-[150px]" src={option.audioUrl}>
                                  Votre navigateur ne peut pas lire ce fichier audio.
                                </audio>
                              ) : currentQuestion.sectionKey === "audio_memory" ? (
                                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                  <Volume2 className="h-3.5 w-3.5" />
                                  Audio indisponible
                                </span>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  {currentQuestion.isCorrect ? (
                    <div className="rounded-xl border border-green-200 bg-green-50 p-2 text-green-800 md:p-4">
                      <div className="mb-1 flex items-center gap-1.5 text-xs font-bold md:text-base">
                        <CheckCircle2 className="h-3.5 w-3.5 md:h-5 md:w-5" />
                        Bonne reponse !!!
                      </div>
                      <p className="text-xs md:text-base">
                        Votre reponse : <span className="font-semibold">{formatAnswer(currentQuestion, "selected")}</span>
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-2 text-red-700 md:p-4">
                      <div className="mb-1 flex items-center gap-1.5 text-xs font-bold md:text-base">
                        <XCircle className="h-3.5 w-3.5 md:h-5 md:w-5" />
                        {isQuestionUnanswered(currentQuestion)
                          ? "Vous n'avez pas repondu"
                          : isQuestionErroneousWithoutSelection(currentQuestion)
                            ? "Reponse erronee"
                            : "Reponse incorrecte"}
                      </div>
                      {!isQuestionUnanswered(currentQuestion) && !isQuestionErroneousWithoutSelection(currentQuestion) ? (
                        <p className="text-xs md:text-base">
                          Votre reponse : <span className="font-semibold">{formatAnswer(currentQuestion, "selected")}</span> :(
                        </p>
                      ) : null}
                    </div>
                  )}

                  <div className="rounded-xl border bg-slate-50 p-2 md:p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 md:text-sm">Il fallait repondre</p>
                    <p className="mt-1 text-xs font-semibold text-slate-950 md:mt-2 md:text-lg">{formatAnswer(currentQuestion, "correct")}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={handleBack} disabled={!canGoBack}>
                    <ChevronLeft className="h-4 w-4" />
                    Retour
                  </Button>
                  <Button onClick={handleAdvance}>
                    OK
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
