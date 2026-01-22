import type { Metadata } from "next";
import { Lato } from "next/font/google";
import { SocketProvider } from "@/components/providers/SocketProvider";
import "./globals.css";

const lato = Lato({
  subsets: ["latin"],
  weight: ["100", "300", "400", "700", "900"],
  variable: "--font-lato",
});

export const metadata: Metadata = {
  title: "SMANA Hotel Admin",
  description: "Luxury Hotel Administration System",
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
      </body>
    </html>
  );
}
