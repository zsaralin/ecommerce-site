'use client'

import React, { Suspense, useContext, useEffect, useState } from 'react'
import { CartContext } from '@/context/CartContext'
import { useRouter, useSearchParams } from 'next/navigation'

function SuccessPageContent() {
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
    <main className="flex flex-col items-center justify-center px-4 py-20 text-center">
      <h1 className="text-2xl font-bold mb-4 text-[#1c1c1c]">Thank you for your order!</h1>
      <p className="text-m mb-2 text-gray-700">
        A confirmation email has been sent to your inbox.
      </p>
      <p className="text-sm text-gray-500 mb-6">
        You’ll receive an update when your order is shipped.
      </p>
      <button
        onClick={() => router.push('/')}
        className="px-6 py-3 bg-[#8819ca] text-white rounded font-semibold cursor-pointer hover:bg-[#6e148f] transition"
      >
        Continue Shopping
      </button>
    </main>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SuccessPageContent />
    </Suspense>
  )
}
