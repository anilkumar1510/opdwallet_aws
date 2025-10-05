import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import { SpecialtiesProvider } from '@/lib/providers/specialties-provider'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'OPD Wallet Admin',
  description: 'Admin Console for OPD Wallet Platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SpecialtiesProvider>
          {children}
        </SpecialtiesProvider>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  )
}