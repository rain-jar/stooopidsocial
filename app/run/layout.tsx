import { JetBrains_Mono } from "next/font/google";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-run-mono",
  display: "swap",
});

export default function RunLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      className={`${jetbrainsMono.variable} run-page run-scrollport`}
    >
      {children}
    </div>
  );
}
