'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingCart, User, LogOut, Menu } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth'
import { auth } from '@/lib/firebase'

export default function MainNav() {
  const { totalItems } = useCart()
  const router = useRouter()
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [open, setOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }

      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    await signOut(auth)
    setOpen(false)
    router.push('/')
  }

  const handleUserClick = () => {
    if (!user) {
      router.push('/login')
    } else {
      setOpen((prev) => !prev)
    }
  }

  const textColor = '#ffe5a9'

  return (
    <nav
className="main-nav px-4 py-0 md:px-6 md:pt-6 md:pb-4 flex flex-col items-center"
      style={{ backgroundColor: '#8819ca', color: textColor }}
    >
      {/* Top bar */}
      <div className="w-full max-w-7xl relative h-[100px] flex items-center justify-center px-4">
        {/* Hamburger (mobile only) */}
        <div className="absolute left-0 flex md:hidden z-50 " ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Open menu"
            className="text-white hover:scale-110 transition  cursor-pointer"
          >
            <Menu className="w-7 h-7" />
          </button>
      {menuOpen && (
        <div
          className="absolute top-10 left-0 flex flex-col py-1 z-50 animate-dropdown origin-top-left rounded-md shadow-lg border"
          style={{ backgroundColor: "var(--color-background)" }}
        >
          {[
            { label: 'Shop All', path: '/products' },
            { label: 'FAQ', path: '/faq' },
            { label: 'Contact', path: '/contact' },
          ].map(({ label, path }) => (
            <button
              key={label}
              onClick={() => {
                router.push(path)
                setMenuOpen(false)
              }}
              className="px-4 py-2 text-sm text-left hover:underline whitespace-nowrap  cursor-pointer"
              style={{ color: "var(--color-foreground)" }}
            >
              {label}
            </button>
          ))}
        </div>
      )}
        </div>

        {/* Centered title */}
        <h1
          onClick={() => router.push('/')}
          className="absolute left-1/2 -translate-x-1/2 cursor-pointer text-center"
          style={{
            fontFamily: 'Polaroid',
            fontSize: 'clamp(1.9rem, 5vw, 3.2rem)',
            whiteSpace: 'nowrap',
            padding: '0.5rem 1.5rem',
            color: textColor,
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              router.push('/')
            }
          }}
        >
          coconut bun cases
        </h1>

        {/* Right icons */}
        <div className="absolute right-0 flex items-center gap-4 pr-1">
          {/* Cart Button */}
          <button
            type="button"
            onClick={() => router.push('/cart')}
            aria-label="Go to cart"
            className="cursor-pointer transition-transform duration-200 ease-in-out hover:scale-110"
            style={{ color: textColor }}
          >
            <div className="relative flex items-center gap-2">
              <ShoppingCart className="w-6 h-6" />
              {totalItems > 0 && (
                <span
                  className="absolute -bottom-1 -right-1 text-[10px] px-1.5 py-[2px] font-semibold text-black bg-white rounded-full leading-none flex items-center justify-center"
                  style={{ minWidth: '.8rem', height: '.8rem' }}
                >
                  {totalItems}
                </span>
              )}
            </div>
          </button>

          {/* User Button */}
          <div ref={dropdownRef} className="relative">
            <button
              type="button"
              onClick={handleUserClick}
              aria-label={user ? 'User menu' : 'Go to login'}
              className="cursor-pointer p-1 rounded-full hover:bg-white/20 transition-transform duration-200 ease-in-out hover:scale-110"
              style={{ color: textColor }}
            >
              <User className="w-6 h-6" />
            </button>

            {open && user && (
  <div className="absolute right-0 mt-2 w-48 bg-[#8819ca] shadow-lg z-50 backdrop-blur-md ">
<button
  onClick={handleSignOut}
  className="flex items-center gap-2 px-4 py-2 w-full text-left rounded bg-[var(--color-background)] text-[#6f14a8] transition cursor-pointer"
>
  <LogOut className="w-4 h-4" />
  Sign Out
</button>
  </div>
)}
          </div>
        </div>
      </div>

      {/* Desktop nav links */}
      <div className="gap-6 mt-3 hidden md:flex flex-wrap justify-center">
        {[
          { label: 'Shop All', path: '/products' },
          { label: 'FAQ', path: '/faq' },
          { label: 'Contact', path: '/contact' },
        ].map(({ label, path }) => (
          <button
            key={label}
            onClick={() => router.push(path)}
            className="cursor-pointer hover:underline transition text-sm"
            style={{ background: 'none', color: textColor }}
          >
            {label}
          </button>
        ))}
      </div>
    </nav>
  )
}
