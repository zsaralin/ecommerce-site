import { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'
import admin from 'firebase-admin'
import { Timestamp } from 'firebase-admin/firestore'
import sendgrid from '@sendgrid/mail'

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

sendgrid.setApiKey(process.env.SENDGRID_API_KEY!)

const db = admin.firestore()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {})
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET as string

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
    const orderItems = draftData?.items || []

    const orderData = {
      ...draftData,
      stripeSessionId: session.id,
      createdAt: Timestamp.now(),
      customer_email: session.customer_email,
      amount_total: session.amount_total,
      currency: session.currency,
      payment_status: session.payment_status,
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

    try {
      await db.collection('orders').doc(session.id).set(orderData)
      await draftRef.delete()

      // Send confirmation email
      const formattedItems = orderItems
        .map(
          (item: any) =>
            `<li>${item.name} (x${item.quantity}) - ${(item.price / 100).toFixed(2)} ${session.currency?.toUpperCase()}</li>`
        )
        .join('')

      const shippingAddress = `
        ${metadata.shipping_name}<br/>
        ${metadata.shipping_address_line1}<br/>
        ${metadata.shipping_address_line2 ? metadata.shipping_address_line2 + '<br/>' : ''}
        ${metadata.shipping_city}, ${metadata.shipping_state} ${metadata.shipping_postal_code}<br/>
        ${metadata.shipping_country}<br/>
        Phone: ${metadata.shipping_phone || 'N/A'}
      `

      await sendgrid.send({
        to: session.customer_email!,
        from: 'coconutbuncases@gmail.com', // Your verified sender
        subject: `Thanks for your order! (#${session.id})`,
        html: `
          <h2>Order Confirmation</h2>
          <p>Hi ${metadata.shipping_name || 'there'},</p>
          <p>Thank you for your purchase. Here are your order details:</p>

          <h3>Items:</h3>
          <ul>${formattedItems}</ul>

          <p><strong>Total Paid:</strong> ${(session.amount_total! / 100).toFixed(2)} ${session.currency?.toUpperCase()}</p>

          <h3>Shipping Address:</h3>
          <p>${shippingAddress}</p>

          <p><strong>Order ID:</strong> ${session.id}</p>
          <p><strong>Status:</strong> ${session.payment_status}</p>

          <br/>
          <p>We’ll notify you once your order is on the way.</p>
          <p>Thanks again!</p>
        `,
      })

      console.log(`Order ${session.id} saved and email sent to ${session.customer_email}`)
    } catch (error) {
      console.error('Error saving order or sending email:', error)
    }
  }

  res.status(200).json({ received: true })
}
