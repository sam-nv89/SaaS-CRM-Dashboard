import React from "react"
import type { Metadata, Viewport } from 'next'
import { Inter, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const inter = Inter({
  subsets: ["latin"],
  variable: '--font-inter'
});
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'BeautyFlow — Streamline Your Beauty Business',
  description: 'The modern CRM for beauty salons and independent stylists. Smart scheduling, client management, and financial insights all in one place.',
  keywords: ['salon software', 'booking system', 'beauty business', 'appointment scheduling', 'salon management', 'CRM for salons', 'beauty CRM'],
  authors: [{ name: 'BeautyFlow' }],
  openGraph: {
    title: 'BeautyFlow — Streamline Your Beauty Business',
    description: 'The modern CRM for beauty salons and independent stylists.',
    type: 'website',
    locale: 'en_US',
    siteName: 'BeautyFlow',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BeautyFlow — Streamline Your Beauty Business',
    description: 'The modern CRM for beauty salons and independent stylists.',
  },
}

export const viewport: Viewport = {
  themeColor: '#00A6A6',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
