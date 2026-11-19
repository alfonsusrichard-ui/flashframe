import { NextResponse } from "next/server";
import { save, purge } from "@/lib/storage";

export const runtime = "nodejs";
const MAX = 15 * 1024 * 1024;

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "File tidak ditemukan." }, { status: 400 });
    if (file.size > MAX) return NextResponse.json({ error: "File terlalu besar (maks 15 MB)." }, { status: 413 });
    const buf = Buffer.from(await file.arrayBuffer());
    // Verify magic bytes instead of trusting the declared type
    const type = buf.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47])) ? "image/png"
      : buf[0] === 0xff && buf[1] === 0xd8 ? "image/jpeg" : "";
    if (!type) return NextResponse.json({ error: "Hanya PNG atau JPG." }, { status: 415 });
    const id = await save(buf, type);
    purge().catch(() => {}); // opportunistic cleanup
    const base = process.env.NEXT_PUBLIC_BASE_URL || new URL(req.url).origin;
    return NextResponse.json({ id, url: `${base}/d/${id}`, expiresInHours: 24 });
} catch (e) {
  console.error("upload error:", e);
  return NextResponse.json({ error: "Upload gagal." }, { status: 500 });
}
}
