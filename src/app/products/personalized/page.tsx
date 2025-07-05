'use client'

import { useState } from 'react'
import { products } from '@/lib/products'
import { useCart } from '@/context/CartContext'
import { useCurrency } from '@/context/CurrencyContext'
import { getConvertedPrice } from '@/lib/pricing'
import {phoneModels} from '@/lib/phoneModels'
import { useRouter } from 'next/navigation'

export default function PersonalizedPage() {
  const product = products.find((p) => p.id === 'personalized')
  const { addToCart, clearCart } = useCart()
  const { currency } = useCurrency()
const router = useRouter()

  const [quantity, setQuantity] = useState(1)
  const [phoneModel, setPhoneModel] = useState('')
  const [vibeInput, setVibeInput] = useState('')

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => Math.max(1, prev + delta))
  }

  if (!product) return <div>Product not found.</div>

  const convertedPrice = getConvertedPrice(product.price, currency)

const handleBuyNow = () => {
  if (!phoneModel || !vibeInput.trim()) return

  clearCart()
  addToCart(product, quantity, phoneModel, { description: vibeInput })

  setTimeout(() => {
    router.push('/checkout')
  }, 50)
}
  return (
    <div className="p-6 lg:p-12 max-w-6xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-10 items-start">
        {/* IMAGE */}
        <div className="w-full lg:w-1/2 flex justify-center">
          <div className="w-full max-w-md lg:aspect-[3/4] relative">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-auto object-contain rounded-lg shadow-md"
            />
          </div>
        </div>

        {/* CONTENT */}
        <div className="w-full lg:w-1/2 space-y-6">
          <h1 className="text-3xl font-bold">{product.name} Case</h1>
          <p className="text-xl text-gray-600">
            {currency.symbol}
            {(convertedPrice / 100).toFixed(2)}
          </p>

          <ul className="list-disc list-inside text-gray-700 space-y-1">
            <li>every phone case is one-of-a-kind</li>
            <li>stickers are sealed in protective glazing — they’ll never peel or fall off</li>
            <li>designed and handcrafted by me</li>
            <li>made-to-order just for you (or your bestie)</li>
          </ul>

          <p className="text-md text-gray-800">
  Share anything that captures your universe: comfort foods, niche obsessions, dream aesthetics,
  fav characters… I’ll do my best to bottle that magic into a phone case.
          </p>

          {/* VIBE INPUT */}
          <div>
            <label className="block mb-1 font-medium">tell me about you</label>
            <textarea
              required
              maxLength={1000} // ✅ Limit to 1000 characters
              value={vibeInput}
              onChange={(e) => setVibeInput(e.target.value)}
              placeholder="e.g. I love sushi, Studio Ghibli, roller skating, and pink sparkly vibes"
              className="w-full border border-gray-400 rounded p-3 bg-transparent min-h-[100px]"
            />
          </div>

          {/* Phone Model Selector */}
          <div className="flex flex-col gap-1">
            <label htmlFor="phone-model" className="font-medium">
              select your phone model:
            </label>
            <select
              id="phone-model"
              value={phoneModel}
              onChange={(e) => setPhoneModel(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2"
            >
              <option value="" disabled>
                Select a model
              </option>
              {phoneModels.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          </div>

          {/* QUANTITY SELECTOR */}
          <div className="flex items-center gap-4">
            <span className="font-medium">quantity:</span>
            <div className="flex items-center border rounded px-2">
              <button
                type="button"
                onClick={() => handleQuantityChange(-1)}
                className="px-2 text-lg disabled:opacity-50 cursor-pointer"
                disabled={quantity <= 1}
              >
                −
              </button>
              <input
                type="text"
                value={quantity}
                readOnly
                className="w-10 text-center border-none focus:outline-none bg-transparent"
              />
              <button
                type="button"
                onClick={() => handleQuantityChange(1)}
                className="px-2 text-lg cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="mt-6 flex flex-wrap gap-4">
            <button
              type="button"
              onClick={handleBuyNow}
              disabled={!phoneModel || !vibeInput.trim()}
              className="bg-black text-white px-6 py-2 rounded shadow-md hover:bg-gray-800 transition cursor-pointer disabled:opacity-40"
            >
              Buy Now
            </button>
            <button
              type="button"
              onClick={() => addToCart(product, quantity, phoneModel, { description: vibeInput })}
              disabled={!phoneModel || !vibeInput.trim()}
              className="border border-black text-black px-6 py-2 rounded shadow-md hover:bg-gray-100 transition cursor-pointer disabled:opacity-40"
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
