import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ShopTalk AI — Bilingual Voice Service Advisor",
  description:
    "Demo: bilingual (EN/ES) voice receptionist for independent Miami auto-repair shops. All data is fictional demonstration data.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Nav />
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 pb-10">{children}</main>
        <footer className="border-t border-[#26282c] py-3 text-center text-xs text-[#8a8f98]">
          ShopTalk AI — hackathon demo · every customer, appointment and price shown is fictional demo data
        </footer>
      </body>
    </html>
  );
}
