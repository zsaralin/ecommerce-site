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

const testSnap = await admin.firestore().collection('pendingOrders').limit(1).get()
console.log('Test Firestore read docs:', testSnap.docs.length)
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

  // Re-fetch the session to ensure metadata is present
  const session = await stripe.checkout.sessions.retrieve(sessionId)

  console.log('Retrieved session with metadata:', session.metadata)

  const metadata = session.metadata || {}
  const draftId = metadata.draft_id

  if (!draftId) {
    console.error('No draft ID in metadata.', metadata)
    return res.status(400).end()
  }


  const draftRef = db.collection('pendingOrders').doc(draftId)
  const draftSnap = await draftRef.get()

  if (!draftSnap.exists) {
    console.error('Draft not found.')
    return res.status(404).end()
  }

  const draftData = draftSnap.data() || {}

  // Set default currency if missing
  const currency = (session.currency || 'USD').toUpperCase()

  // Safely get email or fallback
  const customerEmail = session.customer_email || ''

  // Safe check for items, ensure it's an array
  const items = Array.isArray(draftData.items) ? draftData.items : []

  await db.collection('orders').doc(session.id).set({
    ...draftData,
    stripeSessionId: session.id,
    createdAt: Timestamp.now(),
  })

  await draftRef.delete()

  const orderData = {
    id: session.id,
    customer_email: customerEmail,
    amount_total: session.amount_total ?? 0,
    currency,
    payment_status: session.payment_status || '',
    created: new Date((session.created || 0) * 1000),
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
      to: customerEmail,
      subject: `Order Confirmation - ${session.id}`,
      html: `
        <h2>Thank you for your purchase!</h2>
        <p>Here’s a summary of your order:</p>
        <ul>
          ${items
            .map(
              (item: any) =>
                `<li>${item.name} - ${item.quantity} × ${(item.price / 100).toFixed(2)} ${currency}</li>`
            )
            .join('')}
        </ul>
<p><strong>Total:</strong> ${((session.amount_total ?? 0) / 100).toFixed(2)} ${currency}</p>
        <p><strong>Shipping to:</strong><br/>
          ${metadata.shipping_name || ''}<br/>
          ${metadata.shipping_address_line1 || ''}<br/>
          ${metadata.shipping_address_line2 || ''}<br/>
          ${metadata.shipping_city || ''}, ${metadata.shipping_state || ''}, ${metadata.shipping_postal_code || ''}<br/>
          ${metadata.shipping_country || ''}
        </p>
        <p>If you have any questions, reply to this email.</p>
      `,
    })
    console.log(`Confirmation email sent to ${customerEmail}`)
  } catch (error) {
    console.error('Error sending email:', error)
  }
}

  res.status(200).json({ received: true })
}
