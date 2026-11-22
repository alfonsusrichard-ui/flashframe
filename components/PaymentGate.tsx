"use client";
import { useState } from "react";

const PRICE = process.env.NEXT_PUBLIC_PRICE || "";
const rupiah = (v: string) => (v ? "Rp " + Number(v).toLocaleString("id-ID") : "");
const btn = "rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 font-semibold transition hover:border-violet-300 disabled:cursor-not-allowed disabled:opacity-40";
const pri = "rounded-xl bg-violet-300 px-4 py-2.5 font-extrabold text-neutral-950 transition hover:brightness-110 disabled:opacity-40";

type Method = "qris" | "tunai";

export default function PaymentGate({ onPaid, onBack }: { onPaid: (m: Method) => void; onBack: () => void }) {
  const [method, setMethod] = useState<Method | null>(null);
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    if (!method || !pin) return;
    setBusy(true); setErr("");
    try {
      const r = await fetch("/api/staff/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pin }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "Verifikasi gagal.");
      onPaid(method);
    } catch (e) {
      setErr((e as Error).message); setPin("");
    } finally { setBusy(false); }
  };

  return (
    <section className="mx-auto max-w-md py-10 text-center">
      <h2 className="text-3xl font-extrabold tracking-tight">Pembayaran</h2>
      {PRICE && <p className="mt-2 text-5xl font-extrabold text-violet-300">{rupiah(PRICE)}</p>}
      <p className="mt-2 text-neutral-400">Pilih cara bayar, lalu minta petugas mengonfirmasi.</p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        {([["qris", "QRIS"], ["tunai", "Tunai"]] as [Method, string][]).map(([k, l]) => (
          <button key={k} onClick={() => { setMethod(k); setErr(""); }} className={`${btn} py-4 text-lg ${method === k ? "!border-transparent !bg-violet-300 !text-neutral-950" : ""}`}>{l}</button>
        ))}
      </div>

      {method === "qris" && (
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/qris.png" alt="QRIS" className="mx-auto w-full max-w-xs rounded-xl bg-white p-2" />
          <p className="mt-3 text-sm text-neutral-300">Scan dengan aplikasi bank atau e-wallet{PRICE ? ` dan bayar ${rupiah(PRICE)}` : ""}. Tunjukkan bukti pembayaran ke petugas.</p>
        </div>
      )}
      {method === "tunai" && (
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5 text-neutral-300">
          Serahkan pembayaran tunai{PRICE ? ` ${rupiah(PRICE)}` : ""} kepada petugas.
        </div>
      )}

      {method && (
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5 text-left">
          <label className="block text-sm text-neutral-400">Khusus petugas: masukkan PIN setelah pembayaran diterima
            <input type="password" inputMode="numeric" autoComplete="off" value={pin} onChange={(e) => setPin(e.target.value)} onKeyDown={(e) => e.key === "Enter" && confirm()} className="mt-2 w-full rounded-lg border border-white/15 bg-white/5 p-3 text-center text-xl tracking-widest text-white" />
          </label>
          {err && <p className="mt-2 text-sm text-red-300">{err}</p>}
          <button className={pri + " mt-4 w-full"} disabled={busy || !pin} onClick={confirm}>{busy ? "Memeriksa…" : "Konfirmasi pembayaran"}</button>
        </div>
      )}

      <button className={btn + " mt-6"} onClick={onBack}>Kembali</button>
    </section>
  );
}
