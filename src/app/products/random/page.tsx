'use client'

import { useState } from 'react'
import { products } from '@/lib/products'
import { useCart } from '@/context/CartContext'
import { useCurrency } from '@/context/CurrencyContext'
import { getConvertedPrice } from '@/lib/pricing'
import { phoneModels } from '@/lib/phoneModels'
import { useRouter } from 'next/navigation'

export default function RandomPage() {
  const product = products.find((p) => p.id === 'random')
  const { addToCart, clearCart } = useCart()
  const { currency } = useCurrency()
  const router = useRouter()

  const [quantity, setQuantity] = useState(1)
  const [phoneModel, setPhoneModel] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => Math.max(1, prev + delta))
  }

  if (!product) return <div>Product not found.</div>
  const convertedPrice = getConvertedPrice(product.price, currency)

  const handleBuyNow = () => {
    if (!phoneModel) {
      setErrorMessage('Please select your phone model before continuing.')
      return
    }

    setErrorMessage('')
    clearCart()
    addToCart(product, quantity, phoneModel)

    setTimeout(() => {
      router.push('/checkout')
    }, 50)
  }

  const handleAddToCart = () => {
    if (!phoneModel) {
      setErrorMessage('Please select your phone model before continuing.')
      return
    }

    setErrorMessage('')
    addToCart(product, quantity, phoneModel)
  }

  return (
    <main className="max-w-5xl mx-auto p-8">
      <div className="flex flex-col md:flex-row gap-12 items-center">
        {/* IMAGE */}
        <img
          src={product.image}
          alt={product.name}
          className="w-full max-w-md rounded-lg object-cover"
          style={{ flexShrink: 0 }}
        />

        {/* DESCRIPTION & DETAILS */}
        <div className="md:flex-1 space-y-6">
          <h1 className="text-3xl font-bold">{product.name} Case</h1>
          <p className="text-xl text-gray-600">
            {currency.symbol}
            {(convertedPrice / 100).toFixed(2)}
          </p>

          <p className="text-gray-700 text-lg">
            it’s like a blind box — you won’t know exactly what design you’ll get, but I promise it’ll still be cute!
          </p>

          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>every phone case is unique</li>
            <li>stickers are coated in a protective glazing so they never peel or come off</li>
            <li>designed and handcrafted by me!</li>
          </ul>

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

          {/* Error Message */}
          {errorMessage && (
            <div className="text-sm text-[#ffe5a9] bg-[#8819ca] px-4 py-2 rounded shadow-sm">
              {errorMessage}
            </div>
          )}

          {/* Quantity Selector */}
          <div className="flex items-center gap-4">
            <span className="font-medium">Quantity:</span>
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

          {/* Action Buttons */}
          <div className="flex gap-4 mt-4">
            <button
              type="button"
              onClick={handleBuyNow}
              className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800 cursor-pointer"
            >
              Buy Now
            </button>
            <button
              type="button"
              onClick={handleAddToCart}
              className="border border-black text-black px-6 py-2 rounded hover:bg-gray-100 cursor-pointer"
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
