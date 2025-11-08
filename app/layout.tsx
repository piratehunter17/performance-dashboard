import { Inter, Space_Mono } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

// Configure the Space Mono font for the application
const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-space-mono',
})

export const metadata = {
  title: 'High-Performance Dashboard',
  description: 'Built with Next.js and Canvas',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // Apply the configured font class to the document body
    <html lang="en">
      <body className={spaceMono.className}>{children}</body>
    </html>
  )
}