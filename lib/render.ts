export type TplKey =
  | "classic" | "vintage" | "black" | "korean" | "polaroid" | "custom"
  | "bubblegum" | "y2k" | "film" | "sunset" | "mint"
  | "cutie" | "analog" | "diner" | "dreamy" | "graduation" | "wedding" | "party";
export type Opts = { tpl: TplKey; filter: string; br: number; co: number; sa: number; wa: number; bg: string; bd: number; gap: number; text: string; date: boolean; or: "v" | "h"; use: number };
type Pat = "checker" | "confetti" | "clouds" | "stars";
type Tpl = {
  n: string; bg: string; frame?: string; filter?: string; wa?: number; grain?: boolean; deco?: boolean; pol?: boolean;
  grad?: [string, string]; round?: number; stick?: string[]; sc?: string; holes?: boolean; nums?: boolean;
  pat?: Pat; pc?: [string, string]; pf?: number; pfc?: string; cap?: string; tc?: string; font?: string; dbl?: string;
  bd: number; gap: number;
};

export const TPL: Record<TplKey, Tpl> = {
  classic: { n: "Classic Strip", bg: "#ffffff", frame: "#dddddd", bd: 28, gap: 18 },
  vintage: { n: "Vintage", bg: "#ecdcbc", filter: "sepia", wa: 30, grain: true, bd: 30, gap: 16 },
  black: { n: "Minimalist Black", bg: "#0b0b0c", frame: "#ffffff", bd: 30, gap: 20 },
  korean: { n: "Korean Style", bg: "#f7d9e6", filter: "soft", deco: true, bd: 34, gap: 18 },
  polaroid: { n: "Polaroid", bg: "#d8d8de", pol: true, bd: 30, gap: 26 },
  custom: { n: "Custom Layout", bg: "#ffffff", bd: 28, gap: 18 },
  bubblegum: { n: "Bubblegum", bg: "#ffd1e8", grad: ["#ffd1e8", "#d7c4ff"], filter: "soft", round: 28, stick: ["♡", "✿", "★", "♡"], sc: "#ff5fa2", bd: 36, gap: 22 },
  y2k: { n: "Y2K Neon", bg: "#2a1065", grad: ["#2a1065", "#0b0b2a"], frame: "#ff7bd5", filter: "vivid", round: 8, stick: ["✦", "★", "✧", "✦"], sc: "#7df9ff", bd: 34, gap: 20 },
  film: { n: "Film Roll", bg: "#151311", holes: true, grain: true, wa: 15, bd: 44, gap: 18 },
  sunset: { n: "Sunset Pop", bg: "#ffb88c", grad: ["#ffb88c", "#ff7eb3"], wa: 20, round: 20, stick: ["★", "✦", "♡", "✿"], sc: "#ffffff", bd: 34, gap: 20 },
  mint: { n: "Fresh Mint", bg: "#c8f5e0", grad: ["#c8f5e0", "#a6d8ff"], filter: "soft", round: 24, stick: ["✿", "★", "✦", "✿"], sc: "#ff8fb1", bd: 34, gap: 20 },
  // --- Baru: tema bermotif ---
  cutie: { n: "Cutie Checker", bg: "#ffc2dc", pat: "checker", pc: ["#ffb3d4", "#fff0f6"], pf: 12, pfc: "#ffffff", round: 22, filter: "soft", stick: ["♡", "✿", "★", "♡"], sc: "#ff4f9a", cap: "selfie time", tc: "#d6247f", bd: 40, gap: 34 },
  analog: { n: "Analog B&W", bg: "#0e0e0f", holes: true, nums: true, grain: true, filter: "bw", cap: "ANALOG DAYS", tc: "#e8e8e8", bd: 48, gap: 20 },
  diner: { n: "Retro Diner", bg: "#fff4e0", pat: "checker", pc: ["#e63946", "#fff4e0"], pf: 10, pfc: "#ffffff", round: 6, filter: "vivid", stick: ["★", "★", "★", "★"], sc: "#e63946", cap: "good times", tc: "#b3202c", bd: 40, gap: 30 },
  dreamy: { n: "Dreamy Sky", bg: "#a8d8ff", grad: ["#a8d8ff", "#e3d1ff"], pat: "clouds", pf: 10, pfc: "#ffffff", round: 26, filter: "soft", stick: ["✦", "✧", "★", "✦"], sc: "#ffffff", cap: "dreamy day", tc: "#5b4b9a", bd: 38, gap: 30 },
  graduation: { n: "Graduation", bg: "#14213d", grad: ["#14213d", "#1d3461"], pat: "stars", pc: ["#fca311", "#fca311"], pf: 6, pfc: "#fca311", round: 4, stick: ["★", "★", "★", "★"], sc: "#fca311", cap: "CONGRATULATIONS", tc: "#fca311", bd: 40, gap: 24 },
  wedding: { n: "Wedding Elegant", bg: "#fbf7ef", dbl: "#c9a96a", frame: "#c9a96a", filter: "soft", wa: 10, cap: "Our Wedding Day", font: 'italic 600 34px Georgia, "Times New Roman", serif', tc: "#8a6d3b", bd: 46, gap: 22 },
  party: { n: "Party Confetti", bg: "#fff7d6", pat: "confetti", pf: 10, pfc: "#ffffff", round: 18, filter: "vivid", stick: ["★", "✦", "♡", "★"], sc: "#ff5a5f", cap: "Happy Birthday!", tc: "#d62828", bd: 40, gap: 30 },
};
export const FIL: Record<string, string> = { none: "", bw: "grayscale(1)", sepia: "sepia(.85)", vivid: "saturate(1.45) contrast(1.1)", soft: "brightness(1.06) contrast(.92) saturate(.95)" };
export const defaults = (k: TplKey): Opts => ({ tpl: k, filter: TPL[k].filter ?? "none", br: 100, co: 100, sa: 100, wa: TPL[k].wa ?? 0, bg: TPL[k].bg, bd: TPL[k].bd, gap: TPL[k].gap, text: "", date: true, or: "v", use: 4 });

