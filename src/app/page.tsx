import Hero from '@/components/Hero'
import ProductCard from '@/components/ProductCard'
import { products } from '@/lib/products'

export default function Home() {
  return (
<main className="">
      <Hero />

      <section id="products" className="w-full px-6 py-12 max-w-6xl">
        <h2 className="text-2xl font-semibold mb-6">All Products</h2>
        <div className="w-full grid grid-cols-1 min-[360px]:grid-cols-2 md:grid-cols-3 gap-6">

          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </main>
  )
}
