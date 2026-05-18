import { saveIqAttemptAnswer, type SaveIqAttemptAnswerPayload } from "@/lib/iq-tests";
import { NextResponse } from "next/server";

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid answer payload." }, { status: 400 });
  }

  const candidate = body as Partial<SaveIqAttemptAnswerPayload>;
  const selectedOptionId =
    candidate.selectedOptionId === null || candidate.selectedOptionId === undefined
      ? null
      : Number(candidate.selectedOptionId);
  const selectedPosition =
    candidate.selectedPosition === null || candidate.selectedPosition === undefined
      ? null
      : Number(candidate.selectedPosition);
  const payload: SaveIqAttemptAnswerPayload = {
    questionId: Number(candidate.questionId),
    selectedOptionId,
    selectedPosition,
    responseTimeMs:
      candidate.responseTimeMs === null || candidate.responseTimeMs === undefined
        ? null
        : Number(candidate.responseTimeMs),
    displayedAt: typeof candidate.displayedAt === "string" ? candidate.displayedAt : null,
  };

  if (!Number.isInteger(payload.questionId)) {
    return NextResponse.json({ error: "Invalid answer payload." }, { status: 400 });
  }

  const result = await saveIqAttemptAnswer(token, payload);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ answer: result.answer });
}
