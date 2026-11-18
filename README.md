# FlashFrame by Cineflamma

Next.js 15 + TypeScript + Tailwind 4. Camera via MediaDevices, composition via Canvas, QR via `qrcode`.

## Run
```bash
npm install
cp .env.example .env.local
npm run dev        # http://localhost:3000 (camera works on localhost)
```
Camera needs HTTPS in production. Phones can only open QR links if `NEXT_PUBLIC_BASE_URL` (or the deployed origin) is reachable from the phone.

## QR backend and 24h deletion
- `POST /api/upload` validates PNG/JPG by magic bytes (max 15 MB), stores it under an unguessable 16-char ID, returns `/d/<id>`.
- `/d/<id>` is the download page; `/api/photo/<id>` serves the file (`?dl=1` forces download), `no-store`, `noindex`.
- Storage: Vercel Blob when `BLOB_READ_WRITE_TOKEN` is set, otherwise `./.data` (dev only).
- Expiry is enforced three ways: reads reject files older than 24h and delete them, uploads trigger a purge, and `vercel.json` runs `/api/cleanup` hourly (set `CRON_SECRET`).

## Deploy
`vercel deploy`, then add a Blob store and the env vars above. Not included yet: rate limiting on `/api/upload`.
# flashframe
