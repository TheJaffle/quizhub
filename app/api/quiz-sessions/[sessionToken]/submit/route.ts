import { submitQuizSession, type QuizSessionAnswerInput } from "@/lib/quiz-sessions";
import { NextResponse } from "next/server";

export async function POST(request: Request, { params }: { params: Promise<{ sessionToken: string }> }) {
  try {
    const { sessionToken } = await params;
    const body = await request.json().catch(() => null);

    if (!body || !Array.isArray(body.answers)) {
      return NextResponse.json({ error: "Réponses invalides." }, { status: 400 });
    }

    const answers: QuizSessionAnswerInput[] = body.answers
      .filter((answer: unknown): answer is QuizSessionAnswerInput => {
        if (!answer || typeof answer !== "object") return false;

        const candidate = answer as Partial<QuizSessionAnswerInput>;
        return Number.isInteger(candidate.questionId) && Number.isInteger(candidate.answerId);
      })
      .map((answer: QuizSessionAnswerInput) => ({
        questionId: answer.questionId,
        answerId: answer.answerId,
      }));

    let durationSeconds: number | null = null;

    if (body.durationSeconds !== undefined && body.durationSeconds !== null) {
      if (typeof body.durationSeconds !== "number" || !Number.isFinite(body.durationSeconds) || body.durationSeconds < 0 || body.durationSeconds > 60 * 60 * 24) {
        return NextResponse.json({ error: "Durée de quiz invalide." }, { status: 400 });
      }

      durationSeconds = Math.round(body.durationSeconds);
    }

    const result = await submitQuizSession(sessionToken, answers, { durationSeconds });

    if (result.error || !result.score) {
      return NextResponse.json({ error: result.error ?? "Impossible d'enregistrer le résultat." }, { status: 400 });
    }

    return NextResponse.json({ score: result.score, resultToken: result.score.resultToken, url: `/quiz/results/${result.score.resultToken}` });
  } catch (error) {
    console.error("Quiz session submit error", error);
    return NextResponse.json({ error: "Impossible d'enregistrer les réponses pour le moment." }, { status: 500 });
  }
}
