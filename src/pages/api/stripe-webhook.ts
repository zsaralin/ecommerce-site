import { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'
import admin from 'firebase-admin'
import { Timestamp } from 'firebase-admin/firestore'
import { Resend } from 'resend'
import getRawBody from 'raw-body'

export const config = {
  api: { bodyParser: false },
}
console.log('hi')
if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!projectId || !clientEmail || !privateKey) {
    console.error('Missing Firebase env vars')
    throw new Error('Firebase config is incomplete')
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  })
}

const db = admin.firestore()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {})
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET as string
const resend = new Resend(process.env.RESEND_API_KEY)



export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  let buf: Buffer
  try {
  buf = await getRawBody(req)

  } catch (err) {
    console.error('Error reading raw body:', err)
    return res.status(500).json({ error: 'Error reading request body' })
  }

  const sig = req.headers['stripe-signature'] as string | undefined
  if (!sig) return res.status(400).json({ error: 'Missing Stripe signature' })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(buf, sig, endpointSecret)
  } catch (err: any) {
    console.error('Webhook signature verification failed.', err.message)
    return res.status(400).json({ error: `Webhook Error: ${err.message}` })
  }

  if (event.type === 'checkout.session.completed') {
    const sessionId = (event.data.object as Stripe.Checkout.Session).id

    const session = await stripe.checkout.sessions.retrieve(sessionId)
    const metadata = session.metadata || {}
    const draftId = (metadata.draft_id || '').trim()

    if (!draftId) {
      console.error('No draft ID in metadata.', metadata)
      return res.status(400).end()
    }

    console.log('Looking for draftId in pendingOrders:', draftId)

    const draftQuery = await db
      .collection('pendingOrders')
      .where('draftId', '==', draftId)
      .limit(1)
      .get()

    if (draftQuery.empty) {
      console.error('Draft not found for draftId:', draftId)
      return res.status(404).end()
    }

    const draftSnap = draftQuery.docs[0]
    const draftData = draftSnap.data() || {}

    const currency = (session.currency || 'USD').toUpperCase()
    const customerEmail = session.customer_email || ''
    const items = Array.isArray(draftData.items) ? draftData.items : []
    const shippingCostCents = draftData.shippingCostCents || 0
const orderDoc = await db.collection('orders').doc(session.id).get()
if (!orderDoc.exists) {
    await db.collection('orders').doc(session.id).set({
      ...draftData,
      stripeSessionId: session.id,
      createdAt: Timestamp.now(),
    })} else {
  console.log(`Order ${session.id} already exists, skipping duplicate write.`)
}

    await draftSnap.ref.delete()

    try {
        console.log('Sending confirmation email...')
        const shippingCost = Number(metadata.shipping_cost_cents) || 0;
const totalAmount = Number(session.amount_total) || 0;
await resend.emails.send({
  from: 'Coconut Bun Cases <no-reply@coconutbuncases.com>',
  to: 'customerEmail, coconutbuncases@gmail.com',
  subject: `Order Confirmation`,
  html: `
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto; padding: 20px;">
      <h2 style="color: #8819ca; margin-bottom: 0;">Thank you for your purchase!</h2>
      <p style="margin-top: 4px; font-size: 16px; color: #555;">
        We’re excited to get your order ready. Here’s a quick summary:
      </p>

      <ul style="list-style: none; padding: 0; margin-top: 20px;">
        ${items.map(item => `
          <li style="display: flex; gap: 25px; margin-bottom: 20px; align-items: center;">
            <img 
              src="${item.image}" 
              alt="${item.name}" 
              style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; border: 1px solid #ddd;" 
            />
            <div style="padding-left: 15px;">
              <p style="margin: 0; font-weight: 600; font-size: 16px; color: #222;">
                ${item.name}
              </p>
              ${item.size ? `<p style="margin: 4px 0 0 0; font-size: 14px; color: #666;">Size: ${item.size}</p>` : ''}

              ${item.description ? `<p style="margin: 4px 0 0 0; font-size: 14px; color: #666;">${item.description}</p>` : ''}
              <p style="margin: 6px 0 0 0; font-size: 14px; color: #444;">
                Quantity: ${item.quantity}<br/>
                Price per unit: ${(item.price / 100).toFixed(2)} ${currency}
              </p>
            </div>
          </li>
        `).join('')}
      </ul>

      <p style="font-size: 16px; font-weight: 600; margin-top: 20px;">
        Shipping (Tracked): ${(shippingCostCents / 100).toFixed(2)} ${currency}
      </p>
      <p style="font-size: 18px; font-weight: 700; margin-top: 8px; border-top: 1px solid #ddd; padding-top: 12px;">
        Total: ${((totalAmount  ?? 0) / 100).toFixed(2)} ${currency}
      </p>

      <p style="margin-top: 30px; font-size: 14px; color: #555; line-height: 1.5;">
        Shipping to:<br/>
        ${metadata.shipping_name || ''}<br/>
        ${metadata.shipping_address_line1 || ''}<br/>
        ${metadata.shipping_address_line2 || ''}<br/>
        ${metadata.shipping_city || ''}, ${metadata.shipping_state || ''} ${metadata.shipping_postal_code || ''}<br/>
        ${metadata.shipping_country || ''}
      </p>

      ${metadata.phone ? `<p style="font-size: 14px; color: #666; margin-top: 10px;">Phone: ${metadata.phone}</p>` : ''}

      <p style="font-size: 14px; color: #555; margin-top: 30px;">
        If you have any questions or need assistance, please feel free to reach out through our 
        <a href="https://coconutbuncases.com/contact" target="_blank" style="color: #8819ca; text-decoration: none;">contact page</a>. 
        We’re happy to help!
      </p>

      <p style="font-size: 14px; color: #999; margin-top: 40px;">
        Warm wishes,<br/>
        The Coconut Bun Cases Team
      </p>
    </div>
  `
})



      console.log(`Confirmation email sent to ${customerEmail}`)
    } catch (error) {
      console.error('Error sending email:', error)
    }
  }

  res.status(200).json({ received: true })
}
