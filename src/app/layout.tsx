'use client'

import './globals.css'
import { Inter } from 'next/font/google'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { CartProvider } from '@/context/CartContext'
import { CurrencyProvider } from '@/context/CurrencyContext'
import PageTransition from '@/components/PageTransition'
import { AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <html lang="en">
      <body >
        <CurrencyProvider>
          <CartProvider>
            <Navbar />

            <main className="flex-grow">
              <AnimatePresence mode="wait" initial={false}>
                {/* Key by pathname so Framer Motion knows when children change */}
                <PageTransition key={pathname}>
                  {children}
                </PageTransition>
              </AnimatePresence>
            </main>

            <Footer />
          </CartProvider>
        </CurrencyProvider>
      </body>
    </html>
  )
}
