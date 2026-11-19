export type TplKey = "classic" | "vintage" | "black" | "korean" | "polaroid" | "custom";
export type Opts = { tpl: TplKey; filter: string; br: number; co: number; sa: number; wa: number; bg: string; bd: number; gap: number; text: string; date: boolean; or: "v" | "h"; use: number };
type Tpl = { n: string; bg: string; frame?: string; filter?: string; wa?: number; grain?: boolean; deco?: boolean; pol?: boolean; bd: number; gap: number };

export const TPL: Record<TplKey, Tpl> = {
  classic: { n: "Classic Strip", bg: "#ffffff", frame: "#dddddd", bd: 28, gap: 18 },
  vintage: { n: "Vintage", bg: "#ecdcbc", filter: "sepia", wa: 30, grain: true, bd: 30, gap: 16 },
  black: { n: "Minimalist Black", bg: "#0b0b0c", frame: "#ffffff", bd: 30, gap: 20 },
  korean: { n: "Korean Style", bg: "#f7d9e6", filter: "soft", deco: true, bd: 34, gap: 18 },
  polaroid: { n: "Polaroid", bg: "#d8d8de", pol: true, bd: 30, gap: 26 },
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
  const T = TPL[o.tpl], n = photos.length, pol = !!T.pol, pw = 600, ph = 450, pad = pol ? 18 : 0, pb = pol ? 70 : 0, foot = 150;
  const cw = pw + 2 * pad, ch = ph + pb + 2 * pad, b = o.bd, g = o.gap, hor = o.tpl === "custom" && o.or === "h";
  const W = hor ? b * 2 + n * cw + (n - 1) * g : cw + 2 * b, H = hor ? b * 2 + ch + foot : b * 2 + n * ch + (n - 1) * g + foot;
  c.width = Math.round(W * sc); c.height = Math.round(H * sc);
  const x = c.getContext("2d")!; x.setTransform(sc, 0, 0, sc, 0, 0); x.fillStyle = o.bg; x.fillRect(0, 0, W, H);
  const fg = lum(o.bg) < 110 ? "#ffffff" : "#111111";
  const filt = `brightness(${o.br}%) contrast(${o.co}%) saturate(${o.sa}%) ${FIL[o.filter] || ""}`;
  (photos as HTMLCanvasElement[]).forEach((p, i) => {
    const cx = hor ? b + i * (cw + g) : b, cy = hor ? b : b + i * (ch + g), px = cx + pad, py = cy + pad;
    if (pol) { x.save(); x.shadowColor = "rgba(0,0,0,.25)"; x.shadowBlur = 14; x.shadowOffsetY = 4; x.fillStyle = "#fff"; x.fillRect(cx, cy, cw, ch); x.restore(); }
    x.save(); x.beginPath(); x.rect(px, py, pw, ph); x.clip();
    const r = Math.max(pw / p.width, ph / p.height), w = p.width * r, h = p.height * r;
    x.filter = filt; x.drawImage(p, px + (pw - w) / 2, py + (ph - h) / 2, w, h); x.filter = "none";
    if (o.wa) { x.globalCompositeOperation = "overlay"; x.fillStyle = o.wa > 0 ? `rgba(255,140,40,${(o.wa / 100) * 0.45})` : `rgba(60,140,255,${(-o.wa / 100) * 0.45})`; x.fillRect(px, py, pw, ph); x.globalCompositeOperation = "source-over"; }
    if (T.grain) { x.globalAlpha = 0.16; x.fillStyle = x.createPattern(grain(), "repeat")!; x.fillRect(px, py, pw, ph); x.globalAlpha = 1; }
    x.restore();
    if (T.frame && !pol) { x.strokeStyle = T.frame; x.lineWidth = 3; x.strokeRect(px, py, pw, ph); }
  });
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
