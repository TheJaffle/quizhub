import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Cette ancienne route de score n'est plus utilisée. Lancez le quiz depuis un thème." },
    { status: 410 }
  );
}
