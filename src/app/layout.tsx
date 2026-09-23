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
      <body className={`${geist.variable} antialiased`}>
        <Navbar />
        <main id="main-content" className="workspace" tabIndex={-1}>{children}</main>
        <footer className="site-footer">
          <span>Ninja Saga Tools</span>
          <p>Fan tools · Made by <a href="https://github.com/xfwil">xfwil</a></p>
        </footer>
      </body>
    </html>
  );
}
