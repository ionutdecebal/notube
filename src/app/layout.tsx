import type { Metadata } from "next";
import { AppChrome } from "@/components/app-chrome";
import "./globals.css";

export const metadata: Metadata = {
  title: "notube",
  description: "Distraction-free YouTube learning workflow",
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
