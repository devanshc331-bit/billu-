import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Study Assistant",
  description: "Convert study materials into concise summaries, flashcards, quizzes, and revision sheets using AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#F8FAFC] text-[#111827] font-sans antialiased min-h-screen flex flex-col`}>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