const F = '"Plus Jakarta Sans",sans-serif';
const lum = (h: string) => { const n = parseInt(h.slice(1), 16); return (n >> 16) * 0.3 + ((n >> 8) & 255) * 0.59 + (n & 255) * 0.11; };
const rng = (seed: number) => { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }; // seeded: preview = export

let grainC: HTMLCanvasElement | null = null;
function grain() {
  if (grainC) return grainC;
  grainC = document.createElement("canvas"); grainC.width = grainC.height = 128;
  const x = grainC.getContext("2d")!, d = x.createImageData(128, 128);
  for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
  x.putImageData(d, 0, 0); return grainC;
}

function pattern(x: CanvasRenderingContext2D, p: Pat, c: [string, string] | undefined, W: number, H: number) {
  x.save();
  if (p === "checker") {
    const s = 36, cc = c ?? ["#fff", "#eee"];
    for (let r = 0; r * s < H; r++) for (let q = 0; q * s < W; q++) { x.fillStyle = (r + q) % 2 ? cc[1] : cc[0]; x.fillRect(q * s, r * s, s, s); }
  } else if (p === "confetti") {
    const r = rng(7), cols = ["#ff5a5f", "#ffbe0b", "#3a86ff", "#8338ec", "#06d6a0", "#ff006e"];
    for (let i = 0; i < Math.round((W * H) / 2600); i++) { x.save(); x.translate(r() * W, r() * H); x.rotate(r() * 6.28); x.fillStyle = cols[Math.floor(r() * cols.length)]; x.fillRect(-5, -2, 10, 4); x.restore(); }
  } else if (p === "clouds") {
    const r = rng(11); x.fillStyle = "rgba(255,255,255,.55)";
    for (let i = 0; i < Math.max(5, Math.round(H / 220)); i++) {
      const cx = r() * W, cy = r() * H, s = 18 + r() * 16;
      ([[0, 0, 1], [0.9, 0.2, 0.8], [-0.9, 0.25, 0.7]] as number[][]).forEach(([dx, dy, k]) => { x.beginPath(); x.arc(cx + dx * s, cy + dy * s, s * k, 0, 7); x.fill(); });
    }
  } else if (p === "stars") {
    const r = rng(5); x.fillStyle = c ? c[0] : "#fff"; x.textAlign = "center"; x.textBaseline = "middle";
    for (let i = 0; i < Math.round((W * H) / 9000); i++) { x.globalAlpha = 0.25 + r() * 0.5; x.font = `${12 + Math.floor(r() * 16)}px sans-serif`; x.fillText("✦", r() * W, r() * H); }
  }
  x.restore();
}

