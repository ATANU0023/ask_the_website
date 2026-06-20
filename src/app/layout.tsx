import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Providers } from "@/components/shared/providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
// Using localFont or Google Font for Geist. Geist is usually available as a Geist Sans local font or from google if available.
// Since next/font/google doesn't fully support Geist yet, I will use Google Fonts link in layout or let it fallback to system-ui.
// Actually, Geist is available in next/font/google in newer Next versions. Let's try importing it.
// Wait, the safest is to just load it via Google Fonts in the layout head since the mock does exactly that.

export const metadata: Metadata = {
  title: "Kiwi",
  description: "Your intelligent workspace for knowledge management",
  icons: {
    icon: "/kiwi.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
      </head>
      <body className={cn(inter.variable, "min-h-screen bg-background text-on-surface font-sans antialiased")}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
