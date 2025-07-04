'use client'

import { useContext, useState } from 'react'
import { CartContext, CartItem, useCart } from '@/context/CartContext'
import { useCurrency } from '@/context/CurrencyContext'
import { useRouter } from 'next/navigation'
import { getConvertedPrice } from '@/lib/pricing'
import { Trash2 } from 'lucide-react'
import Link from 'next/link'

export default function CartPage() {
  const context = useContext(CartContext)
  const { currency } = useCurrency()
  const router = useRouter()
  const { items, updateItem, updateQuantity, removeFromCart } = useCart()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({})
  const [editingNotes, setEditingNotes] = useState<Record<string, boolean>>({})
  const [editingTexts, setEditingTexts] = useState<Record<string, string>>({})

  if (!context) {
    throw new Error('CartContext is missing. Make sure CartProvider wraps your app.')
  }

  if (items.length === 0) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4 py-20">
        <h1 className="text-3xl font-bold mb-6">Your Cart</h1>
        <p className="text-lg text-gray-600">Your cart is empty now.</p>
      </main>
    )
  }

  const totalPriceCents = items.reduce(
    (sum, item) => sum + getConvertedPrice(item.price, currency) * item.quantity,
    0
  )

  const handleCheckout = () => {
    router.push('/checkout')
  }

  return (
    <main className="min-h-screen px-4 py-20 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">Your Cart</h1>

      <ul className="space-y-4">
        {items.map((item: CartItem) => {
          const { id, image, name, price, quantity, size, description = '' } = item
          const isExpanded = expandedNotes[id]
          const isEditing = editingNotes[id]
          const tempText = editingTexts[id] ?? description
  const uniqueKey = `${item.id}_${item.size ?? ''}_${item.description ?? ''}`

          return (
            <li key={uniqueKey} className="flex items-center justify-between p-4 ">
              <div className="flex items-center gap-4 min-w-0 w-full">
                {/* Image */}
                <img
                  src={image}
                  alt={name}
                  className="w-20 h-20 object-cover rounded flex-shrink-0"
                />

                {/* Content wrapper */}
                <div className="flex flex-col w-full min-w-0 flex-grow">
                  <Link href={`/products/${id}`}>
                    <h2 className="text-lg font-semibold hover:underline cursor-pointer truncate">
                      {name}
                    </h2>
                  </Link>
                  <p className="text-sm text-gray-500">{size || 'N/A'}</p>

                  {description && (
                    <div className="text-sm text-gray-600 mt-1 min-w-0 w-full">
                      {!isEditing ? (
                        <>
                          <p className="truncate" style={{ maxWidth: '100%' }}>
                            {isExpanded || description.length < 60
                              ? description
                              : `${description.slice(0, 60)}...`}
                          </p>
                          <button
                            onClick={() => {
                              setEditingNotes((prev) => ({ ...prev, [id]: true }))
                              setEditingTexts((prev) => ({ ...prev, [id]: description }))
                            }}
                            className="text-xs text-gray-500  hover:underline cursor-pointer"
                          >
                            Edit
                          </button>
                        </>
                      ) : (
                        <div className="flex flex-col mt-1 w-full min-w-0">
                          <textarea
                            value={tempText}
                            onChange={(e) =>
                              setEditingTexts((prev) => ({ ...prev, [id]: e.target.value }))
                            }
                            rows={3}
                            className="border border-gray-300 rounded p-2 text-sm resize-none w-full block min-w-0"
                          />
                          <div className="flex gap-2 mt-1">
                            <button
                              onClick={() => {
                                updateItem(item, { description: tempText })
                                setEditingNotes((prev) => ({ ...prev, [id]: false }))
                              }}
                              className="text-sm text-gray-500 hover:underline cursor-pointer"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => {
                                setEditingNotes((prev) => ({ ...prev, [id]: false }))
                                setEditingTexts((prev) => {
                                  const copy = { ...prev }
                                  delete copy[id]
                                  return copy
                                })
                              }}
                              className="text-sm text-gray-500 hover:underline cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <p className="text-gray-600 mt-2">
                    {currency.symbol}
                    {(getConvertedPrice(price, currency) / 100).toFixed(2)} × {quantity} ={' '}
                    {currency.symbol}
                    {((getConvertedPrice(price, currency) * quantity) / 100).toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Quantity and remove buttons */}
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => updateQuantity(id, quantity - 1)}
                  disabled={quantity <= 1}
                  className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 cursor-pointer"
                >
                  -
                </button>
                <span>{quantity}</span>
                <button
                  onClick={() => updateQuantity(id, quantity + 1)}
                  className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 cursor-pointer"
                >
                  +
                </button>
                <button
                  onClick={() => removeFromCart(id)}
                  className="ml-4 text-gray-500 hover:text-gray-700 cursor-pointer"
                  title="Remove item"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </li>
          )
        })}
      </ul>

      <div className="mt-8 text-right text-xl font-semibold">
        Total: {currency.symbol}
        {(totalPriceCents / 100).toFixed(2)} {currency.code} 
      </div>

      <p className="mt-2 text-right text-gray-600 text-sm">
        Taxes, discounts and shipping calculated at checkout.
      </p>

      <div className="mt-6 flex justify-end gap-4">
        <button
          onClick={handleCheckout}
          disabled={loading}
          className="bg-[#8819ca] text-white px-6 py-3 rounded cursor-pointer hover:bg-[#7515b1] transition disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Check out'}
        </button>

        <button
          onClick={() => (window.location.href = '/')}
          className="border border-gray-600 text-gray-600 px-6 py-3 rounded cursor-pointer hover:bg-gray-100 transition"
        >
          Continue shopping
        </button>
      </div>

      {error && <p className="mt-4 text-red-600 text-right">{error}</p>}
    </main>
  )
}
