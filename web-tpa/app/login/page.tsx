'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'

export default function TPALoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

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

        // Only allow TPA_ADMIN and TPA_USER roles
        if (data.role === 'TPA_ADMIN' || data.role === 'TPA_USER') {
          router.push('/')
        } else {
          setError('Access denied. This portal is for TPA users only.')
          // Clear session
          await apiFetch('/api/auth/logout', { method: 'POST' })
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
      <div className="w-full lg:w-1/2 flex flex-col bg-gray-50">
        {/* Blue Header Strip with Logo */}
        <div style={{ backgroundColor: '#1E4A8D' }} className="w-full py-4 px-6">
          <img
            src="/tpa/logos/habit-logo-white.png"
            alt="Habit Health - TPA Portal"
            className="h-12 w-auto"
            onError={(e) => {
              // Fallback if image doesn't exist
              e.currentTarget.style.display = 'none'
            }}
          />
        </div>

        {/* Form Content - Centered */}
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            {/* Form Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                TPA Portal
              </h1>
              <p className="text-gray-600">
                Sign in to access claims management
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
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 transition-colors"
                style={{ borderColor: '#d1d5db' }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#1E4A8D';
                  e.target.style.boxShadow = '0 0 0 3px rgba(30, 74, 141, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#d1d5db';
                  e.target.style.boxShadow = 'none';
                }}
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
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 transition-colors pr-12"
                  style={{ borderColor: '#d1d5db' }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#1E4A8D';
                    e.target.style.boxShadow = '0 0 0 3px rgba(30, 74, 141, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showPassword ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    )}
                  </svg>
                </button>
              </div>
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
              className="w-full py-3 px-4 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#1E4A8D' }}
              onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#2563A8')}
              onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#1E4A8D')}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          </div>
        </div>
      </div>

      {/* Right Section - Gradient Background */}
      <div className="hidden lg:block lg:w-1/2" style={{ background: 'linear-gradient(to bottom right, #1E4A8D, #2563A8, #1E4A8D)' }}>
        <div className="h-full flex items-center justify-center py-8 px-10">
          <div className="text-white max-w-lg w-full">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold mb-4" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
                TPA Claims Management
              </h2>
              <p className="text-lg text-white/90">
                Efficient claims processing and analytics platform
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl backdrop-blur-lg border border-white/30" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                <h3 className="text-white font-bold text-lg mb-2">Claims Processing</h3>
                <p className="text-white/90 text-sm">Review and process insurance claims efficiently</p>
              </div>

              <div className="p-4 rounded-xl backdrop-blur-lg border border-white/30" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                <h3 className="text-white font-bold text-lg mb-2">Analytics & Reports</h3>
                <p className="text-white/90 text-sm">Track claim metrics and generate insights</p>
              </div>

              <div className="p-4 rounded-xl backdrop-blur-lg border border-white/30" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                <h3 className="text-white font-bold text-lg mb-2">User Management</h3>
                <p className="text-white/90 text-sm">Manage TPA team members and permissions</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