/** Composes photos + frame + decoration + text + branding into one canvas. */
export function render(c: HTMLCanvasElement, sc: number, photos: HTMLCanvasElement[], o: Opts) {
  const T = TPL[o.tpl], n = photos.length, pol = !!T.pol, pw = 640, ph = 360, pad = pol ? 18 : 0, pb = pol ? 70 : 0, foot = 150;
  const cw = pw + 2 * pad, ch = ph + pb + 2 * pad, b = o.bd, g = o.gap, hor = o.tpl === "custom" && o.or === "h";
  const W = hor ? b * 2 + n * cw + (n - 1) * g : cw + 2 * b, H = hor ? b * 2 + ch + foot : b * 2 + n * ch + (n - 1) * g + foot;
  c.width = Math.round(W * sc); c.height = Math.round(H * sc);
  const x = c.getContext("2d")!; x.setTransform(sc, 0, 0, sc, 0, 0);
  const own = o.bg === T.bg; // false when the user picked a custom background color
  if (T.grad && own) { const gr = x.createLinearGradient(0, 0, W, H); gr.addColorStop(0, T.grad[0]); gr.addColorStop(1, T.grad[1]); x.fillStyle = gr; } else x.fillStyle = o.bg;
  x.fillRect(0, 0, W, H);
  if (T.pat && own) pattern(x, T.pat, T.pc, W, H);
  const fg = lum(o.bg) < 110 ? "#ffffff" : "#111111", tcol = own && T.tc ? T.tc : fg;
  const filt = `brightness(${o.br}%) contrast(${o.co}%) saturate(${o.sa}%) ${FIL[o.filter] || ""}`;
  const rects: number[][] = [];
  photos.forEach((p, i) => {
    const cx = hor ? b + i * (cw + g) : b, cy = hor ? b : b + i * (ch + g), px = cx + pad, py = cy + pad;
    rects.push([px, py, pw, ph]);
    if (pol) { x.save(); x.shadowColor = "rgba(0,0,0,.25)"; x.shadowBlur = 14; x.shadowOffsetY = 4; x.fillStyle = "#fff"; x.fillRect(cx, cy, cw, ch); x.restore(); }
    if (T.pf) {
      x.save(); x.shadowColor = "rgba(0,0,0,.18)"; x.shadowBlur = 10; x.shadowOffsetY = 3; x.fillStyle = T.pfc || "#fff"; x.beginPath();
      if (T.round) x.roundRect(px - T.pf, py - T.pf, pw + 2 * T.pf, ph + 2 * T.pf, T.round + T.pf); else x.rect(px - T.pf, py - T.pf, pw + 2 * T.pf, ph + 2 * T.pf);
      x.fill(); x.restore();
    }
    x.save(); x.beginPath(); if (T.round) x.roundRect(px, py, pw, ph, T.round); else x.rect(px, py, pw, ph); x.clip();
    const r = Math.max(pw / p.width, ph / p.height), w = p.width * r, h = p.height * r;
    x.filter = filt; x.drawImage(p, px + (pw - w) / 2, py + (ph - h) / 2, w, h); x.filter = "none";
    if (o.wa) { x.globalCompositeOperation = "overlay"; x.fillStyle = o.wa > 0 ? `rgba(255,140,40,${(o.wa / 100) * 0.45})` : `rgba(60,140,255,${(-o.wa / 100) * 0.45})`; x.fillRect(px, py, pw, ph); x.globalCompositeOperation = "source-over"; }
    if (T.grain) { x.globalAlpha = 0.16; x.fillStyle = x.createPattern(grain(), "repeat")!; x.fillRect(px, py, pw, ph); x.globalAlpha = 1; }
    x.restore();
    if (T.frame && !pol) { x.strokeStyle = T.frame; x.lineWidth = 3; x.strokeRect(px, py, pw, ph); }
  });
  // decorations on top of photos
  if (T.dbl && own) { x.save(); x.strokeStyle = T.dbl; x.lineWidth = 3; x.strokeRect(12, 12, W - 24, H - 24); x.lineWidth = 1; x.strokeRect(20, 20, W - 40, H - 40); x.restore(); }
  if (T.stick) {
    x.save(); x.textAlign = "center"; x.textBaseline = "middle"; x.fillStyle = T.sc || "#ffffff"; x.font = "46px sans-serif";
    rects.forEach(([px, py, w], i) => { const left = i % 2 === 0; x.save(); x.translate(left ? px + 6 : px + w - 6, py + 6); x.rotate((left ? -1 : 1) * 0.25); x.fillText(T.stick![i % T.stick!.length], 0, 0); x.restore(); });
    x.restore();
  }
  if (T.holes && !hor) {
    x.fillStyle = "#f4f4f6";
    for (let yy = 14; yy < H - foot - 20; yy += 34) { x.beginPath(); x.roundRect(10, yy, 14, 20, 3); x.roundRect(W - 24, yy, 14, 20, 3); x.fill(); }
  }
  if (T.nums) { x.save(); x.fillStyle = "#ff9f1c"; x.font = "700 13px monospace"; x.textAlign = "left"; rects.forEach(([px, py], i) => x.fillText(`▶ ${i + 1}A`, px + 4, py - 5)); x.restore(); }
  // footer
  const fy0 = H - foot, fx = W / 2, y = fy0 + 10;
  if (T.pat && own) { x.fillStyle = lum(o.bg) < 110 ? "rgba(0,0,0,.3)" : "rgba(255,255,255,.7)"; x.beginPath(); x.roundRect(b, fy0 + 2, W - 2 * b, foot - 18, 16); x.fill(); }
  x.fillStyle = tcol; x.textAlign = "center"; x.textBaseline = "alphabetic";
  let ty = y + 34;
  const cap = o.text || (own ? T.cap : "") || "";
  if (cap) { x.font = T.font && !o.text ? T.font : `700 32px ${F}`; x.fillText(cap, fx, ty); ty += 30; }
  if (o.date) { x.font = `500 22px ${F}`; x.globalAlpha = 0.8; x.fillText(new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }), fx, ty); x.globalAlpha = 1; ty += 10; }
  const by = Math.max(ty + 34, y + 112);
  x.font = `800 26px ${F}`;
  const ix = fx - x.measureText("FlashFrame").width / 2 - 22;
  x.beginPath(); x.moveTo(ix + 8, by - 24); x.lineTo(ix - 6, by - 2); x.lineTo(ix + 3, by - 2); x.lineTo(ix - 2, by + 14); x.lineTo(ix + 14, by - 8); x.lineTo(ix + 5, by - 8); x.closePath(); x.fill();
  x.textAlign = "left"; x.fillText("FlashFrame", ix + 22, by); x.textAlign = "center";
  x.font = `500 13px ${F}`; x.globalAlpha = 0.7; x.fillText("by Cineflamma", fx + 10, by + 20); x.globalAlpha = 1;
  if (T.deco) { x.font = "26px sans-serif"; x.fillText("✦", b + 14, H - 18); x.fillText("♡", W - b - 14, H - 18); }
}