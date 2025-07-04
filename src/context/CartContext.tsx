'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import type { Product } from '@/lib/products'
import { saveCartToFirebase, loadCartFromFirebase } from '@/lib/firebaseCart'

export type CartItem = Product & {
  quantity: number
  size?: string
  description?: string
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
  const [userId, setUserId] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
const itemsRef = React.useRef<CartItem[]>([])

useEffect(() => {
  itemsRef.current = items
}, [items])

useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (user) {
      setUserId(user.uid)
      setIsInitialized(false)
      setIsLoading(true)

      try {
        const firestoreItems = (await loadCartFromFirebase(user.uid)) ?? []

        // Merge local items from ref with Firestore cart
        const localItems = itemsRef.current

        if (localItems.length === 0) {
          setItems(firestoreItems)
        } else {
          const mergedItems = [...firestoreItems]

          localItems.forEach((localItem) => {
            if (localItem.description) {
              // Personalized case: add separately
              mergedItems.push(localItem)
            } else {
              // Non-personalized: merge quantity if same id and size and no description
              const existingIndex = mergedItems.findIndex(
                (item) =>
                  item.id === localItem.id &&
                  item.size === localItem.size &&
                  !item.description
              )
              if (existingIndex !== -1) {
                mergedItems[existingIndex] = {
                  ...mergedItems[existingIndex],
                  quantity: mergedItems[existingIndex].quantity + localItem.quantity,
                }
              } else {
                mergedItems.push(localItem)
              }
            }
          })

          setItems(mergedItems)
        }
      } catch (err) {
        console.error('[Cart] Failed to fetch Firestore cart:', err)
        setItems([])
      } finally {
        setIsInitialized(true)
        setIsLoading(false)
      }
    } else {
      setUserId(null)
      setIsInitialized(false)
      setIsLoading(false)
      setItems([]) // Clear cart on logout
    }
  })

  return () => unsubscribe()
}, [])

  useEffect(() => {
    if (!userId || !isInitialized || isLoading) return

    console.log('hey, ', items)
    saveCartToFirebase(userId, items)
      .then(() => console.log('[Cart] Saved to Firestore:', items))
      .catch((err) => console.error('[Cart] Failed to save to Firestore:', err))
  }, [items, userId, isInitialized, isLoading])

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
      // Build new item WITHOUT description if undefined or empty
      const newItem: CartItem = { ...product, quantity }
      if (size) newItem.size = size
      if (description) newItem.description = description // only add if truthy

      return [...currItems, newItem]
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
  }

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        updateItem,
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
