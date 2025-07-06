'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/lib/firebase'

export default function SignupPage() {
  const router = useRouter()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    try {
      await createUserWithEmailAndPassword(auth, email, password)
      router.push('/') // Redirect on success
    } catch (err: any) {
      // Map Firebase error codes to friendly messages
      switch (err.code) {
        case 'auth/email-already-in-use':
          setError('An account with this email already exists.')
          break
        case 'auth/invalid-email':
          setError('Please enter a valid email address.')
          break
        case 'auth/operation-not-allowed':
          setError('Signup is temporarily disabled. Please try again later.')
          break
        case 'auth/weak-password':
          setError('Password is too weak. Please choose a stronger password.')
          break
        default:
          // For any other unexpected errors, show a generic message
          setError('Failed to create account. Please try again.')
          console.error('Signup error:', err)
          break
      }
    }
  }

  return (
    <main className="flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md border border-gray-300 rounded px-6 py-10">
        <h1 className="text-2xl font-semibold mb-6 text-center">Create Account</h1>

        {error && (
          <p className="text-red-600 text-sm mb-4 text-center">{error}</p>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <input
            type="text"
            placeholder="First name"
            value={firstName}
            required
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full px-4 py-2 border rounded"
          />
          <input
            type="text"
            placeholder="Last name"
            value={lastName}
            required
            onChange={(e) => setLastName(e.target.value)}
            className="w-full px-4 py-2 border rounded"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            required
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border rounded"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            required
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded"
          />
          <button
            type="submit"
            className="w-full bg-[#8819ca] text-white py-2 rounded hover:bg-[#6f14a8] transition cursor-pointer"
          >
            Sign Up
          </button>
        </form>

        <p className="mt-6 text-sm text-center text-gray-700">
          Already have an account?{' '}
          <button
            onClick={() => router.push('/login')}
            className="text-[#8819ca] hover:underline cursor-pointer"
          >
            Sign In
          </button>
        </p>
      </div>
    </main>
  )
}
