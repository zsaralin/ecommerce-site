'use client'

import { useContext, useState, useEffect } from 'react'
import { CartContext, CartItem } from '@/context/CartContext'
import { useCurrency } from '@/context/CurrencyContext'
import { getNames, getCode } from 'country-list'
import { getConvertedPrice } from '@/lib/pricing'
import { db } from '@/lib/firebase'
import { collection, addDoc, Timestamp } from 'firebase/firestore'
import { v4 as uuidv4 } from 'uuid'
import CountrySelect from '@/components/CountrySelect'
import { SHIPPING_METHODS, getShippingOptions } from '@/lib/shipping'

export default function DeliveryPage() {
  const context = useContext(CartContext)
  const { currency } = useCurrency()

  const [form, setForm] = useState({
    country: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    apartment: '',
    city: '',
    state : '',
    postalCode: '',
  })

const PROMO_CODES = {
  SAVE25: 25,      // 10% off
  // SAVE20: 20,      // 20% off
  // FREESHIP: 'FREESHIP',
} as const

type PromoCodeKey = keyof typeof PROMO_CODES

  const [promoCode, setPromoCode] = useState<string>('')
  const [appliedPromo, setAppliedPromo] = useState<PromoCodeKey | null>(null)
  const [promoError, setPromoError] = useState<string>('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!context) throw new Error('CartContext is missing')
  const { items } = context

const [selectedShipping, setSelectedShipping] = useState<string | null>(null)
useEffect(() => {
  if (shippingOptions.length > 0) {
    setSelectedShipping(shippingOptions[0].name)
  }
}, [form.country, items])
  const countrySelected = form.country !== ''
const shippingOptions = countrySelected ? getShippingOptions(form.country, items) : []

const shippingMethod = shippingOptions.find(
  option => option.name === selectedShipping
) || shippingOptions[0]
const shippingCostCents = countrySelected
  ? Math.round(getConvertedPrice(shippingMethod.cost, currency) / 100) * 100
  : 0
  const itemsTotalCents = items.reduce(
    (sum, item) => sum + getConvertedPrice(item.price, currency) * item.quantity,
    0
  )
  // Apply promo code discount if any
  let discountCents = 0
  if (appliedPromo) {
    const promoVal = PROMO_CODES[appliedPromo]
    if (typeof promoVal === 'number') {
      // Percent discount on items total
      discountCents = Math.round((itemsTotalCents * promoVal) / 100)
    }
    // For FREESHIP promo you can handle shipping discount here (not implemented)
  }
const grandTotalCents = itemsTotalCents - discountCents + shippingCostCents

  
  const countries = getNames()

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }
const handlePromoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPromoCode(e.target.value.toUpperCase())
    setPromoError('')
  }

  const applyPromo = () => {
    const code = promoCode.toUpperCase() as PromoCodeKey
    if (appliedPromo) {
      setPromoError('Only one promo code can be applied.')
      return
    }
    if (!(code in PROMO_CODES)) {
      setPromoError('Promo code does not exist.')
      return
    }
    setAppliedPromo(code)
    setPromoError('')
  }

  const removePromo = () => {
    setAppliedPromo(null)
    setPromoCode('')
    setPromoError('')
  }
  // Helper to truncate description text
  function truncate(text: string, maxLength: number) {
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength) + '...'
  }
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setLoading(true)
  setError('')
