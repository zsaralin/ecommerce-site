'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronDown } from 'lucide-react'
import { useCurrency } from '@/context/CurrencyContext'
import { currencies, type CurrencyItem } from '../lib/currencies'

type Position = 'top' | 'bottom' | 'left' | 'right' | 'top-right'

interface SimpleCurrencyDropdownProps {
  position?: Position
}

export default function SimpleCurrencyDropdown({ position = 'bottom' }: SimpleCurrencyDropdownProps) {
  const { currency: selectedCurrency, setCurrency: setSelectedCurrency } = useCurrency()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const filteredCurrencies = currencies.filter((currency) =>
    currency.label.toLowerCase().includes(query.toLowerCase())
  )

  // Close dropdown on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', onClick)
    else document.removeEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  // Dropdown positioning classes based on `position` prop, including 'top-right'
  const dropdownPositionClass = {
    top: 'bottom-full mb-1 left-0',
    bottom: 'top-full mt-1 right-0',
    left: 'top-full mt-1 right-full mr-1',
    right: 'top-full mt-1 left-full ml-1',
    'top-right': 'bottom-full mb-1 left-0',
  }[position]

  return (
    <div ref={ref} className="relative inline-block text-xs font-medium">
      <button
        onClick={() => setOpen((o) => !o)}
        className="border px-2 py-1 rounded flex items-center gap-1 hover:bg-gray-200 transition whitespace-nowrap cursor-pointer"
        aria-label="Currency dropdown"
        type="button"
      >
        {selectedCurrency.label}
        <ChevronDown size={12} />
      </button>

      {open && (
        <div
          className={`absolute w-64 bg-white border border-gray-200 rounded shadow-lg max-h-60 overflow-y-auto z-50 ${dropdownPositionClass}`}
        >
          <div className="sticky top-0 bg-white p-2 border-b border-gray-200">
            <input
              type="text"
              placeholder="Search currency..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-400"
              autoFocus
            />
          </div>
          {filteredCurrencies.length > 0 ? (
            filteredCurrencies.map((currency: CurrencyItem) => (
              <div
                key={currency.code}
                onClick={() => {
                  setSelectedCurrency(currency)
                  setOpen(false)
                  setQuery('')
                }}
                className="w-full text-left px-4 py-2 text-sm whitespace-nowrap truncate cursor-pointer hover:bg-gray-100"
                role="option"
              >
                {currency.label}
              </div>
            ))
          ) : (
            <div className="px-4 py-2 text-sm text-gray-500">No results found</div>
          )}
        </div>
      )}
    </div>
  )
}
