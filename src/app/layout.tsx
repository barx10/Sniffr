import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Syne } from 'next/font/google'
import './globals.css'

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  weight: ['400', '700', '800'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Scam Sniffr — Analyser mistenkelige meldinger',
  description: 'Analyser mistenkelige e-poster, bilder og avsendere med AI og trusselsjekker',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="no" className={`${GeistSans.variable} ${GeistMono.variable} ${syne.variable} dark`}>
      <body className="font-sans antialiased bg-background text-foreground min-h-screen">
        {children}
      </body>
    </html>
  )
}
