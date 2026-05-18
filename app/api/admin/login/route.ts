import { getAdminAuthCookie, isAdminLoginValid } from "@/lib/iq-admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const candidate = body as { username?: unknown; password?: unknown };
  const username = typeof candidate.username === "string" ? candidate.username : "";
  const password = typeof candidate.password === "string" ? candidate.password : "";

  if (!isAdminLoginValid(username, password)) {
    return NextResponse.json({ error: "Identifiants administrateur incorrects." }, { status: 401 });
  }

  const adminCookie = getAdminAuthCookie();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(adminCookie.name, adminCookie.value, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: adminCookie.maxAge,
    path: "/",
  });

  return response;
}
