import type { Metadata } from "next";
import { AppChrome } from "@/components/app-chrome";
import "./globals.css";

export const metadata: Metadata = {
  title: "NOTUBE",
  description: "Escape the YouTube algorithm. Keep the knowledge.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="h-full antialiased">
        <AppChrome>{children}</AppChrome>
      </body>
    </html>
  );
}
