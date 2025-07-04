// app/api/contact/route.ts
import { Resend } from 'resend'

export const dynamic = 'force-dynamic' // optional, disables cache

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  const body = await req.json()
  const { name, email, phone, comment } = body

  try {
    const data = await resend.emails.send({
      from: 'Your Website <contact@yourdomain.com>', // must be verified sender
      to: 'youremail@example.com',
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

    return Response.json({ success: true })
  } catch (err) {
    return Response.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
