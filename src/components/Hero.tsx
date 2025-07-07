'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Hero() {
  const router = useRouter()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile() // Initial run
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const bgImage = isMobile
    ? "/images/hero-mobile.webp"
    : "/images/hero.webp"

  return (
    <section
      className={`
        relative
        h-[50vh] sm:h-[50vh] md:h-[80vh]
        min-h-[150px] sm:min-h-[250px] md:min-h-[300px]
        w-full
        flex items-center justify-center
        text-white text-center
        bg-no-repeat bg-cover bg-center
        ${isMobile ? '' : 'bg-fixed'}
      `}
      style={{
        backgroundImage: `url('${bgImage}')`,
        backgroundPosition: isMobile ? 'center top' : 'center center',
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
