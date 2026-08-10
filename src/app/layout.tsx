import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import NavLinks from "@/components/NavLinks";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LoL Matchup Note",
  description: "自分専用のLoLマッチアップメモ & 戦績ツール",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-neutral-950 text-neutral-100">
        <header className="sticky top-0 z-20 border-b border-neutral-800 bg-neutral-900/80 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
            <Link
              href="/"
              className="text-base font-bold tracking-tight text-white transition-opacity hover:opacity-80 sm:text-lg"
            >
              LoL Matchup <span className="text-sky-400">Note</span>
            </Link>
            <NavLinks />
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
          {children}
        </main>
        <footer className="border-t border-neutral-800 px-4 py-4 text-center text-xs leading-relaxed text-neutral-600">
          <p>
            LoL Matchup Note isn&apos;t endorsed by Riot Games and doesn&apos;t
            reflect the views or opinions of Riot Games or anyone officially
            involved in producing or managing League of Legends. League of
            Legends and Riot Games are trademarks or registered trademarks of
            Riot Games, Inc. League of Legends © Riot Games, Inc.
          </p>
          <p className="mt-1">
            本サービスはRiot
            Gamesの公認・提携を受けたものではなく、Riot
            Gamesの見解を反映するものではありません。
          </p>
        </footer>
      </body>
    </html>
  );
}
