import { find } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const f = await find(id);
  if (!f) return new Response("Foto tidak ditemukan atau sudah kedaluwarsa.", { status: 410 });
  const dl = new URL(req.url).searchParams.has("dl");
  return new Response(new Uint8Array(f.data), {
    headers: {
      "Content-Type": f.type,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
      ...(dl ? { "Content-Disposition": `attachment; filename="flashframe-${id}.${f.ext}"` } : {}),
    },
  });
}
