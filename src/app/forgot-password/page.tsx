'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '@/lib/firebase'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    setError('')

    try {
      await sendPasswordResetEmail(auth, email)
      setMessage('Reset link sent! Check your email.')
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email.')
    }
  }

  return (
    <main className="flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-md border border-gray-300 rounded px-6 py-10">
        <h1 className="text-2xl font-semibold mb-6 text-center">Forgot Password</h1>

        {message && <p className="text-gray-800 text-sm mb-4">{message}</p>}
        {error && <p className="text-gray-800 text-sm mb-4">{error}</p>}

        <form onSubmit={handleReset} className="space-y-4">
          <input
            type="email"
            placeholder="Enter your email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border rounded"
              autoComplete="email"

          />

          <button
            type="submit"
            className="bg-[#8819ca] text-white py-2 px-6 rounded hover:bg-[#6f14a8] transition cursor-pointer"
          >
            Send Reset Link
          </button>
        </form>

        <p className="mt-6 text-sm text-center text-gray-700">
          Remembered your password?{' '}
          <span
            onClick={() => router.push('/login')}
            className="text-[#8819ca] hover:underline cursor-pointer"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') router.push('/login')
            }}
          >
            Back to Sign In
          </span>
        </p>
      </div>
    </main>
  )
}
