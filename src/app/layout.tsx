import type { Metadata } from "next";
import { Inter, Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "FlowCheck - Event Management",
  description: "Secure Encrypted Registration and Check-in System",
  icons: {
    icon: "/images/flowchecklogo-final-bg-white-big.png",
    shortcut: "/images/flowchecklogo-final-bg-white-big.png",
    apple: "/images/flowchecklogo-final-bg-white-big.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${outfit.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="icon" href="/images/flowchecklogo-final-bg-white-big.png" type="image/png" />
        <link rel="shortcut icon" href="/images/flowchecklogo-final-bg-white-big.png" type="image/png" />
        <link rel="apple-touch-icon" href="/images/flowchecklogo-final-bg-white-big.png" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-background text-on-background min-h-screen overflow-x-hidden">{children}</body>
    </html>
  );
}
