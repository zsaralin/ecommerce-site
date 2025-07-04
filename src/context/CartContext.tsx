'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import type { Product } from '@/lib/products'

export type CartItem = Product & {
  quantity: number
  size?: string
  description?: string // ✅ New field for personalized items
}

export const CartContext = createContext<{
  items: CartItem[]
  addToCart: (
    product: Product,
    quantity?: number,
    size?: string,
    options?: { description?: string }
  ) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
updateItem: (item: CartItem, updates: Partial<CartItem>) => void
  clearCart: () => void
  totalItems: number
  totalPrice: number
} | undefined>(undefined)


export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [initialized, setInitialized] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid)
        try {
          const docRef = doc(db, 'carts', user.uid)
          const snap = await getDoc(docRef)
          const firestoreItems: CartItem[] =
            snap.exists() && snap.data().items ? snap.data().items : []

          // Load guest cart
          let localItems: CartItem[] = []
          const saved = localStorage.getItem('cart')
          if (saved) {
            try {
              localItems = JSON.parse(saved)
            } catch {
              localItems = []
            }
          }

          // Merge logic using id + size + description as key
          const mergedItemsMap = new Map<string, CartItem>()
          ;[...firestoreItems, ...localItems].forEach((item) => {
            const key = `${item.id}_${item.size ?? ''}_${item.description ?? ''}`
            if (mergedItemsMap.has(key)) {
              const existing = mergedItemsMap.get(key)!
              mergedItemsMap.set(key, {
                ...item,
                quantity: existing.quantity + item.quantity,
              })
            } else {
              mergedItemsMap.set(key, item)
            }
          })

          const mergedItems = Array.from(mergedItemsMap.values())
          await setDoc(docRef, { items: mergedItems }, { merge: true })
          localStorage.removeItem('cart')
          setItems(mergedItems)
        } catch (err) {
          console.error('Failed to load or merge cart on login:', err)
          setItems([])
        }
      } else {
        setUserId(null)
        const saved = localStorage.getItem('cart')
        if (saved) {
          try {
            setItems(JSON.parse(saved))
          } catch {
            localStorage.removeItem('cart')
            setItems([])
          }
        } else {
          setItems([])
        }
      }
      setInitialized(true)
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (!initialized) return

    if (userId) {
      const ref = doc(db, 'carts', userId)
      setDoc(ref, { items }, { merge: true })
        .then(() => console.log('[Cart] saved to Firestore:', items))
        .catch((err) => console.error('[Cart] failed saving:', err))
    } else {
      try {
        localStorage.setItem('cart', JSON.stringify(items))
        console.log('[Cart] saved to localStorage:', items)
      } catch (e) {
        console.error('[Cart] failed to save to localStorage:', e)
      }
    }
  }, [items, initialized, userId])

  function addToCart(
    product: Product,
    quantity = 1,
    size?: string,
    options?: { description?: string }
  ) {
    const description = options?.description?.trim()

    setItems((currItems) => {
      const existing = currItems.find(
        (i) =>
          i.id === product.id &&
          i.size === size &&
          i.description === description
      )

      if (existing) {
        return currItems.map((i) =>
          i === existing ? { ...i, quantity: i.quantity + quantity } : i
        )
      } else {
        return [...currItems, { ...product, quantity, size, description }]
      }
    })
  }

  function removeFromCart(productId: string) {
    setItems((currItems) => currItems.filter((i) => i.id !== productId))
  }

  function updateQuantity(productId: string, quantity: number) {
    if (quantity < 1) return
    setItems((currItems) =>
      currItems.map((i) => (i.id === productId ? { ...i, quantity } : i))
    )
  }
function updateItem(item: CartItem, updates: Partial<CartItem>) {
  setItems((currItems) =>
    currItems.map((i) =>
      i.id === item.id &&
      i.size === item.size &&
      i.description === item.description
        ? { ...i, ...updates }
        : i
    )
  )
}
  function clearCart() {
    setItems([])
    if (!userId) {
      localStorage.removeItem('cart')
    }
  }

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )

  return (
 <CartContext.Provider
  value={{
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    updateItem, // ✅ include this
    clearCart,
    totalItems,
    totalPrice,
  }}
>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used within CartProvider')
  return context
}
