import { getMyDuelSummaries } from "@/lib/duels";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const cookieStore = await cookies();
  const userId = Number(cookieStore.get("quizhub_user_id")?.value);

  if (!Number.isInteger(userId) || userId <= 0) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const duels = await getMyDuelSummaries(userId);

  return NextResponse.json({ duels });
}
