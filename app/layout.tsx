// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Merck Interactive Timeline",
  description: "Merck interactive timeline on-site experience",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="w-full h-dvh overflow-hidden select-none">
        {children}
      </body>
    </html>
  );
}