'use client'

import { useState } from 'react'

export default function FAQ() {
  // Track open state for each dropdown individually
  const [openDropdowns, setOpenDropdowns] = useState<{ [key: string]: boolean }>({
    shipping: false,
    tariffs: false,
  })

  const toggleDropdown = (name: 'shipping' | 'tariffs') => {
    setOpenDropdowns((prev) => ({
      ...prev,
      [name]: !prev[name],
    }))
  }

  return (
    <main className="max-w-3xl mx-auto px-6 py-4">
      <h1 className="text-3xl font-semibold mb-6 py-10">Frequently Asked Questions</h1>

      {/* Shipping Dropdown */}
      <div
        className="mb-4 cursor-pointer select-none"
        onClick={() => toggleDropdown('shipping')}
      >
        <div className="group px-4 py-3 flex justify-between items-center cursor-pointer select-none">
          <h2 className="text-m group-hover:underline" onClick={(e) => e.stopPropagation()}>
            Shipping
          </h2>
          <span>{openDropdowns.shipping ? '−' : '+'}</span>
        </div>

        <div
          className={`overflow-hidden transition-[max-height,opacity] duration-300 border-t text-gray-700 px-4 space-y-4 ${
            openDropdowns.shipping ? 'max-h-[500px] opacity-100 py-6' : 'max-h-0 opacity-0 py-0'
          }`}
          style={{ transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}
          aria-hidden={!openDropdowns.shipping}
        >
          <p className="mt-4">
            <strong>Processing Times</strong>
            <br />
            Please allow 2-4 days for your order to be processed before it ships out. I’m a
            one-person team handling every part of this business myself, and for personalized cases,
            I often have to go out and buy new stickers just for your order. I really appreciate your
            patience and understanding — it means the world to me!
          </p>
          <p>
            <strong>Do you ship internationally?</strong>
            <br />
            Yes, we offer international shipping!
          </p>
          <p>
            <strong>Wrong Address/Address Change</strong>
            <br />
            Please double-check when filling out your shipping information. If you have submitted the
            wrong information please contact us before the order is processed! Once it has been
            processed there can't be any changes. No refunds will be issued for orders sent to the
            wrong address.
          </p>
        </div>
      </div>

      {/* Tariffs Dropdown */}
      <div
        className="mb-4 cursor-pointer select-none"
        onClick={() => toggleDropdown('tariffs')}
      >
        <div className="group px-4 py-3 flex justify-between items-center cursor-pointer select-none">
          <h2 className="text-m group-hover:underline" onClick={(e) => e.stopPropagation()}>
            Tariffs
          </h2>
          <span>{openDropdowns.tariffs ? '−' : '+'}</span>
        </div>
        <div
          className={`overflow-hidden transition-[max-height,opacity] duration-300 border-t text-gray-700 px-4 space-y-2 ${
            openDropdowns.tariffs ? 'max-h-40 opacity-100 py-6' : 'max-h-0 opacity-0 py-0'
          }`}
          style={{ transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}
          aria-hidden={!openDropdowns.tariffs}
        >
          <p className="mt-4">We're based in Canada, but U.S. customers won’t have to pay tariffs or import duties (U.S. de minimis threshold).</p>
        </div>
      </div>
    </main>
  )
}
