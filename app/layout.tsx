import type { Metadata, Viewport } from "next";
import { Lato } from "next/font/google";
import { SocketProvider } from "@/components/providers/SocketProvider";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";
import "./globals.css";

const lato = Lato({
  subsets: ["latin"],
  weight: ["100", "300", "400", "700", "900"],
  variable: "--font-lato",
});

export const metadata: Metadata = {
  title: "SMANA Hotel Admin",
  description: "Luxury Hotel Administration System",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SMANA Admin",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    apple: "/smana_logo.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#6366f1",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${lato.variable} font-sans antialiased min-h-screen bg-background`}
        suppressHydrationWarning
      >
        <SocketProvider>
          {children}
        </SocketProvider>

        {/* Registers /sw.js in production. Renders no visible UI. */}
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
