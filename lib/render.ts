export type TplKey = "classic" | "vintage" | "black" | "korean" | "polaroid" | "custom" | "bubblegum" | "y2k" | "film" | "sunset" | "mint";
export type Opts = { tpl: TplKey; filter: string; br: number; co: number; sa: number; wa: number; bg: string; bd: number; gap: number; text: string; date: boolean; or: "v" | "h"; use: number };
type Tpl = { n: string; bg: string; frame?: string; filter?: string; wa?: number; grain?: boolean; deco?: boolean; pol?: boolean; grad?: [string, string]; round?: number; stick?: string[]; sc?: string; holes?: boolean; bd: number; gap: number };

export const TPL: Record<TplKey, Tpl> = {
  classic: { n: "Classic Strip", bg: "#ffffff", frame: "#dddddd", bd: 28, gap: 18 },
  vintage: { n: "Vintage", bg: "#ecdcbc", filter: "sepia", wa: 30, grain: true, bd: 30, gap: 16 },
  black: { n: "Minimalist Black", bg: "#0b0b0c", frame: "#ffffff", bd: 30, gap: 20 },
  korean: { n: "Korean Style", bg: "#f7d9e6", filter: "soft", deco: true, bd: 34, gap: 18 },
  polaroid: { n: "Polaroid", bg: "#d8d8de", pol: true, bd: 30, gap: 26 },
  bubblegum: { n: "Bubblegum", bg: "#ffd1e8", grad: ["#ffd1e8", "#d7c4ff"], filter: "soft", round: 28, stick: ["♡", "✿", "★", "♡"], sc: "#ff5fa2", bd: 36, gap: 22 },
  y2k: { n: "Y2K Neon", bg: "#2a1065", grad: ["#2a1065", "#0b0b2a"], frame: "#ff7bd5", filter: "vivid", round: 8, stick: ["✦", "★", "✧", "✦"], sc: "#7df9ff", bd: 34, gap: 20 },
  film: { n: "Film Roll", bg: "#151311", holes: true, grain: true, wa: 15, bd: 44, gap: 18 },
  sunset: { n: "Sunset Pop", bg: "#ffb88c", grad: ["#ffb88c", "#ff7eb3"], wa: 20, round: 20, stick: ["★", "✦", "♡", "✿"], sc: "#ffffff", bd: 34, gap: 20 },
  mint: { n: "Fresh Mint", bg: "#c8f5e0", grad: ["#c8f5e0", "#a6d8ff"], filter: "soft", round: 24, stick: ["✿", "★", "✦", "✿"], sc: "#ff8fb1", bd: 34, gap: 20 },
  custom: { n: "Custom Layout", bg: "#ffffff", bd: 28, gap: 18 },
};
export const FIL: Record<string, string> = { none: "", bw: "grayscale(1)", sepia: "sepia(.85)", vivid: "saturate(1.45) contrast(1.1)", soft: "brightness(1.06) contrast(.92) saturate(.95)" };
export const defaults = (k: TplKey): Opts => ({ tpl: k, filter: TPL[k].filter ?? "none", br: 100, co: 100, sa: 100, wa: TPL[k].wa ?? 0, bg: TPL[k].bg, bd: TPL[k].bd, gap: TPL[k].gap, text: "", date: true, or: "v", use: 4 });

const lum = (h: string) => { const n = parseInt(h.slice(1), 16); return (n >> 16) * 0.3 + ((n >> 8) & 255) * 0.59 + (n & 255) * 0.11; };
let grainC: HTMLCanvasElement | null = null;
function grain() {
  if (grainC) return grainC;
  grainC = document.createElement("canvas"); grainC.width = grainC.height = 128;
  const x = grainC.getContext("2d")!, d = x.createImageData(128, 128);
  for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
  x.putImageData(d, 0, 0); return grainC;
}

