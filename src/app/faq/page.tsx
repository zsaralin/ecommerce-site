'use client'
import { useState } from 'react'

export default function FAQ() {
  const [openDropdown, setOpenDropdown] = useState<null | 'tariffs' | 'shipping'>(null)

  const toggleDropdown = (name: 'tariffs' | 'shipping') => {
    setOpenDropdown((prev) => (prev === name ? null : name))
  }

  return (
    <main className="max-w-3xl mx-auto px-6 py-4">
      <h1 className="text-3xl font-semibold mb-6 py-10">Frequently Asked Questions</h1>

      {/* Shipping Dropdown */}
      <div
        className="mb-4 cursor-pointer select-none"
        onClick={() => toggleDropdown('shipping')}
      >
        {/* Added group and hover underline to whole bar */}
        <div className="group px-4 py-3 flex justify-between items-center cursor-pointer select-none">
          <h2
            className="text-m group-hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            Shipping
          </h2>
          <span>{openDropdown === 'shipping' ? '−' : '+'}</span>
        </div>

        <div
          className={`overflow-hidden transition-[max-height,opacity] duration-300 border-t text-gray-700 px-4 space-y-4 ${
            openDropdown === 'shipping' ? 'max-h-[500px] opacity-100 py-6' : 'max-h-0 opacity-0 py-0'
          }`}
          style={{ transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}
          aria-hidden={openDropdown !== 'shipping'}
        >
          {/* Optional: add mt-4 to first paragraph for extra spacing */}
          <p className="mt-4">
            <strong>Processing Times</strong>
            <br />
            Please allow 4–10 days for your order to be processed before it ships out. I’m a
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
        {/* Added group and hover underline to whole bar */}
        <div className="group px-4 py-3 flex justify-between items-center cursor-pointer select-none">
          <h2
            className="text-m group-hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            Tariffs
          </h2>
          <span>{openDropdown === 'tariffs' ? '−' : '+'}</span>
        </div>
        <div
          className={`overflow-hidden transition-[max-height,opacity] duration-300 border-t text-gray-700 px-4 space-y-2 ${
            openDropdown === 'tariffs' ? 'max-h-40 opacity-100 py-6' : 'max-h-0 opacity-0 py-0'
          }`}
          style={{ transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}
          aria-hidden={openDropdown !== 'tariffs'}
        >
          <p className="mt-4">US Customers will not be affected by tariffs.</p>
        </div>
      </div>
    </main>
  )
}
