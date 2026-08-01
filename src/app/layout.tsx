import type { Metadata } from "next";
import { Inter, Outfit, JetBrains_Mono } from "next/font/google";
import "material-symbols";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
  preload: true,
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
        <link rel="icon" href="/images/flowchecklogo-final-bg-white-big.png" type="image/png" />
        <link rel="shortcut icon" href="/images/flowchecklogo-final-bg-white-big.png" type="image/png" />
        <link rel="apple-touch-icon" href="/images/flowchecklogo-final-bg-white-big.png" />
      </head>
      <body className="bg-background text-on-background min-h-screen overflow-x-hidden">{children}</body>
    </html>
  );
}
