'use client'

import { useRouter } from 'next/navigation'

export default function Hero() {
  const router = useRouter()

  return (
    <section
      className="
      max-w-screen
        relative
        h-[50vh] sm:h-[50vh] md:h-[80vh] 
        min-h-[150px] sm:min-h-[250px] md:min-h-[300px]
        w-full
        bg-fixed bg-center bg-cover bg-no-repeat
        bg-[url('/images/hero.png')]
        flex items-center justify-center
        text-white text-center
      "
    >
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
