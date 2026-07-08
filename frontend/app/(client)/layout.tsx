import Footer from '@/components/Footer'
import ChatWidget from '@/components/ChatWidget'
import Navigation from '@/components/Navigation'

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      <Navigation />
      {children}
      <Footer />
      <ChatWidget />
    </>
  )
}

