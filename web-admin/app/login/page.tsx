'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const fillSuperAdminCredentials = () => {
    setEmail('admin@opdwallet.com')
    setPassword('Admin@123')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })

      if (response.ok) {
        const data = await response.json()
        // Store token in cookie is handled by the API
        // Redirect based on role
        // Note: For admin portal with basePath='/admin', use '/' which resolves to '/admin'
        if (data.role === 'SUPER_ADMIN' || data.role === 'ADMIN') {
          router.push('/')
        } else if (data.role === 'TPA_ADMIN' || data.role === 'TPA_USER') {
          router.push('/tpa')
        } else if (data.role === 'FINANCE_USER') {
          router.push('/finance')
        } else if (data.role === 'OPS') {
          router.push('/operations')
        } else {
          router.push('/')
        }
      } else {
        const errorData = await response.json().catch(() => null)
        setError(errorData?.message || 'Invalid email or password')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
      console.error('Login error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Section - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gray-50 px-6 py-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-8">
            <div className="w-24 h-10 bg-gray-200 rounded-lg flex items-center justify-center text-gray-600 font-semibold">
              OPD Wallet
            </div>
          </div>

          {/* Form Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome Back
            </h1>
            <p className="text-gray-600">
              Sign in to access your admin dashboard
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-100 transition-colors"
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-100 transition-colors pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {showPassword ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    )}
                  </svg>
                </button>
              </div>
            </div>

            {/* Super Admin Quick Fill */}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={fillSuperAdminCredentials}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Quick Fill Admin
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            {/* Links */}
            <div className="space-y-4 pt-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Don&apos;t have an account?{' '}
                  <a href="#" className="font-semibold text-gray-900 hover:underline">
                    Contact Admin
                  </a>
                </p>
              </div>

              <div className="text-center">
                <a href="#" className="text-xs text-gray-500 hover:underline">
                  Terms & Conditions
                </a>
              </div>
            </div>

            {/* Demo Credentials */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-900 font-medium">Demo Credentials:</p>
              <p className="text-sm text-blue-700 mt-1">
                Email: admin@opdwallet.com<br />
                Password: Admin@123
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* Right Section - Gradient Background */}
      <div className="hidden lg:block lg:w-1/2 bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-400">
        <div className="h-full flex items-center justify-center p-12">
          <div className="text-white max-w-md">
            <h2 className="text-4xl font-bold mb-6">OPD Wallet Platform</h2>
            <p className="text-xl mb-8 text-yellow-50">
              Comprehensive healthcare benefits management system for seamless outpatient services.
            </p>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <svg className="w-6 h-6 text-yellow-200 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-yellow-50">Manage insurance policies and member benefits</p>
              </div>
              <div className="flex items-start space-x-3">
                <svg className="w-6 h-6 text-yellow-200 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-yellow-50">Process claims and track healthcare services</p>
              </div>
              <div className="flex items-start space-x-3">
                <svg className="w-6 h-6 text-yellow-200 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-yellow-50">Real-time analytics and reporting</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
