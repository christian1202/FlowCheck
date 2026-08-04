import type { Metadata, Viewport } from "next";
import { Geist, Outfit, JetBrains_Mono } from "next/font/google";
import "material-symbols";
import "./globals.css";

// viewportFit: 'cover' enables env(safe-area-inset-*) so the mobile bottom nav
// and fixed overlays can pad around iPhone home indicators / rounded corners.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const geist = Geist({
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
      className={`${geist.variable} ${outfit.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="bg-background text-on-background min-h-screen overflow-x-hidden">{children}</body>
    </html>
  );
}
