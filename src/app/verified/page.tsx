'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { applyActionCode, onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'

export default function VerifyPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')

  useEffect(() => {
    const oobCode = searchParams?.get('oobCode') ?? ''
    const mode = searchParams?.get('mode') ?? ''

    if (mode === 'verifyEmail' && oobCode) {
      applyActionCode(auth, oobCode)
        .then(() => {
          onAuthStateChanged(auth, (user) => {
            if (user && user.emailVerified) {
              setStatus('success')
              setTimeout(() => router.push('/'), 2000)
            } else {
              setStatus('error')
            }
          })
        })
        .catch(() => {
          setStatus('error')
        })
    } else {
      setStatus('error')
    }
  }, [searchParams, router])

  return (
    <main className="flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center rounded border border-gray-300 px-6 py-10">
        {status === 'verifying' && (
          <p className="text-gray-800 text-lg">Verifying your email...</p>
        )}
        {status === 'success' && (
          <p className="text-[#8819ca] font-medium text-lg">Email verified! Redirecting...</p>
        )}
        {status === 'error' && (
          <p className="text-gray-800 text-lg">
            Invalid or expired verification link.
          </p>
        )}
      </div>
    </main>
  )
}
