import type { Metadata } from "next";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getIqAuditSections } from "@/lib/iq-audit";

export const metadata: Metadata = {
  title: "Audit IQ | brainspark",
  description: "Vue desktop d'audit des questions IQ et des reponses connues par la base.",
};

function formatOptionLabel(key: string, text: string | null) {
  const safeText = text?.trim() ?? "";
  return safeText && safeText !== key ? `${key} - ${safeText}` : key;
}

function formatOptionSummary(key: string, text: string | null, position: number) {
  return `${formatOptionLabel(key, text)} [pos ${position}]`;
}

function formatCorrectAnswer(question: Awaited<ReturnType<typeof getIqAuditSections>>[number]["questions"][number]) {
  if (question.overlayCorrectPosition !== null) {
    const overlayLetter = String.fromCharCode(64 + question.overlayCorrectPosition);
    return `${overlayLetter} (position ${question.overlayCorrectPosition})`;
  }

  if (question.correctOptionKeys.length > 0) {
    return question.correctOptionKeys.join(", ");
  }

  return "Aucune";
}

export default async function IqAuditPage() {
  const sections = await getIqAuditSections();

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-8">
      <div className="mx-auto max-w-[1800px] space-y-8">
        <div className="rounded-3xl border bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-black tracking-tight text-slate-950">Audit de la base IQ</h1>
          <p className="mt-3 max-w-4xl text-sm text-slate-600">
            Cette vue affiche, par categorie, la question, les reponses disponibles, le nombre de reponses que la base croit connaitre et la bonne reponse selon la base.
          </p>
        </div>

        {sections.map((section) => (
          <section key={section.key} className="space-y-4">
            <div className="flex items-center gap-3">
              <Badge className="bg-slate-900 text-white hover:bg-slate-900">{section.key}</Badge>
              <h2 className="text-2xl font-bold text-slate-950">{section.title}</h2>
              <span className="text-sm text-slate-500">{section.questions.length} questions</span>
            </div>

            <div className="space-y-4">
              {section.questions.map((question) => {
                const mainImageUrl = question.answersImageUrl ? (question.overlayQuestionImageUrl ?? question.questionImageUrl) : question.questionImageUrl;
                const hasGraphicAnswers = Boolean(question.answersImageUrl);
                const displayedAnswerCount = question.overlayAnswerCount ?? question.optionCount;

                return (
                  <Card key={question.id} className="overflow-hidden border-slate-200 shadow-sm">
                    <CardHeader className="border-b bg-white">
                      <div className="flex items-start justify-between gap-6">
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline">{question.questionKey}</Badge>
                            <Badge variant="outline">{question.questionFormat}</Badge>
                            <Badge variant="outline">options: {question.optionCount}</Badge>
                            <Badge variant="outline">answer_count: {displayedAnswerCount}</Badge>
                            <Badge variant="outline">bonne reponse: {formatCorrectAnswer(question)}</Badge>
                          </div>
                          <CardTitle className="text-xl font-bold text-slate-950">
                            {question.questionText?.trim() || question.answerPromptText?.trim() || "Question visuelle / audio"}
                          </CardTitle>
                          {question.answerPromptText && question.answerPromptText !== question.questionText ? (
                            <p className="text-sm text-slate-500">{question.answerPromptText}</p>
                          ) : null}
                        </div>
                        <div className="text-right text-xs text-slate-500">ID base #{question.id}</div>
                      </div>
                    </CardHeader>

                    <CardContent className={`${hasGraphicAnswers ? "space-y-4" : "grid grid-cols-[minmax(340px,540px)_1fr] gap-6"} p-6`}>
                      {hasGraphicAnswers ? (
                        <>
                          <div className="rounded-2xl border bg-slate-50 p-4">
                            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Question</h3>
                            {mainImageUrl ? (
                              <div className="overflow-hidden rounded-xl border bg-white">
                                <Image
                                  src={mainImageUrl}
                                  alt={question.questionKey}
                                  width={900}
                                  height={700}
                                  className="h-[300px] w-auto max-w-full object-contain"
                                />
                              </div>
                            ) : (
                              <div className="rounded-xl border bg-white p-4 text-sm text-slate-700">
                                {question.questionText || question.answerPromptText || "Aucun visuel"}
                              </div>
                            )}
                          </div>

                          <div className="rounded-2xl border bg-slate-50 p-4">
                            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Reponses graphiques</h3>
                            <div className="grid grid-cols-[minmax(0,720px)_minmax(320px,1fr)] gap-4">
                              <div className="overflow-hidden rounded-xl border bg-white">
                                <Image
                                  src={question.answersImageUrl!}
                                  alt={`${question.questionKey} answers`}
                                  width={900}
                                  height={700}
                                  className="h-[220px] w-auto max-w-full object-contain"
                                />
                              </div>

                              <div className="rounded-xl border bg-white p-3">
                                <div className="space-y-3 text-sm text-slate-700">
                                  <div className="rounded-lg border bg-slate-50 p-3">
                                    <span className="font-semibold text-slate-950">Reponses possibles en base :</span>{" "}
                                    {question.options.length > 0
                                      ? question.options.map((option) => formatOptionSummary(option.key, option.text, option.position)).join(" | ")
                                      : "Aucune"}
                                  </div>
                                  <div className="grid grid-cols-3 gap-2">
                                    <div className="rounded-lg border bg-slate-50 p-3">
                                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Nombre d'options</p>
                                      <p className="mt-1 text-xl font-bold text-slate-950">{question.optionCount}</p>
                                    </div>
                                    <div className="rounded-lg border bg-slate-50 p-3">
                                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">answer_count</p>
                                      <p className="mt-1 text-xl font-bold text-slate-950">{displayedAnswerCount}</p>
                                    </div>
                                    <div className="rounded-lg border bg-slate-50 p-3">
                                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Bonne reponse</p>
                                      <p className="mt-1 text-base font-bold text-slate-950">{formatCorrectAnswer(question)}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                        </>
                      ) : (
                        <>
                          <div className="space-y-4">
                            <div className="rounded-2xl border bg-slate-50 p-4">
                              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Question</h3>
                              {mainImageUrl ? (
                                <div className="overflow-hidden rounded-xl border bg-white">
                                  <Image
                                    src={mainImageUrl}
                                    alt={question.questionKey}
                                    width={900}
                                    height={700}
                                    className="h-[300px] w-auto max-w-full object-contain"
                                  />
                                </div>
                              ) : (
                                <div className="rounded-xl border bg-white p-4 text-sm text-slate-700">
                                  {question.questionText || question.answerPromptText || "Aucun visuel"}
                                </div>
                              )}

                              {question.promptAudioUrl ? (
                                <div className="mt-4 rounded-xl border bg-white p-3">
                                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Audio stimulus</p>
                                  <audio controls preload="none" className="w-full" src={question.promptAudioUrl}>
                                    Votre navigateur ne peut pas lire cet audio.
                                  </audio>
                                </div>
                              ) : null}
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="rounded-2xl border bg-slate-50 p-4">
                              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Reponses stockees en base</h3>
                              <div className="grid grid-cols-2 gap-3">
                                {question.options.map((option) => (
                                  <div
                                    key={`${question.id}-${option.key}`}
                                    className={`rounded-xl border p-3 ${
                                      option.isCorrect ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white"
                                    }`}
                                  >
                                    <div className="mb-2 flex items-center justify-between gap-3">
                                      <div className="font-semibold text-slate-900">{formatOptionLabel(option.key, option.text)}</div>
                                      <div className="text-xs text-slate-500">pos {option.position}</div>
                                    </div>

                                    {option.imageUrl ? (
                                      <div className="overflow-hidden rounded-lg border bg-slate-50">
                                        <Image
                                          src={option.imageUrl}
                                          alt={`${question.questionKey}-${option.key}`}
                                          width={320}
                                          height={220}
                                          className="h-[300px] w-auto max-w-full object-contain"
                                        />
                                      </div>
                                    ) : null}

                                    {question.sectionKey === "audio_memory" && option.imageUrl ? (
                                      <audio controls preload="none" className="mt-3 w-full" src={option.imageUrl}>
                                        Votre navigateur ne peut pas lire cet audio.
                                      </audio>
                                    ) : null}
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3 text-sm">
                              <div className="rounded-2xl border bg-white p-4">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Nombre d'options</p>
                                <p className="mt-2 text-2xl font-bold text-slate-950">{question.optionCount}</p>
                              </div>
                              <div className="rounded-2xl border bg-white p-4">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">answer_count</p>
                                <p className="mt-2 text-2xl font-bold text-slate-950">{displayedAnswerCount}</p>
                              </div>
                              <div className="rounded-2xl border bg-white p-4">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bonne reponse base</p>
                                <p className="mt-2 text-lg font-bold text-slate-950">{formatCorrectAnswer(question)}</p>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
