import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OPD Wallet - Doctor Portal",
  description: "Doctor portal for OPD Wallet platform",
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
