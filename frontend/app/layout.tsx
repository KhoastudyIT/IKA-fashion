import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Playfair_Display, Inter } from 'next/font/google'
import './globals.css'
import { UIProvider } from '@/components/context/UIDialogContext'

const playfair = Playfair_Display({ 
  subsets: ['latin'],
  variable: '--font-heading',
  weight: ['400', '500', '600', '700'],
})
const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: 'IKA - Luxury Fashion',
  description: 'Discover premium fashion collection by IKA. Luxury handbags, dresses, and accessories crafted with elegance.',
  keywords: ['fashion', 'luxury', 'handbags', 'designer', 'premium'],
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#FAF7F2',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable} bg-background`}>
      <body className="font-sans antialiased text-foreground">
        {/* Bọc ở layout GỐC để cả khu khách và khu quản trị cùng dùng được
            thông báo / hộp thoại của website, thay cho alert-confirm-prompt
            của trình duyệt. */}
        <UIProvider>
          {children}
        </UIProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