if (
  !form.country ||
  !form.firstName.trim() ||
  !form.lastName.trim() ||
  !form.email.trim() ||
  !form.address.trim() ||
  !form.city.trim() ||
  !form.state.trim() ||
  !form.postalCode.trim()
) {
  setError('Please fill out all required fields.')
  setLoading(false)
  return
}
  const code = getCode(form.country)
  if (!code) {
    setError('Invalid country selected.')
    setLoading(false)
    return
  }

  const shippingInfo: any = {
    name: `${form.firstName} ${form.lastName}`,
    email: form.email,
    address: {
      line1: form.address,
      city: form.city,
      state: form.state,
      postal_code: form.postalCode,
      country: code,
    },
  }

  if (form.phone.trim()) {
    shippingInfo.phone = form.phone
  }
  if (form.apartment.trim()) {
    shippingInfo.address.line2 = form.apartment
  }

  try {
    // Minimal adjusted items for DB (pending order)
   const adjustedItems = items.map(item => ({
  id: item.id,
  name: item.name,
  image: item.images[0].startsWith('http')
    ? item.images[0]
    : `${process.env.NEXT_PUBLIC_BASE_URL}${item.images[0]}`,
  quantity: item.quantity,
  price: Math.round(getConvertedPrice(item.price, currency)),
  description: item.description || '',
  size: item.size,
}))
    console.log(items)
    // Full items for Stripe Checkout API (with images + name)
    const checkoutItems = items.map(item => ({
      name: item.name,
      images: [
  item.images[0].startsWith('http')
    ? item.images[0]
    : `${process.env.NEXT_PUBLIC_BASE_URL}${item.images[0]}`,
],
      price: Math.round(getConvertedPrice(item.price, currency)),
      quantity: item.quantity,
    }))

    const draftId = uuidv4()

    await addDoc(collection(db, 'pendingOrders'), {
      draftId,
      createdAt: Timestamp.now(),
      currency: currency.code,
      shippingInfo,
      shippingCostCents,
      shippingMethod: shippingMethod.name,
      items: adjustedItems,
      total: grandTotalCents,
    })

    const res = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: checkoutItems,
        currency: currency.code,
        shippingInfo,
        shippingCostCents,
        shippingName: shippingMethod.name,
        draftId,
        appliedPromo, // 👈 add this

      }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Failed to create checkout session.')
      setLoading(false)
      return
    }

    if (data.url) {
      window.location.href = data.url
    } else {
      setError('No checkout URL returned.')
    }
  } catch (error) {
  console.error('Checkout submit error:', error)
  setError('Unexpected error occurred. Please check console.')
  } finally {
    setLoading(false)
  }
}


  return (
    <main className="max-w-5xl mx-auto p-8">
      <div className="flex flex-col md:flex-row gap-12">
        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          className="md:w-1/2 space-y-6 p-8 rounded-lg shadow-md bg-transparent"
          autoComplete="off"
        >
          <h2 className="text-xl font-semibold mb-4">Delivery</h2>

          <CountrySelect form={form} setForm={setForm} />

          {/* FIRST & LAST NAME on the same line */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label htmlFor="firstName" className="block mb-1">
                First Name
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                value={form.firstName}
                onChange={handleChange}
                required
                className="w-full border border-gray-600 rounded px-3 py-2 bg-transparent"
              />
            </div>

            <div className="flex-1">
              <label htmlFor="lastName" className="block mb-1">
                Last Name
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                value={form.lastName}
                onChange={handleChange}
                required
                className="w-full border border-gray-600 rounded px-3 py-2 bg-transparent"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block mb-1">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full border border-gray-600 rounded px-3 py-2 bg-transparent"
  autoComplete="email"

            />
          </div>

          <div>
            <label htmlFor="phone" className="block mb-1">
              Phone Number (optional)
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              className="w-full border border-gray-600 rounded px-3 py-2 bg-transparent"
            />
          </div>

          <div>
            <label htmlFor="address" className="block mb-1">
              Street Address
            </label>
            <input
              id="address"
              name="address"
              type="text"
              value={form.address}
              onChange={handleChange}
              className="w-full border border-gray-600 rounded px-3 py-2 bg-transparent"
            />
          </div>

          <div>
            <label htmlFor="apartment" className="block mb-1">
              Apartment, suite, unit, building, etc. (optional)
            </label>
            <input
              id="apartment"
              name="apartment"
              type="text"
              value={form.apartment}
              onChange={handleChange}
              className="w-full border border-gray-600 rounded px-3 py-2 bg-transparent"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label htmlFor="city" className="block mb-1">
                City
              </label>
              <input
                id="city"
                name="city"
                type="text"
                value={form.city}
                onChange={handleChange}
                className="w-full border border-gray-600 rounded px-3 py-2 bg-transparent"
              />
            </div>

            <div className="flex-1">
              <label htmlFor="province" className="block mb-1">
                Province / State
              </label>
              <input
                id="state"
                name="state"
                type="text"
                value={form.state || ''}
                onChange={handleChange}
                className="w-full border border-gray-600 rounded px-3 py-2 bg-transparent"
              />
            </div>

            <div className="flex-1">
              <label htmlFor="postalCode" className="block mb-1">
                Postal Code / ZIP
              </label>
              <input
                id="postalCode"
                name="postalCode"
                type="text"
                value={form.postalCode}
                onChange={handleChange}
                className="w-full border border-gray-600 rounded px-3 py-2 bg-transparent"
              />
            </div>
          </div>

          {error && <p className="text-red-600 font-semibold">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full text-white py-3 rounded hover:bg-purple-800 transition disabled:opacity-50 cursor-pointer"
            style={{ backgroundColor: '#8819ca' }}
          >
            {loading ? 'Processing...' : 'Proceed to Payment'}
          </button>
        </form>

        {/* ORDER SUMMARY */}
        <section className="md:w-1/2 p-6 rounded-lg shadow-md bg-transparent">
          <ul className="space-y-4 max-w-full overflow-visible">
            {items.map((item: CartItem) => (
              <li key={`${item.id}-${item.size ?? ''}-${item.description ?? ''}`} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src={item.images[0]}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div className="flex flex-col">
                    <span>{item.name} x {item.quantity}</span>
                    {item.size && (
                      <span className="text-sm text-gray-500">{item.size}</span>
                    )}
                    {item.description && (
                      <span className="text-xs text-gray-400">{truncate(item.description, 50)}</span>
                    )}
                  </div>
                </div>
                <span>
                  {currency.symbol}
                  {(getConvertedPrice(item.price, currency) * item.quantity / 100).toFixed(2)}
                </span>
          </li>
        ))}
      </ul>
 {/* Promo Code Section */}
        <div>
  <label htmlFor="promoCode" className="block mb-1"></label>
  {appliedPromo ? (
    <div className="flex items-center gap-3 my-6 text-sm">
      <span className="font-semibold">{appliedPromo}</span>
      <button
        type="button"
        onClick={removePromo}
        className="text-gray-600 hover:underline cursor-pointer"
      >
        Remove
      </button>
    </div>
  ) : (
    <div className="flex gap-2 my-6 text-sm">
      <input
        id="promoCode"
        name="promoCode"
        type="text"
        value={promoCode}
        onChange={handlePromoChange}
        className="flex-grow border border-gray-600 rounded px-3 py-2 bg-transparent"
        placeholder="Promo code"
      />
      <button
        type="button"
        onClick={applyPromo}
        disabled={promoCode.trim() === ''}
        className={`px-4 py-2 rounded text-white transition ${
          promoCode.trim() === ''
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-purple-600 hover:bg-purple-800 cursor-pointer'
        }`}
      >
        Apply
      </button>
    </div>
  )}
  {promoError && (
    <p className="text-gray-600 font-semibold mt-1">{promoError}</p>
  )}
</div>

{error && <p className="text-gray-600 font-semibold">{error}</p>}

      {/* Totals */}
      <div className="mt-6 border-t border-gray-600 pt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>
            {currency.symbol}{(itemsTotalCents / 100).toFixed(2)} 
          </span>
        </div>
{discountCents > 0 && (
  <div className="flex justify-between text-purple-600">
    <span>Discount ({appliedPromo})</span>
    <span>-{currency.symbol}{(discountCents / 100).toFixed(2)}</span>
  </div>
)}
{countrySelected && shippingOptions.length > 1 ? (
  <div className="mb-4">
    <label htmlFor="shipping" className="block mb-1 text-sm font-medium">Shipping Method</label>
    <select
      id="shipping"
      name="shipping"
      value={selectedShipping ?? ''}
      onChange={(e) => setSelectedShipping(e.target.value)}
      className="w-full border border-gray-600 rounded px-3 py-2 bg-transparent"
    >
      {shippingOptions.map((option) => {
  const rawCents = getConvertedPrice(option.cost, currency)
  const roundedCents = Math.round(rawCents / 100) * 100 // e.g., 8040 -> 8000
  return (
    <option key={option.name} value={option.name}>
      {option.name} —{currency.symbol}{(roundedCents / 100).toFixed(2)}
    </option>
  )
})}
    </select>
  </div>
) : (
  countrySelected && (
    <div className="flex justify-between mb-2">
      <div>
        <span className="block">Shipping</span>
        <span className="block text-xs text-gray-400">{shippingMethod.name}</span>
      </div>
      <span>{currency.symbol}{(shippingCostCents / 100)}</span>
    </div>
  )
)}

        <div className="flex justify-between font-bold">
          <span>Total</span>
          <span>
            {currency.symbol}{(grandTotalCents / 100).toFixed(2)} {currency.code} 
          </span>
        </div>
      </div>
      
    </section>
  </div>
</main>
)
}