import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Bokingo — Book Anything, Instantly",
  description:
    "A next-generation booking platform for turfs, gaming lounges, salons, studios and more. Real-time availability. Zero friction.",
  icons: {
    icon: "/images/brand/Bokingo_app.png",
    apple: "/images/brand/Bokingo_app.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased min-h-screen`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
