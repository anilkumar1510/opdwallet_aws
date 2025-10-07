'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { loginDoctor } from '@/lib/api/auth'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    console.log('=== DOCTOR LOGIN DEBUG START ===')
    console.log('[LoginPage] Form submitted at:', new Date().toISOString())
    console.log('[LoginPage] Email:', email)
    console.log('[LoginPage] Password length:', password.length)
    console.log('[LoginPage] API URL:', process.env.NEXT_PUBLIC_API_URL || 'NOT SET')

    try {
      console.log('[LoginPage] Calling loginDoctor...')
      const result = await loginDoctor({ email, password })
      console.log('[LoginPage] Login successful:', result)
      console.log('[LoginPage] Redirecting to /doctorview')
      router.push('/doctorview')
    } catch (err: any) {
      console.error('[LoginPage] Login failed with error:', err)
      console.error('[LoginPage] Error message:', err.message)
      console.error('[LoginPage] Error stack:', err.stack)
      console.error('[LoginPage] Full error object:', JSON.stringify(err, Object.getOwnPropertyNames(err)))
      setError(err.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
      console.log('=== DOCTOR LOGIN DEBUG END ===')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-brand-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="h-16 w-16 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 flex items-center justify-center">
            <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
          Doctor Portal
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Sign in to access your dashboard
        </p>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input-field"
              placeholder="doctor@example.com"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="input-field"
              placeholder="Enter your password"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3 text-base"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-500">
          OPD Wallet Doctor Portal v1.0
        </div>
      </div>
    </div>
  )
}
