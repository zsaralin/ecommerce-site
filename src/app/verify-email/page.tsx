import { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'
import admin from 'firebase-admin'
import { Timestamp } from 'firebase-admin/firestore'
import { Resend } from 'resend'

export const config = {
  api: { bodyParser: false },
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
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
    const session = event.data.object as Stripe.Checkout.Session
    const metadata = session.metadata || {}
    const draftId = metadata.draft_id

    if (!draftId) {
      console.error('No draft ID in metadata.')
      return res.status(400).end()
    }

    const draftRef = db.collection('pendingOrders').doc(draftId)
    const draftSnap = await draftRef.get()

    if (!draftSnap.exists) {
      console.error('Draft not found.')
      return res.status(404).end()
    }

    const draftData = draftSnap.data()

    await db.collection('orders').doc(session.id).set({
      ...draftData,
      stripeSessionId: session.id,
      createdAt: Timestamp.now(),
    })

    await draftRef.delete()

    const orderData = {
      id: session.id,
      customer_email: session.customer_email,
      amount_total: session.amount_total,
      currency: session.currency,
      payment_status: session.payment_status,
      created: new Date(session.created * 1000),
      shipping_name: metadata.shipping_name || '',
      shipping_phone: metadata.shipping_phone || '',
      shipping_address: {
        line1: metadata.shipping_address_line1 || '',
        line2: metadata.shipping_address_line2 || '',
        city: metadata.shipping_city || '',
        state: metadata.shipping_state || '',
        postal_code: metadata.shipping_postal_code || '',
        country: metadata.shipping_country || '',
      },
    }

    // Send confirmation email via Resend
    try {
      await resend.emails.send({
        from: 'coconutbuncases@gmail.com',
        to: session.customer_email!,
        subject: `Order Confirmation - ${session.id}`,
        html: `
          <h2>Thank you for your purchase!</h2>
          <p>Here’s a summary of your order:</p>
          <ul>
            ${(draftData.items || []).map((item: any) => `
              <li>${item.name} - ${item.quantity} × ${(item.price / 100).toFixed(2)} ${session.currency.toUpperCase()}</li>
            `).join('')}
          </ul>
          <p><strong>Total:</strong> ${(session.amount_total! / 100).toFixed(2)} ${session.currency.toUpperCase()}</p>
          <p><strong>Shipping to:</strong><br/>
            ${metadata.shipping_name}<br/>
            ${metadata.shipping_address_line1}<br/>
            ${metadata.shipping_address_line2 || ''}<br/>
            ${metadata.shipping_city}, ${metadata.shipping_state}, ${metadata.shipping_postal_code}<br/>
            ${metadata.shipping_country}
          </p>
          <p>If you have any questions, reply to this email.</p>
        `,
      })
      console.log(`Confirmation email sent to ${session.customer_email}`)
    } catch (error) {
      console.error('Error sending email:', error)
    }
  }

  res.status(200).json({ received: true })
}
