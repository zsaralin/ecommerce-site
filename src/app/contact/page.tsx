'use client'

import { useState } from 'react'

export default function ContactPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    comment: '',
  })

  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setMessage(null)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.email.trim()) {
      setError('Please provide a valid email address.')
      return
    }

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (res.ok) {
        setMessage('Thanks for reaching out! We’ll be in touch soon.')
        setForm({ name: '', email: '', phone: '', comment: '' })
        setSubmitted(true)
      } else {
        console.error('Server error:', data)
        setError(data?.error || 'Oops! Something went wrong.')
      }
    } catch (err) {
      console.error('Network error:', err)
      setError('Error sending form. Please try again later.')
    }
  }

  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-semibold mb-6">Contact</h1>
      <p className="mb-12 leading-relaxed text-m">
        Before sending in a form, please check our{' '}
        <a href="/faq" className="underline">
          FAQ
        </a>{' '}
        page to see if your question has been answered!
      </p>

      {message && (
        <div className="bg-[#f5edfc] text-[#5b199e] border border-[#d9c0ef] px-4 py-3 rounded mb-6">
          {message}
        </div>
      )}

      {error && (
        <div className="bg-[#fdf2f8] text-[#991b55] border border-[#f5c2d7] px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {!submitted && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={form.name}
            onChange={handleChange}
            className="border border-gray-300 rounded px-4 py-2"
          />
          <input
            type="email"
            name="email"
            placeholder="Email *"
            value={form.email}
            onChange={handleChange}
            className="border border-gray-300 rounded px-4 py-2"
            required
          />
          <input
            type="tel"
            name="phone"
            placeholder="Phone Number"
            value={form.phone}
            onChange={handleChange}
            className="border border-gray-300 rounded px-4 py-2"
          />
          <textarea
            name="comment"
            placeholder="Comment"
            value={form.comment}
            onChange={handleChange}
            rows={4}
            className="border border-gray-300 rounded px-4 py-2 resize-y"
            required
          />
          <button
            type="submit"
            className="bg-[#8819ca] text-white rounded px-6 py-3 font-semibold hover:bg-[#6e148f] transition w-max cursor-pointer"
          >
            Send
          </button>
        </form>
      )}
    </main>
  )
}
