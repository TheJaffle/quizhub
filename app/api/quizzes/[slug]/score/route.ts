import { getQuizScoreUserById } from "@/lib/auth";
import { scoreQuizBySlug, type QuizScoreInput } from "@/lib/quizzes";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const body = await request.json().catch(() => null);
    console.log("QUIZ SCORE ROUTE DEBUG start", {
      slug,
      bodyPresent: Boolean(body),
      answersCountRaw: Array.isArray(body?.answers) ? body.answers.length : null,
      durationSecondsReceived: body?.durationSeconds ?? null,
    });

    if (!body || !Array.isArray(body.answers)) {
      return NextResponse.json({ error: "Invalid score payload." }, { status: 400 });
    }

    const answers: QuizScoreInput[] = body.answers
      .filter((answer: unknown): answer is QuizScoreInput => {
        if (!answer || typeof answer !== "object") return false;

        const candidate = answer as Partial<QuizScoreInput>;
        return Number.isInteger(candidate.questionId) && Number.isInteger(candidate.answerId);
      })
      .map((answer: QuizScoreInput) => ({
        questionId: answer.questionId,
        answerId: answer.answerId,
      }));
    console.log("QUIZ SCORE ROUTE DEBUG parsed answers", {
      slug,
      answersCountParsed: answers.length,
    });

    let durationSeconds: number | null = null;

    if (body.durationSeconds !== undefined && body.durationSeconds !== null) {
      if (typeof body.durationSeconds !== "number" || !Number.isFinite(body.durationSeconds) || body.durationSeconds < 0 || body.durationSeconds > 60 * 60 * 24) {
        return NextResponse.json({ error: "Invalid quiz duration." }, { status: 400 });
      }

      durationSeconds = Math.round(body.durationSeconds);
    }

    const cookieStore = await cookies();
    const userId = Number(cookieStore.get("quizhub_user_id")?.value);
    console.log("QUIZ SCORE ROUTE DEBUG cookie", {
      slug,
      userIdCookieReceived: Number.isInteger(userId) && userId > 0,
      userId: Number.isInteger(userId) && userId > 0 ? userId : null,
    });
    const user = Number.isInteger(userId) && userId > 0 ? await getQuizScoreUserById(userId) : null;
    console.log("QUIZ SCORE ROUTE DEBUG user lookup", {
      slug,
      userFound: Boolean(user),
      userId: user?.id ?? null,
    });
    const result = await scoreQuizBySlug(slug, answers, user, { durationSeconds });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    console.log("QUIZ SCORE ROUTE DEBUG success", {
      slug,
      totalQuestions: result.score?.totalQuestions ?? null,
      scoreCalculated: result.score?.correctAnswers ?? null,
      durationSecondsInserted: result.score?.durationSeconds ?? null,
      resultToken: result.score?.resultToken ?? null,
    });
    return NextResponse.json({ score: result.score });
  } catch (error) {
    console.error("QUIZ SCORE ROUTE DEBUG catch", {
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : "UnknownError",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json({ error: "Impossible de calculer le score pour le moment." }, { status: 500 });
  }
}
