'use client'

import ProductCard from '@/components/ProductCard'
import { products } from '@/lib/products'

export default function ProductsPage() {
  return (
    <main className="max-w-6xl mx-auto px-6 py-12 flex flex-col items-center">
      <h1 className="text-3xl font-semibold mb-8">All Products</h1>

      <section className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </section>
    </main>
  )
}
