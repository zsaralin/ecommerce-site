'use client'

import { useRouter } from 'next/navigation'

export default function Hero() {
  const router = useRouter()

  return (
    <section
      className="
        relative
        h-[50vh] sm:h-[50vh] md:h-[80vh]
        min-h-[150px] sm:min-h-[250px] md:min-h-[300px]
        w-full
        bg-center bg-no-repeat
        bg-[url('/images/hero.png')]
        bg-cover
        bg-scroll md:bg-fixed
        
        flex items-center justify-center
        text-white text-center
      "
      style={{
        backgroundPosition: 'center top', // Shift visible area on mobile to top center
      }}
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
