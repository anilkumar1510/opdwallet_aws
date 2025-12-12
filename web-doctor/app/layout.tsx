import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from 'next/font/google'
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

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
    <html lang="en" className={`${plusJakartaSans.variable} ${inter.variable}`}>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
