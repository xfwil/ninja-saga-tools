import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ninja Saga Tools",
  description: "Kumpulan alat bantu untuk Ninja Saga — EXP tracker, kalkulator, dan lainnya.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${geist.variable} antialiased min-h-screen bg-[#0a0a0f] text-[#e8e8e8]`}>
        <Navbar />
        <main>{children}</main>
        <footer className="border-t border-white/5 mt-20 py-8 text-center text-sm text-slate-600">
          <p>Made with ❤️ by <a href="https://github.com/xfwil" className="text-white hover:text-red-400 transition-colors">xfwil</a></p>
        </footer>
      </body>
    </html>
  );
}
