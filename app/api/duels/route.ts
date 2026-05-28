import { createDuelChallenge, getDuelCategoryOptions } from "@/lib/duels";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const cookieStore = await cookies();
    const userId = Number(cookieStore.get("quizhub_user_id")?.value);
    const result = await createDuelChallenge({
      categorySlug: body?.category,
      difficulty: body?.difficulty,
      timePerQuestion: body?.timePerQuestion,
      ownerUserId: Number.isInteger(userId) && userId > 0 ? userId : null,
    });

    if (!result.challenge || result.error) {
      return NextResponse.json({ error: result.error ?? "Impossible de créer le duel." }, { status: 400 });
    }

    return NextResponse.json({ challenge: result.challenge });
  } catch (error) {
    console.error("Duel create error", error);
    return NextResponse.json({ error: "Impossible de créer le duel pour le moment." }, { status: 500 });
  }
}

export async function GET() {
  try {
    const categories = await getDuelCategoryOptions();

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Duel category options error", error);
    return NextResponse.json({ error: "Impossible de charger les catégories de duel." }, { status: 500 });
  }
}
