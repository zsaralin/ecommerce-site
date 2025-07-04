import type { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { items, currency, shippingInfo, shippingCostCents, shippingName, draftId } = req.body

  if (!items || !Array.isArray(items)) {
    return res.status(400).json({ error: 'Invalid items in request.' })
  }
  if (
    !shippingInfo ||
    !shippingInfo.email
  ) {
    return res.status(400).json({ error: 'Missing shipping information.' })
  }
  if (
    typeof shippingCostCents !== 'number' ||
    !shippingName ||
    typeof shippingName !== 'string'
  ) {
    return res.status(400).json({ error: 'Missing or invalid shipping cost or name.' })
  }

  try {
    // Build line items for Stripe Checkout (products + shipping as a separate item)
    const line_items = [
      ...items.map((item: any) => ({
        price_data: {
          currency: currency.toLowerCase(),
          product_data: {
            name: item.name,
            images: [
              item.image.startsWith('http')
                ? item.image
                : `${process.env.NEXT_PUBLIC_BASE_URL}${item.image}`,
            ],
          },
          unit_amount: item.price,
        },
        quantity: item.quantity,
      })),
      {
        price_data: {
          currency: currency.toLowerCase(),
          product_data: {
            name: shippingName,
          },
          unit_amount: shippingCostCents,
        },
        quantity: 1,
      },
    ]

    // Create Stripe Checkout session without shipping info
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items,
      customer_email: shippingInfo.email ,  // just email for receipt
        success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/`,
      metadata: {
          draft_id: draftId,

        shipping_name: shippingInfo.name,
        shipping_phone: shippingInfo.phone || '',
        shipping_address_line1: shippingInfo.address.line1,
        shipping_address_line2: shippingInfo.address.line2 || '',
        shipping_city: shippingInfo.address.city,
        shipping_state: shippingInfo.address.state || '',
        shipping_postal_code: shippingInfo.address.postal_code,
        shipping_country: shippingInfo.address.country,
    },
    })

    return res.status(200).json({ url: session.url })
  } catch (error: any) {
    console.error('Stripe Checkout Error:', error)
    return res.status(500).json({ error: 'Failed to create Stripe checkout session' })
  }
}
