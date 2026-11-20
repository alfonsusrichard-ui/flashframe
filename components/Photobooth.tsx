"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { render, defaults, TPL, Opts, TplKey } from "@/lib/render";

type View = "home" | "cap" | "edit" | "exp";
const PAPER: Record<string, [number, number]> = { "2x6": [2, 6], "4x6": [4, 6], A4: [8.27, 11.69] };
const SLIDERS: [keyof Opts, string, number, number][] = [["br", "Brightness", 60, 150], ["co", "Contrast", 60, 150], ["sa", "Saturation", 0, 200], ["wa", "Warmth", -100, 100], ["gap", "Jarak antar foto", 0, 60], ["bd", "Ukuran border", 0, 80]];
const btn = "rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 font-semibold transition hover:border-violet-300 disabled:cursor-not-allowed disabled:opacity-40";
const pri = "rounded-xl bg-violet-300 px-4 py-2.5 font-extrabold text-neutral-950 transition hover:brightness-110 disabled:opacity-40";
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const toBlob = (c: HTMLCanvasElement, type: string, q?: number) => new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("Gagal membuat gambar."))), type, q));

export default function Photobooth() {
  const [view, setView] = useState<View>("home");
  const [n, setN] = useState(4);
  const [photos, setPhotos] = useState<HTMLCanvasElement[]>([]);
  const [o, setO] = useState<Opts>(defaults("classic"));
  const [res, setRes] = useState(2);
  const [count, setCount] = useState(0);
  const [flash, setFlash] = useState(false);
  const [busy, setBusy] = useState(false);
  const [camErr, setCamErr] = useState("");
  const [camReady, setCamReady] = useState(false);
  const [cams, setCams] = useState<MediaDeviceInfo[]>([]);
  const [msg, setMsg] = useState("");
  const [qr, setQr] = useState<{ url: string; img: string } | null>(null);
  const [qrBusy, setQrBusy] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);
  const [paper, setPaper] = useState("4x6");
  const [land, setLand] = useState(false);
  const vid = useRef<HTMLVideoElement>(null), stream = useRef<MediaStream | null>(null), cv = useRef<HTMLCanvasElement>(null), pimg = useRef<HTMLImageElement>(null);
  const pageStyle = useRef<HTMLStyleElement | null>(null);

  const used = useCallback(() => (o.tpl === "custom" ? photos.slice(0, Math.min(o.use, photos.length)) : photos), [o.tpl, o.use, photos]);
  const final = (sc: number) => { const c = document.createElement("canvas"); render(c, sc, used(), o); return c; };
  const flash3 = (t: string) => { setMsg(t); setTimeout(() => setMsg(""), 3500); };

  const stopCam = () => { stream.current?.getTracks().forEach((t) => t.stop()); stream.current = null; setCamReady(false); };
  const openCam = useCallback(async (id?: string) => {
    stopCam(); setCamErr("");
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("Browser tidak mendukung kamera (butuh HTTPS).");
      const s = await navigator.mediaDevices.getUserMedia({ video: { deviceId: id ? { exact: id } : undefined, facingMode: id ? undefined : "user", width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false });
      stream.current = s; if (vid.current) { vid.current.srcObject = s; await vid.current.play(); }
      setCams((await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === "videoinput")); setCamReady(true);
    } catch (e) {
      const err = e as Error;
      setCamErr(err.name === "NotAllowedError" ? "Akses kamera ditolak. Izinkan kamera di pengaturan browser, lalu coba lagi." : err.name === "NotFoundError" ? "Kamera tidak ditemukan." : `Kamera tidak dapat dibuka: ${err.message}`);
    }
  }, []);
  useEffect(() => { if (view === "cap") openCam(); else stopCam(); return stopCam; }, [view, openCam]);
  useEffect(() => { if (cv.current && photos.length && (view === "edit" || view === "exp")) render(cv.current, 0.6, used(), o); }, [view, photos, o, used]);

  const grab = () => { const v = vid.current!, c = document.createElement("canvas"); c.width = v.videoWidth; c.height = v.videoHeight; const x = c.getContext("2d")!; x.translate(c.width, 0); x.scale(-1, 1); x.drawImage(v, 0, 0); return c; };
  const shot = async () => { for (let k = 3; k > 0; k--) { setCount(k); await wait(1000); } setCount(0); setFlash(true); setTimeout(() => setFlash(false), 450); return grab(); };
  const capture = async () => { if (busy || !camReady) return; setBusy(true); try { let cur = photos.slice(); while (cur.length < n) { cur = [...cur, await shot()]; setPhotos(cur); await wait(600); } } finally { setBusy(false); } };
  const retake = async (i: number) => { if (busy || !camReady) return; setBusy(true); try { const c = await shot(); setPhotos((p) => p.map((x, k) => (k === i ? c : x))); } finally { setBusy(false); } };

  const set = <K extends keyof Opts>(k: K, v: Opts[K]) => setO((p) => ({ ...p, [k]: v }));
  const download = async (fmt: "png" | "jpg") => {
    try {
      let c = final(res);
      if (fmt === "jpg") { const d = document.createElement("canvas"); d.width = c.width; d.height = c.height; const x = d.getContext("2d")!; x.fillStyle = "#fff"; x.fillRect(0, 0, d.width, d.height); x.drawImage(c, 0, 0); c = d; }
      const blob = await toBlob(c, fmt === "png" ? "image/png" : "image/jpeg", 0.95);
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `flashframe-${Date.now()}.${fmt}`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    } catch (e) { flash3("Download gagal: " + (e as Error).message); }
  };
  const makeQR = async () => {
    setQrBusy(true); setQr(null);
    try {
      const c = final(2), d = document.createElement("canvas"); d.width = c.width; d.height = c.height; const x = d.getContext("2d")!; x.fillStyle = "#fff"; x.fillRect(0, 0, d.width, d.height); x.drawImage(c, 0, 0);
      const fd = new FormData(); fd.append("file", await toBlob(d, "image/jpeg", 0.92), "flashframe.jpg");
      const r = await fetch("/api/upload", { method: "POST", body: fd }), j = await r.json();
      if (!r.ok) throw new Error(j.error || "Upload gagal.");
      setQr({ url: j.url, img: await QRCode.toDataURL(j.url, { width: 320, margin: 2 }) });
    } catch (e) { flash3("QR gagal: " + (e as Error).message); } finally { setQrBusy(false); }
  };
  const doPrint = () => {
    if (!pageStyle.current) { pageStyle.current = document.createElement("style"); document.head.append(pageStyle.current); }
    const sz = paper === "A4" ? "A4" : PAPER[paper].map((v) => v + "in").join(" ");
    pageStyle.current.textContent = `@page{size:${sz} ${land ? "landscape" : "portrait"};margin:0}`;
    setTimeout(() => window.print(), 100);
  };
  const [pw, ph] = land ? [PAPER[paper][1], PAPER[paper][0]] : PAPER[paper];
  const next = (v: View) => { setView(v); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const steps: [View, string][] = [["cap", "1 Capture"], ["edit", "2 Customize"], ["exp", "3 Export"]];
  const si = steps.findIndex(([k]) => k === view);

  return (
    <>
      <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-white/10 bg-neutral-950/70 px-5 py-3 backdrop-blur">
        <button onClick={() => next("home")} className="flex items-center gap-2.5 text-left" aria-label="FlashFrame by Cineflamma">
          <svg width="34" height="34" viewBox="0 0 34 34"><rect width="34" height="34" rx="9" fill="#b8a4ff" /><path d="M19.5 5 9 19h7l-2 10 11-15h-7z" fill="#0a0a0b" /></svg>
          <span><b className="block text-lg font-extrabold leading-none tracking-tight">FlashFrame</b><small className="mt-1 block text-[11px] tracking-widest text-neutral-400">by Cineflamma</small></span>
        </button>
        {si >= 0 && <nav className="flex gap-2 text-sm">{steps.map(([k, l], i) => <span key={k} className={`rounded-full border px-3 py-1 ${i === si ? "border-transparent bg-violet-300 font-bold text-neutral-950" : "border-white/15 text-neutral-400"} ${i !== si ? "max-sm:hidden" : ""}`}>{l}</span>)}</nav>}
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-16 pt-6">
        {view === "home" && (
          <section className="py-14 text-center">
            <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">Capture Your Moments, Frame Your Memories.</h1>
            <p className="mx-auto my-6 max-w-xl text-lg leading-relaxed text-neutral-400">Photobooth digital di browser. Ambil foto dengan webcam, pilih template, edit, lalu cetak, unduh, atau bagikan lewat QR Code.</p>
            <button className={pri + " rounded-full px-8 py-4 text-lg"} onClick={() => next("cap")}>Start Photobooth</button>
            <TemplateRow />
            <div className="mt-12 grid gap-3 text-left sm:grid-cols-2 lg:grid-cols-3">
              {[["Kamera langsung", "Countdown 3-2-1, flash, dan 3 atau 4 foto berurutan."], ["Editor live", "Brightness, contrast, saturation, warmth, filter, teks, tanggal."], ["PNG dan JPG", "Ekspor 1x sampai 3x dari Canvas, sudah digabung dengan template."], ["Print", "Preview untuk 2x6, 4x6, dan A4, portrait atau landscape."], ["QR Code", "Tautan unduhan unik di server, bisa dipindai dari ponsel."], ["Privasi", "File dihapus otomatis 24 jam setelah dibuat."]].map(([t, d]) => <div key={t} className="rounded-2xl border border-white/10 bg-white/5 p-5"><h3 className="font-bold">{t}</h3><p className="mt-1 text-sm text-neutral-400">{d}</p></div>)}
            </div>
          </section>
        )}

        {view === "cap" && (
          <section className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
            <div>
              <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/10 bg-black">
                <video ref={vid} playsInline muted className="h-full w-full -scale-x-100 object-cover" />
                {count > 0 && <div className="absolute inset-0 flex items-center justify-center text-[clamp(80px,22vw,180px)] font-extrabold text-white drop-shadow-2xl">{count}</div>}
                {flash && <div className="absolute inset-0 animate-pulse bg-white" />}
                {!camReady && <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-neutral-300">{camErr || "Menyiapkan kamera. Izinkan akses kamera di dialog browser."}{camErr && <button className={pri} onClick={() => openCam()}>Coba lagi</button>}</div>}
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  {[3, 4].map((k) => <button key={k} disabled={busy} className={`${btn} ${n === k ? "!border-transparent !bg-violet-300 !text-neutral-950" : ""}`} onClick={() => { setN(k); setPhotos((p) => p.slice(0, k)); }}>{k} foto</button>)}
                  {cams.length > 1 && <select aria-label="Pilih kamera" className="rounded-xl border border-white/15 bg-neutral-900 px-3 py-2.5" onChange={(e) => openCam(e.target.value)}>{cams.map((d, i) => <option key={d.deviceId} value={d.deviceId}>{d.label || `Kamera ${i + 1}`}</option>)}</select>}
                </div>
                {photos.length < n && <button className={pri} disabled={!camReady || busy} onClick={capture}>{photos.length ? "Lanjut capture" : "Capture"}</button>}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <b>Hasil foto ({photos.length}/{n})</b>
              <div className={`mt-3 grid gap-2 ${n === 3 ? "grid-cols-3" : "grid-cols-4"}`}>
                {Array.from({ length: n }, (_, i) => <div key={i} className="relative aspect-[4/3] overflow-hidden rounded-lg border border-dashed border-white/20 bg-white/5">{photos[i] && <><ThumbCanvas src={photos[i]} /><button disabled={busy} onClick={() => retake(i)} className="absolute bottom-1 right-1 rounded-md bg-black/70 px-2 py-0.5 text-[11px]">Retake</button></>}</div>)}
              </div>
              <p className="my-4 text-sm text-neutral-400">Foto diproses di perangkat Anda sampai Anda memilih QR Code.</p>
              <div className="flex gap-2"><button className={btn} disabled={busy || !photos.length} onClick={() => setPhotos([])}>Retake semua</button><button className={pri} disabled={photos.length < n} onClick={() => next("edit")}>Continue</button></div>
            </div>
          </section>
        )}

        {(view === "edit" || view === "exp") && (
          <section className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(300px,1fr)]">
            <div className="sticky top-20 flex justify-center self-start rounded-2xl border border-white/10 bg-white/5 p-5"><canvas ref={cv} className="h-auto max-h-[74vh] max-w-full shadow-2xl" /></div>
            {view === "edit" ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <b>Template</b>
                <div className="mt-2 grid grid-cols-3 gap-2">{(Object.keys(TPL) as TplKey[]).map((k) => <button key={k} onClick={() => setO({ ...defaults(k), text: o.text, date: o.date, use: o.use })} className={`rounded-lg border px-1 py-2 text-xs ${o.tpl === k ? "border-violet-300 bg-violet-300/20 font-bold" : "border-white/15 bg-white/5"}`}>{TPL[k].n}</button>)}</div>
                {o.tpl === "custom" && <div className="mt-3 flex flex-wrap gap-2">{[2, 3, 4].map((k) => <button key={k} disabled={k > photos.length} onClick={() => set("use", k)} className={`${btn} !px-3 !py-1.5 ${o.use === k ? "!bg-violet-300 !text-neutral-950" : ""}`}>{k} foto</button>)}{(["v", "h"] as const).map((k) => <button key={k} onClick={() => set("or", k)} className={`${btn} !px-3 !py-1.5 ${o.or === k ? "!bg-violet-300 !text-neutral-950" : ""}`}>{k === "v" ? "Vertikal" : "Horizontal"}</button>)}</div>}
                <label className="mt-4 block text-sm text-neutral-400">Filter
                  <select className="mt-1 w-full rounded-lg border border-white/15 bg-neutral-900 p-2 text-white" value={o.filter} onChange={(e) => set("filter", e.target.value)}>{[["none", "Normal"], ["bw", "Hitam putih"], ["sepia", "Sepia"], ["vivid", "Vivid"], ["soft", "Soft"]].map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
                {SLIDERS.map(([k, l, mn, mx]) => <label key={k} className="mt-3 block text-sm text-neutral-400">{l} <span className="float-right text-white">{o[k] as number}</span><input type="range" min={mn} max={mx} value={o[k] as number} onChange={(e) => set(k, +e.target.value as never)} className="w-full accent-violet-300" /></label>)}
                <label className="mt-3 flex items-center gap-3 text-sm text-neutral-400">Warna background <input type="color" value={o.bg} onChange={(e) => set("bg", e.target.value)} className="h-8 w-11 rounded border border-white/15 bg-transparent" /></label>
                <label className="mt-3 block text-sm text-neutral-400">Teks<input type="text" maxLength={40} value={o.text} onChange={(e) => set("text", e.target.value)} placeholder="Contoh: Sarah & Dimas" className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 p-2 text-white" /></label>
                <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={o.date} onChange={(e) => set("date", e.target.checked)} /> Tampilkan tanggal</label>
                <div className="mt-5 flex gap-2"><button className={btn} onClick={() => next("cap")}>Kembali</button><button className={pri} onClick={() => next("exp")}>Lanjut ke Export</button></div>
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <b>Hasil akhir</b>
                <div className="mt-3 flex gap-2">{[[1, "Standar 1x"], [2, "Tinggi 2x"], [3, "Maks 3x"]].map(([k, l]) => <button key={k} onClick={() => setRes(+k)} className={`${btn} !px-3 ${res === k ? "!bg-violet-300 !text-neutral-950" : ""}`}>{l}</button>)}</div>
                <div className="mt-4 grid grid-cols-2 gap-2"><button className={pri} onClick={() => download("png")}>Download PNG</button><button className={pri} onClick={() => download("jpg")}>Download JPG</button><button className={btn} onClick={() => setPrintOpen(true)}>Print Photo</button><button className={btn} disabled={qrBusy} onClick={makeQR}>{qrBusy ? "Mengunggah…" : "QR Code"}</button></div>
                {qr && <div className="mt-5 text-center"><p className="text-sm text-neutral-300">Scan untuk membuka dan mengunduh foto</p>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={qr.img} alt="QR Code" className="mx-auto my-3 w-52 rounded-xl bg-white p-2" /><a href={qr.url} target="_blank" className="break-all text-xs text-violet-300 underline">{qr.url}</a><p className="mt-2 text-xs text-neutral-400">Dihapus otomatis setelah 24 jam.</p></div>}
                <div className="mt-5 flex gap-2"><button className={btn} onClick={() => next("edit")}>Kembali edit</button><button className={btn} onClick={() => { setPhotos([]); setQr(null); next("cap"); }}>Sesi baru</button></div>
              </div>
            )}
          </section>
        )}
      </main>
      <footer className="border-t border-white/10 px-5 py-8 text-center text-sm text-neutral-400">© {new Date().getFullYear()} Cineflamma. FlashFrame by Cineflamma.</footer>

      {printOpen && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/70 p-4" onClick={() => setPrintOpen(false)}>
          <div className="max-h-[92vh] w-full max-w-lg overflow-auto rounded-2xl border border-white/15 bg-neutral-950 p-5" onClick={(e) => e.stopPropagation()}>
            <b>Print preview</b>
            <div className="mt-3 flex flex-wrap gap-2">
              <select value={paper} onChange={(e) => setPaper(e.target.value)} className="rounded-xl border border-white/15 bg-neutral-900 px-3 py-2"><option value="2x6">2 x 6 inch</option><option value="4x6">4 x 6 inch</option><option value="A4">A4</option></select>
              {[false, true].map((l) => <button key={String(l)} onClick={() => setLand(l)} className={`${btn} ${land === l ? "!bg-violet-300 !text-neutral-950" : ""}`}>{l ? "Landscape" : "Portrait"}</button>)}
            </div>
            <div className="mx-auto my-4 flex max-w-full items-center justify-center border border-white/20 bg-white" style={{ aspectRatio: `${pw}/${ph}`, height: 240 }}>{/* eslint-disable-next-line @next/next/no-img-element */}<img ref={pimg} alt="Print preview" src={final(1.5).toDataURL("image/png")} className="h-full w-full object-contain" /></div>
            <div className="flex justify-end gap-2"><button className={btn} onClick={() => setPrintOpen(false)}>Tutup</button><button className={pri} onClick={doPrint}>Print</button></div>
          </div>
        </div>
      )}
      {printOpen && <div id="print-sheet">{/* eslint-disable-next-line @next/next/no-img-element */}<img alt="" src={final(2).toDataURL("image/png")} /></div>}
      {msg && <div className="fixed bottom-5 left-1/2 z-30 -translate-x-1/2 rounded-xl bg-white px-4 py-2.5 text-sm text-neutral-950">{msg}</div>}
    </>
  );
}

