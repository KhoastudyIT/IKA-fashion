import Footer from '@/components/Footer'
import ChatWidget from '@/components/ChatWidget'
import Navigation from '@/components/Navigation'
import { ChatProvider } from '@/components/ChatContext'

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ChatProvider>
      <Navigation />
      {children}
      <Footer />
      <ChatWidget />
    </ChatProvider>
  )
}

