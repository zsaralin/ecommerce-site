import type { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { items, currency, shippingInfo, shippingCostCents, shippingName, draftId, appliedPromo } = req.body
  
  // Basic validation
  if (!items || !Array.isArray(items)) {
    return res.status(400).json({ error: 'Invalid items in request.' })
  }
  if (!shippingInfo || !shippingInfo.email) {
    return res.status(400).json({ error: 'Missing shipping information.' })
  }
  if (typeof shippingCostCents !== 'number' || !shippingName || typeof shippingName !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid shipping cost or name.' })
  }

  try {
    // Debug logging - check line items before creating session
    console.log('Creating Stripe checkout session with items:', items)
    console.log('Shipping:', shippingName, shippingCostCents)
items.forEach((item: any, i: number) => {
  console.log(`Item ${i} image:`, item.image);
});    // Build line items for Stripe Checkout — products + shipping as a separate line item
   const line_items = [
  ...items.map((item: any) => {
    const productData: any = { name: item.name }
    if (item.image) {
      productData.images = [item.image]
    }

    return {
      price_data: {
        currency: currency.toLowerCase(),
        product_data: productData,
        unit_amount: item.price,
      },
      quantity: item.quantity,
    }
  }),
]
let promotionCodeId = null
if (appliedPromo && typeof appliedPromo === 'string') {
  console.log(appliedPromo , 'appied promo ')

  const promotionCodes = await stripe.promotionCodes.list({
    code: appliedPromo,
    active: true,
    limit: 1, // assume only one matching promo code
  })
  console.log(promotionCodes)

  if (promotionCodes.data.length > 0) {
    promotionCodeId = promotionCodes.data[0].id
  } else {
    console.warn('No valid promotion code found for:', appliedPromo)
  }
}
let discounts = []
if (promotionCodeId) {
  discounts.push({ promotion_code: promotionCodeId })
}
console.log('draft' , draftId)
    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items,
      customer_email: shippingInfo.email, // customer email for receipt
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/`,
      discounts : discounts,
      shipping_options: [
    {
      shipping_rate_data: {
        type: 'fixed_amount',
        fixed_amount: {
          amount: shippingCostCents,
          currency: currency.toLowerCase(),
        },
        display_name: shippingName,
      },
    },
  ],
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
