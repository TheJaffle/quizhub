import { getAdminAuthCookie, getIqAdminStats, isAdminSessionValid, updateIqQuestionWeight } from "@/lib/iq-admin";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

async function requireAdmin() {
  const cookieStore = await cookies();
  const adminCookie = getAdminAuthCookie();

  return isAdminSessionValid(cookieStore.get(adminCookie.name)?.value);
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const stats = await getIqAdminStats();

  return NextResponse.json({ stats });
}

export async function PATCH(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const candidate = body as { questionId?: unknown; weight?: unknown };
  const questionId = Number(candidate.questionId);
  const weight = Number(candidate.weight);
  const result = await updateIqQuestionWeight(questionId, weight);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const stats = await getIqAdminStats();

  return NextResponse.json({ ok: true, stats });
}
