import Footer from '@/components/Footer'
import ChatWidget from '@/components/ChatWidget'
import Navigation from '@/components/Navigation'
import { ChatProvider } from '@/components/ChatContext'
import { ShopProvider } from '@/components/context/ShopContext'
import { SettingsProvider } from '@/components/context/SettingsContext'
import AdminAreaGuard from '@/components/context/AdminAreaGuard'

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    // Guard bọc ngoài cùng: admin bị đẩy về dashboard trước khi ShopProvider kịp
    // gọi API giỏ hàng / wishlist — những endpoint giờ trả 403 với tài khoản admin.
    <AdminAreaGuard>
      <SettingsProvider>
        <ShopProvider>
          <ChatProvider>
            <Navigation />
            {children}
            <Footer />
            <ChatWidget />
          </ChatProvider>
        </ShopProvider>
      </SettingsProvider>
    </AdminAreaGuard>
  )
}

