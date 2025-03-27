import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { CounterProvider } from "./(context)/CounterContext";
import { EventSourceProvider } from "./(context)/EventSourceContext";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VMH Tæller",
  description: "En tællerapplikation med dansk talformatering",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="da">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <CounterProvider>
          <EventSourceProvider>{children}</EventSourceProvider>
        </CounterProvider>
      </body>
    </html>
  );
}
