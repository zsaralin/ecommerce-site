'use client'

import { useRouter } from 'next/navigation'

export default function Hero() {
  const router = useRouter()

  return (
    <section className="relative h-[50vh] sm:h-[50vh] md:h-[80vh] min-h-[150px] sm:min-h-[250px] md:min-h-[300px] w-full flex items-center justify-center text-white text-center overflow-hidden">
      {/* Responsive background image using <picture> */}
      <picture className="absolute inset-0 -z-10">
        <source
          srcSet="/images/hero.webp"
          media="(min-width: 768px)" // md breakpoint
          type="image/webp"
        />
        <img
          src="/images/hero-mobile.webp"
          alt="Hero background"
          className="w-full h-full object-cover object-top"
          loading="eager"
          aria-hidden="true"
        />
      </picture>

      <div>
        <button
          onClick={() => router.push('/products')}
          className="bg-[#8819ca] text-[#ffe5a9] px-6 py-3 text-sm font-medium rounded-none hover:brightness-110 transition shadow-lg cursor-pointer"
          type="button"
        >
          Shop All
        </button>
      </div>
    </section>
  )
}
