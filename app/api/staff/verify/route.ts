import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const real = process.env.STAFF_PIN || "";
  if (!real) return NextResponse.json({ error: "PIN petugas belum diatur di server." }, { status: 500 });
  const a = Buffer.from(String(body.pin ?? "")), b = Buffer.from(real);
  const ok = a.length === b.length && timingSafeEqual(a, b);
  if (!ok) {
    await new Promise((r) => setTimeout(r, 800)); // slow down guessing
    return NextResponse.json({ error: "PIN salah." }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}
