import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
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
      className={`${inter.variable} h-full antialiased`}
    >
      <head>
        <link rel="icon" href="/images/flowchecklogo-final-bg-white-big.png" type="image/png" />
        <link rel="shortcut icon" href="/images/flowchecklogo-final-bg-white-big.png" type="image/png" />
        <link rel="apple-touch-icon" href="/images/flowchecklogo-final-bg-white-big.png" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-background text-on-background min-h-screen overflow-x-hidden">{children}</body>
    </html>
  );
}
