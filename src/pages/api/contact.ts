// pages/api/contact.ts
import { Resend } from 'resend'
import type { NextApiRequest, NextApiResponse } from 'next'

const resend = new Resend(process.env.RESEND_API_KEY)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed')
  }

  const { name, email, phone, comment } = req.body

  try {
    await resend.emails.send({
      from: 'Coconut Bun Cases <contact@coconutbuncases.com>',
      to: 'coconutbuncases@gmail.com',
      subject: `New message from ${name}`,
      replyTo: email,
      html: `
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || '-'}</p>
        <p><strong>Message:</strong></p>
        <p>${comment}</p>
      `,
    })

    res.status(200).json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to send message' })
  }
}
