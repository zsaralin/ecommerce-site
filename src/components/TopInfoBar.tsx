'use client'

import { ChevronLeft, ChevronRight, Instagram } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useCurrency } from '@/context/CurrencyContext'
import CurrencyDropdown from './CurrencyDropdown'

const messages = [
  'every case is unique and handmade',
  'the first durable sticker case',
]

export default function TopInfoBar() {
  const [index, setIndex] = useState(0)
  const [fadeDirection, setFadeDirection] = useState<'left' | 'right'>('right')
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  function resetTimer() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      setFadeDirection('right')
      setIndex((prev) => (prev + 1) % messages.length)
    }, 4000)
  }

  useEffect(() => {
    resetTimer()
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  useEffect(() => {
    resetTimer()
  }, [index])

  const handlePrev = () => {
    setFadeDirection('left')
    setIndex((prev) => (prev - 1 + messages.length) % messages.length)
  }

  const handleNext = () => {
    setFadeDirection('right')
    setIndex((prev) => (prev + 1) % messages.length)
  }

  return (
<div className="top-info-bar text-xs px-4 py-2 flex justify-center items-center relative">

      {/* Instagram icon link */}
      {/* <a
        href="https://www.instagram.com/coconutbuncases"
        target="_blank"
        rel="noopener noreferrer"
        className="hidden md:block absolute left-12 top-1/2 -translate-y-1/2 hover:text-black"
        aria-label="Visit our Instagram"
      >
        <Instagram size={18} />
      </a> */}

      {/* Left arrow */}
      <button
        onClick={handlePrev}
        className="absolute left-10 -translate-x-full cursor-pointer md:left-[30%] md:translate-x-0 hover:text-black"
        aria-label="Previous message"
      >
        <ChevronLeft size={16} />
      </button>

      {/* Message */}
      <div
        key={index}
        className={`px-6 transition-opacity duration-500 ease-in-out opacity-100 ${
          fadeDirection === 'right' ? 'animate-fadeInRight' : 'animate-fadeInLeft'
        }`}
      >
        {messages[index]}
      </div>

      {/* Right arrow */}
      <button
        onClick={handleNext}
        className="absolute right-10 translate-x-full cursor-pointer md:right-[30%] md:translate-x-0 hover:text-black"
        aria-label="Next message"
      >
        <ChevronRight size={16} />
      </button>

      {/* Currency dropdown */}
      <div className="hidden md:block absolute right-12 top-1/2 -translate-y-1/2 z-50">
        <CurrencyDropdown />
      </div>

      <style jsx>{`
        @keyframes fadeInRight {
          0% {
            opacity: 0;
            transform: translateX(20px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes fadeInLeft {
          0% {
            opacity: 0;
            transform: translateX(-20px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-fadeInRight {
          animation: fadeInRight 1s forwards;
        }
        .animate-fadeInLeft {
          animation: fadeInLeft 1s forwards;
        }
      `}</style>
    </div>
  )
}
