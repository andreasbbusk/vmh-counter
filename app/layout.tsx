import type { Metadata } from "next";
import { Ubuntu } from "next/font/google";
import { CounterProvider } from "./(context)/CounterContext";
import "./globals.css";

const ubuntu = Ubuntu({
  variable: "--font-ubuntu",
  weight: ["400", "500", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VMH Tæller",
  description: "En tællerapplikation til VMH",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="da">
      <body className={`${ubuntu.variable} font-sans antialiased`}>
        <CounterProvider>{children}</CounterProvider>
      </body>
    </html>
  );
}
