'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signInWithEmailAndPassword, onAuthStateChanged, User } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useCart } from '@/context/CartContext' // ✅ update to your actual path

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const { totalItems } = useCart() // triggers rerender when cart is ready

  const [signedIn, setSignedIn] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await signInWithEmailAndPassword(auth, email, password)
      setSignedIn(true) // flag to wait for cart sync
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

  useEffect(() => {
    // Wait for auth to be ready, user to be logged in, and cart to sync before redirecting
    if (signedIn && user && !loading) {
      router.push('/')
    }
  }, [signedIn, user, loading, totalItems])

  return (
    <main className="flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-md border border-gray-300 rounded px-6 py-10">
        <h1 className="text-2xl font-semibold mb-6 text-center">Sign In</h1>

        {error && <p className="text-sm mb-4 text-center">{error}</p>}

        <form onSubmit={handleSignIn} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border rounded"
            required
            autoComplete="email"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded"
            required
            autoComplete="current-password"
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
