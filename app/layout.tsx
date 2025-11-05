import { Inter, Space_Mono } from 'next/font/google' // 1. Import Space_Mono
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

// 2. Configure the font
const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-space-mono', // Optional, but good practice
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
    // 3. Add the font's class name to the body
    <html lang="en">
      <body className={spaceMono.className}>{children}</body>
    </html>
  )
}