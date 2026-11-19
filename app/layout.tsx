import "./globals.css";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = { title: "FlashFrame by Cineflamma", description: "Digital photobooth: capture, customize, print, and share by QR." };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head><link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;700;800&display=swap" rel="stylesheet" /></head>
      <body>{children}</body>
    </html>
  );
}
