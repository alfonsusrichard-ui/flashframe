import { find, TTL_MS } from "@/lib/storage";

export const dynamic = "force-dynamic";
export const metadata = { title: "Unduh foto | FlashFrame by Cineflamma", robots: { index: false } };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const f = await find(id);
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center gap-5 px-5 py-10 text-center">
      <p className="text-lg font-extrabold">FlashFrame <span className="block text-xs font-normal tracking-widest text-neutral-400">by Cineflamma</span></p>
      {f ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/api/photo/${id}`} alt="Hasil photobooth" className="max-h-[70vh] w-auto rounded shadow-2xl" />
          <a href={`/api/photo/${id}?dl=1`} className="rounded-full bg-violet-300 px-8 py-3 font-bold text-neutral-950">Download foto</a>
          <p className="text-sm text-neutral-400">Tersedia sampai {new Date(f.uploadedAt + TTL_MS).toLocaleString("id-ID")}, lalu dihapus otomatis.</p>
        </>
      ) : (
        <p className="mt-10 text-neutral-300">Foto ini sudah dihapus atau tautannya tidak valid. Foto otomatis dihapus 24 jam setelah dibuat.</p>
      )}
    </main>
  );
}