function ThumbCanvas({ src }: { src: HTMLCanvasElement }) {
  const r = useRef<HTMLCanvasElement>(null);
  useEffect(() => { const c = r.current!; c.width = src.width; c.height = src.height; c.getContext("2d")!.drawImage(src, 0, 0); }, [src]);
  return <canvas ref={r} className="h-full w-full object-cover" />;
}

/** Landing previews use gradient placeholders; they are never used as camera output. */
function TemplateRow() {
  const refs = useRef<(HTMLCanvasElement | null)[]>([]);
  useEffect(() => {
    document.fonts.ready.then(() => {
      const ph = [0, 1, 2, 3].map((i) => { const c = document.createElement("canvas"); c.width = 600; c.height = 450; const x = c.getContext("2d")!, g = x.createLinearGradient(0, 0, 600, 450); g.addColorStop(0, ["#8b7fd6", "#d98fa5", "#6fa8b8", "#c9a46b"][i]); g.addColorStop(1, "#2b2b38"); x.fillStyle = g; x.fillRect(0, 0, 600, 450); x.fillStyle = "rgba(255,255,255,.35)"; x.beginPath(); x.arc(300, 190, 70, 0, 7); x.fill(); x.fillRect(190, 280, 220, 170); return c; });
      (Object.keys(TPL) as TplKey[]).forEach((k, i) => { const c = refs.current[i]; if (c) render(c, 0.3, k === "custom" ? ph.slice(0, 3) : ph, { ...defaults(k), date: false, or: k === "custom" ? "h" : "v" }); });
    });
  }, []);
  return <div className="mt-12 flex items-end gap-5 overflow-x-auto pb-3">{(Object.keys(TPL) as TplKey[]).map((k, i) => <figure key={k} className="shrink-0 text-xs text-neutral-400"><canvas ref={(el) => { refs.current[i] = el; }} className="mb-2 h-56 w-auto rounded shadow-2xl" />{TPL[k].n}</figure>)}</div>;
}
