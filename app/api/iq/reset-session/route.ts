import { NextResponse } from "next/server";

function clearCookie(response: NextResponse, name: string) {
  response.cookies.set(name, "", {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
}

export async function POST() {
  const response = NextResponse.json({ ok: true });

  clearCookie(response, "quizhub_user_id");
  clearCookie(response, "qifree_iq_completed_token");

  return response;
}
