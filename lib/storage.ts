import { randomBytes } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { put, list, del } from "@vercel/blob";

export const TTL_MS = 24 * 60 * 60 * 1000;
const DIR = path.join(process.cwd(), ".data");
const useBlob = !!(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
const EXT: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg" };
export const ID_RE = /^[A-Za-z0-9_-]{16}$/;

export type Stored = { data: Buffer; type: string; ext: string; uploadedAt: number };

export async function save(buf: Buffer, type: string) {
  const ext = EXT[type];
  if (!ext) throw new Error("Unsupported type");
  const id = randomBytes(12).toString("base64url"); // 16 chars, unguessable
  if (useBlob) {
    await put(`photos/${id}.${ext}`, buf, { access: "public", contentType: type, addRandomSuffix: false });
  } else {
    await fs.mkdir(DIR, { recursive: true });
    await fs.writeFile(path.join(DIR, `${id}.${ext}`), buf);
  }
  return id;
}

export async function find(id: string): Promise<Stored | null> {
  if (!ID_RE.test(id)) return null;
  if (useBlob) {
    const { blobs } = await list({ prefix: `photos/${id}.`, limit: 1 });
    const b = blobs[0];
    if (!b) return null;
    const uploadedAt = new Date(b.uploadedAt).getTime();
    if (Date.now() - uploadedAt > TTL_MS) { await del(b.url); return null; }
    const res = await fetch(b.url, { cache: "no-store" });
    const ext = b.pathname.endsWith(".png") ? "png" : "jpg";
    return { data: Buffer.from(await res.arrayBuffer()), type: ext === "png" ? "image/png" : "image/jpeg", ext, uploadedAt };
  }
  for (const ext of ["png", "jpg"]) {
    const p = path.join(DIR, `${id}.${ext}`);
    try {
      const st = await fs.stat(p);
      if (Date.now() - st.mtimeMs > TTL_MS) { await fs.unlink(p); return null; }
      return { data: await fs.readFile(p), type: ext === "png" ? "image/png" : "image/jpeg", ext, uploadedAt: st.mtimeMs };
    } catch {}
  }
  return null;
}

/** Deletes every file older than 24 hours. Returns the number removed. */
export async function purge() {
  let n = 0;
  if (useBlob) {
    const { blobs } = await list({ prefix: "photos/" });
    const old = blobs.filter((b) => Date.now() - new Date(b.uploadedAt).getTime() > TTL_MS);
    if (old.length) await del(old.map((b) => b.url));
    return old.length;
  }
  try {
    for (const f of await fs.readdir(DIR)) {
      const p = path.join(DIR, f);
      if (Date.now() - (await fs.stat(p)).mtimeMs > TTL_MS) { await fs.unlink(p); n++; }
    }
  } catch {}
  return n;
}
