import { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'
import admin from 'firebase-admin'
import { Timestamp } from 'firebase-admin/firestore'
import { Resend } from 'resend'

export const config = {
  api: { bodyParser: false },
}

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

const getRawBody = (req: NextApiRequest): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', (err) => reject(err))
  })
}

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
await resend.emails.send({
  from: 'info@coconutbuncases.com',
  to: customerEmail,
  subject: 'Order Confirmation',
  html: `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee;">
      <h2 style="color: #8819ca;">Thank you for your order!</h2>
      <p>Here’s a summary of your purchase:</p>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr>
            <th align="left">Item</th>
            <th align="center">Qty</th>
            <th align="right">Price</th>
          </tr>
        </thead>
        <tbody>
          ${items
            .map(
              (item: any) => `
              <tr style="border-bottom: 1px solid #ddd; padding: 10px 0;">
                <td style="padding: 10px 0;">
                  <div style="display: flex; align-items: center; gap: 12px;">
                    <img src="${item.image}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;" />
                    <div>
                      <div style="font-weight: bold;">${item.name}</div>
                      ${item.description ? `<div style="font-size: 12px; color: #555;">${item.description}</div>` : ''}
                      ${item.size ? `<div style="font-size: 12px; color: #555;">Size: ${item.size}</div>` : ''}
                    </div>
                  </div>
                </td>
                <td align="center">${item.quantity}</td>
                <td align="right">${(item.price / 100).toFixed(2)} ${currency}</td>
              </tr>`
            )
            .join('')}
        </tbody>
      </table>

      <p style="margin-top: 24px;"><strong>Total:</strong> ${(session.amount_total! / 100).toFixed(2)} ${currency}</p>

      <p><strong>Shipping to:</strong><br/>
        ${metadata.shipping_name}<br/>
        ${metadata.shipping_address_line1}<br/>
        ${metadata.shipping_address_line2 || ''}<br/>
        ${metadata.shipping_city}, ${metadata.shipping_state} ${metadata.shipping_postal_code}<br/>
        ${metadata.shipping_country}
      </p>

      <p style="font-size: 12px; color: #888;">If you have any questions, feel free to reply to this email.</p>
    </div>
  `,
})


      console.log(`Confirmation email sent to ${customerEmail}`)
    } catch (error) {
      console.error('Error sending email:', error)
    }
  }

  res.status(200).json({ received: true })
}
