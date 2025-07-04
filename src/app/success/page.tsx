'use client'

import { useContext, useEffect, useState } from 'react'
import { CartContext } from '@/context/CartContext'
import { useRouter, useSearchParams } from 'next/navigation'

export default function SuccessPage() {
  const context = useContext(CartContext)
  const router = useRouter()
  const searchParams = useSearchParams()
  const [hasCleared, setHasCleared] = useState(false)

  useEffect(() => {
    if (!context) {
      throw new Error('CartContext is missing. Make sure CartProvider wraps your app.')
    }

    if (!searchParams || hasCleared) return

    const sessionId = searchParams.get('session_id')

    if (sessionId) {
      context.clearCart()
      setHasCleared(true)
    }
  }, [context, searchParams, hasCleared])

  return (
    <main className="flex flex-col items-center justify-center px-4 py-15">
      <h1 className="text-3xl font-bold mb-4">Payment Successful!</h1>
      <p className="mb-6">Thank you for your purchase.</p>
      <button
        onClick={() => router.push('/')}
        className="px-6 py-3 bg-[#8819ca] text-white rounded font-semibold cursor-pointer hover:bg-[#6e148f] transition"
      >
        Continue Shopping
      </button>
    </main>
  )
}
