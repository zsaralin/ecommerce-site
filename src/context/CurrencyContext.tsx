'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { currencies } from '../lib/currencies'

export type Currency = {
  label: string
  code: string
  rate: number
  symbol: string
}

const defaultCurrency: Currency = {
  label: 'CAD | CAD$',
  code: 'CAD',
  rate: 1,
  symbol: '$',
}

const CurrencyContext = createContext<{
  currency: Currency
  setCurrency: (currency: Currency) => void
}>({
  currency: defaultCurrency,
  setCurrency: () => {},
})

export const CurrencyProvider = ({ children }: { children: React.ReactNode }) => {
  const [currency, setCurrency] = useState<Currency>(defaultCurrency)

  // Load from localStorage or IP location
  useEffect(() => {
    const saved = localStorage.getItem('currency')
    if (saved) {
      const found = currencies.find((c) => c.code === saved)
      if (found) {
        setCurrency(found)
        return
      }
    }

    // No saved currency: fetch from ipapi.co
    const detectCurrencyByIP = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/')
        const data = await res.json()
        const currencyCode = data.currency

        const matched = currencies.find((c) => c.code === currencyCode)
        if (matched) {
          setCurrency(matched)
        }
      } catch (err) {
        console.warn('IP lookup failed, using default currency')
      }
    }

    detectCurrencyByIP()
  }, [])

  useEffect(() => {
    localStorage.setItem('currency', currency.code)
  }, [currency])

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export const useCurrency = () => useContext(CurrencyContext)