/** Composes photos + frame + text + branding into one canvas. */
export function render(c: HTMLCanvasElement, sc: number, photos: CanvasImageSource[] & { width?: number }[] | HTMLCanvasElement[], o: Opts) {
  const T = TPL[o.tpl], n = photos.length, pol = !!T.pol, pw = 640, ph = 360, pad = pol ? 18 : 0, pb = pol ? 70 : 0, foot = 150;
  const cw = pw + 2 * pad, ch = ph + pb + 2 * pad, b = o.bd, g = o.gap, hor = o.tpl === "custom" && o.or === "h";
  const W = hor ? b * 2 + n * cw + (n - 1) * g : cw + 2 * b, H = hor ? b * 2 + ch + foot : b * 2 + n * ch + (n - 1) * g + foot;
  c.width = Math.round(W * sc); c.height = Math.round(H * sc);
  const x = c.getContext("2d")!; x.setTransform(sc, 0, 0, sc, 0, 0);   if (T.grad && o.bg === T.bg) { const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, T.grad[0]); g.addColorStop(1, T.grad[1]); x.fillStyle = g; } else x.fillStyle = o.bg;
  x.fillRect(0, 0, W, H);
  const fg = lum(o.bg) < 110 ? "#ffffff" : "#111111";
  const filt = `brightness(${o.br}%) contrast(${o.co}%) saturate(${o.sa}%) ${FIL[o.filter] || ""}`;
  const rects: number[][] = [];
  (photos as HTMLCanvasElement[]).forEach((p, i) => {
    const cx = hor ? b + i * (cw + g) : b, cy = hor ? b : b + i * (ch + g), px = cx + pad, py = cy + pad;
        rects.push([px, py, pw, ph]);
    if (pol) { x.save(); x.shadowColor = "rgba(0,0,0,.25)"; x.shadowBlur = 14; x.shadowOffsetY = 4; x.fillStyle = "#fff"; x.fillRect(cx, cy, cw, ch); x.restore(); }
        x.save(); x.beginPath(); if (T.round) x.roundRect(px, py, pw, ph, T.round); else x.rect(px, py, pw, ph); x.clip();
    const r = Math.max(pw / p.width, ph / p.height), w = p.width * r, h = p.height * r;
    x.filter = filt; x.drawImage(p, px + (pw - w) / 2, py + (ph - h) / 2, w, h); x.filter = "none";
    if (o.wa) { x.globalCompositeOperation = "overlay"; x.fillStyle = o.wa > 0 ? `rgba(255,140,40,${(o.wa / 100) * 0.45})` : `rgba(60,140,255,${(-o.wa / 100) * 0.45})`; x.fillRect(px, py, pw, ph); x.globalCompositeOperation = "source-over"; }
    if (T.grain) { x.globalAlpha = 0.16; x.fillStyle = x.createPattern(grain(), "repeat")!; x.fillRect(px, py, pw, ph); x.globalAlpha = 1; }
    x.restore();
    if (T.frame && !pol) { x.strokeStyle = T.frame; x.lineWidth = 3; x.strokeRect(px, py, pw, ph); }
  });
    if (T.stick) {
    x.save(); x.textAlign = "center"; x.textBaseline = "middle"; x.fillStyle = T.sc || "#ffffff"; x.font = "46px sans-serif";
    rects.forEach(([px, py, w], i) => { const left = i % 2 === 0; x.save(); x.translate(left ? px + 6 : px + w - 6, py + 6); x.rotate((left ? -1 : 1) * 0.25); x.fillText(T.stick![i % T.stick!.length], 0, 0); x.restore(); });
    x.restore();
  }
  if (T.holes && !hor) {
    x.fillStyle = "#f4f4f6";
    for (let yy = 14; yy < H - foot - 20; yy += 34) { x.beginPath(); x.roundRect(10, yy, 14, 20, 3); x.roundRect(W - 24, yy, 14, 20, 3); x.fill(); }
  }
  const fx = W / 2, y = (hor ? b + ch : H - foot) + 10;
  x.fillStyle = fg; x.textAlign = "center";
  let ty = y + 34;
  if (o.text) { x.font = '700 32px "Plus Jakarta Sans",sans-serif'; x.fillText(o.text, fx, ty); ty += 30; }
  if (o.date) { x.font = '500 22px "Plus Jakarta Sans",sans-serif'; x.globalAlpha = 0.8; x.fillText(new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }), fx, ty); x.globalAlpha = 1; ty += 10; }
  const by = Math.max(ty + 34, y + 112);
  x.font = '800 26px "Plus Jakarta Sans",sans-serif';
  const ix = fx - x.measureText("FlashFrame").width / 2 - 22;
  x.beginPath(); x.moveTo(ix + 8, by - 24); x.lineTo(ix - 6, by - 2); x.lineTo(ix + 3, by - 2); x.lineTo(ix - 2, by + 14); x.lineTo(ix + 14, by - 8); x.lineTo(ix + 5, by - 8); x.closePath(); x.fill();
  x.textAlign = "left"; x.fillText("FlashFrame", ix + 22, by); x.textAlign = "center";
  x.font = '500 13px "Plus Jakarta Sans",sans-serif'; x.globalAlpha = 0.7; x.fillText("by Cineflamma", fx + 10, by + 20); x.globalAlpha = 1;
  if (T.deco) { x.font = "26px sans-serif"; x.fillText("✦", b + 14, H - 18); x.fillText("♡", W - b - 14, H - 18); }
}
