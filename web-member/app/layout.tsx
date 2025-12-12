import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, Inter } from 'next/font/google'
import './globals.css'
import { ToastProvider } from '@/components/ui/Toast'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { QueryProvider } from '@/lib/providers/query-provider'

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
  title: 'OPD Wallet - Member Portal',
  description: 'Member Portal for OPD Wallet Benefits',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover',
  themeColor: '#1E3A8C',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'OPD Wallet',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} ${inter.variable}`}>
      <body suppressHydrationWarning>
        <ErrorBoundary>
          <QueryProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </QueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}