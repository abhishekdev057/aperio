import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: { default: "Aperio — Career readiness intelligence", template: "%s · Aperio" },
  description: "Understand your skills, close the gap, and reach the role with evidence-based career readiness analysis.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.variable}><ThemeProvider>{children}</ThemeProvider></body>
    </html>
  );
}
