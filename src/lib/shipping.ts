import { getCode } from 'country-list'
import { CartItem } from '@/context/CartContext'

export const SHIPPING_METHODS = {
  trackedCanada: { name: 'Tracked Canada', cost: 600 }, // in cents
  untrackedCanada: { name: 'Untracked Canada', cost: 200 },
  trackedInternational: { name: 'Tracked International', cost: 900 },
}

type ShippingMethod = typeof SHIPPING_METHODS[keyof typeof SHIPPING_METHODS]

export function getShippingOptions(country: string, cartItems: CartItem[]): ShippingMethod[] {
  const code = getCode(country)
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  if (code === 'CA') {
    return itemCount > 1
      ? [SHIPPING_METHODS.trackedCanada]
      : [SHIPPING_METHODS.trackedCanada, SHIPPING_METHODS.untrackedCanada]
  }

  return [SHIPPING_METHODS.trackedInternational]
}
