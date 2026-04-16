import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AXIS — B2B Partnership Platform",
  description: "Find, connect, and formalise partnerships with companies in your sector.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
