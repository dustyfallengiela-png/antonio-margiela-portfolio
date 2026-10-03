import type { Metadata, Viewport } from "next";
import { Inter_Tight, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const grotesk = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-grotesk",
  display: "swap",
});

const code = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-code",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Antonio Margiela — Engenharia de Sites & Software",
  description:
    "Engenharia de sites, landing pages, sistemas web e experiências digitais interativas.",
};

export const viewport: Viewport = {
  themeColor: "#0a0a09",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" data-phase="menu" className={`${grotesk.variable} ${code.variable}`}>
      <body>{children}</body>
    </html>
  );
}
