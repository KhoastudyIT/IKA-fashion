'use client'

import Navigation from '@/components/Navigation'
import { useState } from 'react'
import { Mail, Phone, MapPin } from 'lucide-react'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submitted:', formData)
    setSubmitted(true)
    setFormData({ name: '', email: '', subject: '', message: '' })
    setTimeout(() => setSubmitted(false), 5000)
  }

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-background">
        {/* Page Header */}
        <div className="px-4 sm:px-6 lg:px-8 py-12 border-b border-border">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl font-heading font-semibold text-foreground mb-4">Liên Hệ Chúng Tôi</h1>
            <p className="text-lg text-muted-foreground">Chúng tôi rất muốn nghe từ bạn</p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-heading font-semibold text-foreground mb-8">Liên Lạc Với Chúng Tôi</h2>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <Mail className="w-5 h-5 text-accent flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-heading font-semibold text-foreground mb-1">Email</h3>
                      <p className="text-muted-foreground">hello@ikafashion.com</p>
                      <p className="text-muted-foreground text-sm">Chúng tôi sẽ phản hồi trong 24 giờ</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Phone className="w-5 h-5 text-accent flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-heading font-semibold text-foreground mb-1">Điện Thoại</h3>
                      <p className="text-muted-foreground">+84 (0) 123 456 789</p>
                      <p className="text-muted-foreground text-sm">Thứ 2 - Thứ 6, 9 AM - 6 PM</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <MapPin className="w-5 h-5 text-accent flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-heading font-semibold text-foreground mb-1">Thăm Chúng Tôi</h3>
                      <p className="text-muted-foreground">123 Phố Thời Trang</p>
                      <p className="text-muted-foreground">Hà Nội, Việt Nam</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hours */}
              <div className="bg-secondary rounded p-6">
                <h3 className="font-heading font-semibold text-foreground mb-4">Giờ Làm Việc</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Thứ 2 - Thứ 6</span>
                    <span>9 AM - 6 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Thứ 7</span>
                    <span>10 AM - 4 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Chủ Nhật</span>
                    <span>Đóng Cửa</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div>
              {submitted ? (
                <div className="bg-accent/20 border border-accent rounded p-6 text-center">
                  <p className="text-accent font-medium mb-2">Cảm ơn đã liên hệ!</p>
                  <p className="text-muted-foreground text-sm">
                    Chúng tôi đã nhận được tin nhắn của bạn và sẽ phản hồi sớm.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                      Tên
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 bg-secondary border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                      Email
                    </label> 
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 bg-secondary border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-foreground mb-2">
                      Tiêu Đề
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 bg-secondary border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                      Tin Nhắn
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={6}
                      className="w-full px-4 py-2 bg-secondary border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-accent resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full px-6 py-3 bg-foreground text-primary-foreground font-medium rounded hover:opacity-90 transition-opacity"
                  >
                    Gửi Tin Nhắn
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
