import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "iPhone Mockup Generator",
  description: "Generate beautiful iPhone mockups from your screenshots",
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
