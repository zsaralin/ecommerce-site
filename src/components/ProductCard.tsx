'use client'

import { type Product } from '@/lib/products'
import { useRouter } from 'next/navigation'
import { useCurrency } from '@/context/CurrencyContext'
import { getConvertedPrice } from '@/lib/pricing'

export default function ProductCard({ product }: { product: Product }) {
  const router = useRouter()
  const { currency } = useCurrency()

  const handleClick = () => {
    router.push(`/products/${product.id}`)
  }

  const convertedPrice = getConvertedPrice(product.price, currency)

  return (
    <div
      onClick={handleClick}
      className="p-4 hover:shadow-lg transition cursor-pointer group"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick()
        }
      }}
    >
      {/* Image container with overflow-hidden */}
      <div className="overflow-hidden rounded-md">
        <img
          src={product.image}
          alt={product.name}
          className="rounded-md transform transition-transform duration-300 ease-in-out group-hover:scale-105"
        />
      </div>

      <h2 className="text-xl font-bold mt-2">{product.name}</h2>
      <p className="text-gray-500">
        {currency.symbol}
        {(convertedPrice / 100).toFixed(2)}
      </p>
    </div>
  )
}
