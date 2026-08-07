import Footer from '@/components/Footer'
import ChatWidget from '@/components/ChatWidget'
import Navigation from '@/components/Navigation'
import { ChatProvider } from '@/components/ChatContext'
import { ShopProvider } from '@/components/context/ShopContext'

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ShopProvider>
      <ChatProvider>
        <Navigation />
        {children}
        <Footer />
        <ChatWidget />
      </ChatProvider>
    </ShopProvider>
  )
}

