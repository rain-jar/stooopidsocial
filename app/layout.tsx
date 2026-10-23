import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  metadataBase: new URL("https://stooopidsocial.vercel.app"),
  title: "Les Stooopids",
  description: "Home of the Stooopid Community ",
  applicationName: "Les Stooopids",
  openGraph: {
    title: "Les Stooopids",
    description: "Home of the Stooopid Community",
    siteName: "Les Stooopids",
    type: "website",
    locale: "en_CA",
  },
  twitter: {
    card: "summary",
    title: "Les Stooopids",
    description: "Community events and activities in Montreal.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
