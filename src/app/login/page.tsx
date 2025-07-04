'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signInWithEmailAndPassword, sendEmailVerification } from 'firebase/auth'
import { auth } from '@/lib/firebase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const router = useRouter()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setInfo('')

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      if (!user.emailVerified) {
        await sendEmailVerification(user)
        setInfo('Your email is not verified. A new verification email has been sent.')
        await auth.signOut()
      } else {
        router.push('/')
      }
    } catch (err: any) {
      switch (err.code) {
        case 'auth/user-not-found':
          setError('No account found with this email.')
          break
        case 'auth/wrong-password':
          setError('Incorrect password. Please try again.')
          break
        case 'auth/invalid-email':
          setError('Invalid email address.')
          break
        case 'auth/user-disabled':
          setError('This user account has been disabled.')
          break
        default:
          setError(err.message || 'Failed to sign in.')
      }
    }
  }

  return (
    <main className="flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-md border border-gray-300 rounded px-6 py-10">
        <h1 className="text-2xl font-semibold mb-6 text-center">Sign In</h1>

        {info && <p className="text-gray-800 text-sm mb-4">{info}</p>}
        {error && <p className="text-gray-800 text-sm mb-4">{error}</p>}

        <form onSubmit={handleSignIn} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border rounded"
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded"
            required
          />

          <button
            type="submit"
            className="w-full bg-[#8819ca] text-white py-2 rounded hover:bg-[#6f14a8] transition cursor-pointer"
          >
            Sign In
          </button>
        </form>
<div className="flex flex-col items-center gap-3 mt-6 text-sm">
  <button
    onClick={() => router.push('/signup')}
    className="text-[#8819ca] hover:underline cursor-pointer"
  >
    Create an account
  </button>

  <button
    onClick={() => router.push('/forgot-password')}
    className="text-gray-700 hover:underline cursor-pointer"
  >
    Forgot password?
  </button>

        </div>
      </div>
    </main>
  )
}
